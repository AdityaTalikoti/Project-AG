import express from 'express';

const router = express.Router();

// Mock Auth endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Mock login
  res.json({
    token: 'mock-jwt-token',
    user: { id: 'user123', email, role: 'Student' }
  });
});

export default router;
