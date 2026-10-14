use std::fmt;
use std::path::PathBuf;

#[derive(Debug)]
pub enum FsError {
    PathTraversalAttempt { attempted: String, root: PathBuf },
    OutsideSandbox { target: PathBuf, root: PathBuf },
    SymlinkEscape { path: PathBuf, target: PathBuf },
    NotFound(String),
    PermissionDenied(String),
    ReadOnlyViolation(String),
    PolicyDenied { rule: String, reason: String },
    HashMismatch { expected: String, actual: String },
    InvalidPath(String),
    Io(std::io::Error),
}

impl fmt::Display for FsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FsError::PathTraversalAttempt { attempted, root } => {
                write!(f, "Path traversal attempt detected: '{}' escapes root '{}'", attempted, root.display())
            }
            FsError::OutsideSandbox { target, root } => {
                write!(f, "Target path '{}' is outside sandbox jail root '{}'", target.display(), root.display())
            }
            FsError::SymlinkEscape { path, target } => {
                write!(f, "Symlink escape blocked: '{}' links to outside target '{}'", path.display(), target.display())
            }
            FsError::NotFound(msg) => write!(f, "File not found: {}", msg),
            FsError::PermissionDenied(msg) => write!(f, "Permission denied: {}", msg),
            FsError::ReadOnlyViolation(msg) => write!(f, "Read-only filesystem violation: {}", msg),
            FsError::PolicyDenied { rule, reason } => write!(f, "Zero-trust policy denied by {}: {}", rule, reason),
            FsError::HashMismatch { expected, actual } => {
                write!(f, "Cryptographic hash mismatch: expected '{}', found '{}'", expected, actual)
            }
            FsError::InvalidPath(msg) => write!(f, "Invalid path: {}", msg),
            FsError::Io(err) => write!(f, "Filesystem I/O error: {}", err),
        }
    }
}

impl std::error::Error for FsError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            FsError::Io(err) => Some(err),
            _ => None,
        }
    }
}

impl From<std::io::Error> for FsError {
    fn from(err: std::io::Error) -> Self {
        FsError::Io(err)
    }
}
