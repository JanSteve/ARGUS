//! # ARGUS Network Governance & Incident Remediation
//!
//! Provides network socket inspection, blocked port collision detection and autonomous
//! remediation (e.g. port 8080 collision resolution), DNS auditing, and zero-trust SSRF guards.

use argus_core::RiskLevel;
use serde::{Deserialize, Serialize};
use std::fmt;
use std::fs;
use std::io;
use std::net::{IpAddr, Ipv4Addr, TcpListener, ToSocketAddrs};
use std::process::Command;
use std::time::Instant;

// ─── Error Types ─────────────────────────────────────────────────────────────

#[derive(Debug)]
pub enum NetError {
    IoError(io::Error),
    PortBlocked(u16, u32),
    PortNotInUse(u16),
    ProcessTerminationFailed(u32, String),
    SsrfViolation(String),
    DnsResolutionFailed(String),
    ParseError(String),
}

impl fmt::Display for NetError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NetError::IoError(e) => write!(f, "Network I/O error: {}", e),
            NetError::PortBlocked(port, pid) => {
                write!(f, "Port {} is blocked by process PID {}", port, pid)
            }
            NetError::PortNotInUse(port) => write!(f, "Port {} is not in use", port),
            NetError::ProcessTerminationFailed(pid, msg) => {
                write!(f, "Failed to terminate process PID {}: {}", pid, msg)
            }
            NetError::SsrfViolation(msg) => write!(f, "SSRF Guard Violation: {}", msg),
            NetError::DnsResolutionFailed(msg) => write!(f, "DNS resolution failed: {}", msg),
            NetError::ParseError(msg) => write!(f, "Network parse error: {}", msg),
        }
    }
}

impl std::error::Error for NetError {}

impl From<io::Error> for NetError {
    fn from(e: io::Error) -> Self {
        NetError::IoError(e)
    }
}

// ─── Socket Inspection ───────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Protocol {
    Tcp,
    Udp,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SocketBinding {
    pub protocol: Protocol,
    pub local_address: String,
    pub local_port: u16,
    pub state: String,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
}

pub struct SocketInspector;

impl SocketInspector {
    /// Inspects and lists listening sockets on the host system.
    pub fn list_listening_sockets() -> Vec<SocketBinding> {
        #[cfg(target_os = "linux")]
        {
            Self::list_linux()
        }
        #[cfg(not(target_os = "linux"))]
        {
            Self::list_darwin()
        }
    }

    /// Finds the PID and process name currently bound to a given port.
    pub fn find_process_on_port(port: u16) -> Option<(u32, String)> {
        let sockets = Self::list_listening_sockets();
        for s in sockets {
            if s.local_port == port {
                if let Some(pid) = s.pid {
                    let name = s.process_name.unwrap_or_else(|| "unknown".into());
                    return Some((pid, name));
                }
            }
        }
        None
    }

    #[cfg(target_os = "linux")]
    fn list_linux() -> Vec<SocketBinding> {
        let mut bindings = Vec::new();
        if let Ok(content) = fs::read_to_string("/proc/net/tcp") {
            for line in content.lines().skip(1) {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 4 {
                    let local_hex = parts[1];
                    let state_hex = parts[3];
                    // State 0A = TCP_LISTEN
                    if state_hex == "0A" {
                        if let Some((ip, port)) = parse_proc_net_addr(local_hex) {
                            let inode = parts.get(9).and_then(|s| s.parse::<u64>().ok());
                            let (pid, name) = inode.and_then(find_pid_by_socket_inode).unzip();
                            bindings.push(SocketBinding {
                                protocol: Protocol::Tcp,
                                local_address: ip,
                                local_port: port,
                                state: "LISTEN".to_string(),
                                pid,
                                process_name: name,
                            });
                        }
                    }
                }
            }
        }
        bindings
    }

    #[cfg(not(target_os = "linux"))]
    fn list_darwin() -> Vec<SocketBinding> {
        let mut bindings = Vec::new();
        let output = Command::new("lsof")
            .args(["-iTCP", "-sTCP:LISTEN", "-n", "-P"])
            .output();

        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines().skip(1) {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 9 {
                    let proc_name = parts[0].to_string();
                    let pid = parts[1].parse::<u32>().ok();
                    let addr_part = parts[8];
                    if let Some(pos) = addr_part.rfind(':') {
                        let ip = &addr_part[..pos];
                        let port_str = &addr_part[pos + 1..];
                        let clean_port = port_str.trim_end_matches(|c: char| !c.is_ascii_digit());
                        if let Ok(port) = clean_port.parse::<u16>() {
                            bindings.push(SocketBinding {
                                protocol: Protocol::Tcp,
                                local_address: ip.to_string(),
                                local_port: port,
                                state: "LISTEN".to_string(),
                                pid,
                                process_name: Some(proc_name),
                            });
                        }
                    }
                }
            }
        }
        bindings
    }
}

