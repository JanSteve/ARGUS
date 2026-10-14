use std::fmt;

#[derive(Debug)]
pub enum ProcessError {
    ProcessNotFound(u32),
    PermissionDenied(String),
    LimitExceeded(String),
    Timeout { pid: u32, duration_ms: u64 },
    SyscallFailed(String),
    ParseError(String),
    Io(std::io::Error),
}

impl fmt::Display for ProcessError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ProcessError::ProcessNotFound(pid) => write!(f, "Process with PID {} not found", pid),
            ProcessError::PermissionDenied(msg) => write!(f, "Permission denied on process: {}", msg),
            ProcessError::LimitExceeded(msg) => write!(f, "Resource limit exceeded: {}", msg),
            ProcessError::Timeout { pid, duration_ms } => {
                write!(f, "Process {} timed out after {}ms", pid, duration_ms)
            }
            ProcessError::SyscallFailed(msg) => write!(f, "Process syscall failed: {}", msg),
            ProcessError::ParseError(msg) => write!(f, "Failed to parse process telemetry: {}", msg),
            ProcessError::Io(err) => write!(f, "Process I/O error: {}", err),
        }
    }
}

impl std::error::Error for ProcessError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            ProcessError::Io(err) => Some(err),
            _ => None,
        }
    }
}

impl From<std::io::Error> for ProcessError {
    fn from(err: std::io::Error) -> Self {
        ProcessError::Io(err)
    }
}
