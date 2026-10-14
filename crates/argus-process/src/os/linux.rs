use std::fs;
use std::path::Path;
use crate::error::ProcessError;
use crate::types::{ProcessInfo, ProcessState};

pub fn list_processes() -> Result<Vec<ProcessInfo>, ProcessError> {
    let mut list = Vec::new();
    let proc_dir = Path::new("/proc");
    if !proc_dir.exists() {
        return Ok(list);
    }

    for entry in fs::read_dir(proc_dir)? {
        let entry = entry?;
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if let Ok(pid) = name_str.parse::<u32>() {
            if let Ok(info) = get_process(pid) {
                list.push(info);
            }
        }
    }

    Ok(list)
}

pub fn get_process(pid: u32) -> Result<ProcessInfo, ProcessError> {
    let stat_file = format!("/proc/{}/stat", pid);
    let stat_content = fs::read_to_string(&stat_file)
        .map_err(|_| ProcessError::ProcessNotFound(pid))?;

    // Format: pid (comm) state ppid ...
    let open_paren = stat_content.find('(').ok_or_else(|| ProcessError::ParseError("Missing open paren in /proc/stat".into()))?;
    let close_paren = stat_content.rfind(')').ok_or_else(|| ProcessError::ParseError("Missing close paren in /proc/stat".into()))?;

    let name = stat_content[open_paren + 1..close_paren].to_string();
    let rest = &stat_content[close_paren + 2..];
    let parts: Vec<&str> = rest.split_whitespace().collect();

    let state_char = parts.get(0).and_then(|s| s.chars().next()).unwrap_or('?');
    let state = ProcessState::from_char(state_char);
    let ppid: u32 = parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(0);
    let threads: u32 = parts.get(17).and_then(|s| s.parse().ok()).unwrap_or(1);

    // Read cmdline
    let cmd_file = format!("/proc/{}/cmdline", pid);
    let cmd = fs::read_to_string(&cmd_file)
        .map(|s| s.replace('\0', " ").trim().to_string())
        .unwrap_or_else(|_| name.clone());

    // Read statm for memory (pages * 4096)
    let (vsz, rss) = if let Ok(statm) = fs::read_to_string(format!("/proc/{}/statm", pid)) {
        let tokens: Vec<&str> = statm.split_whitespace().collect();
        let total_pages: u64 = tokens.get(0).and_then(|s| s.parse().ok()).unwrap_or(0);
        let resident_pages: u64 = tokens.get(1).and_then(|s| s.parse().ok()).unwrap_or(0);
        (total_pages * 4096, resident_pages * 4096)
    } else {
        (0, 0)
    };

    Ok(ProcessInfo {
        pid,
        ppid,
        name,
        command: if cmd.is_empty() { name.clone() } else { cmd },
        state,
        cpu_percent: 0.0,
        memory_rss_bytes: rss,
        memory_virtual_bytes: vsz,
        threads,
        start_time: 0,
    })
}
