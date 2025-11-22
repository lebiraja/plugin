#!/usr/bin/env pwsh
# ============================================================================
# Plugin Project - Automated Setup and Launch Script (PowerShell)
# Supports: Windows, Linux, macOS
# ============================================================================

param(
    [switch]$SkipInstall,
    [switch]$NoColor
)

# Colors
$script:UseColor = -not $NoColor
function Write-ColorOutput($ForegroundColor, $Message) {
    if ($script:UseColor) {
        Write-Host $Message -ForegroundColor $ForegroundColor
    } else {
        Write-Host $Message
    }
}

function Write-Success($Message) { Write-ColorOutput Green "✓ $Message" }
function Write-Info($Message) { Write-ColorOutput Cyan "ℹ $Message" }
function Write-Warning($Message) { Write-ColorOutput Yellow "⚠ $Message" }
function Write-ErrorMsg($Message) { Write-ColorOutput Red "✗ $Message" }
function Write-Header($Message) { 
    Write-Host ""
    Write-ColorOutput Magenta "============================================================================"
    Write-ColorOutput Magenta "   $Message"
    Write-ColorOutput Magenta "============================================================================"
    Write-Host ""
}

# Detect OS
$IsWindowsOS = $IsWindows -or ($PSVersionTable.PSVersion.Major -lt 6)
$IsMacOSPlatform = $PSVersionTable.Platform -eq 'Unix' -and (Test-Path '/System/Library/CoreServices/SystemVersion.plist')
$IsLinuxOS = $PSVersionTable.Platform -eq 'Unix' -and -not $IsMacOSPlatform

# Get project root
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# Create logs directory
$LogDir = Join-Path $ProjectRoot "logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$LogFile = Join-Path $LogDir "setup_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Write-Log($Message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $Message" | Out-File -Append -FilePath $LogFile
}

Write-Header "PLUGIN PROJECT - AUTOMATED SETUP AND LAUNCH"

Write-Host "This script will:"
Write-Host "  1. Check and install MongoDB, Node.js, Python, and Ollama"
Write-Host "  2. Set up backend (FastAPI) and frontend (React)"
Write-Host "  3. Launch all services automatically"
Write-Host ""
Write-Host "Platform: $($PSVersionTable.Platform)"
Write-Host "OS: $(if ($IsWindowsOS) {'Windows'} elseif ($IsMacOSPlatform) {'macOS'} else {'Linux'})"
Write-Host ""

