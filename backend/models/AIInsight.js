import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  summary: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now, required: true },
  expiresAt: { type: Date },
  sourceVersion: { type: String }
}, { timestamps: true });

export default mongoose.model('AIInsight', aiInsightSchema);
