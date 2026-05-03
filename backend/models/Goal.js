import mongoose from 'mongoose';

const subTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const goalSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Active', 'Completed', 'Paused'], default: 'Active' },
  subTasks: [subTaskSchema]
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);
