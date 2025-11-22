#!/bin/bash
# ============================================================================
# Plugin Project - Automated Setup and Launch Script (Bash)
# Supports: Linux, macOS
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_info() { echo -e "${CYAN}ℹ${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_header() { 
    echo ""
    echo -e "${MAGENTA}============================================================================${NC}"
    echo -e "${MAGENTA}   $1${NC}"
    echo -e "${MAGENTA}============================================================================${NC}"
    echo ""
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    else
        OS="unknown"
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Create logs directory
mkdir -p logs
LOG_FILE="$PROJECT_ROOT/logs/setup_$(date +%Y%m%d_%H%M%S).log"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Detect OS
detect_os

log_header "PLUGIN PROJECT - AUTOMATED SETUP AND LAUNCH"

echo "This script will:"
echo "  1. Check and install MongoDB, Node.js, Python, and Ollama"
echo "  2. Set up backend (FastAPI) and frontend (React)"
echo "  3. Launch all services automatically"
echo ""
echo "Platform: $OSTYPE"
echo "OS: $OS"
echo ""

log_message "Starting setup process on $OS"

# ============================================================================
# 1. CHECK AND INSTALL MONGODB
# ============================================================================

log_header "CHECKING MONGODB"

if command_exists mongod; then
    log_success "MongoDB is already installed"
    log_message "MongoDB found in PATH"
else
    log_info "Installing MongoDB..."
    
    if [[ "$OS" == "macos" ]]; then
        # macOS MongoDB installation
        if command_exists brew; then
            log_info "Installing MongoDB via Homebrew..."
            brew tap mongodb/brew 2>&1 | tee -a "$LOG_FILE"
            brew install mongodb-community@7.0 2>&1 | tee -a "$LOG_FILE"
            log_success "MongoDB installed successfully"
        else
            log_error "Homebrew not found. Please install it first:"
            echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
        
    elif [[ "$OS" == "linux" ]]; then
        # Linux MongoDB installation
        if command_exists apt-get; then
            # Ubuntu/Debian
            log_info "Installing MongoDB on Ubuntu/Debian..."
            sudo apt-get update
            sudo apt-get install -y gnupg curl
            
            curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
                sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
            
            echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | \
                sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
            
            sudo apt-get update
            sudo apt-get install -y mongodb-org
            sudo systemctl start mongod
            sudo systemctl enable mongod
            log_success "MongoDB installed and started"
            
        elif command_exists yum; then
            # RedHat/CentOS/Fedora
            log_info "Installing MongoDB on RedHat/CentOS/Fedora..."
            cat <<EOF | sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
            sudo yum install -y mongodb-org
            sudo systemctl start mongod
            sudo systemctl enable mongod
            log_success "MongoDB installed and started"
            
        else
            log_warning "Unknown Linux distribution. Please install MongoDB manually:"
            echo "  https://docs.mongodb.com/manual/administration/install-on-linux/"
        fi
    fi
fi

# ============================================================================
# 2. CHECK AND INSTALL NODE.JS
# ============================================================================

log_header "CHECKING NODE.JS"

if command_exists node; then
    NODE_VERSION=$(node --version)
    log_success "Node.js is already installed: $NODE_VERSION"
    log_message "Node.js version: $NODE_VERSION"
else
    log_info "Installing Node.js..."
    
    if [[ "$OS" == "macos" ]]; then
        # macOS Node.js installation
        if command_exists brew; then
            log_info "Installing Node.js via Homebrew..."
            brew install node@20 2>&1 | tee -a "$LOG_FILE"
            log_success "Node.js installed successfully"
        else
            log_error "Homebrew not found. Please install Node.js manually from nodejs.org"
            exit 1
        fi
        
    elif [[ "$OS" == "linux" ]]; then
        # Linux Node.js installation
        if command_exists apt-get; then
            log_info "Installing Node.js on Ubuntu/Debian..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
            log_success "Node.js installed successfully"
            
        elif command_exists yum; then
            log_info "Installing Node.js on RedHat/CentOS/Fedora..."
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
            log_success "Node.js installed successfully"
            
        else
            log_warning "Please install Node.js manually from nodejs.org"
        fi
    fi
fi

# ============================================================================
# 3. CHECK AND INSTALL PYTHON
# ============================================================================

log_header "CHECKING PYTHON"

check_python_version() {
    if command_exists python3; then
        PYTHON_CMD="python3"
    elif command_exists python; then
        PYTHON_CMD="python"
    else
        return 1
    fi
    
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | grep -oP '\d+\.\d+\.\d+')
    PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
    PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)
    
    if [[ $PYTHON_MAJOR -eq 3 && $PYTHON_MINOR -ge 10 ]] || [[ $PYTHON_MAJOR -gt 3 ]]; then
        log_success "Python $PYTHON_VERSION is installed (>= 3.10)"
        log_message "Python version: $PYTHON_VERSION"
        
        # Create symlink if needed
        if ! command_exists python && command_exists python3; then
            sudo ln -sf "$(which python3)" /usr/local/bin/python 2>/dev/null || true
        fi
        
        return 0
    else
        log_warning "Python $PYTHON_VERSION is too old (need >= 3.10)"
        return 1
    fi
}

