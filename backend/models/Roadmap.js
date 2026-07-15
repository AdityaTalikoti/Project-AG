import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: String, default: '30 mins' },
  xpReward: { type: Number, default: 50 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  estimatedDuration: { type: String, default: '1 week' },
  status: { type: String, enum: ['locked', 'upcoming', 'in-progress', 'completed'], default: 'locked' },
  tasks: [taskSchema]
});

const roadmapSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  timeline: { type: String, default: '4 weeks' },
  dailyCommitment: { type: Number, default: 60 },
  active: { type: Boolean, default: true },
  modules: [moduleSchema],
  completionPercentage: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Roadmap', roadmapSchema);
