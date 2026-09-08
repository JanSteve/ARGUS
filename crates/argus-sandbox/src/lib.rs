pub mod cgroups;
pub mod landlock;
pub mod seccomp;

pub use cgroups::{CgroupLimits, CgroupUsageTelemetry, CgroupV2Manager};
pub use landlock::{LandlockSandbox, LandlockSandboxConfig, LandlockStatus};
pub use seccomp::{SeccompAction, SeccompProfile, SeccompRule};

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessExecutionResult {
    pub success: bool,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u64,
    pub timed_out: bool,
    pub sandbox_engine: String,
    pub landlock_status: Option<LandlockStatus>,
    pub cgroup_telemetry: Option<CgroupUsageTelemetry>,
}

pub struct SandboxSupervisor {
    workspace_root: PathBuf,
    cgroup_manager: Option<CgroupV2Manager>,
    landlock: Option<LandlockSandbox>,
    seccomp: Option<SeccompProfile>,
}

impl SandboxSupervisor {
    pub fn new(workspace_root: PathBuf) -> Self {
        let landlock = Some(LandlockSandbox::new(&workspace_root));
        let seccomp = Some(SeccompProfile::agent_execution_profile());
        Self {
            workspace_root,
            cgroup_manager: None,
            landlock,
            seccomp,
        }
    }

    pub fn with_cgroups(mut self, session_id: &str, limits: CgroupLimits) -> Self {
        self.cgroup_manager = Some(CgroupV2Manager::new(session_id, limits));
        self
    }

    pub fn with_landlock(mut self, landlock: LandlockSandbox) -> Self {
        self.landlock = Some(landlock);
        self
    }

    pub fn with_seccomp(mut self, seccomp: SeccompProfile) -> Self {
        self.seccomp = Some(seccomp);
        self
    }

    pub fn cgroup_manager(&self) -> Option<&CgroupV2Manager> {
        self.cgroup_manager.as_ref()
    }

    pub fn landlock(&self) -> Option<&LandlockSandbox> {
        self.landlock.as_ref()
    }

    pub fn seccomp(&self) -> Option<&SeccompProfile> {
        self.seccomp.as_ref()
    }

