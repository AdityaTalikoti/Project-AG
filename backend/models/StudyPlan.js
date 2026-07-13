import mongoose from 'mongoose';

const studyPlanTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const adaptationRecommendationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  actionType: {
    type: String,
    enum: ['reschedule', 'info'],
    default: 'info'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

const studyPlanSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  tasks: [studyPlanTaskSchema],
  recommendations: [adaptationRecommendationSchema],
  workloadStatus: {
    type: String,
    enum: ['Light', 'Balanced', 'Busy'],
    default: 'Balanced'
  },
  generatedBy: {
    type: String,
    enum: ['AI', 'Fallback'],
    default: 'AI'
  }
}, {
  timestamps: true
});

// Enforce unique plan per student per day
studyPlanSchema.index({ studentId: 1, date: 1 }, { unique: true });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
export default StudyPlan;
