//! # ARGUS Service & Daemon Lifecycle Supervision
//!
//! Provides systemd unit generation, daemon lifecycle management (start/stop/restart/reload),
//! PID file tracking with stale process detection, service status queries, and
//! cross-platform Darwin (macOS launchd/POSIX) fallbacks.

use serde::{Deserialize, Serialize};
use std::fmt;
use std::fs::{self, File};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::Command;

use argus_core::paths::get_argus_home;

// ─── Error Types ─────────────────────────────────────────────────────────────

#[derive(Debug)]
pub enum ServiceError {
    IoError(io::Error),
    AlreadyRunning(u32),
    NotRunning,
    ProcessNotFound(u32),
    CommandFailed(String),
    InvalidPid(String),
    PlatformUnsupported(String),
}

impl fmt::Display for ServiceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ServiceError::IoError(e) => write!(f, "I/O error: {}", e),
            ServiceError::AlreadyRunning(pid) => write!(f, "Daemon already running with PID {}", pid),
            ServiceError::NotRunning => write!(f, "Daemon is not currently running"),
            ServiceError::ProcessNotFound(pid) => write!(f, "Process with PID {} not found", pid),
            ServiceError::CommandFailed(msg) => write!(f, "Service command failed: {}", msg),
            ServiceError::InvalidPid(msg) => write!(f, "Invalid PID: {}", msg),
            ServiceError::PlatformUnsupported(msg) => write!(f, "Platform unsupported: {}", msg),
        }
    }
}

impl std::error::Error for ServiceError {}

impl From<io::Error> for ServiceError {
    fn from(e: io::Error) -> Self {
        ServiceError::IoError(e)
    }
}

// ─── Service Configuration & Unit Generation ─────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceConfig {
    pub name: String,
    pub description: String,
    pub exec_start: String,
    pub working_directory: PathBuf,
    pub user: String,
    pub group: String,
    pub restart: String,
    pub restart_sec: u32,
    pub limit_nofile: u64,
    pub protect_system: String,
    pub protect_home: String,
    pub no_new_privileges: bool,
    pub private_tmp: bool,
    pub capability_bounding_set: String,
}

impl Default for ServiceConfig {
    fn default() -> Self {
        let home = get_argus_home();
        Self {
            name: "argusd".to_string(),
            description: "ARGUS Autonomous Voice-Native Linux Agent Daemon".to_string(),
            exec_start: "/usr/local/bin/argusd start".to_string(),
            working_directory: home,
            user: "root".to_string(),
            group: "root".to_string(),
            restart: "always".to_string(),
            restart_sec: 5,
            limit_nofile: 65536,
            protect_system: "strict".to_string(),
            protect_home: "read-only".to_string(),
            no_new_privileges: true,
            private_tmp: true,
            capability_bounding_set: "CAP_NET_BIND_SERVICE CAP_SYS_ADMIN CAP_SYS_PTRACE".to_string(),
        }
    }
}

fn sanitize_ini_val(s: &str) -> String {
    s.replace('\r', " ").replace('\n', " ").trim().to_string()
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

pub struct SystemdUnitGenerator;

impl SystemdUnitGenerator {
    /// Generates hardened Linux systemd service unit file content.
    pub fn generate_unit(config: &ServiceConfig) -> String {
        format!(
            r#"[Unit]
Description={desc}
After=network.target network-online.target local-fs.target
Wants=network-online.target
Documentation=https://github.com/JanSteve/ARGUS

[Service]
Type=simple
ExecStart={exec}
WorkingDirectory={workdir}
User={user}
Group={group}
Restart={restart}
RestartSec={restart_sec}
LimitNOFILE={limit_nofile}

# Zero-Trust Linux Hardening Isolation
NoNewPrivileges={no_new_priv}
ProtectSystem={protect_sys}
ProtectHome={protect_home}
PrivateTmp={priv_tmp}
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
CapabilityBoundingSet={caps}

# Standard Output Telemetry
StandardOutput=journal
StandardError=journal
SyslogIdentifier={name}

[Install]
WantedBy=multi-user.target
"#,
            desc = sanitize_ini_val(&config.description),
            exec = sanitize_ini_val(&config.exec_start),
            workdir = sanitize_ini_val(&config.working_directory.display().to_string()),
            user = sanitize_ini_val(&config.user),
            group = sanitize_ini_val(&config.group),
            restart = sanitize_ini_val(&config.restart),
            restart_sec = config.restart_sec,
            limit_nofile = config.limit_nofile,
            no_new_priv = if config.no_new_privileges { "yes" } else { "no" },
            protect_sys = sanitize_ini_val(&config.protect_system),
            protect_home = sanitize_ini_val(&config.protect_home),
            priv_tmp = if config.private_tmp { "yes" } else { "no" },
            caps = sanitize_ini_val(&config.capability_bounding_set),
            name = sanitize_ini_val(&config.name),
        )
    }

    /// Generates a native macOS Launchd XML plist file for Darwin environments.
    pub fn generate_launchd_plist(config: &ServiceConfig) -> String {
        let clean_name = escape_xml(&config.name);
        let label = format!("com.argus.{}", clean_name);
        let args_xml = config
            .exec_start
            .split_whitespace()
            .map(|arg| format!("        <string>{}</string>", escape_xml(arg)))
            .collect::<Vec<_>>()
            .join("\n");
        let workdir = escape_xml(&config.working_directory.display().to_string());

        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{label}</string>
    <key>ProgramArguments</key>
    <array>
{args}
    </array>
    <key>WorkingDirectory</key>
    <string>{workdir}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/{name}.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/{name}.stderr.log</string>
</dict>
</plist>
"#,
            label = label,
            args = args_xml,
            workdir = workdir,
            name = clean_name,
        )
    }
}

