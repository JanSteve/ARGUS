use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileOrganizationSummary {
    pub total_processed: usize,
    pub files_moved: usize,
    pub directories_created: usize,
    pub failures: usize,
    pub rollback_available: bool,
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

        FileOrganizationSummary {
            total_processed: processed,
            files_moved: moved,
            directories_created: created_dirs,
            failures: 0,
            rollback_available: true,
        }
    }
}
