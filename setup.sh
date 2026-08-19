#!/usr/bin/env bash
# ==============================================================================
# ARGUS OS — Cross-Platform System Bootstrap & Setup Script
# Supported Platforms: macOS and Linux
# ==============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}${BOLD}======================================================================${NC}"
echo -e "${BLUE}${BOLD}               ARGUS OS — Developer Environment Setup                ${NC}"
echo -e "${BLUE}${BOLD}======================================================================${NC}"

# 1. Detect OS
OS_TYPE="$(uname -s)"
log_info "Detected Operating System: ${BOLD}${OS_TYPE}${NC}"

# 2. Check for Git
if ! command -v git &> /dev/null; then
    log_error "Git is not installed. Please install Git to continue."
    exit 1
fi
log_success "Git is available: $(git --version)"

# 3. Check Node.js
log_info "Checking Node.js environment..."
if ! command -v node &> /dev/null; then
    log_warn "Node.js is not installed."
    if [ "$OS_TYPE" = "Darwin" ]; then
        if command -v brew &> /dev/null; then
            read -p "Would you like to install Node.js via Homebrew? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                brew install node
            fi
        else
            log_error "Homebrew is missing. Please install Node.js (v22+) manually: https://nodejs.org/"
            exit 1
        fi
    elif [ "$OS_TYPE" = "Linux" ]; then
        log_error "Please install Node.js (v22+) via your package manager."
        exit 1
    fi
else
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 22 ]; then
        log_warn "Node.js version is $NODE_VERSION. Version 22 or higher is recommended."
    else
        log_success "Node.js version $NODE_VERSION is available."
    fi
fi

# 4. Check Rust (required by Tauri)
log_info "Checking Rust compiler environment..."
if ! command -v rustc &> /dev/null; then
    log_warn "Rust is not installed."
    read -p "Would you like to install Rust via rustup? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        # Source the cargo env for current session
        # shellcheck disable=SC1090
        source "$HOME/.cargo/env"
    else
        log_error "Rust is required to build the Tauri backend. Aborting."
        exit 1
    fi
else
    log_success "Rust compiler is available: $(rustc --version)"
fi

# 5. Check local AI runtime (Ollama)
log_info "Checking Local AI runtime (Ollama)..."
if ! command -v ollama &> /dev/null; then
    log_warn "Ollama is not installed locally."
    if [ "$OS_TYPE" = "Darwin" ]; then
        log_info "To use local AI models, download Ollama from: https://ollama.com/download"
    elif [ "$OS_TYPE" = "Linux" ]; then
        read -p "Would you like to install Ollama via the official shell script? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            curl -fsSL https://ollama.com/install.sh | sh
        fi
    fi
else
    log_success "Ollama is available: $(ollama --version | head -n 1)"
fi

# 6. Install Node dependencies
log_info "Installing Node.js dependencies..."
if [ -f package.json ]; then
    npm install
    log_success "Node.js dependencies installed successfully."
else
    log_error "package.json not found in the current directory."
    exit 1
fi

echo
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}             Setup Complete! You are ready to develop ARGUS           ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "To start the development server, run:"
echo -e "  ${BOLD}npm run dev${NC}"
echo
