import mongoose, { Schema, Document } from 'mongoose';

export interface IReaction extends Document {
  targetType: 'chapter' | 'manga';
  targetId: string;
  reactionName: string;
  userId?: string; // Optional for anonymous users
  userIp?: string; // For anonymous users
  createdAt: Date;
}

const ReactionSchema = new Schema<IReaction>({
  targetType: {
    type: String,
    required: true,
    enum: ['chapter', 'manga']
  },
  targetId: {
    type: String,
    required: true
  },
  reactionName: {
    type: String,
    required: true,
    enum: ['love', 'funny', 'sad', 'shocked', 'fire']
  },
  userId: {
    type: String,
    required: false
  },
  userIp: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate reactions from same user/IP
ReactionSchema.index({ targetType: 1, targetId: 1, reactionName: 1, userId: 1 }, { unique: false });
ReactionSchema.index({ targetType: 1, targetId: 1, reactionName: 1, userIp: 1 }, { unique: false });

// Index for efficient queries
ReactionSchema.index({ targetType: 1, targetId: 1 });

// Static method to find reactions by target
ReactionSchema.statics.findByTarget = function(targetType: string, targetId: string, userId?: string, userIp?: string) {
  return this.aggregate([
    {
      $match: { targetType, targetId }
    },
    {
      $group: {
        _id: '$reactionName',
        count: { $sum: 1 },
        users: { $push: '$userId' },
        ips: { $push: '$userIp' }
      }
    },
    {
      $project: {
        _id: '$_id', // Keep original _id for compatibility
        name: '$_id', // Frontend expects 'name' field
        reactionName: '$_id',
        count: 1,
        users: 1,
        ips: 1,
        userReacted: {
          $cond: {
            if: { $ne: [userId, null] },
            then: { $in: [userId, '$users'] },
            else: { $in: [userIp, '$ips'] }
          }
        }
      }
    }
  ]);
};

// Interface for the model with static methods
interface IReactionModel extends mongoose.Model<IReaction> {
  findByTarget(targetType: string, targetId: string, userId?: string, userIp?: string): Promise<any[]>;
}

const ReactionModel = (mongoose.models.Reaction || mongoose.model<IReaction>('Reaction', ReactionSchema)) as IReactionModel;

export default ReactionModel;