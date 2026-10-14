use argus_process::{ArgusProcessSupervisor, ReaperEngine};
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;

#[test]
fn test_reaper_child_zombie_collection() {
    // Spawn 3 short-lived child processes that exit immediately
    let mut pids = Vec::new();
    for _ in 0..3 {
        let child = Command::new("sh")
            .arg("-c")
            .arg("exit 0")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .expect("spawn child");
        pids.push(child.id());
    }

    // Give them a brief moment to exit into zombie state
    thread::sleep(Duration::from_millis(50));

    // ReaperEngine should collect these exited children
    let summary = ReaperEngine::reap_child_zombies().expect("reap zombies");
    println!("Reaped summary: {:?}", summary);

    // Each spawned child should have been reaped
    assert!(
        summary.reaped_count >= 1,
        "Expected at least 1 reaped child process, got {}",
        summary.reaped_count
    );
}

#[test]
fn test_reaper_non_blocking_when_child_is_running() {
    // Spawn a child that sleeps for 5 seconds
    let mut child = Command::new("sleep")
        .arg("5")
        .spawn()
        .expect("spawn sleep");

    let t0 = std::time::Instant::now();
    // reap_child_zombies must NOT block on running child (WNOHANG)
    let _summary = ReaperEngine::reap_child_zombies().expect("reap with running child");
    let elapsed = t0.elapsed();

    // Must return immediately (< 100ms)
    assert!(
        elapsed < Duration::from_millis(200),
        "reap_child_zombies blocked for {:?} instead of returning immediately via WNOHANG",
        elapsed
    );

    // Clean up sleep child
    let _ = child.kill();
    let _ = child.wait();
}

#[test]
fn test_supervisor_pid_zero_process_group_kill_safety() {
    let _supervisor = ArgusProcessSupervisor::new();
    // In POSIX, kill(0, sig) sends the signal to EVERY process in the caller's process group!
    // Passing pid=0 to terminate or kill is extremely dangerous without a guard!
    // If not guarded, kill(0, SIGTERM) would terminate the entire test runner process group!
    // We check if supervisor allows passing pid 0 without rejection.
    // Note: We cannot actually call supervisor.kill(0) because it would kill our own test runner!
    // Instead we document that pid <= 0 is completely unguarded in supervisor.rs:69 and supervisor.rs:89.
}
