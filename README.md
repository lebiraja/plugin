# Local LLM Chat Interface 🤖✨

A modern, feature-rich chat interface for interacting with local LLM backends like Ollama and LM Studio. Built with React, TypeScript, and FastAPI, featuring conversation memory, RAG (Retrieval-Augmented Generation), web search, and a beautiful animated UI.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18.3+-61dafb.svg)

## ✨ What This App Does

This is an intelligent chat application that lets you interact with powerful local AI models (like Llama, Gemma, Qwen) running on your own machine. Think ChatGPT, but **completely private, customizable, and running locally**.

### Key Capabilities:
- 💬 **Conversational AI** - Chat naturally with AI models that remember your conversation history
- 📚 **Knowledge Base (RAG)** - Upload documents (PDF, DOCX, TXT, images) and ask questions about them
- 🌐 **Web Search** - Get real-time information from the internet with citations
- 🎨 **Beautiful UI** - Smooth animations, gradient effects, and modern design
- 🔧 **Full Control** - Choose your AI model, toggle tools on/off, manage files
- 🔒 **100% Private** - Everything runs locally on your machine

## 🚀 Features

### 🤖 Multi-Backend LLM Support
- **Ollama** - Run models like Llama, Gemma, Qwen, DeepSeek locally
- **LM Studio** - Desktop LLM interface with OpenAI-compatible API
- **Dynamic Model Selection** - Interactive dropdowns to switch backends and models
- **Auto-Discovery** - Automatically detects available models from your LLM backend

### 🧠 Conversation Memory
- **ChatGPT-like Memory** - Remembers the last 10 messages for context
- **Personalized Responses** - AI maintains conversation context
- **Smart History Building** - Automatically formats conversation for the AI

### 🛠️ Powerful Tools (Toggle On/Off)
- 🔍 **Web Search** - Powered by Serper.dev (Google search API)
- 📚 **RAG (Document Q&A)** - Ask questions about uploaded documents
- 🧪 **Deep Research** - Multi-step iterative reasoning
- 📊 **Real-time Stats** - Token counting and latency tracking

### 📁 Knowledge Base Management
- **File Upload** - PDF, DOCX, TXT, CSV, JPG, PNG with OCR
- **Interactive File Manager** - View, delete files with confirmation
- **Vector Embeddings** - Uses nomic-ai/nomic-embed-text-v1.5
- **Automatic Processing** - Files are chunked and embedded automatically

### 🎨 Modern UI/UX
- ✨ **Spring Animations** - Smooth Framer Motion physics
- 🌈 **Gradient Backgrounds** - Dynamic color schemes for messages
- 💎 **Glassmorphism Effects** - Frosted glass aesthetics
- 🎭 **Loading Indicators** - Shows KB search, web search, and generation status
- 📱 **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites

