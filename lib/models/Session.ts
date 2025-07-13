import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    browser: string;
    os: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    deviceName: string;
  };
  ipAddress: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  deviceInfo: {
    userAgent: { type: String, required: true },
    platform: { type: String, required: true },
    browser: { type: String, required: true },
    os: { type: String, required: true },
    deviceType: { 
      type: String, 
      enum: ['desktop', 'mobile', 'tablet'], 
      required: true 
    },
    deviceName: { type: String, required: true }
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    country: { type: String },
    city: { type: String },
    region: { type: String }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Index'ler
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ token: 1 }, { unique: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL index

const SessionModel: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default SessionModel;