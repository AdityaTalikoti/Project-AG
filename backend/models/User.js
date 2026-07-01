import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String }, // Optional — only for email/password users
  picture: { type: String, default: '' },
  role: { type: String, enum: ['Student', 'Mentor'], default: 'Student' },
  domain: { type: String },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  otp_code: { type: String },
  otp_expiry: { type: Date },
  phone: { type: String },
  dailyTarget: { type: Number },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
