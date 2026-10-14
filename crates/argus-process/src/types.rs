use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProcessState {
    Running,      // 'R'
    Sleeping,     // 'S'
    DiskSleep,    // 'D'
    Zombie,       // 'Z'
    Stopped,      // 'T'
    Dead,         // 'X'
    Unknown,
}

impl ProcessState {
    pub fn from_char(c: char) -> Self {
        match c {
            'R' => ProcessState::Running,
            'S' => ProcessState::Sleeping,
            'D' => ProcessState::DiskSleep,
            'Z' => ProcessState::Zombie,
            'T' => ProcessState::Stopped,
            'X' => ProcessState::Dead,
            _ => ProcessState::Unknown,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub ppid: u32,
    pub name: String,
    pub command: String,
    pub state: ProcessState,
    pub cpu_percent: f32,
    pub memory_rss_bytes: u64,
    pub memory_virtual_bytes: u64,
    pub threads: u32,
    pub start_time: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessTreeNode {
    pub info: ProcessInfo,
    pub children: Vec<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessTree {
    pub root_pid: u32,
    pub nodes: HashMap<u32, ProcessTreeNode>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ProcessResourceLimits {
    pub max_memory_bytes: Option<u64>,
    pub max_cpu_time_secs: Option<u64>,
    pub max_execution_timeout_ms: Option<u64>,
    pub max_open_files: Option<u64>,
    pub max_pids: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReapSummary {
    pub reaped_pids: Vec<u32>,
    pub reaped_count: usize,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LimitViolationStatus {
    pub violated: bool,
    pub memory_exceeded: bool,
    pub cpu_exceeded: bool,
    pub timeout_exceeded: bool,
    pub reason: Option<String>,
}
