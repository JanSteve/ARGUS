#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# ARGUS 2.0 Linux Agent-Native Governance Runtime Installer
# Deterministic, Zero-Hidden-Dependency Turnkey Installer
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

echo -e "[*] Host Platform: ${BOLD}${OS} (${ARCH})${NC}"

if [ "$OS" != "Linux" ] && [ "$OS" != "Darwin" ]; then
    echo -e "${RED}[!] Unsupported Operating System: ${OS}. ARGUS requires Linux or macOS/POSIX.${NC}"
    exit 1
fi

# 1. Inspect Build Toolchain
echo -e "[*] Inspecting build prerequisites..."

if ! command -v cargo >/dev/null 2>&1; then
    echo -e "${RED}[!] Cargo/Rust is required to compile ARGUS native crates.${NC}"
    echo -e "${YELLOW}    Install Rust with: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh${NC}"
    exit 1
fi

echo -e "${GREEN}[✓] Rust Toolchain: $(rustc --version)${NC}"

# 2. Inspect Linux Sandbox Primitives (Informational)
if [ "$OS" = "Linux" ]; then
    if command -v bwrap >/dev/null 2>&1; then
        echo -e "${GREEN}[✓] Bubblewrap (bwrap) unprivileged namespace sandbox: AVAILABLE${NC}"
    else
        echo -e "${YELLOW}[i] Bubblewrap (bwrap) not found. Fallback POSIX process sandbox will be used.${NC}"
        echo -e "${YELLOW}    To enable namespace sandboxing: sudo apt install bubblewrap (or dnf install bubblewrap)${NC}"
    fi
fi

# 3. Compile ARGUS Native Crates
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo -e "\n[*] Compiling ARGUS Native Workspace Core (release mode)..."
cargo build --release --workspace

# 4. Prepare Installation Directory
INSTALL_DIR="${HOME}/.local/bin"
mkdir -p "${INSTALL_DIR}"

ARGUS_HOME="${HOME}/.argus"
mkdir -p "${ARGUS_HOME}/workspace"
mkdir -p "${ARGUS_HOME}/flight_recorder"
mkdir -p "${ARGUS_HOME}/secrets"
mkdir -p "${ARGUS_HOME}/evidence"

# 5. Install Binaries
if [ -f "target/release/argusd" ]; then
    cp "target/release/argusd" "${INSTALL_DIR}/argusd"
    chmod 755 "${INSTALL_DIR}/argusd"
    echo -e "${GREEN}[✓] Installed argusd -> ${INSTALL_DIR}/argusd${NC}"
else
    echo -e "${RED}[!] Build output target/release/argusd not found.${NC}"
    exit 1
fi

if [ -f "target/release/argus-cli" ]; then
    cp "target/release/argus-cli" "${INSTALL_DIR}/argus"
    chmod 755 "${INSTALL_DIR}/argus"
    echo -e "${GREEN}[✓] Installed argus -> ${INSTALL_DIR}/argus${NC}"
else
    echo -e "${RED}[!] Build output target/release/argus-cli not found.${NC}"
    exit 1
fi

# 6. Check PATH
PATH_IN_ENV=0
case ":$PATH:" in
    *":${INSTALL_DIR}:"*) PATH_IN_ENV=1 ;;
esac

echo -e "\n${GREEN}${BOLD}================================================================================${NC}"
echo -e "${GREEN}${BOLD}          ARGUS GOVERNANCE RUNTIME SUCCESSFULLY INSTALLED!                     ${NC}"
echo -e "${GREEN}${BOLD}================================================================================${NC}"
echo -e "Binaries installed to: ${BOLD}${INSTALL_DIR}${NC}"
echo -e "Canonical Workspace:   ${BOLD}${ARGUS_HOME}/workspace${NC}"

if [ "${PATH_IN_ENV}" -eq 0 ]; then
    echo -e "\n${YELLOW}${BOLD}[!] Action Required: ${INSTALL_DIR} is not in your current PATH.${NC}"
    echo -e "    Add it to your session now:"
    echo -e "    ${BOLD}export PATH=\"${INSTALL_DIR}:\$PATH\"${NC}"
    echo -e "    Or persist to your shell profile:"
    echo -e "    ${BOLD}echo 'export PATH=\"${INSTALL_DIR}:\$PATH\"' >> ~/.bashrc${NC}"
fi

echo -e "\n${CYAN}Quick Verification Commands:${NC}"
echo -e "  1. Runtime Diagnostics:    ${BOLD}argus doctor${NC}"
echo -e "  2. Capability Contracts:   ${BOLD}argus capabilities${NC}"
echo -e "  3. Security Suite:         ${BOLD}argus security-test${NC}"
echo -e "  4. 10-Task Linux Bench:    ${BOLD}argus benchmark${NC}"
echo -e "  5. Sovereign Gov PoC:      ${BOLD}argus gov-doc-poc${NC}"
echo -e "  6. Interactive Session:    ${BOLD}argus interactive \"Clean my Downloads folder\"${NC}"
echo -e "================================================================================\n"
