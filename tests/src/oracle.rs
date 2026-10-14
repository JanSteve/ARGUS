//! Authoritative Test Oracles derived strictly from ORIGINAL_REQUEST.md and TEST_INFRA.md

pub const EXPECTED_WORKSPACE_CRATES: &[&str] = &[
    "argusd",
    "argus-cli",
    "argus-core",
    "argus-sandbox",
    "argus-linux",
    "argus-agent",
    "argus-voice",
    "argus-sysinfo",
    "argus-fs",
    "argus-process",
    "argus-service",
    "argus-net",
    "argus-pkg",
    "argus-phone",
];

pub const EXPECTED_SECURITY_TEST_COUNT: usize = 20;

pub const EXPECTED_SECURITY_TEST_IDS: &[&str] = &[
    "TEST-001", "TEST-002", "TEST-003", "TEST-004", "TEST-005",
    "TEST-006", "TEST-007", "TEST-008", "TEST-009", "TEST-010",
    "TEST-011", "TEST-012", "TEST-013", "TEST-014", "TEST-015",
    "TEST-016", "TEST-017", "TEST-018", "TEST-019", "TEST-020",
];

pub const EXPECTED_IPC_COMMANDS: &[&str] = &[
    "ping",
    "status",
    "doctor",
    "capabilities",
    "security_test",
    "why",
    "execute_task",
];

pub const EXPECTED_DAEMON_SUBCOMMANDS: &[&str] = &[
    "start",
    "status",
    "doctor",
    "capabilities",
    "security-test",
    "benchmark",
    "gov-doc-poc",
    "voice",
    "verify",
    "sandbox",
    "audit",
    "interactive",
    "why",
];

pub const EXPECTED_GIT_REMOTE_URL: &str = "https://github.com/JanSteve/ARGUS.git";
pub const EXPECTED_GIT_BRANCH: &str = "batman";
pub const EXPECTED_UNIFIED_POSITIONING: &str = "Autonomous Voice-Native Linux Agent Daemon";

pub const GENESIS_PARENT_HASH: &str = "0000000000000000000000000000000000000000000000000000000000000000";
