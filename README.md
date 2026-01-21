# Local LLM Chat Interface 🤖✨

A modern, feature-rich chat interface for interacting with local LLM backends like Ollama and LM Studio. Built with React, TypeScript, and FastAPI, featuring **persistent chat sessions**, MongoDB storage, RAG (Retrieval-Augmented Generation), web search, and a beautiful animated UI.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18.3+-61dafb.svg)
![MongoDB](https://img.shields.io/badge/mongodb-7.0+-47A248.svg)
[![npm version](https://img.shields.io/npm/v/@lebiraja/plugintool.svg)](https://www.npmjs.com/package/@lebiraja/plugintool)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

## 📦 npm Package

This project is available as an npm package for easy integration into your React projects.

### Install

```bash
npm install @lebiraja/plugintool
```

### Usage

```tsx
import {
  App,
  ChatInterface,
  UnifiedChatInterface,
  useChatStore,
  useSettingsStore
} from '@lebiraja/plugintool';
import type { Message, AppSettings } from '@lebiraja/plugintool';

// Use the full App component
function MyApp() {
  return <App />;
}

// Or use individual components
function CustomChat() {
  const { messages, addMessage } = useChatStore();

  return (
    <ChatInterface
      onToggleRightSidebar={() => {}}
      isRightSidebarOpen={true}
    />
  );
}
```

### Available Exports

| Category | Exports |
|----------|---------|
| **Components** | `App`, `ChatInterface`, `UnifiedChatInterface`, `MessageList`, `SessionSidebar`, `RightSidebar`, `SettingsModal`, `FileCard`, `LeftSidebar`, `ErrorBoundary`, `BackendStatusBanner`, `MarkdownRenderer`, `DeepResearchPanel`, `ResearchResultsView` |
| **Stores** | `useChatStore`, `useSettingsStore`, `useSessionStore`, `useFileStore`, `useDeepResearchStore` |
| **Hooks** | `useBackendStatus` |
| **Types** | `Message`, `LLMBackend`, `ModelConfig`, `ToolsConfig`, `AppSettings`, `ChatStats`, `SearchResult`, `RAGResult`, `ResearchResult`, and more |

---

## ✨ What This App Does

This is an intelligent chat application that lets you interact with powerful local AI models (like Llama, Gemma, Qwen) running on your own machine. Think ChatGPT, but **completely private, customizable, and running locally**.

### Key Capabilities:

- 💬 **Persistent Chat Sessions** - ChatGPT-style interface with session management and smart auto-titles
- 📚 **Knowledge Base (RAG)** - Upload documents (PDF, DOCX, TXT) and ask questions with MongoDB persistence
- 🌐 **Web Search** - Get real-time information from the internet with citations
- 🎨 **Beautiful UI** - Smooth animations, gradient effects, file cards, and modern design
- 🔧 **Full Control** - Choose your AI model, toggle tools on/off, manage files per session
- 🔒 **100% Private** - Everything runs locally on your machine with MongoDB for data storage

## 🚀 Features

### 💾 Persistent Chat Sessions (NEW!)

- **ChatGPT-Style Interface** - Sidebar with session history organized by time (Today, Yesterday, This Week, Older)
- **Smart Auto-Titles** - AI generates 3-4 word titles after first exchange based on conversation context
- **MongoDB Storage** - All conversations, messages, and files persist across sessions
- **Session Management** - Create, view, delete sessions with full conversation history
- **Session-Based File Uploads** - Files are linked to specific chat sessions with metadata tracking

### 🤖 Multi-Backend LLM Support

- **Ollama** - Run models like Llama, Gemma, Qwen, DeepSeek locally
- **LM Studio** - Desktop LLM interface with OpenAI-compatible API
- **Dynamic Model Selection** - Interactive dropdowns to switch backends and models
- **Auto-Discovery** - Automatically detects available models from your LLM backend
- **Unified Sidebar** - Backend selector, model selector, and tools all in one place

### 🧠 Advanced Conversation Memory

- **Full Session History** - Remembers entire conversation within a session
- **Intelligent Context** - Uses last 10 messages for AI context
- **Message Persistence** - All messages stored in MongoDB with timestamps
- **Smart Title Generation** - Asynchronous title generation using LLM after first exchange

### 🛠️ Powerful Tools (Toggle On/Off)

- 🔍 **Web Search** - Powered by Serper.dev (Google search API)
- 📚 **RAG (Document Q&A)** - Ask questions about uploaded documents with persistent storage
- 🧪 **Deep Research** - Multi-step iterative reasoning
- 📊 **Real-time Stats** - Token counting and latency tracking

### 📁 Enhanced Knowledge Base Management (NEW!)

- **File Cards Display** - ChatGPT-style file cards showing uploaded documents in chat
- **MongoDB Persistence** - File chunks and embeddings stored in MongoDB for permanent access
- **Session-Specific Files** - Each session maintains its own file collection
- **File Metadata** - Track filename, size, upload time, embedding status, and chunk count
- **Automatic Processing** - Files are chunked, embedded, and stored automatically on upload
- **Multi-Format Support** - PDF, DOCX, TXT with intelligent text extraction
- **Vector Search** - Semantic search across uploaded documents using embeddings

### 🎨 Modern UI/UX

- ✨ **Spring Animations** - Smooth Framer Motion physics
- 🌈 **Gradient Backgrounds** - Dynamic color schemes for messages
- 💎 **Glassmorphism Effects** - Frosted glass aesthetics
- 📇 **File Cards** - Visual display of uploaded files with icons, size, and chunk info
- 🎭 **Loading Indicators** - Shows KB search, web search, and generation status
- 📱 **Responsive Design** - Works on desktop and mobile
- 🕒 **Time-Based Grouping** - Sessions organized by Today, Yesterday, This Week, Older

## 🚀 Quick Start

### 🐳 Docker Setup (Easiest!)

Run the entire app with Docker (no manual installation needed):

```bash
# Clone the repository
git clone https://github.com/lebiraja/plugin.git
cd plugin

# Start all services (MongoDB, Backend, Frontend, Ollama)
docker-compose up -d

# Pull a model
docker exec -it ollama ollama pull gemma2:2b

# Open the app
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

See [Docker-README.md](Docker-README.md) for detailed Docker instructions.

---

### 🎯 Automated Setup (Alternative)

We also provide **automated setup scripts** for all platforms that install everything and launch the app automatically:

#### **Windows (Batch Script)**

```cmd
setup-and-run.bat
```

- Double-click `setup-and-run.bat` or run in Command Prompt
- Automatically installs: MongoDB, Node.js, Python 3.11, Ollama
- Sets up backend and frontend dependencies
- Launches all services in separate windows

#### **Windows/Linux/macOS (PowerShell)**

```powershell
pwsh setup-and-run.ps1
```

- Cross-platform PowerShell script
- Works on Windows, Linux, macOS
- Same functionality as batch script
- Requires PowerShell 7+ (pre-installed on Windows 10+)

#### **Linux/macOS (Bash Script)**

```bash
chmod +x setup-and-run.sh
./setup-and-run.sh
```

- Native bash script for Unix systems
- Automatically detects Ubuntu/Debian/CentOS/macOS
- Uses system package managers (apt, yum, brew)
- Starts all services automatically

**What the scripts do:**

1. ✅ Check if MongoDB, Node.js, Python, Ollama are installed
2. ✅ Install missing prerequisites automatically
3. ✅ Create Python virtual environment
4. ✅ Install all dependencies (pip, npm)
5. ✅ Create `.env` from example if missing
6. ✅ Start MongoDB service
7. ✅ Start Ollama service
8. ✅ Pull default model (gemma2:2b)
9. ✅ Launch backend (FastAPI) in new terminal
10. ✅ Launch frontend (Vite) in new terminal
11. ✅ Log everything to `logs/` directory

**After running:** Just wait ~30 seconds and open http://localhost:5173

---

### Manual Setup (If you prefer step-by-step)

If you prefer to install everything manually, follow the detailed instructions below.

### Prerequisites

Before you begin, make sure you have:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Python 3.11+** - [Download here](https://www.python.org/downloads/)
3. **MongoDB 7.0+** - [Download here](https://www.mongodb.com/try/download/community)
   - Or use **MongoDB Atlas** (free cloud tier) - [Sign up here](https://www.mongodb.com/cloud/atlas/register)
4. **Ollama** (recommended) - [Download here](https://ollama.ai/)
   - Or **LM Studio** - [Download here](https://lmstudio.ai/)
5. **Git** - [Download here](https://git-scm.com/)

### MongoDB Setup

#### Option 1: Local MongoDB (Recommended for Development)

**Windows:**

```bash
# Download MongoDB Community Server from mongodb.com
# Install with default settings
# MongoDB will run as a Windows service automatically

# Verify it's running
mongosh
# You should see: "Connected to: mongodb://127.0.0.1:27017"
```

**macOS (using Homebrew):**

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0

# Verify it's running
mongosh
```

**Linux (Ubuntu/Debian):**

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify it's running
mongosh
```

#### Option 2: MongoDB Atlas (Cloud - Free Tier)

1. **Sign up** at [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. **Create a free cluster** (M0 tier - no credit card required)
3. **Create a database user** with read/write permissions
4. **Whitelist your IP** or use `0.0.0.0/0` for development
5. **Get connection string** from "Connect" → "Connect your application"
6. **Copy the connection string** (looks like: `mongodb+srv://user:password@cluster.mongodb.net/`)

#### Verify MongoDB Installation

```bash
# Test local MongoDB connection
mongosh

# Or test with connection string
mongosh "mongodb://127.0.0.1:27017"

# Should see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017
# Using MongoDB: 7.0.x
```

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/lebiraja/plugin.git
cd plugin
```

#### 2. Set Up the Backend

```bash
# Navigate to backend folder
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies (using uv for faster installs, or use pip)
pip install uv
uv pip install -r requirements.txt

# Or with regular pip:
pip install -r requirements.txt
```

#### 3. Configure Environment Variables

```bash
# Copy the example .env file
cp .env.example .env

# Edit .env and configure MongoDB and other settings
```

Your `backend/.env` should look like:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://127.0.0.1:27017  # Local MongoDB
# Or for MongoDB Atlas:
# MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

MONGODB_DB_NAME=chat_app  # Database name (will be created automatically)

# Backend Configuration
OLLAMA_URL=http://127.0.0.1:11434
LMSTUDIO_URL=http://localhost:1234

# Web Search API (100 free searches/month)
SERPER_API_KEY=your_serper_api_key_here

# Vector Database (ChromaDB - local storage)
VECTOR_DB_PATH=./vector_db

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Server
HOST=0.0.0.0
PORT=8000
```

**Important MongoDB Notes:**

- For **local MongoDB**: Use `mongodb://127.0.0.1:27017`
- For **MongoDB Atlas**: Use your connection string from Atlas dashboard
- The database (`chat_app`) and collections will be created automatically
- Indexes are created automatically on first startup

#### 4. Set Up the Frontend

```bash
# Go back to project root
cd ..

# Install frontend dependencies
npm install
```

#### 5. Install and Configure Ollama

```bash
# Download Ollama from https://ollama.ai/

# Pull some models (examples)
ollama pull gemma2:2b          # Small, fast model
ollama pull llama3.1:8b        # Balanced model
ollama pull qwen2.5-coder:3b   # Great for coding

# Start Ollama (it usually runs automatically)
ollama serve
```

### Running the Application

#### Method 1: Separate Terminals (Recommended for Development)

**Terminal 1 - Start MongoDB (if using local):**

```bash
# Windows (if not running as service)
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"

# macOS/Linux (if not running as service)
sudo systemctl start mongod  # Linux
# or
brew services start mongodb-community@7.0  # macOS
```

**Terminal 2 - Backend:**

```bash
cd backend
.\venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Start backend server with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# You should see:
# INFO:     Connected to MongoDB: chat_app
# INFO:     Application startup complete
```

**Terminal 3 - Frontend:**

```bash
# From project root
npm run dev

# You should see:
# VITE v5.4.x ready in xxx ms
# ➜ Local: http://localhost:5173/
```

#### Method 2: Production Mode

```bash
# Build frontend
npm run build

# Start backend (serves both API and static frontend)
cd backend
python main.py
```

### Access the App

Open your browser and go to:

```
http://localhost:5173  # Development mode
# or
http://localhost:8000  # Production mode
```

## 📖 How to Use

### 1. First Time Setup

1. **Start MongoDB** - Make sure MongoDB is running (locally or Atlas connection)
2. **Start Backend** - Run `uvicorn main:app --reload` from `backend/` directory
3. **Start Frontend** - Run `npm run dev` from project root
4. **Open the app** - Navigate to `http://localhost:5173`
5. **Select Backend** - Click backend dropdown in the left sidebar and choose "Ollama" or "LM Studio"
6. **Choose Model** - Select a model from the model dropdown (auto-populates from your LLM backend)
7. **Start Chatting!** - Type a message and press Enter

### 2. Chat Sessions (ChatGPT-Style)

The app now features persistent chat sessions similar to ChatGPT:

**Creating Sessions:**

- Click **"+ New Chat"** button to start a fresh conversation
- Each session gets a unique ID and is stored in MongoDB
- Sessions automatically get smart titles after the first exchange

**Session History:**

- Left sidebar shows all your chat sessions organized by time:
  - **Today** - Sessions created today
  - **Yesterday** - Sessions from yesterday
  - **This Week** - Sessions from the past 7 days
  - **Older** - Sessions older than a week
- Click any session to load its full conversation history

**Smart Auto-Titles:**

- After your first message and AI response, the session automatically gets a 3-4 word title
- Title is generated by the AI based on the conversation context
- Example: "Python Programming Help" or "Database Design Questions"

**Session Management:**

- Hover over a session to see the delete button
- Delete unwanted sessions (permanently removes from MongoDB)
- Sessions persist across browser refreshes and app restarts

### 3. Using Conversation Memory

The app automatically remembers your conversation:

```
You: My name is Alex and I love Python programming.
AI: Nice to meet you, Alex! Python is a great language...

You: What's my name?
AI: Your name is Alex!

You: What language did I mention?
AI: You mentioned that you love Python programming!
```

- **Full Session History** - All messages in a session are stored in MongoDB
- **Intelligent Context** - AI uses last 10 messages for generating responses
- **Persistent Storage** - Conversations survive server restarts and browser refreshes

### 4. Toggle Tools On/Off

In the left sidebar, click the tool buttons to enable/disable:

- **RAG** - For uploaded document Q&A (blue when active)
- **Web Search** - For current information (blue when active)
- **Deep Research** - For complex multi-step reasoning (blue when active)

Tools are session-specific and persist with your session settings.

### 5. Upload and Query Documents (Enhanced with File Cards!)

**Upload Files:**

1. **Click paperclip icon** 📎 in the chat input area
2. **Select files** - PDF, DOCX, or TXT (max 10MB per file)
3. **Files are processed** - Automatically chunked, embedded, and stored in MongoDB
4. **File cards appear** - See your uploaded files displayed as cards in the chat

**File Cards Display:**

- Each uploaded file shows as a card with:
  - 📄 **File icon** (color-coded by type)
  - 📝 **Filename**
  - 📊 **File size** (formatted in KB/MB)
  - 🧩 **Chunk count** (number of text chunks created)
- Files are organized in a "Knowledge Base" section above the chat input

**Query Documents:**

1. **Enable RAG** - Click the RAG button in left sidebar (turns blue)
2. **Ask questions** - "What are the main points in the document?"
3. **Get contextualized answers** - AI uses relevant chunks from your files
4. **See sources** - Citations show which file chunks were used

**File Persistence:**

- Files are linked to specific chat sessions
- File metadata and embeddings stored in MongoDB
- Files persist across sessions and app restarts
- Each session has its own file collection

### 6. Web Search

1. **Get Serper API Key** - Free 100 searches/month at [serper.dev](https://serper.dev/api-keys)
2. **Add to .env** - Put key in `backend/.env` as `SERPER_API_KEY`
3. **Enable Tool** - Click "Web Search" button in left sidebar (turns blue)
4. **Ask Current Events** - "What's the latest news about AI?"
5. **See Citations** - Sources shown in right sidebar

### 7. View Statistics

Right sidebar shows session statistics:

- 📊 **Message count** - Total messages in current session
- 📝 **Token usage** - Estimated tokens used
- 📁 **Files uploaded** - Number of files in knowledge base
- 🔗 **Context sources** - Citations from RAG/web search
- 🕒 **Session created** - Timestamp of session creation

## 🏗️ Architecture

### Frontend Stack

- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.5** - Type-safe JavaScript
- **Vite 5.4** - Lightning-fast build tool
- **Framer Motion 11.5** - Smooth spring animations
- **Zustand 4.5** - Lightweight state management
- **Axios** - HTTP client for API calls
- **React Markdown** - Beautiful markdown rendering with syntax highlighting
- **React Router** - Session-based routing (`/chat/:sessionId`)

### Backend Stack

- **FastAPI 0.115** - High-performance async Python API
- **MongoDB (Motor 3.6)** - Async MongoDB driver for Python
  - **Collections**: `chat_sessions` (sessions & messages), `knowledge_base` (RAG chunks)
  - **Indexes**: Optimized for session_id, file_id, timestamps
- **ChromaDB 0.5.15** - Vector database for embeddings (local storage)
- **sentence-transformers 3.0** - nomic-ai/nomic-embed-text-v1.5 (547MB)
- **httpx 0.27** - Async HTTP client
- **pypdf, python-docx** - Document processing (PDF, DOCX, TXT)
- **duckduckgo-search** - Fallback web search
- **Serper.dev** - Primary web search (Google results)

### LLM Integrations

- **Ollama API** - Local model serving (127.0.0.1:11434)
- **LM Studio** - OpenAI-compatible API (localhost:1234)
- **Custom backends** - Bring your own API

### Database Schema

**MongoDB Collections:**

```javascript
// chat_sessions collection
{
  session_id: string (UUID),
  title: string (auto-generated),
  backend: string,
  model: string,
  created_at: datetime,
  updated_at: datetime,
  messages: [
    {
      role: "user" | "assistant",
      content: string,
      timestamp: datetime,
      tokens: number (optional),
      sources: array (optional)
    }
  ],
  files: [
    {
      file_id: string (UUID),
      filename: string,
      file_path: string,
      size: number,
      uploaded_at: datetime,
      embedded: boolean,
      chunks: number
    }
  ],
  config: {
    temperature: float,
    topP: float,
    maxTokens: int
  }
}

// knowledge_base collection
{
  file_id: string,
  session_id: string,
  chunk_text: string,
  chunk_index: number,
  embedding: array<float>,
  metadata: {
    source: string,
    chunk_index: number,
    total_chunks: number
  },
  created_at: datetime
}
```

**Indexes:**

- `chat_sessions`: session_id, created_at, updated_at
- `knowledge_base`: file_id, session_id, created_at, compound(session_id + file_id)

## 📁 Project Structure

```
plugin/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── ChatInterface.tsx    # Main chat with session management & file cards
│   │   ├── SessionSidebar.tsx   # Unified sidebar (history, backend, model, tools)
│   │   ├── RightSidebar.tsx     # Stats & session info
│   │   ├── MessageList.tsx      # Animated message display
│   │   ├── FileCard.tsx         # File card component (NEW!)
│   │   └── FileUpload.tsx       # Drag & drop file upload
│   ├── store/
│   │   ├── chatStore.ts         # Conversation state
│   │   └── settingsStore.ts     # App configuration
│   ├── api/
│   │   ├── chat.ts              # Chat API (legacy)
│   │   ├── sessions.ts          # Session management API (NEW!)
│   │   ├── models.ts            # Model fetching
│   │   └── files.ts             # File upload/delete
│   └── index.css                # Global styles & animations
├── backend/
│   ├── routers/
│   │   ├── sessions.py          # Session CRUD & messaging (NEW!)
│   │   ├── chat.py              # Legacy chat endpoint
│   │   ├── models.py            # Model listing (Ollama/LM Studio)
│   │   ├── files.py             # File upload/delete/list
│   │   └── tools.py             # RAG & web search endpoints
│   ├── services/
│   │   ├── session_service.py   # Session business logic (NEW!)
│   │   ├── database_service.py  # MongoDB connection & schema (NEW!)
│   │   ├── llm_service.py       # LLM backend abstraction with memory
│   │   ├── search_service.py    # Serper.dev + DuckDuckGo fallback
│   │   ├── rag_service.py       # Vector search & MongoDB storage (UPDATED!)
│   │   └── document_processor.py # File parsing & embedding
│   ├── main.py                   # FastAPI app with CORS & MongoDB startup
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment template
│   └── .env                      # Your config (not committed)
├── public/                       # Static assets
├── package.json                  # Node dependencies
└── README.md                     # This file
```

## ⚙️ Configuration Files

### Backend `.env` Configuration

Located in `backend/.env` (create from `.env.example`):

```env
# MongoDB Configuration (Required)
MONGODB_URL=mongodb://127.0.0.1:27017
# For MongoDB Atlas cloud:
# MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

MONGODB_DB_NAME=chat_app  # Database name (auto-created)

# LLM Backend URLs
OLLAMA_URL=http://127.0.0.1:11434
LMSTUDIO_URL=http://localhost:1234

# Web Search API (Required for web search tool)
# Get free key at: https://serper.dev/api-keys
SERPER_API_KEY=your_serper_api_key_here

# Vector Database (ChromaDB - local file storage)
VECTOR_DB_PATH=./vector_db

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# CORS (frontend URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Server
HOST=0.0.0.0
PORT=8000
```

### Frontend Configuration

All settings are now stored in MongoDB per session:

- Selected backend and model (per session)
- Tool toggles (RAG, web search, deep research)
- Conversation history (messages array)
- File list (session-specific files)
- Session metadata (title, timestamps)

To reset: Delete sessions via UI or MongoDB directly

## 🔧 Advanced Usage

### API Endpoints

The backend exposes a RESTful API for session management:

#### Session Endpoints

```bash
# Create new session
POST /api/sessions
Body: {
  "backend": "ollama",
  "model": "gemma2:2b",
  "config": {
    "temperature": 0.7,
    "topP": 0.9,
    "maxTokens": 2048
  }
}

# Get all sessions (with time grouping)
GET /api/sessions

# Get specific session
GET /api/sessions/{session_id}

# Delete session (removes all messages and files)
DELETE /api/sessions/{session_id}

# Send message to session
POST /api/sessions/{session_id}/message
Body: {
  "message": "Hello, how are you?",
  "config": { ... }  # Optional
}

# Upload file to session
POST /api/sessions/{session_id}/upload
Body: multipart/form-data with file

# Get session files
GET /api/sessions/{session_id}/files
```

#### Model Endpoints

```bash
# List Ollama models
GET /api/models/ollama

# List LM Studio models
GET /api/models/lmstudio
```

### MongoDB Collections

**Accessing data directly:**

```javascript
// Connect to MongoDB
mongosh "mongodb://127.0.0.1:27017"

// Switch to chat database
use chat_app

// List all sessions
db.chat_sessions.find({})

// Find session by ID
db.chat_sessions.findOne({session_id: "your-session-id"})

// Count total messages across all sessions
db.chat_sessions.aggregate([
  {$unwind: "$messages"},
  {$count: "total_messages"}
])

// Find sessions created today
db.chat_sessions.find({
  created_at: {
    $gte: new Date(new Date().setHours(0,0,0,0))
  }
})

// Get all file chunks for a session
db.knowledge_base.find({session_id: "your-session-id"})

// Count total chunks
db.knowledge_base.countDocuments()

// Delete old sessions (older than 30 days)
db.chat_sessions.deleteMany({
  created_at: {
    $lt: new Date(Date.now() - 30*24*60*60*1000)
  }
})
```

### Custom Model Parameters

Models use these default parameters (can be modified per message):

```typescript
{
  temperature: 0.7,    // Creativity (0.0 = focused, 1.0 = creative)
  topP: 0.9,          // Nucleus sampling
  maxTokens: 2048,    // Maximum response length
  frequencyPenalty: 0.0,  // Reduce repetition
  presencePenalty: 0.0    // Encourage new topics
}
```

### Adding More Backends

Edit `src/store/settingsStore.ts`:

```typescript
backends: [
  {
    id: "ollama",
    name: "Ollama",
    url: "http://127.0.0.1:11434",
    type: "ollama",
    isActive: true,
  },
  {
    id: "custom",
    name: "My Custom Backend",
    url: "https://my-api.example.com",
    type: "openai", // Use OpenAI-compatible format
    apiKey: "optional-key",
    isActive: true,
  },
];
```

### Customizing Embeddings

The app uses `nomic-ai/nomic-embed-text-v1.5` (547MB, excellent quality).

To use a different model, edit `backend/services/document_processor.py`:

```python
from sentence_transformers import SentenceTransformer

self.embedding_model = SentenceTransformer('your-model-name')
```

## 🎨 UI Customization

### Animation Speeds

Edit `src/components/MessageList.tsx`:

```typescript
animate={{ opacity: 1, y: 0 }}
transition={{
  type: "spring",
  stiffness: 100,  // Lower = slower bounce
  damping: 15      // Higher = less bounce
}}
```

### Color Schemes

Edit `src/index.css`:

```css
.assistant-message {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.1),
    /* Adjust colors */ rgba(147, 51, 234, 0.1)
  );
}
```

## 🐛 Troubleshooting

### Automated Setup Script Issues

#### **Script execution disabled (PowerShell)**

**Problem:** `setup-and-run.ps1 cannot be loaded because running scripts is disabled`

**Solution:**

```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then run the script again
pwsh setup-and-run.ps1
```

#### **Permission denied (Linux/macOS)**

**Problem:** `bash: ./setup-and-run.sh: Permission denied`

**Solution:**

```bash
chmod +x setup-and-run.sh
./setup-and-run.sh
```

#### **Script hangs during installation**

**Problem:** Script appears stuck during MongoDB/Ollama installation

**Solution:**

- Check `logs/setup_*.log` for detailed error messages
- Ensure you have internet connection
- Run with administrator/sudo privileges if needed
- Manually install the stuck component and rerun script

#### **Services won't start**

**Problem:** MongoDB or Ollama service fails to start

**Solution:**

```bash
# Check if ports are already in use
# Windows:
netstat -ano | findstr :27017
netstat -ano | findstr :11434

# Linux/macOS:
lsof -i :27017
lsof -i :11434

# Kill processes using the ports if needed
```

### MongoDB connection failed

**Problem:** `Failed to connect to MongoDB` error on startup

**Solution:**

```bash
# Check if MongoDB is running
mongosh

# Start MongoDB service
# Windows:
net start MongoDB

# macOS:
brew services start mongodb-community@7.0

# Linux:
sudo systemctl start mongod

# For MongoDB Atlas:
# - Check connection string in .env
# - Verify IP whitelist in Atlas dashboard
# - Check username/password are correct
```

### Backend won't start

**Problem:** `ModuleNotFoundError` or import errors

**Solution:**

```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt

# If still failing, reinstall dependencies:
pip install --upgrade -r requirements.txt
```

### No models showing up

**Problem:** Model dropdown is empty

**Solution:**

1. Make sure Ollama is running: `ollama serve`
2. Pull at least one model: `ollama pull gemma2:2b`
3. Check Ollama URL in `.env`: `OLLAMA_URL=http://127.0.0.1:11434`
4. Click the refresh button (🔄) next to model selector
5. Check browser console for API errors

### Sessions not persisting

**Problem:** Chat sessions disappear after refresh

**Solution:**

1. Verify MongoDB is running: `mongosh`
2. Check `MONGODB_URL` in `backend/.env`
3. Look for connection errors in backend logs
4. Test MongoDB connection: `mongosh "mongodb://127.0.0.1:27017"`
5. Check database exists: In mongosh, run `show dbs`

### File upload fails

**Problem:** Files don't upload or process

**Solution:**

1. Check file size (default max: 10MB)
2. Ensure `backend/uploads/` directory exists
3. Check backend logs for errors
4. Supported formats: PDF, DOCX, TXT
5. Make sure session exists before uploading
6. Check MongoDB `knowledge_base` collection for chunks

### RAG not working

**Problem:** "what is in the file" doesn't use document content

**Solution:**

1. Ensure RAG toggle is ON (blue) in left sidebar
2. Check that file was uploaded successfully (file card appears)
3. Wait for embedding to complete (check `embedded: true` in file metadata)
4. Verify chunks were created in MongoDB:
   ```javascript
   // In mongosh:
   use chat_app
   db.knowledge_base.find({session_id: "your-session-id"})
   ```
5. Check backend logs for RAG processing errors

### Web search not working

**Problem:** "Web Search Unavailable" message

**Solution:**

1. Get free API key from [serper.dev](https://serper.dev/api-keys)
2. Add to `backend/.env`: `SERPER_API_KEY=your_key_here`
3. Restart backend server
4. Enable "Web Search" toggle in left sidebar (turns blue)
5. Check backend logs for API errors

### File cards not showing

**Problem:** Uploaded files don't display as cards

**Solution:**

1. Check that file upload completed successfully
2. Verify session has files array in MongoDB:
   ```javascript
   // In mongosh:
   use chat_app
   db.chat_sessions.findOne({session_id: "your-session-id"})
   ```
3. Refresh the chat session
4. Check browser console for React errors

### Conversation memory not working

**Problem:** AI doesn't remember previous messages in session

**Solution:**

- This is built-in now! Uses full session history from MongoDB
- Make sure you're in the same session (check session_id in URL)
- Check MongoDB for messages: `db.chat_sessions.findOne({session_id: "..."})`
- Backend uses last 10 messages for context automatically
- Check browser console for errors

### Session titles not generating

**Problem:** Sessions show as "New Chat" instead of AI-generated titles

**Solution:**

1. Title generates after first message exchange (user + assistant)
2. Check backend logs for title generation errors
3. Make sure LLM backend is responding correctly
4. Title generation is async - may take a few seconds
5. Check MongoDB: `db.chat_sessions.findOne({session_id: "..."})` for `title` field

### Frontend shows old version

**Problem:** Changes don't appear after updates

**Solution:**

```bash
# Hard refresh
Ctrl + F5  (Windows)
Cmd + Shift + R  (Mac)

# Or clear cache
# Browser DevTools → Application → Clear storage

# Or rebuild
npm run build
```

## 🛠️ Development

### Run Backend Tests

```bash
cd backend
pytest
```

### Run Frontend in Dev Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
cd backend
python main.py  # Serves built frontend + API
```

### Lint and Format

```bash
# Frontend
npm run lint

# Backend
cd backend
black .
flake8 .
```

### Hot Reload

Both frontend (Vite) and backend (uvicorn --reload) support hot reloading in development mode.

## 📊 Performance Tips

1. **Use smaller models for speed** - `gemma2:2b` is very fast
2. **Limit conversation history** - Uses last 10 messages for context (configurable)
3. **Chunk large documents** - Files are auto-chunked to 512 characters
4. **Use RAG only when needed** - Toggle off when not querying docs
5. **Web search is rate-limited** - Serper.dev offers 100 free searches/month
6. **MongoDB indexes** - Automatically created for optimal query performance
7. **Clean old sessions** - Periodically delete unused sessions to save space
8. **Local MongoDB** - Use local MongoDB for best performance vs Atlas cloud
9. **File size limits** - Keep files under 10MB for faster processing
10. **GPU acceleration** - RAG embedding uses GPU if available (CUDA)

## 🔒 Privacy & Security

- ✅ **100% Local Processing** - All AI inference happens on your machine
- ✅ **Local Data Storage** - MongoDB can run locally, no cloud required
- ✅ **No Data Sent to Cloud** - Except web search queries (via Serper.dev) and if using MongoDB Atlas
- ✅ **API Keys Protected** - `.env` file not committed to Git
- ✅ **CORS Configured** - Only allows localhost origins
- ✅ **Session Isolation** - Each session has its own files and context
- ✅ **No Analytics** - No tracking or telemetry sent anywhere
- ⚠️ **Development Mode** - Not hardened for public deployment
- 💡 **MongoDB Options**:
  - **Local MongoDB**: Complete privacy, all data on your machine
  - **MongoDB Atlas**: Convenient cloud option, data encrypted at rest and in transit

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript/Python best practices
- Add comments for complex logic
- Test before submitting
- Update README if adding features

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Ollama Team** - Amazing local LLM runtime
- **FastAPI** - High-performance Python framework
- **Framer Motion** - Beautiful React animations
- **ChromaDB** - Excellent vector database
- **Serper.dev** - Reliable Google search API
- **Nomic AI** - High-quality embedding models
- **Open Source Community** - For all the incredible tools

## 📧 Support & Contact

- **Issues** - [GitHub Issues](https://github.com/lebiraja/plugin/issues)
- **Discussions** - [GitHub Discussions](https://github.com/lebiraja/plugin/discussions)

## 🗺️ Roadmap

Future features planned:

- [ ] Multi-modal support (image input)
- [ ] Voice chat integration
- [ ] Custom prompt templates
- [ ] Conversation export/import (JSON, Markdown)
- [ ] Advanced RAG with re-ranking
- [x] Multiple conversation threads (✅ Implemented v2.0)
- [x] MongoDB persistent storage (✅ Implemented v2.0)
- [ ] Conversation search and filtering
- [ ] Session sharing and collaboration
- [ ] File version control in knowledge base
- [ ] Plugin system for extensions
- [ ] Mobile app (React Native)
- [ ] Batch file uploads
- [ ] Advanced analytics dashboard

## 📝 Changelog

### Version 1.0.0 (January 2026)

- ✅ **Persistent Chat Sessions** - MongoDB-backed session management
- ✅ **ChatGPT-Style Interface** - Session history sidebar with time-based grouping
- ✅ **Smart Auto-Titles** - AI generates 3-4 word titles after first exchange
- ✅ **File Cards Display** - ChatGPT-style file cards in chat interface
- ✅ **MongoDB Knowledge Base** - Persistent RAG chunks storage
- ✅ **Session-Based Files** - Files linked to specific sessions
- ✅ **Unified Sidebar** - Backend, model, and tools in one sidebar
- ✅ **Enhanced RAG Service** - MongoDB storage with automatic text extraction
- ✅ **File Metadata Tracking** - Track embedded status, chunk count, file size
- ✅ **Async Title Generation** - Non-blocking title creation
- ✅ **Session CRUD API** - Full REST API for session management
- ✅ **Database Indexes** - Optimized queries for sessions and files
- ✅ **Docker Support** - One-command deployment with docker-compose
- ✅ **npm Package** - Published to npm as @lebiraja/plugintool

- ✅ Interactive model selector with auto-fetch
- ✅ Conversation memory (last 10 messages)
- ✅ Interactive tool toggle buttons
- ✅ Knowledge base file management with delete
- ✅ Enhanced UI with spring animations
- ✅ Web search via Serper.dev
- ✅ RAG with nomic-embed-text-v1.5
- ✅ Loading status indicators
- ✅ Glassmorphism design
- ✅ Gradient message backgrounds
- ✅ Citation display for sources

---

**Made with ❤️ by [lebiraja](https://github.com/lebiraja)**

_Star ⭐ this repo if you find it helpful!_
