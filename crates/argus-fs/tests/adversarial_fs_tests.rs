use argus_fs::SandboxedFs;
use std::fs;

#[test]
fn test_fs_null_byte_in_path() {
    let temp = std::env::temp_dir().join("test_fs_null_byte");
    let _ = fs::create_dir_all(&temp);
    let fs_box = SandboxedFs::new(&temp).unwrap();

    // Filenames containing null bytes
    let res = fs_box.write("file\0evil.txt", b"data");
    assert!(res.is_err(), "Null byte in path must be rejected");

    let _ = fs::remove_dir_all(&temp);
}

#[test]
fn test_fs_symlink_escape_jail() {
    let temp = std::env::temp_dir().join("test_fs_symlink_jail");
    let outside = std::env::temp_dir().join("test_fs_outside_target");
    let _ = fs::create_dir_all(&temp);
    let _ = fs::create_dir_all(&outside);
    let outside_file = outside.join("secret.txt");
    fs::write(&outside_file, b"TOP_SECRET").unwrap();

    // Create a symlink inside the sandbox pointing outside
    #[cfg(unix)]
    {
        let symlink_path = temp.join("symlink_to_outside");
        let _ = std::os::unix::fs::symlink(&outside, &symlink_path);

        let fs_box = SandboxedFs::new(&temp).unwrap();
        // Trying to read through the symlink to escape sandbox
        let res = fs_box.read_to_string("symlink_to_outside/secret.txt");
        assert!(res.is_err(), "Symlink pointing outside sandbox must be blocked");
    }

    let _ = fs::remove_dir_all(&temp);
    let _ = fs::remove_dir_all(&outside);
}

#[test]
fn test_fs_cannot_delete_root() {
    let temp = std::env::temp_dir().join("test_fs_del_root");
    let _ = fs::create_dir_all(&temp);
    let fs_box = SandboxedFs::new(&temp).unwrap();

    assert!(fs_box.remove_dir_all("").is_err() || fs_box.remove_dir_all("/").is_err() || fs_box.remove_dir_all(".").is_err());
    let _ = fs::remove_dir_all(&temp);
}
