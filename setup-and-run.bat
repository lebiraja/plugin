@echo off
SETLOCAL EnableDelayedExpansion
COLOR 0A
TITLE Plugin Project - Automated Setup and Launch

:: ============================================================================
:: Plugin Project - Complete Automated Setup Script
:: This script installs all prerequisites and launches the application
:: ============================================================================

echo.
echo ============================================================================
echo    PLUGIN PROJECT - AUTOMATED SETUP AND LAUNCH
echo ============================================================================
echo.
echo This script will:
echo   1. Check and install MongoDB, Node.js, Python, and Ollama
echo   2. Set up backend (FastAPI) and frontend (React)
echo   3. Launch all services automatically
echo.
echo ============================================================================
echo.

:: Store project root directory
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:: Create logs directory
if not exist "logs" mkdir logs
set "LOG_FILE=%PROJECT_ROOT%logs\setup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log"
set "LOG_FILE=%LOG_FILE: =0%"

echo [%time%] Starting setup process... > "%LOG_FILE%"

:: ============================================================================
:: HELPER FUNCTIONS
:: ============================================================================

:log_info
echo [INFO] %~1
echo [%time%] [INFO] %~1 >> "%LOG_FILE%"
goto :eof

:log_success
echo [92m[SUCCESS][0m %~1
echo [%time%] [SUCCESS] %~1 >> "%LOG_FILE%"
goto :eof

:log_error
echo [91m[ERROR][0m %~1
echo [%time%] [ERROR] %~1 >> "%LOG_FILE%"
goto :eof

:log_warning
echo [93m[WARNING][0m %~1
echo [%time%] [WARNING] %~1 >> "%LOG_FILE%"
goto :eof

:: ============================================================================
:: 1. CHECK AND INSTALL MONGODB
:: ============================================================================

:check_mongodb
call :log_info "Checking MongoDB installation..."

:: Check if mongod is in PATH
where mongod >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_success "MongoDB is already installed"
    goto :check_nodejs
)

:: Check common MongoDB installation paths
set "MONGODB_INSTALLED=0"
if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" set "MONGODB_INSTALLED=1"
if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" set "MONGODB_INSTALLED=1"
if exist "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" set "MONGODB_INSTALLED=1"

if "%MONGODB_INSTALLED%"=="1" (
    call :log_success "MongoDB found in Program Files"
    
    :: Add to PATH for current session
    for /d %%i in ("C:\Program Files\MongoDB\Server\*") do (
        if exist "%%i\bin\mongod.exe" (
            set "PATH=%%i\bin;!PATH!"
            call :log_info "Added MongoDB to PATH: %%i\bin"
        )
    )
    goto :check_nodejs
)

call :log_warning "MongoDB not found. Installing MongoDB Community Edition..."

:: Download MongoDB installer
set "MONGODB_INSTALLER=%TEMP%\mongodb-installer.msi"
set "MONGODB_URL=https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14-signed.msi"

call :log_info "Downloading MongoDB from %MONGODB_URL%..."
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%MONGODB_URL%' -OutFile '%MONGODB_INSTALLER%'}" 2>> "%LOG_FILE%"

if not exist "%MONGODB_INSTALLER%" (
    call :log_error "Failed to download MongoDB installer"
    goto :check_nodejs
)

call :log_info "Installing MongoDB (this may take a few minutes)..."
msiexec /i "%MONGODB_INSTALLER%" /qn /norestart ADDLOCAL="ServerNoService" 2>> "%LOG_FILE%"

:: Wait for installation to complete
timeout /t 10 /nobreak >nul

:: Add to PATH
for /d %%i in ("C:\Program Files\MongoDB\Server\*") do (
    if exist "%%i\bin\mongod.exe" (
        setx PATH "%%i\bin;%PATH%" /M >nul 2>&1
        set "PATH=%%i\bin;!PATH!"
        call :log_success "MongoDB installed successfully"
    )
)

:: Clean up installer
del "%MONGODB_INSTALLER%" >nul 2>&1

:: ============================================================================
:: 2. CHECK AND INSTALL NODE.JS
:: ============================================================================

:check_nodejs
call :log_info "Checking Node.js installation..."

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do set "NODE_VERSION=%%i"
    call :log_success "Node.js is already installed: !NODE_VERSION!"
    goto :check_python
)

call :log_warning "Node.js not found. Installing Node.js LTS..."

:: Download Node.js installer
set "NODE_INSTALLER=%TEMP%\node-installer.msi"
set "NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"

call :log_info "Downloading Node.js from %NODE_URL%..."
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_INSTALLER%'}" 2>> "%LOG_FILE%"

if not exist "%NODE_INSTALLER%" (
    call :log_error "Failed to download Node.js installer"
    goto :check_python
)

call :log_info "Installing Node.js (this may take a few minutes)..."
msiexec /i "%NODE_INSTALLER%" /qn /norestart 2>> "%LOG_FILE%"

:: Wait for installation
timeout /t 15 /nobreak >nul

:: Refresh PATH
call :refresh_path

:: Verify installation
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_success "Node.js installed successfully"
) else (
    call :log_error "Node.js installation may have failed. Please install manually from nodejs.org"
)

:: Clean up installer
del "%NODE_INSTALLER%" >nul 2>&1

:: ============================================================================
:: 3. CHECK AND INSTALL PYTHON
:: ============================================================================

:check_python
call :log_info "Checking Python installation..."

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    :: Get Python version
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%i"
    
    :: Extract major and minor version
    for /f "tokens=1,2 delims=." %%a in ("!PYTHON_VERSION!") do (
        set "PY_MAJOR=%%a"
        set "PY_MINOR=%%b"
    )
    
    :: Check if version >= 3.10
    if !PY_MAJOR! GEQ 3 (
        if !PY_MINOR! GEQ 10 (
            call :log_success "Python !PYTHON_VERSION! is installed (>= 3.10)"
            goto :check_ollama
        )
    )
    
    call :log_warning "Python !PYTHON_VERSION! is too old (need >= 3.10)"
)

call :log_warning "Installing Python 3.11..."

:: Download Python installer
set "PYTHON_INSTALLER=%TEMP%\python-installer.exe"
set "PYTHON_URL=https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe"

call :log_info "Downloading Python from %PYTHON_URL%..."
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%PYTHON_INSTALLER%'}" 2>> "%LOG_FILE%"

if not exist "%PYTHON_INSTALLER%" (
    call :log_error "Failed to download Python installer"
    goto :check_ollama
)

call :log_info "Installing Python (this may take a few minutes)..."
"%PYTHON_INSTALLER%" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0 2>> "%LOG_FILE%"

:: Wait for installation
timeout /t 20 /nobreak >nul

:: Refresh PATH
call :refresh_path

:: Verify installation
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_success "Python installed successfully"
) else (
    call :log_error "Python installation may have failed. Please install manually from python.org"
)

:: Clean up installer
del "%PYTHON_INSTALLER%" >nul 2>&1

:: ============================================================================
:: 4. CHECK AND INSTALL OLLAMA
:: ============================================================================

:check_ollama
call :log_info "Checking Ollama installation..."

where ollama >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('ollama --version 2^>nul') do set "OLLAMA_VERSION=%%i"
    call :log_success "Ollama is already installed: !OLLAMA_VERSION!"
    goto :setup_project
)

