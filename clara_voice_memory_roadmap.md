# 🎙️ Clara → Voice Memory: Complete Build Roadmap

> **What you're building**: A voice-first AI companion that lets users talk daily, remembers everything, answers questions about their past, and visualizes emotional patterns over time.

> **What you already have**: Deepgram STT + ElevenLabs TTS in a FastAPI backend, plain HTML frontend. The voice pipeline works.

---

## Your Current Repo Structure

```
Clara_VoiceAgent/
├── backend/
│   ├── main.py              ← FastAPI, 3 endpoints (/transcribe, /speak, /)
│   ├── stt_service.py       ← Deepgram Nova-2 STT (async, working)
│   ├── tts_service.py       ← ElevenLabs TTS (working)
│   └── requirements.txt     ← empty (needs to be filled)
├── frontend/
│   ├── index.html           ← 229-line monolith (record + TTS + UI all inline)
│   ├── style.css            ← 6.4KB vanilla CSS
│   └── app.js               ← empty
├── knowledge_base/
│   └── sample_notes.pdf     ← unused
├── .env / .env.example       ← DEEPGRAM_API_KEY, ELEVENLABS_API_KEY
```

---

## Target Architecture (What You'll End Up With)

```
Clara_VoiceMemory/
├── frontend/                     ← Next.js 14 (App Router) + Tailwind
│   ├── app/
│   │   ├── layout.tsx            ← root layout, fonts, metadata
│   │   ├── page.tsx              ← landing/marketing page
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx          ← main dashboard (mood calendar + recent entries)
│   │   │   ├── record/page.tsx   ← voice recording + Clara conversation
│   │   │   ├── timeline/page.tsx ← all entries, scrollable
│   │   │   ├── ask/page.tsx      ← "Ask Your Past" RAG search
│   │   │   └── insights/page.tsx ← weekly AI-generated summary
│   │   └── api/                  ← Next.js API routes (proxy to backend)
│   ├── components/
│   ├── lib/
│   └── tailwind.config.ts
│
├── backend/                      ← Express.js API server
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── entries.routes.ts
│   │   │   ├── voice.routes.ts
│   │   │   └── insights.routes.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── stt.service.ts       ← Deepgram (port from Python)
│   │   │   ├── tts.service.ts       ← ElevenLabs (port from Python)
│   │   │   ├── llm.service.ts       ← OpenAI/Gemini for Clara's brain
│   │   │   ├── sentiment.service.ts ← mood scoring
│   │   │   ├── embedding.service.ts ← vector embeddings
│   │   │   └── rag.service.ts       ← retrieve + generate
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── db/
│   │   │   ├── prisma/schema.prisma
│   │   │   └── redis.ts
│   │   └── utils/
│   └── package.json
│
└── .github/workflows/deploy.yml  ← CI/CD
```

---

## The Roadmap: 9 Features, Built in Order

Each feature is a self-contained unit. Finish one before starting the next. Each one makes the project demo-able at that stage.

---

## Feature 1: Project Scaffolding + Landing Page

**Goal**: Kill the vanilla HTML frontend. Replace with Next.js + Tailwind. Create a stunning landing page that could be a real SaaS.

**Why first**: Everything else builds on top of this. Also, the JD says "build landing pages" — this alone shows you can do that job.

### What to do:

1. **Create a new Next.js 14 project** in `frontend/` using App Router
   - Use `create-next-app` with TypeScript, Tailwind, ESLint, App Router enabled
   - Remove default boilerplate pages

2. **Set up the design system**
   - Pick a color palette (dark mode, similar to your current slate/emerald theme)
   - Configure Tailwind with custom colors, fonts (use Google Fonts — Inter or Outfit)
   - Create a `globals.css` with CSS variables for your palette

3. **Build the landing page** (`app/page.tsx`)
   - Hero section: bold headline, subtitle, CTA button ("Start Talking to Clara")
   - Features grid: 4 cards (Voice Journaling, Memory Search, Mood Tracking, Weekly Insights)
   - Social proof section (can be mock testimonials for now)
   - Footer with links
   - Make it responsive, add micro-animations (fade-in on scroll, hover effects)

