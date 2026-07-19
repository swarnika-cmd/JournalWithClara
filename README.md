<div align="center">

<!-- Hero Banner -->
<img src=".github/assets/hero-banner.png" alt="Journal with Mr Brown" width="100%" />

<br />

# 📖 Journal with Mr Brown

### *Your AI Voice Companion That Remembers Everything*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-8B2252?style=for-the-badge&logoColor=white)](https://mrbrown.yourdomain.com)
[![License](https://img.shields.io/badge/License-MIT-D4838F?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

---

*Some days you need a friend who just listens.*
*Mr Brown is that friend — except he never forgets a word you say.*

</div>

---

## ✨ What is This?

**Journal with Mr Brown** is a voice-first AI journal where you speak your thoughts and receive warm, empathetic responses from **Mr Brown** — an AI companion who remembers your journey, tracks your emotional arc, and helps you reconnect with your own story.

Unlike traditional text journals, you simply **press record and talk**. Mr Brown transcribes your words, responds with genuine warmth, speaks his reply aloud, and stores every memory in a searchable vector database you can query later.

> *"Hey Mr Brown, what was I stressed about last Tuesday?"*
>
> *"Ah, I remember — you were worried about the presentation at work. But you also mentioned it went better than expected by Wednesday. You've come a long way since then."*

This isn't a chatbot. This is **a companion that holds your memories** and gives them back to you when you need them most.

---

## 🏗️ Architecture

<div align="center">
  <img src=".github/assets/architecture.png" alt="Journal with Mr Brown Architecture" width="85%" />
</div>

---


## 🌟 Features

### 🎙️ Voice-First Journaling
Press the record button and speak freely. Your voice is transcribed in real-time using **Deepgram's Nova-2** speech recognition engine. No typing required — just talk like you would to a close friend.

### 🤖 Mr Brown — Your AI Companion
Mr Brown isn't a generic chatbot. He's a carefully crafted persona powered by **Google Gemini 2.5 Flash** — warm, empathetic, and thoughtful. He remembers your last 5 entries for conversational context and responds like someone who genuinely cares about your day.

### 🔊 Voice Responses
Mr Brown doesn't just write back — he **speaks**. Using **ElevenLabs** text-to-speech, his responses are delivered in a natural, soothing voice that makes the experience feel alive and personal.

### 📊 Mood Tracking & Sentiment Analysis
Every journal entry is automatically analyzed for emotional tone using AI-powered sentiment analysis. Your mood is scored on a 1-5 scale with descriptive labels (*Happy*, *Anxious*, *Calm*, *Stressed*) and visualized on a beautiful **mood heatmap calendar**.

### 🔍 Ask Mr Brown (RAG Memory Search)
Ever wonder what you said three weeks ago about a particular topic? Ask Mr Brown. Using **pgvector** cosine similarity search, he retrieves the most relevant past entries and synthesizes a warm, contextual answer — like a friend with perfect memory.

### 📈 Weekly Insights & Keepsakes
At the end of each week, Mr Brown generates a personalized emotional review:
- **Summary** — A warm overview of your week
- **Themes** — Recurring topics and patterns
- **Mood Arc** — How your emotions evolved
- **Highlight** — Your brightest moment
- **Suggestion** — A gentle, non-preachy recommendation for next week

### 📅 Timeline View
Browse all your past entries in a chronological timeline with mood indicators, play back Mr Brown's voice responses, and revisit your memories anytime.

---

## 📸 App Preview

<div align="center">
  <table style="border-collapse: collapse; border: none; background: transparent; width: 100%;">
    <tr>
      <td align="center" style="padding: 10px; border: none; width: 33%;">
        <strong>🎙️ Landing Page</strong><br/><br/>
        <img src=".github/assets/landing.png" width="100%" style="border-radius: 12px; border: 1px solid rgba(212, 131, 143, 0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
      </td>
      <td align="center" style="padding: 10px; border: none; width: 33%;">
        <strong>🔒 Retro Auth Cloud</strong><br/><br/>
        <img src=".github/assets/auth.png" width="100%" style="border-radius: 12px; border: 1px solid rgba(212, 131, 143, 0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
      </td>
      <td align="center" style="padding: 10px; border: none; width: 33%;">
        <strong>🏠 Interactive Dashboard</strong><br/><br/>
        <img src=".github/assets/dashboard.png" width="100%" style="border-radius: 12px; border: 1px solid rgba(212, 131, 143, 0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
      </td>
    </tr>
  </table>
</div>

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TanStack Router, Tailwind CSS | Warm, glassmorphic UI with voice recording |
| **Backend** | Express.js, TypeScript | REST API with modular service architecture |
| **Database** | PostgreSQL + pgvector | Persistent storage with vector similarity search |
| **Cache** | Redis | Session management and response caching |
| **ORM** | Prisma | Type-safe database access |
| **STT** | Deepgram Nova-2 | Real-time speech-to-text transcription |
| **LLM** | Google Gemini 2.5 Flash | AI companion responses, sentiment analysis, insights |
| **TTS** | ElevenLabs | Natural voice synthesis for Mr Brown's replies |
| **Embeddings** | Gemini Embedding API | Vector representations for semantic memory search |
| **DevOps** | Docker Compose | Containerized PostgreSQL + Redis infrastructure |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Docker** & **Docker Compose** (for PostgreSQL + Redis)
- API keys for: **Deepgram**, **ElevenLabs**, **Google Gemini** (and/or OpenAI)

### 1. Clone the Repository

```bash
git clone https://github.com/swarnika-cmd/JournalWithClara.git
cd JournalWithClara
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Server
PORT=8001
HOST=127.0.0.1

# API Keys
DEEPGRAM_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5436/clara_voice_journal"

# Auth
JWT_ACCESS_SECRET="your_random_secret"
JWT_REFRESH_SECRET="your_random_secret"
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

This spins up:
- 🐘 **PostgreSQL 15** with pgvector extension on port `5436`
- 🔴 **Redis 7** on port `6379`

### 4. Set Up the Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The backend server starts at `http://localhost:8001`.

### 5. Set Up the Frontend

```bash
cd clara-keeps-secrets
npm install
npm run dev
```

The frontend launches at `http://localhost:5173`.

### 6. Open & Enjoy

Navigate to `http://localhost:5173`, create an account, and start speaking. 🎙️

---

## 📁 Project Structure

```
Clara_VoiceAgent/
├── backend/                    # Express.js API server
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (User, Entry, Insight)
│   └── src/
│       ├── server.ts           # Entry point
│       ├── routes/             # API route handlers
│       ├── services/
│       │   ├── llm.service.ts          # Mr Brown's personality & responses
│       │   ├── stt.service.ts          # Deepgram speech-to-text
│       │   ├── tts.service.ts          # ElevenLabs text-to-speech
│       │   ├── sentiment.service.ts    # AI mood analysis
│       │   ├── embedding.service.ts    # Vector embedding generation
│       │   ├── rag.service.ts          # Semantic memory search
│       │   └── insight.service.ts      # Weekly emotional insights
│       ├── middleware/         # Auth middleware (JWT)
│       └── lib/                # Prisma client & Redis
│
├── clara-keeps-secrets/        # React frontend (TanStack Start)
│   └── src/
│       ├── routes/             # Page routes
│       ├── components/
│       │   ├── mrbrown/        # Mr Brown UI components
│       │   │   ├── Landing.tsx         # Landing page
│       │   │   ├── AuthCloud.tsx       # Auth form
│       │   │   ├── RecordView.tsx      # Voice recording interface
│       │   │   ├── TimelineView.tsx    # Entry timeline
│       │   │   ├── AskView.tsx         # RAG query interface
│       │   │   ├── InsightsView.tsx    # Weekly insights display
│       │   │   ├── MoodCalendar.tsx    # Mood heatmap
│       │   │   └── FloatingHearts.tsx  # Ambient animations
│       │   └── ui/             # Reusable UI components (shadcn)
│       ├── hooks/              # Auth & state hooks
│       └── lib/                # API client utilities
│
├── docker-compose.yml          # PostgreSQL + Redis containers
├── .env.example                # Environment template
└── README.md                   # You are here ✨
```

---

## 🎨 Design Philosophy

The UI is intentionally **warm, nostalgic, and intimate** — designed to feel like opening a well-loved journal rather than using a tech product.

- **Cream & dusty rose palette** — Soft, comforting colors that reduce screen anxiety
- **Glassmorphism cards** — Frosted glass overlays with subtle blur effects
- **Floating heart animations** — Ambient particles that make the space feel alive
- **Lace-strip borders** — Decorative elements inspired by vintage stationery
- **Script typography** — Mr Brown's name rendered in elegant cursive to feel personal

Every design decision serves the same goal: *make the user feel safe enough to be honest.*

---

## 🔮 Roadmap

- [ ] 🌙 **Dark mode** — A midnight variant for late-night journaling
- [ ] 📱 **PWA support** — Install as a native app on mobile
- [ ] 🎵 **Ambient sounds** — Optional background music while recording
- [ ] 🔗 **Export & share** — Download entries as PDF keepsakes
- [ ] 🌐 **Multi-language** — Mr Brown speaks your language
- [ ] 👥 **Shared journals** — Couples & family memory spaces
- [ ] 🧩 **Plugin system** — Custom integrations (Spotify mood, weather context)

---

## 🤝 Contributing

Contributions are welcome! Whether it's fixing a bug, improving documentation, or proposing a new feature — open an issue or submit a PR.

```bash
# Fork the repo, create your branch
git checkout -b feature/amazing-feature

# Make your changes, then
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 💌

*Built with late nights, warm tea, and the belief that*
*everyone deserves a friend who never forgets.*

**Made with ❤️ by [Swarnika](https://github.com/swarnika-cmd)**

<br />

<sub>Mr Brown is listening. Always.</sub>

</div>
