# ScholarSync Mentor Portal — Final Implementation Plan

> **Execution Tracker** — Check off each task as you complete it. Work through phases sequentially. Each phase has its own Git branch and must pass its acceptance criteria before the next phase begins.

## Status Legend
- `[ ]` Not started
- `[~]` In progress  
- `[x]` Complete

---

## Non-Negotiable Rules (Apply Across ALL Phases)

- [ ] Each phase lives on its own Git branch (names listed per phase).
- [ ] Reuse the existing server-managed session authentication (HttpOnly cookie). No JWT re-introduction, no `jsonwebtoken`, no `JWT_SECRET`.
- [ ] All authorization enforced on the backend. Frontend guards are UX only.
- [ ] Never trust client-supplied `role`, `createdBy`, mentor ID, or ownership fields.
- [ ] Never expose credentials, tokens, or secrets in source code, bundles, logs, or reports.
- [ ] No hardcoded student data, statistics, or task content.
- [ ] Preserve existing student-facing functionality without regressions.
- [ ] Follow existing project conventions. No unnecessary new libraries.
- [ ] Inspect actual APIs, schemas, RTK Query tags, and security middleware before modifying.
- [ ] Run lint checks and relevant tests after each phase. Fix regressions before proceeding.
- [ ] Report branch name, files changed, implementation details, test/build results, and limitations at end of each phase.

---

## Phase 1 — Authentication and Role-Based Routing

**Branch:** `feature/mentor-portal-phase-1-auth`

### Tasks

#### App.jsx — Add mentor routes
- [ ] Import `MentorProtectedRoute` and mentor page components
- [ ] Add `/mentor-portal` route → `MentorDashboard`
- [ ] Add `/mentor-portal/tasks` route → `MentorTasksPage`
- [ ] Add `/mentor-portal/students` route → `MentorStudentsPage`
- [ ] Add `/mentor-portal/submissions` route → `MentorSubmissionsPage`
- [ ] Wrap all mentor routes in `MentorProtectedRoute`

#### Create `frontend/src/components/MentorProtectedRoute.jsx`
- [ ] Wait for existing session/user query to finish loading before making auth decisions
- [ ] Unauthenticated users → redirect to `/auth`
- [ ] Authenticated users with `role !== 'Mentor'` → redirect to `/dashboard`
- [ ] Do not create redirect loops
- [ ] Reuse existing auth state from Redux (`authSlice`) — no new auth calls

#### Modify `frontend/src/components/ProtectedRoute.jsx`
- [ ] If `user?.role === 'Mentor'` and path is under `/dashboard` → redirect to `/mentor-portal`
- [ ] Keep all existing student redirect logic intact

#### Modify `frontend/src/pages/AuthPage.jsx` — login success redirect
- [ ] After successful login: `if (user.role === 'Mentor') navigate('/mentor-portal'); else navigate('/dashboard');`
- [ ] Keep existing logout, session restoration, and error handling unchanged

### Acceptance Criteria
- [ ] Mentor login → lands on `/mentor-portal`
- [ ] Student login → lands on `/dashboard`
- [ ] Direct navigation to `/mentor-portal/*` without auth → redirected to `/auth`
- [ ] Student cannot access mentor pages by URL manipulation
- [ ] Page refresh on a mentor route preserves session and correct routing
- [ ] Existing auth and logout flows still work

---

## Phase 2 — Mentor Layout and Dashboard

**Branch:** `feature/mentor-portal-phase-2-layout`

### Tasks

#### Create `frontend/src/mentor/mentor.css`
- [ ] Define CSS tokens (do not bleed into global styles):
  - `--mentor-primary: #7c3aed`
  - `--mentor-accent: #a78bfa`
  - `--mentor-surface: #1e1b2e`
  - `--mentor-border: #2d2a45`
- [ ] Use ScholarSync's existing typography, spacing, and responsive conventions
- [ ] Support existing light/dark theme behaviour where applicable
- [ ] Confirm it does not override or duplicate student-page styles

#### Create `frontend/src/mentor/MentorLayout.jsx`
- [ ] Collapsible sidebar with nav items using Lucide icons:
  - `LayoutDashboard` → `/mentor-portal`
  - `ClipboardList` → `/mentor-portal/tasks`
  - `Users` → `/mentor-portal/students`
  - `FileCheck` → `/mentor-portal/submissions`
  - `LogOut` → calls existing session logout endpoint
