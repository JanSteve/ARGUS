use std::time::Instant;
use crate::error::ProcessError;
use crate::types::{ProcessInfo, ProcessState, ReapSummary};

pub struct ReaperEngine;

impl ReaperEngine {
    /// Non-blocking POSIX zombie reaper. Calls `waitpid(-1, &mut status, WNOHANG)` in a loop
    /// to clean up all terminated child processes.
    pub fn reap_child_zombies() -> Result<ReapSummary, ProcessError> {
        let t0 = Instant::now();
        let mut reaped = Vec::new();

        loop {
            let mut status: libc::c_int = 0;
            // POSIX waitpid with WNOHANG
            let res = unsafe { libc::waitpid(-1, &mut status, libc::WNOHANG) };
            if res > 0 {
                reaped.push(res as u32);
            } else if res == 0 {
                // Children exist but none have exited
                break;
            } else {
                // -1 indicates either no children (ECHILD) or interrupted syscall
                break;
            }
        }

        Ok(ReapSummary {
            reaped_count: reaped.len(),
            reaped_pids: reaped,
            duration_ms: t0.elapsed().as_millis() as u64,
        })
    }

    /// Filters a list of processes for those currently stuck in the Zombie state ('Z').
    pub fn identify_zombies(processes: &[ProcessInfo]) -> Vec<ProcessInfo> {
        processes.iter()
            .filter(|p| p.state == ProcessState::Zombie)
            .cloned()
            .collect()
    }
}
