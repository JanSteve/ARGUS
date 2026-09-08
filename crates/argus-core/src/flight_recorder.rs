use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;
const AUDIT_SECRET_KEY: &[u8] = b"ARGUS_SOVEREIGN_FLIGHT_RECORDER_AUDIT_KEY_2026";
pub const GENESIS_PREV_HASH: &str = "0000000000000000000000000000000000000000000000000000000000000000";

fn default_prev_hash() -> String {
    GENESIS_PREV_HASH.to_string()
}

fn current_timestamp() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    format!("{}", now)
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FlightEvent {
    pub timestamp: String,
    pub tool: String,
    pub target: String,
    pub allowed: bool,
    pub rule: String,
    pub duration_ms: u64,
    #[serde(default = "default_prev_hash")]
    pub prev_hash: String,
    #[serde(default)]
    pub event_hash: String,
}

impl FlightEvent {
    pub fn calculate_hash(
        timestamp: &str,
        tool: &str,
        target: &str,
        allowed: bool,
        rule: &str,
        duration_ms: u64,
        prev_hash: &str,
    ) -> String {
        let payload = format!(
            "{}:{}:{}:{}:{}:{}:{}",
            timestamp, tool, target, allowed, rule, duration_ms, prev_hash
        );
        let mut hasher = Sha256::new();
        hasher.update(payload.as_bytes());
        hex::encode(hasher.finalize())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlightSession {
    pub session_id: String,
    pub objective: String,
    pub started_at: String,
    pub status: String,
    pub events: Vec<FlightEvent>,
    #[serde(default)]
    pub session_signature: Option<String>,
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

    pub fn default_dir() -> Self {
        let storage_dir = crate::paths::get_argus_flight_recorder_dir();
        let _ = fs::create_dir_all(&storage_dir);
        Self { storage_dir }
    }

    pub fn start_session(session_id: &str, objective: &str) -> FlightSession {
        FlightSession {
            session_id: session_id.to_string(),
            objective: objective.to_string(),
            started_at: current_timestamp(),
            status: "IN_PROGRESS".to_string(),
            events: Vec::new(),
            session_signature: None,
        }
    }

    pub fn record_event(
        session: &mut FlightSession,
        tool: &str,
        target: &str,
        allowed: bool,
        rule: &str,
        duration_ms: u64,
    ) -> FlightEvent {
        let ts = current_timestamp();
        let prev_hash = if let Some(last) = session.events.last() {
            if !last.event_hash.is_empty() {
                last.event_hash.clone()
            } else {
                GENESIS_PREV_HASH.to_string()
            }
        } else {
            GENESIS_PREV_HASH.to_string()
        };

        let event_hash = FlightEvent::calculate_hash(
            &ts,
            tool,
            target,
            allowed,
            rule,
            duration_ms,
            &prev_hash,
        );

        let event = FlightEvent {
            timestamp: ts,
            tool: tool.to_string(),
            target: target.to_string(),
            allowed,
            rule: rule.to_string(),
            duration_ms,
            prev_hash,
            event_hash,
        };

        session.events.push(event.clone());
        event
    }

    pub fn finalize_session(&self, session: &mut FlightSession, final_status: &str) -> Result<String, String> {
        session.status = final_status.to_string();

        // Ensure every event has valid hashes in sequence
        let mut prev = GENESIS_PREV_HASH.to_string();
        for event in &mut session.events {
            event.prev_hash = prev.clone();
            if event.event_hash.is_empty() {
                event.event_hash = FlightEvent::calculate_hash(
                    &event.timestamp,
                    &event.tool,
                    &event.target,
                    event.allowed,
                    &event.rule,
                    event.duration_ms,
                    &event.prev_hash,
                );
            }
            prev = event.event_hash.clone();
        }

        let last_hash = session.events.last().map(|e| e.event_hash.as_str()).unwrap_or(GENESIS_PREV_HASH);
        let payload = format!(
            "{}:{}:{}:{}:{}",
            session.session_id, session.objective, session.status, session.events.len(), last_hash
        );

        let mut mac = HmacSha256::new_from_slice(AUDIT_SECRET_KEY).expect("HMAC valid key");
        mac.update(payload.as_bytes());
        let signature = hex::encode(mac.finalize().into_bytes());

        session.session_signature = Some(signature.clone());
        self.save_session(session).map_err(|e| e.to_string())?;
        Ok(signature)
    }

    pub fn verify_session_integrity(session: &FlightSession) -> Result<bool, String> {
        let mut expected_prev_hash = GENESIS_PREV_HASH.to_string();

        for (i, event) in session.events.iter().enumerate() {
            if event.prev_hash != expected_prev_hash {
                return Err(format!(
                    "Hash chain broken at event #{}: prev_hash mismatch",
                    i
                ));
            }
            let recalc = FlightEvent::calculate_hash(
                &event.timestamp,
                &event.tool,
                &event.target,
                event.allowed,
                &event.rule,
                event.duration_ms,
                &event.prev_hash,
            );
            if recalc != event.event_hash {
                return Err(format!(
                    "Tampering detected in event #{}: stored hash {}, recomputed hash {}",
                    i, event.event_hash, recalc
                ));
            }
            expected_prev_hash = event.event_hash.clone();
        }

        if let Some(ref sig) = session.session_signature {
            let last_hash = session.events.last().map(|e| e.event_hash.as_str()).unwrap_or(GENESIS_PREV_HASH);
            let payload = format!(
                "{}:{}:{}:{}:{}",
                session.session_id, session.objective, session.status, session.events.len(), last_hash
            );

            let mut mac = HmacSha256::new_from_slice(AUDIT_SECRET_KEY).expect("HMAC valid key");
            mac.update(payload.as_bytes());
            if let Ok(sig_bytes) = hex::decode(sig) {
                if mac.verify_slice(&sig_bytes).is_err() {
                    return Err("Cryptographic audit signature mismatch - flight log tampered".to_string());
                }
            } else {
                return Err("Invalid hex signature format".to_string());
            }
        }

        Ok(true)
    }

    pub fn save_session(&self, session: &FlightSession) -> std::io::Result<PathBuf> {
        let file_path = self.storage_dir.join(format!("{}.json", session.session_id));
        let json = serde_json::to_string_pretty(session)?;
        fs::write(&file_path, json)?;
        Ok(file_path)
    }

    pub fn load_session(&self, session_id: &str) -> std::io::Result<FlightSession> {
        let file_path = self.storage_dir.join(format!("{}.json", session_id));
        let content = fs::read_to_string(&file_path)?;
        let session = serde_json::from_str(&content)?;
        Ok(session)
    }

    pub fn list_sessions(&self) -> Vec<String> {
        let mut list = Vec::new();
        if let Ok(entries) = fs::read_dir(&self.storage_dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    if name.ends_with(".json") {
                        list.push(name.trim_end_matches(".json").to_string());
                    }
                }
            }
        }
        list.sort();
        list
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_record_and_verify_session() {
        let temp = std::env::temp_dir().join("argus_flight_test");
        let recorder = FlightRecorder::new(temp.clone());

        let mut session = FlightRecorder::start_session("TEST-SESS-001", "Organize Documents");
        FlightRecorder::record_event(&mut session, "workspace.read", "test.txt", true, "RULE_ALLOW", 5);
        FlightRecorder::record_event(&mut session, "workspace.write", "output.txt", true, "RULE_ALLOW", 12);
        FlightRecorder::record_event(&mut session, "verifier.sha256", "output.txt", true, "RULE_VERIFIED", 2);

        assert_eq!(session.events.len(), 3);
        assert_eq!(session.events[0].prev_hash, GENESIS_PREV_HASH);
        assert_eq!(session.events[1].prev_hash, session.events[0].event_hash);
        assert_eq!(session.events[2].prev_hash, session.events[1].event_hash);

        let sig = recorder.finalize_session(&mut session, "SUCCESS").expect("Finalize success");
        assert!(!sig.is_empty());

        let verified = FlightRecorder::verify_session_integrity(&session).expect("Integrity check");
        assert!(verified);

        let _ = fs::remove_dir_all(&temp);
    }

    #[test]
    fn test_tampered_event_detected() {
        let temp = std::env::temp_dir().join("argus_flight_tamper_test");
        let recorder = FlightRecorder::new(temp.clone());

        let mut session = FlightRecorder::start_session("TEST-SESS-TAMPER", "Privileged Operation");
        FlightRecorder::record_event(&mut session, "workspace.read", "safe.txt", true, "RULE_ALLOW", 5);
        FlightRecorder::record_event(&mut session, "process.execute", "ls", true, "RULE_ALLOW", 10);
        let _ = recorder.finalize_session(&mut session, "SUCCESS");

        // Adversary tampers with target file in event #0
        session.events[0].target = "/etc/shadow".to_string();

        let res = FlightRecorder::verify_session_integrity(&session);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Tampering detected"));

        let _ = fs::remove_dir_all(&temp);
    }

    #[test]
    fn test_tampered_signature_detected() {
        let temp = std::env::temp_dir().join("argus_flight_sig_tamper_test");
        let recorder = FlightRecorder::new(temp.clone());

        let mut session = FlightRecorder::start_session("TEST-SESS-SIG", "Integrity Test");
        FlightRecorder::record_event(&mut session, "workspace.read", "data.json", true, "RULE_ALLOW", 3);
        let _ = recorder.finalize_session(&mut session, "SUCCESS");

        // Corrupt signature
        session.session_signature = Some("deadbeef00112233445566778899aabbccddeeff".to_string());

        let res = FlightRecorder::verify_session_integrity(&session);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("audit signature mismatch"));

        let _ = fs::remove_dir_all(&temp);
    }
}

