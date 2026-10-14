use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryInfo {
    pub total_kb: u64,
    pub available_kb: u64,
    pub used_kb: u64,
    pub free_kb: u64,
    pub swap_total_kb: u64,
    pub swap_used_kb: u64,
    pub usage_percent: f64,
}

impl MemoryInfo {
    #[cfg(target_os = "linux")]
    pub fn collect() -> Self {
        let content = fs::read_to_string("/proc/meminfo").unwrap_or_default();
        let mut total_kb = 0;
        let mut free_kb = 0;
        let mut available_kb = 0;
        let mut swap_total_kb = 0;
        let mut swap_free_kb = 0;

        for line in content.lines() {
            let mut parts = line.split_whitespace();
            if let (Some(key), Some(value)) = (parts.next(), parts.next()) {
                let val: u64 = value.parse().unwrap_or(0);
                match key {
                    "MemTotal:" => total_kb = val,
                    "MemFree:" => free_kb = val,
                    "MemAvailable:" => available_kb = val,
                    "SwapTotal:" => swap_total_kb = val,
                    "SwapFree:" => swap_free_kb = val,
                    _ => {}
                }
            }
        }

        let used_kb = total_kb.saturating_sub(available_kb);
        let swap_used_kb = swap_total_kb.saturating_sub(swap_free_kb);
        let usage_percent = if total_kb > 0 {
            (used_kb as f64 / total_kb as f64) * 100.0
        } else {
            0.0
        };

        Self {
            total_kb,
            available_kb,
            used_kb,
            free_kb,
            swap_total_kb,
            swap_used_kb,
            usage_percent,
        }
    }

    #[cfg(not(target_os = "linux"))]
    pub fn collect() -> Self {
        Self {
            total_kb: 16_777_216,
            available_kb: 8_388_608,
            used_kb: 8_388_608,
            free_kb: 4_194_304,
            swap_total_kb: 2_097_152,
            swap_used_kb: 1_048_576,
            usage_percent: 50.0,
        }
    }
}
