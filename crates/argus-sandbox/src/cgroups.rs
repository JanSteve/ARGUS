#[allow(unused_imports)]
use std::fs;
#[allow(unused_imports)]
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CgroupLimits {
    pub memory_max_bytes: u64,
    pub cpu_quota_us: u64,
    pub cpu_period_us: u64,
    pub pids_max: u32,
}

impl Default for CgroupLimits {
    fn default() -> Self {
        Self {
            memory_max_bytes: 512 * 1024 * 1024, // 512 MiB RAM cap
            cpu_quota_us: 50_000,                // 50ms per 100ms = 50% single-core quota
            cpu_period_us: 100_000,
            pids_max: 64,                        // 64 max processes (fork-bomb immunity)
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CgroupUsageTelemetry {
    pub memory_current_bytes: u64,
    pub cpu_usage_usec: u64,
    pub pids_current: u32,
}

pub struct CgroupV2Manager {
    cgroup_root: PathBuf,
    scope_name: String,
    limits: CgroupLimits,
}

impl CgroupV2Manager {
    pub fn new(session_id: &str, limits: CgroupLimits) -> Self {
        let default_cgroup = PathBuf::from("/sys/fs/cgroup");
        let scope_name = format!("argus_agent_{}", session_id);
        Self {
            cgroup_root: default_cgroup,
            scope_name,
            limits,
        }
    }

    pub fn is_cgroups_v2_available() -> bool {
        #[cfg(target_os = "linux")]
        {
            let controllers_path = Path::new("/sys/fs/cgroup/cgroup.controllers");
            controllers_path.exists()
        }
        #[cfg(not(target_os = "linux"))]
        {
            false
        }
    }

    pub fn scope_path(&self) -> PathBuf {
        self.cgroup_root.join(&self.scope_name)
    }

    pub fn limits(&self) -> &CgroupLimits {
        &self.limits
    }

    /**
     * Initializes ephemeral cgroup slice with memory, CPU, and PID limits
     */
    pub fn setup_scope(&self) -> Result<PathBuf, String> {
        let path = self.scope_path();

        #[cfg(target_os = "linux")]
        {
            if !Self::is_cgroups_v2_available() {
                return Err("Cgroups v2 unified hierarchy not mounted on host".to_string());
            }

            if let Err(e) = fs::create_dir_all(&path) {
                return Err(format!("Failed to create cgroup scope {}: {}", path.display(), e));
            }

            // 1. Set Memory Limit
            let mem_limit_file = path.join("memory.max");
            let _ = fs::write(&mem_limit_file, self.limits.memory_max_bytes.to_string());

            // 2. Set CPU Quota
            let cpu_limit_file = path.join("cpu.max");
            let cpu_str = format!("{} {}", self.limits.cpu_quota_us, self.limits.cpu_period_us);
            let _ = fs::write(&cpu_limit_file, cpu_str);

            // 3. Set Max PIDs (Fork-bomb defense)
            let pids_limit_file = path.join("pids.max");
            let _ = fs::write(&pids_limit_file, self.limits.pids_max.to_string());

            Ok(path)
        }

        #[cfg(not(target_os = "linux"))]
        {
            // Simulated cgroup creation outside Linux
            Ok(path)
        }
    }

    /**
     * Moves a spawned child process PID into the cgroup
     */
    pub fn attach_pid(&self, pid: u32) -> Result<(), String> {
        #[cfg(target_os = "linux")]
        {
            let procs_file = self.scope_path().join("cgroup.procs");
            if procs_file.exists() {
                fs::write(&procs_file, pid.to_string())
                    .map_err(|e| format!("Failed to attach PID {} to cgroup: {}", pid, e))?;
            }
            Ok(())
        }
        #[cfg(not(target_os = "linux"))]
        {
            let _ = pid;
            Ok(())
        }
    }

    /**
     * Reads resource telemetry before cleanup
     */
    pub fn read_telemetry(&self) -> CgroupUsageTelemetry {
        #[allow(unused_mut)]
        let mut mem = 0;
        #[allow(unused_mut)]
        let mut cpu = 0;
        #[allow(unused_mut)]
        let mut pids = 0;

        #[cfg(target_os = "linux")]
        {
            let path = self.scope_path();
            if let Ok(mem_str) = fs::read_to_string(path.join("memory.current")) {
                mem = mem_str.trim().parse().unwrap_or(0);
            }
            if let Ok(pids_str) = fs::read_to_string(path.join("pids.current")) {
                pids = pids_str.trim().parse().unwrap_or(0);
            }
            if let Ok(cpu_str) = fs::read_to_string(path.join("cpu.stat")) {
                for line in cpu_str.lines() {
                    if line.starts_with("usage_usec") {
                        if let Some(val) = line.split_whitespace().nth(1) {
                            cpu = val.parse().unwrap_or(0);
                        }
                    }
                }
            }
        }

        CgroupUsageTelemetry {
            memory_current_bytes: mem,
            cpu_usage_usec: cpu,
            pids_current: pids,
        }
    }

    /**
     * Cleans up the cgroup directory when execution finishes
     */
    pub fn cleanup(&self) {
        #[cfg(target_os = "linux")]
        {
            let path = self.scope_path();
            if path.exists() {
                let _ = fs::remove_dir(&path);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cgroup_limits_default() {
        let limits = CgroupLimits::default();
        assert_eq!(limits.memory_max_bytes, 512 * 1024 * 1024);
        assert_eq!(limits.pids_max, 64);
    }

    #[test]
    fn test_cgroup_manager_paths() {
        let manager = CgroupV2Manager::new("test_session", CgroupLimits::default());
        assert_eq!(manager.scope_path(), PathBuf::from("/sys/fs/cgroup/argus_agent_test_session"));
    }
}
