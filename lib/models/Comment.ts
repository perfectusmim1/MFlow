import mongoose, { Schema, Document, Model } from 'mongoose';
import './User'; // User model'ini import et

export interface IComment extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  mangaId?: mongoose.Types.ObjectId;
  chapterId?: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[];
  dislikes: mongoose.Types.ObjectId[];
  replies: mongoose.Types.ObjectId[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  addLike(userId: string): Promise<IComment>;
  removeLike(userId: string): Promise<IComment>;
  addDislike(userId: string): Promise<IComment>;
  removeDislike(userId: string): Promise<IComment>;
  addReply(replyId: string): Promise<IComment>;
}

export interface ICommentModel extends Model<IComment> {
  findByManga(mangaId: string, page?: number, limit?: number): Promise<IComment[]>;
  findByChapter(chapterId: string, page?: number, limit?: number): Promise<IComment[]>;
  countByManga(mangaId: string): Promise<number>;
  countByChapter(chapterId: string): Promise<number>;
}

const CommentSchema = new Schema<IComment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mangaId: {
    type: Schema.Types.ObjectId,
    ref: 'Manga',
    required: false
  },
  chapterId: {
    type: Schema.Types.ObjectId,
    ref: 'Chapter',
    required: false
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    required: false
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
CommentSchema.index({ mangaId: 1, createdAt: -1 });
CommentSchema.index({ chapterId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ parentId: 1 });

// Virtual for like count
CommentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for dislike count
CommentSchema.virtual('dislikeCount').get(function() {
  return this.dislikes.length;
});

// Virtual for reply count
CommentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Ensure virtual fields are serialized
CommentSchema.set('toJSON', { virtuals: true });

// Static methods
CommentSchema.statics.findByManga = function(mangaId: string, page: number = 1, limit: number = 20) {
  return this.find({ 
    mangaId, 
    parentId: { $exists: false },
    isDeleted: false 
  })
    .populate('userId', 'username avatar')
    .populate({
      path: 'replies',
      match: { isDeleted: false },
      populate: {
        path: 'userId',
        select: 'username avatar'
      },
      options: { sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

CommentSchema.statics.findByChapter = function(chapterId: string, page: number = 1, limit: number = 20) {
  return this.find({ 
    chapterId, 
    parentId: { $exists: false },
    isDeleted: false 
  })
    .populate('userId', 'username avatar')
    .populate({
      path: 'replies',
      match: { isDeleted: false },
      populate: {
        path: 'userId',
        select: 'username avatar'
      },
      options: { sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

CommentSchema.statics.countByManga = function(mangaId: string) {
  return this.countDocuments({ 
    mangaId, 
    parentId: { $exists: false },
    isDeleted: false 
  });
};

CommentSchema.statics.countByChapter = function(chapterId: string) {
  return this.countDocuments({ 
    chapterId, 
    parentId: { $exists: false },
    isDeleted: false 
  });
};

// Instance methods
CommentSchema.methods.addLike = function(userId: string) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    // Remove from dislikes if exists
    this.dislikes = this.dislikes.filter((id: any) => id.toString() !== userId);
  }
  return this.save();
};

CommentSchema.methods.removeLike = function(userId: string) {
  this.likes = this.likes.filter((id: any) => id.toString() !== userId);
  return this.save();
};

CommentSchema.methods.addDislike = function(userId: string) {
  if (!this.dislikes.includes(userId)) {
    this.dislikes.push(userId);
    // Remove from likes if exists
    this.likes = this.likes.filter((id: any) => id.toString() !== userId);
  }
  return this.save();
};

CommentSchema.methods.removeDislike = function(userId: string) {
  this.dislikes = this.dislikes.filter((id: any) => id.toString() !== userId);
  return this.save();
};

CommentSchema.methods.addReply = function(replyId: string) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
  }
  return this.save();
};

const CommentModel = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default CommentModel as unknown as ICommentModel;