# ==============================================================================
# ARGUS OS — Cross-Platform System Bootstrap & Setup Script
# Supported Platforms: Windows (PowerShell)
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Blue
Write-Host "               ARGUS OS — Windows Developer Setup                    " -ForegroundColor Blue
Write-Host "======================================================================" -ForegroundColor Blue

# 1. Check for Git
Write-Host "[INFO] Checking for Git..." -ForegroundColor Blue
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCheck) {
    Write-Host "[ERROR] Git is not installed. Please install Git to continue." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Git is available." -ForegroundColor Green

# 2. Check Node.js
Write-Host "[INFO] Checking for Node.js..." -ForegroundColor Blue
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "[WARNING] Node.js is not installed." -ForegroundColor Yellow
    Write-Host "Please download and install Node.js (v22+) from: https://nodejs.org/" -ForegroundColor Yellow
    Exit 1
} else {
    $nodeVersion = node -v
    Write-Host "[SUCCESS] Node.js version $nodeVersion is available." -ForegroundColor Green
}

# 3. Check Rust (required by Tauri)
Write-Host "[INFO] Checking for Rust compiler environment..." -ForegroundColor Blue
$rustCheck = Get-Command rustc -ErrorAction SilentlyContinue
if (-not $rustCheck) {
    Write-Host "[WARNING] Rust is not installed." -ForegroundColor Yellow
    $reply = Read-Host "Would you like to open the Rust installation page? (y/n)"
    if ($reply -eq 'y' -or $reply -eq 'Y') {
        Start-Process "https://rustup.rs/"
        Write-Host "Please run this setup script again after installing Rust." -ForegroundColor Yellow
        Exit 1
    }
} else {
    $rustVersion = rustc --version
    Write-Host "[SUCCESS] Rust compiler is available: $rustVersion" -ForegroundColor Green
}

# 4. Check local AI runtime (Ollama)
Write-Host "[INFO] Checking for Local AI runtime (Ollama)..." -ForegroundColor Blue
$ollamaCheck = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaCheck) {
    Write-Host "[WARNING] Ollama is not installed locally." -ForegroundColor Yellow
    Write-Host "To run AI models locally, download Ollama from: https://ollama.com/" -ForegroundColor Yellow
} else {
    Write-Host "[SUCCESS] Ollama is available." -ForegroundColor Green
}

# 5. Install Node dependencies
Write-Host "[INFO] Installing Node.js dependencies..." -ForegroundColor Blue
if (Test-Path package.json) {
    npm install
    Write-Host "[SUCCESS] Node.js dependencies installed." -ForegroundColor Green
} else {
    Write-Host "[ERROR] package.json not found in the current directory." -ForegroundColor Red
    Exit 1
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "             Setup Complete! You are ready to develop ARGUS           " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "To start the development server, run:" -ForegroundColor Green
Write-Host "  npm run dev" -ForegroundColor Green
Write-Host ""