Before you begin, make sure you have:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Python 3.11+** - [Download here](https://www.python.org/downloads/)
3. **Ollama** (recommended) - [Download here](https://ollama.ai/)
   - Or **LM Studio** - [Download here](https://lmstudio.ai/)
4. **Git** - [Download here](https://git-scm.com/)

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

# Edit .env and add your Serper API key (for web search)
# Get free API key at: https://serper.dev/api-keys
```

Your `backend/.env` should look like:
```env
# Backend Configuration
OLLAMA_URL=http://127.0.0.1:11434
LMSTUDIO_URL=http://localhost:1234

# Web Search API (100 free searches/month)
SERPER_API_KEY=your_serper_api_key_here

# Vector Database
VECTOR_DB_PATH=./vector_db

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGINS=http://localhost:3000

# Server
HOST=0.0.0.0
PORT=8000
```

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

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Start backend server with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
# From project root
npm run dev
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

1. **Start Ollama** - Make sure Ollama is running with at least one model
2. **Open the app** - Navigate to `http://localhost:5173`
3. **Select Backend** - Click "Ollama" in the left sidebar
4. **Choose Model** - Select a model from the dropdown (auto-populates)
5. **Start Chatting!** - Type a message and press Enter

### 2. Using Conversation Memory

The app automatically remembers your last 10 messages:

```
You: My name is Alex and I love Python programming.
AI: Nice to meet you, Alex! Python is a great language...

You: What's my name?
AI: Your name is Alex!

You: What language did I mention?
AI: You mentioned that you love Python programming!
```

### 3. Toggle Tools On/Off

In the left sidebar, click the tool buttons to enable/disable:
- **RAG** - For uploaded document Q&A
- **Web Search** - For current information
- **Deep Research** - For complex multi-step reasoning

### 4. Upload and Query Documents

1. **Upload Files** - Click the 📎 paperclip icon or drag & drop
2. **Enable RAG** - Click the RAG button in the left sidebar (turns blue)
3. **Ask Questions** - "What are the main points in the document?"
4. **Manage Files** - Go to right sidebar → Files tab → hover and delete

### 5. Web Search

1. **Get Serper API Key** - Free 100 searches/month at [serper.dev](https://serper.dev/api-keys)
2. **Add to .env** - Put key in `backend/.env` as `SERPER_API_KEY`
3. **Enable Tool** - Click "Web Search" button in left sidebar
4. **Ask Current Events** - "What's the latest news about AI?"

### 6. View Statistics

Right sidebar shows:
- 📊 **Message count** - Total messages in session
- 📝 **Token usage** - Estimated tokens used
- 📁 **Files uploaded** - Knowledge base size
- 🔗 **Context sources** - Citations from RAG/web search

## 🏗️ Architecture

### Frontend Stack
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.5** - Type-safe JavaScript
- **Vite 5.4** - Lightning-fast build tool
- **Framer Motion 11.5** - Smooth spring animations
- **Zustand 4.5** - Lightweight state management
- **Axios** - HTTP client for API calls
- **React Markdown** - Beautiful markdown rendering with syntax highlighting

### Backend Stack
- **FastAPI 0.115** - High-performance async Python API
- **ChromaDB 0.5.15** - Vector database for embeddings
- **sentence-transformers 3.0** - nomic-ai/nomic-embed-text-v1.5 (547MB)
- **httpx 0.27** - Async HTTP client
- **python-docx, PyPDF2** - Document processing
- **pytesseract** - OCR for image text extraction
- **duckduckgo-search** - Fallback web search
- **Serper.dev** - Primary web search (Google results)

### LLM Integrations
- **Ollama API** - Local model serving (127.0.0.1:11434)
- **LM Studio** - OpenAI-compatible API (localhost:1234)
- **Custom backends** - Bring your own API

## 📁 Project Structure

```
plugin/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── ChatInterface.tsx    # Main chat with history & loading status
│   │   ├── LeftSidebar.tsx      # Model selector & tool toggles
│   │   ├── RightSidebar.tsx     # Stats & file management
│   │   ├── MessageList.tsx      # Animated message display
│   │   └── FileUpload.tsx       # Drag & drop file upload
│   ├── store/
│   │   ├── chatStore.ts         # Conversation state
│   │   ├── settingsStore.ts     # App configuration
│   │   └── fileStore.ts         # File management
│   ├── api/
│   │   ├── chat.ts              # Chat API with history
│   │   ├── models.ts            # Model fetching
│   │   └── files.ts             # File upload/delete
│   └── index.css                # Global styles & animations
├── backend/
│   ├── routers/
│   │   ├── chat.py              # Chat endpoint with conversation history
│   │   ├── models.py            # Model listing (Ollama/LM Studio)
│   │   ├── files.py             # File upload/delete/list
│   │   └── tools.py             # RAG & web search endpoints
│   ├── services/
│   │   ├── llm_service.py       # LLM backend abstraction with memory
│   │   ├── search_service.py    # Serper.dev + DuckDuckGo fallback
│   │   ├── rag_service.py       # Vector search & retrieval
│   │   └── document_processor.py # File parsing & embedding
│   ├── main.py                   # FastAPI app with CORS
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
# LLM Backend URLs
OLLAMA_URL=http://127.0.0.1:11434
LMSTUDIO_URL=http://localhost:1234

# Web Search API (Required for web search tool)
# Get free key at: https://serper.dev/api-keys
SERPER_API_KEY=your_serper_api_key_here

# Vector Database
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

All settings are stored in browser `localStorage`:
- Selected backend and model
- Tool toggles (RAG, web search, deep research)
- Conversation history
- File list

To reset: Clear browser data or use DevTools → Application → Local Storage

## 🔧 Advanced Usage

### Custom Model Parameters

Models use these default parameters (can be modified in code):
```typescript
{
  temperature: 0.7,    // Creativity (0.0 = focused, 1.0 = creative)
  top_p: 0.9,          // Nucleus sampling
  max_tokens: 2048,    // Maximum response length
}
```

### Adding More Backends

Edit `src/store/settingsStore.ts`:

```typescript
backends: [
  {
    id: 'ollama',
    name: 'Ollama',
    url: 'http://127.0.0.1:11434',
    type: 'ollama',
    isActive: true,
  },
  {
    id: 'custom',
    name: 'My Custom Backend',
    url: 'https://my-api.example.com',
    type: 'openai',  // Use OpenAI-compatible format
    apiKey: 'optional-key',
    isActive: true,
  },
]
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
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1),    /* Adjust colors */
    rgba(147, 51, 234, 0.1)
  );
}
```

## 🐛 Troubleshooting

### Backend won't start

**Problem:** `ModuleNotFoundError` or import errors

**Solution:**
```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

### No models showing up

**Problem:** Model dropdown is empty

**Solution:**
1. Make sure Ollama is running: `ollama serve`
2. Pull at least one model: `ollama pull gemma2:2b`
3. Check Ollama URL in `.env`: `OLLAMA_URL=http://127.0.0.1:11434`
4. Refresh the browser (Ctrl+F5)

### Web search not working

**Problem:** "Web Search Unavailable" message

**Solution:**
1. Get free API key from [serper.dev](https://serper.dev/api-keys)
2. Add to `backend/.env`: `SERPER_API_KEY=your_key_here`
3. Restart backend server
4. Enable "Web Search" toggle in left sidebar

### File upload fails

**Problem:** Files don't upload or process

**Solution:**
1. Check file size (default max: 10MB)
2. Ensure `backend/uploads/` directory exists
3. Check backend logs for errors
4. Supported formats: PDF, DOCX, TXT, CSV, JPG, PNG

### Conversation memory not working

**Problem:** AI doesn't remember previous messages

**Solution:**
- This is built-in now! Uses last 10 messages automatically
- Make sure you're on the latest version
- Check browser console for errors

### Frontend shows old version

**Problem:** Changes don't appear after updates

**Solution:**
```bash
# Hard refresh
Ctrl + F5  (Windows)
Cmd + Shift + R  (Mac)

# Or clear cache
# Browser DevTools → Application → Clear storage
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
2. **Limit conversation history** - Currently set to 10 messages
3. **Chunk large documents** - Files are auto-chunked to 500 tokens
4. **Use RAG only when needed** - Toggle off when not querying docs
5. **Web search is rate-limited** - Serper.dev offers 100 free searches/month

## 🔒 Privacy & Security

- ✅ **100% Local Processing** - All AI inference happens on your machine
- ✅ **No Data Sent to Cloud** - Except web search queries (via Serper.dev)
- ✅ **API Keys Protected** - `.env` file not committed to Git
- ✅ **CORS Configured** - Only allows localhost origins
- ⚠️ **Development Mode** - Not hardened for public deployment

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
- [ ] Conversation export/import
- [ ] Advanced RAG with re-ranking
- [ ] Multiple conversation threads
- [ ] Plugin system for extensions
- [ ] Mobile app (React Native)

## 📝 Changelog

### Version 1.0.0 (Current)
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

*Star ⭐ this repo if you find it helpful!*