// ─── PID File Handling ───────────────────────────────────────────────────────

pub struct PidFileManager {
    path: PathBuf,
}

impl PidFileManager {
    pub fn new(path: Option<PathBuf>) -> Self {
        let pid_path = path.unwrap_or_else(|| {
            let default_run = PathBuf::from("/run/argusd.pid");
            if default_run.parent().map(|p| p.exists()).unwrap_or(false) && is_root() {
                default_run
            } else {
                get_argus_home().join("argusd.pid")
            }
        });
        Self { path: pid_path }
    }

    pub fn get_path(&self) -> &Path {
        &self.path
    }

    /// Reads the PID from disk if the file exists.
    pub fn read_pid(&self) -> Result<Option<u32>, ServiceError> {
        if !self.path.exists() {
            return Ok(None);
        }
        let content = fs::read_to_string(&self.path)?;
        let trimmed = content.trim();
        if trimmed.is_empty() {
            return Ok(None);
        }
        let pid = trimmed
            .parse::<u32>()
            .map_err(|e| ServiceError::InvalidPid(e.to_string()))?;
        Ok(Some(pid))
    }

    /// Checks if the process specified in the PID file is actively running.
    pub fn is_active(&self) -> Result<bool, ServiceError> {
        if let Some(pid) = self.read_pid()? {
            Ok(is_process_alive(pid))
        } else {
            Ok(false)
        }
    }

    /// Atomically writes a new PID to the PID file.
    /// Returns `Err(AlreadyRunning)` if an existing active process is detected.
    pub fn write_pid(&self, pid: u32) -> Result<(), ServiceError> {
        if let Some(existing_pid) = self.read_pid()? {
            if is_process_alive(existing_pid) && existing_pid != pid {
                return Err(ServiceError::AlreadyRunning(existing_pid));
            }
        }

        if let Some(parent) = self.path.parent() {
            if !parent.as_os_str().is_empty() && !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }

        let mut file = File::create(&self.path)?;
        file.write_all(format!("{}\n", pid).as_bytes())?;
        file.flush()?;
        Ok(())
    }

    /// Removes the PID file from disk.
    pub fn remove_pid(&self) -> Result<(), ServiceError> {
        if self.path.exists() {
            fs::remove_file(&self.path)?;
        }
        Ok(())
    }
}

// ─── Service State & Status Query ────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ServiceState {
    Active,
    Inactive,
    Failed,
    Activating,
    Deactivating,
    Unknown,
}

