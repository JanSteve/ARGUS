use std::thread;
use std::time::Duration;
use crate::error::ProcessError;
use crate::os::backend;
use crate::reaper::ReaperEngine;
use crate::traits::{ProcessInspector, ProcessLimiter, ProcessSupervisor, ZombieReaper};
use crate::types::{LimitViolationStatus, ProcessInfo, ProcessResourceLimits, ProcessTree, ReapSummary};

#[derive(Default)]
pub struct ArgusProcessSupervisor;

impl ArgusProcessSupervisor {
    pub fn new() -> Self {
        Self
    }
}

impl ProcessInspector for ArgusProcessSupervisor {
    fn get_process(&self, pid: u32) -> Result<ProcessInfo, ProcessError> {
        backend::get_process(pid)
    }

    fn list_processes(&self) -> Result<Vec<ProcessInfo>, ProcessError> {
        backend::list_processes()
    }

    fn get_process_tree(&self, root_pid: Option<u32>) -> Result<ProcessTree, ProcessError> {
        let procs = backend::list_processes()?;
        Ok(ProcessTree::build(procs, root_pid))
    }

    fn find_by_name(&self, name: &str) -> Result<Vec<ProcessInfo>, ProcessError> {
        let procs = backend::list_processes()?;
        let target = name.to_lowercase();
        Ok(procs.into_iter().filter(|p| p.name.to_lowercase().contains(&target)).collect())
    }
}

impl ZombieReaper for ArgusProcessSupervisor {
    fn reap_zombies(&self) -> Result<ReapSummary, ProcessError> {
        ReaperEngine::reap_child_zombies()
    }

    fn is_zombie(&self, pid: u32) -> Result<bool, ProcessError> {
        let p = backend::get_process(pid)?;
        Ok(p.state == crate::types::ProcessState::Zombie)
    }

    fn list_zombies(&self) -> Result<Vec<ProcessInfo>, ProcessError> {
        let procs = backend::list_processes()?;
        Ok(ReaperEngine::identify_zombies(&procs))
    }
}

impl ProcessLimiter for ArgusProcessSupervisor {
    fn apply_limits(&self, _pid: u32, limits: &ProcessResourceLimits) -> Result<(), ProcessError> {
        crate::limits::LimitEnforcer::apply_rlimits(limits)
    }

    fn check_limits(&self, pid: u32, limits: &ProcessResourceLimits) -> Result<LimitViolationStatus, ProcessError> {
        let p = backend::get_process(pid)?;
        Ok(crate::limits::LimitEnforcer::check_process_limits(&p, limits))
    }
}

impl ProcessSupervisor for ArgusProcessSupervisor {
    fn terminate(&self, pid: u32, grace_period_ms: u64) -> Result<(), ProcessError> {
        unsafe {
            if libc::kill(pid as libc::pid_t, libc::SIGTERM) != 0 {
                return Err(ProcessError::SyscallFailed(format!("SIGTERM to {} failed", pid)));
            }
        }

        let poll_interval = Duration::from_millis(50);
        let mut waited = 0u64;
        while waited < grace_period_ms {
            thread::sleep(poll_interval);
            waited += 50;
            if backend::get_process(pid).is_err() {
                return Ok(());
            }
        }

        self.kill(pid)
    }

    fn kill(&self, pid: u32) -> Result<(), ProcessError> {
        unsafe {
            if libc::kill(pid as libc::pid_t, libc::SIGKILL) != 0 {
                return Err(ProcessError::SyscallFailed(format!("SIGKILL to {} failed", pid)));
            }
        }
        Ok(())
    }
}
