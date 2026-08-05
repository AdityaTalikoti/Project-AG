# ScholarSync — Agent Guide & Repository Map (`AGENTS.md`)

Welcome, AI Agent! This document is designed to give you an instant, comprehensive understanding of the **ScholarSync** codebase, architecture patterns, directory layout, conventions, and operational workflows so you can start contributing or debugging immediately without re-analyzing the entire repository.

---

## 1. Executive Summary & Tech Stack

**ScholarSync** is an AI-powered student productivity platform built on the MERN stack with Google Gemini. It converts high-level learning goals into phase-by-phase roadmaps, provides context-aware AI mentoring, evaluates reflective journal logs, automatically generates daily study schedules based on calendar workload, and tracks focus sessions and gamified XP.

### Tech Stack Quick Reference:
- **Frontend**: React 19, Vite (Dev server on port 5174), Redux Toolkit + RTK Query (`apiSlice.js`), Tailwind CSS v4, Recharts, Lucide React icons.
- **Backend**: Node.js (LTS), Express.js (Port 8080), MongoDB Atlas with Mongoose ODM.
- **AI Infrastructure**: Google Gemini API (`@google/genai` & `@google/generative-ai`) via `gemini-2.5-flash` with auto-fallback to `gemini-3.5-flash`.
- **Authentication**: Email/Password (bcryptjs) & Google OAuth 2.0. Issued as stateless JWTs stored strictly inside `HttpOnly` cookies.
- **Deployment Topology**: Frontend on **Vercel Edge**, Backend on **Render/Railway**, Database on **MongoDB Atlas**.

---

## 2. Documentation Quick Links

For complete technical specifications and architectural diagrams, refer to these primary design documents in the root directory:

