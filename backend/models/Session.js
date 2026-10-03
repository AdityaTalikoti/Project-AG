import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    isValid: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Defense-in-depth: Automatically strip tokenHash from JSON serialization
sessionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.tokenHash;
    delete ret.__v;
    return ret;
  },
});

// Automatic TTL cleanup index for MongoDB
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