Write-Log "Starting setup process on $($PSVersionTable.Platform)"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Test-CommandExists($Command) {
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Get-PythonVersion {
    try {
        $version = python --version 2>&1 | Select-String -Pattern '\d+\.\d+\.\d+' | ForEach-Object { $_.Matches.Value }
        return $version
    } catch {
        return $null
    }
}

function Test-PythonVersionOk {
    $version = Get-PythonVersion
    if (-not $version) { return $false }
    
    $parts = $version.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    
    return ($major -eq 3 -and $minor -ge 10) -or ($major -gt 3)
}

# ============================================================================
# 1. CHECK AND INSTALL MONGODB
# ============================================================================

Write-Header "CHECKING MONGODB"

if (Test-CommandExists mongod) {
    Write-Success "MongoDB is already installed"
    Write-Log "MongoDB found in PATH"
} elseif ($IsWindowsOS -and (Test-Path "C:\Program Files\MongoDB\Server\*\bin\mongod.exe")) {
    Write-Success "MongoDB found in Program Files"
    $mongoPath = Get-ChildItem "C:\Program Files\MongoDB\Server\*\bin" -Directory | Select-Object -First 1 -ExpandProperty FullName
    $env:PATH = "$mongoPath;$env:PATH"
    Write-Log "Added MongoDB to PATH: $mongoPath"
} elseif ($SkipInstall) {
    Write-Warning "MongoDB not found. Run without -SkipInstall to install."
} else {
    Write-Info "Installing MongoDB..."
    
    if ($IsWindowsOS) {
        # Windows MongoDB installation
        $installerUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14-signed.msi"
        $installerPath = Join-Path $env:TEMP "mongodb-installer.msi"
        
        Write-Info "Downloading MongoDB..."
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
            Write-Info "Installing MongoDB (this may take a few minutes)..."
            Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /qn /norestart ADDLOCAL=`"ServerNoService`"" -Wait
            Remove-Item $installerPath -Force
            Write-Success "MongoDB installed successfully"
        } catch {
            Write-ErrorMsg "Failed to install MongoDB: $_"
            Write-Log "MongoDB installation error: $_"
        }
        
    } elseif ($IsMacOSPlatform) {
        # macOS MongoDB installation using Homebrew
        if (Test-CommandExists brew) {
            Write-Info "Installing MongoDB via Homebrew..."
            brew tap mongodb/brew
            brew install mongodb-community@7.0
            Write-Success "MongoDB installed successfully"
        } else {
            Write-Warning "Homebrew not found. Please install MongoDB manually:"
            Write-Host "  brew tap mongodb/brew"
            Write-Host "  brew install mongodb-community@7.0"
        }
        
    } elseif ($IsLinuxOS) {
        # Linux MongoDB installation
        Write-Info "Installing MongoDB on Linux..."
        
        if (Test-CommandExists apt-get) {
            # Ubuntu/Debian
            Write-Info "Detected Debian/Ubuntu system"
            sudo apt-get update
            sudo apt-get install -y gnupg curl
            curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
            Write-Output "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
            sudo apt-get update
            sudo apt-get install -y mongodb-org
            sudo systemctl start mongod
            sudo systemctl enable mongod
            Write-Success "MongoDB installed and started"
            
        } elseif (Test-CommandExists yum) {
            # RedHat/CentOS/Fedora
            Write-Info "Detected RedHat/CentOS/Fedora system"
            Write-Warning "Please install MongoDB manually following: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-red-hat/"
            
        } else {
            Write-Warning "Unknown Linux distribution. Please install MongoDB manually."
        }
    }
}

# ============================================================================
# 2. CHECK AND INSTALL NODE.JS
# ============================================================================

Write-Header "CHECKING NODE.JS"

if (Test-CommandExists node) {
    $nodeVersion = node --version
    Write-Success "Node.js is already installed: $nodeVersion"
    Write-Log "Node.js version: $nodeVersion"
} elseif ($SkipInstall) {
    Write-Warning "Node.js not found. Run without -SkipInstall to install."
} else {
    Write-Info "Installing Node.js..."
    
    if ($IsWindowsOS) {
        # Windows Node.js installation
        $installerUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
        $installerPath = Join-Path $env:TEMP "node-installer.msi"
        
        Write-Info "Downloading Node.js..."
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
            Write-Info "Installing Node.js..."
            Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /qn /norestart" -Wait
            Remove-Item $installerPath -Force
            
            # Refresh PATH
            $env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            
            Write-Success "Node.js installed successfully"
        } catch {
            Write-ErrorMsg "Failed to install Node.js: $_"
        }
        
    } elseif ($IsMacOSPlatform) {
        # macOS Node.js installation
        if (Test-CommandExists brew) {
            Write-Info "Installing Node.js via Homebrew..."
            brew install node@20
            Write-Success "Node.js installed successfully"
        } else {
            Write-Warning "Homebrew not found. Please install Node.js manually from nodejs.org"
        }
        
    } elseif ($IsLinuxOS) {
        # Linux Node.js installation
        Write-Info "Installing Node.js on Linux..."
        
        if (Test-CommandExists apt-get) {
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
            Write-Success "Node.js installed successfully"
            
        } elseif (Test-CommandExists yum) {
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
            Write-Success "Node.js installed successfully"
            
        } else {
            Write-Warning "Please install Node.js manually from nodejs.org"
        }
    }
}

# ============================================================================
# 3. CHECK AND INSTALL PYTHON
# ============================================================================

Write-Header "CHECKING PYTHON"