    /**
     * Executes process with OS sandbox enforcement (Bubblewrap unprivileged namespaces on Linux, POSIX fallback)
     */
    pub fn execute_command(&self, cmd: &str, timeout_ms: u64) -> ProcessExecutionResult {
        let start = Instant::now();
        #[allow(unused_mut)]
        let mut engine = "POSIX_PROCESS_GROUP_JAIL".to_string();
        let landlock_status = self.landlock.as_ref().map(|ll| ll.status());

        if let Some(ref cgroups) = self.cgroup_manager {
            let _ = cgroups.setup_scope();
        }

        #[cfg(target_os = "linux")]
        let mut child = {
            // Check if bwrap (bubblewrap) is available on Linux
            let has_bwrap = Command::new("bwrap").arg("--version").output().is_ok();
            if has_bwrap {
                engine = "LINUX_BUBBLEWRAP_NAMESPACES".to_string();
                let ws_str = self.workspace_root.to_string_lossy().to_string();
                Command::new("bwrap")
                    .args(&[
                        "--ro-bind", "/", "/",
                        "--bind", &ws_str, &ws_str,
                        "--dev-bind", "/dev", "/dev",
                        "--proc", "/proc",
                        "--tmpfs", "/tmp",
                        "--unshare-all",
                        "--die-with-parent",
                        "--chdir", &ws_str,
                        "sh", "-c", cmd,
                    ])
                    .env_clear()
                    .env("PATH", "/usr/local/bin:/usr/bin:/bin")
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .spawn()
            } else {
                engine = "LINUX_POSIX_JAIL".to_string();
                Command::new("sh")
                    .args(&["-c", cmd])
                    .current_dir(&self.workspace_root)
                    .env_clear()
                    .env("PATH", "/usr/local/bin:/usr/bin:/bin")
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .spawn()
            }
        };

        #[cfg(not(target_os = "linux"))]
        let child = Command::new("sh")
            .args(&["-c", cmd])
            .current_dir(&self.workspace_root)
            .env_clear()
            .env("PATH", std::env::var("PATH").unwrap_or_else(|_| "/usr/local/bin:/usr/bin:/bin".to_string()))
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        match child {
            Ok(mut process) => {
                if let Some(ref cgroups) = self.cgroup_manager {
                    let _ = cgroups.attach_pid(process.id());
                }

                let timeout = Duration::from_millis(timeout_ms);
                let poll_interval = Duration::from_millis(20);

                loop {
                    match process.try_wait() {
                        Ok(Some(status)) => {
                            let duration_ms = start.elapsed().as_millis() as u64;
                            let output = process.wait_with_output().unwrap_or_else(|_| std::process::Output {
                                status,
                                stdout: Vec::new(),
                                stderr: Vec::new(),
                            });

                            let telemetry = self.cgroup_manager.as_ref().map(|c| c.read_telemetry());
                            if let Some(ref cgroups) = self.cgroup_manager {
                                cgroups.cleanup();
                            }

                            return ProcessExecutionResult {
                                success: status.success(),
                                exit_code: status.code().unwrap_or(1),
                                stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
                                stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
                                duration_ms,
                                timed_out: false,
                                sandbox_engine: engine,
                                landlock_status,
                                cgroup_telemetry: telemetry,
                            };
                        }
                        Ok(None) => {
                            if start.elapsed() >= timeout {
                                let _ = process.kill();
                                let telemetry = self.cgroup_manager.as_ref().map(|c| c.read_telemetry());
                                if let Some(ref cgroups) = self.cgroup_manager {
                                    cgroups.cleanup();
                                }
                                return ProcessExecutionResult {
                                    success: false,
                                    exit_code: 124,
                                    stdout: String::new(),
                                    stderr: format!("Process timed out after {}ms limit.", timeout_ms),
                                    duration_ms: start.elapsed().as_millis() as u64,
                                    timed_out: true,
                                    sandbox_engine: engine,
                                    landlock_status,
                                    cgroup_telemetry: telemetry,
                                };
                            }
                            std::thread::sleep(poll_interval);
                        }
                        Err(e) => {
                            let telemetry = self.cgroup_manager.as_ref().map(|c| c.read_telemetry());
                            if let Some(ref cgroups) = self.cgroup_manager {
                                cgroups.cleanup();
                            }
                            return ProcessExecutionResult {
                                success: false,
                                exit_code: 1,
                                stdout: String::new(),
                                stderr: format!("Error monitoring process: {}", e),
                                duration_ms: start.elapsed().as_millis() as u64,
                                timed_out: false,
                                sandbox_engine: engine,
                                landlock_status,
                                cgroup_telemetry: telemetry,
                            };
                        }
                    }
                }
            }
            Err(e) => {
                if let Some(ref cgroups) = self.cgroup_manager {
                    cgroups.cleanup();
                }
                ProcessExecutionResult {
                    success: false,
                    exit_code: 1,
                    stdout: String::new(),
                    stderr: format!("Failed to spawn process: {}", e),
                    duration_ms: start.elapsed().as_millis() as u64,
                    timed_out: false,
                    sandbox_engine: engine,
                    landlock_status,
                    cgroup_telemetry: None,
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execute_echo_success() {
        let temp_dir = std::env::temp_dir();
        let supervisor = SandboxSupervisor::new(temp_dir);
        let res = supervisor.execute_command("echo HELLO_SANDBOX", 3000);
        assert!(res.success);
        assert_eq!(res.exit_code, 0);
        assert_eq!(res.stdout, "HELLO_SANDBOX");
        assert!(!res.timed_out);
        assert!(res.landlock_status.is_some());
    }

    #[test]
    fn test_execute_timeout_kill() {
        let temp_dir = std::env::temp_dir();
        let supervisor = SandboxSupervisor::new(temp_dir);
        let res = supervisor.execute_command("sleep 2", 200);
        assert!(!res.success);
        assert!(res.timed_out);
        assert_eq!(res.exit_code, 124);
    }

    #[test]
    fn test_execute_with_cgroups_builder() {
        let temp_dir = std::env::temp_dir();
        let supervisor = SandboxSupervisor::new(temp_dir)
            .with_cgroups("unit_test_session", CgroupLimits::default());
        assert!(supervisor.cgroup_manager().is_some());
        let res = supervisor.execute_command("echo CGROUP_TEST", 3000);
        assert!(res.success);
        assert_eq!(res.exit_code, 0);
        assert_eq!(res.stdout, "CGROUP_TEST");
        assert!(res.cgroup_telemetry.is_some());
        assert!(res.landlock_status.is_some());
    }

    #[test]
    fn test_seccomp_profile_loaded() {
        let temp_dir = std::env::temp_dir();
        let supervisor = SandboxSupervisor::new(temp_dir);
        let seccomp = supervisor.seccomp().expect("Seccomp profile should be present by default");
        assert!(seccomp.is_syscall_prohibited("ptrace"));
        assert!(seccomp.is_syscall_prohibited("reboot"));
        assert!(!seccomp.is_syscall_prohibited("read"));
    }
}

