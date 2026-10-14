use argus_fs::{PathGuard, SandboxedFs};
use std::fs;
use std::os::unix::fs::symlink;

#[test]
fn test_path_traversal_adversarial_patterns() {
    let temp_root = std::env::temp_dir().join(format!("argus_fs_adv_{}", std::process::id()));
    let _ = fs::create_dir_all(&temp_root);
    let guard = PathGuard::new(&temp_root).expect("create guard");

    // Standard relative traversals
    assert!(guard.resolve_and_validate("../").is_err());
    assert!(guard.resolve_and_validate("..").is_err());
    assert!(guard.resolve_and_validate("../../").is_err());
    assert!(guard.resolve_and_validate("../../etc/passwd").is_err());
    assert!(guard.resolve_and_validate("a/../../b").is_err());
    assert!(guard.resolve_and_validate("subdir/..").is_err());
    assert!(guard.resolve_and_validate("a/b/c/../../../../escape").is_err());

    let _ = fs::remove_dir_all(&temp_root);
}

#[test]
fn test_symlink_pointing_to_existing_system_file() {
    let temp_root = std::env::temp_dir().join(format!("argus_fs_sym_sys_{}", std::process::id()));
    let _ = fs::create_dir_all(&temp_root);

    // Create a symlink pointing to /etc/hosts
    let link_path = temp_root.join("hosts_link");
    let _ = symlink("/etc/hosts", &link_path);

    let fs_box = SandboxedFs::new(&temp_root).expect("create sandbox");

    // Attempting to read through symlink to /etc/hosts must be blocked
    let read_result = fs_box.read_to_string("hosts_link");
    assert!(
        read_result.is_err(),
        "Reading symlink pointing to /etc/hosts must fail"
    );

    let _ = fs::remove_dir_all(&temp_root);
}

#[test]
fn test_symlink_pointing_to_outside_directory() {
    let base_temp = std::env::temp_dir().join(format!("argus_fs_outside_base_{}", std::process::id()));
    let outside_dir = base_temp.join("outside_dir");
    let sandbox_dir = base_temp.join("sandbox_dir");
    let _ = fs::create_dir_all(&outside_dir);
    let _ = fs::create_dir_all(&sandbox_dir);

    // Create a secret file in outside directory
    fs::write(outside_dir.join("secret.txt"), b"SECRET_OUTSIDE_DATA").unwrap();

    // Create a symlink inside sandbox pointing to outside_dir
    let link_path = sandbox_dir.join("outside_link");
    symlink(&outside_dir, &link_path).unwrap();

    let fs_box = SandboxedFs::new(&sandbox_dir).expect("create sandbox");

    // Reading secret.txt through symlinked directory must be blocked
    let read_res = fs_box.read_to_string("outside_link/secret.txt");
    assert!(
        read_res.is_err(),
        "Reading outside file through symlinked directory must fail"
    );

    // Writing to a new file through symlinked directory must be blocked
    let write_res = fs_box.write("outside_link/new_secret.txt", b"INJECTED");
    assert!(
        write_res.is_err(),
        "Writing outside file through symlinked directory must fail"
    );

    let _ = fs::remove_dir_all(&base_temp);
}

#[test]
fn test_dangling_symlink_escape_write() {
    let base_temp = std::env::temp_dir().join(format!("argus_fs_dangling_{}", std::process::id()));
    let outside_dir = base_temp.join("outside_dir");
    let sandbox_dir = base_temp.join("sandbox_dir");
    let _ = fs::create_dir_all(&outside_dir);
    let _ = fs::create_dir_all(&sandbox_dir);

    let target_outside_file = outside_dir.join("escaped_target.txt");
    // Ensure target outside file does NOT exist yet
    assert!(!target_outside_file.exists());

    // Create dangling symlink inside sandbox pointing to non-existent outside file
    let link_path = sandbox_dir.join("dangling_link");
    symlink(&target_outside_file, &link_path).unwrap();

    let fs_box = SandboxedFs::new(&sandbox_dir).expect("create sandbox");

    // Attempt to write through the dangling symlink
    let write_res = fs_box.write("dangling_link", b"ATTACKER_DATA");

    // Check if the outside file was created!
    let escaped_file_created = target_outside_file.exists();

    let _ = fs::remove_dir_all(&base_temp);

    // Adversarial assertion: writing through dangling symlink to outside MUST NOT succeed,
    // and MUST NOT create the outside file!
    assert!(
        write_res.is_err(),
        "Writing through dangling symlink to outside target must return an error"
    );
    assert!(
        !escaped_file_created,
        "Writing through dangling symlink must NOT create the outside file!"
    );
}

#[test]
fn test_sandbox_root_deletion_protection() {
    let temp_root = std::env::temp_dir().join(format!("argus_fs_root_del_{}", std::process::id()));
    let _ = fs::create_dir_all(&temp_root);
    let fs_box = SandboxedFs::new(&temp_root).expect("create sandbox");

    // Attempting to remove the sandbox root itself
    assert!(fs_box.remove_dir_all("").is_err());
    assert!(fs_box.remove_dir_all(".").is_err());

    let _ = fs::remove_dir_all(&temp_root);
}
