# Development Guide

## Prerequisites

- Node.js 18+
- Python 3.9+
- Git
- VS Code (recommended)

## Local Development Setup

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration.

### 3. Start Development Servers

**Option 1: Use the start script (Windows)**
```bash
.\start.ps1
```

**Option 2: Manual start**

Terminal 1 (Backend):
```bash
cd backend
.\venv\Scripts\activate
python main.py
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## Project Structure

```
plugin/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   │   ├── ChatInterface.tsx
│   │   ├── LeftSidebar.tsx
│   │   ├── RightSidebar.tsx
│   │   ├── MessageList.tsx
│   │   └── SettingsModal.tsx
│   ├── store/              # State management
│   │   ├── chatStore.ts
│   │   ├── settingsStore.ts
│   │   └── fileStore.ts
│   ├── api/                # API client
│   │   ├── chat.ts
│   │   └── files.ts
│   ├── types/              # TypeScript types
│   └── lib/                # Utilities
├── backend/                # FastAPI backend
│   ├── routers/            # API routes
│   │   ├── chat.py
│   │   ├── files.py
│   │   ├── models.py
│   │   └── tools.py
│   ├── services/           # Business logic
│   │   ├── llm_service.py
│   │   ├── document_processor.py
│   │   ├── rag_service.py
│   │   └── search_service.py
│   └── main.py             # Entry point
└── public/                 # Static files
```

## Key Technologies

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **TailwindCSS**: Styling
- **Framer Motion**: Animations
- **Zustand**: State management
- **Axios**: HTTP client

### Backend
- **FastAPI**: Web framework
- **Pydantic**: Data validation
- **ChromaDB**: Vector database
- **Sentence Transformers**: Embeddings
- **PyPDF/python-docx**: Document parsing
- **Tesseract**: OCR

## Adding a New Feature

### 1. Frontend Component

Create a new component in `src/components/`:

```typescript
import { motion } from 'framer-motion'

export default function MyComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-panel p-4"
    >
      {/* Your content */}
    </motion.div>
  )
}
```

### 2. Backend Endpoint

Add a new route in `backend/routers/`:

```python
from fastapi import APIRouter

router = APIRouter()

@router.post("/my-endpoint")
async def my_endpoint(data: MyModel):
    # Your logic
    return {"result": "success"}
```

### 3. API Client

Add client method in `src/api/`:

```typescript
export async function myApiCall(data: MyData) {
  const response = await axios.post(`${API_BASE_URL}/my-endpoint`, data)
  return response.data
}
```

## Testing

### Frontend
```bash
npm run test
```

### Backend
```bash
cd backend
pytest
```

## Building for Production

### Frontend
```bash
npm run build
```

Output: `dist/` directory

### Backend
Use a production ASGI server:
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Common Issues

### Port Already in Use
- Frontend: Change port in `vite.config.ts`
- Backend: Change port in `backend/config.py`

### CORS Errors
- Update `cors_origins` in `backend/config.py`

### Module Not Found
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

### Models Not Showing
- Ensure Ollama/LM Studio is running
- Check backend URLs in settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Code Style

- **TypeScript**: Follow ESLint rules
- **Python**: Follow PEP 8 (enforced by Ruff)
- **CSS**: Use TailwindCSS utilities

## Performance Tips

- Use `React.memo` for expensive components
- Implement virtual scrolling for long lists
- Cache API responses when appropriate
- Use streaming for large responses

## Security

- Never commit `.env` files
- Sanitize user inputs
- Use HTTPS in production
- Implement rate limiting

## Resources

- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Ollama Documentation](https://ollama.ai)