4. **Create a shared layout** (`app/layout.tsx`)
   - Set up proper metadata (title, description, OG tags)
   - Add font loading
   - Add a navbar component

### What this proves to recruiters:
- You can build production-quality landing pages in Next.js + Tailwind
- You understand SEO (meta tags, semantic HTML)
- You have design sense

### Deliverable: A deployed landing page on Vercel that looks like a real product.

---

## Feature 2: Auth System (Sign Up, Login, Sessions)

**Goal**: Users can create accounts and log in. Protected routes redirect to login. Sessions persist across refreshes.

**Why second**: Every subsequent feature needs a user identity. No diary without knowing who's writing.

### What to do:

1. **Set up the Express.js backend** in `backend/`
   - Initialize a new Node.js project with TypeScript
   - Install Express, cors, dotenv, bcrypt, jsonwebtoken
   - Create a basic `server.ts` with health check endpoint
   - Set up a clean folder structure (routes, controllers, services, middleware)

2. **Set up PostgreSQL + Prisma**
   - Install Prisma, initialize with `npx prisma init`
   - Define User model in `schema.prisma`:
     ```
     User: id, email, name, passwordHash, createdAt, updatedAt
     ```
   - Run migration to create the table

3. **Build auth endpoints**
   - `POST /api/auth/register` — hash password with bcrypt, create user, return JWT
   - `POST /api/auth/login` — verify password, return JWT + refresh token
   - `POST /api/auth/refresh` — rotate refresh token
   - `GET /api/auth/me` — return current user from JWT
   - Create an auth middleware that verifies JWT on protected routes

4. **Build frontend auth pages**
   - `app/login/page.tsx` — email + password form, call login API, store token
   - `app/register/page.tsx` — name + email + password, call register API
   - Use React Context or Zustand for auth state management
   - Create a middleware or layout wrapper that redirects unauthenticated users to `/login`
   - Store JWT in httpOnly cookies (not localStorage — more secure, shows you know best practices)

5. **Create the authenticated dashboard layout**
   - `app/dashboard/layout.tsx` — sidebar nav + top bar with user avatar
   - Sidebar links: Record, Timeline, Ask Clara, Insights, Settings
   - `app/dashboard/page.tsx` — placeholder "Welcome back, {name}" for now

### What this proves to recruiters:
- You've built auth end-to-end (JWT, refresh tokens, bcrypt — not just Firebase)
- You understand protected routes and middleware
- You know Prisma + PostgreSQL

### Deliverable: Working signup → login → dashboard flow with persistent sessions.

---

## Feature 3: Voice Recording + Transcription (Port Your Existing Work)

**Goal**: User clicks a mic button on the dashboard, records voice, audio gets transcribed via Deepgram, transcript is saved to the database.

**Why third**: This is the core product loop. And you've already built the hardest part (STT pipeline).

### What to do:

1. **Port the Deepgram STT to Node.js**
   - Install `@deepgram/sdk` (official Node SDK)
   - Create `services/stt.service.ts` — replicates what your `stt_service.py` does
   - Accept audio buffer → call Deepgram Nova-2 → return transcript string

2. **Create the Entry database model**
   - Add to Prisma schema:
     ```
     Entry: id, userId, transcript, audioUrl (nullable), duration, 
            moodScore (nullable, for later), createdAt
     ```
   - Run migration

3. **Build the voice API endpoint**
   - `POST /api/entries/voice` (protected)
     - Accept multipart audio file upload (use `multer`)
     - Call STT service to transcribe
     - Save entry to PostgreSQL with transcript + userId
     - Optionally store the audio file (local disk for now, S3 later)
     - Return the saved entry

4. **Build the recording UI** (`app/dashboard/record/page.tsx`)
   - Port the MediaRecorder logic from your existing `index.html`
   - But make it *beautiful*:
     - Large pulsing mic button with recording animation
     - Live audio waveform visualization while recording (use Web Audio API + canvas)
     - Status indicator: "Listening...", "Transcribing...", "Saved ✓"
   - After recording stops:
     - Show transcript in a clean card
     - Show "Save Entry" button (auto-saves, but confirm to user)
     - Show the audio playback element so they can replay

