//! # ARGUS System Telemetry & Health Monitoring
//!
//! Read-only system telemetry engine that reads CPU, memory, disk, network,
//! and overall health data from Linux `/proc` pseudo-filesystem entries
//! with macOS fallbacks via `sysctl` and standard POSIX commands.

use serde::{Deserialize, Serialize};


// ─── CPU ───────────────────────────────────────────────────────────────

/// CPU hardware and architecture information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
    pub model_name: String,
    pub cores: usize,
    pub threads: usize,
    pub architecture: String,
    pub frequency_mhz: f64,
}

impl CpuInfo {
    /// Collect CPU information from the host system.
    pub fn collect() -> Self {
        #[cfg(target_os = "linux")]
        {
            Self::collect_linux()
        }
        #[cfg(not(target_os = "linux"))]
        {
            Self::collect_fallback()
        }
    }

    #[cfg(target_os = "linux")]
    fn collect_linux() -> Self {
        let content = std::fs::read_to_string("/proc/cpuinfo").unwrap_or_default();
        let mut model = String::from("Unknown");
        let mut freq: f64 = 0.0;
        let mut processors: usize = 0;
        let mut cores: usize = 0;

        for line in content.lines() {
            if let Some(val) = line.strip_prefix("model name") {
                model = val.trim_start_matches(|c: char| c == ':' || c == '\t' || c == ' ').to_string();
            } else if let Some(val) = line.strip_prefix("cpu MHz") {
                freq = val.trim_start_matches(|c: char| c == ':' || c == '\t' || c == ' ')
                    .parse().unwrap_or(0.0);
            } else if line.starts_with("processor") {
                processors += 1;
            } else if let Some(val) = line.strip_prefix("cpu cores") {
                cores = val.trim_start_matches(|c: char| c == ':' || c == '\t' || c == ' ')
                    .parse().unwrap_or(0);
            }
        }
        if cores == 0 { cores = processors; }
        let arch = std::env::consts::ARCH.to_string();
        CpuInfo { model_name: model, cores, threads: processors, architecture: arch, frequency_mhz: freq }
    }

    #[cfg(not(target_os = "linux"))]
    fn collect_fallback() -> Self {
        let model = run_cmd("sysctl", &["-n", "machdep.cpu.brand_string"])
            .unwrap_or_else(|| "Unknown".into());
        let cores: usize = run_cmd("sysctl", &["-n", "hw.physicalcpu"])
            .and_then(|s| s.trim().parse().ok()).unwrap_or(1);
        let threads: usize = run_cmd("sysctl", &["-n", "hw.logicalcpu"])
            .and_then(|s| s.trim().parse().ok()).unwrap_or(cores);
        let freq: f64 = run_cmd("sysctl", &["-n", "hw.cpufrequency"])
            .and_then(|s| s.trim().parse::<f64>().ok())
            .map(|hz| hz / 1_000_000.0).unwrap_or(0.0);
        CpuInfo {
            model_name: model.trim().to_string(),
            cores, threads,
            architecture: std::env::consts::ARCH.to_string(),
            frequency_mhz: freq,
        }
    }
}

// ─── Memory ────────────────────────────────────────────────────────────

/// System memory information in kilobytes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryInfo {
    pub total_kb: u64,
    pub available_kb: u64,
    pub used_kb: u64,
    pub free_kb: u64,
    pub swap_total_kb: u64,
    pub swap_used_kb: u64,
    pub usage_percent: f64,
}

impl MemoryInfo {
    /// Collect memory information from the host system.
    pub fn collect() -> Self {
        #[cfg(target_os = "linux")]
        {
            Self::collect_linux()
        }
        #[cfg(not(target_os = "linux"))]
        {
            Self::collect_fallback()
        }
    }

