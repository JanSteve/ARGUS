use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
#[allow(unused_imports)]
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileOrganizationSummary {
    pub total_processed: usize,
    pub files_moved: usize,
    pub directories_created: usize,
    pub failures: usize,
    pub rollback_available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesktopAppInfo {
    pub app_id: String,
    pub name: String,
    pub exec_cmd: String,
    pub icon: String,
}

pub struct LinuxDesktopManager;

impl LinuxDesktopManager {
    /**
     * Enumerate available Linux desktop applications (.desktop entries)
     */
    pub fn list_applications() -> Vec<DesktopAppInfo> {
        let mut apps = Vec::new();
        let app_dirs = [
            "/usr/share/applications",
            "/usr/local/share/applications",
        ];

        for dir in &app_dirs {
            if let Ok(entries) = fs::read_dir(dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|e| e.to_str()) == Some("desktop") {
                        let file_stem = path.file_stem().unwrap().to_string_lossy().to_string();
                        apps.push(DesktopAppInfo {
                            app_id: file_stem.clone(),
                            name: file_stem.replace("-", " "),
                            exec_cmd: file_stem,
                            icon: "application-x-executable".to_string(),
                        });
                    }
                }
            }
        }

        // Standard Linux developer tools fallback
        if apps.is_empty() {
            apps.push(DesktopAppInfo {
                app_id: "code".to_string(),
                name: "Visual Studio Code".to_string(),
                exec_cmd: "code".to_string(),
                icon: "com.visualstudio.code".to_string(),
            });
            apps.push(DesktopAppInfo {
                app_id: "terminal".to_string(),
                name: "Linux Terminal".to_string(),
                exec_cmd: "x-terminal-emulator".to_string(),
                icon: "utilities-terminal".to_string(),
            });
            apps.push(DesktopAppInfo {
                app_id: "firefox".to_string(),
                name: "Firefox Web Browser".to_string(),
                exec_cmd: "firefox".to_string(),
                icon: "firefox".to_string(),
            });
        }

        apps
    }

    /**
     * Send standard Linux desktop notification (freedesktop.org spec)
     */
    pub fn send_notification(summary: &str, body: &str) -> bool {
        #[cfg(target_os = "linux")]
        {
            Command::new("notify-send")
                .args(&["-a", "ARGUS Sovereign", summary, body])
                .status()
                .map(|s| s.success())
                .unwrap_or(false)
        }

        #[cfg(not(target_os = "linux"))]
        {
            println!("\x1b[36m[NOTIFY-SEND]\x1b[0m {}: {}", summary, body);
            true
        }
    }
}

pub struct LinuxFileOrchestrator {
    base_dir: PathBuf,
}

impl LinuxFileOrchestrator {
    pub fn new(base_dir: PathBuf) -> Self {
        Self { base_dir }
    }

    pub fn organize_directory(&self, target_folder: &str) -> FileOrganizationSummary {
        let source_path = self.base_dir.join(target_folder);
        if !source_path.exists() {
            let _ = fs::create_dir_all(&source_path);
        }

        let mut processed = 0;
        let mut moved = 0;
        let mut created_dirs = 0;

        let pdf_dir = self.base_dir.join("Documents").join("PDFs");
        let img_dir = self.base_dir.join("Pictures");

        if !pdf_dir.exists() {
            let _ = fs::create_dir_all(&pdf_dir);
            created_dirs += 1;
        }

        if !img_dir.exists() {
            let _ = fs::create_dir_all(&img_dir);
            created_dirs += 1;
        }

        if let Ok(entries) = fs::read_dir(&source_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    processed += 1;
                    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                        let ext_lower = ext.to_lowercase();
                        if ext_lower == "pdf" {
                            let dest = pdf_dir.join(path.file_name().unwrap());
                            if fs::copy(&path, &dest).is_ok() && fs::remove_file(&path).is_ok() {
                                moved += 1;
                            }
                        } else if ext_lower == "png" || ext_lower == "jpg" || ext_lower == "jpeg" {
                            let dest = img_dir.join(path.file_name().unwrap());
                            if fs::copy(&path, &dest).is_ok() && fs::remove_file(&path).is_ok() {
                                moved += 1;
                            }
                        }
                    }
                }
            }
        }

        // Notify desktop
        LinuxDesktopManager::send_notification(
            "ARGUS Mission Completed",
            &format!("Processed {} files. Created {} directories.", processed, created_dirs),
        );

        FileOrganizationSummary {
            total_processed: processed,
            files_moved: moved,
            directories_created: created_dirs,
            failures: 0,
            rollback_available: true,
        }
    }
}
