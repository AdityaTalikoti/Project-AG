# Phase 2: Tasks Submission, Review, and Time Limits

## 🎯 Overview
Extends Phase 1 Tasks feature with complete submission/review workflow, file uploads, mentor feedback, time limit enforcement, and resubmission capability. Students can submit work (files + notes), mentors can review and provide feedback, and the system enforces time limits server-side.

**Builds on Phase 1:** `feature/tasks-mentor-assignment`

---

## ✨ Features Implemented

### Student Submission Workflow
- ✅ Upload files (images: JPEG, PNG, GIF, WEBP; PDFs)
- ✅ Add optional submission notes
- ✅ View countdown timer showing remaining time
- ✅ Submit before expiration
- ✅ Resubmit after mentor rejection (if not expired)
- ✅ View submission history with all attempts
- ✅ See mentor feedback on rejected submissions
- ✅ Cannot submit after time expires (enforced by backend)

### Mentor Review Workflow
- ✅ View student submissions with uploaded files
- ✅ Download/view submitted files (opens in new tab)
- ✅ Approve submissions → task marked completed
- ✅ Reject submissions with required feedback → task needs revision
- ✅ View all submission attempts and previous reviews
- ✅ Only review tasks they assigned (authorization enforced)

### Time Limit System
- ✅ Mentor sets time limit in hours when creating task
- ✅ Backend calculates `expiresAt` from server timestamp (not client)
- ✅ Real-time countdown displayed to student
- ✅ Visual warnings when time running low
- ✅ **Critical:** Backend enforces expiration regardless of client state
- ✅ Expired tasks show "Time Expired" status
- ✅ Submit button disabled after expiration

### File Management
- ✅ Cloudinary integration for scalable cloud storage
- ✅ Multiple file uploads (up to 5 files per submission)
- ✅ File type validation (images + PDF only)
- ✅ File size limit: 10MB per file
- ✅ File preview in submission modal
- ✅ File metadata stored (name, size, type, URL)
- ✅ Secure file URLs with public IDs

### Status Management
New task statuses added:
- `pending` - Initial state, no submission yet
- `submitted` - Student has submitted, awaiting mentor review
- `needs_revision` - Mentor rejected, student can resubmit
- `completed` - Mentor approved submission
- `expired` - Time limit passed, no more submissions allowed

### Submission History
- ✅ All attempts preserved (no overwrite)
- ✅ Each submission has attempt number
- ✅ View status: Pending Review, Approved, Rejected
- ✅ View mentor feedback for each attempt
- ✅ See submission timestamps
- ✅ Complete audit trail maintained

---

## 🔧 Technical Implementation

### Backend

**New Files:**
- `backend/models/TaskSubmission.js` - Submission model with files, status, feedback
- `backend/routes/taskSubmissions.js` - Submission CRUD and review endpoints
- `backend/middleware/upload.js` - Multer configuration for file uploads
- `backend/config/cloudinary.js` - Cloudinary setup for cloud storage
- `backend/.env.example` - Environment variables documentation

**Modified Files:**
- `backend/models/Task.js` - Added timeLimit, expiresAt, new statuses
- `backend/routes/tasks.js` - Added timeLimit support in task creation
- `backend/index.js` - Registered submission routes
- `backend/package.json` - Added multer and cloudinary dependencies

**API Endpoints:**
```
POST   /api/tasks/:id/submit              - Submit task with files
GET    /api/tasks/:id/submissions         - Get all submissions for task
PATCH  /api/tasks/submissions/:id/review  - Review submission (approve/reject)
```

**Key Backend Features:**
- Server-side expiration check: `if (now > expiresAt) reject()`
- Automatic attempt numbering for submissions
- File upload to Cloudinary with error handling
- Authorization checks on every endpoint
- MIME type and file size validation
- Proper error messages (no stack traces exposed)

### Frontend

**New Files:**
- `frontend/src/components/TaskSubmissionModal.jsx` - File upload modal
- `frontend/src/components/TaskReviewModal.jsx` - Mentor review modal
- `frontend/src/components/TaskViewModalEnhanced.jsx` - Task details with submissions

**Modified Files:**
- `frontend/src/pages/TasksPage.jsx` - Integrated Phase 2 features
- `frontend/src/store/apiSlice.js` - Added submission endpoints

**RTK Query Hooks:**
```javascript
useSubmitTaskMutation()
useGetTaskSubmissionsQuery(taskId)
useReviewSubmissionMutation()
```

**UI Enhancements:**
- Real-time countdown timer updates every minute
- Status badges with color coding
- File upload preview with drag-drop
- Submission history timeline
- Mentor feedback display
- Time warnings (red when expired, amber when low)

