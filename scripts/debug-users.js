const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// .env.local dosyasını manuel olarak oku
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// User model'i import et
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20
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
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manga' }],
  readingHistory: [{
    mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga', required: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    pageNumber: { type: Number, default: 1 },
    readAt: { type: Date, default: Date.now },
    readingTime: { type: Number, default: 0 }
  }],
  readingList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manga' }],
  customReadingLists: [{
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isPublic: { type: Boolean, default: false },
    mangas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manga' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
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
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function debugUsers() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Tanimli' : 'Tanimsiz');
    
    // MongoDB'ye baglan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB baglantisi basarili');

    // Toplam kullanici sayisini kontrol et
    const totalUsers = await User.countDocuments();
    console.log('Toplam kullanici sayisi:', totalUsers);

    // Aktif kullanici sayisini kontrol et
    const activeUsers = await User.countDocuments({ isActive: true });
    console.log('Aktif kullanici sayisi:', activeUsers);

    // Admin kullanici sayisini kontrol et
    const adminUsers = await User.countDocuments({ role: 'admin' });
    console.log('Admin kullanici sayisi:', adminUsers);

    // Ilk 5 kullaniciyi listele
    const users = await User.find({}).select('username email role isActive createdAt').limit(5);
    console.log('Ilk 5 kullanici:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.email}) - ${user.role} - ${user.isActive ? 'Aktif' : 'Pasif'} - ${user.createdAt}`);
    });

    // Collectionlari listele
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Mevcut collectionlar:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Users collectionindaki dokuman sayisini direkt kontrol et
    const usersCollection = mongoose.connection.db.collection('users');
    const directCount = await usersCollection.countDocuments();
    console.log('Users collection direkt sayim:', directCount);

    // Tum dokumanlari listele (ilk 10)
    const allDocs = await usersCollection.find({}).limit(10).toArray();
    console.log('Users collectiondaki dokumanlar:');
    allDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ID: ${doc._id}, Username: ${doc.username}, Email: ${doc.email}`);
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB baglantisi kapatildi');
  }
}

debugUsers();