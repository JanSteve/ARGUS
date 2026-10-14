//! # ARGUS Voice Call Orchestrator (`argus-phone`)
//!
//! Provides outbound AI phone call orchestration via Vapi.ai for:
//! - **Build/Deploy Notifications:** Automated calls when builds finish or fail.
//! - **Human Approval Gates:** Voice-based approve/reject for dangerous operations.
//! - **Daily Standup Reports:** Scheduled status summary calls.
//!
//! ## Architecture
//!
//! ```text
//! argusd ──→ CallRequest ──→ Vapi.ai API ──→ Phone Call ──→ User
//!                                   │
//!                              AI Assistant
//!                           (ARGUS Persona)
//!                                   │
//!                              Webhook ──→ argusd (approval response)
//! ```

use serde::{Deserialize, Serialize};

// ─── Call Types ──────────────────────────────────────────────────────────────

/// The reason ARGUS is initiating a phone call.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CallPurpose {
    /// Build or deployment completed (success or failure).
    BuildNotification {
        project: String,
        status: BuildStatus,
        duration_secs: u64,
        summary: String,
    },
    /// ARGUS needs human approval before proceeding with a dangerous operation.
    ApprovalGate {
        operation: String,
        risk_level: RiskLevel,
        details: String,
        timeout_secs: u64,
    },
    /// Scheduled daily standup-style status report.
    DailyStandup {
        active_tasks: Vec<TaskSummary>,
        completed_since_last: Vec<TaskSummary>,
        blocked_items: Vec<String>,
        system_health: SystemHealthSummary,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BuildStatus {
    Success,
    Failed,
    PartialSuccess { passed: u32, failed: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TaskSummary {
    pub name: String,
    pub status: String,
    pub progress_percent: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SystemHealthSummary {
    pub cpu_percent: f32,
    pub memory_percent: f32,
    pub disk_percent: f32,
    pub uptime_hours: u64,
    pub active_processes: u32,
}

// ─── Call Request ────────────────────────────────────────────────────────────

/// A request to initiate an outbound phone call via Vapi.ai.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallRequest {
    /// The phone number to call (E.164 format, e.g., "+919384670536").
    pub to_number: String,
    /// The purpose of this call.
    pub purpose: CallPurpose,
    /// Maximum call duration in seconds (default: 300 = 5 minutes).
    pub max_duration_secs: u64,
}

/// The response from Vapi.ai after initiating a call.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallResponse {
    /// Vapi call ID for tracking.
    pub call_id: String,
    /// Current status of the call.
    pub status: CallStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CallStatus {
    Queued,
    Ringing,
    InProgress,
    Completed,
    Failed,
    NoAnswer,
    Busy,
}

// ─── Approval Response ──────────────────────────────────────────────────────

/// The user's response to an approval gate call.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ApprovalDecision {
    Approved,
    Rejected,
    Deferred { reason: String },
    Timeout,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalResponse {
    pub call_id: String,
    pub decision: ApprovalDecision,
    pub timestamp: u64,
    pub transcript: Option<String>,
}

// ─── Vapi.ai API Payload Builders ────────────────────────────────────────────

/// Configuration for the Vapi.ai assistant that represents ARGUS on calls.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArgusAssistantConfig {
    pub name: String,
    pub system_prompt: String,
    pub first_message: String,
    pub voice_id: String,
    pub model: String,
}

impl Default for ArgusAssistantConfig {
    fn default() -> Self {
        Self {
            name: "ARGUS Voice Agent".to_string(),
            system_prompt: ARGUS_SYSTEM_PROMPT.to_string(),
            first_message: "Hello! This is ARGUS, your autonomous Linux agent daemon. I have an update for you.".to_string(),
            voice_id: "josh".to_string(),
            model: "gpt-4o-mini".to_string(),
        }
    }
}

/// System prompt for the ARGUS voice agent.
pub const ARGUS_SYSTEM_PROMPT: &str = r#"You are ARGUS, an autonomous voice-native Linux agent daemon created by R Jan Steve Daniel. You are calling the developer to provide system updates, request approvals, or deliver status reports.

Your personality:
- Professional but friendly, like a trusted engineering colleague
- Concise and to-the-point — developers are busy
- You speak clearly and at a moderate pace
- You always state the purpose of the call immediately
- For approval requests, you clearly explain the risk and wait for a yes/no answer
- You confirm understanding before hanging up

For BUILD NOTIFICATIONS:
- State the project name and build result immediately
- If failed, briefly mention the error
- Ask if they want details sent to their terminal

For APPROVAL GATES:
- State the operation clearly
- Explain the risk level (Low/Medium/High/Critical)
- Wait for explicit "approved" or "rejected"
- If unclear, ask again — never assume approval
- Confirm the decision before ending

For DAILY STANDUP:
- Keep it under 2 minutes
- Highlight blocked items first
- Then completed tasks
- Then active tasks
- End with system health summary"#;

// ─── Vapi.ai Outbound Call Payload ──────────────────────────────────────────

/// Generates the JSON payload for a Vapi.ai outbound call API request.
pub fn build_vapi_outbound_payload(
    request: &CallRequest,
    phone_number_id: &str,
    assistant_config: Option<&ArgusAssistantConfig>,
) -> serde_json::Value {
    let config = assistant_config
        .cloned()
        .unwrap_or_default();

    let first_message = match &request.purpose {
        CallPurpose::BuildNotification { project, status, duration_secs, summary } => {
            let status_text = match status {
                BuildStatus::Success => "succeeded".to_string(),
                BuildStatus::Failed => "failed".to_string(),
                BuildStatus::PartialSuccess { passed, failed } => {
                    format!("partially succeeded with {} passed and {} failed", passed, failed)
                }
            };
            format!(
                "Hello! This is ARGUS. Your build for project {} has {}. It took {} seconds. {}. Would you like more details?",
                project, status_text, duration_secs, summary
            )
        }
        CallPurpose::ApprovalGate { operation, risk_level, details, .. } => {
            let risk_text = match risk_level {
                RiskLevel::Low => "low risk",
                RiskLevel::Medium => "medium risk",
                RiskLevel::High => "high risk",
                RiskLevel::Critical => "critical risk",
            };
            format!(
                "Hello! This is ARGUS. I need your approval for a {} operation: {}. {}. Do you approve or reject this action?",
                risk_text, operation, details
            )
        }
        CallPurpose::DailyStandup { active_tasks, completed_since_last, blocked_items, system_health } => {
            let blocked_text = if blocked_items.is_empty() {
                "No blocked items.".to_string()
            } else {
                format!("You have {} blocked items: {}.", blocked_items.len(), blocked_items.join(", "))
            };
            format!(
                "Good morning! This is ARGUS with your daily standup. {} tasks completed, {} active, {} blocked. System health: CPU at {:.0}%, memory at {:.0}%. {}",
                completed_since_last.len(),
                active_tasks.len(),
                blocked_items.len(),
                system_health.cpu_percent,
                system_health.memory_percent,
                blocked_text
            )
        }
    };

    serde_json::json!({
        "phoneNumberId": phone_number_id,
        "customer": {
            "number": request.to_number
        },
        "assistant": {
            "name": config.name,
            "model": {
                "provider": "openai",
                "model": config.model,
                "messages": [
                    {
                        "role": "system",
                        "content": config.system_prompt
                    }
                ]
            },
            "voice": {
                "provider": "11labs",
                "voiceId": config.voice_id
            },
            "firstMessage": first_message,
            "endCallFunctionEnabled": true,
            "maxDurationSeconds": request.max_duration_secs as i64
        }
    })
}

// ─── Tests ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_notification_payload() {
        let request = CallRequest {
            to_number: "+919384670536".to_string(),
            purpose: CallPurpose::BuildNotification {
                project: "ARGUS".to_string(),
                status: BuildStatus::Success,
                duration_secs: 42,
                summary: "All 59 tests passed.".to_string(),
            },
            max_duration_secs: 120,
        };

        let payload = build_vapi_outbound_payload(&request, "phone-123", None);
        assert_eq!(payload["customer"]["number"], "+919384670536");
        assert_eq!(payload["phoneNumberId"], "phone-123");
        assert!(payload["assistant"]["firstMessage"]
            .as_str()
            .unwrap()
            .contains("succeeded"));
    }

    #[test]
    fn test_approval_gate_payload() {
        let request = CallRequest {
            to_number: "+919384670536".to_string(),
            purpose: CallPurpose::ApprovalGate {
                operation: "Install nginx package".to_string(),
                risk_level: RiskLevel::Medium,
                details: "This will modify system packages.".to_string(),
                timeout_secs: 60,
            },
            max_duration_secs: 180,
        };

        let payload = build_vapi_outbound_payload(&request, "phone-456", None);
        let first_msg = payload["assistant"]["firstMessage"].as_str().unwrap();
        assert!(first_msg.contains("medium risk"));
        assert!(first_msg.contains("nginx"));
        assert!(first_msg.contains("approve or reject"));
    }

    #[test]
    fn test_daily_standup_payload() {
        let request = CallRequest {
            to_number: "+919384670536".to_string(),
            purpose: CallPurpose::DailyStandup {
                active_tasks: vec![
                    TaskSummary { name: "Build ARGUS".to_string(), status: "running".to_string(), progress_percent: 85 },
                ],
                completed_since_last: vec![
                    TaskSummary { name: "Fix sandbox".to_string(), status: "done".to_string(), progress_percent: 100 },
                    TaskSummary { name: "Update README".to_string(), status: "done".to_string(), progress_percent: 100 },
                ],
                blocked_items: vec!["Docker test harness needs review".to_string()],
                system_health: SystemHealthSummary {
                    cpu_percent: 23.5,
                    memory_percent: 61.2,
                    disk_percent: 45.0,
                    uptime_hours: 72,
                    active_processes: 142,
                },
            },
            max_duration_secs: 180,
        };

        let payload = build_vapi_outbound_payload(&request, "phone-789", None);
        let first_msg = payload["assistant"]["firstMessage"].as_str().unwrap();
        assert!(first_msg.contains("2 tasks completed"));
        assert!(first_msg.contains("1 active"));
        assert!(first_msg.contains("1 blocked"));
    }

    #[test]
    fn test_call_purpose_serialization() {
        let purpose = CallPurpose::BuildNotification {
            project: "ARGUS".to_string(),
            status: BuildStatus::PartialSuccess { passed: 57, failed: 2 },
            duration_secs: 120,
            summary: "2 tests failed in argus-net".to_string(),
        };

        let json = serde_json::to_string(&purpose).unwrap();
        assert!(json.contains("PartialSuccess"));
        assert!(json.contains("57"));

        let deserialized: CallPurpose = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, purpose);
    }

    #[test]
    fn test_approval_decision_serialization() {
        let response = ApprovalResponse {
            call_id: "call-abc-123".to_string(),
            decision: ApprovalDecision::Approved,
            timestamp: 1728777600,
            transcript: Some("Yes, I approve the nginx installation.".to_string()),
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("Approved"));

        let deserialized: ApprovalResponse = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.decision, ApprovalDecision::Approved);
    }

    #[test]
    fn test_default_assistant_config() {
        let config = ArgusAssistantConfig::default();
        assert_eq!(config.name, "ARGUS Voice Agent");
        assert!(config.system_prompt.contains("R Jan Steve Daniel"));
        assert!(config.system_prompt.contains("approval"));
    }
}