5. **Test the full loop**
   - Record → transcribe → save to DB → see it in the console/DB
   - Handle edge cases: empty recordings, network errors, mic permission denied

### What this proves to recruiters:
- You can port between language ecosystems (Python → Node)
- You handle file uploads, media APIs, and real-time UX
- Full vertical slice: frontend → API → external service → database

### Deliverable: User can record voice, see live transcript, entry saved to database.

---

## Feature 4: Clara's Brain (LLM-Powered Conversational Response)

**Goal**: After the user speaks, Clara responds intelligently — acknowledging what they said, remembering their recent entries, responding empathetically. Clara speaks back via TTS.

**Why fourth**: This transforms the app from a "transcription tool" to an "AI companion." Massive demo impact.

### What to do:

1. **Port the ElevenLabs TTS to Node.js**
   - Install `elevenlabs` Node SDK
   - Create `services/tts.service.ts` — replicates your `tts_service.py`
   - Accept text string → call ElevenLabs API → return audio buffer

2. **Create the LLM service** (`services/llm.service.ts`)
   - Install OpenAI SDK (or Google Generative AI SDK for Gemini)
   - Create a function `generateClaraResponse(transcript, recentEntries[])`
   - System prompt for Clara:
     ```
     You are Clara, a warm, thoughtful AI companion. The user just shared 
     a voice entry with you. Respond naturally, like a good friend who 
     genuinely cares. Be concise (2-3 sentences). Reference their recent 
     past entries when relevant. Never be preachy or robotic.
     ```
   - Feed the current transcript + last 5 entries as context
   - Return Clara's response text

3. **Update the voice endpoint**
   - After saving the entry, call LLM service to generate Clara's response
   - Call TTS service to convert Clara's response to audio
   - Return both: `{ entry, claraResponse: { text, audioUrl } }`

4. **Update the recording UI**
   - After transcription, show Clara's text response in a chat bubble
   - Auto-play Clara's audio response
   - Show a mini conversation thread: User entry (left) → Clara response (right)

5. **Add a "Clara is thinking..." state**
   - Show a typing animation while waiting for LLM + TTS
   - Smooth transition from recording → transcribing → thinking → responding

### What this proves to recruiters:
- You can integrate LLMs into a product (not just a chatbot wrapper)
- You understand system prompts, context management
- The demo factor is huge — Clara literally talks back

### Deliverable: User speaks → Clara thinks → Clara responds with voice + text.

---

## Feature 5: Timeline View (Entry History)

**Goal**: A beautiful, scrollable timeline of all past voice entries. Each entry shows date, transcript snippet, mood (later), and is expandable.

**Why fifth**: You now have entries in the DB. Users need to see their history. This is pure frontend craftsmanship.

### What to do:

1. **Build the entries API**
   - `GET /api/entries` (protected) — paginated, sorted by `createdAt` desc
   - Accept query params: `?page=1&limit=20&search=keyword`
   - Return entries with total count for pagination

2. **Build the timeline page** (`app/dashboard/timeline/page.tsx`)
   - Date-grouped sections: "Today", "Yesterday", "July 15, 2026", etc.
   - Each entry card shows:
     - Timestamp
     - First 2 lines of transcript (truncated)
     - Mood indicator dot (colored circle — grey for now, real colors later)
     - Duration badge
   - Click to expand: full transcript + Clara's response + audio playback
   - Infinite scroll or "Load More" pagination

3. **Add a search bar**
   - Simple text search (SQL `ILIKE` for now, upgraded to vector search later)
   - Debounced input, results update live
   - Highlight matching text in results

4. **Add delete functionality**
   - `DELETE /api/entries/:id` (protected, verify ownership)
   - Confirmation dialog before delete
   - Optimistic UI update (remove card immediately, rollback on error)

5. **Empty state**
   - If no entries yet, show a friendly message: "No entries yet. Tap the mic to start talking to Clara."
   - Include a CTA button linking to the record page

### What this proves to recruiters:
- Pagination, search, CRUD — production fundamentals
- UI attention to detail (date grouping, truncation, empty states)
- Exactly what they mean by "Build multiple modules in student dashboard"