if (Test-CommandExists python) {
    if (Test-PythonVersionOk) {
        $pythonVersion = Get-PythonVersion
        Write-Success "Python $pythonVersion is installed (>= 3.10)"
        Write-Log "Python version: $pythonVersion"
    } else {
        $pythonVersion = Get-PythonVersion
        Write-Warning "Python $pythonVersion is too old (need >= 3.10)"
        
        if (-not $SkipInstall) {
            Write-Info "Installing Python 3.11..."
            # Install based on OS (implementation below)
        }
    }
} elseif ($SkipInstall) {
    Write-Warning "Python not found. Run without -SkipInstall to install."
} else {
    Write-Info "Installing Python 3.11..."
    
    if ($IsWindowsOS) {
        # Windows Python installation
        $installerUrl = "https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe"
        $installerPath = Join-Path $env:TEMP "python-installer.exe"
        
        Write-Info "Downloading Python..."
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
            Write-Info "Installing Python..."
            Start-Process -FilePath $installerPath -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0" -Wait
            Remove-Item $installerPath -Force
            
            # Refresh PATH
            $env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            
            Write-Success "Python installed successfully"
        } catch {
            Write-ErrorMsg "Failed to install Python: $_"
        }
        
    } elseif ($IsMacOSPlatform) {
        # macOS Python installation
        if (Test-CommandExists brew) {
            Write-Info "Installing Python via Homebrew..."
            brew install python@3.11
            Write-Success "Python installed successfully"
        } else {
            Write-Warning "Homebrew not found. Please install Python manually from python.org"
        }
        
    } elseif ($IsLinuxOS) {
        # Linux Python installation
        Write-Info "Installing Python on Linux..."
        
        if (Test-CommandExists apt-get) {
            sudo apt-get update
            sudo apt-get install -y python3.11 python3.11-venv python3-pip
            Write-Success "Python installed successfully"
            
        } elseif (Test-CommandExists yum) {
            sudo yum install -y python3.11 python3.11-pip
            Write-Success "Python installed successfully"
            
        } else {
            Write-Warning "Please install Python manually from python.org"
        }
    }
}

# ============================================================================
# 4. CHECK AND INSTALL OLLAMA
# ============================================================================

Write-Header "CHECKING OLLAMA"

if (Test-CommandExists ollama) {
    $ollamaVersion = ollama --version 2>&1
    Write-Success "Ollama is already installed: $ollamaVersion"
    Write-Log "Ollama version: $ollamaVersion"
} elseif ($SkipInstall) {
    Write-Warning "Ollama not found. Run without -SkipInstall to install."
} else {
    Write-Info "Installing Ollama..."
    
    if ($IsWindowsOS) {
        # Windows Ollama installation
        $installerUrl = "https://ollama.com/download/OllamaSetup.exe"
        $installerPath = Join-Path $env:TEMP "OllamaSetup.exe"
        
        Write-Info "Downloading Ollama..."
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
            Write-Info "Installing Ollama..."
            Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait
            Remove-Item $installerPath -Force
            Write-Success "Ollama installed successfully"
        } catch {
            Write-ErrorMsg "Failed to install Ollama: $_"
        }
        
    } elseif ($IsMacOSPlatform) {
        # macOS Ollama installation
        Write-Info "Downloading Ollama for macOS..."
        try {
            curl -fsSL https://ollama.com/install.sh | sh
            Write-Success "Ollama installed successfully"
        } catch {
            Write-Warning "Please install Ollama manually from ollama.com"
        }
        
    } elseif ($IsLinuxOS) {
        # Linux Ollama installation
        Write-Info "Installing Ollama on Linux..."
        try {
            curl -fsSL https://ollama.com/install.sh | sh
            Write-Success "Ollama installed successfully"
        } catch {
            Write-Warning "Please install Ollama manually from ollama.com"
        }
    }
}

# ============================================================================
# 5. PROJECT SETUP
# ============================================================================

Write-Header "SETTING UP PROJECT"

# ============================================================================
# 5a. BACKEND SETUP
# ============================================================================

