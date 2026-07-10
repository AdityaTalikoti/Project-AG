import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  duration: { type: Number, required: true }, // duration in seconds
}, { timestamps: true });

export default mongoose.model('FocusSession', focusSessionSchema);