### Deliverable: Browseable, searchable history of all voice entries.

---

## Feature 6: Mood Tracking + Sentiment Calendar

**Goal**: Every entry gets a mood score (1-5). Dashboard shows a GitHub-style heatmap calendar colored by daily mood. Users can see emotional patterns over weeks/months.

**Why sixth**: This is the visual wow factor. A color-coded calendar of emotions is instantly impressive in a demo.

### What to do:

1. **Create the sentiment service** (`services/sentiment.service.ts`)
   - Use the same LLM (OpenAI/Gemini) with a focused prompt:
     ```
     Analyze the emotional tone of this journal entry. Return a JSON object:
     { "score": <1-5>, "label": "<one word>", "reason": "<one sentence>" }
     1 = very negative, 2 = negative, 3 = neutral, 4 = positive, 5 = very positive
     ```
   - Parse the JSON response, handle malformed outputs gracefully

2. **Integrate into the entry creation flow**
   - After saving transcript, call sentiment service
   - Update the entry record with `moodScore`, `moodLabel`, `moodReason`
   - This happens async — don't block the user's flow

3. **Build the mood calendar component**
   - Create a custom calendar grid component (or use a lightweight library)
   - Each day cell is colored based on average mood score for that day:
     - Score 1: deep red
     - Score 2: orange  
     - Score 3: yellow
     - Score 4: light green
     - Score 5: bright green
     - No entries: grey/transparent
   - Hover on a day → tooltip showing: "July 15 — 3 entries, avg mood: Positive"
   - Click on a day → navigate to timeline filtered for that date

4. **Add mood to the dashboard** (`app/dashboard/page.tsx`)
   - Top section: Mood calendar (current month, with prev/next month navigation)
   - Below: Stats row — "Current streak: 5 days", "Total entries: 47", "Avg mood: 3.8"
   - Below: 3 most recent entries as cards

5. **Update timeline cards**
   - Add colored mood dot to each entry card
   - Add mood label badge ("Happy", "Anxious", "Calm", etc.)

### What this proves to recruiters:
- You can build data visualizations
- You understand async processing patterns
- Product thinking: turning raw data into user-facing insights

### Deliverable: Dashboard with interactive mood heatmap + sentiment on every entry.

---

## Feature 7: "Ask Your Past" — RAG Search

**Goal**: User types or speaks a question like "When was I last stressed about work?" and Clara searches through all past entries to find and summarize the answer.

**Why seventh**: This is the RAG feature. The JD literally says "quality RAG" as a bonus. This is your crown jewel.

### What to do:

1. **Enable pgvector in PostgreSQL**
   - Install the `pgvector` extension on your PostgreSQL instance
   - Add a `vector` column to the Entry model: `embedding Vector(1536)` (for OpenAI) or `Vector(768)` (for Gemini)
   - Run migration

2. **Create the embedding service** (`services/embedding.service.ts`)
   - Call OpenAI's `text-embedding-3-small` or Gemini's embedding API
   - Accept text string → return float array (the embedding vector)

3. **Generate embeddings for each entry**
   - In the entry creation flow, after saving transcript:
     - Call embedding service on the transcript text
     - Store the vector in the entry's `embedding` column
   - Create a one-time script to backfill embeddings for existing entries

4. **Create the RAG service** (`services/rag.service.ts`)
   - Accept a user question string
   - Generate embedding for the question
   - Query pgvector for the 5 most similar entries (cosine similarity)
   - Build a context prompt:
     ```
     The user asked: "{question}"
     
     Here are their most relevant past journal entries:
     
     Entry from July 10, 2026:
     "{transcript}"
     
     Entry from June 28, 2026:
     "{transcript}"
     
     ... (up to 5 entries)
     
     Based on these entries, answer the user's question naturally.
     Reference specific dates and details. Be concise.
     ```
   - Call LLM with this prompt → return the answer

5. **Build the API endpoint**
   - `POST /api/ask` (protected)
   - Accept `{ question: string }`
   - Call RAG service
   - Return `{ answer, sourceEntries: [{ id, date, snippets }] }`

