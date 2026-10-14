#!/usr/bin/env bash
# ==============================================================================
# Synchronize E2E Test Suite from Antigravity Workspace to Target Codebase
# ==============================================================================
set -e

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="${ARGUS_DEST_DIR:-$(cd "${SRC_DIR}/.." && pwd)/tests}"

echo "Synchronizing E2E test suite..."
echo "  From: ${SRC_DIR}"
echo "  To:   ${DEST_DIR}"

mkdir -p "${DEST_DIR}/src"
mkdir -p "${DEST_DIR}/tests"

cp -r "${SRC_DIR}/Cargo.toml" "${DEST_DIR}/Cargo.toml"
cp -r "${SRC_DIR}/src/"* "${DEST_DIR}/src/"
cp -r "${SRC_DIR}/tests/"* "${DEST_DIR}/tests/"
cp -r "${SRC_DIR}/run_all_e2e.py" "${DEST_DIR}/run_all_e2e.py"
cp -r "${SRC_DIR}/run_all_e2e.sh" "${DEST_DIR}/run_all_e2e.sh"

chmod +x "${DEST_DIR}/run_all_e2e.sh" "${DEST_DIR}/run_all_e2e.py"

echo "Sync complete. All E2E test files deployed to ${DEST_DIR}."
