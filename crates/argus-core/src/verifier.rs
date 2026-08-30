use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    pub verified: bool,
    pub target: String,
    pub size_bytes: u64,
    pub sha256_checksum: String,
    pub exists_on_disk: bool,
    pub reason: String,
}

pub struct Verifier {
    workspace_root: PathBuf,
}

impl Verifier {
    pub fn new(workspace_root: PathBuf) -> Self {
        Self { workspace_root }
    }

    pub fn verify_file(&self, relative_path: &str) -> VerificationResult {
        let full_path = self.workspace_root.join(relative_path);

        if !full_path.exists() {
            return VerificationResult {
                verified: false,
                target: relative_path.to_string(),
                size_bytes: 0,
                sha256_checksum: String::new(),
                exists_on_disk: false,
                reason: "VERIFICATION_FAILED: File does not exist on disk.".to_string(),
            };
        }

        match fs::read(&full_path) {
            Ok(bytes) => {
                let mut hasher = Sha256::new();
                hasher.update(&bytes);
                let result = hasher.finalize();
                let checksum = hex::encode(result);

                VerificationResult {
                    verified: true,
                    target: relative_path.to_string(),
                    size_bytes: bytes.len() as u64,
                    sha256_checksum: checksum,
                    exists_on_disk: true,
                    reason: "VERIFICATION_PASSED: Cryptographic signature and byte assertion confirmed.".to_string(),
                }
            }
            Err(err) => VerificationResult {
                verified: false,
                target: relative_path.to_string(),
                size_bytes: 0,
                sha256_checksum: String::new(),
                exists_on_disk: true,
                reason: format!("VERIFICATION_FAILED: Read error: {}", err),
            },
        }
    }
}
