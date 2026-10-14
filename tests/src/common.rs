//! Common utilities, paths, and environment fixtures for ARGUS Autonomous Linux Agent Daemon E2E tests

use std::fs;
use std::path::{Path, PathBuf};

pub fn target_repo_path() -> PathBuf {
    if let Ok(p) = std::env::var("ARGUS_REPO_PATH") {
        return PathBuf::from(p);
    }
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    if let Some(parent) = manifest_dir.parent() {
        if parent.join("crates").exists() {
            return parent.to_path_buf();
        }
    }
    PathBuf::from("/Users/janstevedaniel/Desktop/ARGUS IN ANTIGRAVITY")
}

pub fn target_crates_path() -> PathBuf {
    target_repo_path().join("crates")
}

pub fn target_scripts_path() -> PathBuf {
    target_repo_path().join("scripts")
}

pub fn target_docs_path() -> PathBuf {
    target_repo_path().join("docs")
}

use std::sync::atomic::{AtomicUsize, Ordering};

static WORKSPACE_COUNTER: AtomicUsize = AtomicUsize::new(0);

pub fn create_temp_workspace() -> PathBuf {
    let count = WORKSPACE_COUNTER.fetch_add(1, Ordering::SeqCst);
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let tmp = std::env::temp_dir().join(format!("argus_e2e_test_{}_{}_{}", std::process::id(), count, nanos));
    let _ = fs::create_dir_all(&tmp);
    tmp
}

pub fn cleanup_temp_workspace(path: &Path) {
    if path.exists() {
        let _ = fs::remove_dir_all(path);
    }
}
