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
  otp_attempts: { type: Number, default: 0 },
  reset_token_hash: { type: String },
  reset_token_expiry: { type: Date },
  phone: { type: String },
  dailyTarget: { type: Number, default: 60 },
}, { timestamps: true });

// Defense-in-depth: Automatically strip sensitive credentials from JSON serialization
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.otp_code;
    delete ret.otp_expiry;
    delete ret.otp_attempts;
    delete ret.reset_token_hash;
    delete ret.reset_token_expiry;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
