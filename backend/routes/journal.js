import express from 'express';
import Journal from '../models/Journal.js';
import { evaluateJournal } from '../middleware/aiService.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { goalId, task, idea } = req.body;
    const studentId = req.user.id;
    
    // Evaluate using AI Service Mock
    const aiFeedback = await evaluateJournal(task, idea);
    
    const journal = new Journal({
      studentId,
      goalId: goalId || undefined,
      task,
      idea,
      aiFeedback
    });
    
    await journal.save();
    
    res.status(201).json({ success: true, data: journal });
  } catch (error) {
    console.error('Journal create error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating journal entry' });
  }
});

router.get('/:studentId', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Ensure the student can only access their own logs
    if (req.user.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const journals = await Journal.find({ studentId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: journals });
  } catch (error) {
    console.error('Journal fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching journal entries' });
  }
});

export default router;
