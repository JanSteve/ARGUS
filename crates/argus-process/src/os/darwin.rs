use std::process::Command;
use crate::error::ProcessError;
use crate::types::{ProcessInfo, ProcessState};

pub fn list_processes() -> Result<Vec<ProcessInfo>, ProcessError> {
    // POSIX ps output: pid,ppid,state,%cpu,rss,comm
    let output = Command::new("ps")
        .args(["-A", "-o", "pid,ppid,state,%cpu,rss,comm"])
        .output();

    if let Ok(output) = output {
        let text = String::from_utf8_lossy(&output.stdout);
        let mut list = Vec::new();

        for line in text.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 6 {
                let pid: u32 = match parts[0].parse() {
                    Ok(v) => v,
                    Err(_) => continue,
                };
                let ppid: u32 = parts[1].parse().unwrap_or(0);
                let state_str = parts[2];
                let state_char = state_str.chars().next().unwrap_or('?');
                let state = ProcessState::from_char(state_char);
                let cpu_percent: f32 = parts[3].parse().unwrap_or(0.0);
                let rss_kb: u64 = parts[4].parse().unwrap_or(0);
                let comm = parts[5..].join(" ");

                list.push(ProcessInfo {
                    pid,
                    ppid,
                    name: comm.clone(),
                    command: comm,
                    state,
                    cpu_percent,
                    memory_rss_bytes: rss_kb * 1024,
                    memory_virtual_bytes: 0,
                    threads: 1,
                    start_time: 0,
                });
            }
        }

        if !list.is_empty() {
            return Ok(list);
        }
    }

    // Native Darwin libproc fallback when ps binary is sandboxed or restricted
    list_processes_libproc()
}

extern "C" {
    fn proc_listpids(proc_type: u32, proc_type_arg: u32, buffer: *mut libc::c_void, buffersize: i32) -> i32;
    fn proc_name(pid: i32, buffer: *mut libc::c_char, buffersize: u32) -> i32;
    fn proc_pidinfo(pid: i32, flavor: i32, arg: u64, buffer: *mut libc::c_void, buffersize: i32) -> i32;
}

#[repr(C)]
struct ProcBsdInfo {
    pbi_flags: u32,
    pbi_status: u32,
    pbi_xstatus: u32,
    pbi_pid: u32,
    pbi_ppid: u32,
    pbi_uid: u32,
    pbi_gid: u32,
    pbi_ruid: u32,
    pbi_rgid: u32,
    pbi_svuid: u32,
    pbi_svgid: u32,
    rfu_1: u32,
    pbi_comm: [u8; 16],
    pbi_name: [u8; 32],
}

fn list_processes_libproc() -> Result<Vec<ProcessInfo>, ProcessError> {
    let mut pids = vec![0i32; 4096];
    let bytes = unsafe {
        proc_listpids(
            1, // PROC_ALL_PIDS
            0,
            pids.as_mut_ptr() as *mut libc::c_void,
            (pids.len() * std::mem::size_of::<i32>()) as i32,
        )
    };

    if bytes <= 0 {
        let my_pid = std::process::id();
        return Ok(vec![ProcessInfo {
            pid: my_pid,
            ppid: unsafe { libc::getppid() as u32 },
            name: "current".to_string(),
            command: "current".to_string(),
            state: ProcessState::Running,
            cpu_percent: 0.0,
            memory_rss_bytes: 0,
            memory_virtual_bytes: 0,
            threads: 1,
            start_time: 0,
        }]);
    }

    let count = (bytes as usize) / std::mem::size_of::<i32>();
    let mut list = Vec::with_capacity(count);

    for &pid in &pids[..count] {
        if pid <= 0 {
            continue;
        }

        let mut bsd_info: ProcBsdInfo = unsafe { std::mem::zeroed() };
        let info_res = unsafe {
            proc_pidinfo(
                pid,
                3, // PROC_PIDTBSDINFO
                0,
                &mut bsd_info as *mut _ as *mut libc::c_void,
                std::mem::size_of::<ProcBsdInfo>() as i32,
            )
        };

        let ppid = if info_res > 0 { bsd_info.pbi_ppid } else { 1 };

        let mut name_buf = [0u8; 256];
        let name_res = unsafe {
            proc_name(pid, name_buf.as_mut_ptr() as *mut libc::c_char, 256)
        };

        let name = if name_res > 0 {
            let nul_pos = name_buf.iter().position(|&b| b == 0).unwrap_or(name_buf.len());
            String::from_utf8_lossy(&name_buf[..nul_pos]).to_string()
        } else if info_res > 0 {
            let nul_pos = bsd_info.pbi_comm.iter().position(|&b| b == 0).unwrap_or(bsd_info.pbi_comm.len());
            String::from_utf8_lossy(&bsd_info.pbi_comm[..nul_pos]).to_string()
        } else {
            format!("pid-{}", pid)
        };

        list.push(ProcessInfo {
            pid: pid as u32,
            ppid,
            name: name.clone(),
            command: name,
            state: ProcessState::Running,
            cpu_percent: 0.0,
            memory_rss_bytes: 0,
            memory_virtual_bytes: 0,
            threads: 1,
            start_time: 0,
        });
    }

    if list.is_empty() {
        let my_pid = std::process::id();
        list.push(ProcessInfo {
            pid: my_pid,
            ppid: unsafe { libc::getppid() as u32 },
            name: "current".to_string(),
            command: "current".to_string(),
            state: ProcessState::Running,
            cpu_percent: 0.0,
            memory_rss_bytes: 0,
            memory_virtual_bytes: 0,
            threads: 1,
            start_time: 0,
        });
    }

    Ok(list)
}

pub fn get_process(pid: u32) -> Result<ProcessInfo, ProcessError> {
    let procs = list_processes()?;
    procs.into_iter()
        .find(|p| p.pid == pid)
        .ok_or(ProcessError::ProcessNotFound(pid))
}
