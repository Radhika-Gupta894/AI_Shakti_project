@echo off
echo ==========================================
echo SHAKTI AI - Environment Fixer
echo ==========================================

:: 1. Install Node.js
echo [1/3] Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Installing via winget...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo ERROR: winget failed. Please install Node.js manually from https://nodejs.org/
    ) else (
        echo Node.js installation triggered. 
        echo IMPORTANT: You MUST RESTART this terminal after this script finishes.
    )
) else (
    echo Node.js is already installed.
)

:: 2. Fix Backend Dependencies
echo [2/3] Fixing Backend Python dependencies...
cd backend
if exist venv (
    echo Activating virtual environment...
    call venv\Scripts\activate
    echo Installing requirements...
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install python dependencies.
    ) else (
        echo Backend dependencies fixed.
    )
) else (
    echo ERROR: Virtual environment 'venv' not found in backend folder.
)
cd ..

:: 3. Summary
echo [3/3] Finalizing...
echo ==========================================
echo FIX COMPLETED.
echo 1. RESTART your terminal/IDE now.
echo 2. Go to 'frontend' and run 'npm install'.
echo 3. Run 'python backend/main.py' to start the server.
echo ==========================================
pause
