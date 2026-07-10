import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Goal from '../models/Goal.js';

const router = express.Router();

router.get('/active', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    let goal = await Goal.findOne({ studentId, status: 'Active' });

    if (!goal) {
      // Create a default active goal for demo/starter purposes so the page isn't empty!
      goal = await Goal.create({
        studentId,
        title: "MERN Stack Mastery",
        description: "Master MongoDB, Express, React, and Node.js",
        status: "Active",
        subTasks: [
          { title: "Setup Express Server", completed: true },
          { title: "Design MongoDB Schema", completed: true },
          { title: "Implement Auth Middleware", completed: false },
          { title: "Build React Dashboard", completed: false },
          { title: "Integrate AI Service", completed: false }
        ]
      });
    }

    const completedTasksCount = goal.subTasks.filter(t => t.completed).length;
    const completionPercentage = goal.subTasks.length > 0
      ? Math.round((completedTasksCount / goal.subTasks.length) * 100)
      : 0;

    const roadmap = goal.subTasks.map((task, index) => {
      let status = "upcoming";
      if (task.completed) {
        status = "completed";
      } else if (index === completedTasksCount) {
        status = "current";
      }
      return {
        id: task._id,
        title: task.title,
        status
      };
    });

    res.json({
      success: true,
      data: {
        id: goal._id,
        title: goal.title,
        completionPercentage,
        roadmap
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
