use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpisodicMemoryRecord {
    pub memory_id: String,
    pub session_id: String,
    pub objective: String,
    pub outcome: String,
    pub operator_feedback: Option<String>,
    pub timestamp: u64,
    pub provenance_sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticMemoryEntry {
    pub key: String,
    pub value: String,
    pub category: String,
    pub confidence: f32,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SovereignMemoryStore {
    pub episodic_records: Vec<EpisodicMemoryRecord>,
    pub semantic_entries: HashMap<String, SemanticMemoryEntry>,
}

pub struct MemoryEngine {
    storage_path: PathBuf,
    store: SovereignMemoryStore,
}

impl MemoryEngine {
    pub fn new(workspace_root: PathBuf) -> Self {
        let memory_dir = workspace_root.join(".argus").join("memory");
        let _ = fs::create_dir_all(&memory_dir);
        let storage_path = memory_dir.join("sovereign_memory.json");

        let store = if storage_path.exists() {
            fs::read_to_string(&storage_path)
                .ok()
                .and_then(|c| serde_json::from_str(&c).ok())
                .unwrap_or_default()
        } else {
            SovereignMemoryStore::default()
        };

        Self {
            storage_path,
            store,
        }
    }

    /**
     * Record an episodic mission outcome with cryptographic SHA-256 provenance
     */
    pub fn record_mission(
        &mut self,
        session_id: &str,
        objective: &str,
        outcome: &str,
        operator_feedback: Option<&str>,
    ) -> EpisodicMemoryRecord {
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let memory_id = format!("MEM-{}-{}", session_id, now);

        let provenance_payload = format!("{}:{}:{}:{}", memory_id, session_id, objective, outcome);
        let provenance_sha256 = format!("{:x}", sha2::Sha256::digest(provenance_payload.as_bytes()));

        let record = EpisodicMemoryRecord {
            memory_id,
            session_id: session_id.to_string(),
            objective: objective.to_string(),
            outcome: outcome.to_string(),
            operator_feedback: operator_feedback.map(|s| s.to_string()),
            timestamp: now,
            provenance_sha256,
        };

        self.store.episodic_records.push(record.clone());
        let _ = self.persist();
        record
    }

    /**
     * Store or update a semantic knowledge / preference entry
     */
    pub fn set_semantic_entry(&mut self, key: &str, value: &str, category: &str) -> SemanticMemoryEntry {
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let entry = SemanticMemoryEntry {
            key: key.to_string(),
            value: value.to_string(),
            category: category.to_string(),
            confidence: 1.0,
            updated_at: now,
        };

        self.store.semantic_entries.insert(key.to_string(), entry.clone());
        let _ = self.persist();
        entry
    }

    /**
     * Retrieve semantic knowledge entry by key
     */
    pub fn get_semantic_entry(&self, key: &str) -> Option<&SemanticMemoryEntry> {
        self.store.semantic_entries.get(key)
    }

    /**
     * List all semantic entries
     */
    pub fn list_semantic_entries(&self) -> Vec<&SemanticMemoryEntry> {
        self.store.semantic_entries.values().collect()
    }

    /**
     * Search episodic history for relevant past missions
     */
    pub fn search_episodic_history(&self, query: &str) -> Vec<&EpisodicMemoryRecord> {
        let q_lower = query.to_lowercase();
        self.store
            .episodic_records
            .iter()
            .filter(|r| r.objective.to_lowercase().contains(&q_lower) || r.outcome.to_lowercase().contains(&q_lower))
            .collect()
    }

    fn persist(&self) -> Result<(), String> {
        let json_str = serde_json::to_string_pretty(&self.store).map_err(|e| e.to_string())?;
        fs::write(&self.storage_path, json_str).map_err(|e| e.to_string())?;
        Ok(())
    }
}

use sha2::Digest;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_engine_episodic_and_semantic() {
        let temp_dir = std::env::temp_dir().join("argus_test_memory");
        let _ = fs::create_dir_all(&temp_dir);

        let mut engine = MemoryEngine::new(temp_dir.clone());

        // 1. Record semantic operator preference
        engine.set_semantic_entry("user_preferred_download_dir", "Documents/PDFs", "preferences");
        let entry = engine.get_semantic_entry("user_preferred_download_dir");
        assert!(entry.is_some());
        assert_eq!(entry.unwrap().value, "Documents/PDFs");

        // 2. Record episodic mission with SHA-256 provenance
        let record = engine.record_mission(
            "PLAN-999",
            "Organize Downloads folder",
            "SUCCESS: 12 PDFs moved",
            Some("Good job, do this automatically next time"),
        );
        assert_eq!(record.session_id, "PLAN-999");
        assert!(!record.provenance_sha256.is_empty());

        // 3. Search history
        let search_res = engine.search_episodic_history("Downloads");
        assert_eq!(search_res.len(), 1);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
