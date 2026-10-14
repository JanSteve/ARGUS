use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
    pub model_name: String,
    pub cores: u32,
    pub threads: u32,
    pub architecture: String,
    pub frequency_mhz: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuUsage {
    pub user_pct: f64,
    pub system_pct: f64,
    pub idle_pct: f64,
    pub iowait_pct: f64,
}

impl CpuInfo {
    #[cfg(target_os = "linux")]
    pub fn collect() -> Self {
        let content = fs::read_to_string("/proc/cpuinfo").unwrap_or_default();
        let mut model_name = String::from("Unknown");
        let mut cores = 1;
        let mut threads = 1;
        let mut frequency_mhz = 0.0;

        for line in content.lines() {
            if line.starts_with("model name") {
                if let Some(name) = line.split(':').nth(1) {
                    model_name = name.trim().to_string();
                }
            } else if line.starts_with("cpu cores") {
                if let Some(c) = line.split(':').nth(1) {
                    cores = c.trim().parse().unwrap_or(1);
                }
            } else if line.starts_with("siblings") {
                if let Some(t) = line.split(':').nth(1) {
                    threads = t.trim().parse().unwrap_or(1);
                }
            } else if line.starts_with("cpu MHz") {
                if let Some(freq) = line.split(':').nth(1) {
                    frequency_mhz = freq.trim().parse().unwrap_or(0.0);
                }
            }
        }

        Self {
            model_name,
            cores,
            threads,
            architecture: std::env::consts::ARCH.to_string(),
            frequency_mhz,
        }
    }

    #[cfg(not(target_os = "linux"))]
    pub fn collect() -> Self {
        Self {
            model_name: String::from("Apple Silicon / Generic macOS Mock"),
            cores: 8,
            threads: 8,
            architecture: std::env::consts::ARCH.to_string(),
            frequency_mhz: 3200.0,
        }
    }
}

impl CpuUsage {
    #[cfg(target_os = "linux")]
    pub fn collect() -> Self {
        let content = fs::read_to_string("/proc/stat").unwrap_or_default();
        if let Some(line) = content.lines().find(|l| l.starts_with("cpu ")) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 6 {
                let user: f64 = parts[1].parse().unwrap_or(0.0);
                let system: f64 = parts[3].parse().unwrap_or(0.0);
                let idle: f64 = parts[4].parse().unwrap_or(0.0);
                let iowait: f64 = parts[5].parse().unwrap_or(0.0);
                let total = user + system + idle + iowait;
                if total > 0.0 {
                    return Self {
                        user_pct: (user / total) * 100.0,
                        system_pct: (system / total) * 100.0,
                        idle_pct: (idle / total) * 100.0,
                        iowait_pct: (iowait / total) * 100.0,
                    };
                }
            }
        }
        Self {
            user_pct: 0.0,
            system_pct: 0.0,
            idle_pct: 0.0,
            iowait_pct: 0.0,
        }
    }

    #[cfg(not(target_os = "linux"))]
    pub fn collect() -> Self {
        Self {
            user_pct: 10.0,
            system_pct: 5.0,
            idle_pct: 85.0,
            iowait_pct: 0.0,
        }
    }
}
