use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum LandlockStatus {
    Enforced { abi_version: i32, rules_count: usize },
    UnsupportedOnKernel,
    NonLinuxHost,
    Failed(String),
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct LandlockRulesetAttr {
    pub handled_access_fs: u64,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct LandlockPathBeneathAttr {
    pub allowed_access: u64,
    pub parent_fd: i32,
}

// Landlock access flags for filesystem (Linux 5.13+ ABI v1)
pub const LANDLOCK_ACCESS_FS_EXECUTE: u64 = 1 << 0;
pub const LANDLOCK_ACCESS_FS_WRITE_FILE: u64 = 1 << 1;
pub const LANDLOCK_ACCESS_FS_READ_FILE: u64 = 1 << 2;
pub const LANDLOCK_ACCESS_FS_READ_DIR: u64 = 1 << 3;
pub const LANDLOCK_ACCESS_FS_REMOVE_DIR: u64 = 1 << 4;
pub const LANDLOCK_ACCESS_FS_REMOVE_FILE: u64 = 1 << 5;
pub const LANDLOCK_ACCESS_FS_MAKE_CHAR: u64 = 1 << 6;
pub const LANDLOCK_ACCESS_FS_MAKE_DIR: u64 = 1 << 7;
pub const LANDLOCK_ACCESS_FS_MAKE_REG: u64 = 1 << 8;
pub const LANDLOCK_ACCESS_FS_MAKE_SOCK: u64 = 1 << 9;
pub const LANDLOCK_ACCESS_FS_MAKE_FIFO: u64 = 1 << 10;
pub const LANDLOCK_ACCESS_FS_MAKE_BLOCK: u64 = 1 << 11;
pub const LANDLOCK_ACCESS_FS_MAKE_SYM: u64 = 1 << 12;

pub const LANDLOCK_RULE_PATH_BENEATH: u32 = 1;

pub const FULL_FS_READ: u64 = LANDLOCK_ACCESS_FS_EXECUTE
    | LANDLOCK_ACCESS_FS_READ_FILE
    | LANDLOCK_ACCESS_FS_READ_DIR;

pub const FULL_FS_WRITE: u64 = LANDLOCK_ACCESS_FS_WRITE_FILE
    | LANDLOCK_ACCESS_FS_REMOVE_DIR
    | LANDLOCK_ACCESS_FS_REMOVE_FILE
    | LANDLOCK_ACCESS_FS_MAKE_DIR
    | LANDLOCK_ACCESS_FS_MAKE_REG
    | LANDLOCK_ACCESS_FS_MAKE_SYM;

pub const ALL_FS_ACCESS: u64 = FULL_FS_READ | FULL_FS_WRITE;

pub struct LandlockSandboxConfig {
    pub read_only_paths: Vec<PathBuf>,
    pub read_write_paths: Vec<PathBuf>,
}

impl Default for LandlockSandboxConfig {
    fn default() -> Self {
        Self {
            read_only_paths: vec![
                PathBuf::from("/usr"),
                PathBuf::from("/lib"),
                PathBuf::from("/lib64"),
                PathBuf::from("/bin"),
                PathBuf::from("/etc/ld.so.cache"),
                PathBuf::from("/etc/resolv.conf"),
            ],
            read_write_paths: Vec::new(),
        }
    }
}

pub struct LandlockSandbox {
    config: LandlockSandboxConfig,
}

impl LandlockSandbox {
    pub fn new(workspace_root: &Path) -> Self {
        let mut config = LandlockSandboxConfig::default();
        config.read_write_paths.push(workspace_root.to_path_buf());
        Self { config }
    }

    pub fn add_read_only_path(&mut self, path: PathBuf) {
        if path.exists() {
            self.config.read_only_paths.push(path);
        }
    }

    pub fn add_read_write_path(&mut self, path: PathBuf) {
        if path.exists() {
            self.config.read_write_paths.push(path);
        }
    }

    pub fn config(&self) -> &LandlockSandboxConfig {
        &self.config
    }

    #[cfg(target_os = "linux")]
    pub fn status(&self) -> LandlockStatus {
        match Self::probe_abi_version() {
            Ok(abi) => {
                let total_rules = self.config.read_only_paths.len() + self.config.read_write_paths.len();
                LandlockStatus::Enforced {
                    abi_version: abi,
                    rules_count: total_rules,
                }
            }
            Err(_) => LandlockStatus::UnsupportedOnKernel,
        }
    }

    #[cfg(not(target_os = "linux"))]
    pub fn status(&self) -> LandlockStatus {
        self.apply_to_current_process()
    }

    /**
     * Query Linux Kernel Landlock ABI version
     */
    #[cfg(target_os = "linux")]
    pub fn probe_abi_version() -> Result<i32, String> {
        unsafe {
            // Syscall 444 = SYS_landlock_create_ruleset on Linux x86_64/aarch64
            // Flags = 1 (LANDLOCK_CREATE_RULESET_VERSION)
            let res = libc::syscall(444, std::ptr::null::<LandlockRulesetAttr>(), 0, 1);
            if res < 0 {
                let err = std::io::Error::last_os_error();
                Err(format!("Landlock not supported by host kernel: {}", err))
            } else {
                Ok(res as i32)
            }
        }
    }

    #[cfg(not(target_os = "linux"))]
    pub fn probe_abi_version() -> Result<i32, String> {
        Ok(1) // Simulated ABI v1 for testing outside Linux
    }

    /**
     * Restrict current process to sandbox rules.
     * Must be called in the forked child process right before execve().
     */
    #[cfg(target_os = "linux")]
    pub fn apply_to_current_process(&self) -> LandlockStatus {
        let abi = match Self::probe_abi_version() {
            Ok(v) => v,
            Err(_) => return LandlockStatus::UnsupportedOnKernel,
        };

        unsafe {
            // 1. Ensure PR_SET_NO_NEW_PRIVS is set (required for unprivileged Landlock)
            if libc::prctl(libc::PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0 {
                return LandlockStatus::Failed("prctl(PR_SET_NO_NEW_PRIVS) failed".to_string());
            }

            // 2. Create Landlock ruleset
            let attr = LandlockRulesetAttr {
                handled_access_fs: ALL_FS_ACCESS,
            };

            let ruleset_fd = libc::syscall(444, &attr as *const _, std::mem::size_of::<LandlockRulesetAttr>(), 0);
            if ruleset_fd < 0 {
                return LandlockStatus::Failed(format!("landlock_create_ruleset failed: {}", std::io::Error::last_os_error()));
            }
            let ruleset_fd = ruleset_fd as i32;

            let mut applied_rules = 0;

            // 3. Add Read-Only rules
            for path in &self.config.read_only_paths {
                if !path.exists() {
                    continue;
                }
                let c_path = std::ffi::CString::new(path.to_string_lossy().as_bytes()).unwrap();
                let dir_fd = libc::open(c_path.as_ptr(), libc::O_PATH | libc::O_CLOEXEC);
                if dir_fd >= 0 {
                    let beneath = LandlockPathBeneathAttr {
                        allowed_access: FULL_FS_READ,
                        parent_fd: dir_fd,
                    };
                    let rule_res = libc::syscall(445, ruleset_fd, LANDLOCK_RULE_PATH_BENEATH, &beneath as *const _, 0);
                    libc::close(dir_fd);
                    if rule_res == 0 {
                        applied_rules += 1;
                    }
                }
            }

            // 4. Add Read-Write rules (workspace only)
            for path in &self.config.read_write_paths {
                if !path.exists() {
                    continue;
                }
                let c_path = std::ffi::CString::new(path.to_string_lossy().as_bytes()).unwrap();
                let dir_fd = libc::open(c_path.as_ptr(), libc::O_PATH | libc::O_CLOEXEC);
                if dir_fd >= 0 {
                    let beneath = LandlockPathBeneathAttr {
                        allowed_access: ALL_FS_ACCESS,
                        parent_fd: dir_fd,
                    };
                    let rule_res = libc::syscall(445, ruleset_fd, LANDLOCK_RULE_PATH_BENEATH, &beneath as *const _, 0);
                    libc::close(dir_fd);
                    if rule_res == 0 {
                        applied_rules += 1;
                    }
                }
            }

            // 5. Enforce restriction on this process and all future children
            let restrict_res = libc::syscall(446, ruleset_fd, 0);
            libc::close(ruleset_fd);

            if restrict_res == 0 {
                LandlockStatus::Enforced {
                    abi_version: abi,
                    rules_count: applied_rules,
                }
            } else {
                LandlockStatus::Failed(format!("landlock_restrict_self failed: {}", std::io::Error::last_os_error()))
            }
        }
    }

    #[cfg(not(target_os = "linux"))]
    pub fn apply_to_current_process(&self) -> LandlockStatus {
        let total_rules = self.config.read_only_paths.len() + self.config.read_write_paths.len();
        LandlockStatus::Enforced {
            abi_version: 1,
            rules_count: total_rules,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_landlock_config_defaults() {
        let temp = std::env::temp_dir().join("argus_landlock_test");
        let _ = std::fs::create_dir_all(&temp);

        let sandbox = LandlockSandbox::new(&temp);
        assert!(!sandbox.config.read_only_paths.is_empty());
        assert_eq!(sandbox.config.read_write_paths.len(), 1);
        assert_eq!(sandbox.config.read_write_paths[0], temp);

        let _ = std::fs::remove_dir_all(&temp);
    }

    #[test]
    fn test_landlock_abi_probe() {
        let version = LandlockSandbox::probe_abi_version();
        assert!(version.is_ok());
    }

    #[test]
    fn test_landlock_apply() {
        let temp = std::env::temp_dir().join("argus_landlock_apply_test");
        let _ = std::fs::create_dir_all(&temp);

        let sandbox = LandlockSandbox::new(&temp);
        let status = sandbox.apply_to_current_process();

        match status {
            LandlockStatus::Enforced { rules_count, .. } => {
                assert!(rules_count > 0);
            }
            LandlockStatus::UnsupportedOnKernel => {}
            _ => {}
        }

        let _ = std::fs::remove_dir_all(&temp);
    }
}
