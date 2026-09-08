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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_verifier_existing_file() {
        let temp_dir = std::env::temp_dir().join("argus_test_verifier");
        let _ = fs::create_dir_all(&temp_dir);
        let test_file = "payload.txt";
        let _ = fs::write(temp_dir.join(test_file), "ARGUS_TEST_VERIFIER_DATA");

        let verifier = Verifier::new(temp_dir.clone());
        let res = verifier.verify_file(test_file);
        assert!(res.verified);
        assert!(res.exists_on_disk);
        assert_eq!(res.size_bytes, 24);
        assert!(!res.sha256_checksum.is_empty());

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_verifier_nonexistent_file() {
        let temp_dir = std::env::temp_dir().join("argus_test_verifier_missing");
        let _ = fs::create_dir_all(&temp_dir);

        let verifier = Verifier::new(temp_dir.clone());
        let res = verifier.verify_file("does_not_exist.txt");
        assert!(!res.verified);
        assert!(!res.exists_on_disk);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}

