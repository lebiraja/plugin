# Quick Start Script for Local LLM Chat



Write-Host "🚀 Starting Local LLM Chat..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed. Please install Python 3.9+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Node.js and Python found" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
}

# Set up Python virtual environment if needed
if (-not (Test-Path "backend\venv")) {
    Write-Host "🐍 Creating Python virtual environment..." -ForegroundColor Yellow
    Set-Location backend
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Install backend dependencies
if (-not (Test-Path "backend\venv\Lib\site-packages\fastapi")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
        deactivate
        Set-Location ..
        exit 1
    }
    deactivate
    Set-Location ..
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend in a new PowerShell window
$backendScript = @"
Set-Location '$PWD\backend'
.\venv\Scripts\Activate.ps1
Write-Host '🔧 Backend server starting at http://localhost:8000' -ForegroundColor Cyan
python main.py
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in current window
Write-Host "💻 Frontend server starting at http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the frontend server" -ForegroundColor Yellow
Write-Host ""

npm run dev
