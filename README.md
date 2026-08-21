# AI Chatbot - Groq Powered

A polished, production-ready AI chatbot with memory, chat history system, and custom instructions using the Groq API with the `llama-3.3-70b-versatile` model.

## Features

- **Real-time Chat Interface**: Modern, responsive UI with Markdown support
- **Chat History**: Full conversation history with search and organization
- **Memory System**: Conversation context and user preferences persistence
- **Custom Instructions**: Set system-wide instructions for the AI
- **Model Configuration**: Adjust temperature, max tokens, top-p, and more
- **Multi-user Support**: Each user has their own chat history and settings
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: ORM for database operations
- **Groq API**: AI model inference
- **SQLite**: Default database (can be swapped for PostgreSQL/MySQL)

### Frontend
- **React 18**: Modern UI library
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and caching
- **React Markdown**: Render AI responses with proper formatting

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/neuracodeai-gen/mistral-ai-chatbot.git
   cd mistral-ai-chatbot
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your Groq API key
   nano .env
   ```

3. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Run the application**:
   
   **Option A: Development mode (separate servers)**
   ```bash
   # Terminal 1: Backend
   python -m uvicorn backend.main:app --reload
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```
   
   **Option B: Production mode (single server)**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   cd ..
   
   # Run backend (serves frontend static files)
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```

6. **Open your browser**:
   - Development: http://localhost:3000
   - Production: http://localhost:8000

## Docker Deployment

### Using Docker Compose

1. Create `.env` file with your Groq API key
2. Run:
   ```bash
   docker-compose up --build
   ```

3. Open http://localhost:8000

### Using Docker directly

```bash
# Build the image
docker build -t ai-chatbot .

# Run the container
docker run -p 8000:8000 -e GROQ_API_KEY=your_key ai-chatbot
```

## API Endpoints

### Chats
- `GET /api/v1/chats/` - List all chats
- `POST /api/v1/chats/` - Create a new chat
- `GET /api/v1/chats/{chat_id}` - Get a specific chat
- `PUT /api/v1/chats/{chat_id}` - Update a chat
- `DELETE /api/v1/chats/{chat_id}` - Delete a chat
- `GET /api/v1/chats/{chat_id}/messages` - Get chat messages
- `POST /api/v1/chats/{chat_id}/messages` - Send a message
- `GET /api/v1/chats/{chat_id}/messages/stream` - Stream a message (SSE)

### Settings
- `GET /api/v1/settings/` - Get user settings
- `PUT /api/v1/settings/` - Update user settings
- `GET /api/v1/settings/default` - Get default settings

### Health
- `GET /api/v1/health` - Health check
- `GET /` - API info

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Your Groq API key | Required |
| `MODEL_ID` | Default model to use | `llama-3.3-70b-versatile` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DATABASE_URL` | Database connection URL | `sqlite:///./chatbot.db` |

### Supported Models

The following Groq models are available:
- `llama-3.3-70b-versatile` (default)
- `llama-3.2-90b-vision`
- `llama-3.2-11b-vision`
- `llama-3.2-3b`
- `llama-3.2-1b`
- `mixtral-8x7b-32768`

## Customization

### Adding New Models
Edit `backend/services/groq_service.py` and add the model ID to the available models list.

### Changing Database
Update `DATABASE_URL` in `.env` to use PostgreSQL or MySQL:
```
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost/dbname

# MySQL
DATABASE_URL=mysql+pymysql://user:password@localhost/dbname
```

### Styling
Edit `frontend/src/styles/index.css` to customize the appearance.

## Project Structure

```
.
├── backend/
│   ├── config.py           # Configuration settings
│   ├── main.py             # FastAPI application
│   ├── database/
│   │   ├── database.py     # Database connection
│   │   └── models.py       # SQLAlchemy models
│   ├── models/
│   │   ├── chat.py         # Chat Pydantic models
│   │   └── settings.py     # Settings Pydantic models
│   ├── routes/
│   │   ├── chats.py        # Chat API routes
│   │   └── settings.py     # Settings API routes
│   └── services/
│       ├── groq_service.py    # Groq API integration
│       ├── chat_service.py    # Chat business logic
│       ├── memory_service.py  # Memory/context management
│       └── settings_service.py # Settings management
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS styles
│   │   └── utils/          # Utility functions
│   └── public/            # Static assets
├── requirements.txt        # Python dependencies
├── package.json           # Frontend dependencies
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this code for any purpose.

## Support

- For issues, create a GitHub issue
- For questions, check the documentation or create a discussion

---

**Built with ❤️ using Groq API and Llama models**
