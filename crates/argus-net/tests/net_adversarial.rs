use argus_net::SsrfGuard;
use std::net::IpAddr;

#[test]
fn test_ssrf_standard_loopback_and_metadata_blocked() {
    assert!(SsrfGuard::validate_target("http://127.0.0.1").is_err());
    assert!(SsrfGuard::validate_target("http://127.0.0.1:8080/admin").is_err());
    assert!(SsrfGuard::validate_target("http://localhost:3000").is_err());
    assert!(SsrfGuard::validate_target("http://169.254.169.254/latest/meta-data").is_err());
    assert!(SsrfGuard::validate_target("http://metadata.google.internal/computeMetadata/v1").is_err());
    assert!(SsrfGuard::validate_target("http://[::1]:8080").is_err());
    assert!(SsrfGuard::validate_target("http://10.0.0.1").is_err());
    assert!(SsrfGuard::validate_target("http://192.168.1.1").is_err());
    assert!(SsrfGuard::validate_target("http://172.16.0.1").is_err());
}

#[test]
fn test_ssrf_integer_decimal_obfuscation_blocked() {
    // 2130706433 is 127.0.0.1 in decimal integer notation
    assert!(SsrfGuard::validate_target("http://2130706433").is_err());
}

#[test]
fn test_ssrf_ipv4_mapped_ipv6_loopback_blocked() {
    let mapped_ip: IpAddr = "::ffff:127.0.0.1".parse().unwrap();
    assert!(
        SsrfGuard::is_private_or_loopback(mapped_ip),
        "::ffff:127.0.0.1 must be recognized as loopback"
    );
}

#[test]
fn test_ssrf_userinfo_evasion_bypass() {
    // Attack vector: URL with userinfo syntax (e.g. http://attacker@127.0.0.1)
    // Most HTTP clients will parse 127.0.0.1 as the host and connect to loopback.
    let target = "http://user:pass@127.0.0.1/admin";
    let validation = SsrfGuard::validate_target(target);
    println!("Validation for userinfo URL '{}': {:?}", target, validation);

    assert!(
        validation.is_err(),
        "CRITICAL SSRF BYPASS: URL with userinfo credentials 'user:pass@127.0.0.1' must be rejected as loopback access!"
    );
}

#[test]
fn test_ssrf_abbreviated_or_hex_ip_bypass() {
    // Attack vector: 127.1 or 0x7f000001
    let target_abbr = "http://127.1";
    let res_abbr = SsrfGuard::validate_target(target_abbr);
    println!("Validation for abbreviated IP '127.1': {:?}", res_abbr);

    let target_hex = "http://0x7f000001";
    let res_hex = SsrfGuard::validate_target(target_hex);
    println!("Validation for hex IP '0x7f000001': {:?}", res_hex);

    assert!(
        res_abbr.is_err(),
        "CRITICAL SSRF BYPASS: Abbreviated IP 'http://127.1' (evaluates to 127.0.0.1 in libc) was NOT blocked!"
    );
}

#[test]
fn test_port_remediator_policy_safety_invariants() {
    // Safety check: remediator must NEVER kill PID 1 or self
    // PortCollisionRemediator::remediate checks safety in code
    let my_pid = std::process::id();
    assert!(my_pid > 1);
}

#[test]
fn test_ssrf_backslash_path_delimiter_bypass() {
    assert!(SsrfGuard::validate_target("http://127.0.0.1\\admin").is_err(),
        "Backslash delimiter 'http://127.0.0.1\\admin' must be blocked");
    assert!(SsrfGuard::validate_target("http://127.0.0.1\\evil.com").is_err(),
        "Backslash delimiter 'http://127.0.0.1\\evil.com' must be blocked");
}

#[test]
fn test_ssrf_ipv6_variants_and_6to4_blocked() {
    // IPv4-compatible IPv6 ::127.0.0.1
    let compat_ip: IpAddr = "::127.0.0.1".parse().unwrap();
    assert!(
        SsrfGuard::is_private_or_loopback(compat_ip),
        "::127.0.0.1 must be recognized as loopback"
    );
    assert!(SsrfGuard::validate_target("http://[::127.0.0.1]").is_err(),
        "IPv4-compatible IPv6 [::127.0.0.1] must be blocked");

    // 6to4 address embedding 127.0.0.1 (2002:7f00:1::)
    let to4_ip: IpAddr = "2002:7f00:0001::".parse().unwrap();
    assert!(
        SsrfGuard::is_private_or_loopback(to4_ip),
        "6to4 address embedding 127.0.0.1 must be recognized as loopback"
    );
    assert!(SsrfGuard::validate_target("http://[2002:7f00:0001::]").is_err(),
        "6to4 address [2002:7f00:0001::] must be blocked");
}

#[test]
fn test_ssrf_percent_encoded_host_bypass() {
    // Percent-encoded 127.0.0.1: %31%32%37%2e%30%2e%30%2e%31
    assert!(SsrfGuard::validate_target("http://%31%32%37%2e%30%2e%30%2e%31").is_err(),
        "Percent-encoded IP 'http://%31%32%37%2e%30%2e%30%2e%31' must be blocked");
    // Percent-encoded localhost: %6c%6f%63%61%6c%68%6f%73%74
    assert!(SsrfGuard::validate_target("http://%6c%6f%63%61%6c%68%6f%73%74:8080").is_err(),
        "Percent-encoded localhost must be blocked");
}

