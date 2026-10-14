use argus_net::SsrfGuard;

#[test]
fn test_ssrf_obfuscated_ips() {
    // Standard loopback and metadata
    assert!(SsrfGuard::validate_target("http://127.0.0.1").is_err());
    assert!(SsrfGuard::validate_target("http://169.254.169.254").is_err());

    // Decimal IP representation: 2130706433 is 127.0.0.1
    assert!(SsrfGuard::validate_target("http://2130706433").is_err(), 
        "Decimal IP 2130706433 (127.0.0.1) should be blocked");

    // IPv6 loopback
    assert!(SsrfGuard::validate_target("http://[::1]").is_err(), 
        "IPv6 [::1] should be blocked");
    assert!(SsrfGuard::validate_target("http://[::ffff:127.0.0.1]").is_err(),
        "IPv4-mapped IPv6 [::ffff:127.0.0.1] should be blocked");
}

#[test]
fn test_ssrf_userinfo_bypass_attempt() {
    // URL with userinfo: http://legitimate.com@127.0.0.1
    // Does extract_host_from_target extract 127.0.0.1 or legitimate.com?
    let target = "http://legitimate.com@127.0.0.1";
    let res = SsrfGuard::validate_target(target);
    println!("UserInfo test result for '{}': {:?}", target, res);
    assert!(res.is_err(), "Target with userinfo embedding loopback must be blocked");
}
