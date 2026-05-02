# This script will install Node.js using Windows Package Manager (winget)
# Run this in a PowerShell terminal as Administrator for best results.

Write-Host "Checking for winget..." -ForegroundColor Cyan
if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host "Installing Node.js (LTS)..." -ForegroundColor Cyan
    winget install OpenJS.NodeJS.LTS
    Write-Host "Installation complete. Please RESTART your terminal to use 'node' and 'npm'." -ForegroundColor Green
} else {
    Write-Host "winget not found. Please download Node.js manually from https://nodejs.org/" -ForegroundColor Red
}