6. **Build the "Ask Your Past" page** (`app/dashboard/ask/page.tsx`)
   - Clean search interface: large input field + submit button
   - Also add a mic button → record question via voice → transcribe → same flow
   - Show Clara's answer in a conversational card
   - Below the answer: "Sources" section showing which entries Clara pulled from
     - Each source is clickable → navigates to that entry in timeline
   - Suggested questions as chips: "What made me happy this month?", "When did I last mention family?", "What are my recurring worries?"

### What this proves to recruiters:
- Real RAG implementation (not a wrapper around ChatGPT)
- pgvector, embeddings, similarity search — actual backend depth
- The exact AI skill they list as a bonus

### Deliverable: User asks a question → Clara retrieves past entries → answers with citations.

---

## Feature 8: Weekly Insights (AI-Generated Summaries)

**Goal**: Every week, Clara auto-generates a summary of the user's entries: key themes, emotional arc, patterns, and gentle suggestions. Displayed as a beautiful card on the dashboard.

**Why eighth**: This is the "personalization" module the JD mentions. Shows you can build async processing and product features.

### What to do:

1. **Build the insight generation service** (`services/insight.service.ts`)
   - Query all entries from the past 7 days for a given user
   - If fewer than 3 entries, skip (not enough data)
   - Build a prompt:
     ```
     Here are a user's journal entries from the past week:
     
     [Monday] "..."
     [Wednesday] "..."
     [Thursday] "..."
     ...
     
     Generate a weekly insight report as JSON:
     {
       "summary": "2-3 sentence overview of their week",
       "themes": ["theme1", "theme2", "theme3"],
       "moodArc": "description of how their mood changed through the week",
       "highlight": "the most positive moment",
       "suggestion": "one gentle, non-preachy suggestion"
     }
     ```
   - Parse and store the result

2. **Create the Insight database model**
   - Add to Prisma schema:
     ```
     Insight: id, userId, weekStart, weekEnd, summary, themes (JSON), 
              moodArc, highlight, suggestion, createdAt
     ```
   - Run migration

3. **Build the generation trigger**
   - Option A (simple): An API endpoint `POST /api/insights/generate` that you can call manually or via a cron
   - Option B (production): Use `node-cron` to run every Sunday night at 11 PM
   - The endpoint/cron fetches all users with 3+ entries that week, generates insights for each

4. **Build the API endpoint**
   - `GET /api/insights` (protected) — return all insights for the user, sorted newest first
   - `GET /api/insights/latest` — return just the most recent one (for dashboard)

5. **Build the Insights page** (`app/dashboard/insights/page.tsx`)
   - Latest insight displayed as a prominent card:
     - Week range header ("July 7 - July 13")
     - Summary paragraph
     - Themes as colored tags/chips
     - Mood arc as a mini sparkline or emoji sequence
     - Highlight in a quote block
     - Suggestion in a subtle callout box
   - Below: archive of past weekly insights, collapsed/accordion style

6. **Add insight card to the main dashboard**
   - On `app/dashboard/page.tsx`, show the latest insight card below the mood calendar
   - "Your Week in Review" section
   - If no insight yet: "Come back Sunday for your first weekly insight"

### What this proves to recruiters:
- Async processing / scheduled jobs
- Structured LLM output parsing
- Product features beyond CRUD — analytics, personalization

### Deliverable: Auto-generated weekly summary card on the dashboard.

---

## Feature 9: Redis Caching + Rate Limiting + Deployment

**Goal**: Add Redis for caching and rate limiting. Deploy the entire stack. Set up CI/CD.

**Why last**: Polish and production-readiness. This is the difference between "student project" and "production app."

### What to do:

1. **Set up Redis**
   - Use a managed Redis instance (Upstash has a free tier, perfect for this)
   - Install `ioredis` in the backend
   - Create `db/redis.ts` — connection setup with error handling

2. **Add caching**
   - Cache the user's recent entries (invalidate on new entry creation)
   - Cache the latest weekly insight per user
   - Cache the dashboard stats (entry count, streak, avg mood)
   - Set TTLs: entries list = 5 min, insight = 1 hour, stats = 10 min