// ─── Blocked Port Detection & Incident Remediation ───────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortCollisionDiagnosis {
    pub port: u16,
    pub is_blocked: bool,
    pub occupying_pid: Option<u32>,
    pub process_name: Option<String>,
    pub command_line: Option<String>,
    pub severity: RiskLevel,
    pub suggested_remediation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemediationResult {
    pub port: u16,
    pub success: bool,
    pub terminated_pid: Option<u32>,
    pub action_taken: String,
    pub duration_ms: u64,
}

pub struct PortCollisionRemediator;

impl PortCollisionRemediator {
    /// Detects if a port is currently blocked by attempting to bind it.
    pub fn is_port_blocked(port: u16) -> bool {
        match TcpListener::bind(("127.0.0.1", port)) {
            Ok(listener) => {
                drop(listener);
                false
            }
            Err(_) => true,
        }
    }

    /// Performs an autonomous diagnosis of the blocked port condition.
    pub fn diagnose(port: u16) -> PortCollisionDiagnosis {
        let is_blocked = Self::is_port_blocked(port);
        let occupant = if is_blocked {
            SocketInspector::find_process_on_port(port)
        } else {
            None
        };

        let (pid, name) = match occupant {
            Some((p, n)) => (Some(p), Some(n)),
            None => (None, None),
        };

        let cmdline = pid.and_then(get_cmdline_for_pid);

        let (severity, remediation) = if is_blocked {
            if let Some(p) = pid {
                if p <= 1 || name.as_deref() == Some("systemd") || name.as_deref() == Some("init") {
                    (
                        RiskLevel::CRITICAL,
                        "Blocked by system PID; do not kill. Reassign application port.".to_string(),
                    )
                } else {
                    (
                        RiskLevel::HIGH,
                        format!("Terminate rogue/orphaned process PID {} ({:?}) to release port {}.", p, name, port),
                    )
                }
            } else {
                (
                    RiskLevel::MEDIUM,
                    format!("Port {} is occupied by non-enumerated process.", port),
                )
            }
        } else {
            (RiskLevel::LOW, format!("Port {} is free for allocation.", port))
        };

        PortCollisionDiagnosis {
            port,
            is_blocked,
            occupying_pid: pid,
            process_name: name,
            command_line: cmdline,
            severity,
            suggested_remediation: remediation,
        }
    }

    /// Autonomously remediates a port collision incident by terminating the rogue process.
    pub fn remediate(port: u16, force: bool) -> Result<RemediationResult, NetError> {
        let start = Instant::now();
        let diag = Self::diagnose(port);

        if !diag.is_blocked {
            return Ok(RemediationResult {
                port,
                success: true,
                terminated_pid: None,
                action_taken: "Port was already free; no action needed".to_string(),
                duration_ms: start.elapsed().as_millis() as u64,
            });
        }

        let pid = match diag.occupying_pid {
            Some(p) => p,
            None => {
                return Err(NetError::ProcessTerminationFailed(
                    0,
                    format!("Could not identify PID occupying port {}", port),
                ));
            }
        };

        // Safety Invariant: Never terminate system PID 1 or self
        if pid <= 1 || pid == std::process::id() {
            return Err(NetError::ProcessTerminationFailed(
                pid,
                "Security Policy Refusal: Cannot terminate PID <= 1 or current process".to_string(),
            ));
        }

        unsafe {
            libc::kill(pid as libc::pid_t, libc::SIGTERM);
        }

        let mut released = false;
        for _ in 0..10 {
            std::thread::sleep(std::time::Duration::from_millis(100));
            if !Self::is_port_blocked(port) {
                released = true;
                break;
            }
        }

        if !released && force {
            unsafe {
                libc::kill(pid as libc::pid_t, libc::SIGKILL);
            }
            std::thread::sleep(std::time::Duration::from_millis(100));
            released = !Self::is_port_blocked(port);
        }

        if released {
            Ok(RemediationResult {
                port,
                success: true,
                terminated_pid: Some(pid),
                action_taken: format!(
                    "Terminated colliding process PID {} ({:?}); port {} liberated",
                    pid, diag.process_name, port
                ),
                duration_ms: start.elapsed().as_millis() as u64,
            })
        } else {
            Err(NetError::ProcessTerminationFailed(
                pid,
                format!("Failed to liberate port {} after termination signals", port),
            ))
        }
    }
}

