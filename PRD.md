# ScholarSync — Product Requirements Document (PRD)

## 1. Product Overview

**ScholarSync** is an AI-powered student productivity platform designed to bridge the gap between learning goals, daily execution, and long-term consistency. Unlike conventional task managers or generic calendars, ScholarSync acts as a personalized academic mentor and schedule engine. Powered by Google Gemini and built on a MERN stack (MongoDB, Express.js, React 19, Node.js), ScholarSync converts high-level learning goals into structured, phase-by-phase roadmaps, dynamically adapts daily study schedules based on workload and missed milestones, evaluates reflective journal entries, and provides contextualized AI mentoring.

---

## 2. Product Objectives & Value Proposition

- **Structured Learning Paths**: Transform ambitious goals (e.g., MERN Stack, DSA, AI/ML) into actionable, phase-based milestones with subtopics, time estimates, and curated learning resources.
- **Context-Aware AI Guidance**: Provide students with an AI mentor that understands their active roadmap position, completed topics, recent reflection logs, and schedule constraints.
- **Adaptive Daily Study Planning**: Automatically balance daily workloads, recover missed milestones without overwhelming the student, and integrate reflection tasks.
- **High Consistency & Gamification**: Track focus time, reward completed tasks with XP, maintain streaks, and display a forgiving consistency health score.
- **Production-Grade Resilience**: Ensure uninterrupted user experience via aggressive MongoDB-backed response caching and rule-based offline fallback engines when external AI services are unreachable.

---

## 3. Target Audience & User Personas

| Persona | Description | Key Needs | Primary Features Used |
|---|---|---|---|
| **Undergraduate Student (Alex)** | B.Tech student juggling coursework, exams, and skill development | Structured daily schedule, deadline reminders, quick calendar management | Study Planner, Calendar, Focus Timer |
| **Self-Taught Developer (Priya)** | Transitioning to Web Development / MERN stack | Structured curriculum, resource recommendations, progress tracking | AI Roadmap Generator, XP Engine |
| **Placement Prep Candidate (Rahul)** | Preparing for competitive tech interviews & DSA | Conceptual doubt resolution, feedback on problem-solving approaches | AI Mentor, Journal Evaluation |

---

## 4. Key Feature Specifications

### 4.1. AI Roadmap Generator & Canvas
- **Interview Wizard**: 3-step onboarding wizard collecting target goal (preset tracks like MERN, DSA, AI/ML or custom), current experience level (Beginner, Intermediate, Advanced), daily commitment (30m, 60m, 120m), target completion date, preferred learning style, and existing prerequisites.
- **Structured Output**: AI generates 3–5 chronological milestone modules with descriptions, duration estimates, priority levels, subtopic arrays, and resource links.
- **Editable Preview Canvas**: Real-time interactive editor allowing students to rename modules, adjust durations/priorities, reorder steps via up/down controls, add custom milestones, or delete modules before saving.
- **AI Suggestion Engine**: Background auditor that analyzes customized roadmaps for sequencing errors (e.g., advanced topics before prerequisites) or unrealistic timelines, surfacing actionable tips/warnings.
- **Calendar Synchronization**: One-click integration that maps roadmap milestones directly onto the user's interactive calendar as color-coded event blocks.

### 4.2. AI Smart Study Planner
- **Daily Plan Generation**: Automatically compiles 2–4 prioritized study tasks every morning based on active roadmap modules and current calendar workload.
- **Workload Awareness**: Classifies calendar workload as *Light*, *Balanced*, or *Busy*, automatically scaling down study time on busy days.
- **Missed Milestone Recovery**: Detects overdue milestone events from the past 7 days and presents interactive adaptation recommendations (e.g., rescheduling missed topics to weekends).
- **Journal Task Integration**: Appends a daily 15-minute reflection task as the final checklist item.

### 4.3. Context-Aware AI Mentor Portal
- **System Prompt & Identity**: Acts as a professional academic mentor ("ScholarSync AI Mentor"). Adapts explanation depth to the student's experience level (analogy-rich for beginners, architectural/deep code for advanced).
- **Context Injection**: Pre-appends full student context (active goal, roadmap completion %, current milestone, calendar events for today/upcoming, and recent journal logs) to every message prompt before sending to Gemini.
- **Chat Interface**: Auto-scrolling chat window, typing indicators, auto-growing textarea, input sanitization against HTML/script injection, and chat history clear controls.