- [ ] Topbar: mentor name, avatar, "Mentor" role badge
- [ ] Active nav state highlights correct item
- [ ] `<Outlet />` for nested pages
- [ ] Mobile-responsive sidebar behavior

#### Create page shells (full logic added in later phases)
- [ ] `frontend/src/mentor/MentorDashboard.jsx` — stat card shells + loading/empty/error states
- [ ] `frontend/src/mentor/MentorTasksPage.jsx` — shell with placeholder
- [ ] `frontend/src/mentor/MentorStudentsPage.jsx` — shell with placeholder
- [ ] `frontend/src/mentor/MentorSubmissionsPage.jsx` — shell with placeholder

#### Dashboard Statistics (real data, no mocks)
- [ ] Inspect what existing APIs can provide before deciding on any new endpoint
- [ ] Total authorized students → from mentor-scoped student endpoint (Phase 3)
- [ ] Tasks assigned by current mentor → `GET /api/tasks` filtered `source === 'mentor'` and `createdBy === me`
- [ ] Pending submission reviews → new `/api/tasks/mentor/submissions` endpoint (Phase 3)
- [ ] Completed tasks → from task list filtered by `status === 'completed'`
- [ ] Show loading skeleton while data fetches
- [ ] Show empty state if no data
- [ ] Show error state if API fails

### Acceptance Criteria
- [ ] Sidebar navigation works on desktop and mobile
- [ ] Active nav state is correct on each route
- [ ] Logout uses existing session logout mechanism
- [ ] All statistics derived from real authorized API data
- [ ] Loading, empty, and error states handled on dashboard
- [ ] Student pages are unaffected

---

## Phase 3 — Backend Authorization and Mentor-Scoped APIs

**Branch:** `feature/mentor-portal-phase-3-scoped-apis`

### Pre-Implementation Audit (Do This First)
- [ ] Read `backend/routes/tasks.js` end-to-end
- [ ] Read `backend/models/Task.js` — confirm actual field names and enums
- [ ] Read `backend/models/TaskSubmission.js` — confirm actual field names and status values
- [ ] Read `backend/middleware/auth.js` — confirm how `req.user` is populated
- [ ] Read `backend/models/User.js` — verify whether a `mentorId` field exists on students
- [ ] Document findings: what student-mentor relationship actually exists in the DB
- [ ] Identify any route-order conflicts (e.g., `/:id` catching `/mentor/submissions`)

### Backend Authorization Enforcement
- [ ] Only authenticated users with `role === 'Mentor'` can perform mentor-only operations (verify server-side)
- [ ] `GET /api/tasks` — mentor sees only tasks where `createdBy === req.user.id AND source === 'mentor'`
- [ ] Task ownership set from `req.user.id` (authenticated session), never from request body
- [ ] A mentor can only assign tasks to students authorized under them
- [ ] A mentor can retrieve/review submissions only for their own tasks
- [ ] Students cannot access mentor-only endpoints
- [ ] Invalid ObjectIds return 400; unauthorized access returns 403 (no resource details leaked)
- [ ] All existing student task and submission permissions preserved

### Student-to-Mentor Relationship
- [ ] Verify whether `User.mentorId` field already exists and is populated
- [ ] If no reliable relationship exists: implement the **minimum** server-managed association needed
  - Add `mentorId` field to `User` schema if missing
  - Provide assignment endpoint (admin/mentor-only) — never let users self-assign
  - Add backward-compatibility handling (null `mentorId` = unassigned)
- [ ] Document any schema changes made
- [ ] `GET /api/tasks/students` — must return **only** students assigned to the requesting mentor, not all students

### New Endpoint: `GET /api/tasks/mentor/submissions`
- [ ] **Register this route BEFORE `/:id` and `/:id/submissions` in the route file**
- [ ] Fetch all tasks where `createdBy === req.user.id AND source === 'mentor'`
- [ ] Fetch `TaskSubmission` documents for those task IDs only
- [ ] Populate: `submittedBy` (name, email, picture), `task` (title, dueDate, priority, status)
- [ ] Return only fields needed — do not over-expose student data
- [ ] Use actual schema field names and status values
- [ ] Verify `mentor` string cannot be mistaken as an ObjectId by other routes

