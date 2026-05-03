import express from 'express';

const router = express.Router();

router.get('/active', (req, res) => {
  res.json({
    success: true,
    data: {
      id: "goal-1",
      title: "MERN Stack Mastery",
      completionPercentage: 64,
      roadmap: [
        { id: 1, title: "Setup Express Server", status: "completed" },
        { id: 2, title: "Design MongoDB Schema", status: "completed" },
        { id: 3, title: "Implement Auth Middleware", status: "current" },
        { id: 4, title: "Build React Dashboard", status: "upcoming" },
        { id: 5, title: "Integrate AI Service", status: "upcoming" }
      ]
    }
  });
});

export default router;
