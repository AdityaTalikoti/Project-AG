import express from 'express';

const router = express.Router();

router.get('/stats', (req, res) => {
  // Generate mock heatmap data (last 30 days for simplicity, though UI can handle more)
  const heatmap = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    const isActivity = Math.random() > 0.4;
    return {
      date: d.toISOString().split('T')[0],
      count: isActivity ? Math.floor(Math.random() * 4) + 1 : 0,
      score: isActivity ? Math.floor(Math.random() * 10) + 1 : 0
    };
  });

  res.json({
    success: true,
    data: {
      streak: 12,
      heatmap,
      mentorPinned: [
        { id: 1, text: "Review Big-O complexity for Trees", priority: "high" },
        { id: 2, text: "Complete Leetcode #235", priority: "medium" }
      ],
      peerPulse: [
        { id: 1, user: "Alex", action: "completed 'Binary Search Tree' task", time: "2h ago" },
        { id: 2, user: "Sarah", action: "started 'Dynamic Programming'", time: "4h ago" }
      ],
      aiInsight: "You've been consistent with Trees. Next logical step is Graphs. Try implementing BFS today."
    }
  });
});

export default router;