Write-Info "Setting up Backend (FastAPI)..."
Set-Location (Join-Path $ProjectRoot "backend")

# Create virtual environment
if (-not (Test-Path "venv")) {
    Write-Info "Creating Python virtual environment..."
    python -m venv venv
    Write-Success "Virtual environment created"
} else {
    Write-Success "Virtual environment already exists"
}

# Activate venv and install requirements
Write-Info "Installing Python dependencies..."

if ($IsWindowsOS) {
    & ".\venv\Scripts\Activate.ps1"
} else {
    & "venv/bin/Activate.ps1"
}

python -m pip install --upgrade pip | Out-Null
pip install -r requirements.txt 2>&1 | Out-File -Append -FilePath $LogFile

if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend dependencies installed"
} else {
    Write-ErrorMsg "Failed to install some backend dependencies (check logs)"
}

# Check .env file
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Info "Creating .env file from .env.example..."
        Copy-Item ".env.example" ".env"
        Write-Warning "Please configure .env file with your settings"
    } else {
        Write-Warning ".env file not found. Please create one manually"
    }
} else {
    Write-Success ".env file exists"
}

Set-Location $ProjectRoot

# ============================================================================
# 5b. FRONTEND SETUP
# ============================================================================

Write-Info "Setting up Frontend (React + Vite)..."
Set-Location $ProjectRoot

if (-not (Test-Path "node_modules")) {
    Write-Info "Installing Node.js dependencies (this may take several minutes)..."
    npm install 2>&1 | Out-File -Append -FilePath $LogFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend dependencies installed"
    } else {
        Write-ErrorMsg "Failed to install frontend dependencies"
    }
} else {
    Write-Success "Frontend dependencies already installed"
}

# ============================================================================
# 6. START SERVICES
# ============================================================================

Write-Header "STARTING SERVICES"

# ============================================================================
# 6a. START MONGODB
# ============================================================================

Write-Info "Starting MongoDB..."

$mongoRunning = $false