---

## 🔒 Authorization & Security

### Authorization Matrix
| Action | Student (Assigned) | Mentor (Creator) | Other Users |
|--------|-------------------|------------------|-------------|
| Submit Task | ✅ Yes (before expiry) | ❌ No | ❌ No |
| View Submissions | ✅ Own only | ✅ For assigned tasks | ❌ No |
| Review Submission | ❌ No | ✅ Own tasks only | ❌ No |
| Resubmit (needs_revision) | ✅ Yes (if not expired) | ❌ No | ❌ No |

### Security Features
- ✅ JWT authentication on all routes
- ✅ Task ownership verification
- ✅ Student can only submit to assigned tasks
- ✅ Mentor can only review own tasks
- ✅ **Critical:** Expiration enforced on server timestamp
- ✅ File type validation (prevent executable uploads)
- ✅ File size limits enforced
- ✅ Input validation (feedback required for reject)
- ✅ No sensitive data in error messages

### Expiration Enforcement
**Server-Side (Authority):**
```javascript
const now = new Date(); // Server time
if (now > task.expiresAt) {
  task.status = 'expired';
  return res.status(400).json({ message: 'Task submission window has expired' });
}
```

**Client-Side (Display Only):**
- Countdown timer for UX
- Disabled submit button
- Visual "Time Expired" warning
- **BUT:** Backend always has final say

---

## 📊 Database Schema

### TaskSubmission Model
```javascript
{
  task: ObjectId (ref: Task),
  submittedBy: ObjectId (ref: User),
  files: [{
    url: String,
    publicId: String,
    originalName: String,
    mimeType: String,
    size: Number
  }],
  note: String,
  status: 'pending_review' | 'approved' | 'rejected',
  mentorFeedback: String,
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  attemptNumber: Number,
  timestamps: true
}
```

### Task Model (Updated)
```javascript
{
  // ... existing Phase 1 fields ...
  timeLimit: Number, // in hours
  status: 'pending' | 'submitted' | 'needs_revision' | 'completed' | 'expired'
}
```

---

## 🔄 Complete Workflows

### Successful Submission Flow
```
1. Mentor creates task with 24-hour time limit
   ↓
2. Backend calculates: expiresAt = assignedAt + 24 hours
   ↓
3. Student sees task with "23h 58m remaining"
   ↓
4. Student clicks "Submit Task"
   ↓
5. Student uploads files + adds note
   ↓
6. Files uploaded to Cloudinary
   ↓
7. TaskSubmission created (attempt #1, status: pending_review)
   ↓
8. Task status → 'submitted'
   ↓
9. Mentor sees "Awaiting Review" badge
   ↓
10. Mentor clicks "Review Submission"
   ↓
11. Mentor views files and note
   ↓
12. Mentor clicks "Approve" (optional feedback)
   ↓
13. Submission status → 'approved'
   ↓
14. Task status → 'completed'
   ↓
15. Student sees "Completed" badge ✅
```

### Rejection & Resubmission Flow
```
1. Student submits (attempt #1)
   ↓
2. Mentor rejects with feedback
   ↓
3. Submission status → 'rejected'
   ↓
4. Task status → 'needs_revision'
   ↓
5. Student sees feedback in task details
   ↓
6. Student clicks "Resubmit Task" (if not expired)
   ↓
7. Student uploads corrected work
   ↓
8. New TaskSubmission created (attempt #2)
   ↓
9. Both attempts visible in history
   ↓
10. Mentor reviews attempt #2
   ↓
11. Mentor approves
   ↓
12. Task status → 'completed' ✅
```

### Expiration Flow
```
1. Task assigned with 1-hour time limit
   ↓
2. Student procrastinates
   ↓
3. 1 hour passes
   ↓
4. Backend: expiresAt < now
   ↓
5. Student sees "Time Expired" warning
   ↓
6. Submit button disabled
   ↓
7. Student attempts direct API call
   ↓
8. Backend: if (now > expiresAt) reject()
   ↓
9. Response: "Task submission window has expired"
   ↓
10. Task status → 'expired'
   ↓
11. No more submissions possible ❌
```

---

## 🧪 Testing Performed

### Manual Testing Completed
✅ **Submission Flow:**
- Create task with time limit
- Student submits files before expiry
- Files uploaded successfully to Cloudinary
- Submission created with correct attempt number

✅ **Review Flow:**
- Mentor views submission
- Files downloadable and viewable
- Approve workflow: task → completed
- Reject workflow: task → needs_revision, feedback saved

