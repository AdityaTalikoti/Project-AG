import express from 'express';
import Journal from '../models/Journal.js';
import { evaluateJournal } from '../middleware/aiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { studentId, goalId, task, idea } = req.body;
    
    // Evaluate using AI Service Mock
    const aiFeedback = await evaluateJournal(task, idea);
    
    const journal = new Journal({
      studentId,
      goalId,
      task,
      idea,
      aiFeedback
    });
    
    // Skip saving to DB if MongoDB isn't connected yet (for demo purposes)
    // await journal.save();
    
    res.status(201).json({ success: true, data: journal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:studentId', async (req, res) => {
  try {
    // For demo purposes, returning mock data
    const mockData = [
      {
        id: '1',
        task: 'Built a binary search tree in C++',
        idea: 'To achieve O(log n) search time for our dataset',
        aiFeedback: { match: true, feedback: 'Great reasoning.', nextStep: 'Implement traversal' },
        createdAt: new Date().toISOString()
      }
    ];
    res.status(200).json({ success: true, data: mockData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
