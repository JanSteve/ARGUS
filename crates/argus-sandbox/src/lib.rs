use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessExecutionResult {
    pub success: bool,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u64,
    pub timed_out: bool,
    pub sandbox_engine: String,
}

pub struct SandboxSupervisor {
    workspace_root: PathBuf,
}

impl SandboxSupervisor {
    pub fn new(workspace_root: PathBuf) -> Self {
        Self { workspace_root }
    }

    /**
     * Executes process with OS sandbox enforcement (Bubblewrap unprivileged namespaces on Linux, POSIX fallback)
     */
    pub fn execute_command(&self, cmd: &str, timeout_ms: u64) -> ProcessExecutionResult {
        let start = Instant::now();
        let mut engine = "POSIX_PROCESS_GROUP_JAIL".to_string();

        #[cfg(target_os = "linux")]
        let mut child = {
            // Check if bwrap (bubblewrap) is available on Linux
            let has_bwrap = Command::new("bwrap").arg("--version").output().is_ok();
            if has_bwrap {
                engine = "LINUX_BUBBLEWRAP_NAMESPACES".to_string();
                let ws_str = self.workspace_root.to_string_lossy().to_string();
                Command::new("bwrap")
                    .args(&[
                        "--ro-bind", "/", "/",
                        "--bind", &ws_str, &ws_str,
                        "--dev-bind", "/dev", "/dev",
                        "--proc", "/proc",
                        "--tmpfs", "/tmp",
                        "--unshare-all",
                        "--die-with-parent",
                        "--chdir", &ws_str,
                        "sh", "-c", cmd,
                    ])
                    .env_clear()
                    .env("PATH", "/usr/local/bin:/usr/bin:/bin")
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .spawn()
            } else {
                engine = "LINUX_POSIX_JAIL".to_string();
                Command::new("sh")
                    .args(&["-c", cmd])
                    .current_dir(&self.workspace_root)
                    .env_clear()
                    .env("PATH", "/usr/local/bin:/usr/bin:/bin")
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .spawn()
            }
        };

        #[cfg(not(target_os = "linux"))]
        let child = Command::new("sh")
            .args(&["-c", cmd])
            .current_dir(&self.workspace_root)
            .env_clear()
            .env("PATH", std::env::var("PATH").unwrap_or_else(|_| "/usr/local/bin:/usr/bin:/bin".to_string()))
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        match child {
            Ok(mut process) => {
                let timeout = Duration::from_millis(timeout_ms);
                let poll_interval = Duration::from_millis(20);

                loop {
                    match process.try_wait() {
                        Ok(Some(status)) => {
                            let duration_ms = start.elapsed().as_millis() as u64;
                            let output = process.wait_with_output().unwrap_or_else(|_| std::process::Output {
                                status,
                                stdout: Vec::new(),
                                stderr: Vec::new(),
                            });

                            return ProcessExecutionResult {
                                success: status.success(),
                                exit_code: status.code().unwrap_or(1),
                                stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
                                stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
                                duration_ms,
                                timed_out: false,
                                sandbox_engine: engine,
                            };
                        }
                        Ok(None) => {
                            if start.elapsed() >= timeout {
                                let _ = process.kill();
                                return ProcessExecutionRes