### RTK Query Update
- [ ] Add `getMentorSubmissions` query to `frontend/src/store/apiSlice.js`
- [ ] Add `'MentorSubmission'` tag or reuse `'TaskSubmission'` tag consistently
- [ ] Add appropriate `invalidatesTags` on `reviewSubmission` mutation
- [ ] Export `useGetMentorSubmissionsQuery` hook

### Acceptance Criteria
- [ ] Mentor A cannot retrieve, delete, or review Mentor B's tasks or submissions
- [ ] A student cannot escalate to mentor by modifying the request body
- [ ] A mentor cannot assign tasks to students not under their supervision
- [ ] Existing student APIs continue to work unchanged
- [ ] `/api/tasks/mentor/submissions` resolves correctly (not caught by `/:id`)
- [ ] ID validation prevents `mentor` string from being processed as an ObjectId

---

## Phase 4 — Task Assignment and Management

**Branch:** `feature/mentor-portal-phase-4-tasks`

### Pre-Implementation
- [ ] Re-read `backend/routes/tasks.js` POST handler to confirm exact accepted fields
- [ ] Verify whether `timeLimit` / `expiresAt` logic is actually implemented in the backend
- [ ] Confirm RTK Query hook signatures: `useCreateTaskMutation`, `useGetTasksQuery`, `useGetStudentsQuery`, `useDeleteTaskMutation`

### Implement `frontend/src/mentor/MentorTasksPage.jsx`

#### Task List / Table
- [ ] Fetch tasks with `useGetTasksQuery()` — filter to `source === 'mentor'` client-side (backend already scopes by session)
- [ ] Display columns: Title | Assigned To | Due Date | Priority | Status | Actions
- [ ] Status badges with appropriate colors:
  - `pending` → Amber
  - `submitted` → Blue
  - `needs_revision` → Orange
  - `completed` → Green
  - `expired` → Red (only if backend actually supports this status)
- [ ] Delete action — only shown if user is creator; calls `useDeleteTaskMutation`
- [ ] Empty state when no tasks exist
- [ ] Error state if fetch fails
- [ ] Loading skeleton while fetching

#### Assign Task Modal / Slide-Over
- [ ] "Assign New Task" button opens panel
- [ ] Form fields:
  - **Title*** — text input, required
  - **Description** — textarea
  - **Assign To*** — dropdown populated from `useGetStudentsQuery()` (Phase 3 ensures this is mentor-scoped)
  - **Due Date** — date picker
  - **Priority** — Low / Medium / High toggle
  - **Time Limit (hrs)** — only if backend confirms support for `timeLimit` field
- [ ] Form validation with inline error messages
- [ ] Submit calls `useCreateTaskMutation({ ..., source: 'mentor' })`
- [ ] Server sets `createdBy` from session — client does NOT send `createdBy`
- [ ] On success: close modal, invalidate `Task` cache
- [ ] On error: show error message, keep modal open
- [ ] Pending state: disable submit button with loading indicator

### Acceptance Criteria
- [ ] Mentor can assign a task and it appears in the list immediately
- [ ] Mentor cannot delete another mentor's task (backend enforces; UI reflects)
- [ ] Student dropdown only shows authorized students
- [ ] Form validation prevents empty submissions
- [ ] RTK cache refreshes correctly after create/delete
- [ ] Student task workflow is unaffected

---

## Phase 5 — Submission Review

**Branch:** `feature/mentor-portal-phase-5-reviews`

### Pre-Implementation
- [ ] Read `PATCH /api/tasks/submissions/:submissionId/review` handler carefully
- [ ] Confirm accepted `action` values (is it `approve`/`reject` or something else?)
- [ ] Confirm whether feedback is required for `reject`
- [ ] Confirm `TaskSubmission` schema field names: `status`, `mentorFeedback`, `files`, `note`, `attemptNumber`
- [ ] Confirm Cloudinary file URL field name and structure
- [ ] Confirm status values: `pending_review`, `approved`, `rejected` (or `needs_revision`?)

### Implement `frontend/src/mentor/MentorSubmissionsPage.jsx`

#### Submission List
- [ ] Fetch with `useGetMentorSubmissionsQuery()` (from Phase 3)
- [ ] Group or filter by status (pending_review / approved / rejected)
- [ ] Each card displays (only fields that actually exist in the schema):
  - Student name + avatar/initials
  - Task title + priority badge
  - Submission date
  - Student note (if schema has `note` field)
  - Attempt number (if schema has `attemptNumber` field)
  - File attachments (only if Cloudinary URLs are actually stored and returned)
  - Current submission status badge
