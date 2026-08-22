// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Command;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_wifi_state() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        // Try en0 first (standard wifi port on macOS)
        let output = Command::new("networksetup")
            .args(&["-getapower", "en0"])
            .output();
        
        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            if stdout.contains("On") {
                return Ok(true);
            } else if stdout.contains("Off") {
                return Ok(false);
            }
        }
        
        // Fallback: search ports
        let ports_output = Command::new("networksetup")
            .args(&["-listallhardwareports"])
            .output();
        
        if let Ok(p_out) = ports_output {
            let p_stdout = String::from_utf8_lossy(&p_out.stdout);
            let mut wifi_interface = "en0".to_string();
            let lines: Vec<&str> = p_stdout.lines().collect();
            for i in 0..lines.len() {
                if lines[i].contains("Wi-Fi") || lines[i].contains("AirPort") {
                    if i + 1 < lines.len() {
                        let next_line = lines[i+1];
                        if let Some(idx) = next_line.find("Device: ") {
                            wifi_interface = next_line[idx + 8..].trim().to_string();
                            break;
                        }
                    }
                }
            }
            
            let final_output = Command::new("networksetup")
                .args(&["-getapower", &wifi_interface])
                .output();
            if let Ok(f_out) = final_output {
                let f_stdout = String::from_utf8_lossy(&f_out.stdout);
                return Ok(f_stdout.contains("On"));
            }
        }
        
        Ok(true) // Default fallback
    }

    #[cfg(target_os = "windows")]
    {
        let output = Command::new("netsh")
            .args(&["wlan", "show", "interfaces"])
            .output();
        
        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            if stdout.contains("there is no wireless interface") || stdout.contains("disabled") {
                return Ok(false);
            }
            return Ok(true);
        }
        Ok(true)
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Ok(true)
    }
}

#[tauri::command]
fn set_wifi_state(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let port = "en0";
        
        let ports_output = Command::new("networksetup")
            .args(&["-listallhardwareports"])
            .output();
        
        let target_port = if let Ok(p_out) = ports_output {
            let p_stdout = String::from_utf8_lossy(&p_out.stdout);
            let mut detected = port.to_string();
            let lines: Vec<&str> = p_stdout.lines().collect();
            for i in 0..lines.len() {
                if lines[i].contains("Wi-Fi") || lines[i].contains("AirPort") {
                    if i + 1 < lines.len() {
                        let next_line = lines[i+1];
                        if let Some(idx) = next_line.find("Device: ") {
                            detected = next_line[idx + 8..].trim().to_string();
                            break;
                        }
                    }
                }
            }
            detected
        } else {
            port.to_string()
        };

        let state_str = if enabled { "on" } else { "off" };
        let output = Command::new("networksetup")
            .args(&["-setapower", &target_port, state_str])
            .output();

        match output {
            Ok(out) if out.status.success() => Ok(()),
            Ok(out) => Err(String::from_utf8_lossy(&out.stderr).to_string()),
            Err(e) => Err(e.to_string()),
        }
    }

    #[cfg(target_os = "windows")]
    {
        let state_str = if enabled { "enabled" } else { "disabled" };
        let output = Command::new("netsh")
            .args(&["interface", "set", "interface", "name=Wi-Fi", &format!("admin={}", state_str)])
            .output();

        match output {
            Ok(out) if out.status.success() => Ok(()),
            Ok(out) => Err(String::from_utf8_lossy(&out.stderr).to_string()),
            Err(e) => Err(e.to_string()),
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = enabled;
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_wifi_state, set_wifi_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
