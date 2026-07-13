import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { handleChat, handleDashboardInsight } from '../controllers/aiController.js';

const router = express.Router();

// Define endpoints (protected with authMiddleware)
router.post('/chat', authMiddleware, handleChat);
router.get('/dashboard-insight', authMiddleware, handleDashboardInsight);

export default router;
