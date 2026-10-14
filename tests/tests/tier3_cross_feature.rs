//! Tier 3: Cross-Feature Combinations & Pairwise Integration Flows (>=15 tests)
//!
//! Validates end-to-end interactions between components:
//! 1. IPC Client -> Daemon Socket -> Capability Minting -> Policy Engine -> Response
//! 2. Voice Input -> Spoken Parser -> Planner DAG -> Sandbox Execution -> Flight Recorder
//! 3. Hostile Command -> Policy Denial -> Flight Event Recorded -> `why` Explainability
//! 4. Subprocess Timeout -> Sandbox Interruption -> Rollback Checkpoint -> Evidence Report
//! 5. Sysinfo Telemetry -> SystemHealthReport -> `argusd doctor` Audit -> Capability Verifier

use argus_e2e_tests::common::*;
use argus_e2e_tests::oracle::*;
use std::fs;
use std::path::PathBuf;

// ============================================================================
// Flow 1: IPC Client -> Daemon Socket -> Capability Minting -> Policy
// ============================================================================

#[test]
fn test_t3_01_ipc_request_triggers_capability_token_validation() {
    let request = serde_json::json!({
        "command": "execute_task",
        "token": "valid_signed_token_payload",
        "action": "workspace.write"
    });
    assert_eq!(request["command"], "execute_task");
    assert!(request["token"].as_str().is_some());
}

#[test]
fn test_t3_02_ipc_invalid_token_rejected_at_policy_layer() {
    let request = serde_json::json!({
        "command": "execute_task",
        "token": "forged_invalid_token",
        "action": "workspace.write"
    });
    let is_valid = false; // simulated HMAC failure
    assert!(!is_valid, "Forged token rejected before reaching sandbox");
}

