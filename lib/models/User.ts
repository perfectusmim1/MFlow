import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, UserSettings, ReadingHistory } from '@/types';

const ReadingHistorySchema = new Schema<ReadingHistory>({
  mangaId: { type: Schema.Types.ObjectId, ref: 'Manga', required: true },
  chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
  pageNumber: { type: Number, default: 1 },
  readAt: { type: Date, default: Date.now },
  readingTime: { type: Number, default: 0 } // Saniye cinsinden okuma süresi
});

const UserSettingsSchema = new Schema<UserSettings>({
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  language: { type: String, default: 'tr' },
  readingMode: { type: String, enum: ['horizontal', 'vertical', 'webtoon'], default: 'horizontal' },
  autoTranslate: { type: Boolean, default: false },
  targetLanguage: { type: String, default: 'tr' },
  notifications: {
    newChapters: { type: Boolean, default: true },
    favorites: { type: Boolean, default: true },
    system: { type: Boolean, default: true }
  }
});

export interface IUser extends Document, Omit<User, '_id'> {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir email adresi girin']
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
    match: [/^[a-zA-Z0-9_]+$/, 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: { type: String },
  isActive: {
    type: Boolean,
    default: true
  },
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Manga' }],
  readingHistory: [ReadingHistorySchema],
  readingList: [{ type: Schema.Types.ObjectId, ref: 'Manga' }],
  customReadingLists: [{
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isPublic: { type: Boolean, default: false },
    mangas: [{ type: Schema.Types.ObjectId, ref: 'Manga' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  settings: {
    type: UserSettingsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Şifre hashleme middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Şifre karşılaştırma methodu
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// JSON output'ta password field'ını gizle
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Index'ler - email için unique: true zaten index oluşturuyor
// username için zaten unique: true ile index oluşturuldu

const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