    #[cfg(target_os = "linux")]
    fn collect_linux() -> Self {
        let content = std::fs::read_to_string("/proc/meminfo").unwrap_or_default();
        let mut map: HashMap<String, u64> = HashMap::new();
        for line in content.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let key = parts[0].trim_end_matches(':').to_string();
                if let Ok(val) = parts[1].parse::<u64>() {
                    map.insert(key, val);
                }
            }
        }
        let total = *map.get("MemTotal").unwrap_or(&0);
        let free = *map.get("MemFree").unwrap_or(&0);
        let available = *map.get("MemAvailable").unwrap_or(&free);
        let used = total.saturating_sub(available);
        let swap_total = *map.get("SwapTotal").unwrap_or(&0);
        let swap_free = *map.get("SwapFree").unwrap_or(&0);
        let usage = if total > 0 { (used as f64 / total as f64) * 100.0 } else { 0.0 };
        MemoryInfo {
            total_kb: total, available_kb: available, used_kb: used, free_kb: free,
            swap_total_kb: swap_total, swap_used_kb: swap_total.saturating_sub(swap_free),
            usage_percent: usage,
        }
    }

    #[cfg(not(target_os = "linux"))]
    fn collect_fallback() -> Self {
        let total: u64 = run_cmd("sysctl", &["-n", "hw.memsize"])
            .and_then(|s| s.trim().parse().ok()).unwrap_or(0) / 1024;
        // On macOS, use vm_stat for page-level info
        let page_size: u64 = run_cmd("sysctl", &["-n", "hw.pagesize"])
            .and_then(|s| s.trim().parse().ok()).unwrap_or(4096);
        let vm_stat = run_cmd("vm_stat", &[]).unwrap_or_default();
        let mut pages_free: u64 = 0;
        let mut _pages_active: u64 = 0;
        let mut pages_inactive: u64 = 0;
        let mut pages_speculative: u64 = 0;
        for line in vm_stat.lines() {
            let val = || -> Option<u64> {
                line.split(':').nth(1)?.trim().trim_end_matches('.').parse().ok()
            };
            if line.contains("Pages free") { pages_free = val().unwrap_or(0); }
            else if line.contains("Pages active") { _pages_active = val().unwrap_or(0); }
            else if line.contains("Pages inactive") { pages_inactive = val().unwrap_or(0); }
            else if line.contains("Pages speculative") { pages_speculative = val().unwrap_or(0); }
        }
        let free_kb = (pages_free + pages_speculative) * page_size / 1024;
        let available_kb = (pages_free + pages_inactive + pages_speculative) * page_size / 1024;
        let used_kb = total.saturating_sub(available_kb);
        let usage = if total > 0 { (used_kb as f64 / total as f64) * 100.0 } else { 0.0 };
        MemoryInfo {
            total_kb: total, available_kb, used_kb, free_kb,
            swap_total_kb: 0, swap_used_kb: 0, usage_percent: usage,
        }
    }
}

// ─── Disk ──────────────────────────────────────────────────────────────

/// Mounted filesystem disk usage information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub filesystem: String,
    pub mount_point: String,
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f64,
}

/// Enumerate disk usage for all mounted filesystems.
pub fn get_disk_info() -> Vec<DiskInfo> {
    let output = std::process::Command::new("df")
        .args(["-k"]) // 1K blocks, works on both Linux and macOS
        .output();
    let output = match output {
        Ok(o) => String::from_utf8_lossy(&o.stdout).to_string(),
        Err(_) => return Vec::new(),
    };
    let mut disks = Vec::new();
    for line in output.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 6 {
            let total: u64 = parts[1].parse().unwrap_or(0) * 1024;
            let used: u64 = parts[2].parse().unwrap_or(0) * 1024;
            let avail: u64 = parts[3].parse().unwrap_or(0) * 1024;
            let pct = if total > 0 { (used as f64 / total as f64) * 100.0 } else { 0.0 };
            let mount = parts.last().unwrap_or(&"/").to_string();
            disks.push(DiskInfo {
                filesystem: parts[0].to_string(),
                mount_point: mount,
                total_bytes: total, used_bytes: used, available_bytes: avail,
                usage_percent: pct,
            });
        }
    }
    disks
}

