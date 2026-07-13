import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { handleChat, handleDashboardInsight } from '../controllers/aiController.js';
import {
  handleGetStudyPlan,
  handleRegenerateStudyPlan,
  handleToggleStudyPlanTask,
  handleRescheduleMissedMilestone
} from '../controllers/studyPlanController.js';

const router = express.Router();

// Define endpoints (protected with authMiddleware)
router.post('/chat', authMiddleware, handleChat);
router.get('/dashboard-insight', authMiddleware, handleDashboardInsight);

// Study Planner endpoints
router.get('/study-plan', authMiddleware, handleGetStudyPlan);
router.post('/regenerate-study-plan', authMiddleware, handleRegenerateStudyPlan);
router.post('/study-plan/task/toggle', authMiddleware, handleToggleStudyPlanTask);
router.post('/study-plan/reschedule', authMiddleware, handleRescheduleMissedMilestone);

export default router;
