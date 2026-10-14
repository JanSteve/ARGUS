use argus_service::PidFileManager;
use std::fs;

#[test]
fn test_pid_file_corrupt_content_handled() {
    let temp_file = std::env::temp_dir().join(format!("test_corrupt_{}.pid", std::process::id()));
    fs::write(&temp_file, b"not_a_number_abc\n").unwrap();

    let manager = PidFileManager::new(Some(temp_file.clone()));
    let read_res = manager.read_pid();

    assert!(read_res.is_err(), "Corrupt PID file must return InvalidPid error");
    let _ = fs::remove_file(&temp_file);
}

#[test]
fn test_pid_file_negative_number_handled() {
    let temp_file = std::env::temp_dir().join(format!("test_negative_{}.pid", std::process::id()));
    fs::write(&temp_file, b"-12345\n").unwrap();

    let manager = PidFileManager::new(Some(temp_file.clone()));
    let read_res = manager.read_pid();

    assert!(read_res.is_err(), "Negative PID must return InvalidPid error");
    let _ = fs::remove_file(&temp_file);
}

#[test]
fn test_pid_file_already_running_protection() {
    let temp_file = std::env::temp_dir().join(format!("test_running_{}.pid", std::process::id()));
    let manager = PidFileManager::new(Some(temp_file.clone()));

    // Write current process PID (which is definitely running)
    let my_pid = std::process::id();
    manager.write_pid(my_pid).unwrap();

    // Now attempt to write a different PID while current process is still running
    let other_pid = if my_pid > 10 { my_pid - 1 } else { my_pid + 1 };
    let overwrite_res = manager.write_pid(other_pid);

    assert!(
        overwrite_res.is_err(),
        "Attempting to overwrite PID file of an active process must return AlreadyRunning"
    );

    let _ = manager.remove_pid();
}