// ─── Network Interfaces ────────────────────────────────────────────────

/// Network interface telemetry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
    pub rx_packets: u64,
    pub tx_packets: u64,
    pub is_up: bool,
}

/// Enumerate network interfaces and their traffic counters.
pub fn get_network_interfaces() -> Vec<NetworkInterfaceInfo> {
    #[cfg(target_os = "linux")]
    {
        get_network_linux()
    }
    #[cfg(not(target_os = "linux"))]
    {
        get_network_fallback()
    }
}

#[cfg(target_os = "linux")]
fn get_network_linux() -> Vec<NetworkInterfaceInfo> {
    let content = std::fs::read_to_string("/proc/net/dev").unwrap_or_default();
    let mut ifaces = Vec::new();
    for line in content.lines().skip(2) {
        let line = line.trim();
        if let Some((name, rest)) = line.split_once(':') {
            let vals: Vec<u64> = rest.split_whitespace()
                .filter_map(|s| s.parse().ok()).collect();
            if vals.len() >= 10 {
                ifaces.push(NetworkInterfaceInfo {
                    name: name.trim().to_string(),
                    rx_bytes: vals[0], rx_packets: vals[1],
                    tx_bytes: vals[8], tx_packets: vals[9],
                    is_up: vals[0] > 0 || vals[8] > 0,
                });
            }
        }
    }
    ifaces
}

#[cfg(not(target_os = "linux"))]
fn get_network_fallback() -> Vec<NetworkInterfaceInfo> {
    let output = run_cmd("netstat", &["-ib"]).unwrap_or_default();
    let mut ifaces = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for line in output.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 7 {
            let name = parts[0].to_string();
            if seen.contains(&name) { continue; }
            seen.insert(name.clone());
            let rx_packets: u64 = parts[4].parse().unwrap_or(0);
            let tx_packets: u64 = parts[6].parse().unwrap_or(0);
            ifaces.push(NetworkInterfaceInfo {
                name, rx_bytes: 0, tx_bytes: 0,
                rx_packets, tx_packets,
                is_up: rx_packets > 0 || tx_packets > 0,
            });
        }
    }
    ifaces
}

// ─── Health Report ─────────────────────────────────────────────────────

/// Unified system health report aggregating all subsystem telemetry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemHealthReport {
    pub hostname: String,
    pub kernel_version: String,
    pub uptime_seconds: f64,
    pub load_average: [f64; 3],
    pub cpu: CpuInfo,
    pub memory: MemoryInfo,
    pub disks: Vec<DiskInfo>,
    pub network_interfaces: Vec<NetworkInterfaceInfo>,
    pub process_count: usize,
    pub timestamp: String,
}

/// System health check generator.
pub struct SystemHealthCheck;

impl SystemHealthCheck {
    /// Generate a complete system health report.
    pub fn generate_report() -> SystemHealthReport {
        let hostname = Self::read_hostname();
        let kernel = Self::read_kernel_version();
        let uptime = Self::read_uptime();
        let loadavg = Self::read_loadavg();
        let proc_count = Self::read_process_count();

        SystemHealthReport {
            hostname, kernel_version: kernel, uptime_seconds: uptime,
            load_average: loadavg,
            cpu: CpuInfo::collect(),
            memory: MemoryInfo::collect(),
            disks: get_disk_info(),
            network_interfaces: get_network_interfaces(),
            process_count: proc_count,
            timestamp: chrono_now(),
        }
    }

