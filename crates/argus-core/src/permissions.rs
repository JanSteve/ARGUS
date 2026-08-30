use serde::{Deserialize, Serialize};

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AuthorityDecision {
    ALLOWED,
    APPROVAL_REQUIRED,
    HARD_DENIED,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionEvaluation {
    pub decision: AuthorityDecision,
    pub capability: String,
    pub target: String,
    pub reason: String,
}

pub struct PermissionEngine;

impl PermissionEngine {
    pub fn evaluate_action(capability: &str, target: &str) -> PermissionEvaluation {
        // Hard Denied Actions
        if capability == "root.execute"
            || capability == "system.kernel.modify"
            || capability == "credential.read"
            || target.contains("/etc/shadow")
            || target.contains(".ssh/")
            || target.contains(".env")
            || target.contains("sudo")
        {
            return PermissionEvaluation {
                decision: AuthorityDecision::HARD_DENIED,
                capability: capability.to_string(),
                target: target.to_string(),
                reason: "Operation violates fundamental sovereign security invariants.".to_string(),
            };
        }

        // Approval Required Actions
        if capability == "package.install"
            || capability == "deployment.execute"
            || capability == "filesystem.bulk_delete"
            || capability == "email.send"
            || capability == "external.message.send"
            || capability == "git.force_push"
        {
            return PermissionEvaluation {
                decision: AuthorityDecision::APPROVAL_REQUIRED,
                capability: capability.to_string(),
                target: target.to_string(),
                reason: "High-impact external/system operation requires explicit human approval.".to_string(),
            };
        }

        // Standard Allowed
        PermissionEvaluation {
            decision: AuthorityDecision::ALLOWED,
            capability: capability.to_string(),
            target: target.to_string(),
            reason: "Standard bounded capability authorized.".to_string(),
        }
    }
}