3. **Add rate limiting**
   - Use Redis-backed rate limiter (`express-rate-limit` + `rate-limit-redis`)
   - Voice endpoints: 20 requests per minute per user (Deepgram costs money)
   - Ask endpoint: 10 requests per minute (LLM calls are expensive)
   - Auth endpoints: 5 attempts per minute (brute force protection)

4. **Deploy the frontend**
   - Push to GitHub → connect to Vercel
   - Set environment variables (API URL)
   - Verify: landing page loads, auth works, all pages render

5. **Deploy the backend**
   - Use Railway or Render (both have free tiers with PostgreSQL)
   - Or Dockerize: create a `Dockerfile` + `docker-compose.yml` for backend + PostgreSQL + Redis
   - Set all environment variables (DB URL, Redis URL, API keys)
   - Verify: API responds, database connected, voice pipeline works

6. **Set up CI/CD** (`.github/workflows/deploy.yml`)
   - On push to `main`:
     - Run linter
     - Run any tests
     - Auto-deploy frontend to Vercel (or via Vercel GitHub integration)
     - Auto-deploy backend to Railway (or via Railway GitHub integration)

7. **Final polish**
   - Add proper error boundaries in Next.js
   - Add loading skeletons (not spinners — skeletons look more premium)
   - Add a proper 404 page
   - Ensure mobile responsiveness on all pages
   - Fill in the README.md with: screenshots, architecture diagram, setup instructions, tech stack

### What this proves to recruiters:
- You understand caching strategies and when to cache
- You can deploy and maintain a production system
- CI/CD — "pipelines" is literally in their JD requirements

### Deliverable: Fully deployed, cached, rate-limited application with CI/CD.

---

## Summary: The Build Order

| # | Feature | Time Est. | You'll Have After This |
|---|---------|-----------|----------------------|
| 1 | Next.js + Tailwind + Landing Page | 2-3 days | A beautiful, deployed landing page |
| 2 | Auth System (JWT + PostgreSQL) | 2-3 days | Users can sign up and log in |
| 3 | Voice Recording + Transcription | 2 days | Core loop works: speak → save |
| 4 | Clara's Brain (LLM + TTS response) | 2 days | Clara talks back intelligently |
| 5 | Timeline View | 1-2 days | Users can browse their history |
| 6 | Mood Calendar + Sentiment | 2-3 days | Visual wow factor on dashboard |
| 7 | "Ask Your Past" RAG | 2-3 days | The killer feature. Real RAG. |
| 8 | Weekly Insights | 1-2 days | AI-generated summaries |
| 9 | Redis + Deploy + CI/CD | 2-3 days | Production-ready, deployed |

**Total: ~3-4 weeks of focused work** (evenings + weekends pace)

---

## The Loom Demo Script (Record After Feature 9)

> *2 minutes. This order. No fluff.*

1. **0:00** — Open the landing page. "This is Clara — a voice-first AI that remembers your life."
2. **0:15** — Sign up. Show the auth flow. "Full JWT auth with refresh tokens."
3. **0:30** — Record a voice entry. Show live transcription. "Deepgram Nova-2 for STT."
4. **0:45** — Clara responds with voice. "Clara uses GPT-4 with context from your past entries, and speaks back via ElevenLabs."
5. **1:00** — Open mood calendar. "Every entry is sentiment-analyzed. This heatmap shows your emotional patterns."
6. **1:15** — Ask "What stressed me out this month?" Show Clara's RAG answer with source entries. "This is pgvector similarity search across all past entries."
7. **1:30** — Show weekly insight card. "Auto-generated every Sunday via a cron job."
8. **1:45** — Quick flash of the GitHub repo: folder structure, CI/CD passing, deployed URLs.
9. **2:00** — "Stack: Next.js, Tailwind, Express, PostgreSQL + pgvector, Redis, Deepgram, ElevenLabs, GPT-4. Thanks for watching."

---

> [!TIP]
> **Start Feature 1 today.** Every feature after that builds on the previous one. By the time you finish Feature 4, you already have a demo-worthy project. Features 5-9 make it exceptional.
