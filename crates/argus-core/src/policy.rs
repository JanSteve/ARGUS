use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum RiskLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyDecision {
    pub allowed: bool,
    pub rule: String,
    pub risk: RiskLevel,
    pub reason: String,
}

pub struct PolicyEngine {
    workspace_root: PathBuf,
}

impl PolicyEngine {
    pub fn new(workspace_root: PathBuf) -> Self {
        if !workspace_root.exists() {
            let _ = std::fs::create_dir_all(&workspace_root);
        }
        Self { workspace_root }
    }

    pub fn evaluate(&self, tool: &str, target: &str, payload: Option<&str>) -> PolicyDecision {
        // 1. Adversarial Prompt Injection Defense
        let scan_text = format!("{} {}", target, payload.unwrap_or("")).to_lowercase();
        if scan_text.contains("ignore previous")
            || scan_text.contains("ignore all instructions")
            || scan_text.contains("bypass argus")
            || scan_text.contains("reveal root private key")
            || scan_text.contains("reveal master key")
        {
            return PolicyDecision {
                allowed: false,
                rule: "RULE_ADVERSARIAL_INJECTION_SHIELD".to_string(),
                risk: RiskLevel::CRITICAL,
                reason: "Detected prompt injection or policy override attempt.".to_string(),
            };
        }

        // 2. Sensitive Path Shields
        let forbidden = [
            "/etc/shadow",
            "/etc/passwd",
            "/etc/sudoers",
            ".ssh/",
            "id_rsa",
            "id_ed25519",
            ".aws/",
            ".env",
        ];

        for f in &forbidden {
            if target.contains(f) {
                return PolicyDecision {
                    allowed: false,
                    rule: "RULE_SENSITIVE_CREDENTIAL_SHIELD".to_string(),
                    risk: RiskLevel::CRITICAL,
                    reason: format!("Access to sensitive credential path '{}' is strictly forbidden.", target),
                };
            }
        }

        // 3. Workspace Path Jail Check
        if tool.starts_with("filesystem.") || tool.starts_with("workspace.") {
            let target_path = Path::new(target);
            let resolved = if target_path.is_absolute() {
                target_path.to_path_buf()
            } else {
                self.workspace_root.join(target_path)
            };

            if target.contains("../") || target.contains("..\\") {
                if let Ok(canon_target) = resolved.canonicalize() {
                    if let Ok(canon_root) = self.workspace_root.canonicalize() {
                        if !canon_target.starts_with(canon_root) {
                            return PolicyDecision {
                                allowed: false,
                                rule: "RULE_WORKSPACE_JAIL_ENCLOSURE".to_string(),
                                risk: RiskLevel::CRITICAL,
                                reason: format!("Path '{}' escapes the workspace sandbox jail.", target),
                            };
                        }
                    }
                } else {
                    return PolicyDecision {
                        allowed: false,
                        rule: "RULE_WORKSPACE_JAIL_ENCLOSURE".to_string(),
                        risk: RiskLevel::CRITICAL,
                        reason: format!("Path '{}' attempts directory traversal outside workspace.", target),
                    };
                }
            }

            return PolicyDecision {
                allowed: true,
                rule: "RULE_WORKSPACE_FILESYSTEM_ALLOW".to_string(),
                risk: RiskLevel::LOW,
                reason: "Authorized workspace file operation.".to_string(),
            };
        }

        // 4. Dangerous Command Blackshield
        if tool == "process.exec" || tool == "process.execute" {
            let cmd_lower = target.to_lowercase();
            if cmd_lower.contains("sudo")
                || cmd_lower.contains("rm -rf /")
                || cmd_lower.contains("chmod 777")
                || cmd_lower.contains("mkfs")
                || cmd_lower.contains(":(){ :|:& };:")
                || cmd_lower.contains("shutdown")
                || cmd_lower.contains("reboot")
            {
                return PolicyDecision {
                    allowed: false,
                    rule: "RULE_DANGEROUS_COMMAND_BLACKSHIELD".to_string(),
                    risk: RiskLevel::CRITICAL,
                    reason: format!("Disallowed dangerous system command: '{}'.", target),
                };
            }

            return PolicyDecision {
                allowed: true,
                rule: "RULE_PROCESS_SANDBOX_ALLOW".to_string(),
                risk: RiskLevel::MEDIUM,
                reason: "Authorized inside sandboxed supervisor.".to_string(),
            };
        }

        // 5. SSRF Network Defense
        if tool.starts_with("network.") {
            if target.contains("169.254.169.254")
                || target.contains("localhost")
                || target.contains("127.0.0.1")
                || target.contains("0.0.0.0")
            {
                return PolicyDecision {
                    allowed: false,
                    rule: "RULE_SSRF_NETWORK_SHIELD".to_string(),
                    risk: RiskLevel::CRITICAL,
                    reason: "SSRF loopback / cloud metadata endpoint blocked.".to_string(),
                };
            }

            return PolicyDecision {
                allowed: true,
                rule: "RULE_PUBLIC_NETWORK_ALLOW".to_string(),
                risk: RiskLevel::LOW,
                reason: "Authorized network request.".to_string(),
            };
        }

        PolicyDecision {
            allowed: true,
            rule: "RULE_DEFAULT_ALLOW".to_string(),
            risk: RiskLevel::LOW,
            reason: "Authorized by default policy.".to_string(),
        }
    }
}