- [ ] Empty state when no submissions
- [ ] Error state if fetch fails
- [ ] Loading skeleton

#### Review Actions
- [ ] "Approve" button → calls `useReviewSubmissionMutation({ submissionId, action: 'approve' })`
- [ ] "Request Revision" button → opens feedback modal
- [ ] Feedback modal:
  - Textarea: mentor feedback (required if backend requires it for rejection)
  - Submit → `useReviewSubmissionMutation({ submissionId, action: 'reject', feedback })`
  - Cancel → close modal
- [ ] Disable action buttons if submission is not in `pending_review` state
- [ ] On success: invalidate `TaskSubmission`, `Task`, `DashboardStats` cache tags
- [ ] On error: show error message

#### File Attachments
- [ ] Display only if submission schema actually returns file data from Cloudinary
- [ ] Use actual stored `url` field — do not trust client-provided URLs
- [ ] Show file name and mime-type icon if available
- [ ] If upload/attachment is not implemented, add a visible "File attachments not yet available" note

### Acceptance Criteria
- [ ] Only owning mentor can review a submission (backend enforces)
- [ ] Approvals and revision requests persist correctly in DB
- [ ] Feedback validation works (required when needed)
- [ ] Attachment links point to real stored Cloudinary data
- [ ] Review status and dashboard counts stay consistent after actions
- [ ] Invalid state transitions are prevented

---

## Phase 6 — Students Overview

**Branch:** `feature/mentor-portal-phase-6-students`

### Pre-Implementation
- [ ] Confirm whether `GET /api/tasks/students` already scopes by mentor after Phase 3 changes
- [ ] Confirm available student fields: name, email, picture, domain, mentorId
- [ ] Confirm whether `domain` field exists on the User schema

### Implement `frontend/src/mentor/MentorStudentsPage.jsx`

#### Student Cards Grid
- [ ] Fetch students with `useGetStudentsQuery()` (Phase 3 ensures mentor-scoped)
- [ ] Each card shows:
  - Avatar (picture) or initials circle as fallback
  - Name + email
  - Domain badge (only if `domain` field exists on User)
  - Pending task count (derived from `useGetTasksQuery()` — filter by `assignedTo === student._id AND status === 'pending'`)
  - Completed task count (same source, `status === 'completed'`)
  - "Assign Task" button → navigate to `/mentor-portal/tasks` with student ID in state or query param
- [ ] Responsive grid layout (2-3 columns desktop, 1 column mobile)
- [ ] Loading skeleton while fetching
- [ ] Empty state when no students assigned
- [ ] Error state if fetch fails
- [ ] Do not expose unnecessary student fields (no password hashes, OTP data, etc.)

#### Assign Task Shortcut
- [ ] Pre-selects the student in the Assign Task form in `MentorTasksPage`
- [ ] Navigates to `/mentor-portal/tasks` with preselected student
- [ ] Uses same validation and authorization as normal task assignment

### Acceptance Criteria
- [ ] Only the mentor's own students are shown
- [ ] Task counts are accurate (not hardcoded)
- [ ] Assign Task shortcut works and pre-selects the student
- [ ] Missing avatars/domains handled gracefully
- [ ] Empty rosters and API failures handled
- [ ] No unnecessary student data exposed to frontend

---

## Phase 7 — Mentor Account Provisioning

**Branch:** `feature/mentor-portal-phase-7-provisioning`

> ⚠️ Do NOT add a public "I am a Mentor" checkbox that allows clients to submit `role: 'Mentor'`.

### Tasks

#### Backend — Harden Signup
- [ ] Read current `POST /api/auth/signup` handler in `backend/routes/auth.js`
- [ ] Confirm: does it currently accept and save `role` from the request body?
- [ ] If yes: add a server-side guard that **always forces role to `'Student'`** on public signup regardless of what the client sends
- [ ] Verify the fix with a test that sends `role: 'Mentor'` in a public signup request and confirms the saved role is `'Student'`

