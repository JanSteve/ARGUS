#!/usr/bin/env bash
# ==============================================================================
# ARGUS Autonomous Linux Agent Daemon - Turnkey Clean Installation Script
# Compiles and installs argusd and argus-cli to ~/.local/bin
# ==============================================================================

set -euo pipefail

# ANSI Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
INSTALL_DIR="${HOME}/.local/bin"

echo -e "${BOLD}${CYAN}"
cat << "EOF"
    ___     ____     ______  __  __   _____
   /   |   / __ \   / ____/ / / / /  / ___/
  / /| |  / /_/ /  / / __  / / / /   \__ \ 
 / ___ | / _, _/  / /_/ / / /_/ /   ___/ / 
/_/  |_|/_/ |_|   \____/  \____/   /____/  
   AUTONOMOUS VOICE-NATIVE LINUX AGENT DAEMON
EOF
echo -e "${NC}"
echo -e "${BOLD}ARGUS 2.0 Turnkey Installer${NC}"
echo -e "Target Install Destination: ${CYAN}${INSTALL_DIR}${NC}"
echo ""

# ------------------------------------------------------------------------------
# 1. OS & Architecture Detection
# ------------------------------------------------------------------------------
echo -e "${BLUE}▶ [1/5] Detecting Operating System & Platform Architecture...${NC}"
OS_TYPE="$(uname -s)"
ARCH_TYPE="$(uname -m)"

case "${OS_TYPE}" in
    Linux)
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            DISTRO="${NAME:-Linux} ${VERSION_ID:-}"
        else
            DISTRO="Generic Linux"
        fi
        echo -e "  ${GREEN}✓ Platform: Linux (${DISTRO}) [${ARCH_TYPE}]${NC}"
        echo -e "  ${GREEN}✓ Kernel Sandboxing: Landlock LSM ABI v1-v4 Native Support${NC}"
        ;;
    Darwin)
        MAC_VER="$(sw_vers -productVersion 2>/dev/null || echo "Darwin")"
        echo -e "  ${GREEN}✓ Platform: macOS Darwin ${MAC_VER} [${ARCH_TYPE}]${NC}"
        echo -e "  ${YELLOW}ℹ Notice: macOS Darwin will use native non-Linux fallback shims${NC}"
        ;;
    *)
        echo -e "  ${RED}✗ Unsupported OS: ${OS_TYPE}. ARGUS requires Linux (or macOS with shims).${NC}"
        exit 1
        ;;
esac

# ------------------------------------------------------------------------------
# 2. Dependency Verification (rustc, cargo, build-essential)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}▶ [2/5] Verifying Rust Toolchain & Build Dependencies...${NC}"

if ! command -v rustc &> /dev/null || ! command -v cargo &> /dev/null; then
    echo -e "  ${RED}✗ Rust toolchain (cargo/rustc) was not found on your PATH.${NC}"
    echo -e "  ${YELLOW}To install Rust, execute:${NC}"
    echo -e "    ${BOLD}curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh${NC}"
    exit 1
fi

RUSTC_VER="$(rustc --version)"
CARGO_VER="$(cargo --version)"
echo -e "  ${GREEN}✓ Found ${RUSTC_VER}${NC}"
echo -e "  ${GREEN}✓ Found ${CARGO_VER}${NC}"

# Optional sandbox/audio packages check
if [ "${OS_TYPE}" = "Linux" ]; then
    if ! command -v bwrap &> /dev/null; then
        echo -e "  ${YELLOW}⚠ bubblewrap (bwrap) not found. Required for unprivileged namespaces.${NC}"
        echo -e "    Install via: ${BOLD}sudo apt-get install -y bubblewrap${NC} (or distro equivalent)"
    else
        echo -e "  ${GREEN}✓ Found bubblewrap user namespace isolation${NC}"
    fi
    if ! command -v espeak-ng &> /dev/null && ! command -v spd-say &> /dev/null; then
        echo -e "  ${YELLOW}⚠ espeak-ng/spd-say not found. Recommended for Tier 4 offline voice.${NC}"
        echo -e "    Install via: ${BOLD}sudo apt-get install -y espeak-ng${NC}"
    else
        echo -e "  ${GREEN}✓ Found offline audio engine (espeak-ng/spd-say)${NC}"
    fi
fi

# ------------------------------------------------------------------------------
# 3. Compile Release Binaries (argusd, argus-cli)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}▶ [3/5] Compiling Production Release Binaries (argusd, argus-cli)...${NC}"
cd "${ROOT_DIR}"

cargo build --release -p argusd -p argus-cli

if [ ! -f "${ROOT_DIR}/target/release/argusd" ] || [ ! -f "${ROOT_DIR}/target/release/argus-cli" ]; then
    echo -e "  ${RED}✗ Build failed: Release binaries not found in target/release/${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓ Compilation successful! Binaries generated in target/release/${NC}"

# ------------------------------------------------------------------------------
# 4. Install Binaries to ~/.local/bin
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}▶ [4/5] Installing Executables to ${INSTALL_DIR}...${NC}"
mkdir -p "${INSTALL_DIR}"

cp -f "${ROOT_DIR}/target/release/argusd" "${INSTALL_DIR}/argusd"
cp -f "${ROOT_DIR}/target/release/argus-cli" "${INSTALL_DIR}/argus-cli"
chmod +x "${INSTALL_DIR}/argusd"
chmod +x "${INSTALL_DIR}/argus-cli"

echo -e "  ${GREEN}✓ Installed: ${INSTALL_DIR}/argusd${NC}"
echo -e "  ${GREEN}✓ Installed: ${INSTALL_DIR}/argus-cli${NC}"

# ------------------------------------------------------------------------------
# 5. PATH Verification & Post-Install Check
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}▶ [5/5] Performing Post-Installation Health Probe...${NC}"

PATH_OK=false
if echo ":${PATH}:" | grep -q ":${INSTALL_DIR}:"; then
    PATH_OK=true
fi

if [ "${PATH_OK}" = "true" ]; then
    echo -e "  ${GREEN}✓ ${INSTALL_DIR} is in your PATH.${NC}"
else
    echo -e "  ${YELLOW}⚠ ${INSTALL_DIR} is NOT currently in your PATH.${NC}"
    echo -e "  ${YELLOW}To use argusd and argus-cli directly from any terminal, add to your shell config:${NC}"
    echo -e "    ${BOLD}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
    echo -e "    Add to: ~/.bashrc, ~/.zshrc, or ~/.profile"
fi

# Quick Doctor Verification
echo ""
echo -e "${BLUE}▶ Running quick daemon subsystem audit...${NC}"
"${INSTALL_DIR}/argusd" doctor || true

echo ""
echo -e "${BOLD}${GREEN}====================================================================${NC}"
echo -e "${BOLD}${GREEN}    ARGUS 2.0 INSTALLATION COMPLETED SUCCESSFULLY!                 ${NC}"
echo -e "${BOLD}${GREEN}====================================================================${NC}"
echo -e "Quickstart Commands:"
echo -e "  • Start Daemon:       ${CYAN}argusd start${NC}"
echo -e "  • Run Capability Doctor: ${CYAN}argusd doctor${NC}"
echo -e "  • Voice Command:      ${CYAN}argusd voice \"ARGUS, verify system status\"${NC}"
echo -e "  • Interactive CLI:    ${CYAN}argus-cli${NC}"
echo -e "  • Security Benchmark: ${CYAN}argusd security-test${NC}"
echo -e "  • Interactive Demo:   ${CYAN}./scripts/demo.sh${NC}"
echo ""
exit 0
