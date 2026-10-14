use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use serde::{Deserialize, Serialize};

use crate::error::FsError;
use crate::hash::{calculate_file_sha256, FileChecksum};
use crate::path::PathGuard;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirEntryInfo {
    pub name: String,
    pub path: String,
    pub is_file: bool,
    pub is_dir: bool,
    pub is_symlink: bool,
    pub size_bytes: u64,
    pub modified_timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub path: String,
    pub size_bytes: u64,
    pub is_file: bool,
    pub is_dir: bool,
    pub is_readonly: bool,
    pub modified_timestamp: u64,
}

/// Sandboxed filesystem operations supervisor.
pub struct SandboxedFs {
    guard: PathGuard,
    read_only: bool,
}

impl SandboxedFs {
    /// Create a new read-write sandboxed filesystem at root.
    pub fn new(root: impl AsRef<Path>) -> Result<Self, FsError> {
        let guard = PathGuard::new(root)?;
        Ok(Self {
            guard,
            read_only: false,
        })
    }

    /// Create a read-only sandboxed filesystem at root.
    pub fn read_only(root: impl AsRef<Path>) -> Result<Self, FsError> {
        let guard = PathGuard::new(root)?;
        Ok(Self {
            guard,
            read_only: true,
        })
    }

    pub fn root(&self) -> &Path {
        self.guard.root()
    }

    pub fn is_read_only(&self) -> bool {
        self.read_only
    }

    fn check_write_permission(&self, op: &str) -> Result<(), FsError> {
        if self.read_only {
            Err(FsError::ReadOnlyViolation(format!("Cannot execute '{}' in read-only sandbox", op)))
        } else {
            Ok(())
        }
    }

    /// Read file content to String with traversal defense.
    pub fn read_to_string(&self, path: impl AsRef<Path>) -> Result<String, FsError> {
        let valid_path = self.guard.resolve_and_validate(path)?;
        if !valid_path.is_file() {
            return Err(FsError::NotFound(valid_path.to_string_lossy().to_string()));
        }
        let content = fs::read_to_string(valid_path)?;
        Ok(content)
    }

    /// Read file content to bytes with traversal defense.
    pub fn read_bytes(&self, path: impl AsRef<Path>) -> Result<Vec<u8>, FsError> {
        let valid_path = self.guard.resolve_and_validate(path)?;
        if !valid_path.is_file() {
            return Err(FsError::NotFound(valid_path.to_string_lossy().to_string()));
        }
        let bytes = fs::read(valid_path)?;
        Ok(bytes)
    }

    /// Write bytes to file, creating parent directories if needed, and return cryptographic FileChecksum.
    pub fn write(&self, path: impl AsRef<Path>, data: impl AsRef<[u8]>) -> Result<FileChecksum, FsError> {
        self.check_write_permission("write")?;
        let valid_path = self.guard.resolve_and_validate(path)?;

        if let Some(parent) = valid_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }

        let mut file = File::create(&valid_path)?;
        file.write_all(data.as_ref())?;
        file.flush()?;

        calculate_file_sha256(&valid_path)
    }

    /// Append bytes to file, returning updated FileChecksum.
    pub fn append(&self, path: impl AsRef<Path>, data: impl AsRef<[u8]>) -> Result<FileChecksum, FsError> {
        self.check_write_permission("append")?;
        let valid_path = self.guard.resolve_and_validate(path)?;

        if let Some(parent) = valid_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&valid_path)?;
        file.write_all(data.as_ref())?;
        file.flush()?;

        calculate_file_sha256(&valid_path)
    }

    /// Create directories inside the sandbox.
    pub fn create_dir_all(&self, path: impl AsRef<Path>) -> Result<PathBuf, FsError> {
        self.check_write_permission("create_dir_all")?;
        let valid_path = self.guard.resolve_and_validate(path)?;
        fs::create_dir_all(&valid_path)?;
        Ok(valid_path)
    }

    /// Enumerate directory entries with metadata.
    pub fn list_dir(&self, path: impl AsRef<Path>) -> Result<Vec<DirEntryInfo>, FsError> {
        let valid_path = self.guard.resolve_and_validate(path)?;
        if !valid_path.is_dir() {
            return Err(FsError::NotFound(valid_path.to_string_lossy().to_string()));
        }

        let mut results = Vec::new();
        for entry in fs::read_dir(&valid_path)? {
            let entry = entry?;
            let p = entry.path();
            let ft = entry.file_type()?;
            let md = entry.metadata()?;

            let modified = md.modified()
                .ok()
                .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);

            results.push(DirEntryInfo {
                name: entry.file_name().to_string_lossy().to_string(),
                path: p.to_string_lossy().to_string(),
                is_file: ft.is_file(),
                is_dir: ft.is_dir(),
                is_symlink: ft.is_symlink(),
                size_bytes: md.len(),
                modified_timestamp: modified,
            });
        }

        results.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(results)
    }

    /// Remove a file within the sandbox.
    pub fn remove_file(&self, path: impl AsRef<Path>) -> Result<(), FsError> {
        self.check_write_permission("remove_file")?;
        let valid_path = self.guard.resolve_and_validate(path)?;
        if valid_path.is_file() {
            fs::remove_file(valid_path)?;
            Ok(())
        } else {
            Err(FsError::NotFound(valid_path.to_string_lossy().to_string()))
        }
    }

    /// Remove a directory and all its contents within the sandbox.
    pub fn remove_dir_all(&self, path: impl AsRef<Path>) -> Result<(), FsError> {
        self.check_write_permission("remove_dir_all")?;
        let valid_path = self.guard.resolve_and_validate(path)?;
        if valid_path == self.guard.root() {
            return Err(FsError::PermissionDenied("Cannot delete the sandbox root itself".into()));
        }
        if valid_path.is_dir() {
            fs::remove_dir_all(valid_path)?;
            Ok(())
        } else {
            Err(FsError::NotFound(valid_path.to_string_lossy().to_string()))
        }
    }

    /// Copy a file from src to dst inside the sandbox.
    pub fn copy(&self, src: impl AsRef<Path>, dst: impl AsRef<Path>) -> Result<u64, FsError> {
        self.check_write_permission("copy")?;
        let valid_src = self.guard.resolve_and_validate(src)?;
        let valid_dst = self.guard.resolve_and_validate(dst)?;
        let bytes = fs::copy(valid_src, valid_dst)?;
        Ok(bytes)
    }

    /// Check existence of a path within the sandbox.
    pub fn exists(&self, path: impl AsRef<Path>) -> bool {
        match self.guard.resolve_and_validate(path) {
            Ok(p) => p.exists(),
            Err(_) => false,
        }
    }

    /// Query metadata of a path within the sandbox.
    pub fn metadata(&self, path: impl AsRef<Path>) -> Result<FileMetadata, FsError> {
        let valid_path = self.guard.resolve_and_validate(path)?;
        let md = fs::metadata(&valid_path)?;
        let modified = md.modified()
            .ok()
            .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);

        Ok(FileMetadata {
            path: valid_path.to_string_lossy().to_string(),
            size_bytes: md.len(),
            is_file: md.is_file(),
            is_dir: md.is_dir(),
            is_readonly: md.permissions().readonly(),
            modified_timestamp: modified,
        })
    }
}
