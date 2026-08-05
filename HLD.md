# ScholarSync — High-Level Design (HLD)

## 1. System Overview & Architecture Goals

ScholarSync is designed as a distributed, modular, multi-tier web application built on the MERN stack (MongoDB, Express.js, React 19, Node.js) with Google Gemini integration. The system emphasizes high performance, low latency, robust offline resilience, and enterprise-grade security.

### Core Architectural Goals:
1. **Decoupled Client-Server Separation**: A React 19 single-page application (SPA) interacting with a RESTful Express.js API gateway.
2. **Context-Enriched AI Orchestration**: A service layer that aggregates user state across multiple MongoDB collections before invoking generative AI endpoints.
3. **Multi-Layer Response Caching**: MongoDB-backed caching with Time-To-Live (TTL) expiration and automated invalidation triggers.
4. **Graceful Fallback Resilience**: Rule-based fallback mechanisms ensuring 100% platform availability even during AI service outages.
5. **Secure Authentication & Token Management**: Stateless JWT authentication using HttpOnly, SameSite, Secure cookies.

---

## 2. High-Level System Component Topology

The diagram below illustrates the end-to-end architecture from the user browser through CDN hosting, Express API routes, internal AI services, cache documents, and database storage.

```mermaid
graph TB
    subgraph ClientLayer ["Client Layer (Browser)"]
        SPA["React 19 SPA"]
        RTK["Redux Toolkit + RTK Query"]
        ROUTER["React Router v6"]
        RECHARTS["Recharts Analytics"]
        SPA --> RTK
        SPA --> ROUTER
        SPA --> RECHARTS
    end

    subgraph HostingFrontend ["Frontend Hosting (Vercel Edge)"]
        CDN["Vercel Global CDN"]
        REWRITES["Vercel Edge Rewrites (/api/*)"]
        CDN --> REWRITES
    end

    subgraph BackendLayer ["Backend Layer (Node.js + Express - Render)"]
        GW["Express.js API Gateway"]
        CORS_MW["CORS & Cookie Parser"]
        AUTH_MW["JWT Auth Middleware"]
        ROUTES["API Routers (/api/*)"]
        CTRL["Controllers Layer"]
        SVC["Business Service Layer"]

        GW --> CORS_MW --> AUTH_MW --> ROUTES --> CTRL --> SVC
    end

    subgraph AISubsystem ["AI Orchestration Pipeline"]
        CTX_BUILDER["Context Builder"]
        GEMINI_SVC["Gemini AI Service (@google/genai)"]
        VALIDATOR["Response Validator"]
        FALLBACK_ENG["Offline Rule Fallback Engine"]
        CACHE_MGR["MongoDB AI Cache Engine"]

        CTX_BUILDER --> GEMINI_SVC
        CTX_BUILDER --> FALLBACK_ENG
        GEMINI_SVC --> VALIDATOR
        VALIDATOR --> CACHE_MGR
        FALLBACK_ENG --> CACHE_MGR
    end

    subgraph DataLayer ["Data & External Services Layer"]
        MONGO[("MongoDB Atlas Database")]
        GOOGLE_OAUTH["Google OAuth 2.0 Provider"]
        GEMINI_API["Google Gemini API Cloud"]
    end

    SPA -->|REST API Over HTTPS with Credentials| GW
    SVC --> CTX_BUILDER
    SVC --> MONGO
    CACHE_MGR --> MONGO
    GEMINI_SVC -->|HTTPS Inference| GEMINI_API
    AUTH_MW -->|Token Exchange| GOOGLE_OAUTH
```

---

## 3. Subsystem Architecture & Data Flow

### 3.1. Authentication Subsystem
ScholarSync supports two parallel login flows:
1. **Email / Password Flow**: Passwords are hashed with `bcryptjs` (salt round 12).
2. **Google OAuth 2.0 Flow**: Handled via server-side authorization code exchange (`/api/auth/google/callback`).