- 📄 **[PRD.md](file:///d:/Adi%20Folder/AG-Project/PRD.md)** — Product Requirements Document (User personas, feature capabilities, functional requirements).
- 🏗️ **[HLD.md](file:///d:/Adi%20Folder/AG-Project/HLD.md)** — High-Level Design (Mermaid topology diagrams, caching pipeline, system sub-components, database ER diagram).
- 🔬 **[LLD.md](file:///d:/Adi%20Folder/AG-Project/LLD.md)** — Low-Level Design (Mongoose schema definitions, API endpoint contracts, controller/service contracts, Mermaid sequence diagrams).

---

## 3. Directory Structure Map

```
Project-AG/
├── backend/
│   ├── index.js                      # Express setup, Middleware chain, MongoDB connection, Server listen
│   ├── controllers/                  # Thin HTTP request handlers
│   │   ├── aiController.js           # Handles /api/ai/chat and /api/ai/dashboard-insight
│   │   ├── eventController.js        # Calendar events CRUD, range filtering, today/upcoming queries
│   │   ├── roadmapController.js      # Roadmap generation, suggestions, saving, module mapping
│   │   └── studyPlanController.js    # Study plan retrieval, regeneration, task toggles, rescheduling
│   ├── middleware/
│   │   ├── aiService.js              # Legacy/Journal task-idea evaluation service
│   │   ├── auth.js                   # JWT verification middleware (attaches req.user from cookie)
│   │   └── errorHandler.js           # Centralized global JSON error handling middleware
│   ├── models/                       # Mongoose Schemas & Models
│   │   ├── AIInsight.js              # Cached AI dashboard summaries (TTL + version fingerprinting)
│   │   ├── Event.js                  # Calendar events & synced roadmap milestones
│   │   ├── FocusSession.js           # Focused study time logs (seconds)
│   │   ├── Goal.js                   # High-level user learning goals & subtasks
│   │   ├── Journal.js                # Task-Idea reflective journal logs with AI feedback
│   │   ├── Roadmap.js                # Active/archived phase-based roadmaps with modules & tasks
│   │   ├── StudyPlan.js              # Daily adaptive study schedules & rescheduling recommendations
│   │   └── User.js                   # Student accounts, OAuth IDs, password hash, daily target
│   ├── routes/                       # Express Router definitions (mapped to /api/*)
│   │   ├── aiRoutes.js               # /api/ai/*
│   │   ├── auth.js                   # /api/auth/* (signup, login, google callback, me, logout)
│   │   ├── dashboard.js              # /api/dashboard/stats (parallel queries, consistency score, XP)
│   │   ├── events.js                 # /api/events/*
│   │   ├── focusSession.js           # /api/focus-session/* (midnight splitting logic)
│   │   ├── goals.js                  # /api/goals/*
│   │   ├── journal.js                # /api/journal/*
│   │   └── roadmaps.js               # /api/roadmaps/* (active, generate, save, toggle, sync, archive)
│   ├── services/ai/                  # Core Business & AI Logic Pipelines
│   │   ├── contextBuilder.js         # Assembles student data context before AI calls
│   │   ├── dashboardInsightService.js# Generates & manages cached dashboard insights
│   │   ├── geminiService.js          # GoogleGenAI API wrapper (2.5-flash -> 3.5-flash fallback)
│   │   ├── insightCacheService.js    # Source version fingerprinting & MongoDB AIInsight cache
│   │   ├── journalContextBuilder.js  # Formats recent journal entries for prompt injection
│   │   ├── promptBuilder.js          # Combines system prompt + student context + user message
│   │   ├── roadmapGeneratorService.js# AI roadmap prompt generator & preset fallback templates
│   │   ├── roadmapSuggestionService.js# Analyzes roadmap milestones for sequencing/duration warnings
│   │   ├── roadmapSyncService.js     # Synchronizes roadmap modules to calendar Event documents
│   │   ├── roadmapValidator.js       # Cleans & validates raw Gemini JSON output for roadmaps
│   │   ├── studyPlanContextBuilder.js# Assembles workload, missed milestones, and roadmap state
│   │   ├── studyPlanValidator.js     # Cleans & validates raw Gemini JSON for study plans
│   │   ├── studyPlannerService.js    # Generates daily study plans (AI or rule-based fallback)
│   │   └── systemPrompt.js           # Permanent AI mentor persona & guidelines
│   └── validation/
│       └── eventValidation.js        # Input validation middleware for calendar events
└── frontend/                         # Vite + React 19 Client SPA
    ├── src/
    │   ├── main.jsx                  # React root rendering + Redux Provider
    │   ├── App.jsx                   # React Router v6 route configuration & protected routes
    │   ├── index.css                 # Main Tailwind CSS v4 styling rules
    │   ├── components/               # Reusable UI components
    │   │   ├── AchievementsList.jsx
    │   │   ├── ActivityHeatmap.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── HeroCTA.jsx           # Circular progress card & Roadmap onboarding trigger
    │   │   ├── JournalInput.jsx
    │   │   ├── Layout.jsx            # Main dashboard shell (collapsible sidebar, topbar, profile)
    │   │   ├── ProtectedRoute.jsx    # Auth check guard (redirects unauthenticated users to /auth)
    │   │   ├── QuickActions.jsx
    │   │   ├── QuickCreateEventModal.jsx # Modal to quickly add calendar events from dashboard
    │   │   ├── RoadmapStepper.jsx
    │   │   ├── WeeklyProgress.jsx    # Focus hours area chart (Recharts) with previous week toggle
    │   │   ├── Widgets.jsx           # AI Insight card & upcoming task list
    │   │   ├── ai/                   # AI Mentor & Study Planner components
    │   │   │   ├── ChatInput.jsx     # Auto-growing multiline chat input
    │   │   │   ├── ChatMessage.jsx   # User/AI bubble renderer
    │   │   │   ├── ChatWindow.jsx    # Auto-scrolling chat history & empty state suggestions
    │   │   │   ├── StudyPlanner.jsx  # Daily study checklist & missed milestone adaptation panel
    │   │   │   └── TypingIndicator.jsx # Animated pulse thinking indicator
    │   │   └── auth/                 # Form inputs for AuthPage
    │   ├── pages/                    # Route-level page views
    │   │   ├── AIMentor.jsx          # Dedicated chat mentor portal
    │   │   ├── AuthPage.jsx          # Sign in / Sign up / Forgot password page
    │   │   ├── CalendarPage.jsx      # Full interactive Month/Week/Day calendar UI
    │   │   ├── ComingSoonPage.jsx
    │   │   ├── FocusTimerPage.jsx    # Fullscreen Pomodoro/Long Session timer with audio chime
    │   │   ├── Home.jsx              # Main student dashboard
    │   │   ├── JournalPage.jsx
    │   │   └── RoadmapPage.jsx       # Active Roadmap timeline & AI Preview Editor
    │   ├── services/
    │   │   └── aiApi.js              # Client service for /api/ai/chat fetch
    │   ├── store/
    │   │   ├── apiSlice.js           # RTK Query API slice definitions & tag invalidations
    │   │   ├── authSlice.js          # Auth state slice (user, isAuthenticated, fetchCurrentUser)
    │   │   └── index.js              # Redux store configuration
    │   └── hooks/
    │       └── useChat.js            # Custom hook managing AI chat messages state & API calls
    ├── vite.config.js                # Vite dev server config (Proxy /api to http://localhost:8080)
    └── vercel.json                   # Vercel deployment rewrite rules (/api/* proxy to backend)
```

---

## 4. Key Architectural Patterns & Conventions

When modifying or extending the codebase, follow these established repository patterns:

### 1. HTTP-Only Cookie Authentication
- Authentication uses stateless JWT tokens stored in `HttpOnly` cookies (`req.cookies.token`).
- All frontend API calls via `fetch` or RTK Query must include `credentials: 'include'`.
- Backend middleware `authMiddleware` automatically verifies the token and attaches user details to `req.user = decoded`.

### 2. Thin Controller & Service Subsystem Architecture
- Express controllers (`backend/controllers/`) should remain thin.
- Delegate prompt generation, context assembly, caching checks, validation, and AI fallback orchestration to dedicated modules under `backend/services/ai/`.

### 3. Graceful Fallback Strategy
- **Never fail an API call due to an external AI error.**
- Always wrap Gemini API calls in try-catch blocks. If Gemini fails, fails validation, or times out, trigger local rule-based fallback functions (e.g. `generateFallbackStudyPlan`, preset roadmap templates, or cached insight fallbacks).

### 4. Response Validation & Caching
- Before serving or caching raw text from Gemini, pass responses through validators (`roadmapValidator.js`, `studyPlanValidator.js`) to strip markdown fences (` ```json `) and validate JSON structure.
- Dashboard insights are cached in MongoDB (`AIInsight` model) with a 24-hour TTL and verified against a source version signature (`computeSourceVersion`).

### 5. Timezone Awareness
- Dates sent from the client pass `timezone` in query/body (e.g., `Intl.DateTimeFormat().resolvedOptions().timeZone`).
- Use `getLocalDateStr(date, timezone)` to format local YYYY-MM-DD dates for daily aggregations and streak calculations.

### 6. RTK Query Data Invalidation
- All API interactions on the frontend use RTK Query (`frontend/src/store/apiSlice.js`).
- Mutating endpoints specify `invalidatesTags: ['DashboardStats', 'Event', 'StudyPlan', 'Journal']` to automatically trigger background re-fetching and UI updates.

---

## 5. Development Setup & Execution Commands

```bash
# Clone repository
git clone https://github.com/AdityaTalikoti/Project-AG.git
cd Project-AG

# Install and start Backend (Node.js + Express)
cd backend
npm install
npm run dev # Launches server on http://localhost:8080 with nodemon

# Install and start Frontend (Vite + React 19)
cd ../frontend
npm install
npm run dev # Launches Vite dev server on http://localhost:5174
```

### Essential Environment Variables (`backend/.env`):
```env
PORT=8080
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/scholarsync
JWT_SECRET=your-minimum-64-character-secret-key
GEMINI_API_KEY=your-google-gemini-api-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
FRONTEND_URL=http://localhost:5174
NODE_ENV=development
```

---

## 6. How to Read & Work With This Codebase Efficiently

1. **To understand a feature end-to-end**: Look at the corresponding route in `backend/routes/`, check the controller in `backend/controllers/`, view the underlying AI pipeline in `backend/services/ai/`, and inspect the RTK Query hook in `frontend/src/store/apiSlice.js`.
2. **To inspect database schemas**: Open `backend/models/`.
3. **To see full architectural diagrams and API contracts**: Check [HLD.md](file:///d:/Adi%20Folder/AG-Project/HLD.md) and [LLD.md](file:///d:/Adi%20Folder/AG-Project/LLD.md).
