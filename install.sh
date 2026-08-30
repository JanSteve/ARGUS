#!/usr/bin/env bash
set -e

# ==============================================================================
# ARGUS 2.0 Linux Agent-Native Governance Runtime Installer
# ==============================================================================

BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "================================================================================"
echo "         ARGUS 2.0 — Linux Agent-Native Governance Runtime Installer           "
echo "================================================================================"
echo -e "${NC}"

OS="$(uname -s)"
ARCH="$(uname -m)"

echo -e "[*] Detecting host platform: ${BOLD}${OS} (${ARCH})${NC}"

if [ "$OS" != "Linux" ] && [ "$OS" != "Darwin" ]; then
    echo -e "${RED}[!] Unsupported Operating System: ${OS}. ARGUS requires Linux or macOS/POSIX.${NC}"
    exit 1
fi

# Check Prerequisites
echo -e "[*] Inspecting system toolchain..."

if ! command -v cargo >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Cargo/Rust is not found. Please install Rust via https://rustup.rs${NC}"
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Node.js is not found. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}[✓] Rust toolchain verified: $(rustc --version)${NC}"
echo -e "${GREEN}[✓] Node.js runtime verified: $(node --version)${NC}"

# Build Native Core
echo -e "\n[*] Compiling ARGUS Native Core (crates/argusd)..."
cargo build --release --manifest-path crates/argusd/Cargo.toml

TARGET_BIN="crates/argusd/target/release/argusd"
if [ ! -f "$TARGET_BIN" ]; then
    TARGET_BIN="crates/argusd/target/debug/argusd"
fi

INSTALL_DIR="${HOME}/.local/bin"
mkdir -p "${INSTALL_DIR}"
mkdir -p "${HOME}/.argus/workspace"
mkdir -p "${HOME}/.argus/flight_recorder"

cp "$TARGET_BIN" "${INSTALL_DIR}/argusd"
chmod +x "${INSTALL_DIR}/argusd"

# Install CLI wrapper
cp bin/argus.mjs "${INSTALL_DIR}/argus"
chmod +x "${INSTALL_DIR}/argus"

echo -e "\n${GREEN}${BOLD}================================================================================${NC}"
echo -e "${GREEN}${BOLD}          ARGUS GOVERNANCE RUNTIME SUCCESSFULLY INSTALLED!                     ${NC}"
echo -e "${GREEN}${BOLD}================================================================================${NC}"
echo -e "Installed binaries to: ${BOLD}${INSTALL_DIR}${NC}"
echo -e "Workspace directory:   ${BOLD}${HOME}/.argus/workspace${NC}"
echo -e "\n${CYAN}Quick Start Commands:${NC}"
echo -e "  1. Check runtime doctor:     ${BOLD}argus doctor${NC}  or  ${BOLD}argusd doctor${NC}"
echo -e "  2. Run security suite:       ${BOLD}argus security-test${NC}"
echo -e "  3. Run 10-task benchmark:    ${BOLD}argusd benchmark${NC}"
echo -e "  4. Execute agent mission:    ${BOLD}argus mission stream \"Organize downloads\"${NC}"
echo -e "================================================================================\n"