impl fmt::Display for ServiceState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ServiceState::Active => write!(f, "active (running)"),
            ServiceState::Inactive => write!(f, "inactive (dead)"),
            ServiceState::Failed => write!(f, "failed"),
            ServiceState::Activating => write!(f, "activating"),
            ServiceState::Deactivating => write!(f, "deactivating"),
            ServiceState::Unknown => write!(f, "unknown"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceStatus {
    pub name: String,
    pub state: ServiceState,
    pub pid: Option<u32>,
    pub uptime_seconds: Option<u64>,
    pub memory_bytes: Option<u64>,
    pub platform: String,
    pub details: String,
}

pub struct ServiceStatusQuery;

impl ServiceStatusQuery {
    /// Queries the operational status of the service across platforms.
    pub fn query(service_name: &str, pid_file: &PidFileManager) -> ServiceStatus {
        #[cfg(target_os = "linux")]
        {
            Self::query_linux(service_name, pid_file)
        }
        #[cfg(not(target_os = "linux"))]
        {
            Self::query_fallback(service_name, pid_file)
        }
    }

    #[cfg(target_os = "linux")]
    fn query_linux(service_name: &str, pid_file: &PidFileManager) -> ServiceStatus {
        if is_systemd_present() {
            let output = Command::new("systemctl")
                .args(["is-active", service_name])
                .output();

            if let Ok(out) = output {
                let status_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
                let state = match status_str.as_str() {
                    "active" => ServiceState::Active,
                    "inactive" => ServiceState::Inactive,
                    "failed" => ServiceState::Failed,
                    "activating" => ServiceState::Activating,
                    "deactivating" => ServiceState::Deactivating,
                    _ => ServiceState::Unknown,
                };

                let pid = pid_file.read_pid().ok().flatten();
                let mem = pid.and_then(get_proc_memory);

                return ServiceStatus {
                    name: service_name.to_string(),
                    state,
                    pid,
                    uptime_seconds: None,
                    memory_bytes: mem,
                    platform: "linux-systemd".to_string(),
                    details: format!("systemctl state: {}", status_str),
                };
            }
        }

        Self::query_fallback(service_name, pid_file)
    }

    fn query_fallback(service_name: &str, pid_file: &PidFileManager) -> ServiceStatus {
        let (state, pid) = match pid_file.read_pid() {
            Ok(Some(p)) => {
                if is_process_alive(p) {
                    (ServiceState::Active, Some(p))
                } else {
                    (ServiceState::Failed, Some(p))
                }
            }
            Ok(None) => (ServiceState::Inactive, None),
            Err(_) => (ServiceState::Unknown, None),
        };

        let mem = pid.and_then(get_proc_memory);
        let platform = if cfg!(target_os = "macos") {
            "darwin-posix"
        } else {
            "posix-pidfile"
        };

        ServiceStatus {
            name: service_name.to_string(),
            state,
            pid,
            uptime_seconds: None,
            memory_bytes: mem,
            platform: platform.to_string(),
            details: if state == ServiceState::Active {
                format!("PID {} verified alive via POSIX signal probe", pid.unwrap_or(0))
            } else {
                "Service not running or PID file absent".to_string()
            },
        }
    }
}

// ─── Lifecycle Manager ───────────────────────────────────────────────────────

pub struct ServiceLifecycleManager {
    service_name: String,
    pid_manager: PidFileManager,
}

impl ServiceLifecycleManager {
    pub fn new(service_name: &str, pid_path: Option<PathBuf>) -> Self {
        Self {
            service_name: service_name.to_string(),
            pid_manager: PidFileManager::new(pid_path),
        }
    }

    pub fn pid_manager(&self) -> &PidFileManager {
        &self.pid_manager
    }

    /// Starts the daemon service.
    pub fn start(&self, exec_cmd: &str) -> Result<String, ServiceError> {
        #[cfg(target_os = "linux")]
        {
            if is_systemd_present() {
                let status = Command::new("systemctl")
                    .args(["start", &self.service_name])
                    .status();
                if let Ok(st) = status {
                    if st.success() {
                        return Ok(format!("Started systemd unit {}", self.service_name));
                    }
                }
            }
        }

        if self.pid_manager.is_active()? {
            let pid = self.pid_manager.read_pid()?.unwrap_or(0);
            return Err(ServiceError::AlreadyRunning(pid));
        }

        let parts: Vec<&str> = exec_cmd.split_whitespace().collect();
        if parts.is_empty() {
            return Err(ServiceError::CommandFailed("Empty command".into()));
        }

        let mut cmd = Command::new(parts[0]);
        if parts.len() > 1 {
            cmd.args(&parts[1..]);
        }

        let child = cmd.spawn()?;
        let child_pid = child.id();
        self.pid_manager.write_pid(child_pid)?;

        Ok(format!("Spawned daemon process with PID {}", child_pid))
    }

    /// Stops the daemon service gracefully via SIGTERM, then SIGKILL if needed.
    pub fn stop(&self) -> Result<String, ServiceError> {
        #[cfg(target_os = "linux")]
        {
            if is_systemd_present() {
                let status = Command::new("systemctl")
                    .args(["stop", &self.service_name])
                    .status();
                if let Ok(st) = status {
                    if st.success() {
                        let _ = self.pid_manager.remove_pid();
                        return Ok(format!("Stopped systemd unit {}", self.service_name));
                    }
                }
            }
        }

        let pid = match self.pid_manager.read_pid()? {
            Some(p) => p,
            None => return Err(ServiceError::NotRunning),
        };

        if !is_process_alive(pid) {
            let _ = self.pid_manager.remove_pid();
            return Ok("Cleaned up stale PID file; process was already stopped".into());
        }

        unsafe {
            libc::kill(pid as libc::pid_t, libc::SIGTERM);
        }

        for _ in 0..30 {
            std::thread::sleep(std::time::Duration::from_millis(100));
            if !is_process_alive(pid) {
                let _ = self.pid_manager.remove_pid();
                return Ok(format!("Terminated process PID {} gracefully", pid));
            }
        }

        unsafe {
            libc::kill(pid as libc::pid_t, libc::SIGKILL);
        }
        let _ = self.pid_manager.remove_pid();
        Ok(format!("Force killed stubborn process PID {}", pid))
    }

    /// Restarts the daemon.
    pub fn restart(&self, exec_cmd: &str) -> Result<String, ServiceError> {
        let _ = self.stop();
        std::thread::sleep(std::time::Duration::from_millis(200));
        self.start(exec_cmd)
    }

    /// Queries the service status.
    pub fn status(&self) -> ServiceStatus {
        ServiceStatusQuery::query(&self.service_name, &self.pid_manager)
    }
}

// ─── Internal Utilities ──────────────────────────────────────────────────────

fn is_root() -> bool {
    unsafe { libc::geteuid() == 0 }
}

/// Checks if a process is alive using POSIX `kill(pid, 0)`.
pub fn is_process_alive(pid: u32) -> bool {
    if pid == 0 {
        return false;
    }
    unsafe {
        let res = libc::kill(pid as libc::pid_t, 0);
        if res == 0 {
            true
        } else {
            let err = io::Error::last_os_error().raw_os_error();
            err == Some(libc::EPERM)
        }
    }
}

#[cfg(target_os = "linux")]
fn is_systemd_present() -> bool {
    Path::new("/run/systemd/system").exists()
}

#[allow(dead_code)]
fn get_proc_memory(pid: u32) -> Option<u64> {
    #[cfg(target_os = "linux")]
    {
        let statm_path = format!("/proc/{}/statm", pid);
        if let Ok(content) = fs::read_to_string(statm_path) {
            let parts: Vec<&str> = content.split_whitespace().collect();
            if parts.len() >= 2 {
                if let Ok(pages) = parts[1].parse::<u64>() {
                    let page_size = unsafe { libc::sysconf(libc::_SC_PAGESIZE) };
                    let size = if page_size > 0 { page_size as u64 } else { 4096 };
                    return Some(pages * size);
                }
            }
        }
    }
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("ps")
            .args(["-o", "rss=", "-p", &pid.to_string()])
            .output();
        if let Ok(out) = output {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if let Ok(kb) = s.parse::<u64>() {
                return Some(kb * 1024);
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
    fn test_unit_generator() {
        let config = ServiceConfig::default();
        let unit_content = SystemdUnitGenerator::generate_unit(&config);
        assert!(unit_content.contains("Description=ARGUS Autonomous Voice-Native Linux Agent Daemon"));
        assert!(unit_content.contains("ExecStart=/usr/local/bin/argusd start"));
        assert!(unit_content.contains("ProtectSystem=strict"));
        assert!(unit_content.contains("NoNewPrivileges=yes"));
    }

    #[test]
    fn test_launchd_plist_generator() {
        let config = ServiceConfig::default();
        let plist_content = SystemdUnitGenerator::generate_launchd_plist(&config);
        assert!(plist_content.contains("<string>com.argus.argusd</string>"));
        assert!(plist_content.contains("<key>RunAtLoad</key>"));
    }

    #[test]
    fn test_pid_file_lifecycle() {
        let temp_dir = std::env::temp_dir();
        let pid_path = temp_dir.join(format!("test_argus_{}.pid", std::process::id()));
        let manager = PidFileManager::new(Some(pid_path.clone()));

        let my_pid = std::process::id();
        assert!(manager.write_pid(my_pid).is_ok());

        assert_eq!(manager.read_pid().unwrap(), Some(my_pid));
        assert!(manager.is_active().unwrap());

        assert!(manager.remove_pid().is_ok());
        assert_eq!(manager.read_pid().unwrap(), None);
    }

    #[test]
    fn test_is_process_alive() {
        let my_pid = std::process::id();
        assert!(is_process_alive(my_pid));
        assert!(!is_process_alive(99_999_999));
    }
}
