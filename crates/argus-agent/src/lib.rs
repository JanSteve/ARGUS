use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTask {
    pub id: String,
    pub name: String,
    pub capability: String,
    pub target: String,
    pub status: String,
    pub dependencies: Vec<String>,
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
        
        let tasks = vec![
            AgentTask {
                id: "step-1".to_string(),
                name: "Inspect Target Workspace".to_string(),
                capability: "workspace.list".to_string(),
                target: "./".to_string(),
                status: "PENDING".to_string(),
                dependencies: vec![],
            },
            AgentTask {
                id: "step-2".to_string(),
                name: "Evaluate Permission & Policy".to_string(),
                capability: "policy.evaluate".to_string(),
                target: "RULE_WORKSPACE_ALLOW".to_string(),
                status: "PENDING".to_string(),
                dependencies: vec!["step-1".to_string()],
            },
            AgentTask {
                id: "step-3".to_string(),
                name: "Execute Operation in Sandbox".to_string(),
                capability: "process.execute".to_string(),
                target: "sandbox_jail".to_string(),
                status: "PENDING".to_string(),
                dependencies: vec!["step-2".to_string()],
            },
            AgentTask {
                id: "step-4".to_string(),
                name: "Independent Cryptographic Verification".to_string(),
                capability: "verification.read".to_string(),
                target: "SHA-256 Checksum".to_string(),
                status: "PENDING".to_string(),
                dependencies: vec!["step-3".to_string()],
            },
            AgentTask {
                id: "step-5".to_string(),
                name: "Generate Evidence Report".to_string(),
                capability: "evidence.write".to_string(),
                target: "EVIDENCE_REPORT.md".to_string(),
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
