use std::fs;
use std::path::PathBuf;

/**
 * Returns the canonical root directory for ARGUS configuration and persistent state.
 * Hierarchy:
 * 1. $ARGUS_HOME
 * 2. $HOME/.argus
 * 3. Fallback: ./.argus
 */
pub fn get_argus_home() -> PathBuf {
    if let Ok(val) = std::env::var("ARGUS_HOME") {
        if !val.trim().is_empty() {
            let p = PathBuf::from(val.trim());
            let _ = fs::create_dir_all(&p);
            return p;
        }
    }

    if let Ok(home) = std::env::var("HOME") {
        if !home.trim().is_empty() {
            let p = PathBuf::from(home.trim()).join(".argus");
            let _ = fs::create_dir_all(&p);
            return p;
        }
    }

    let fallback = PathBuf::from(".argus");
    let _ = fs::create_dir_all(&fallback);
    fallback
}

/**
 * Returns the canonical sandboxed workspace directory for ARGUS agent file operations.
 * Hierarchy:
 * 1. $ARGUS_WORKSPACE
 * 2. $ARGUS_HOME/workspace
 * 3. Fallback: ./workspace
 */
pub fn get_argus_workspace() -> PathBuf {
    if let Ok(val) = std::env::var("ARGUS_WORKSPACE") {
        if !val.trim().is_empty() {
            let p = PathBuf::from(val.trim());
            let _ = fs::create_dir_all(&p);
            return p;
        }
    }

    let p = get_argus_home().join("workspace");
    let _ = fs::create_dir_all(&p);
    p
}

/**
 * Returns the canonical append-only flight recorder directory.
 */
pub fn get_argus_flight_recorder_dir() -> PathBuf {
    let p = get_argus_home().join("flight_recorder");
    let _ = fs::create_dir_all(&p);
    p
}

/**
 * Returns the canonical cryptographic evidence directory.
 */
pub fn get_argus_evidence_dir() -> PathBuf {
    let p = get_argus_home().join("evidence");
    let _ = fs::create_dir_all(&p);
    p
}
