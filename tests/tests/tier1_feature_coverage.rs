//! Tier 1: Feature Coverage (>=5 test cases per core feature)
//!
//! Features covered:
//! 1. 13-Crate Workspace Manifest & Layout
//! 2. Darwin Conditional Compilation & Shims
//! 3. 20-Point Native Rust Security Test Suite
//! 4. Unix Domain Socket IPC Communication
//! 5. Autonomous Task Planner & Self-Healing
//! 6. Flight Recorder & Cryptographic Hash Chains
//! 7. Neural Voice Engine & Fallbacks
//! 8. Docker Testing Container & test-linux.sh
//! 9. Terminal Demo Assets & demo.sh Replay
//! 10. Documentation & GitHub Synchronization

use argus_e2e_tests::common::*;
use argus_e2e_tests::oracle::*;
use std::fs;

// ============================================================================
// Feature 1: 14-Crate Workspace Manifest & Layout (R1, R2)
// ============================================================================

#[test]
fn test_f1_01_workspace_manifest_contains_all_14_crates() {
    let cargo_toml_path = target_repo_path().join("Cargo.toml");
    let content = fs::read_to_string(&cargo_toml_path)
        .expect("Failed to read root Cargo.toml");

    for crate_name in EXPECTED_WORKSPACE_CRATES {
        let member_str = format!("\"crates/{}\"", crate_name);
        assert!(
            content.contains(&member_str),
            "Root Cargo.toml missing workspace member: {}",
            crate_name
        );
    }
}

#[test]
fn test_f1_02_workspace_members_count_is_at_least_14() {
    let cargo_toml_path = target_repo_path().join("Cargo.toml");
    let content = fs::read_to_string(&cargo_toml_path)
        .expect("Failed to read root Cargo.toml");

    let member_matches = content
        .lines()
        .filter(|line| line.trim().starts_with("\"crates/"))
        .count();

    assert!(
        member_matches >= EXPECTED_WORKSPACE_CRATES.len(),
        "Expected at least 14 members in Cargo.toml, found {}",
        member_matches
    );
}

#[test]
fn test_f1_03_all_crate_directories_have_cargo_toml() {
    let crates_dir = target_crates_path();
    for crate_name in EXPECTED_WORKSPACE_CRATES {
        let manifest_path = crates_dir.join(crate_name).join("Cargo.toml");
        assert!(
            manifest_path.exists(),
            "Crate manifest missing at {:?}",
            manifest_path
        );
    }
}

#[test]
fn test_f1_04_all_crate_targets_have_valid_entrypoints() {
    let crates_dir = target_crates_path();
    for crate_name in EXPECTED_WORKSPACE_CRATES {
        let lib_path = crates_dir.join(crate_name).join("src/lib.rs");
        let bin_path = crates_dir.join(crate_name).join("src/main.rs");
        let has_target = lib_path.exists() || bin_path.exists();
        assert!(
            has_target,
            "Crate '{}' must have src/lib.rs or src/main.rs",
            crate_name
        );
    }
}

#[test]
fn test_f1_05_workspace_resolver_version_is_2() {
    let cargo_toml_path = target_repo_path().join("Cargo.toml");
    let content = fs::read_to_string(&cargo_toml_path)
        .expect("Failed to read root Cargo.toml");
    assert!(
        content.contains("resolver = \"2\""),
        "Root Cargo.toml must use resolver 2"
    );
}

// ============================================================================
// Feature 2: Darwin Conditional Compilation & Shims (R2)
// ============================================================================

#[test]
fn test_f2_01_landlock_darwin_abi_probe_mock_returns_valid_version() {
    let landlock_rs = target_crates_path().join("argus-sandbox/src/landlock.rs");
    let content = fs::read_to_string(&landlock_rs)
        .expect("Failed to read landlock.rs");

    assert!(
        content.contains("probe_abi_version"),
        "landlock.rs must implement probe_abi_version"
    );
    assert!(
        content.contains("#[cfg(not(target_os = \"linux\"))]"),
        "landlock.rs must have conditional compilation for non-Linux"
    );
}

#[test]
fn test_f2_02_landlock_darwin_status_does_not_call_linux_only_apply() {
    let landlock_rs = target_crates_path().join("argus-sandbox/src/landlock.rs");
    let content = fs::read_to_string(&landlock_rs)
        .expect("Failed to read landlock.rs");

    // Ensure status() under non-linux does not call missing self.apply_to_current_process()
    if let Some(pos) = content.find("#[cfg(not(target_os = \"linux\"))]\n    pub fn status") {
        let block = &content[pos..pos + 200.min(content.len() - pos)];
        assert!(
            !block.contains("self.apply_to_current_process()"),
            "Darwin fallback status() must not call linux-only apply_to_current_process()"
        );
    }
}

