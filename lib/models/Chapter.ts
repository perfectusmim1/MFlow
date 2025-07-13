import mongoose, { Schema, Document, Model } from 'mongoose';


import { Chapter, Page, TextRegion, TranslatedPage, TranslatedTextRegion } from '@/types';
import slugify from 'slugify';

const TextRegionSchema = new Schema<TextRegion>({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  originalText: { type: String, required: true },
  confidence: { type: Number, default: 0, min: 0, max: 1 }
});

const TranslatedTextRegionSchema = new Schema<TranslatedTextRegion>({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  originalText: { type: String, required: true },
  translatedText: { type: String, required: true },
  confidence: { type: Number, default: 0, min: 0, max: 1 }
});

const TranslatedPageSchema = new Schema<TranslatedPage>({
  language: { type: String, required: true },
  imageUrl: { type: String, required: true },
  textRegions: [TranslatedTextRegionSchema]
});

const PageSchema = new Schema<Page>({
  pageNumber: {
    type: Number,
    required: true,
    min: 1
  },
  imageUrl: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true,
    min: 1
  },
  height: {
    type: Number,
    required: true,
    min: 1
  },
  textRegions: [TextRegionSchema],
  translatedVersions: [TranslatedPageSchema]
});

export interface IChapter extends Document {
  mangaId: mongoose.Types.ObjectId;
  title: string;
  chapterNumber: number;
  volume?: number;
  pages: Page[];
  publishedAt: Date;
  isPublished?: boolean;
  viewCount: number;
  isTranslated: boolean;
  originalLanguage: string;
  translatedLanguages: string[];
  metadata?: {
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  slug: string;
  incrementView(): Promise<IChapter>;
  addTranslation(language: string): Promise<IChapter>;
  removeTranslation(language: string): Promise<IChapter>;
}

const ChapterSchema = new Schema<IChapter>({
  mangaId: {
    type: Schema.Types.ObjectId,
    ref: 'Manga',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  chapterNumber: {
    type: Number,
    required: true,
    min: 0
  },
  volume: {
    type: Number,
    min: 1
  },
  pages: {
    type: [PageSchema],
    required: true,
    validate: {
      validator: function(pages: Page[]) {
        return pages.length > 0;
      },
      message: 'En az bir sayfa olmalı'
    }
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isTranslated: {
    type: Boolean,
    default: false
  },
  originalLanguage: {
    type: String,
    required: true,
    default: 'ja'
  },
  translatedLanguages: [{
    type: String
  }],
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Virtual fields
ChapterSchema.virtual('pageCount').get(function() {
  return this.pages.length;
});

ChapterSchema.virtual('hasTranslations').get(function() {
  return this.translatedLanguages.length > 0;
});

// Indexes
ChapterSchema.index({ mangaId: 1, chapterNumber: 1 }, { unique: true });
ChapterSchema.index({ mangaId: 1 });
ChapterSchema.index({ chapterNumber: 1 });
ChapterSchema.index({ publishedAt: -1 });
ChapterSchema.index({ viewCount: -1 });
ChapterSchema.index({ isTranslated: 1 });
ChapterSchema.index({ translatedLanguages: 1 });
ChapterSchema.index({ mangaId: 1, slug: 1 }, { unique: true });

// Compound indexes
ChapterSchema.index({ mangaId: 1, publishedAt: -1 });
ChapterSchema.index({ mangaId: 1, chapterNumber: 1, publishedAt: -1 });

// Methods
ChapterSchema.methods.incrementView = function() {
  this.viewCount = (this.viewCount || 0) + 1;
  return this.save();
};

ChapterSchema.methods.addTranslation = function(language: string) {
  if (!this.translatedLanguages.includes(language)) {
    this.translatedLanguages.push(language);
    this.isTranslated = true;
    return this.save();
  }
  return Promise.resolve(this);
};

ChapterSchema.methods.removeTranslation = function(language: string) {
  this.translatedLanguages = this.translatedLanguages.filter((lang: string) => lang !== language);
  this.isTranslated = this.translatedLanguages.length > 0;
  return this.save();
};

// Static methods
ChapterSchema.statics.findByManga = function(mangaId: string) {
  return this.find({ mangaId }).sort({ chapterNumber: 1 });
};

ChapterSchema.statics.findLatest = function(limit: number = 10) {
  return this.find()
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate('mangaId', 'title coverImage type');
};

// Pre middleware
ChapterSchema.pre('save', function(next) {
  // Slug'ı manga ID'si ile birlikte oluştur (benzersizlik için)
  this.slug = `${this.mangaId}-chapter-${this.chapterNumber}`;
  
  // Sayfaları sayfa numarasına göre sırala
  if (this.isModified('pages')) {
    this.pages.sort((a, b) => a.pageNumber - b.pageNumber);
  }
  next();
});

export default mongoose.models.Chapter || mongoose.model<IChapter>('Chapter', ChapterSchema);