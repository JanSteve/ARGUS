# ARGUS Demonstration Guide

## Quick Interactive Demo
Run the turnkey terminal demonstration script to see ARGUS autonomously detect and remediate incidents, deflect adversarial attacks, and probe kernel capabilities:

```bash
./scripts/demo.sh
```

## Running the Linux Verification Harness
Run the containerized Linux test harness (Ubuntu 24.04 with Landlock LSM and cgroups v2):

```bash
./scripts/test-linux.sh
```

## Native Daemon Operations
Start the `argusd` background system daemon and execute operations:

```bash
# 1. Start the autonomous agent daemon
argusd start

# 2. Run system doctor to verify Landlock ABI, cgroups, and audio drivers
argusd doctor

# 3. Trigger voice-driven incident inspection
argusd voice "ARGUS, diagnose port 8080 collision and remediate"

# 4. Run the 20-point adversarial security benchmark
argus security-test
```
