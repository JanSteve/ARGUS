#!/usr/bin/env bash
# ==============================================================================
# ARGUS Autonomous Linux Agent - macOS Dual-Layer Test Runner
# Allows running full Linux verification (cgroups, namespaces, Landlock) from macOS.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}======================================================${NC}"
echo -e "${BOLD}${BLUE}   ARGUS Autonomous Agent Daemon - Dual-Layer Test Harness ${NC}"
echo -e "${BOLD}${BLUE}======================================================${NC}"
echo ""

# Check if Docker is running
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo -e "${GREEN}✓ Docker engine detected!${NC}"
    echo -e "${BLUE}▶ Launching privileged Linux container test environment (Ubuntu 24.04)...${NC}"
    echo ""
    
    cd "${ROOT_DIR}"
    docker build -t argus-test-env -f Dockerfile.test .
    
    echo ""
    echo -e "${BLUE}▶ Executing 14-crate workspace test suite & 20-point security benchmark...${NC}"
    docker run --rm --privileged -v "${ROOT_DIR}:/workspace" argus-test-env \
        /bin/bash -c "cargo test --workspace && cargo run --bin argusd -- security-test"

    echo ""
    echo -e "${BOLD}${GREEN}✓ All Linux verification tests and 20 security benchmarks PASSED!${NC}"
else
    echo -e "${YELLOW}⚠ Docker is not running or not installed.${NC}"
    echo -e "${BLUE}▶ Falling back to native macOS Darwin shims and compilation check...${NC}"
    echo ""
    
    cd "${ROOT_DIR}"
    echo -e "${BLUE}▶ Checking workspace compilation on macOS Darwin...${NC}"
    cargo check --workspace
    
    echo -e "${BLUE}▶ Running workspace tests natively on macOS...${NC}"
    cargo test --workspace
    
    echo ""
    echo -e "${BOLD}${GREEN}✓ Native macOS compilation and tests PASSED!${NC}"
    echo -e "${YELLOW}ℹ Tip: Start Docker Desktop on your Mac to test real Linux cgroups & namespaces.${NC}"
fi

exit 0

