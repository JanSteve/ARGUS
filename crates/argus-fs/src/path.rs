use std::fs;
use std::path::{Component, Path, PathBuf};
use crate::error::FsError;

/// Guard that enforces all filesystem paths remain strictly within a canonical root directory.
#[derive(Debug, Clone)]
pub struct PathGuard {
    canonical_root: PathBuf,
}

impl PathGuard {
    /// Constructs a new PathGuard. Canonicalizes the root directory, creating it if needed.
    pub fn new(root: impl AsRef<Path>) -> Result<Self, FsError> {
        let root_path = root.as_ref();
        if !root_path.exists() {
            fs::create_dir_all(root_path)?;
        }
        let canonical_root = root_path.canonicalize().map_err(FsError::Io)?;
        Ok(Self { canonical_root })
    }

    /// Returns the canonical sandbox root path.
    pub fn root(&self) -> &Path {
        &self.canonical_root
    }

    /// Validates and resolves a user path, ensuring it cannot escape the sandbox jail.
    pub fn resolve_and_validate(&self, user_path: impl AsRef<Path>) -> Result<PathBuf, FsError> {
        let path = user_path.as_ref();
        let path_str = path.to_string_lossy();

        // 1. Raw lexical check for explicit traversal patterns
        if path_str.contains("../") || path_str.contains("..\\") || path_str == ".." {
            return Err(FsError::PathTraversalAttempt {
                attempted: path_str.to_string(),
                root: self.canonical_root.clone(),
            });
        }

        // 2. Normalize and join relative to canonical_root
        let mut clean_relative = PathBuf::new();
        for comp in path.components() {
            match comp {
                Component::Prefix(_) | Component::RootDir => {}
                Component::CurDir => {}
                Component::ParentDir => {
                    return Err(FsError::PathTraversalAttempt {
                        attempted: path_str.to_string(),
                        root: self.canonical_root.clone(),
                    });
                }
                Component::Normal(c) => {
                    clean_relative.push(c);
                }
            }
        }

        let combined = self.canonical_root.join(clean_relative);

        // 3. Check symlink metadata first (catches existing files AND dangling symlinks)
        if let Ok(meta) = fs::symlink_metadata(&combined) {
            if meta.file_type().is_symlink() {
                let target = fs::read_link(&combined)?;
                let resolved_target = if target.is_absolute() {
                    target
                } else {
                    combined.parent().unwrap_or(&self.canonical_root).join(target)
                };

                if resolved_target.exists() {
                    let canon_target = resolved_target.canonicalize()?;
                    if !canon_target.starts_with(&self.canonical_root) {
                        return Err(FsError::SymlinkEscape {
                            path: combined,
                            target: canon_target,
                        });
                    }
                } else {
                    // Dangling symlink: check if target's existing ancestor escapes root
                    let mut ancestor = resolved_target.as_path();
                    let mut escaped = false;
                    while let Some(parent) = ancestor.parent() {
                        if parent.exists() {
                            let canon_parent = parent.canonicalize().map_err(FsError::Io)?;
                            if !canon_parent.starts_with(&self.canonical_root) {
                                escaped = true;
                            }
                            break;
                        }
                        ancestor = parent;
                    }
                    if escaped || !resolved_target.starts_with(&self.canonical_root) {
                        return Err(FsError::SymlinkEscape {
                            path: combined,
                            target: resolved_target,
                        });
                    }
                }
            }
        }

        // 4. If target exists, canonicalize directly and assert root prefix
        if combined.exists() {
            let canon = combined.canonicalize().map_err(FsError::Io)?;
            if !canon.starts_with(&self.canonical_root) {
                return Err(FsError::OutsideSandbox {
                    target: canon,
                    root: self.canonical_root.clone(),
                });
            }
            Ok(canon)
        } else {
            // 4. For non-existent files/directories (e.g. write/create), canonicalize closest existing parent
            let mut ancestor = combined.as_path();
            while let Some(parent) = ancestor.parent() {
                if parent.exists() {
                    let canon_parent = parent.canonicalize().map_err(FsError::Io)?;
                    if !canon_parent.starts_with(&self.canonical_root) {
                        return Err(FsError::OutsideSandbox {
                            target: canon_parent,
                            root: self.canonical_root.clone(),
                        });
                    }
                    break;
                }
                ancestor = parent;
            }

            Ok(combined)
        }
    }

    /// Fast non-error check
    pub fn is_safe(&self, user_path: impl AsRef<Path>) -> bool {
        self.resolve_and_validate(user_path).is_ok()
    }
}
