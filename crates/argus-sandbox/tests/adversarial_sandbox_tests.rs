use argus_sandbox::{LandlockSandbox, LandlockStatus, SandboxSupervisor};

#[test]
fn test_darwin_landlock_status_and_abi_consistency() {
    let temp = std::env::temp_dir().join("test_sandbox_darwin");
    let _ = std::fs::create_dir_all(&temp);
    let sandbox = LandlockSandbox::new(&temp);
    
    let status = sandbox.status();
    #[cfg(not(target_os = "linux"))]
    {
        assert_eq!(status, LandlockStatus::NonLinuxHost);
        assert_eq!(sandbox.apply_to_current_process(), LandlockStatus::NonLinuxHost);
    }
}

#[test]
fn test_sandbox_zero_timeout_kill() {
    let temp = std::env::temp_dir().join("test_sandbox_zero_timeout");
    let _ = std::fs::create_dir_all(&temp);
    let supervisor = SandboxSupervisor::new(temp);
    
    let res = supervisor.execute_command("sleep 1", 0);
    println!("DEBUG res0: {:?}", res);
    assert!(res.timed_out, "res was not timed_out: {:?}", res);
}

#[test]
fn test_sandbox_large_output_deadlock() {
    let temp = std::env::temp_dir().join("test_sandbox_output");
    let _ = std::fs::create_dir_all(&temp);
    let supervisor = SandboxSupervisor::new(temp);
    
    // Output 50,000 bytes. If pipes are not drained concurrently, it will deadlock on Darwin (16KB buffer)
    let res = supervisor.execute_command("python3 -c 'print(\"A\" * 50000)'", 2000);
    println!("DEBUG large_output res: {:?}", res);
    assert!(res.success, "Subprocess deadlocked and failed to complete: {:?}", res);
}
