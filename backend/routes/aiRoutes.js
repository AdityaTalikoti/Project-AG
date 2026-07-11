import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { handleChat } from '../controllers/aiController.js';

const router = express.Router();

// Define endpoint POST /api/ai/chat (protected with authMiddleware)
router.post('/chat', authMiddleware, handleChat);

export default router;
