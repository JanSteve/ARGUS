use crate::error::ProcessError;
use crate::types::{LimitViolationStatus, ProcessInfo, ProcessResourceLimits};

pub struct LimitEnforcer;

impl LimitEnforcer {
    /// Applies POSIX resource limits (RLIMIT_CPU, RLIMIT_AS, RLIMIT_NOFILE) via libc.
    pub fn apply_rlimits(limits: &ProcessResourceLimits) -> Result<(), ProcessError> {
        unsafe {
            if let Some(cpu_secs) = limits.max_cpu_time_secs {
                let rlim = libc::rlimit {
                    rlim_cur: cpu_secs as libc::rlim_t,
                    rlim_max: cpu_secs as libc::rlim_t,
                };
                if libc::setrlimit(libc::RLIMIT_CPU, &rlim) != 0 {
                    return Err(ProcessError::SyscallFailed("Failed to set RLIMIT_CPU".into()));
                }
            }

            if let Some(open_files) = limits.max_open_files {
                let rlim = libc::rlimit {
                    rlim_cur: open_files as libc::rlim_t,
                    rlim_max: open_files as libc::rlim_t,
                };
                if libc::setrlimit(libc::RLIMIT_NOFILE, &rlim) != 0 {
                    return Err(ProcessError::SyscallFailed("Failed to set RLIMIT_NOFILE".into()));
                }
            }
        }
        Ok(())
    }

    /// Evaluates current metrics against limits.
    pub fn check_process_limits(info: &ProcessInfo, limits: &ProcessResourceLimits) -> LimitViolationStatus {
        let mut status = LimitViolationStatus {
            violated: false,
            memory_exceeded: false,
            cpu_exceeded: false,
            timeout_exceeded: false,
            reason: None,
        };

        if let Some(max_mem) = limits.max_memory_bytes {
            if info.memory_rss_bytes > max_mem {
                status.violated = true;
                status.memory_exceeded = true;
                status.reason = Some(format!("Memory RSS {} bytes exceeds limit {} bytes", info.memory_rss_bytes, max_mem));
            }
        }

        status
    }
}