    /// Print a formatted diagnostic report to stdout.
    pub fn print_diagnostic() {
        let r = Self::generate_report();
        println!("╔══════════════════════════════════════════════════════════════╗");
        println!("║           ARGUS SYSTEM HEALTH DIAGNOSTIC                    ║");
        println!("╠══════════════════════════════════════════════════════════════╣");
        println!("║ Hostname      : {:<44}║", r.hostname);
        println!("║ Kernel        : {:<44}║", r.kernel_version);
        println!("║ Uptime        : {:<44}║", format_uptime(r.uptime_seconds));
        println!("║ Load Average  : {:.2} / {:.2} / {:.2}{:>28}║",
            r.load_average[0], r.load_average[1], r.load_average[2], "");
        println!("║ Processes     : {:<44}║", r.process_count);
        println!("╠══════════════════════════════════════════════════════════════╣");
        println!("║ CPU           : {:<44}║", r.cpu.model_name.chars().take(44).collect::<String>());
        println!("║   Cores/Threads: {}/{:<40}║", r.cpu.cores, r.cpu.threads);
        println!("║   Architecture : {:<44}║", r.cpu.architecture);
        println!("╠══════════════════════════════════════════════════════════════╣");
        println!("║ Memory        : {:.1}% used ({} / {} MB){:>20}║",
            r.memory.usage_percent, r.memory.used_kb / 1024, r.memory.total_kb / 1024, "");
        println!("║ Swap          : {} / {} MB{:>32}║",
            r.memory.swap_used_kb / 1024, r.memory.swap_total_kb / 1024, "");
        println!("╠══════════════════════════════════════════════════════════════╣");
        for d in &r.disks {
            println!("║ Disk {:<8} : {:.1}% ({} / {} GB){:>18}║",
                d.mount_point.chars().take(8).collect::<String>(),
                d.usage_percent,
                d.used_bytes / 1_073_741_824,
                d.total_bytes / 1_073_741_824, "");
        }
        println!("╠══════════════════════════════════════════════════════════════╣");
        for n in &r.network_interfaces {
            println!("║ Net {:<10} : rx={} tx={} {}{:>18}║",
                n.name.chars().take(10).collect::<String>(),
                human_bytes(n.rx_bytes), human_bytes(n.tx_bytes),
                if n.is_up { "UP" } else { "DOWN" }, "");
        }
        println!("╚══════════════════════════════════════════════════════════════╝");
    }

    fn read_hostname() -> String {
        #[cfg(target_os = "linux")]
        { std::fs::read_to_string("/proc/sys/kernel/hostname").unwrap_or_default().trim().to_string() }
        #[cfg(not(target_os = "linux"))]
        { run_cmd("hostname", &[]).unwrap_or_else(|| "unknown".into()).trim().to_string() }
    }

    fn read_kernel_version() -> String {
        #[cfg(target_os = "linux")]
        { std::fs::read_to_string("/proc/version").unwrap_or_default().trim().to_string() }
        #[cfg(not(target_os = "linux"))]
        { run_cmd("uname", &["-srm"]).unwrap_or_else(|| "unknown".into()).trim().to_string() }
    }

    fn read_uptime() -> f64 {
        #[cfg(target_os = "linux")]
        {
            std::fs::read_to_string("/proc/uptime").unwrap_or_default()
                .split_whitespace().next()
                .and_then(|s| s.parse().ok()).unwrap_or(0.0)
        }
        #[cfg(not(target_os = "linux"))]
        {
            run_cmd("sysctl", &["-n", "kern.boottime"])
                .and_then(|s| {
                    // parse "{ sec = 1234567890, usec = 0 }" format
                    s.split("sec = ").nth(1)?
                        .split(',').next()?
                        .trim().parse::<u64>().ok()
                })
                .map(|boot| {
                    let now = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
                    (now - boot) as f64
                }).unwrap_or(0.0)
        }
    }