// ─── DNS Query Auditing & Rebinding Defense ──────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DnsAuditReport {
    pub query_target: String,
    pub resolved_ips: Vec<String>,
    pub nameservers: Vec<String>,
    pub is_dns_rebinding: bool,
    pub entropy_score: f64,
    pub risk_level: RiskLevel,
    pub duration_ms: u64,
}

pub struct DnsAuditor;

impl DnsAuditor {
    /// Audits a domain lookup, checking for DNS rebinding and anomalies.
    pub fn audit(domain: &str) -> Result<DnsAuditReport, NetError> {
        let start = Instant::now();
        let target_with_port = format!("{}:80", domain);
        let ips: Vec<IpAddr> = target_with_port
            .to_socket_addrs()
            .map_err(|e| NetError::DnsResolutionFailed(e.to_string()))?
            .map(|addr| addr.ip())
            .collect();

        let mut rebinding = false;
        let mut resolved_strings = Vec::new();

        for ip in &ips {
            resolved_strings.push(ip.to_string());
            let clean = domain.trim().trim_start_matches("http://").trim_start_matches("https://");
            let clean = clean.split('/').next().unwrap_or(clean);
            let clean = clean.split(':').next().unwrap_or(clean);
            if clean != "localhost" && clean != "127.0.0.1" && clean != "::1" {
                if SsrfGuard::is_private_or_loopback(*ip) {
                    rebinding = true;
                }
            }
        }

        let entropy = calculate_shannon_entropy(domain);
        let nameservers = read_system_nameservers();

        let risk = if rebinding {
            RiskLevel::CRITICAL
        } else if entropy > 4.2 && domain.len() > 18 {
            RiskLevel::HIGH
        } else {
            RiskLevel::LOW
        };

        Ok(DnsAuditReport {
            query_target: domain.to_string(),
            resolved_ips: resolved_strings,
            nameservers,
            is_dns_rebinding: rebinding,
            entropy_score: entropy,
            risk_level: risk,
            duration_ms: start.elapsed().as_millis() as u64,
        })
    }
}

// ─── SSRF Guard ──────────────────────────────────────────────────────────────

pub struct SsrfGuard;

impl SsrfGuard {
    /// Evaluates if an IP is within a forbidden loopback, private, or metadata range.
    pub fn is_private_or_loopback(ip: IpAddr) -> bool {
        match ip {
            IpAddr::V4(v4) => {
                let octets = v4.octets();
                if octets[0] == 127 { return true; }
                if octets[0] == 0 { return true; }
                if octets[0] == 169 && octets[1] == 254 { return true; }
                if octets[0] == 10 { return true; }
                if octets[0] == 172 && (16..=31).contains(&octets[1]) { return true; }
                if octets[0] == 192 && octets[1] == 168 { return true; }
                if octets[0] == 100 && (64..=127).contains(&octets[1]) { return true; }
                if octets[0] >= 224 { return true; }
                if octets[0] == 192 && octets[1] == 0 && octets[2] == 2 { return true; }
                if octets[0] == 198 && octets[1] == 51 && octets[2] == 100 { return true; }
                if octets[0] == 203 && octets[1] == 0 && octets[2] == 113 { return true; }
                if octets[0] == 198 && (18..=19).contains(&octets[1]) { return true; }
                false
            }
            IpAddr::V6(v6) => {
                if v6.is_loopback() { return true; }
                if v6.is_unspecified() { return true; }
                let seg = v6.segments();
                if (seg[0] & 0xffc0) == 0xfe80 { return true; }
                if (seg[0] & 0xfe00) == 0xfc00 { return true; }
                if (seg[0] & 0xffc0) == 0xfec0 { return true; }
                // IPv4-mapped (::ffff:0:0/96) and IPv4-compatible (::/96)
                if seg[0] == 0 && seg[1] == 0 && seg[2] == 0 && seg[3] == 0 && seg[4] == 0 && (seg[5] == 0xffff || seg[5] == 0) {
                    let v4 = Ipv4Addr::new((seg[6] >> 8) as u8, seg[6] as u8, (seg[7] >> 8) as u8, seg[7] as u8);
                    return Self::is_private_or_loopback(IpAddr::V4(v4));
                }
                // 6to4 prefix (2002::/16) embedding IPv4 in seg[1] and seg[2]
                if seg[0] == 0x2002 {
                    let v4 = Ipv4Addr::new((seg[1] >> 8) as u8, seg[1] as u8, (seg[2] >> 8) as u8, seg[2] as u8);
                    if Self::is_private_or_loopback(IpAddr::V4(v4)) {
                        return true;
                    }
                }
                false
            }
        }
    }

