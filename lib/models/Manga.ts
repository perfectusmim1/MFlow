import mongoose, { Schema, Document, Model } from 'mongoose';

import { Manga } from '@/types';
import slugify from 'slugify';

export interface IManga extends Document, Omit<Manga, '_id'> {}

const MangaSchema = new Schema<IManga>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  titleAlternative: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  author: [{
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  }],
  artist: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  genres: [{
    type: String,
    required: true,
    enum: [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
      'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
      'Supernatural', 'Thriller', 'Yaoi', 'Yuri', 'Ecchi', 'Harem',
      'Isekai', 'Mecha', 'School', 'Historical', 'Military', 'Music',
      'Psychological', 'Seinen', 'Shoujo', 'Shounen', 'Josei'
    ]
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  status: {
    type: String,
    required: true,
    enum: ['ongoing', 'completed', 'hiatus', 'cancelled'],
    default: 'ongoing'
  },
  type: {
    type: String,
    required: true,
    enum: ['manga', 'manhwa', 'manhua', 'webtoon'],
    default: 'manga'
  },
  coverImage: {
    type: String,
    required: true
  },
  bannerImage: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  favoriteCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  dislikeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  ratings: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isNSFW: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  originalLanguage: {
    type: String,
    required: true,
    default: 'ja'
  },
  chapters: [{
    type: Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  firstChapter: {
    type: Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  lastChapter: {
    type: Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  publishedAt: Date
}, {
  timestamps: true
});

// Virtual fields
MangaSchema.virtual('chapterCount').get(function() {
  return this.chapters.length;
});

MangaSchema.virtual('averageRating').get(function() {
  if (this.ratingCount === 0) return 0;
  return Math.round((this.rating / this.ratingCount) * 10) / 10;
});

// Text search index
MangaSchema.index({
  title: 'text',
  titleAlternative: 'text',
  description: 'text',
  author: 'text',
  artist: 'text',
  genres: 'text',
  tags: 'text'
});

// Other indexes
MangaSchema.index({ status: 1 });
MangaSchema.index({ type: 1 });
MangaSchema.index({ genres: 1 });
MangaSchema.index({ rating: -1 });
MangaSchema.index({ viewCount: -1 });
MangaSchema.index({ favoriteCount: -1 });
MangaSchema.index({ createdAt: -1 });
MangaSchema.index({ updatedAt: -1 });
MangaSchema.index({ publishedAt: -1 });

// Compound indexes
MangaSchema.index({ type: 1, status: 1 });
MangaSchema.index({ genres: 1, status: 1 });
MangaSchema.index({ type: 1, rating: -1 });

// Middleware - view count artırmak için
MangaSchema.methods.incrementView = function() {
  this.viewCount = (this.viewCount || 0) + 1;
  return this.save();
};

// Middleware - rating güncellemek için
MangaSchema.methods.updateRating = function(newRating: number) {
  this.rating = ((this.rating * this.ratingCount) + newRating) / (this.ratingCount + 1);
  this.ratingCount += 1;
  return this.save();
};

// Add pre save hook
MangaSchema.pre('save', function(next) {
  // Slug yoksa veya title değiştiyse slug oluştur
  if (this.isNew || this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      locale: 'tr'  // Türkçe karakterleri doğru şekilde dönüştür
    });
  }
  next();
});

export default mongoose.models.Manga || mongoose.model<IManga>('Manga', MangaSchema);