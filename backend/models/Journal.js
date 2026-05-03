import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
  task: { type: String, required: true, minlength: 10 },
  idea: { type: String, required: true, minlength: 10 },
  aiFeedback: {
    match: { type: Boolean },
    feedback: { type: String },
    nextStep: { type: String }
  }
}, { timestamps: true });

export default mongoose.model('Journal', journalSchema);
