use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Structured task lifecycle execution states
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    Running,
    Success,
    Failed,
    Retrying,
}

impl TaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskStatus::Pending => "PENDING",
            TaskStatus::Running => "RUNNING",
            TaskStatus::Success => "SUCCESS",
            TaskStatus::Failed => "FAILED",
            TaskStatus::Retrying => "RETRY",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTask {
    pub id: String,
    pub name: String,
    pub capability: String,
    pub action: String,
    pub target: String,
    pub tool_params: HashMap<String, String>,
    pub status: String,
    pub dependencies: Vec<String>,
}

impl AgentTask {
    pub fn mark_success(&mut self) {
        self.status = TaskStatus::Success.as_str().to_string();
    }

    pub fn mark_failed(&mut self) {
        self.status = TaskStatus::Failed.as_str().to_string();
    }

    pub fn mark_retry(&mut self) {
        self.status = TaskStatus::Retrying.as_str().to_string();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPlan {
    pub plan_id: String,
    pub objective: String,
    pub tasks: Vec<AgentTask>,
}

pub struct AgentPlanner;

impl AgentPlanner {
    pub fn create_plan(objective: &str) -> AgentPlan {
        let plan_id = format!("PLAN-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
        
        let mut p1_params = HashMap::new();
        p1_params.insert("path".to_string(), "./".to_string());

        let mut p2_params = HashMap::new();
        p2_params.insert("rule".to_string(), "RULE_WORKSPACE_ALLOW".to_string());

        let mut p3_params = HashMap::new();
        p3_params.insert("jail".to_string(), "sandbox_jail".to_string());

        let mut p4_params = HashMap::new();
        p4_params.insert("algorithm".to_string(), "SHA-256".to_string());

        let mut p5_params = HashMap::new();
        p5_params.insert("output".to_string(), "EVIDENCE_REPORT.md".to_string());

        let tasks = vec![
            AgentTask {
                id: "step-1".to_string(),
                name: "Inspect Target Workspace".to_string(),
                capability: "workspace.list".to_string(),
                action: "list_directory".to_string(),
                target: "./".to_string(),
                tool_params: p1_params,
                status: "PENDING".to_string(),
                dependencies: vec![],
            },
            AgentTask {
                id: "step-2".to_string(),
                name: "Evaluate Permission & Policy".to_string(),
                capability: "policy.evaluate".to_string(),
                action: "evaluate_policy".to_string(),
                target: "RULE_WORKSPACE_ALLOW".to_string(),
                tool_params: p2_params,
                status: "PENDING".to_string(),
                dependencies: vec!["step-1".to_string()],
            },
            AgentTask {
                id: "step-3".to_string(),
                name: "Execute Operation in Sandbox".to_string(),
                capability: "process.execute".to_string(),
                action: "sandbox_exec".to_string(),
                target: "sandbox_jail".to_string(),
                tool_params: p3_params,
                status: "PENDING".to_string(),
                dependencies: vec!["step-2".to_string()],
            },
            AgentTask {
                id: "step-4".to_string(),
                name: "Independent Cryptographic Verification".to_string(),
                capability: "verification.read".to_string(),
                action: "verify_checksum".to_string(),
                target: "SHA-256 Checksum".to_string(),
                tool_params: p4_params,
                status: "PENDING".to_string(),
                dependencies: vec!["step-3".to_string()],
            },
            AgentTask {
                id: "step-5".to_string(),
                name: "Generate Evidence Report".to_string(),
                capability: "evidence.write".to_string(),
                action: "write_evidence".to_string(),
                target: "EVIDENCE_REPORT.md".to_string(),
                tool_params: p5_params,
                status: "PENDING".to_string(),
                dependencies: vec!["step-4".to_string()],
            },
        ];

        AgentPlan {
            plan_id,
            objective: objective.to_string(),
            tasks,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_plan_dag() {
        let plan = AgentPlanner::create_plan("Organize Downloads");
        assert_eq!(plan.objective, "Organize Downloads");
        assert_eq!(plan.tasks.len(), 5);
        assert_eq!(plan.tasks[0].capability, "workspace.list");
        assert_eq!(plan.tasks[4].capability, "evidence.write");
        assert!(plan.plan_id.starts_with("PLAN-"));
    }

    #[test]
    fn test_task_state_transitions() {
        let mut task = AgentTask {
            id: "step-test".to_string(),
            name: "Test Task".to_string(),
            capability: "workspace.write".to_string(),
            action: "write_file".to_string(),
            target: "test.txt".to_string(),
            tool_params: HashMap::new(),
            status: "PENDING".to_string(),
            dependencies: vec![],
        };
        assert_eq!(task.status, "PENDING");
        task.mark_success();
        assert_eq!(task.status, "SUCCESS");
        task.mark_failed();
        assert_eq!(task.status, "FAILED");
        task.mark_retry();
        assert_eq!(task.status, "RETRY");
    }
}