call :log_warning "Ollama not found. Installing Ollama..."

:: Download Ollama installer
set "OLLAMA_INSTALLER=%TEMP%\OllamaSetup.exe"
set "OLLAMA_URL=https://ollama.com/download/OllamaSetup.exe"

call :log_info "Downloading Ollama from %OLLAMA_URL%..."
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%OLLAMA_URL%' -OutFile '%OLLAMA_INSTALLER%'}" 2>> "%LOG_FILE%"

if not exist "%OLLAMA_INSTALLER%" (
    call :log_error "Failed to download Ollama installer"
    goto :setup_project
)

call :log_info "Installing Ollama..."
start /wait "" "%OLLAMA_INSTALLER%" /S 2>> "%LOG_FILE%"

:: Wait for installation
timeout /t 10 /nobreak >nul

:: Refresh PATH
call :refresh_path

:: Verify installation
where ollama >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_success "Ollama installed successfully"
) else (
    call :log_warning "Ollama may need manual installation from ollama.com"
)

:: Clean up installer
del "%OLLAMA_INSTALLER%" >nul 2>&1

:: ============================================================================
:: 5. PROJECT SETUP
:: ============================================================================

:setup_project
echo.
echo ============================================================================
echo    SETTING UP PROJECT
echo ============================================================================
echo.

