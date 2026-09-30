import mongoose from 'mongoose';

const taskSubmissionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    files: [{
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      originalName: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
    }],
    note: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
    },
    mentorFeedback: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
taskSubmissionSchema.index({ task: 1, attemptNumber: -1 });
taskSubmissionSchema.index({ submittedBy: 1 });

export default mongoose.model('TaskSubmission', taskSubmissionSchema);
