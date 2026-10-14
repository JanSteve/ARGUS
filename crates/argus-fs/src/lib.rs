//! # ARGUS Governed Filesystem Engine (`argus-fs`)
//!
//! Provides zero-trust sandboxed filesystem access, directory traversal
//! shields, symlink escape detection, and streaming SHA-256 cryptographic hashing.

pub mod error;
pub mod hash;
pub mod path;
pub mod sandbox_io;

pub use error::FsError;
pub use hash::{calculate_file_sha256, hash_bytes, hash_reader, verify_file_checksum, FileChecksum};
pub use path::PathGuard;
pub use sandbox_io::{DirEntryInfo, FileMetadata, SandboxedFs};

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_path_traversal_blocked() {
        let temp = std::env::temp_dir().join("argus_fs_test_traversal");
        let _ = fs::create_dir_all(&temp);
        let guard = PathGuard::new(&temp).unwrap();

        assert!(guard.resolve_and_validate("../../etc/shadow").is_err());
        assert!(guard.resolve_and_validate("../secret.txt").is_err());
        assert!(guard.resolve_and_validate("subdir/../../escape").is_err());
        let _ = fs::remove_dir_all(&temp);
    }

    #[test]
    fn test_sandboxed_write_and_sha256() {
        let temp = std::env::temp_dir().join("argus_fs_test_write");
        let fs_box = SandboxedFs::new(&temp).unwrap();

        let checksum = fs_box.write("test.txt", b"ARGUS_FS_VERIFIED").unwrap();
        assert_eq!(checksum.size_bytes, 17);
        assert!(!checksum.sha256.is_empty());

        let read_back = fs_box.read_to_string("test.txt").unwrap();
        assert_eq!(read_back, "ARGUS_FS_VERIFIED");

        assert!(verify_file_checksum(temp.join("test.txt"), &checksum.sha256).unwrap());
        let _ = fs::remove_dir_all(&temp);
    }

    #[test]
    fn test_read_only_sandbox() {
        let temp = std::env::temp_dir().join("argus_fs_test_ro");
        let _ = fs::create_dir_all(&temp);
        let fs_ro = SandboxedFs::read_only(&temp).unwrap();

        assert!(fs_ro.write("fail.txt", b"data").is_err());
        let _ = fs::remove_dir_all(&temp);
    }
}