### 4.4. Journal Evaluation & Reflection Engine
- **Task-Idea Pair Submission**: Students log what task they completed and explain their approach/rationale (minimum 10 characters each).
- **Evaluation Service**: Analyzes the theoretical and practical connection between the task and idea, returning a match score (boolean), constructive feedback, and a concrete next step.
- **Gamification Rewards**: Awards +100 XP for journal submissions and +50 bonus XP for high-quality matched entries.

### 4.5. Focus Session Timer (Pomodoro / Long Session)
- **Timer Modes**: Supports 25-minute Pomodoro and 45-minute Long Session focus blocks, plus automatic 15-minute break transitions.
- **Background Throttling Protection**: Tracks time using absolute system wall-clock timestamps (`Date.now()`), avoiding JS interval drift when tabs are backgrounded.
- **UX Excellence**: Synthesizes a relaxing 4-note chord chime using the Web Audio API on session completion; features an ambient breathing ring animation and auto-hiding UI controls.
- **Midnight Splitting**: Automatically splits focus sessions that cross the midnight boundary into two distinct logs mapped to their respective calendar days.

### 4.6. Interactive Calendar Engine
- **Full CRUD Management**: Create, view, edit, and delete calendar events with category tags (`Study`, `Exam`, `Assignment`, `Interview`, `Meeting`, `Personal`), custom hex colors, start/end date-times, and status (`upcoming`, `completed`, `cancelled`).
- **Multiple Views**: Month grid (42-cell matrix), 7-day Week column view, and single-day Detailed Timeline view.
- **Roadmap Linkage**: Seamlessly links generated roadmap milestones with calendar events (`isRoadmapEvent: true`).

### 4.7. Gamification & Analytics Dashboard
- **Streak & Health Bar**: Tracks active daily streak and calculates a forgiving 30-day consistency score (0–100%) based on daily targets.
- **XP & Leveling System**: Computes student XP dynamically across focus sessions, journal logs, and roadmap milestones, unlocking progressive titles (e.g., *Explorer*, *Scholar*, *Senior*).
- **Analytics Charts**: Weekly focus hours area chart (with previous week comparison toggle) and 90-day activity heatmaps using Recharts.
- **Cached AI Dashboard Insight**: Surfaces a 3–5 sentence personalized summary on page load, served from MongoDB cache for instant page rendering.

### 4.8. User Authentication & Profile Security
- **Dual Authentication**: Standard Email/Password signup/login (with bcrypt password hashing) alongside Google OAuth 2.0 social login.
- **HTTP-Only JWT Cookies**: Issues stateless JSON Web Tokens stored exclusively in `HttpOnly`, `SameSite`, `Secure` cookies, removing token storage from `localStorage` to eliminate XSS risks.
- **Daily Target Configuration**: Allows students to customize their daily focus target (in minutes), updating consistency score benchmarks.

---

## 5. Non-Functional Requirements

### 5.1. Performance & Latency
- **Parallel Database Queries**: All dashboard queries execute concurrently via `Promise.all()`.
- **AI Response Caching**: AI insights and daily study plans are cached in MongoDB with TTL and version signatures, reducing redundant Gemini API calls.

### 5.2. Reliability & Resiliency
- **Offline Fallback Engine**: If Google Gemini is unreachable or API limits are hit, rule-based fallback engines generate structured study plans, fallback journal feedback, and preset roadmaps without showing error pages to the user.

### 5.3. Security & Data Protection
- **XSS Prevention**: Tokens stored in HTTP-only cookies; user inputs in chat and journals are sanitized against script and HTML injection.
- **Ownership Guards**: API routes verify user ownership (`req.user.id === resource.createdBy` or `studentId`) before returning or mutating documents.

---

## 6. Development & Deployment Topology

- **Frontend**: React 19 + Vite + Redux Toolkit (RTK Query) + Tailwind CSS, hosted on **Vercel Edge CDN**.
- **Backend**: Node.js + Express.js API Gateway, hosted on **Render / Railway**.
- **Database**: **MongoDB Atlas** M0 Cluster with indexed collections.
- **AI Engine**: **Google Gemini API** (`gemini-2.5-flash` with fallback to `gemini-3.5-flash` via `@google/genai`).
