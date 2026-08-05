# ScholarSync — Agent Guide (`agent.md`)

*Note: For the full detailed guide, see [AGENTS.md](file:///d:/Adi%20Folder/AG-Project/AGENTS.md).*

---

## Quick Repository Map

- 📄 **Product Requirements Document**: [PRD.md](file:///d:/Adi%20Folder/AG-Project/PRD.md)
- 🏗️ **High-Level Design & System Architecture**: [HLD.md](file:///d:/Adi%20Folder/AG-Project/HLD.md)
- 🔬 **Low-Level Design & API/Database Specifications**: [LLD.md](file:///d:/Adi%20Folder/AG-Project/LLD.md)
- 🗺️ **Comprehensive Agent Guide**: [AGENTS.md](file:///d:/Adi%20Folder/AG-Project/AGENTS.md)

---

## Core System Architecture & Rules

1. **Tech Stack**: React 19 + Vite (Port 5174), Express.js API Gateway (Port 8080), MongoDB Atlas (Mongoose), Redux Toolkit + RTK Query (`apiSlice.js`), Tailwind CSS v4, Google Gemini API (`@google/genai`).
2. **Authentication**: Stateless JWT stored in `HttpOnly` cookies (`token`). All client API calls must include `credentials: 'include'`.
3. **AI Layer Strategy**: Thin Controllers -> AI Services (`backend/services/ai/`) -> Context Builders -> Gemini (`gemini-2.5-flash` with `gemini-3.5-flash` fallback) -> JSON Validators -> MongoDB Caching (`AIInsight` / `StudyPlan`) -> Fallback Engines.
4. **Resilience Principle**: Never throw 500 or error pages on AI failure. Always fall back gracefully using offline rule engines (`generateFallbackStudyPlan`, preset roadmaps).
5. **Data Invalidation**: Frontend uses RTK Query tags (`DashboardStats`, `Event`, `StudyPlan`, `Journal`) for immediate UI synchronizations.
