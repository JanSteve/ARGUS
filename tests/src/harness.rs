//! Test harness helpers: IPC client framing, cryptographic assertions, and subprocess execution

use serde_json::Value;
use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::UnixStream;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::Duration;

pub struct IpcClient {
    socket_path: String,
}

impl IpcClient {
    pub fn new(socket_path: &str) -> Self {
        Self {
            socket_path: socket_path.to_string(),
        }
    }

    pub fn send_request(&self, request: &Value) -> Result<Value, String> {
        let mut stream = UnixStream::connect(&self.socket_path)
            .map_err(|e| format!("Failed to connect to socket {}: {}", self.socket_path, e))?;

        stream
            .set_read_timeout(Some(Duration::from_secs(3)))
            .map_err(|e| e.to_string())?;

        let mut payload = serde_json::to_string(request).map_err(|e| e.to_string())?;
        payload.push('\n');

        stream
            .write_all(payload.as_bytes())
            .map_err(|e| format!("Write failed: {}", e))?;

        let mut reader = BufReader::new(stream);
        let mut response_line = String::new();
        reader
            .read_line(&mut response_line)
            .map_err(|e| format!("Read failed: {}", e))?;

        serde_json::from_str(&response_line).map_err(|e| {
            format!(
                "Invalid JSON response '{}': {}",
                response_line.trim(),
                e
            )
        })
    }
}

pub fn run_cli_command(bin_path: &Path, args: &[&str]) -> Result<(i32, String, String), String> {
    let output = Command::new(bin_path)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    let exit_code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    Ok((exit_code, stdout, stderr))
}
