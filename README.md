# Open Source RabbitHole - Knowledge Explorer

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/)

---

## ⚡️ Fork Changes (2025)

This fork modernizes the project for easier local development and deployment:

- **Frontend migrated to Vite** (from Create React App)
- **Yarn** is now the default package manager (instead of npm)
- **Backend pinned to Express 4.x** for compatibility
- **Environment variables** for the frontend must use the `VITE_` prefix and be placed in `frontend/.env`
- **Unified startup script:** Use `start-rabbitholes.bat` to launch both backend and frontend
- **TypeScript and ESLint** configuration updated for Vite compatibility

---

## Requirements

- **Node.js 18.x or higher** (install from [nodejs.org](https://nodejs.org/) or use [NVM for Windows](https://github.com/coreybutler/nvm-windows) for version management; NVM is optional)
- **Yarn** (classic, v1.x)
- **Windows** (for `.bat` script; adapt for Mac/Linux as needed)
- **(Optional) Docker** for containerized deployment

---

## Quick Start (Local)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/rabbitholes.git
   cd rabbitholes
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Set up environment variables:**

   - **Backend:** Create `backend/.env` with:
     ```
     PORT=3000
     TAVILY_API_KEY=your_tavily_api_key
     GOOGLE_AI_API_KEY=your_google_ai_api_key
     ```

   - **Frontend:** Create `frontend/.env` with:
     ```
     VITE_PUBLIC_POSTHOG_KEY=your_posthog_key
     VITE_PUBLIC_POSTHOG_HOST=https://app.posthog.com
     VITE_API_URL=http://localhost:3000/api
     ```

4. **Start the app:**
   - On Windows, run:
     ```
     start-rabbitholes.bat
     ```
     - The script will use NVM if available, or your system Node.js if not. Make sure Node.js v18+ is installed and on your PATH.
   - Or manually in two terminals:
     ```bash
     # Terminal 1
     cd backend
     yarn install
     yarn start

     # Terminal 2
     cd frontend
     yarn install
     yarn start
     ```

5. **Open your browser:**  
   Visit [http://localhost:5173](http://localhost:5173)

---

## Docker

1. **Build the Docker image:**
   ```bash
   docker build -t rabbitholes .
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up
   ```

---

## Project Structure

```
rabbitholes/
├── frontend/              # Vite + React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/               # Express backend
│   ├── src/
│   └── package.json
├── Dockerfile
├── docker-compose.yml
├── start-rabbitholes.bat  # Windows startup script
└── package.json           # Yarn workspace root
```

---

## Environment Variables

### Backend
- `PORT` - Server port (default: 3000)
- `TAVILY_API_KEY` - Your Tavily API key
- `GOOGLE_AI_API_KEY` - Your Google AI API key

### Frontend (Vite)
- `VITE_PUBLIC_POSTHOG_KEY` - Your PostHog key
- `VITE_PUBLIC_POSTHOG_HOST` - PostHog host (default: https://app.posthog.com)
- `VITE_API_URL` - Backend API URL (e.g., http://localhost:3000/api)

---

## Features

- Interactive mind-map style exploration
- AI-powered content generation and connections
- Beautiful, fluid UI with React Flow
- Real-time topic exploration and visualization
- Seamless backend integration with OpenAI, Tavily, and Google AI

---

## License

MIT

---

## About

Open RabbitHoles is an open source implementation inspired by the original RabbitHoles app, with a unique twist. Dive deep into topics, discover unexpected connections, and visualize your research journey in an interactive mind map.

---
