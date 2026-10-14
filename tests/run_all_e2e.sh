#!/usr/bin/env bash
# ==============================================================================
# ARGUS Autonomous Linux Agent Daemon - Comprehensive E2E Test Suite Runner
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${ARGUS_REPO_PATH:-$(cd "${SCRIPT_DIR}/.." && pwd)}"

echo "================================================================================"
echo "   ARGUS - AUTONOMOUS VOICE-NATIVE LINUX AGENT DAEMON E2E TEST RUNNER"
echo "================================================================================"
echo "Workspace: ${REPO_ROOT}"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Run Python-based authoritative oracle validator
python3 "${SCRIPT_DIR}/run_all_e2e.py"

echo ""
echo "E2E Test Suite execution finished with status 0."
