# Local LLM Chat Interface

A modern, Apple-inspired liquid-glass UI for interacting with multiple local and custom LLM backends. Features include Search, RAG, Deep Research, and File Upload with full user customization and real-time statistics.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### Multi-Backend Support
- **Ollama** - Local LLM serving
- **LM Studio** - Desktop LLM interface
- **HuggingFace** - Cloud or local endpoints
- **Custom APIs** - Bring your own backend

### Powerful Tools
- 🔍 **Web Search** - Live web search with citations
- 📚 **RAG (Retrieval-Augmented Generation)** - Query uploaded documents
- 🧠 **Deep Research** - Multi-step iterative reasoning
- 📁 **File Upload** - Support for PDF, DOCX, TXT, CSV, images with OCR

### Beautiful UI
- 🎨 Apple-inspired liquid-glass design
- 🌙 Dark theme with frosted surfaces
- ✨ Smooth animations with Framer Motion
- 📱 Responsive and adaptive layout

### Real-Time Statistics
- Token counting (prompt, completion, total)
- Latency tracking
- Cost estimation
- Session analytics

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Ollama** or **LM Studio** installed (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd plugin
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # On Windows
# or
source venv/bin/activate  # On macOS/Linux

pip install -r requirements.txt
```

4. **Set up environment variables** (optional)
```bash
# Create .env file in backend directory
cp .env.example .env
```

### Running the Application

1. **Start the backend server**
```bash
cd backend
.\venv\Scripts\activate  # On Windows
python main.py
```

The backend will start at `http://localhost:8000`

2. **Start the frontend development server**
```bash
# In the project root
npm run dev
```

The frontend will start at `http://localhost:3000`

3. **Configure your LLM backend**
   - Install Ollama from [ollama.ai](https://ollama.ai) or LM Studio
   - Pull a model (e.g., `ollama pull llama2`)
   - The app will automatically detect available models

## 📖 Usage

### Basic Chat
1. Open the app at `http://localhost:3000`
2. Select a backend and model from the left sidebar
3. Start chatting!

### Upload Documents (RAG)
1. Click the paperclip icon or drag files into the chat
2. Supported formats: PDF, DOCX, TXT, CSV, JPG, PNG
3. Files are automatically processed and embedded
4. Ask questions about your documents

### Web Search
1. Enable "Web Search" in settings
2. Ask questions that require current information
3. The AI will search the web and cite sources

### Model Settings
1. Click the settings icon (⚙️)
2. Adjust temperature, top-p, max tokens
3. Enable/disable tools
4. Manage backends

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management

### Backend
- **FastAPI** for high-performance API
- **ChromaDB** for vector storage
- **Sentence Transformers** for embeddings
- **PyPDF, python-docx** for document processing
- **Tesseract OCR** for image text extraction

### LLM Integrations
- Ollama API
- LM Studio OpenAI-compatible API
- OpenAI API (optional)
- Custom endpoints

## 📁 Project Structure

```
plugin/
├── src/                      # Frontend source
│   ├── components/           # React components
│   ├── store/                # Zustand stores
│   ├── api/                  # API client
│   ├── types/                # TypeScript types
│   └── lib/                  # Utilities
├── backend/                  # Backend source
│   ├── routers/              # FastAPI routers
│   ├── services/             # Business logic
│   ├── main.py               # Entry point
│   └── requirements.txt      # Python dependencies
├── public/                   # Static assets
└── package.json              # Node dependencies
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```env
# LLM Backends
OLLAMA_URL=http://localhost:11434
LMSTUDIO_URL=http://localhost:1234

# Optional: OpenAI
OPENAI_API_KEY=your-key-here

# Vector Database
VECTOR_DB_PATH=./vector_db

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

### Frontend Configuration

Settings are stored in browser localStorage:
- Backend configurations
- Model preferences
- Tool toggles
- Conversation history

## 🔧 Advanced Features

### Custom LLM Backend

Add a custom backend in `src/store/settingsStore.ts`:

```typescript
{
  id: 'custom-backend',
  name: 'My Custom Backend',
  type: 'custom',
  url: 'https://my-api.com',
  apiKey: 'optional-key',
  models: ['model-1', 'model-2'],
  isActive: true
}
```

### Deep Research Mode

Enable multi-step reasoning:
1. Go to Settings → Tools
2. Enable "Deep Research"
3. Ask complex questions that require multi-step analysis

## 🛠️ Development

### Run Tests
```bash
npm run test
```

### Build for Production
```bash
npm run build
```

### Lint Code
```bash
npm run lint
```

## 📝 API Documentation

Backend API documentation is available at:
```
http://localhost:8000/docs
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by Apple's design language
- Built with modern web technologies
- Powered by open-source LLMs

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ for the local LLM community