if ! check_python_version; then
    log_info "Installing Python 3.11..."
    
    if [[ "$OS" == "macos" ]]; then
        # macOS Python installation
        if command_exists brew; then
            log_info "Installing Python via Homebrew..."
            brew install python@3.11 2>&1 | tee -a "$LOG_FILE"
            log_success "Python installed successfully"
        else
            log_error "Homebrew not found. Please install Python manually from python.org"
            exit 1
        fi
        
    elif [[ "$OS" == "linux" ]]; then
        # Linux Python installation
        if command_exists apt-get; then
            log_info "Installing Python on Ubuntu/Debian..."
            sudo apt-get update
            sudo apt-get install -y python3.11 python3.11-venv python3-pip
            sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1
            sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
            log_success "Python installed successfully"
            
        elif command_exists yum; then
            log_info "Installing Python on RedHat/CentOS/Fedora..."
            sudo yum install -y python3.11 python3.11-pip
            log_success "Python installed successfully"
            
        else
            log_warning "Please install Python manually from python.org"
        fi
    fi
    
    # Verify installation
    check_python_version || log_error "Python installation verification failed"
fi

# Set python command
if command_exists python3; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# ============================================================================
# 4. CHECK AND INSTALL OLLAMA
# ============================================================================

log_header "CHECKING OLLAMA"

if command_exists ollama; then
    OLLAMA_VERSION=$(ollama --version 2>&1)
    log_success "Ollama is already installed: $OLLAMA_VERSION"
    log_message "Ollama version: $OLLAMA_VERSION"
else
    log_info "Installing Ollama..."
    
    log_info "Downloading and installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    log_success "Ollama installed successfully"
fi

# ============================================================================
# 5. PROJECT SETUP
# ============================================================================

log_header "SETTING UP PROJECT"

# ============================================================================
# 5a. BACKEND SETUP
# ============================================================================

log_info "Setting up Backend (FastAPI)..."
cd "$PROJECT_ROOT/backend"

# Create virtual environment
if [ ! -d "venv" ]; then
    log_info "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
    log_success "Virtual environment created"
else
    log_success "Virtual environment already exists"
fi

# Activate venv and install requirements
log_info "Installing Python dependencies..."
source venv/bin/activate

pip install --upgrade pip >> "$LOG_FILE" 2>&1
pip install -r requirements.txt >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log_success "Backend dependencies installed"
else
    log_error "Failed to install some backend dependencies (check logs)"
fi

# Check .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        log_info "Creating .env file from .env.example..."
        cp ".env.example" ".env"
        log_warning "Please configure .env file with your settings"
    else
        log_warning ".env file not found. Please create one manually"
    fi
else
    log_success ".env file exists"
fi

cd "$PROJECT_ROOT"

# ============================================================================
# 5b. FRONTEND SETUP
# ============================================================================

log_info "Setting up Frontend (React + Vite)..."
cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
    log_info "Installing Node.js dependencies (this may take several minutes)..."
    npm install >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "Frontend dependencies installed"
    else
        log_error "Failed to install frontend dependencies"
    fi
else
    log_success "Frontend dependencies already installed"
fi

# ============================================================================
# 6. START SERVICES
# ============================================================================

log_header "STARTING SERVICES"

# ============================================================================
# 6a. START MONGODB
# ============================================================================

log_info "Starting MongoDB..."

MONGO_RUNNING=false

if pgrep -x mongod > /dev/null; then
    log_success "MongoDB is already running"
    MONGO_RUNNING=true
else
    if [[ "$OS" == "macos" ]]; then
        # macOS - use brew services
        if command_exists brew; then
            brew services start mongodb-community@7.0 2>&1 | tee -a "$LOG_FILE"
            sleep 2
            log_success "MongoDB service started"
            MONGO_RUNNING=true
        fi
    elif [[ "$OS" == "linux" ]]; then
        # Linux - use systemctl
        if command_exists systemctl; then
            sudo systemctl start mongod
            sleep 2
            log_success "MongoDB service started"
            MONGO_RUNNING=true
        fi
    fi
    
    if [ "$MONGO_RUNNING" = false ]; then
        # Fallback - start manually
        log_info "Starting MongoDB manually..."
        mkdir -p "$PROJECT_ROOT/data/db"
        mongod --dbpath="$PROJECT_ROOT/data/db" --bind_ip 127.0.0.1 --fork --logpath="$PROJECT_ROOT/logs/mongod.log"
        sleep 3
        log_success "MongoDB started"
        MONGO_RUNNING=true
    fi
fi

# ============================================================================
# 6b. START OLLAMA
# ============================================================================

log_info "Checking Ollama service..."

if pgrep -x ollama > /dev/null; then
    log_success "Ollama is already running"
