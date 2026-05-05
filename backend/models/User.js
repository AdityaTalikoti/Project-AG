import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  picture: { type: String, default: '' },
  role: { type: String, enum: ['Student', 'Mentor'], default: 'Student' },
  domain: { type: String },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