✅ **Resubmission:**
- Student sees rejection feedback
- Student resubmits (attempt #2)
- Previous submission preserved
- New submission pending review

✅ **Expiration:**
- Task shows countdown timer
- Timer updates in real-time
- After expiry: submit button disabled
- After expiry: backend rejects submission
- Manual API call after expiry: rejected

✅ **Authorization:**
- Student cannot submit unassigned task (403)
- Student cannot review submissions (403)
- Mentor cannot review others' tasks (403)
- Unauthenticated requests blocked (401)

✅ **File Handling:**
- Image uploads work (JPEG, PNG, GIF, WEBP)
- PDF uploads work
- File size validation (10MB limit)
- Invalid file types rejected
- Multiple files upload correctly

✅ **Edge Cases:**
- Submission during expiry window (race condition)
- Multiple rapid submissions blocked
- Review of already-reviewed submission blocked
- Empty feedback on rejection rejected

### Integration Testing
✅ Phase 1 features still work:
- Self tasks CRUD functional
- Task assignment functional
- Phase 1 authorization intact

✅ Cache invalidation works:
- After submission: tasks refresh
- After review: tasks and submissions refresh
- No stale data displayed

---

## 🚫 Breaking Changes

**None.** Phase 2 is fully additive and backward-compatible with Phase 1.

Existing Phase 1 tasks continue to work:
- Self tasks unaffected
- Phase 1 mentor tasks (no time limit) work normally
- Phase 1 status (pending/completed) still valid

---

## 📝 Configuration Required

### Backend Environment Variables
Add to `backend/.env`:
```env
# Cloudinary Configuration (required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**How to get Cloudinary credentials:**
1. Sign up at https://cloudinary.com (free tier available)
2. Navigate to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Add to `.env` file

**Note:** Without Cloudinary credentials, file uploads will fail. All other features work normally.

---

## 📦 Dependencies Added

```json
{
  "multer": "^1.4.5-lts.1",
  "cloudinary": "^2.5.1"
}
```

**Why these dependencies:**
- `multer` - Standard Node.js middleware for handling multipart/form-data (file uploads)
- `cloudinary` - Cloud storage for scalable file hosting (better than local file system)

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Add Cloudinary credentials to environment variables
- [ ] Test file uploads in production environment
- [ ] Verify expiration timestamps use server time (not client)
- [ ] Test with users in different timezones
- [ ] Monitor Cloudinary usage (free tier limits)
- [ ] Set up error monitoring for file upload failures
- [ ] Verify file type and size restrictions work
- [ ] Test concurrent submissions don't create race conditions
- [ ] Ensure proper CORS for Cloudinary URLs

---

## 📚 Files Changed Summary

### Added (10 files)
- `backend/models/TaskSubmission.js`
- `backend/routes/taskSubmissions.js`
- `backend/middleware/upload.js`
- `backend/config/cloudinary.js`
- `backend/.env.example`
- `frontend/src/components/TaskSubmissionModal.jsx`
- `frontend/src/components/TaskReviewModal.jsx`
- `frontend/src/components/TaskViewModalEnhanced.jsx`

### Modified (5 files)
- `backend/models/Task.js`
- `backend/routes/tasks.js`
- `backend/index.js`
- `backend/package.json` + `package-lock.json`
- `frontend/src/pages/TasksPage.jsx`
- `frontend/src/store/apiSlice.js`

**Total:** ~1,500 lines of code added

---

## 🎉 Ready for Review

**Key Review Points:**
1. **Backend:** Verify expiration is enforced on server timestamp
2. **Security:** Check authorization on submission/review endpoints
3. **Frontend:** Test submission and review modals
4. **Files:** Verify file uploads work with valid Cloudinary credentials
5. **UX:** Check countdown timer and status badges

---

## 👥 Testing Instructions

**As Student:**
1. Login to student account
2. Go to Tasks page
3. View mentor-assigned task with time limit
4. See countdown timer
5. Click task to view details
6. Click "Submit Task"
7. Upload image/PDF files
8. Add optional note
9. Submit before expiry
10. Wait for mentor review

**As Mentor:**
1. Login to mentor account
2. Go to Tasks page
3. Create task with time limit (e.g., 1 hour)
4. Assign to student
5. Wait for student submission
6. See "Awaiting Review" badge
7. Click task to view
8. Click "Review Submission"
9. View uploaded files
10. Approve or Reject with feedback

**Test Expiration:**
1. Create task with 1-minute time limit (for testing)
2. Wait 1 minute
3. Verify "Time Expired" shows
4. Verify submit button disabled
5. Try submitting via API (should be rejected)

---

**Phase 2 complete and ready for production! 🚀**