#### Secure Mentor Provisioning (pick the approach that matches the repo)
- [ ] Check if any admin/seed scripts or trusted provisioning process already exists
- [ ] **If no provisioning process exists**, document the following minimal secure options:
  - Option A: Manual DB seed (admin runs `db.users.updateOne({ email }, { $set: { role: 'Mentor' } })`)
  - Option B: Admin-only API endpoint (requires separate admin auth guard) — implement only if admin infrastructure exists
  - Option C: Invitation-token flow — server generates token, verifies expiry and permitted role before granting Mentor access (deferred to a future phase)
- [ ] Implement whichever option matches current repo infrastructure
- [ ] Document the chosen approach with instructions

#### Tests
- [ ] Test: public signup with `role: 'Mentor'` in body → saved role is `'Student'`
- [ ] Test: public signup with no role → saved role is `'Student'`
- [ ] Test: existing mentor account logs in → redirected to `/mentor-portal`

### Acceptance Criteria
- [ ] Public signup cannot produce a Mentor account via body tampering
- [ ] A secure way to provision mentor accounts is documented and implemented
- [ ] No privilege escalation path exists through the public API

---

## Phase 8 — Verification and Final Regression Pass

**Branch:** `feature/mentor-portal-phase-8-verification`

### Manual Workflow Tests
- [ ] Mentor login, page refresh, navigation between all mentor routes, logout
- [ ] Student login and all existing student functionality (dashboard, roadmap, calendar, tasks, focus timer, journal)
- [ ] Direct URL navigation to `/mentor-portal/*` while unauthenticated → redirected to `/auth`
- [ ] Student navigating to `/mentor-portal/*` → redirected to `/dashboard`
- [ ] Mentor task creation, listing, deletion
- [ ] Attempting to assign a task to a student not under this mentor → rejected by backend
- [ ] Submission viewing, approval, and revision request
- [ ] Cross-mentor access: Mentor B tries to retrieve Mentor A's tasks/submissions by guessing IDs → 403
- [ ] Public signup with `role: 'Mentor'` in payload → stored as `Student`
- [ ] Empty states: mentor with no students, no tasks, no submissions
- [ ] Expired session refresh behavior

### Security Checks
- [ ] No JWT code or `JWT_SECRET` dependency was introduced
- [ ] CORS and CSRF behaviour unchanged
- [ ] Session cookie settings unchanged
- [ ] No secrets or tokens in frontend bundle or console logs
- [ ] Authorization enforced server-side for all mentor operations

### Build and Lint
- [ ] `cd frontend && npm run lint` — zero errors
- [ ] `cd frontend && npm run build` — clean production build
- [ ] `cd backend && npm run lint` (if lint script exists) — zero errors
- [ ] Run existing test suites and confirm no regressions

### Final Report (fill in at completion)

| Item | Details |
|---|---|
| Phases completed | |
| Branch names | |
| Files created | |
| Files modified | |
| Schema changes | |
| New API endpoints | |
| Security tests run | |
| Build result | |
| Known limitations | |
| Deferred features | |

---

## New Files Summary

| File | Phase |
|---|---|
| `frontend/src/components/MentorProtectedRoute.jsx` | 1 |
| `frontend/src/mentor/mentor.css` | 2 |
| `frontend/src/mentor/MentorLayout.jsx` | 2 |
| `frontend/src/mentor/MentorDashboard.jsx` | 2 |
| `frontend/src/mentor/MentorTasksPage.jsx` | 4 |
| `frontend/src/mentor/MentorSubmissionsPage.jsx` | 5 |
| `frontend/src/mentor/MentorStudentsPage.jsx` | 6 |

## Modified Files Summary

| File | Phases | Change |
|---|---|---|
| `frontend/src/App.jsx` | 1 | Add `/mentor-portal/*` routes |
| `frontend/src/components/ProtectedRoute.jsx` | 1 | Redirect mentors to `/mentor-portal` |
| `frontend/src/pages/AuthPage.jsx` | 1 | Role-based redirect after login |
| `backend/routes/tasks.js` | 3 | Scope task list, add `/mentor/submissions`, fix route order |
| `backend/models/User.js` | 3 | Add `mentorId` if not present (verify first) |
| `frontend/src/store/apiSlice.js` | 3 | Add `getMentorSubmissions` query and hook |
| `backend/routes/auth.js` | 7 | Force `role: 'Student'` on public signup |

---

*Last updated: 2026-10-13 | Active branch: feature/mentor-portal*
