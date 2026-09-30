import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import TaskSubmission from '../models/TaskSubmission.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const router = express.Router();

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, originalName, mimeType) => {
  return new Promise((resolve, reject) => {
    const folder = 'scholarsync/task-submissions';
    const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        format: mimeType === 'application/pdf' ? 'pdf' : undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

// ==========================================
// 1. POST /api/tasks/:id/submit — Submit task
// ==========================================
router.post('/:id/submit', authMiddleware, upload.array('files', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    // Verify files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one file is required for submission' });
    }

    // Get task
    const task = await Task.findById(id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const userId = req.user.id.toString();
    const assignedToId = task.assignedTo?._id?.toString();

    // Authorization: only assigned student can submit
    if (task.source !== 'mentor') {
      return res.status(403).json({ message: 'Only mentor-assigned tasks can be submitted' });
    }

    if (userId !== assignedToId) {
      return res.status(403).json({ message: 'Unauthorized: You are not assigned to this task' });
    }

    // Check if task is already completed
    if (task.status === 'completed') {
      return res.status(400).json({ message: 'This task has already been completed' });
    }

    // Critical: Check expiration on SERVER TIME
    if (task.expiresAt) {
      const now = new Date();
      if (now > task.expiresAt) {
        // Update task status to expired
        task.status = 'expired';
        await task.save();
        return res.status(400).json({ message: 'Task submission window has expired' });
      }
    }

    // Check if task is expired without being marked
    if (task.status === 'expired') {
      return res.status(400).json({ message: 'Task submission window has expired' });
    }

    // Count previous submissions to determine attempt number
    const previousSubmissions = await TaskSubmission.countDocuments({ task: id });
    const attemptNumber = previousSubmissions + 1;

    // Upload files to Cloudinary
    const uploadedFiles = [];
    try {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
        uploadedFiles.push({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
      }
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ message: 'Failed to upload files. Please try again.' });
    }

    // Create submission
    const submission = await TaskSubmission.create({
      task: task._id,
      submittedBy: userId,
      files: uploadedFiles,
      note: note ? note.trim() : '',
      status: 'pending_review',
      attemptNumber,
    });

    // Update task status to submitted
    task.status = 'submitted';
    await task.save();

    // Populate submission
    const populatedSubmission = await TaskSubmission.findById(submission._id)
      .populate('submittedBy', 'name email picture')
      .populate('task');

    res.status(201).json({
      success: true,
      data: populatedSubmission,
      message: 'Task submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting task:', error.message);
    
    // Handle multer errors
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('File too large')) {
      return res.status(400).json({ message: 'File size exceeds 10MB limit' });
    }

    res.status(500).json({ message: 'Server error while submitting task' });
  }
});

// ==========================================
// 2. GET /api/tasks/:id/submissions — Get submissions for a task
// ==========================================
router.get('/:id/submissions', authMiddleware, async (req, res) => {
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
    const assignedToId = task.assignedTo ? task.assignedTo.toString() : null;

    // Authorization: only task creator (mentor) or assigned student can view submissions
    if (userId !== createdById && userId !== assignedToId) {
      return res.status(403).json({ message: 'Unauthorized to view submissions for this task' });
    }

    const submissions = await TaskSubmission.find({ task: id })
      .populate('submittedBy', 'name email picture')
      .populate('reviewedBy', 'name email picture')
      .sort({ attemptNumber: -1 });

    res.json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error.message);
    res.status(500).json({ message: 'Server error while fetching submissions' });
  }
});

// ==========================================
// 3. PATCH /api/tasks/submissions/:submissionId/review — Review submission (Mentor only)
// ==========================================
router.patch('/submissions/:submissionId/review', authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { action, feedback } = req.body; // action: 'approve' or 'reject'

    if (!isValidObjectId(submissionId)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Valid action (approve or reject) is required' });
    }

    if (action === 'reject' && (!feedback || !feedback.trim())) {
      return res.status(400).json({ message: 'Feedback is required when rejecting a submission' });
    }

    const submission = await TaskSubmission.findById(submissionId).populate('task');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status !== 'pending_review') {
      return res.status(400).json({ message: 'This submission has already been reviewed' });
    }

    const task = await Task.findById(submission.task._id);
    if (!task) {
      return res.status(404).json({ message: 'Associated task not found' });
    }

    const userId = req.user.id.toString();
    const createdById = task.createdBy.toString();

    // Authorization: only the task creator (mentor) can review
    if (userId !== createdById) {
      return res.status(403).json({ message: 'Unauthorized: Only the task creator can review submissions' });
    }

    // Verify reviewer is a mentor
    const reviewer = await User.findById(userId);
    if (!reviewer || reviewer.role !== 'Mentor') {
      return res.status(403).json({ message: 'Unauthorized: Only mentors can review submissions' });
    }

    // Update submission based on action
    if (action === 'approve') {
      submission.status = 'approved';
      submission.reviewedBy = userId;
      submission.reviewedAt = new Date();
      submission.mentorFeedback = feedback ? feedback.trim() : 'Approved';
      
      // Update task status to completed
      task.status = 'completed';
    } else if (action === 'reject') {
      submission.status = 'rejected';
      submission.reviewedBy = userId;
      submission.reviewedAt = new Date();
      submission.mentorFeedback = feedback.trim();
      
      // Update task status to needs_revision
      task.status = 'needs_revision';
    }

    await submission.save();
    await task.save();

    const updatedSubmission = await TaskSubmission.findById(submission._id)
      .populate('submittedBy', 'name email picture')
      .populate('reviewedBy', 'name email picture')
      .populate('task');

    res.json({
      success: true,
      data: updatedSubmission,
      message: action === 'approve' ? 'Submission approved successfully' : 'Submission rejected',
    });
  } catch (error) {
    console.error('Error reviewing submission:', error.message);
    res.status(500).json({ message: 'Server error while reviewing submission' });
  }
});

export default router;
