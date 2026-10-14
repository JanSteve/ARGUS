use argus_process::{ProcessInfo, ProcessState, ProcessTree};
use std::time::Duration;

#[test]
fn test_tree_circularity_self_parent() {
    let p1 = ProcessInfo {
        pid: 1,
        ppid: 1,
        name: "init".into(),
        command: "init".into(),
        state: ProcessState::Running,
        cpu_percent: 0.0,
        memory_rss_bytes: 100,
        memory_virtual_bytes: 200,
        threads: 1,
        start_time: 0,
    };

    let tree = ProcessTree::build(vec![p1], Some(1));
    let (tx, rx) = std::sync::mpsc::channel();
    let tree_clone = ProcessTree {
        root_pid: tree.root_pid,
        nodes: tree.nodes.clone(),
    };
    std::thread::spawn(move || {
        let desc = tree_clone.descendants_of(1);
        let _ = tx.send(desc);
    });

    let res = rx.recv_timeout(Duration::from_millis(500));
    assert!(res.is_ok(), "descendants_of hung in infinite loop on self-parented cycle (pid=1, ppid=1)");
}

#[test]
fn test_tree_circularity_mutual_parent() {
    let p1 = ProcessInfo {
        pid: 10,
        ppid: 20,
        name: "proc_a".into(),
        command: "proc_a".into(),
        state: ProcessState::Running,
        cpu_percent: 0.0,
        memory_rss_bytes: 100,
        memory_virtual_bytes: 200,
        threads: 1,
        start_time: 0,
    };
    let p2 = ProcessInfo {
        pid: 20,
        ppid: 10,
        name: "proc_b".into(),
        command: "proc_b".into(),
        state: ProcessState::Running,
        cpu_percent: 0.0,
        memory_rss_bytes: 100,
        memory_virtual_bytes: 200,
        threads: 1,
        start_time: 0,
    };

    let tree = ProcessTree::build(vec![p1, p2], Some(10));
    let (tx, rx) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
        let desc = tree.descendants_of(10);
        let _ = tx.send(desc);
    });

    let res = rx.recv_timeout(Duration::from_millis(500));
    assert!(res.is_ok(), "descendants_of hung in infinite loop on mutual cyclic relationship (10 <-> 20)");
}

#[test]
fn test_tree_render_ascii_cycle() {
    let p1 = ProcessInfo {
        pid: 10,
        ppid: 20,
        name: "proc_a".into(),
        command: "proc_a".into(),
        state: ProcessState::Running,
        cpu_percent: 0.0,
        memory_rss_bytes: 100,
        memory_virtual_bytes: 200,
        threads: 1,
        start_time: 0,
    };
    let p2 = ProcessInfo {
        pid: 20,
        ppid: 10,
        name: "proc_b".into(),
        command: "proc_b".into(),
        state: ProcessState::Running,
        cpu_percent: 0.0,
        memory_rss_bytes: 100,
        memory_virtual_bytes: 200,
        threads: 1,
        start_time: 0,
    };

    let tree = ProcessTree::build(vec![p1, p2], Some(10));
    let handle = std::thread::spawn(move || {
        tree.render_ascii()
    });

    let res = handle.join();
    assert!(res.is_ok(), "render_ascii crashed with stack overflow on cyclic tree");
}