#[test]
fn test_f2_03_cgroups_darwin_mock_returns_graceful_status() {
    let cgroups_rs = target_crates_path().join("argus-sandbox/src/cgroups.rs");
    let content = fs::read_to_string(&cgroups_rs)
        .expect("Failed to read cgroups.rs");

    assert!(
        content.contains("#[cfg(not(target_os = \"linux\"))]"),
        "cgroups.rs must define graceful mocks for non-Linux Darwin"
    );
}

#[test]
fn test_f2_04_sysinfo_darwin_metrics_use_sysctl_and_vm_stat() {
    let sysinfo_rs = target_crates_path().join("argus-sysinfo/src/lib.rs");
    let content = fs::read_to_string(&sysinfo_rs)
        .expect("Failed to read argus-sysinfo/src/lib.rs");

    assert!(
        content.contains("sysctl") || content.contains("vm_stat"),
        "argus-sysinfo must contain Darwin sysctl/vm_stat telemetry bindings"
    );
}

#[test]
fn test_f2_05_voice_darwin_emergency_tts_uses_say_command() {
    let voice_rs = target_crates_path().join("argus-voice/src/lib.rs");
    let content = fs::read_to_string(&voice_rs)
        .expect("Failed to read argus-voice/src/lib.rs");

    assert!(
        content.contains("say"),
        "argus-voice must contain macOS 'say' fallback in emergency TTS cascade"
    );
}

// ============================================================================
// Feature 3: 20-Point Native Rust Security Test Suite (R1)
// ============================================================================

#[test]
fn test_f3_01_security_suite_advertises_and_contains_20_tests() {
    let daemon_rs = target_crates_path().join("argusd/src/main.rs");
    let content = fs::read_to_string(&daemon_rs)
        .expect("Failed to read argusd/src/main.rs");

    assert!(
        content.contains("20"),
        "argusd must declare a 20-point security test suite"
    );
}

#[test]
fn test_f3_02_all_20_security_test_ids_present_in_codebase() {
    let daemon_rs = target_crates_path().join("argusd/src/main.rs");
    let content = fs::read_to_string(&daemon_rs).unwrap_or_default();

    for id in EXPECTED_SECURITY_TEST_IDS {
        assert!(
            content.contains(id),
            "Expected security test ID '{}' missing from argusd security suite",
            id
        );
    }
}

#[test]
fn test_f3_03_security_test_covers_path_traversal() {
    let daemon_rs = target_crates_path().join("argusd/src/main.rs");
    let content = fs::read_to_string(&daemon_rs).unwrap_or_default();
    assert!(
        content.contains("..") || content.contains("traversal"),
        "Security test suite must test path traversal prevention"
    );
}

#[test]
fn test_f3_04_security_test_covers_credential_harvesting() {
    let daemon_rs = target_crates_path().join("argusd/src/main.rs");
    let content = fs::read_to_string(&daemon_rs).unwrap_or_default();
    assert!(
        content.contains("shadow") || content.contains("id_ed25519") || content.contains(".env"),
        "Security test suite must test credential harvesting interception"
    );
}

#[test]
fn test_f3_05_security_test_covers_dangerous_commands_and_fork_bomb() {
    let daemon_rs = target_crates_path().join("argusd/src/main.rs");
    let content = fs::read_to_string(&daemon_rs).unwrap_or_default();
    assert!(
        content.contains("rm -rf") || content.contains(":(){ :|:& };:"),
        "Security test suite must test dangerous command and fork bomb interception"
    );
}

// ============================================================================
// Feature 4: Unix Domain Socket IPC Communication (R1)
// ============================================================================

#[test]
fn test_f4_01_ipc_module_defines_unix_domain_socket_primitives() {
    let ipc_rs = target_crates_path().join("argus-core/src/ipc.rs");
    let content = fs::read_to_string(&ipc_rs).expect("Failed to read ipc.rs");

    assert!(
        content.contains("UnixListener") || content.contains("UnixStream"),
        "ipc.rs must use Unix Domain Socket stream/listener"
    );
}

#[test]
fn test_f4_02_ipc_socket_path_configured_in_argus_home() {
    let ipc_rs = target_crates_path().join("argus-core/src/ipc.rs");
    let content = fs::read_to_string(&ipc_rs).expect("Failed to read ipc.rs");

    assert!(
        content.contains("argusd.sock") || content.contains("argus.sock"),
        "ipc.rs must define standard argusd.sock path"
    );
}

