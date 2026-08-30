use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoiceIntentType {
    OrganizeFiles,
    LaunchApplication,
    ExplainAction,
    ExecuteCommand,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceIntent {
    pub raw_transcription: String,
    pub intent_type: VoiceIntentType,
    pub parameters: serde_json::Value,
    pub confidence: f32,
}

pub struct VoiceEngine;

impl VoiceEngine {
    pub fn parse_spoken_command(transcription: &str) -> VoiceIntent {
        let lower = transcription.to_lowercase();

        if lower.contains("organize") || lower.contains("clean") || lower.contains("downloads") {
            VoiceIntent {
                raw_transcription: transcription.to_string(),
                intent_type: VoiceIntentType::OrganizeFiles,
                parameters: serde_json::json!({ "target": "Downloads" }),
                confidence: 0.98,
            }
        } else if lower.contains("launch") || lower.contains("open") {
            let app = if lower.contains("code") {
                "code"
            } else if lower.contains("terminal") {
                "terminal"
            } else {
                "browser"
            };
            VoiceIntent {
                raw_transcription: transcription.to_string(),
                intent_type: VoiceIntentType::LaunchApplication,
                parameters: serde_json::json!({ "app": app }),
                confidence: 0.95,
            }
        } else if lower.contains("why") || lower.contains("explain") {
            VoiceIntent {
                raw_transcription: transcription.to_string(),
                intent_type: VoiceIntentType::ExplainAction,
                parameters: serde_json::json!({}),
                confidence: 0.99,
            }
        } else {
            VoiceIntent {
                raw_transcription: transcription.to_string(),
                intent_type: VoiceIntentType::ExecuteCommand,
                parameters: serde_json::json!({ "command": transcription }),
                confidence: 0.85,
            }
        }
    }
}
