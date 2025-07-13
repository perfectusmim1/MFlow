const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangareader';

// User schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manga' }],
  readingHistory: [{
    mangaId: String,
    chapterId: String,
    pageNumber: { type: Number, default: 1 },
    readAt: { type: Date, default: Date.now }
  }],
  readingList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manga' }],
  settings: {
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
  }
}, { timestamps: true });

// Şifre hashleme middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', UserSchema);

async function resetAdminUser() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
    console.log('🔗 Bağlantı URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));

    // Mevcut admin kullanıcıları sil
    const deletedCount = await User.deleteMany({ role: 'admin' });
    console.log(`🗑️  ${deletedCount.deletedCount} admin kullanıcı silindi`);

    // Admin kullanıcı bilgileri
    const adminData = {
      email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
      username: 'admin',
      password: process.env.ADMIN_PASSWORD || 'caganerdil123',
      role: 'admin'
    };

    // Admin kullanıcı oluştur
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Yeni admin kullanıcı oluşturuldu:');
    console.log('📧 Email:', adminData.email);
    console.log('👤 Kullanıcı adı:', adminData.username);
    console.log('🔑 Şifre:', adminData.password);
    console.log('');
    console.log('🎉 Admin hesabı hazır! Şimdi giriş yapabilirsiniz.');

  } catch (error) {
    console.error('❌ Admin reset hatası:', error);
  } finally {
    await mongoose.disconnect();
    console.log('💾 MongoDB bağlantısı kapatıldı');
  }
}

// Script çalıştır
if (require.main === module) {
  resetAdminUser();
}

module.exports = resetAdminUser;