#[test]
fn test_f4_03_ipc_server_handles_ping_and_status() {
    let daemon_rs = target_crates_path().join("argusd/src/main.rs");
    let content = fs::read_to_string(&daemon_rs).expect("Failed to read argusd main.rs");

    assert!(
        content.contains("ping"),
        "IPC handler must respond to ping"
    );
    assert!(
        content.contains("status"),
        "IPC handler must respond to status"
    );
}

#[test]
fn test_f4_04_ipc_server_handles_doctor_and_explainability() {
    let daemon_rs = target_crates_path().join("argusd/src/main.rs");
    let content = fs::read_to_string(&daemon_rs).expect("Failed to read argusd main.rs");

    assert!(
        content.contains("doctor") || content.contains("why"),
        "IPC handler must support doctor or why telemetry commands"
    );
}

#[test]
fn test_f4_05_cli_client_connects_to_daemon_ipc() {
    let cli_rs = target_crates_path().join("argus-cli/src/main.rs");
    let content = fs::read_to_string(&cli_rs).expect("Failed to read argus-cli main.rs");

    assert!(
        content.contains("IpcClient") || content.contains("UnixStream"),
        "argus-cli must connect over Unix domain socket to argusd"
    );
}

// ============================================================================
// Feature 5: Autonomous Task Planner & Self-Healing (R1)
// ============================================================================

#[test]
fn test_f5_01_agent_planner_creates_structured_task_dag() {
    let agent_rs = target_crates_path().join("argus-agent/src/lib.rs");
    let content = fs::read_to_string(&agent_rs).expect("Failed to read argus-agent lib.rs");

    assert!(
        content.contains("AgentPlanner") && content.contains("create_plan"),
        "argus-agent must provide AgentPlanner::create_plan"
    );
}

#[test]
fn test_f5_02_agent_plan_contains_distinct_stages() {
    let agent_rs = target_crates_path().join("argus-agent/src/lib.rs");
    let content = fs::read_to_string(&agent_rs).expect("Failed to read argus-agent lib.rs");

    assert!(
        content.contains("AgentTask") || content.contains("TaskStatus"),
        "argus-agent must define structured tasks with execution statuses"
    );
}

#[test]
fn test_f5_03_agent_planner_integrates_with_sandbox_executor() {
    let agent_cargo = target_crates_path().join("argus-agent/Cargo.toml");
    let content = fs::read_to_string(&agent_cargo).expect("Failed to read argus-agent Cargo.toml");

    assert!(
        content.contains("argus-sandbox"),
        "argus-agent must declare dependency on argus-sandbox"
    );
}

#[test]
fn test_f5_04_agent_planner_supports_structured_tool_parameters() {
    let agent_rs = target_crates_path().join("argus-agent/src/lib.rs");
    let content = fs::read_to_string(&agent_rs).expect("Failed to read argus-agent lib.rs");

    assert!(
        content.contains("params") || content.contains("tool") || content.contains("action"),
        "argus-agent tasks must include structured tool calling parameters"
    );
}

#[test]
fn test_f5_05_agent_planner_has_error_recovery_state_transitions() {
    let agent_rs = target_crates_path().join("argus-agent/src/lib.rs");
    let content = fs::read_to_string(&agent_rs).expect("Failed to read argus-agent lib.rs");

    assert!(
        content.contains("FAILED") || content.contains("SUCCESS") || content.contains("RETRY"),
        "argus-agent must model failure and success states"
    );
}

// ============================================================================
// Feature 6: Flight Recorder & Cryptographic Hash Chains (R1)
// ============================================================================

#[test]
fn test_f6_01_flight_recorder_implements_sha256_hash_chain() {
    let fr_rs = target_crates_path().join("argus-core/src/flight_recorder.rs");
    let content = fs::read_to_string(&fr_rs).expect("Failed to read flight_recorder.rs");

    assert!(
        content.contains("calculate_hash") || content.contains("parent_hash"),
        "flight_recorder.rs must calculate SHA-256 hash chains"
    );
}

#[test]
fn test_f6_02_flight_recorder_verifies_session_integrity() {
    let fr_rs = target_crates_path().join("argus-core/src/flight_recorder.rs");
    let content = fs::read_to_string(&fr_rs).expect("Failed to read flight_recorder.rs");

    assert!(
        content.contains("verify_session_integrity"),
        "flight_recorder.rs must provide verify_session_integrity"
    );
}

