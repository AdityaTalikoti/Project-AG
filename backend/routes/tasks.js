import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// 1. GET /api/tasks — Retrieve tasks for current user
// ==========================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Retrieve tasks where user is creator OR assigned user
    const tasks = await Task.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    })
      .populate('createdBy', 'name email picture role')
      .populate('assignedTo', 'name email picture role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

// ==========================================
// 2. GET /api/tasks/students — List available students (for Mentor assignment)
// ==========================================
router.get('/students', authMiddleware, async (req, res) => {
  try {
    // Return all students
    const students = await User.find({ role: 'Student' })
      .select('name email picture domain mentorId')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching students:', error.message);
    res.status(500).json({ message: 'Server error while fetching students' });
  }
});

// ==========================================
// 3. GET /api/tasks/:id — Get task details by ID
// ==========================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id)
      .populate('createdBy', 'name email picture role')
      .populate('assignedTo', 'name email picture role');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const userId = req.user.id.toString();
    const createdById = task.createdBy?._id?.toString() || task.createdBy?.toString();
    const assignedToId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();

    // Authorization check
    if (userId !== createdById && userId !== assignedToId) {
      return res.status(403).json({ message: 'Unauthorized access to this task' });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error fetching task details:', error.message);
    res.status(500).json({ message: 'Server error while fetching task details' });
  }
});

// ==========================================
// 4. POST /api/tasks — Create a new task (Self or Mentor)
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, dueDate, priority, source, assignedTo } = req.body;

    // Validation: title is required
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const taskSource = source === 'mentor' ? 'mentor' : 'self';

    // Mentor task validation & authorization
    if (taskSource === 'mentor') {
      const currentUser = await User.findById(req.user.id);
      if (!currentUser || currentUser.role !== 'Mentor') {
        return res.status(403).json({ message: 'Unauthorized: Only mentors can assign mentor tasks' });
      }

      if (!assignedTo || !isValidObjectId(assignedTo)) {
        return res.status(400).json({ message: 'Valid student ID (assignedTo) is required for mentor tasks' });
      }

      const targetStudent = await User.findById(assignedTo);
      if (!targetStudent) {
        return res.status(404).json({ message: 'Target student not found' });
      }

      const newTask = await Task.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        source: 'mentor',
        createdBy: req.user.id,
        assignedTo: targetStudent._id,
        assignedAt: new Date(),
        status: 'pending',
      });

      const populatedTask = await Task.findById(newTask._id)
        .populate('createdBy', 'name email picture role')
        .populate('assignedTo', 'name email picture role');

      return res.status(201).json({
        success: true,
        data: populatedTask,
      });
    }

    // Self task creation
    const newTask = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      source: 'self',
      createdBy: req.user.id,
      assignedTo: null,
      status: 'pending',
    });

    const populatedTask = await Task.findById(newTask._id)
      .populate('createdBy', 'name email picture role')
      .populate('assignedTo', 'name email picture role');

    return res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).json({ message: 'Server error while creating task' });
  }
});

// ==========================================
// 5. PATCH /api/tasks/:id — Update task (details or status)
// ==========================================
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const userId = req.user.id.toString();
    const createdById = task.createdBy.toString();
    const assignedToId = task.assignedTo ? task.assignedTo.toString() : null;

    const isCreator = userId === createdById;
    const isAssignedUser = userId === assignedToId;

    if (!isCreator && !isAssignedUser) {
      return res.status(403).json({ message: 'Unauthorized to update this task' });
    }

    // If user is creator, they can edit all fields
    if (isCreator) {
      if (title !== undefined) {
        if (!title.trim()) return res.status(400).json({ message: 'Task title cannot be empty' });
        task.title = title.trim();
      }
      if (description !== undefined) task.description = description.trim();
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
      if (priority && ['low', 'medium', 'high'].includes(priority)) task.priority = priority;
      if (status && ['pending', 'completed'].includes(status)) task.status = status;
    } else if (isAssignedUser) {
      // Assigned student on mentor task CANNOT change status
      // Status will be changed through submission/approval workflow in Phase 2
      return res.status(403).json({ 
        message: 'Students cannot modify mentor-assigned tasks. Task completion requires mentor approval.' 
      });
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email picture role')
      .populate('assignedTo', 'name email picture role');

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    console.error('Error updating task:', error.message);
    res.status(500).json({ message: 'Server error while updating task' });
  }
});

// ==========================================
// 6. DELETE /api/tasks/:id — Delete task (Creator only)
// ==========================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const userId = req.user.id.toString();
    const createdById = task.createdBy.toString();

    // Authorization: only the creator can delete the task
    if (userId !== createdById) {
      return res.status(403).json({ message: 'Unauthorized: Only the task creator can delete this task' });
    }

    await Task.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error.message);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
});

export default router;
