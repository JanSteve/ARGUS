use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileCheckpoint {
    pub relative_path: String,
    pub original_sha256: String,
    pub original_bytes: Vec<u8>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionCheckpoint {
    pub checkpoint_id: String,
    pub session_id: String,
    pub created_at: u64,
    pub files: Vec<FileCheckpoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackResult {
    pub success: bool,
    pub checkpoint_id: String,
    pub files_restored: usize,
    pub files_removed: usize,
    pub error: Option<String>,
}

pub struct RollbackManager {
    workspace_root: PathBuf,
    checkpoint_dir: PathBuf,
}

impl RollbackManager {
    pub fn new(workspace_root: PathBuf) -> Self {
        let checkpoint_dir = workspace_root.join(".argus").join("checkpoints");
        let _ = fs::create_dir_all(&checkpoint_dir);
        Self {
            workspace_root,
            checkpoint_dir,
        }
    }

    /**
     * Create a pre-execution snapshot of target files before modification
     */
    pub fn create_checkpoint(&self, session_id: &str, target_files: &[&str]) -> Result<SessionCheckpoint, String> {
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let checkpoint_id = format!("CHK-{}-{}", session_id, now);

        let mut file_checkpoints = Vec::new();

        for file_rel in target_files {
            let full_path = self.workspace_root.join(file_rel);
            if full_path.exists() && full_path.is_file() {
                let bytes = fs::read(&full_path).map_err(|e| e.to_string())?;
                let sha256 = format!("{:x}", sha2::Sha256::digest(&bytes));
                file_checkpoints.push(FileCheckpoint {
                    relative_path: file_rel.to_string(),
                    original_sha256: sha256,
                    original_bytes: bytes,
                    timestamp: now,
                });
            } else {
                // File does not exist yet (will be removed on rollback if created)
                file_checkpoints.push(FileCheckpoint {
                    relative_path: file_rel.to_string(),
                    original_sha256: String::new(),
                    original_bytes: Vec::new(),
                    timestamp: now,
                });
            }
        }

        let session_chk = SessionCheckpoint {
            checkpoint_id: checkpoint_id.clone(),
            session_id: session_id.to_string(),
            created_at: now,
            files: file_checkpoints,
        };

        let chk_file = self.checkpoint_dir.join(format!("{}.json", checkpoint_id));
        let json_str = serde_json::to_string_pretty(&session_chk).map_err(|e| e.to_string())?;
        fs::write(chk_file, json_str).map_err(|e| e.to_string())?;

        Ok(session_chk)
    }

    /**
     * Restore workspace files to the exact state saved in the checkpoint
     */
    pub fn rollback_checkpoint(&self, checkpoint_id: &str) -> RollbackResult {
        let chk_file = self.checkpoint_dir.join(format!("{}.json", checkpoint_id));
        if !chk_file.exists() {
            return RollbackResult {
                success: false,
                checkpoint_id: checkpoint_id.to_string(),
                files_restored: 0,
                files_removed: 0,
                error: Some(format!("Checkpoint file not found: {}", chk_file.display())),
            };
        }

        let content = match fs::read_to_string(&chk_file) {
            Ok(c) => c,
            Err(e) => {
                return RollbackResult {
                    success: false,
                    checkpoint_id: checkpoint_id.to_string(),
                    files_restored: 0,
                    files_removed: 0,
                    error: Some(format!("Failed to read checkpoint: {}", e)),
                }
            }
        };

        let session_chk: SessionCheckpoint = match serde_json::from_str(&content) {
            Ok(c) => c,
            Err(e) => {
                return RollbackResult {
                    success: false,
                    checkpoint_id: checkpoint_id.to_string(),
                    files_restored: 0,
                    files_removed: 0,
                    error: Some(format!("Failed to parse checkpoint JSON: {}", e)),
                }
            }
        };

        let mut restored = 0;
        let mut removed = 0;

        for file_chk in &session_chk.files {
            let target_path = self.workspace_root.join(&file_chk.relative_path);
            if file_chk.original_sha256.is_empty() {
                // File did not exist before operation; remove it
                if target_path.exists() {
                    let _ = fs::remove_file(&target_path);
                    removed += 1;
                }
            } else {
                // File existed before operation; restore original byte payload
                if let Some(parent) = target_path.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                let _ = fs::write(&target_path, &file_chk.original_bytes);
                restored += 1;
            }
        }

        RollbackResult {
            success: true,
            checkpoint_id: checkpoint_id.to_string(),
            files_restored: restored,
            files_removed: removed,
            error: None,
        }
    }

    /**
     * Retrieve the most recent checkpoint ID
     */
    pub fn get_latest_checkpoint(&self) -> Option<String> {
        let mut entries: Vec<PathBuf> = fs::read_dir(&self.checkpoint_dir)
            .ok()?
            .filter_map(|e| e.ok().map(|entry| entry.path()))
            .filter(|p| p.extension().and_then(|ext| ext.to_str()) == Some("json"))
            .collect();

        entries.sort_by(|a, b| b.cmp(a));
        entries.first().and_then(|p| p.file_stem().map(|s| s.to_string_lossy().to_string()))
    }
}

use sha2::Digest;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_checkpoint_and_atomic_rollback() {
        let temp_dir = std::env::temp_dir().join("argus_test_rollback");
        let _ = fs::create_dir_all(&temp_dir);

        let manager = RollbackManager::new(temp_dir.clone());

        // 1. Initial file state
        let test_file = "app_config.json";
        let initial_data = "{\"version\": \"1.0.0\", \"status\": \"stable\"}";
        fs::write(temp_dir.join(test_file), initial_data).unwrap();

        // 2. Create checkpoint before modification
        let chk = manager.create_checkpoint("SESSION-001", &[test_file]).unwrap();
        assert_eq!(chk.files.len(), 1);

        // 3. Mutate file (simulating rogue AI action or corrupt write)
        fs::write(temp_dir.join(test_file), "{\"version\": \"CORRUPTED_9.9.9\"}").unwrap();
        assert_ne!(fs::read_to_string(temp_dir.join(test_file)).unwrap(), initial_data);

        // 4. Trigger 1-Click Atomic Rollback
        let res = manager.rollback_checkpoint(&chk.checkpoint_id);
        assert!(res.success);
        assert_eq!(res.files_restored, 1);

        // 5. Verify byte-for-byte restoration
        let restored_data = fs::read_to_string(temp_dir.join(test_file)).unwrap();
        assert_eq!(restored_data, initial_data);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