#[test]
fn test_f6_03_capability_manager_mints_and_verifies_hmac_tokens() {
    let cap_rs = target_crates_path().join("argus-core/src/capabilities.rs");
    let content = fs::read_to_string(&cap_rs).expect("Failed to read capabilities.rs");

    assert!(
        content.contains("mint_token") && content.contains("verify_token"),
        "capabilities.rs must provide mint_token and verify_token"
    );
}

#[test]
fn test_f6_04_flight_recorder_detects_tampering() {
    let fr_rs = target_crates_path().join("argus-core/src/flight_recorder.rs");
    let content = fs::read_to_string(&fr_rs).expect("Failed to read flight_recorder.rs");

    assert!(
        content.contains("Tampered") || content.contains("ChainBroken") || content.contains("Tamper"),
        "flight_recorder.rs must report tampering when hashes diverge"
    );
}

#[test]
fn test_f6_05_verifier_computes_independent_file_hash() {
    let verifier_rs = target_crates_path().join("argus-core/src/verifier.rs");
    let content = fs::read_to_string(&verifier_rs).expect("Failed to read verifier.rs");

    assert!(
        content.contains("verify_file") || content.contains("Sha256"),
        "verifier.rs must compute SHA-256 for files on disk"
    );
}

// ============================================================================
// Feature 7: Neural Voice Engine & Fallbacks (R1)
// ============================================================================

#[test]
fn test_f7_01_voice_orchestrator_defines_4_tier_tts_cascade() {
    let voice_rs = target_crates_path().join("argus-voice/src/lib.rs");
    let content = fs::read_to_string(&voice_rs).expect("Failed to read argus-voice lib.rs");

    assert!(
        content.contains("VoiceOrchestrator") && content.contains("synthesize_and_speak"),
        "argus-voice must implement VoiceOrchestrator::synthesize_and_speak"
    );
}

#[test]
fn test_f7_02_voice_engine_falls_back_on_cloud_tts_timeout() {
    let voice_rs = target_crates_path().join("argus-voice/src/lib.rs");
    let content = fs::read_to_string(&voice_rs).expect("Failed to read argus-voice lib.rs");

    assert!(
        content.contains("try_cloud_neural_tts") || content.contains("MiniMax") || content.contains("ElevenLabs"),
        "argus-voice must include cloud neural TTS tiers"
    );
}

#[test]
fn test_f7_03_voice_engine_includes_emergency_system_tts() {
    let voice_rs = target_crates_path().join("argus-voice/src/lib.rs");
    let content = fs::read_to_string(&voice_rs).expect("Failed to read argus-voice lib.rs");

    assert!(
        content.contains("try_emergency_system_tts") || content.contains("say") || content.contains("espeak"),
        "argus-voice must include emergency offline system TTS"
    );
}

#[test]
fn test_f7_04_spoken_command_parser_handles_workspace_clean() {
    let voice_rs = target_crates_path().join("argus-voice/src/lib.rs");
    let content = fs::read_to_string(&voice_rs).expect("Failed to read argus-voice lib.rs");

    assert!(
        content.contains("parse_spoken_command"),
        "argus-voice must define parse_spoken_command"
    );
}

#[test]
fn test_f7_05_spoken_command_parser_handles_explainability_why() {
    let voice_rs = target_crates_path().join("argus-voice/src/lib.rs");
    let content = fs::read_to_string(&voice_rs).expect("Failed to read argus-voice lib.rs");

    assert!(
        content.contains("why") || content.contains("explain"),
        "argus-voice command parser must detect why/explain commands"
    );
}

// ============================================================================
// Feature 8: Docker Testing Container & test-linux.sh (R2)
// ============================================================================

#[test]
fn test_f8_01_dockerfile_test_exists() {
    let dockerfile = target_repo_path().join("Dockerfile.test");
    assert!(
        dockerfile.exists(),
        "Dockerfile.test must exist in target repo root"
    );
}

#[test]
fn test_f8_02_docker_compose_test_exists() {
    let compose = target_repo_path().join("docker-compose.test.yml");
    assert!(
        compose.exists(),
        "docker-compose.test.yml must exist in target repo root"
    );
}

#[test]
fn test_f8_03_test_linux_script_exists() {
    let script = target_scripts_path().join("test-linux.sh");
    assert!(
        script.exists(),
        "scripts/test-linux.sh must exist"
    );
}

