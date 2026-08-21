# Groq AI Chatbot - React + Netlify Functions

A **serverless** AI chatbot using React, Netlify Functions, and the Groq API with `llama-3.3-70b-versatile`. No backend server needed!

## ✨ Features

- **Serverless Architecture** - Netlify Functions + React
- **No Backend Required** - Everything runs on Netlify's edge
- **Chat History** - Saved in browser localStorage
- **Memory System** - Conversation context persistence
- **Custom Instructions** - Set system-wide AI instructions
- **Model Settings** - Configure temperature, max tokens, top-p
- **Responsive Design** - Works on desktop and mobile
- **Markdown Support** - Beautiful formatted responses

## 🚀 Quick Deploy

### Deploy to Netlify (Easiest)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/neuracodeai-gen/mistral-ai-chatbot&base=netlify-version)

1. Click the button above
2. Authenticate with GitHub
3. Add your **Groq API Key** as an environment variable:
   - Key: `GROQ_API_KEY`
   - Value: `your_actual_groq_api_key`
4. Click "Deploy site"
5. Done! Your chatbot will be live in minutes

### Or Deploy Manually

```bash
# Clone the repo
git clone https://github.com/neuracodeai-gen/mistral-ai-chatbot.git
cd mistral-ai-chatbot/netlify-version

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Netlify
# 1. Drag and drop the 'dist' folder to Netlify
# 2. Or use Netlify CLI: nt init
# 3. Add GROQ_API_KEY environment variable
```

## 🏃 Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Groq API key from [console.groq.com](https://console.groq.com/keys)

### Setup

```bash
cd netlify-version

# Create .env file
echo "GROQ_API_KEY=your_api_key_here" > .env

# Install dependencies
npm install
```

### Run Development Server

```bash
# Start Vite dev server
npm run dev

# Or use Netlify CLI for full local testing
npm install -g netlify-cli
nt dev
```

- **Vite only**: http://localhost:3000 (functions won't work locally)
- **Netlify CLI**: http://localhost:8888 (full local testing)

## 📁 Project Structure

```
netlify-version/
├── public/               # Static assets
│   └── favicon.svg
├── functions/            # Netlify Functions
│   ├── package.json      # Function dependencies
│   └── chat.js           # Groq API integration
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Tailwind CSS
├── index.html           # HTML template
├── package.json          # Dependencies
├── netlify.toml         # Netlify configuration
├── tailwind.config.js   # Tailwind config
├── vite.config.js       # Vite config
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GROQ_API_KEY` | Your Groq API key | ✅ Yes | - |
| `MODEL_ID` | Default AI model | ❌ No | `llama-3.3-70b-versatile` |

### Available Models

- `llama-3.3-70b-versatile` (default)
- `llama-3.2-90b-vision`
- `llama-3.2-11b-vision`
- `llama-3.2-3b`
- `llama-3.2-1b`
- `mixtral-8x7b-32768`

Change the model in Settings after deployment!

## 🎯 Features

### Chat
- Real-time messaging with Groq AI
- Markdown rendering for code, lists, etc.
- Conversation history saved in browser
- Multiple chat sessions
- Delete chats

### Settings
- Change AI model
- Adjust temperature (0-2)
- Set max tokens (256-8192)
- Configure top-p sampling
- Add custom system instructions

### UI/UX
- Responsive design (mobile + desktop)
- Smooth animations
- Loading states
- Error handling
- Copy messages to clipboard

## 💡 Usage

### Start a New Chat
1. Click "New Chat" button
2. Type your message
3. Press Enter or click Send

### Customize Settings
1. Click Settings icon
2. Adjust model, temperature, etc.
3. Add custom instructions
4. Save

### Manage Chats
- View chat history in sidebar
- Click any chat to continue
- Delete chats with trash icon

## 🔒 Security

- API key is **never exposed** to the client
- All requests go through Netlify Functions
- Chat history is stored **only in your browser**
- No database required

## 🚀 Performance

- Serverless architecture scales automatically
- Fast cold starts with Netlify Functions
- Optimized React bundle
- Efficient state management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a Pull Request

## 📄 License

MIT - Feel free to use this for any purpose!

---

**Built with ❤️ using React, Netlify Functions, and Groq API**
