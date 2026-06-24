# PolyMind

A full-stack AI chat app built with the MERN stack, using [OpenRouter](https://openrouter.ai) to access multiple LLMs from one interface. Built as a personal project to go past tutorial-level CRUD work — auth, persistence, rate limiting, and working with LLM APIs directly.

## Live Demo

- Frontend: [polymind-red.vercel.app](https://polymind-red.vercel.app)
- Backend: hosted on Render's free tier — first request after a period of inactivity can take 20–30s to wake up. Not a bug, just the free tier.

## Features

- Switch between OpenRouter models (Gemma, DeepSeek, GPT-OSS, etc.) by changing one config value
- Persistent chat threads in MongoDB, grouped by Today / Yesterday / Previous 7 Days in the sidebar
- JWT auth with bcrypt password hashing for signup/login
- Markdown rendering with syntax-highlighted code blocks (`react-markdown` + `rehype-highlight`)
- Animated typing indicator while waiting on a model response
- Create, switch, and delete threads
- Auto-generated thread titles — the model summarizes your first message instead of just truncating it
- Dark UI with Outfit font, Lucide icons, indigo accents

## Tech Stack

- **Frontend:** React, deployed on Vercel
- **Backend:** Node.js / Express, deployed on Render
- **Database:** MongoDB Atlas
- **Auth:** JWT + bcrypt
- **AI:** OpenRouter API (model-agnostic — swap models via config, no code changes)

## Known Limitations

- Backend free-tier hosting means cold starts after idle periods
- Built and maintained solo — expect rough edges, not production polish
- Free-tier OpenRouter models can be slower or less consistent under load than paid models

## Setup

```bash
git clone https://github.com/<your-username>/polymind.git
cd polymind

# backend
cd server
npm install
# add a .env with MONGO_URI, JWT_SECRET, OPENROUTER_API_KEY
npm run dev

# frontend
cd ../client
npm install
npm run dev
```

## Roadmap

- [ ] Token-by-token streaming responses
- [ ] Add a screenshot/demo GIF here