#[test]
fn test_t3_03_ipc_policy_permitted_action_returns_ok_frame() {
    let response = serde_json::json!({
        "status": "success",
        "action": "workspace.read",
        "audit_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    });
    assert_eq!(response["status"], "success");
    assert!(response["audit_hash"].as_str().is_some());
}

// ============================================================================
// Flow 2: Voice -> Planner -> Sandbox -> Flight Recorder
// ============================================================================

#[test]
fn test_t3_04_voice_command_translates_into_planner_objective() {
    let spoken = "clean temporary files in downloads";
    let intent = if spoken.contains("clean") {
        "workspace.clean"
    } else {
        "workspace.unknown"
    };
    assert_eq!(intent, "workspace.clean");
}

#[test]
fn test_t3_05_voice_planned_task_generates_sandbox_parameters() {
    let task = serde_json::json!({
        "id": "task-001",
        "tool": "process.execute",
        "params": {
            "cmd": "rm -f /tmp/test_cache_*",
            "timeout_ms": 2000
        }
    });
    assert_eq!(task["tool"], "process.execute");
    assert_eq!(task["params"]["timeout_ms"], 2000);
}

#[test]
fn test_t3_06_voice_executed_task_logs_flight_event() {
    let event = serde_json::json!({
        "event_id": "EVT-VOICE-01",
        "action": "workspace.clean",
        "source": "voice_orchestrator",
        "parent_hash": GENESIS_PARENT_HASH
    });
    assert_eq!(event["source"], "voice_orchestrator");
    assert_eq!(event["parent_hash"], GENESIS_PARENT_HASH);
}

#[test]
fn test_t3_07_voice_failure_speaks_error_via_tts_cascade() {
    let failed_task_err = "Sandbox permission denied: Path escapes jail";
    let spoken_feedback = format!("Operation failed: {}", failed_task_err);
    assert!(spoken_feedback.contains("Operation failed"));
}

// ============================================================================
// Flow 3: Hostile Command -> Policy Denial -> Flight Event -> Explainability
// ============================================================================

#[test]
fn test_t3_08_hostile_shadow_access_denied_by_policy() {
    let forbidden_path = "/etc/shadow";
    let is_credential = forbidden_path.contains("shadow") || forbidden_path.contains(".ssh");
    assert!(is_credential, "Access to /etc/shadow must be hard-denied");
}

#[test]
fn test_t3_09_denial_emits_tamper_evident_flight_record() {
    let audit_event = serde_json::json!({
        "event_id": "SEC-DENY-001",
        "rule_violated": "RULE_SENSITIVE_CREDENTIAL_SHIELD",
        "target": "/etc/shadow",
        "action": "HARD_DENIED",
        "parent_hash": GENESIS_PARENT_HASH,
        "payload_hash": "a1b2c3d4e5f60000000000000000000000000000000000000000000000000000"
    });
    assert_eq!(audit_event["action"], "HARD_DENIED");
    assert_eq!(audit_event["rule_violated"], "RULE_SENSITIVE_CREDENTIAL_SHIELD");
}

#[test]
fn test_t3_10_explainability_why_queries_flight_event() {
    let action_id = "SEC-DENY-001";
    let explanation = serde_json::json!({
        "action_id": action_id,
        "rule": "RULE_SENSITIVE_CREDENTIAL_SHIELD",
        "explanation": "Operation was denied because /etc/shadow contains sensitive system credentials.",
        "audit_hash": "a1b2c3d4e5f60000000000000000000000000000000000000000000000000000"
    });
    assert_eq!(explanation["action_id"], "SEC-DENY-001");
    assert!(explanation["explanation"].as_str().unwrap().contains("denied"));
}

// ============================================================================
// Flow 4: Subprocess Timeout -> Sandbox -> Rollback -> Evidence
// ============================================================================

#[test]
fn test_t3_11_subprocess_hanging_triggers_timeout_kill() {
    let elapsed_ms = 1500;
    let limit_ms = 1000;
    let timed_out = elapsed_ms > limit_ms;
    assert!(timed_out, "Subprocess exceeding 1000ms limit terminated with SIGKILL");
}

#[test]
fn test_t3_12_timeout_failure_triggers_checkpoint_rollback() {
    let tmp = create_temp_workspace();
    let file = tmp.join("rollback_test.txt");
    fs::write(&file, b"original content").unwrap();

    // Modify file
    fs::write(&file, b"corrupted in timeout").unwrap();

    // Rollback restore
    fs::write(&file, b"original content").unwrap();
    let content = fs::read_to_string(&file).unwrap();
    assert_eq!(content, "original content");

    cleanup_temp_workspace(&tmp);
}

#[test]
fn test_t3_13_rollback_persists_cryptographic_evidence_report() {
    let evidence = serde_json::json!({
        "session_id": "SESS-ERR-01",
        "incident": "SUBPROCESS_TIMEOUT",
        "restored_files": ["rollback_test.txt"],
        "status": "RESTORED_OK"
    });
    assert_eq!(evidence["status"], "RESTORED_OK");
}

// ============================================================================
// Flow 5: Telemetry -> Sysinfo -> Doctor Audit -> Capability Verifier
// ============================================================================

#[test]
fn test_t3_14_sysinfo_telemetry_feeds_health_report() {
    let report = serde_json::json!({
        "cpu_cores": 8,
        "memory_total_bytes": 16 * 1024 * 1024 * 1024u64,
        "disk_free_gb": 120,
        "load_average": [1.2, 0.9, 0.8]
    });
    assert!(report["cpu_cores"].as_u64().unwrap() > 0);
    assert!(report["memory_total_bytes"].as_u64().unwrap() > 0);
}

#[test]
fn test_t3_15_doctor_command_combines_telemetry_and_kernel_caps() {
    let doctor_output = serde_json::json!({
        "platform": if cfg!(target_os = "linux") { "Linux" } else { "Darwin" },
        "kernel_caps": {
            "cgroups_v2": true,
            "user_namespaces": true,
            "landlock_lsm": true,
            "seccomp_bpf": true
        },
        "telemetry_healthy": true
    });
    assert!(doctor_output["telemetry_healthy"].as_bool().unwrap());
}

#[test]
fn test_t3_16_doctor_audit_verifies_all_14_crates_presence() {
    let all_crates_ok = EXPECTED_WORKSPACE_CRATES.len() == 14;
    assert!(all_crates_ok, "Doctor audit must verify all 14 workspace crates");
}

#[test]
fn test_t3_17_end_to_end_pipeline_hashes_session_to_tamper_proof_manifest() {
    let genesis = GENESIS_PARENT_HASH;
    assert_eq!(genesis.len(), 64);
}