Tokens are signed using `jsonwebtoken` and issued via `res.cookie('token', token, cookieOptions)`:
- `httpOnly: true` (Inaccessible to JavaScript, preventing XSS token theft)
- `secure: isProduction` (Requires HTTPS)
- `sameSite: 'none'` (In production for cross-site Vercel-to-Render communication) or `'lax'`

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant SPA as React Frontend
    participant GW as Express Gateway
    participant AuthMW as JWT Middleware
    participant UserDB as MongoDB (Users)
    participant OAuth as Google OAuth 2.0

    alt Direct Email/Password Auth
        Student->>SPA: Submit Login Form
        SPA->>GW: POST /api/auth/login
        GW->>UserDB: findOne({ email })
        UserDB-->>GW: User Document
        GW->>GW: bcrypt.compare(password, hash)
        GW-->>SPA: Set HTTP-Only Cookie + User Profile JSON
    else Google OAuth Flow
        Student->>SPA: Click "Continue with Google"
        SPA->>GW: Redirect /api/auth/google
        GW->>OAuth: Redirect to Consent Screen
        OAuth-->>GW: Return Authorization Code
        GW->>OAuth: POST /token (Exchange code for access token)
        OAuth-->>GW: Return Access Token
        GW->>OAuth: GET /userinfo (Fetch Google profile)
        OAuth-->>GW: Return profile (email, name, picture, googleId)
        GW->>UserDB: findOneAndUpdate (Upsert user)
        UserDB-->>GW: Saved User
        GW-->>SPA: Set HTTP-Only Cookie & Redirect to /dashboard
    end

    Note over SPA,GW: Subsequent Requests
    SPA->>GW: GET /api/user/me (Cookie attached automatically)
    GW->>AuthMW: Verify JWT Token Signature & Expiry
    AuthMW-->>GW: Attach req.user payload
    GW-->>SPA: Return 200 OK + Profile Data
```

---

### 3.2. AI Multi-Layer Caching & Fallback Pipeline

To minimize latency, optimize API quota costs, and ensure zero-downtime reliability, ScholarSync implements a 4-stage AI pipeline:

1. **Context Assembly**: Pulls user goals, roadmap status, upcoming calendar events, and journal logs.
2. **Version Fingerprinting & Cache Lookup**: Computes a source version string based on `userId`, current date, and document counts/modification dates across models.
3. **Inference / Fallback Execution**: If cache is invalid or expired, executes Gemini inference (`gemini-2.5-flash` or `gemini-3.5-flash`). If Gemini fails or times out, invokes the local rule-based fallback engine.
4. **Validation & Cache Persistence**: Validates structure using schema validators (`validateRoadmapJSON`, `validateStudyPlanJSON`) and stores result in MongoDB with a 24-hour TTL.

```mermaid
flowchart TD
    A([User Action / Page Load]) --> B[Context Builder\nFetch student goals, roadmap, events, journals]
    B --> C[(Compute Data Signature\nsourceVersion fingerprint)]
    C --> D{Check MongoDB Cache\nby userId + sourceVersion + TTL}
    
    D -->|Cache Hit & Valid| E[Return Cached AI Response\n0ms Gemini Overhead]
    D -->|Cache Miss or Expired| F[Assemble Prompt with System Directives]
    
    F --> G[POST to Google Gemini API\ngemini-2.5-flash]
    G --> H{Gemini Reachable?}
    
    H -->|Yes| I[Response Validator\nParse & validate JSON structure]
    I --> J{Valid Schema?}
    J -->|Yes| K[Store in MongoDB Cache\nSet 24h Expiry]
    J -->|No| L
    
    H -->|No / Timeout / 404| L[Rule-Based Offline Fallback Engine\nGenerate structured fallback response]
    
    K --> M([Deliver Response to Client])
    L --> M
```

---

### 3.3. Smart Study Planner Subsystem

The Smart Study Planner evaluates the student's daily calendar workload and missed milestones to generate an adaptive daily schedule.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant SPA as React Frontend
    participant API as Study Plan Controller
    participant CTX as Context Builder
    participant Cache as MongoDB Cache / DB
    participant AI as Gemini AI Service

    Student->>SPA: Open Dashboard / Study Planner
    SPA->>API: GET /api/ai/study-plan
    API->>Cache: Query StudyPlan collection for today's date
    alt Plan exists for today
        Cache-->>API: Today's StudyPlan document
        API-->>SPA: Return 200 OK (Instant)
    else Plan missing for today
        API->>CTX: buildStudyPlanContext(studentId)
        CTX->>Cache: Fetch active Roadmap, Calendar Events, & Journals
        Cache-->>CTX: User data documents
        CTX-->>API: Compiled Context Payload (workload status, missed milestones, isAhead)
        API->>AI: Generate study plan prompt
        alt Gemini Successful
            AI-->>API: Return JSON response
            API->>Cache: Upsert StudyPlan document (generatedBy: 'AI')
        else Gemini Unreachable
            API->>API: Trigger generateFallbackStudyPlan(context)
            API->>Cache: Upsert StudyPlan document (generatedBy: 'Fallback')
        end
        API-->>SPA: Return fresh StudyPlan JSON
    end
```

---

## 4. Database Architecture & Entity Model

ScholarSync utilizes MongoDB Atlas with Mongoose schemas. Collections feature indexes on `studentId`, `createdBy`, `startDateTime`, and compound index structures for performance.

### Data Model ER Diagram

