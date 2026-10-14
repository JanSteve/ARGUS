use argus_service::{ServiceConfig, SystemdUnitGenerator};

#[test]
fn test_default_plist_program_arguments_validity() {
    let config = ServiceConfig::default();
    let plist = SystemdUnitGenerator::generate_launchd_plist(&config);
    println!("Generated plist:\n{}", plist);

    // In launchd, ProgramArguments[0] is the path to the executable.
    // If exec_start is "/usr/local/bin/argusd start", then ProgramArguments[0]
    // becomes "/usr/local/bin/argusd start" (which fails because the file does not have spaces)
    // AND ProgramArguments[1] is redundantly "start".
    assert!(!plist.contains("<string>/usr/local/bin/argusd start</string>"), 
        "launchd plist ProgramArguments must not have command and args lumped into a single string");
}

#[test]
fn test_plist_xml_escaping() {
    let mut config = ServiceConfig::default();
    config.name = "argus&daemon<test>".to_string();
    let plist = SystemdUnitGenerator::generate_launchd_plist(&config);

    // Any XML validator should fail if & or < are unescaped inside text content
    assert!(!plist.contains("com.argus.argus&daemon<test>"), 
        "Plist generator failed to escape XML special characters: & and <");
}

#[test]
fn test_systemd_unit_ini_injection() {
    let mut config = ServiceConfig::default();
    config.description = "Argus\nExecStartPre=/bin/evil".to_string();
    let unit = SystemdUnitGenerator::generate_unit(&config);

    // If newlines are unescaped/unfiltered, an attacker or misconfiguration
    // can inject arbitrary directives into the systemd unit file!
    assert!(!unit.contains("\nExecStartPre=/bin/evil\n"), 
        "Systemd unit generator allows INI line injection via newlines in fields");
}
