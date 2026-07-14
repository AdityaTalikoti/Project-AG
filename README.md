# 🎓 ScholarSync --- AI Powered Student Productivity Platform

> 🚀 **Production Release v1.0**

ScholarSync is an AI-powered MERN platform that helps students stay
consistent, organized, and productive through personalized learning
roadmaps, AI mentoring, smart study planning, journaling, calendar
synchronization, and analytics.

------------------------------------------------------------------------

## 🌐 Live Demo

-   **Frontend:** https://scholar-sync-brown.vercel.app/
-   **Backend Health:**
    https://scholar-sync-backend-6f31.onrender.com/api/health

------------------------------------------------------------------------

## 🛠 Tech Stack

### Frontend

-   React 19
-   Vite
-   Redux Toolkit (RTK Query)
-   React Router
-   Tailwind CSS
-   Recharts
-   Lucide React

### Backend

-   Node.js
-   Express.js
-   MongoDB Atlas
-   Mongoose
-   JWT Authentication
-   Google OAuth 2.0

### AI

-   Google Gemini
-   Prompt Engineering
-   AI Context Builder
-   AI Cache Layer
-   Rule-based Offline Fallback

### Deployment

-   Vercel
-   Render
-   MongoDB Atlas

------------------------------------------------------------------------

# ✨ Features

## 🤖 AI Mentor

-   Context-aware chatbot
-   Personalized learning guidance
-   Secure prompt handling

## 🗺 AI Roadmap Generator

-   Multi-step interview wizard
-   AI-generated personalized roadmap
-   Smart roadmap editor
-   Calendar synchronization
-   AI suggestions panel

## 📊 AI Dashboard Intelligence

-   Personalized dashboard insights
-   Cached responses
-   Automatic regeneration after progress updates

## 📅 AI Smart Study Planner

-   Daily study plans
-   Workload balancing
-   Missed milestone recovery
-   Calendar rescheduling
-   Daily cache

## 📝 Journal Evaluation

-   AI feedback
-   Reflection tracking
-   XP rewards

## ⏱ Focus Timer

-   Pomodoro sessions
-   XP tracking

------------------------------------------------------------------------

# 🧠 AI Architecture

``` mermaid
graph TD
A[React Frontend] --> B[Express API]
B --> C[Context Builder]
C --> D[Google Gemini]
C --> E[Fallback Engine]
D --> F[Validators]
E --> F
F --> G[(MongoDB Cache)]
G --> A
```

# ☁️ Deployment

``` mermaid
graph LR
User --> V[Vercel Frontend]
V --> R[Render Backend]
R --> M[(MongoDB Atlas)]
R --> G[Google Gemini]
R --> O[Google OAuth]
```

# 🔐 Authentication Flow

``` mermaid
sequenceDiagram
User->>Frontend: Continue with Google
Frontend->>Backend: OAuth Request
Backend->>Google: Exchange Code
Google-->>Backend: User Profile
Backend->>MongoDB: Find/Create User
Backend-->>Frontend: JWT Cookie
Frontend->>Dashboard: Authenticated Access
```

# 🚀 Development Timeline

-   ✅ Phase 1 -- AI Foundation
-   ✅ Phase 2 -- Prompt Architecture
-   ✅ Phase 3 -- AI Mentor
-   ✅ Phase 4 -- Context Builder
-   ✅ Phase 5 -- AI Journal Evaluation
-   ✅ Phase 6 -- Dashboard Intelligence
-   ✅ Phase 7 -- AI Roadmap Generator
-   ✅ Phase 8 -- Smart Study Planner
-   ✅ Phase 9 -- Production Optimization & Deployment

# 📂 Project Structure

``` text
ScholarSync
├── backend
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   └── index.js
└── frontend
    ├── components
    ├── pages
    ├── store
    └── assets
```

# ⚙️ Environment Variables

  Variable               Description
  ---------------------- --------------------
  MONGODB_URI            MongoDB connection
  JWT_SECRET             JWT secret
  GEMINI_API_KEY         Gemini API
  FRONTEND_URL           Frontend URL
  GOOGLE_CLIENT_ID       OAuth client
  GOOGLE_CLIENT_SECRET   OAuth secret
  GOOGLE_REDIRECT_URI    OAuth callback

# ⚡ Production Optimizations

-   Parallel database queries
-   AI response caching
-   MongoDB indexing
-   Prompt optimization
-   Graceful fallback
-   Secure cookies
-   Dynamic OAuth redirects
-   Production CORS

# 🛡 Security

-   JWT Authentication
-   HTTP-only Cookies
-   Google OAuth
-   Input sanitization
-   Protected API routes

# 🔮 Future Roadmap

-   Mentor Portal
-   Voice AI
-   Mobile App
-   Team Study Rooms
-   Weekly Analytics
-   Push Notifications

# 👨‍💻 Author

**Aditya Talikoti**

B.Tech CSE (Cloud Computing)

MIT ADT University

GitHub: https://github.com/AdityaTalikoti

------------------------------------------------------------------------

## 📄 License

MIT License