```mermaid
erDiagram
    USER ||--o{ GOAL : "creates"
    USER ||--o{ ROADMAP : "owns"
    USER ||--o{ EVENT : "schedules"
    USER ||--o{ JOURNAL : "writes"
    USER ||--o{ FOCUS_SESSION : "logs"
    USER ||--o{ STUDY_PLAN : "receives"
    USER ||--o1 AI_INSIGHT : "caches"

    ROADMAP ||--o{ EVENT : "syncs milestones to"
    GOAL ||--o{ JOURNAL : "links to"

    USER {
        ObjectId _id PK
        string googleId
        string email
        string name
        string password
        string picture
        string role
        number dailyTarget
        date createdAt
    }

    GOAL {
        ObjectId _id PK
        ObjectId studentId FK
        string title
        string description
        string status
        array subTasks
    }

    ROADMAP {
        ObjectId _id PK
        ObjectId studentId FK
        string title
        string category
        string skillLevel
        string timeline
        number dailyCommitment
        boolean active
        array modules
        number completionPercentage
    }

    EVENT {
        ObjectId _id PK
        string title
        string description
        date startDateTime
        date endDateTime
        string category
        string color
        ObjectId createdBy FK
        ObjectId roadmapId FK
        boolean isRoadmapEvent
        string status
    }

    JOURNAL {
        ObjectId _id PK
        ObjectId studentId FK
        ObjectId goalId FK
        string task
        string idea
        object aiFeedback
    }

    FOCUS_SESSION {
        ObjectId _id PK
        ObjectId studentId FK
        number duration
        date createdAt
    }

    STUDY_PLAN {
        ObjectId _id PK
        ObjectId studentId FK
        date date
        array tasks
        array recommendations
        string workloadStatus
        string generatedBy
    }

    AI_INSIGHT {
        ObjectId _id PK
        ObjectId userId FK
        string summary
        date generatedAt
        date expiresAt
        string sourceVersion
    }
```

---

## 5. Security & Threat Mitigation Architecture

| Threat Vector | Mitigation Strategy | Implementation Details |
|---|---|---|
| **Cross-Site Scripting (XSS) Token Theft** | HttpOnly Cookies | JWT tokens stored exclusively in `HttpOnly` cookies, inaccessible to `document.cookie` or client JS. |
| **Cross-Site Request Forgery (CSRF)** | SameSite Cookies + Origin Validation | Cookies configured with `SameSite=lax` (or `SameSite=none` + `Secure` in cross-domain environments); Express CORS restricts origins to explicit frontend domain. |
| **NoSQL Query Injection** | Mongoose Schema Validation & Typing | Inputs are strongly typed via Mongoose schemas; explicit `typeof` checks in controllers prevent Object injection. |
| **Prompt Injection** | Input Sanitization Middleware | User inputs (`message`, `task`, `idea`) pass through `sanitizeInput()` stripping `<script>` and HTML tags before prompt building. |
| **Unauthenticated Route Access** | Centralized JWT Middleware | `authMiddleware` intercepts requests, validates signature against `process.env.JWT_SECRET`, and rejects unauthenticated traffic with `401 Unauthorized`. |
| **Data Leakage Between Users** | Ownership Scoping | All query operations enforce `studentId: req.user.id` or `createdBy: req.user.id` filtering. |

---

## 6. Infrastructure & Deployment Topology

```mermaid
graph LR
    subgraph ClientBrowser ["User Browser"]
        SPA["React 19 Application"]
    end

    subgraph VercelEdge ["Vercel Edge Network (Frontend)"]
        EDGE_CDN["Global Edge CDN"]
        STATIC_FILES["Static HTML/JS/CSS"]
        REWRITE_RULE["API Proxy Rules"]
        EDGE_CDN --> STATIC_FILES
        EDGE_CDN --> REWRITE_RULE
    end

    subgraph RenderPlatform ["Render Platform (Backend)"]
        EXPRESS_APP["Node.js + Express API Gateway"]
        HEALTH_CHECK["Health Endpoint (/api/health)"]
        EXPRESS_APP --- HEALTH_CHECK
    end

    subgraph ExternalCloud ["Cloud Services"]
        ATLAS[("MongoDB Atlas M0 Cluster")]
        GEMINI_CLOUD["Google Gemini Cloud"]
        GOOGLE_AUTH["Google OAuth Provider"]
    end

    SPA -->|HTTPS| EDGE_CDN
    REWRITE_RULE -->|HTTPS API Requests| EXPRESS_APP
    EXPRESS_APP -->|Mongoose TLS| ATLAS
    EXPRESS_APP -->|HTTPS REST| GEMINI_CLOUD
    EXPRESS_APP -->|HTTPS OAuth| GOOGLE_AUTH
```
