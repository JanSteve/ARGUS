use argus_sandbox::SandboxSupervisor;
use std::env;

#[test]
fn test_sandbox_timeout_hard_kill() {
    let temp_dir = env::temp_dir();
    let supervisor = SandboxSupervisor::new(temp_dir);

    // Command that would sleep for 10 seconds, but timeout is 100ms
    let t0 = std::time::Instant::now();
    let result = supervisor.execute_command("sleep 10", 100);
    let duration = t0.elapsed();

    assert!(result.timed_out, "Process must report timed_out = true");
    assert!(!result.success, "Timed out process must not report success");
    assert_eq!(result.exit_code, 124, "Timed out process should have exit code 124");
    assert!(
        duration.as_millis() < 1000,
        "Supervisor took {:?} to kill timed out process (expected < 1s)",
        duration
    );
}

#[test]
fn test_sandbox_zero_timeout_immediate_kill() {
    let temp_dir = env::temp_dir();
    let supervisor = SandboxSupervisor::new(temp_dir);

    // Timeout is 0ms
    let result = supervisor.execute_command("sleep 1", 0);
    assert!(result.timed_out, "Zero timeout must immediately trigger timeout");
}

#[test]
fn test_sandbox_invalid_command_non_zero_exit() {
    let temp_dir = env::temp_dir();
    let supervisor = SandboxSupervisor::new(temp_dir);

    let result = supervisor.execute_command("this_binary_does_not_exist_at_all_12345", 2000);
    assert!(!result.success);
    assert_ne!(result.exit_code, 0);
}
