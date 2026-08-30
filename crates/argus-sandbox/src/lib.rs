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
}

pub struct SandboxSupervisor {
    workspace_root: PathBuf,
}

impl SandboxSupervisor {
    pub fn new(workspace_root: PathBuf) -> Self {
        Self { workspace_root }
    }

    pub fn execute_command(&self, cmd: &str, timeout_ms: u64) -> ProcessExecutionResult {
        let start = Instant::now();

        #[cfg(target_os = "windows")]
        let mut child = Command::new("cmd")
            .args(&["/C", cmd])
            .current_dir(&self.workspace_root)
            .env_clear()
            .env("PATH", std::env::var("PATH").unwrap_or_default())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        #[cfg(not(target_os = "windows"))]
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
                            };
                        }
                        Ok(None) => {
                            if start.elapsed() >= timeout {
                                let _ = process.kill();
                                return ProcessExecutionResult {
                                    success: false,
                                    exit_code: 124,
                                    stdout: String::new(),
                                    stderr: format!("Process timed out after {}ms limit.", timeout_ms),
                                    duration_ms: start.elapsed().as_millis() as u64,
                                    timed_out: true,
                                };
                            }
                            std::thread::sleep(poll_interval);
                        }
                        Err(e) => {
                            return ProcessExecutionResult {
                                success: false,
                                exit_code: 1,
                                stdout: String::new(),
                                stderr: format!("Error monitoring process: {}", e),
                                duration_ms: start.elapsed().as_millis() as u64,
                                timed_out: false,
                            };
                        }
                    }
                }
            }
            Err(e) => ProcessExecutionResult {
                success: false,
                exit_code: 1,
                stdout: String::new(),
                stderr: format!("Failed to spawn process: {}", e),
                duration_ms: start.elapsed().as_millis() as u64,
                timed_out: false,
            },
        }
    }
}