    /// Evaluates a URL or hostname target string and enforces the SSRF policy boundary.
    pub fn validate_target(target: &str) -> Result<(), NetError> {
        Self::validate_target_internal(target)?;
        if target.contains('%') {
            let decoded = percent_decode(target);
            Self::validate_target_internal(&decoded)?;
        }
        Ok(())
    }

    fn validate_target_internal(target: &str) -> Result<(), NetError> {
        let lower = target.to_lowercase();

        if lower.contains("169.254.169.254")
            || lower.contains("metadata.google.internal")
            || lower.contains("localhost")
            || lower.contains(".local")
            || lower.contains(".internal")
        {
            return Err(NetError::SsrfViolation(format!(
                "Cloud metadata or internal hostname '{}' is blocked",
                target
            )));
        }

        let host = extract_host_from_target(&lower);
        if let Ok(ip) = host.parse::<IpAddr>() {
            if Self::is_private_or_loopback(ip) {
                return Err(NetError::SsrfViolation(format!(
                    "Target IP '{}' belongs to restricted/loopback/private subnet",
                    ip
                )));
            }
        }

        if let Some(v4) = parse_lax_ipv4(host) {
            if Self::is_private_or_loopback(IpAddr::V4(v4)) {
                return Err(NetError::SsrfViolation(format!(
                    "Obfuscated or abbreviated IP '{}' evaluates to restricted {}",
                    host, v4
                )));
            }
        }

        Ok(())
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

fn parse_aton_number(part: &str) -> Option<u64> {
    let part = part.trim();
    if part.is_empty() {
        return None;
    }
    if part.starts_with("0x") || part.starts_with("0X") {
        u64::from_str_radix(&part[2..], 16).ok()
    } else if part.len() > 1 && part.starts_with('0') && part.chars().all(|c| c.is_digit(8)) {
        u64::from_str_radix(part, 8).ok()
    } else {
        part.parse::<u64>().ok()
    }
}

fn parse_lax_ipv4(host: &str) -> Option<Ipv4Addr> {
    let parts: Vec<&str> = host.split('.').collect();
    if parts.is_empty() || parts.len() > 4 {
        return None;
    }

    let mut numbers = Vec::with_capacity(parts.len());
    for p in &parts {
        let num = parse_aton_number(p)?;
        numbers.push(num);
    }

    let ip_u32 = match numbers.len() {
        1 => {
            if numbers[0] > 0xFFFF_FFFF {
                return None;
            }
            numbers[0] as u32
        }
        2 => {
            if numbers[0] > 0xFF || numbers[1] > 0x00FF_FFFF {
                return None;
            }
            ((numbers[0] as u32) << 24) | (numbers[1] as u32)
        }
        3 => {
            if numbers[0] > 0xFF || numbers[1] > 0xFF || numbers[2] > 0xFFFF {
                return None;
            }
            ((numbers[0] as u32) << 24) | ((numbers[1] as u32) << 16) | (numbers[2] as u32)
        }
        4 => {
            if numbers[0] > 0xFF || numbers[1] > 0xFF || numbers[2] > 0xFF || numbers[3] > 0xFF {
                return None;
            }
            ((numbers[0] as u32) << 24)
                | ((numbers[1] as u32) << 16)
                | ((numbers[2] as u32) << 8)
                | (numbers[3] as u32)
        }
        _ => return None,
    };

    Some(Ipv4Addr::from(ip_u32))
}

fn extract_host_from_target(target: &str) -> &str {
    let mut s = target.trim();
    if let Some(pos) = s.find("://") {
        s = &s[pos + 3..];
    }
    if let Some(pos) = s.find(|c| c == '/' || c == '?' || c == '#' || c == '\\') {
        s = &s[..pos];
    }
    if let Some(pos) = s.rfind('@') {
        s = &s[pos + 1..];
    }
    if s.starts_with('[') {
        if let Some(end) = s.find(']') {
            return &s[1..end];
        }
    }
    if let Some(pos) = s.rfind(':') {
        if s.matches(':').count() == 1 {
            s = &s[..pos];
        }
    }
    s
}

fn percent_decode(input: &str) -> String {
    let mut decoded = Vec::with_capacity(input.len());
    let bytes = input.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte_val) = u8::from_str_radix(std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or(""), 16) {
                decoded.push(byte_val);
                i += 3;
                continue;
            }
        }
        decoded.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&decoded).to_string()
}

