use argus_pkg::PackagePolicyGuard;

#[test]
fn test_pkg_denylist_arch_specifier_bypass() {
    // In Debian/Ubuntu multiarch: package names can have architecture qualifier, e.g. "systemd:arm64", "libc6:amd64"
    // Wait, let's see if PackagePolicyGuard allows ":" in package name
    // Line 125: if !c.is_ascii_alphanumeric() && c != '-' && c != '_' && c != '.' && c != '+'
    // Colon ':' is NOT in allowed chars, so "systemd:arm64" would fail validation with InvalidPackageName.
    // What about RPM / Fedora / Arch: "systemd.x86_64" or "bash.aarch64"?
    // '.' IS allowed!
    let rpm_pkg = "systemd.x86_64";
    let res = PackagePolicyGuard::evaluate_operation("remove", rpm_pkg);
    println!("Removal check for '{}': {:?}", rpm_pkg, res);
    assert!(res.is_err(), "Critical package with arch suffix like '{}' must be blocked from removal", rpm_pkg);
}

#[test]
fn test_pkg_critical_denylist_exact() {
    assert!(PackagePolicyGuard::evaluate_operation("remove", "systemd").is_err());
    assert!(PackagePolicyGuard::evaluate_operation("remove", "systemd-sysv").is_err());
    assert!(PackagePolicyGuard::evaluate_operation("remove", "systemd:arm64").is_err());
    assert!(PackagePolicyGuard::evaluate_operation("remove", "systemd+dbg").is_err());
    assert!(PackagePolicyGuard::evaluate_operation("remove", "bash").is_err());
    assert!(PackagePolicyGuard::evaluate_operation("remove", "sudo").is_err());
}