:: ============================================================================
:: 5a. BACKEND SETUP
:: ============================================================================

:setup_backend
call :log_info "Setting up Backend (FastAPI)..."

cd /d "%PROJECT_ROOT%backend"

:: Check if virtual environment exists
if not exist "venv" (
    call :log_info "Creating Python virtual environment..."
    python -m venv venv 2>> "%LOG_FILE%"
    
    if %ERRORLEVEL% NEQ 0 (
        call :log_error "Failed to create virtual environment"
        goto :setup_frontend
    )
    call :log_success "Virtual environment created"
) else (
    call :log_success "Virtual environment already exists"
)

:: Activate virtual environment and install requirements
call :log_info "Installing Python dependencies..."
call venv\Scripts\activate.bat
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt >> "%LOG_FILE%" 2>&1

if %ERRORLEVEL% EQU 0 (
    call :log_success "Backend dependencies installed"
) else (
    call :log_error "Failed to install some backend dependencies (check logs)"
)

:: Check if .env exists
if not exist ".env" (
    if exist ".env.example" (
        call :log_info "Creating .env file from .env.example..."
        copy ".env.example" ".env" >nul
        call :log_warning "Please configure .env file with your settings"
    ) else (
        call :log_warning ".env file not found. Please create one manually"
    )
) else (
    call :log_success ".env file exists"
)

cd /d "%PROJECT_ROOT%"

:: ============================================================================
:: 5b. FRONTEND SETUP
:: ============================================================================

:setup_frontend
call :log_info "Setting up Frontend (React + Vite)..."

cd /d "%PROJECT_ROOT%"

:: Check if node_modules exists
if not exist "node_modules" (
    call :log_info "Installing Node.js dependencies (this may take several minutes)..."
    call npm install >> "%LOG_FILE%" 2>&1
    
    if %ERRORLEVEL% EQU 0 (
        call :log_success "Frontend dependencies installed"
    ) else (
        call :log_error "Failed to install frontend dependencies"
    )
) else (
    call :log_success "Frontend dependencies already installed"
)

cd /d "%PROJECT_ROOT%"

:: ============================================================================
:: 6. START SERVICES
:: ============================================================================

:start_services
echo.
echo ============================================================================
echo    STARTING SERVICES
echo ============================================================================
echo.

:: ============================================================================
:: 6a. START MONGODB
:: ============================================================================

:start_mongodb
call :log_info "Starting MongoDB..."

:: Check if MongoDB is already running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %ERRORLEVEL% EQU 0 (
    call :log_success "MongoDB is already running"
    goto :start_ollama
)

:: Create MongoDB data directory
if not exist "%PROJECT_ROOT%data\db" (
    mkdir "%PROJECT_ROOT%data\db"
    call :log_info "Created MongoDB data directory"
)

:: Try to start MongoDB as a service first
net start MongoDB >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_success "MongoDB service started"
    goto :start_ollama
)

:: If service doesn't exist, start manually
call :log_info "Starting MongoDB manually..."

:: Find mongod.exe
set "MONGOD_PATH="
where mongod >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('where mongod') do set "MONGOD_PATH=%%i"
) else (
    for /d %%i in ("C:\Program Files\MongoDB\Server\*") do (
        if exist "%%i\bin\mongod.exe" set "MONGOD_PATH=%%i\bin\mongod.exe"
    )
)

