use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::PathBuf;
use std::fs;

use crate::paths::get_argus_home;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcRequest {
    pub command: String,
    pub payload: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcResponse {
    pub status: String,
    pub message: String,
    pub duration_ms: u64,
}

pub fn get_socket_path() -> PathBuf {
    get_argus_home().join("argusd.sock")
}

pub struct IpcServer {
    socket_path: PathBuf,
}

impl IpcServer {
    pub fn new() -> Self {
        let socket_path = get_socket_path();
        if socket_path.exists() {
            let _ = fs::remove_file(&socket_path);
        }
        Self { socket_path }
    }

    pub fn start_listener<F>(&self, handler: F) -> std::io::Result<()>
    where
        F: Fn(IpcRequest) -> IpcResponse + Send + Sync + 'static,
    {
        let listener = UnixListener::bind(&self.socket_path)?;
        println!("[*] ARGUS Daemon IPC Server listening on: {}", self.socket_path.display());

        for stream in listener.incoming() {
            match stream {
                Ok(mut stream) => {
                    let mut buffer = [0; 4096];
                    if let Ok(n) = stream.read(&mut buffer) {
                        if n > 0 {
                            if let Ok(req) = serde_json::from_slice::<IpcRequest>(&buffer[..n]) {
                                let resp = handler(req);
                                if let Ok(resp_bytes) = serde_json::to_vec(&resp) {
                                    let _ = stream.write_all(&resp_bytes);
                                }
                            }
                        }
                    }
                }
                Err(err) => {
                    eprintln!("[!] IPC connection error: {}", err);
                }
            }
        }
        Ok(())
    }
}

pub struct IpcClient;

impl IpcClient {
    pub fn send_request(req: IpcRequest) -> std::io::Result<IpcResponse> {
        let socket_path = get_socket_path();
        let mut stream = UnixStream::connect(&socket_path)?;
        let req_bytes = serde_json::to_vec(&req)?;
        stream.write_all(&req_bytes)?;

        let mut buffer = [0; 4096];
        let n = stream.read(&mut buffer)?;
        let resp: IpcResponse = serde_json::from_slice(&buffer[..n])?;
        Ok(resp)
    }

    pub fn ping() -> bool {
        let req = IpcRequest {
            command: "ping".to_string(),
            payload: None,
        };
        match Self::send_request(req) {
            Ok(res) => res.message == "PONG",
            Err(_) => false,
        }
    }
}
