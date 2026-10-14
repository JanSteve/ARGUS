use crate::error::ProcessError;
use crate::types::{LimitViolationStatus, ProcessInfo, ProcessResourceLimits, ProcessTree, ReapSummary};

pub trait ProcessInspector {
    fn get_process(&self, pid: u32) -> Result<ProcessInfo, ProcessError>;
    fn list_processes(&self) -> Result<Vec<ProcessInfo>, ProcessError>;
    fn get_process_tree(&self, root_pid: Option<u32>) -> Result<ProcessTree, ProcessError>;
    fn find_by_name(&self, name: &str) -> Result<Vec<ProcessInfo>, ProcessError>;
}

pub trait ZombieReaper {
    fn reap_zombies(&self) -> Result<ReapSummary, ProcessError>;
    fn is_zombie(&self, pid: u32) -> Result<bool, ProcessError>;
    fn list_zombies(&self) -> Result<Vec<ProcessInfo>, ProcessError>;
}

pub trait ProcessLimiter {
    fn apply_limits(&self, pid: u32, limits: &ProcessResourceLimits) -> Result<(), ProcessError>;
    fn check_limits(&self, pid: u32, limits: &ProcessResourceLimits) -> Result<LimitViolationStatus, ProcessError>;
}

pub trait ProcessSupervisor: ProcessInspector + ZombieReaper + ProcessLimiter {
    fn terminate(&self, pid: u32, grace_period_ms: u64) -> Result<(), ProcessError>;
    fn kill(&self, pid: u32) -> Result<(), ProcessError>;
}