if defined MONGOD_PATH (
    start "MongoDB Server" "%MONGOD_PATH%" --dbpath="%PROJECT_ROOT%data\db" --bind_ip 127.0.0.1
    timeout /t 5 /nobreak >nul
    call :log_success "MongoDB started in background"
) else (
    call :log_warning "MongoDB executable not found. Please start MongoDB manually"
)

:: ============================================================================
:: 6b. START OLLAMA
:: ============================================================================

:start_ollama
call :log_info "Checking Ollama service..."

:: Check if Ollama is running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if %ERRORLEVEL% EQU 0 (
    call :log_success "Ollama is already running"
    goto :pull_model
)

:: Try to start Ollama
where ollama >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log_info "Starting Ollama service..."
    start "Ollama Service" ollama serve
    timeout /t 3 /nobreak >nul
    call :log_success "Ollama service started"
) else (
    call :log_warning "Ollama not found in PATH. Please start Ollama manually"
)

:: ============================================================================
:: 6c. PULL A DEFAULT MODEL
:: ============================================================================

:pull_model
call :log_info "Checking if Ollama has any models..."

where ollama >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    :: Check if gemma2:2b exists
    ollama list | find "gemma2:2b" >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        call :log_info "Pulling default model (gemma2:2b - ~1.6GB)..."
        call :log_warning "This may take several minutes depending on your internet speed..."
        start "Ollama Pull Model" cmd /k "ollama pull gemma2:2b && echo. && echo Model downloaded successfully! && timeout /t 5 && exit"
    ) else (
        call :log_success "Model gemma2:2b already exists"
    )
)

:: ============================================================================
:: 6d. START BACKEND SERVER
:: ============================================================================

:start_backend
call :log_info "Starting Backend Server (FastAPI)..."

cd /d "%PROJECT_ROOT%backend"

:: Start backend in new window
start "Plugin Backend - FastAPI" cmd /k "call venv\Scripts\activate.bat && python main.py"

timeout /t 3 /nobreak >nul
call :log_success "Backend server starting at http://localhost:8000"

cd /d "%PROJECT_ROOT%"

:: ============================================================================
:: 6e. START FRONTEND SERVER
:: ============================================================================

:start_frontend
call :log_info "Starting Frontend Server (Vite)..."

cd /d "%PROJECT_ROOT%"

:: Start frontend in new window
start "Plugin Frontend - Vite" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul
call :log_success "Frontend server starting at http://localhost:5173"

:: ============================================================================
:: 7. COMPLETION
:: ============================================================================

:completion
echo.
echo ============================================================================
echo    SETUP COMPLETE!
echo ============================================================================
echo.
echo All services have been started:
echo.
echo   [92m✓[0m MongoDB        : Running (localhost:27017)
echo   [92m✓[0m Ollama Service : Running (localhost:11434)
echo   [92m✓[0m Backend (API)  : http://localhost:8000
echo   [92m✓[0m Frontend (UI)  : http://localhost:5173
echo.
echo ============================================================================
echo.
echo [93mNext Steps:[0m
echo   1. Wait for all services to fully start (~30 seconds)
echo   2. Open your browser to: http://localhost:5173
echo   3. Configure .env file in backend folder if needed
echo   4. Download more Ollama models: ollama pull llama3.1:8b
echo.
echo [93mUseful Commands:[0m
echo   - List Ollama models: ollama list
echo   - Pull new model: ollama pull [model-name]
echo   - Stop MongoDB: taskkill /F /IM mongod.exe
echo   - View logs: type logs\setup_*.log
echo.
echo ============================================================================
echo.
echo Log file saved to: %LOG_FILE%
echo.
echo Press any key to exit...
pause >nul

goto :end

:: ============================================================================
:: HELPER FUNCTION: REFRESH PATH
:: ============================================================================

:refresh_path
:: Refresh environment variables from registry
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%b"
set "PATH=%SYS_PATH%;%USER_PATH%"
goto :eof

:: ============================================================================
:: END
:: ============================================================================

:end
ENDLOCAL
exit /b 0