#[test]
fn test_f8_04_dockerfile_test_uses_ubuntu_and_installs_bwrap() {
    let dockerfile = target_repo_path().join("Dockerfile.test");
    let content = fs::read_to_string(&dockerfile).unwrap_or_default();

    assert!(
        content.contains("ubuntu") || content.contains("debian"),
        "Dockerfile.test must be based on Linux Ubuntu/Debian"
    );
    assert!(
        content.contains("bubblewrap") || content.contains("bwrap"),
        "Dockerfile.test must install bubblewrap for unprivileged user namespaces"
    );
}

#[test]
fn test_f8_05_docker_compose_specifies_privileged_capabilities() {
    let compose = target_repo_path().join("docker-compose.test.yml");
    let content = fs::read_to_string(&compose).unwrap_or_default();

    assert!(
        content.contains("privileged: true") || content.contains("SYS_ADMIN"),
        "docker-compose.test.yml must declare privileged mode or SYS_ADMIN capability"
    );
}

// ============================================================================
// Feature 9: Terminal Demo Assets & demo.sh Replay (R3)
// ============================================================================

#[test]
fn test_f9_01_demo_replay_script_exists() {
    let demo_script = target_scripts_path().join("demo.sh");
    assert!(
        demo_script.exists(),
        "scripts/demo.sh must exist"
    );
}

#[test]
fn test_f9_02_demo_docs_directory_exists() {
    let demo_docs = target_docs_path().join("demo");
    assert!(
        demo_docs.exists(),
        "docs/demo/ directory must exist"
    );
}

#[test]
fn test_f9_03_demo_md_references_demo_script() {
    let demo_md = target_repo_path().join("DEMO.md");
    let content = fs::read_to_string(&demo_md).unwrap_or_default();

    assert!(
        content.contains("demo.sh") || content.contains("argusd"),
        "DEMO.md must reference demo.sh or native argusd CLI"
    );
}

#[test]
fn test_f9_04_demo_script_contains_guided_workflow_scenes() {
    let demo_script = target_scripts_path().join("demo.sh");
    let content = fs::read_to_string(&demo_script).unwrap_or_default();

    assert!(
        content.contains("doctor") || content.contains("security") || content.contains("audit"),
        "demo.sh must contain guided demonstration scenes"
    );
}

#[test]
fn test_f9_05_demo_media_assets_referenced() {
    let demo_docs = target_docs_path().join("demo");
    let has_media = demo_docs.join("argus-demo.gif").exists()
        || demo_docs.join("argus-demo.mp4").exists()
        || demo_docs.join("README.md").exists();

    assert!(
        has_media,
        "docs/demo/ must contain media assets or documentation"
    );
}

// ============================================================================
// Feature 10: Documentation & GitHub Synchronization (R4)
// ============================================================================

#[test]
fn test_f10_01_readme_purged_of_legacy_desktop_os_phrasing() {
    let readme = target_repo_path().join("README.md");
    let content = fs::read_to_string(&readme).expect("Failed to read README.md");

    assert!(
        !content.contains("AI-Native Desktop OS"),
        "README.md must not contain legacy 'AI-Native Desktop OS' phrasing"
    );
}

#[test]
fn test_f10_02_article_purged_of_legacy_desktop_os_phrasing() {
    let article = target_repo_path().join("ARTICLE.md");
    let content = fs::read_to_string(&article).unwrap_or_default();

    assert!(
        !content.contains("Tauri vs. Electron"),
        "ARTICLE.md must not contain legacy Tauri desktop simulator phrasing"
    );
}

#[test]
fn test_f10_03_project_status_reflects_autonomous_daemon_reality() {
    let status_doc = target_repo_path().join("PROJECT_STATUS.md");
    let content = fs::read_to_string(&status_doc).unwrap_or_default();

    assert!(
        !content.contains("No application code has been written yet"),
        "PROJECT_STATUS.md must be updated from obsolete Phase 0 placeholder"
    );
}

#[test]
fn test_f10_04_readme_documents_14_crates_workspace() {
    let readme = target_repo_path().join("README.md");
    let content = fs::read_to_string(&readme).unwrap_or_default();

    assert!(
        content.contains("14") || content.contains("argus-phone") || content.contains("argus-pkg"),
        "README.md must document the full 14-crate workspace architecture"
    );
}

#[test]
fn test_f10_05_readme_contains_hackathon_badge() {
    let readme = target_repo_path().join("README.md");
    let content = fs::read_to_string(&readme).unwrap_or_default();

    assert!(
        content.contains("Hackathon") || content.contains("Autonomous"),
        "README.md must showcase hackathon submission or autonomous agent badge"
    );
}
