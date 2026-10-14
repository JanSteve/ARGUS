//! # ARGUS Governed Process Engine (`argus-process`)
//!
//! Provides process tree enumeration, non-blocking POSIX zombie reaping,
//! resource limit enforcement, and cross-platform process telemetry.

pub mod error;
pub mod limits;
pub mod os;
pub mod reaper;
pub mod supervisor;
pub mod traits;
pub mod tree;
pub mod types;

pub use error::ProcessError;
pub use limits::LimitEnforcer;
pub use reaper::ReaperEngine;
pub use supervisor::ArgusProcessSupervisor;
pub use traits::{ProcessInspector, ProcessLimiter, ProcessSupervisor, ZombieReaper};
pub use types::{
    LimitViolationStatus, ProcessInfo, ProcessResourceLimits, ProcessState, ProcessTree, ProcessTreeNode, ReapSummary,
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_current_process_inspection() {
        let sup = ArgusProcessSupervisor::new();
        let pid = std::process::id();
        let info = sup.get_process(pid).expect("Current process should exist");
        assert_eq!(info.pid, pid);
    }

    #[test]
    fn test_list_processes_not_empty() {
        let sup = ArgusProcessSupervisor::new();
        let list = sup.list_processes().expect("Process list should return");
        assert!(!list.is_empty());
    }

    #[test]
    fn test_tree_construction() {
        let sup = ArgusProcessSupervisor::new();
        let tree = sup.get_process_tree(Some(1)).expect("Process tree should construct");
        assert!(!tree.nodes.is_empty());
    }

    #[test]
    fn test_zombie_reap_empty_ok() {
        let sup = ArgusProcessSupervisor::new();
        let summary = sup.reap_zombies().expect("Reap should execute without error");
        assert!(summary.duration_ms < 1000);
    }
}
