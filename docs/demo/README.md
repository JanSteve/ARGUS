# ARGUS Daemon Demonstrations & Media

This directory contains terminal recordings, demo manifests, and guides for the ARGUS Autonomous Voice-Native Linux Agent Daemon (`argusd`).

## Running the Terminal Demo
To run the automated terminal interactive walkthrough:
```bash
./scripts/demo.sh
```

## Running the Linux Verification Harness
To verify ARGUS under real Linux kernel Landlock LSM, cgroups v2, and unprivileged user namespaces:
```bash
./scripts/test-linux.sh
```

## Interactive Voice & CLI Operation
```bash
# Start background daemon
argusd start

# Run comprehensive capability & subsystem probe
argusd doctor

# Test natural voice input & 4-tier neural TTS cascade
argusd voice "ARGUS, inspect system health and verify port 8080"
```
