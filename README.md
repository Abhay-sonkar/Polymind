# PolyMind

A full-stack AI chat app built with the MERN stack, using [OpenRouter](https://openrouter.ai) to access multiple LLMs from one interface. Built as a personal project to go past tutorial-level CRUD work — auth, persistence, rate limiting, retrieval-augmented generation, and working with LLM APIs directly.

## Live Demo

- Frontend: [polymind-red.vercel.app](https://polymind-red.vercel.app)
- Backend: hosted on Render's free tier — first request after a period of inactivity can take 20–30s to wake up. Not a bug, just the free tier.
- **Document upload / RAG is implemented but not deployed yet** — the microservice that powers it (`Backend/ai_services`) currently only runs locally. See [Tech Stack](#tech-stack) below. If you clone and run everything locally, it works end to end.

## Features

- Switch between OpenRouter models (Gemma, DeepSeek, Llama, etc.) by changing one config value
- Persistent chat threads in MongoDB, grouped by Today / Yesterday / Previous 7 Days in the sidebar
- JWT auth with bcrypt password hashing for signup/login
- **Retrieval-augmented chat**: upload a PDF, DOCX, TXT, or MD file, and ask questions about it — the app chunks and embeds the document, retrieves the most relevant passages for each question, and cites the source chunks in its answer
- Markdown rendering with syntax-highlighted code blocks (`react-markdown` + `rehype-highlight`)
- Animated typing indicator while waiting on a model response
- Create, switch, and delete threads
- Auto-generated thread titles — the model summarizes your first message instead of just truncating it
- Dark UI with Outfit font, Lucide icons, indigo accents

## Tech Stack

- **Frontend:** React, deployed on Vercel
- **Backend:** Node.js / Express, deployed on Render
- **RAG microservice:** Python / FastAPI (`Backend/ai_services`) — chunks documents, embeds them locally with `sentence-transformers` (no API cost), stores vectors in ChromaDB, and serves retrieval queries. Not yet deployed — runs locally for now.
- **Database:** MongoDB Atlas
- **Auth:** JWT + bcrypt
- **AI:** OpenRouter API (model-agnostic — swap models via config, no code changes)

## Known Limitations

- Backend free-tier hosting means cold starts after idle periods
- The RAG microservice isn't deployed to production yet — document upload/retrieval only works when running locally with all three services up
- Built and maintained solo — expect rough edges, not production polish
- Free-tier OpenRouter models can be slower or less consistent under load than paid models

## Setup

Requires Node.js, and Python 3.10+ if you want document upload/RAG working locally.

```bash
git clone https://github.com/Abhay-sonkar/Polymind.git
cd Polymind

# backend
cd Backend
npm install
cp .env.example .env
# fill in MONGODB_URI, JWT_SECRET, OPENROUTER_API_KEY
npm run dev

# frontend (in a new terminal)
cd ../Frontend
npm install
cp .env.example .env
npm run dev

# RAG microservice — optional, only needed for document upload (in a new terminal)
cd ../Backend/ai_services
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

With all three running, the app is fully functional at `http://localhost:5173`. Without the RAG microservice, chat still works normally — document upload will just fail gracefully.

## Roadmap

- [ ] Deploy the RAG microservice (Render/Fly.io — needs enough RAM to hold the embedding model in memory)
- [ ] Token-by-token streaming responses
- [ ] Add a screenshot/demo GIF here