    fn read_loadavg() -> [f64; 3] {
        #[cfg(target_os = "linux")]
        {
            let content = std::fs::read_to_string("/proc/loadavg").unwrap_or_default();
            let vals: Vec<f64> = content.split_whitespace()
                .take(3).filter_map(|s| s.parse().ok()).collect();
            [
                vals.first().copied().unwrap_or(0.0),
                vals.get(1).copied().unwrap_or(0.0),
                vals.get(2).copied().unwrap_or(0.0),
            ]
        }
        #[cfg(not(target_os = "linux"))]
        {
            run_cmd("sysctl", &["-n", "vm.loadavg"])
                .map(|s| {
                    let nums: Vec<f64> = s.trim_matches(|c: char| c == '{' || c == '}' || c.is_whitespace())
                        .split_whitespace().filter_map(|v| v.parse().ok()).collect();
                    [
                        nums.first().copied().unwrap_or(0.0),
                        nums.get(1).copied().unwrap_or(0.0),
                        nums.get(2).copied().unwrap_or(0.0),
                    ]
                }).unwrap_or([0.0; 3])
        }
    }

    fn read_process_count() -> usize {
        #[cfg(target_os = "linux")]
        {
            std::fs::read_dir("/proc").map(|entries| {
                entries.filter_map(|e| e.ok())
                    .filter(|e| e.file_name().to_str().map(|s| s.chars().all(|c| c.is_ascii_digit())).unwrap_or(false))
                    .count()
            }).unwrap_or(0)
        }
        #[cfg(not(target_os = "linux"))]
        {
            run_cmd("ps", &["-ax"]).map(|s| s.lines().count().saturating_sub(1)).unwrap_or(0)
        }
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────

#[cfg(not(target_os = "linux"))]
fn run_cmd(cmd: &str, args: &[&str]) -> Option<String> {
    std::process::Command::new(cmd).args(args).output().ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
}

fn chrono_now() -> String {
    let d = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
    format!("{}s since epoch", d.as_secs())
}

fn format_uptime(secs: f64) -> String {
    let s = secs as u64;
    let days = s / 86400;
    let hours = (s % 86400) / 3600;
    let mins = (s % 3600) / 60;
    format!("{}d {}h {}m", days, hours, mins)
}

fn human_bytes(bytes: u64) -> String {
    if bytes >= 1_073_741_824 { format!("{:.1}GB", bytes as f64 / 1_073_741_824.0) }
    else if bytes >= 1_048_576 { format!("{:.1}MB", bytes as f64 / 1_048_576.0) }
    else if bytes >= 1024 { format!("{:.1}KB", bytes as f64 / 1024.0) }
    else { format!("{}B", bytes) }
}

// ─── Tests ─────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpu_info_parses() {
        let info = CpuInfo::collect();
        assert!(!info.model_name.is_empty(), "CPU model name should not be empty");
        assert!(info.cores > 0, "Should have at least 1 core");
        assert!(info.threads > 0, "Should have at least 1 thread");
        assert!(!info.architecture.is_empty());
    }

    #[test]
    fn test_memory_info_parses() {
        let mem = MemoryInfo::collect();
        assert!(mem.total_kb > 0, "Total memory should be > 0");
        assert!(mem.usage_percent >= 0.0 && mem.usage_percent <= 100.0);
    }

    #[test]
    fn test_disk_info_parses() {
        let disks = get_disk_info();
        assert!(!disks.is_empty(), "Should have at least 1 disk");
        assert!(disks[0].total_bytes > 0);
    }

    #[test]
    fn test_network_interfaces_parses() {
        let ifaces = get_network_interfaces();
        assert!(!ifaces.is_empty(), "Should have at least 1 network interface");
    }

    #[test]
    fn test_health_report_generates() {
        let report = SystemHealthCheck::generate_report();
        assert!(!report.hostname.is_empty());
        assert!(report.cpu.cores > 0);
        assert!(report.memory.total_kb > 0);
        assert!(!report.timestamp.is_empty());
    }

    #[test]
    fn test_health_report_serializes() {
        let report = SystemHealthCheck::generate_report();
        let json = serde_json::to_string(&report).expect("Should serialize");
        let _: SystemHealthReport = serde_json::from_str(&json).expect("Should deserialize");
    }
}
