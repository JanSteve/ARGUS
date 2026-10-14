use argus_pkg::{GovernedPackageManager, MockBackend, PackagePolicyGuard};

#[test]
fn test_critical_denylist_removals_blocked() {
    let critical_pkgs = [
        "sudo", "systemd", "libc6", "glibc", "kernel", "linux-image",
        "bash", "coreutils", "apt", "dpkg", "pacman", "dnf", "openssh-server", "libssl"
    ];

    for pkg in critical_pkgs {
        assert!(
            PackagePolicyGuard::evaluate_operation("remove", pkg).is_err(),
            "Removal of critical package '{}' must be prohibited", pkg
        );
        assert!(
            PackagePolicyGuard::evaluate_operation("purge", pkg).is_err(),
            "Purging of critical package '{}' must be prohibited", pkg
        );
    }
}

#[test]
fn test_critical_denylist_prefix_derivatives_blocked() {
    let derivatives = [
        "sudo-ldap", "systemd-sysv", "bash-completion", "coreutils-common", "libssl-dev"
    ];

    for pkg in derivatives {
        assert!(
            PackagePolicyGuard::evaluate_operation("remove", pkg).is_err(),
            "Removal of critical package derivative '{}' must be prohibited", pkg
        );
    }
}

#[test]
fn test_blacklisted_exploit_tools_install_blocked() {
    let malicious = [
        "rootkit", "linux-exploit-suggester", "exploit-database", "local-exploit"
    ];

    for pkg in malicious {
        assert!(
            PackagePolicyGuard::evaluate_operation("install", pkg).is_err(),
            "Installation of exploit tool '{}' must be blocked", pkg
        );
    }
}

#[test]
fn test_command_injection_and_flag_injection_blocked() {
    let invalid_names = [
        "curl; rm -rf /",
        "bash | sh",
        "pkg && echo 1",
        "`reboot`",
        "$(whoami)",
        "-i malicious_flag",
        "--force",
        "",
        "   ",
    ];

    for name in invalid_names {
        assert!(
            PackagePolicyGuard::validate_package_name(name).is_err(),
            "Package name injection '{}' must be rejected", name
        );
    }
}

#[test]
fn test_governed_manager_blocks_dangerous_actions_through_api() {
    let manager = GovernedPackageManager::with_backend(Box::new(MockBackend));

    // Remove sudo should fail at policy layer
    let res = manager.remove("sudo", false);
    assert!(res.is_err(), "manager.remove('sudo') must return PolicyViolation");

    // Install rootkit should fail at policy layer
    let res = manager.install("rootkit", false);
    assert!(res.is_err(), "manager.install('rootkit') must return PolicyViolation");
}