fn calculate_shannon_entropy(s: &str) -> f64 {
    let mut counts = [0usize; 256];
    for b in s.bytes() {
        counts[b as usize] += 1;
    }
    let len = s.len() as f64;
    let mut entropy = 0.0;
    for &c in &counts {
        if c > 0 {
            let p = c as f64 / len;
            entropy -= p * p.log2();
        }
    }
    entropy
}

fn read_system_nameservers() -> Vec<String> {
    let mut servers = Vec::new();
    if let Ok(content) = fs::read_to_string("/etc/resolv.conf") {
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("nameserver") {
                let parts: Vec<&str> = trimmed.split_whitespace().collect();
                if parts.len() >= 2 {
                    servers.push(parts[1].to_string());
                }
            }
        }
    }
    if servers.is_empty() {
        servers.push("127.0.0.1".to_string());
    }
    servers
}

#[cfg(target_os = "linux")]
fn parse_proc_net_addr(hex_str: &str) -> Option<(String, u16)> {
    let parts: Vec<&str> = hex_str.split(':').collect();
    if parts.len() != 2 {
        return None;
    }
    let ip_u32 = u32::from_str_radix(parts[0], 16).ok()?;
    let port = u16::from_str_radix(parts[1], 16).ok()?;
    let ip = Ipv4Addr::from(ip_u32.to_be());
    Some((ip.to_string(), port))
}

#[cfg(target_os = "linux")]
fn find_pid_by_socket_inode(inode: u64) -> Option<(u32, String)> {
    let target = format!("socket:[{}]", inode);
    if let Ok(proc_entries) = fs::read_dir("/proc") {
        for entry in proc_entries.flatten() {
            let name = entry.file_name();
            if let Ok(pid) = name.to_string_lossy().parse::<u32>() {
                let fd_dir = entry.path().join("fd");
                if let Ok(fd_entries) = fs::read_dir(fd_dir) {
                    for fd in fd_entries.flatten() {
                        if let Ok(link) = fs::read_link(fd.path()) {
                            if link.to_string_lossy() == target {
                                let comm = fs::read_to_string(entry.path().join("comm"))
                                    .unwrap_or_else(|_| "unknown".into())
                                    .trim()
                                    .to_string();
                                return Some((pid, comm));
                            }
                        }
                    }
                }
            }
        }
    }
    None
}

fn get_cmdline_for_pid(pid: u32) -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        let path = format!("/proc/{}/cmdline", pid);
        if let Ok(bytes) = fs::read(path) {
            let s = bytes
                .split(|&b| b == 0)
                .filter(|slice| !slice.is_empty())
                .map(|slice| String::from_utf8_lossy(slice).to_string())
                .collect::<Vec<_>>()
                .join(" ");
            if !s.is_empty() {
                return Some(s);
            }
        }
    }
    #[cfg(target_os = "macos")]
    {
        let out = Command::new("ps")
            .args(["-o", "command=", "-p", &pid.to_string()])
            .output();
        if let Ok(o) = out {
            let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
            if !s.is_empty() {
                return Some(s);
            }
        }
    }
    None
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ssrf_blocks_loopback() {
        assert!(SsrfGuard::validate_target("http://127.0.0.1:8080/admin").is_err());
        assert!(SsrfGuard::validate_target("http://localhost:3000").is_err());
        assert!(SsrfGuard::validate_target("http://0.0.0.0:80").is_err());
    }

    #[test]
    fn test_ssrf_blocks_metadata() {
        assert!(SsrfGuard::validate_target("http://169.254.169.254/latest/meta-data/").is_err());
        assert!(SsrfGuard::validate_target("http://metadata.google.internal/computeMetadata/v1/").is_err());
    }

    #[test]
    fn test_ssrf_allows_public() {
        assert!(SsrfGuard::validate_target("https://api.github.com/repos").is_ok());
        assert!(SsrfGuard::validate_target("https://example.com/status").is_ok());
    }

    #[test]
    fn test_port_diagnosis_free_port() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let free_port = listener.local_addr().unwrap().port();
        drop(listener);

        let diag = PortCollisionRemediator::diagnose(free_port);
        assert!(!diag.is_blocked);
        assert_eq!(diag.severity, RiskLevel::LOW);
    }

    #[test]
    fn test_shannon_entropy() {
        let low = calculate_shannon_entropy("aaaaaaaaaa");
        let high = calculate_shannon_entropy("q9w8e7r6t5y4u3i2");
        assert!(high > low);
    }
}
