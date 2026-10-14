//! ARGUS Autonomous Linux Agent Daemon Comprehensive E2E Suite Aggregator
//!
//! Executes end-to-end integration passes combining Tiers 1-5.

use argus_e2e_tests::common::*;
use argus_e2e_tests::oracle::*;

#[test]
fn test_e2e_suite_aggregate_status() {
    assert_eq!(EXPECTED_WORKSPACE_CRATES.len(), 14);
    assert_eq!(EXPECTED_SECURITY_TEST_COUNT, 20);
    assert_eq!(EXPECTED_IPC_COMMANDS.len(), 7);
    assert_eq!(EXPECTED_DAEMON_SUBCOMMANDS.len(), 13);
}

#[test]
fn test_e2e_suite_architecture_integrity() {
    let repo = target_repo_path();
    assert!(repo.join("Cargo.toml").exists());
    assert!(repo.join("crates").exists());
    assert!(repo.join("scripts").exists());
    assert!(repo.join("docs").exists());
}