else
    log_info "Starting Ollama service..."
    
    if [[ "$OS" == "macos" ]]; then
        # macOS - run in background
        nohup ollama serve > "$PROJECT_ROOT/logs/ollama.log" 2>&1 &
    elif [[ "$OS" == "linux" ]]; then
        # Linux - check if systemd service exists
        if systemctl list-unit-files | grep -q ollama; then
            sudo systemctl start ollama
        else
            # Run in background
            nohup ollama serve > "$PROJECT_ROOT/logs/ollama.log" 2>&1 &
        fi
    fi
    
    sleep 3
    log_success "Ollama service started"
fi

# Check for models
if command_exists ollama; then
    log_info "Checking Ollama models..."
    if ollama list 2>&1 | grep -q "gemma2:2b"; then
        log_success "Model gemma2:2b already exists"
    else
        log_info "Pulling default model (gemma2:2b - ~1.6GB)..."
        log_warning "This may take several minutes depending on your internet speed..."
        
        # Pull model in new terminal
        if [[ "$OS" == "macos" ]]; then
            osascript -e 'tell app "Terminal" to do script "ollama pull gemma2:2b && echo && echo Model downloaded successfully! && read -p \"Press Enter to close...\""'
        elif [[ "$OS" == "linux" ]]; then
            if command_exists gnome-terminal; then
                gnome-terminal -- bash -c "ollama pull gemma2:2b; echo; echo 'Model downloaded successfully!'; read -p 'Press Enter to close...'"
            elif command_exists xterm; then
                xterm -e "ollama pull gemma2:2b; echo; echo 'Model downloaded successfully!'; read -p 'Press Enter to close...'"
            else
                # Fallback - pull in background
                ollama pull gemma2:2b &
            fi
        fi
    fi
fi

# ============================================================================
# 6c. START BACKEND SERVER
# ============================================================================

log_info "Starting Backend Server (FastAPI)..."
cd "$PROJECT_ROOT/backend"

# Start backend in new terminal
if [[ "$OS" == "macos" ]]; then
    osascript -e "tell app \"Terminal\" to do script \"cd '$PROJECT_ROOT/backend' && source venv/bin/activate && python main.py\""
elif [[ "$OS" == "linux" ]]; then
    if command_exists gnome-terminal; then
        gnome-terminal --title="Plugin Backend - FastAPI" -- bash -c "cd '$PROJECT_ROOT/backend' && source venv/bin/activate && python main.py"
    elif command_exists xterm; then
        xterm -T "Plugin Backend - FastAPI" -e "cd '$PROJECT_ROOT/backend' && source venv/bin/activate && python main.py" &
    else
        # Fallback - run in background
        cd "$PROJECT_ROOT/backend"
        source venv/bin/activate
        nohup python main.py > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    fi
fi

sleep 2
log_success "Backend server starting at http://localhost:8000"

cd "$PROJECT_ROOT"

# ============================================================================
# 6d. START FRONTEND SERVER
# ============================================================================

log_info "Starting Frontend Server (Vite)..."

# Start frontend in new terminal
if [[ "$OS" == "macos" ]]; then
    osascript -e "tell app \"Terminal\" to do script \"cd '$PROJECT_ROOT' && npm run dev\""
elif [[ "$OS" == "linux" ]]; then
    if command_exists gnome-terminal; then
        gnome-terminal --title="Plugin Frontend - Vite" -- bash -c "cd '$PROJECT_ROOT' && npm run dev"
    elif command_exists xterm; then
        xterm -T "Plugin Frontend - Vite" -e "cd '$PROJECT_ROOT' && npm run dev" &
    else
        # Fallback - run in background
        nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    fi
fi

sleep 2
log_success "Frontend server starting at http://localhost:5173"

# ============================================================================
# 7. COMPLETION
# ============================================================================

log_header "SETUP COMPLETE!"

echo ""
echo "All services have been started:"
echo ""
echo -e "${GREEN}  ✓ MongoDB        : Running (localhost:27017)${NC}"
echo -e "${GREEN}  ✓ Ollama Service : Running (localhost:11434)${NC}"
echo -e "${GREEN}  ✓ Backend (API)  : http://localhost:8000${NC}"
echo -e "${GREEN}  ✓ Frontend (UI)  : http://localhost:5173${NC}"
echo ""
echo "============================================================================"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Wait for all services to fully start (~30 seconds)"
echo "  2. Open your browser to: http://localhost:5173"
echo "  3. Configure .env file in backend folder if needed"
echo "  4. Download more Ollama models: ollama pull llama3.1:8b"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  - List Ollama models: ollama list"
echo "  - Pull new model: ollama pull [model-name]"
if [[ "$OS" == "macos" ]]; then
    echo "  - Stop MongoDB: brew services stop mongodb-community@7.0"
elif [[ "$OS" == "linux" ]]; then
    echo "  - Stop MongoDB: sudo systemctl stop mongod"
fi
echo "  - View logs: cat logs/setup_*.log"
echo ""
echo "============================================================================"
echo ""
echo "Log file saved to: $LOG_FILE"
echo ""

log_message "Setup completed successfully"
