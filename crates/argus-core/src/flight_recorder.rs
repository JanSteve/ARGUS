use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlightEvent {
    pub timestamp: String,
    pub tool: String,
    pub target: String,
    pub allowed: bool,
    pub rule: String,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlightSession {
    pub session_id: String,
    pub objective: String,
    pub started_at: String,
    pub status: String,
    pub events: Vec<FlightEvent>,
}

pub struct FlightRecorder {
    storage_dir: PathBuf,
}

impl FlightRecorder {
    pub fn new(workspace_root: PathBuf) -> Self {
        let storage_dir = workspace_root.join(".argus").join("flight_recorder");
        let _ = fs::create_dir_all(&storage_dir);
        Self { storage_dir }
    }

    pub fn save_session(&self, session: &FlightSession) -> std::io::Result<PathBuf> {
        let file_path = self.storage_dir.join(format!("{}.json", session.session_id));
        let json = serde_json::to_string_pretty(session)?;
        fs::write(&file_path, json)?;
        Ok(file_path)
    }
}