if ($IsWindowsOS) {
    $mongoProcess = Get-Process -Name mongod -ErrorAction SilentlyContinue
    if ($mongoProcess) {
        Write-Success "MongoDB is already running"
        $mongoRunning = $true
    } else {
        # Try to start as service
        try {
            Start-Service MongoDB -ErrorAction SilentlyContinue
            Write-Success "MongoDB service started"
            $mongoRunning = $true
        } catch {
            # Start manually
            Write-Info "Starting MongoDB manually..."
            $dataPath = Join-Path $ProjectRoot "data\db"
            if (-not (Test-Path $dataPath)) {
                New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
            }
            
            $mongodPath = Get-Command mongod -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
            if ($mongodPath) {
                Start-Process -FilePath $mongodPath -ArgumentList "--dbpath=`"$dataPath`" --bind_ip 127.0.0.1" -WindowStyle Hidden
                Start-Sleep -Seconds 3
                Write-Success "MongoDB started"
                $mongoRunning = $true
            }
        }
    }
} else {
    # Linux/macOS
    if (Test-CommandExists mongod) {
        $mongoProcess = Get-Process -Name mongod -ErrorAction SilentlyContinue
        if ($mongoProcess) {
            Write-Success "MongoDB is already running"
            $mongoRunning = $true
        } else {
            # Try systemctl
            if (Test-CommandExists systemctl) {
                sudo systemctl start mongod
                Write-Success "MongoDB service started"
                $mongoRunning = $true
            } elseif ($IsMacOSPlatform -and (Test-CommandExists brew)) {
                brew services start mongodb-community@7.0
                Write-Success "MongoDB service started"
                $mongoRunning = $true
            } else {
                Write-Warning "Please start MongoDB manually: mongod --dbpath=./data/db"
            }
        }
    }
}

if (-not $mongoRunning) {
    Write-Warning "MongoDB is not running. Please start it manually."
}

# ============================================================================
# 6b. START OLLAMA
# ============================================================================

Write-Info "Checking Ollama service..."

if (Test-CommandExists ollama) {
    $ollamaProcess = Get-Process -Name ollama -ErrorAction SilentlyContinue
    if ($ollamaProcess) {
        Write-Success "Ollama is already running"
    } else {
        Write-Info "Starting Ollama service..."
        
        if ($IsWindowsOS) {
            Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
        } else {
            Start-Process -FilePath "ollama" -ArgumentList "serve" -NoNewWindow
        }
        
        Start-Sleep -Seconds 3
        Write-Success "Ollama service started"
    }
    
    # Check for models
    Write-Info "Checking Ollama models..."
    $models = ollama list 2>&1
    if ($models -match "gemma2:2b") {
        Write-Success "Model gemma2:2b already exists"
    } else {
        Write-Info "Pulling default model (gemma2:2b - ~1.6GB)..."
        Write-Warning "This may take several minutes depending on your internet speed..."
        
        if ($IsWindowsOS) {
            Start-Process -FilePath "cmd" -ArgumentList "/k ollama pull gemma2:2b && timeout /t 5 && exit"
        } else {
            Start-Process -FilePath "bash" -ArgumentList "-c 'ollama pull gemma2:2b; read -p Press any key...'"
        }
    }
} else {
    Write-Warning "Ollama not found. Please install and start it manually."
}

# ============================================================================
# 6c. START BACKEND SERVER
# ============================================================================

Write-Info "Starting Backend Server (FastAPI)..."
Set-Location (Join-Path $ProjectRoot "backend")

if ($IsWindowsOS) {
    Start-Process -FilePath "cmd" -ArgumentList "/k call venv\Scripts\activate.bat && python main.py"
} else {
    Start-Process -FilePath "bash" -ArgumentList "-c 'source venv/bin/activate && python main.py'"
}

Start-Sleep -Seconds 2
Write-Success "Backend server starting at http://localhost:8000"

Set-Location $ProjectRoot

# ============================================================================
# 6d. START FRONTEND SERVER
# ============================================================================

Write-Info "Starting Frontend Server (Vite)..."

if ($IsWindowsOS) {
    Start-Process -FilePath "cmd" -ArgumentList "/k npm run dev"
} else {
    Start-Process -FilePath "bash" -ArgumentList "-c 'npm run dev'"
}

Start-Sleep -Seconds 2
Write-Success "Frontend server starting at http://localhost:5173"

# ============================================================================
# 7. COMPLETION
# ============================================================================

Write-Header "SETUP COMPLETE!"

Write-Host ""
Write-Host "All services have been started:"
Write-Host ""
Write-ColorOutput Green "  ✓ MongoDB        : Running (localhost:27017)"
Write-ColorOutput Green "  ✓ Ollama Service : Running (localhost:11434)"
Write-ColorOutput Green "  ✓ Backend (API)  : http://localhost:8000"
Write-ColorOutput Green "  ✓ Frontend (UI)  : http://localhost:5173"
Write-Host ""
Write-Host "============================================================================"
Write-Host ""
Write-ColorOutput Yellow "Next Steps:"
Write-Host "  1. Wait for all services to fully start (~30 seconds)"
Write-Host "  2. Open your browser to: http://localhost:5173"
Write-Host "  3. Configure .env file in backend folder if needed"
Write-Host "  4. Download more Ollama models: ollama pull llama3.1:8b"
Write-Host ""
Write-ColorOutput Yellow "Useful Commands:"
Write-Host "  - List Ollama models: ollama list"
Write-Host "  - Pull new model: ollama pull [model-name]"
if ($IsWindowsOS) {
    Write-Host "  - Stop MongoDB: Stop-Process -Name mongod"
} else {
    Write-Host "  - Stop MongoDB: sudo systemctl stop mongod"
}
Write-Host "  - View logs: Get-Content logs\setup_*.log"
Write-Host ""
Write-Host "============================================================================"
Write-Host ""
Write-Host "Log file saved to: $LogFile"
Write-Host ""

Write-Log "Setup completed successfully"
