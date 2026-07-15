<div align="center">

<!-- <img src="frontend/public/og-image.png" alt="ScholarSync — AI Powered Student Productivity Platform" width="800" style="border-radius: 18px;" /> -->

<br/><br/>

<h1>ScholarSync</h1>

<p><strong>AI-powered student productivity platform — personalised learning roadmaps, intelligent mentoring,<br/>smart study planning, journal evaluation, and real-time analytics. Built for consistency. Powered by Gemini.</strong></p>

<br/>

<a href="https://scholar-sync-brown.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/Live%20Frontend-scholar--sync--brown.vercel.app-22c55e?style=for-the-badge&logo=vercel&logoColor=white" />
</a>
&nbsp;
<a href="https://scholar-sync-backend-6f31.onrender.com/api/health" target="_blank">
  <img src="https://img.shields.io/badge/Backend%20Health-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" />
</a>

<br/><br/>

<img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Redux%20Toolkit-State-764ABC?logo=redux&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-API-black?logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-blue.svg" />
<img src="https://img.shields.io/badge/Version-1.0.0-success" />

<br/><br/>

</div>

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [System Architecture](#system-architecture)
- [AI Architecture and Caching Pipeline](#ai-architecture-and-caching-pipeline)
- [Authentication Flow](#authentication-flow)
- [Data Flow — Study Planner](#data-flow--study-planner)
- [Roadmap Generator Pipeline](#roadmap-generator-pipeline)
- [XP and Gamification System](#xp-and-gamification-system)
- [Deployment Topology](#deployment-topology)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Production Optimisations](#production-optimisations)
- [Security Model](#security-model)
- [Development Timeline](#development-timeline)
- [Roadmap](#roadmap)
- [Author](#author)
- [License](#license)

---

## Overview

ScholarSync is a production-deployed AI-powered productivity platform built specifically for students. It solves a problem that general-purpose productivity tools do not — students need more than task lists and calendars. They need a system that understands their learning goals, generates structured roadmaps to reach them, plans their daily study schedule intelligently, evaluates their reflection and journaling, and provides a mentor they can ask anything, anytime.

The platform is built on a MERN stack with Google Gemini as the AI backbone. Rather than making a raw Gemini call on every user interaction, ScholarSync implements a multi-layer AI architecture: a context builder that assembles user-specific data before every prompt, a validation layer that ensures AI responses are structured and usable, a MongoDB-backed cache layer that avoids redundant inference calls, and a rule-based offline fallback engine that keeps the platform functional when Gemini is unreachable.

Key design decisions:

- **Context-first AI**: Every Gemini call is preceded by a context builder that pulls the student's current roadmap progress, completed milestones, recent journal entries, and study history. This makes responses feel personalised rather than generic.
- **Aggressive caching**: Dashboard insights, study plans, and roadmap suggestions are cached in MongoDB with TTL-based invalidation. A student refreshing their dashboard 10 times in an hour makes one Gemini call, not ten.
- **Graceful degradation**: A rule-based fallback engine handles all AI features when Gemini is unreachable — the platform never shows an error page for AI failures.
- **Parallel DB queries**: All dashboard data is fetched with `Promise.all()` to eliminate serial query latency.
- **HTTP-only JWT cookies**: Tokens are never accessible to JavaScript, eliminating XSS-based token theft entirely.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | [scholar-sync-brown.vercel.app](https://scholar-sync-brown.vercel.app/) |
| Backend Health | [scholar-sync-backend-6f31.onrender.com/api/health](https://scholar-sync-backend-6f31.onrender.com/api/health) |

---

## System Architecture

The full component topology of ScholarSync — from browser through the API, AI pipeline, and data layer.

```mermaid
graph TB
    subgraph Client [Client Layer - Browser]
        REACT[React 19 SPA]
        RTK[Redux Toolkit + RTK Query]
        ROUTER[React Router v6]
        CHARTS[Recharts Analytics]
        REACT --> RTK
        REACT --> ROUTER
        REACT --> CHARTS
    end

    subgraph Vercel [Vercel Edge - Frontend Hosting]
        CDN[Static Asset CDN]
        REACT --> CDN
    end

    subgraph Backend [Backend - Node.js + Express - Render]
        GW[Express API Gateway]
        AUTH_MW[JWT Middleware]
        CORS_MW[CORS + Cookie Parser]
        ROUTES[API Router]
        CTRL[Controllers]
        SVC[Service Layer]
        GW --> CORS_MW --> AUTH_MW --> ROUTES --> CTRL --> SVC
    end

    subgraph AI [AI Pipeline]
        CTX[Context Builder]
        GEMINI[Google Gemini API]
        VALIDATOR[Response Validator]
        FALLBACK[Rule-based Offline Fallback]
        CACHE[AI Cache Layer]
        CTX --> GEMINI
        CTX --> FALLBACK
        GEMINI --> VALIDATOR
        VALIDATOR --> CACHE
        FALLBACK --> CACHE
    end

    subgraph Data [Data Layer]
        MONGO[(MongoDB Atlas)]
        GOOGLE_OAUTH[Google OAuth 2.0]
    end

    RTK -->|REST + Cookies| GW
    SVC --> CTX
    SVC --> MONGO
    CACHE --> MONGO
    AUTH_MW --> GOOGLE_OAUTH
```

---

## AI Architecture and Caching Pipeline

How ScholarSync manages AI calls to stay fast, cost-efficient, and resilient — with context injection, response caching, and offline fallback.

```mermaid
flowchart TD
    TRIGGER([User Action\ne.g. open dashboard, submit journal, request study plan]) --> CTX_BUILD[Context Builder\nAssemble user-specific data]

    CTX_BUILD --> PULL_DATA[(Pull from MongoDB\nroadmap progress, journals,\ncompleted milestones, study history)]
    PULL_DATA --> PROMPT[Build personalised prompt\nwith full student context]

    PROMPT --> CACHE_CHECK{Cache hit?\nCheck MongoDB cache\nby user + feature + TTL}

    CACHE_CHECK -->|Hit - valid cache exists| CACHED_RESP([Return cached response instantly\nno Gemini call made])

    CACHE_CHECK -->|Miss - no valid cache| GEMINI_CALL[POST to Google Gemini API\nwith assembled prompt]

    GEMINI_CALL --> ONLINE{Gemini reachable?}

    ONLINE -->|Yes| VALIDATE[Response Validator\nCheck structure, length, format]
    VALIDATE --> VALID{Valid response?}
    VALID -->|Yes| STORE_CACHE[(Store in MongoDB cache\nwith TTL and feature key)]
    VALID -->|No| FALLBACK
    ONLINE -->|No - timeout or error| FALLBACK[Rule-based Fallback Engine\nGenerate structured response\nfrom local rules]

    STORE_CACHE --> DELIVER([Deliver AI response to client])
    FALLBACK --> DELIVER

    DELIVER --> INVALIDATE_TRIGGER{Does this action\ninvalidate other caches?}
    INVALIDATE_TRIGGER -->|Yes e.g. progress update| PURGE[(Purge affected cache entries\nDashboard, Planner caches)]
    INVALIDATE_TRIGGER -->|No| DONE([Done])
    PURGE --> DONE
```

---

## Authentication Flow

ScholarSync supports both standard email/password authentication and Google OAuth 2.0. Tokens are issued as HTTP-only cookies, never exposed to JavaScript.

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant BE as Express Backend
    participant Google as Google OAuth 2.0
    participant DB as MongoDB Atlas

    alt Standard Login
        User->>FE: Enter email and password
        FE->>BE: POST /api/auth/login
        BE->>DB: Find user by email
        DB-->>BE: User document
        BE->>BE: bcrypt.compare password hash
        BE-->>FE: Set HTTP-only JWT cookie
        FE-->>User: Redirect to dashboard
    end

    alt Google OAuth Login
        User->>FE: Click Continue with Google
        FE->>BE: GET /api/auth/google
        BE->>Google: Redirect to Google consent screen
        Google-->>BE: Authorization code
        BE->>Google: Exchange code for profile
        Google-->>BE: Name, email, avatar
        BE->>DB: findOrCreate user by Google ID
        DB-->>BE: User document
        BE-->>FE: Set HTTP-only JWT cookie
        FE-->>User: Redirect to dashboard
    end

    Note over FE,BE: All subsequent requests send cookie automatically

    FE->>BE: GET /api/user/me with cookie
    BE->>BE: Verify JWT signature and expiry
    BE-->>FE: User profile and session data
```

---

## Data Flow — Study Planner

How the AI Smart Study Planner generates, caches, and reschedules a student's daily study plan — including missed milestone recovery.

```mermaid
sequenceDiagram
    actor Student
    participant FE as React Frontend
    participant API as Express API
    participant CTX as Context Builder
    participant GEMINI as Google Gemini
    participant CACHE as MongoDB Cache
    participant CAL as Calendar Store

    Student->>FE: Open Smart Study Planner
    FE->>API: GET /api/planner/today

    API->>CACHE: Check cache for userId + date key
    alt Cache hit - plan already generated today
        CACHE-->>API: Cached daily plan
        API-->>FE: Return plan instantly
        FE-->>Student: Show today's study schedule
    else Cache miss
        API->>CTX: Build context
        CTX->>CACHE: Fetch active roadmap milestones
        CTX->>CACHE: Fetch recently completed topics
        CTX->>CACHE: Fetch missed milestones from past 7 days
        CTX-->>API: Assembled student context

        API->>GEMINI: POST plan prompt with context
        GEMINI-->>API: Structured daily plan JSON

        API->>CACHE: Store plan with daily TTL
        API->>CAL: Sync plan items to calendar
        CAL-->>API: Calendar events created
        API-->>FE: Return fresh plan
        FE-->>Student: Show today's study schedule
    end

    Student->>FE: Mark topic as completed
    FE->>API: PATCH /api/planner/complete with topicId
    API->>CACHE: Update completion status
    API->>CACHE: Invalidate dashboard AI cache
    API-->>FE: Updated XP and streak
    FE-->>Student: XP animation and streak update
```

---

## Roadmap Generator Pipeline

The multi-step interview wizard that generates a personalised learning roadmap using AI.

```mermaid
flowchart TD
    START([Student clicks Generate Roadmap]) --> STEP1[Step 1\nWhat do you want to learn?]
    STEP1 --> STEP2[Step 2\nCurrent skill level?]
    STEP2 --> STEP3[Step 3\nAvailable hours per week?]
    STEP3 --> STEP4[Step 4\nTarget completion date?]
    STEP4 --> STEP5[Step 5\nPreferred learning style?]

    STEP5 --> SUBMIT[Submit wizard answers]
    SUBMIT --> CTX[Assemble full student context\ncurrent courses, past roadmaps, XP level]

    CTX --> GEMINI[POST to Gemini\nwith wizard answers plus context]

    GEMINI --> PARSE[Parse structured roadmap JSON\nphases, milestones, subtopics, time estimates]
    PARSE --> VALIDATE{Valid structure?}

    VALIDATE -->|No| RETRY[Retry with stricter prompt\nmax 2 retries]
    RETRY --> VALIDATE

    VALIDATE -->|Yes| PREVIEW[Show roadmap preview\nin editable canvas]
    PREVIEW --> EDIT{Student edits?}

    EDIT -->|Yes| EDITOR[Smart roadmap editor\nadd, remove, reorder milestones]
    EDITOR --> SAVE
    EDIT -->|No| SAVE[Save roadmap to MongoDB]

    SAVE --> CAL_SYNC[Sync milestones to calendar\ncreate deadline events]
    CAL_SYNC --> SUGGESTIONS[AI suggestions panel\nrecommended resources per milestone]
    SUGGESTIONS --> DONE([Roadmap active on dashboard])
```

---

## XP and Gamification System

How XP is earned, tracked, and displayed across features.

```mermaid
flowchart LR
    subgraph Actions [XP-Earning Actions]
        A1[Complete study session\nFocus Timer]
        A2[Submit journal entry\nwith AI evaluation]
        A3[Complete roadmap milestone]
        A4[Maintain daily streak]
        A5[Receive positive journal feedback]
    end

    subgraph Engine [XP Engine]
        CALC[Calculate XP award\nbased on action type and quality]
        UPDATE[(Increment user XP\nMongoDB)]
        LEVEL[Recompute level\nand rank]
        CALC --> UPDATE --> LEVEL
    end

    subgraph Display [Dashboard Display]
        XP_BAR[XP progress bar]
        STREAK_BADGE[Streak counter]
        RANK[Weekly leaderboard rank]
        ACHIEVEMENT[Achievement unlocks]
    end

    A1 --> CALC
    A2 --> CALC
    A3 --> CALC
    A4 --> CALC
    A5 --> CALC

    LEVEL --> XP_BAR
    LEVEL --> STREAK_BADGE
    LEVEL --> RANK
    LEVEL --> ACHIEVEMENT
```

---

## Deployment Topology

```mermaid
graph LR
    subgraph User [User]
        BROWSER[Browser]
    end

    subgraph Vercel [Vercel - Frontend]
        CDN[Global Edge CDN]
        STATIC[React 19 Static Build]
        CDN --> STATIC
    end

    subgraph Render [Render - Backend]
        NODE[Node.js + Express\nAuto-scale on demand]
    end

    subgraph Atlas [MongoDB Atlas]
        CLUSTER[M0 Free Cluster\nAuto-indexed collections]
    end

    subgraph Google [Google Cloud]
        GEMINI[Gemini API]
        OAUTH[OAuth 2.0]
    end

    BROWSER -->|HTTPS| CDN
    STATIC -->|REST API over HTTPS| NODE
    NODE -->|Mongoose driver| CLUSTER
    NODE -->|Inference calls| GEMINI
    NODE -->|Token exchange| OAUTH
```

---

## Features

### AI Mentor

A context-aware chatbot that answers any academic question with full knowledge of the student's current roadmap, recent progress, and learning goals. Every message to the mentor includes a dynamically assembled context payload — responses are tailored to where the student actually is, not generic answers to generic questions.

- Personalised guidance based on current roadmap and XP level
- Secure prompt handling with input sanitisation
- Offline fallback with rule-based responses when Gemini is unavailable

### AI Roadmap Generator

A multi-step interview wizard that generates a complete, phase-by-phase learning roadmap — not a flat list of topics, but a structured plan with milestones, subtopics, estimated hours, and target dates.

- Five-step wizard collects goals, skill level, availability, and learning style
- AI-generated roadmap rendered in an editable canvas
- Milestone-level calendar synchronisation
- AI suggestions panel with recommended resources per milestone

### AI Dashboard Intelligence

The dashboard surfaces personalised insights based on the student's actual data — not static motivational quotes, but specific observations about pace, missed milestones, and areas gaining momentum.

- Cached responses to avoid redundant Gemini calls on every page load
- Automatic cache invalidation when progress is updated
- Parallel database queries for fast dashboard load time

### AI Smart Study Planner

Generates a daily study schedule that accounts for active roadmap milestones, recent completions, missed topics from the past week, and the student's available hours — updated each day.

- Daily cache keyed by user ID and date
- Missed milestone recovery integrated into next-day plan
- Calendar rescheduling when a session is skipped
- Workload balancing across subjects

### Journal Evaluation

Students write reflective journal entries and receive structured AI feedback — quality scores, specific observations, and actionable suggestions for deeper reflection. Consistent journaling earns XP rewards.

- AI feedback on clarity, depth, and self-awareness
- Reflection tracking across entries over time
- XP rewards for quality submissions

### Focus Timer

A Pomodoro-style session timer that tracks study sessions, awards XP on completion, and contributes to the student's streak and weekly analytics.

- Configurable session and break durations
- XP tracking per completed session
- Session history visible in analytics dashboard

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI component library, concurrent rendering |
| Vite | Latest | Build tool, HMR dev server |
| Redux Toolkit + RTK Query | Latest | Global state, API caching, request deduplication |
| React Router | v6 | Client-side routing, protected routes |
| Tailwind CSS | Latest | Utility-first styling |
| Recharts | Latest | Analytics charts and progress visualisation |
| Lucide React | Latest | Icon library |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | Latest LTS | JavaScript runtime |
| Express.js | Latest | REST API framework |
| MongoDB Atlas | Latest | Cloud-hosted NoSQL document database |
| Mongoose | Latest | ODM, schema validation, query builder |
| JWT | Latest | Stateless authentication tokens |
| Google OAuth 2.0 | Latest | Social login provider |
| bcrypt | Latest | Password hashing |

### AI

| Technology | Purpose |
|---|---|
| Google Gemini | Primary AI inference engine |
| Context Builder | Assembles personalised user data before every Gemini call |
| AI Cache Layer | MongoDB-backed response cache with TTL and feature-key invalidation |
| Rule-based Fallback | Offline engine that handles all AI features without Gemini |
| Response Validator | Validates Gemini output structure before serving to client |

### Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploy on push to main, global edge CDN |
| Backend | Render | Auto-scaling Node.js service, health endpoint |
| Database | MongoDB Atlas | M0 free cluster, auto-indexed collections |

---

## Project Structure

```
Project-AG/
|
+-- backend/
|   +-- controllers/             # Route handler functions — thin, delegate to services
|   |   +-- authController.js
|   |   +-- roadmapController.js
|   |   +-- plannerController.js
|   |   +-- journalController.js
|   |   +-- mentorController.js
|   |   +-- dashboardController.js
|   +-- middleware/
|   |   +-- authMiddleware.js    # JWT verification, attach user to req
|   |   +-- errorMiddleware.js   # Centralised error handler
|   +-- models/                  # Mongoose schemas
|   |   +-- User.js
|   |   +-- Roadmap.js
|   |   +-- StudyPlan.js
|   |   +-- Journal.js
|   |   +-- AICache.js           # Cache document with TTL and feature key
|   |   +-- FocusSession.js
|   +-- routes/                  # Express Router definitions
|   |   +-- auth.js
|   |   +-- roadmap.js
|   |   +-- planner.js
|   |   +-- journal.js
|   |   +-- mentor.js
|   |   +-- dashboard.js
|   +-- services/                # Business logic layer
|   |   +-- aiService.js         # Gemini call, cache check, fallback orchestration
|   |   +-- contextBuilder.js    # Assembles user context before every AI call
|   |   +-- cacheService.js      # MongoDB cache read, write, invalidate, TTL management
|   |   +-- fallbackEngine.js    # Rule-based offline response generator
|   |   +-- calendarService.js   # Calendar event creation and sync
|   +-- index.js                 # Express app setup, middleware chain, server start
|
+-- frontend/
|   +-- src/
|   |   +-- components/          # Reusable UI components
|   |   |   +-- Roadmap/         # RoadmapCanvas, MilestoneCard, SuggestionsPanel
|   |   |   +-- Planner/         # DailyPlanView, SessionTimer, ProgressBar
|   |   |   +-- Journal/         # JournalEditor, FeedbackCard, HistoryList
|   |   |   +-- Mentor/          # ChatWindow, MessageBubble, ContextIndicator
|   |   |   +-- Dashboard/       # InsightsPanel, XPBar, StreakBadge, Analytics
|   |   |   +-- Timer/           # PomodoroTimer, SessionControls
|   |   +-- pages/               # Route-level page components
|   |   |   +-- Dashboard.jsx
|   |   |   +-- Roadmap.jsx
|   |   |   +-- Planner.jsx
|   |   |   +-- Journal.jsx
|   |   |   +-- Mentor.jsx
|   |   |   +-- Login.jsx
|   |   +-- store/               # Redux slices and RTK Query API definitions
|   |   |   +-- authSlice.js
|   |   |   +-- roadmapApi.js
|   |   |   +-- plannerApi.js
|   |   |   +-- journalApi.js
|   |   +-- assets/              # Images, fonts, icons
|   +-- index.html
|   +-- vite.config.js
|
+-- .gitignore
+-- package.json
+-- README.md
```

---

## Environment Configuration

```env
# ── Database ───────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/scholarsync

# ── Authentication ─────────────────────────────────────────────────────────────
JWT_SECRET=your-minimum-64-character-secret-key
JWT_EXPIRE=7d

# ── Google AI ──────────────────────────────────────────────────────────────────
GEMINI_API_KEY=your-gemini-api-key

# ── Google OAuth 2.0 ───────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# ── App ────────────────────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/AdityaTalikoti/Project-AG.git
cd Project-AG

# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Fill in all values in .env

# Start backend
npm run dev

# In a new terminal — install frontend dependencies
cd ../frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require a valid JWT cookie set on login.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register with email and password |
| `POST` | `/api/auth/login` | No | Login, sets HTTP-only JWT cookie |
| `GET` | `/api/auth/google` | No | Initiate Google OAuth flow |
| `GET` | `/api/auth/google/callback` | No | OAuth callback, sets JWT cookie |
| `POST` | `/api/auth/logout` | Yes | Clear JWT cookie |
| `GET` | `/api/auth/me` | Yes | Get current user profile |

### Roadmap

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/roadmap/generate` | Yes | Generate AI roadmap from wizard answers |
| `GET` | `/api/roadmap` | Yes | Get active roadmap |
| `PATCH` | `/api/roadmap/milestone/:id` | Yes | Mark milestone as complete |
| `PUT` | `/api/roadmap` | Yes | Update roadmap structure after editing |

### Study Planner

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/planner/today` | Yes | Get or generate today's study plan |
| `PATCH` | `/api/planner/complete` | Yes | Mark a study topic as completed |
| `GET` | `/api/planner/history` | Yes | Past study plans |

### Journal

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/journal` | Yes | Submit journal entry, triggers AI evaluation |
| `GET` | `/api/journal` | Yes | List all journal entries |
| `GET` | `/api/journal/:id` | Yes | Get single entry with AI feedback |

### Mentor Portal(Upcoming)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/mentor/chat` | Yes | Send message, receive contextualised AI response |
| `GET` | `/api/mentor/history` | Yes | Retrieve past chat messages |

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Yes | Full dashboard data — insights, XP, streak, analytics |

---

## Production Optimisations

- **Parallel database queries** — dashboard data is fetched with `Promise.all()`, eliminating serial query latency that compounds across multiple collections
- **AI response caching** — Gemini responses are cached in MongoDB with feature-specific TTL keys, reducing inference cost and latency for repeat loads
- **MongoDB indexing** — compound indexes on `userId + createdAt` across all user-data collections for fast paginated queries
- **Prompt optimisation** — prompts are structured for consistent JSON output, minimising the need for response retries
- **Graceful fallback** — rule-based engine ensures all AI features degrade gracefully rather than returning error states
- **HTTP-only cookies** — tokens never exposed to JavaScript, eliminating XSS-based token theft
- **Dynamic OAuth redirects** — OAuth callback URL is set from environment variables, enabling the same codebase to work across development and production

---

## Security Model

| Threat | Mitigation |
|---|---|
| XSS token theft | JWT stored in HTTP-only cookie, inaccessible to JavaScript |
| CSRF | SameSite cookie attribute, CORS restricted to known origins |
| SQL injection | Not applicable — MongoDB with Mongoose schema typing |
| NoSQL injection | Input sanitisation middleware strips operator keys from request bodies |
| Unauthenticated access | JWT middleware applied to all protected routes |
| Prompt injection | User inputs are sanitised before insertion into Gemini prompts |
| Brute force login | Rate limiting middleware on `/api/auth/login` |
| Secrets exposure | All secrets in environment variables, never committed to repository |

---

## Development Timeline

| Phase | Description | Status |
|---|---|---|
| Phase 1 | AI Foundation — Gemini integration, context builder, cache layer | Done |
| Phase 2 | Prompt Architecture — template system, validators, fallback engine | Done |
| Phase 3 | AI Mentor — context-aware chatbot, chat history | Done |
| Phase 4 | Context Builder — user data assembly pipeline for personalised prompts | Done |
| Phase 5 | AI Journal Evaluation — feedback engine, XP rewards, history tracking | Done |
| Phase 6 | Dashboard Intelligence — personalised insights, parallel queries, cache | Done |
| Phase 7 | AI Roadmap Generator — wizard, editable canvas, calendar sync | Done |
| Phase 8 | Smart Study Planner — daily plans, missed milestone recovery, reschedule | Done |
| Phase 9 | Production Optimisation and Deployment — Vercel, Render, Atlas | Done |

---

## Future Plans

| Feature | Description |
|---|---|
| Mentor Portal | Dedicated space for human mentors to review student progress |
| Voice AI | Voice-based interaction with the AI Mentor |
| Mobile App | React Native version of the platform |
| Team Study Rooms | Collaborative study sessions with shared timers and whiteboards |
| Weekly Analytics | Deeper weekly reports with study pattern analysis |
| Push Notifications | Deadline reminders and streak alerts |

---

## Author

**Aditya Talikoti**
B.Tech CSE (Cloud Computing) · MIT ADT University

[github.com/AdityaTalikoti](https://github.com/AdityaTalikoti)

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

*ScholarSync — built for students who take their learning seriously.*

</div>
