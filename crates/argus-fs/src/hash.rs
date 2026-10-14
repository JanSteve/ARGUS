use std::fs::File;
use std::io::{Read, BufReader};
use std::path::Path;
use std::time::SystemTime;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use crate::error::FsError;

const BUFFER_CAPACITY: usize = 64 * 1024; // 64 KiB chunks for streaming efficiency

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FileChecksum {
    pub path: String,
    pub sha256: String,
    pub size_bytes: u64,
    pub timestamp: u64,
}

/// Calculate SHA-256 hex digest for an in-memory byte slice.
pub fn hash_bytes(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

/// Streaming calculation of SHA-256 hex digest for any Read stream.
pub fn hash_reader<R: Read>(mut reader: R) -> Result<String, std::io::Error> {
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; BUFFER_CAPACITY];
    loop {
        let count = reader.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }
    Ok(hex::encode(hasher.finalize()))
}

/// Calculate cryptographic SHA-256 checksum and metadata for a file on disk.
pub fn calculate_file_sha256(path: impl AsRef<Path>) -> Result<FileChecksum, FsError> {
    let p = path.as_ref();
    if !p.exists() {
        return Err(FsError::NotFound(p.to_string_lossy().to_string()));
    }

    let file = File::open(p)?;
    let metadata = file.metadata()?;
    let size_bytes = metadata.len();
    let reader = BufReader::with_capacity(BUFFER_CAPACITY, file);

    let sha256 = hash_reader(reader)?;
    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    Ok(FileChecksum {
        path: p.to_string_lossy().to_string(),
        sha256,
        size_bytes,
        timestamp,
    })
}

/// Verifies whether a file matches an expected SHA-256 checksum.
pub fn verify_file_checksum(path: impl AsRef<Path>, expected_sha256: &str) -> Result<bool, FsError> {
    let actual = calculate_file_sha256(path)?;
    let matches = actual.sha256.eq_ignore_ascii_case(expected_sha256.trim());
    if !matches {
        return Err(FsError::HashMismatch {
            expected: expected_sha256.to_string(),
            actual: actual.sha256,
        });
    }
    Ok(true)
}
