const mongoose = require('mongoose');

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangareader';

// Chapter Schema
const ChapterSchema = new mongoose.Schema({
  mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  chapterNumber: { type: Number, required: true, min: 0 },
  volume: { type: Number, min: 1 },
  pages: { type: Array, required: true },
  publishedAt: { type: Date, default: Date.now },
  viewCount: { type: Number, default: 0, min: 0 },
  isTranslated: { type: Boolean, default: false },
  originalLanguage: { type: String, required: true, default: 'ja' },
  translatedLanguages: [{ type: String }],
  slug: { type: String, lowercase: true, trim: true }
}, { timestamps: true });

// Manga Schema
const MangaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  totalChapters: { type: Number, default: 0 },
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
  firstChapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  lastChapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }
}, { timestamps: true });

const ChapterModel = mongoose.model('Chapter', ChapterSchema);
const MangaModel = mongoose.model('Manga', MangaSchema);

async function cleanupTestChapters() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Test manga'sını bul
    const testManga = await MangaModel.findOne({ slug: 'test' });
    if (!testManga) {
      console.log('❌ Test manga bulunamadı');
      return;
    }

    console.log(`📚 Test manga bulundu: ${testManga.title} (ID: ${testManga._id})`);

    // Test manga'sının chapter'larını bul
    const testChapters = await ChapterModel.find({ mangaId: testManga._id })
      .sort({ chapterNumber: 1 });

    console.log(`\n📖 ${testChapters.length} chapter bulundu:`);
    testChapters.forEach(chapter => {
      console.log(`   - Chapter ${chapter.chapterNumber}: ${chapter.title} (ID: ${chapter._id})`);
    });

    if (testChapters.length === 0) {
      console.log('✅ Silinecek chapter yok');
      return;
    }

    // Kullanıcıdan onay al
    console.log('\n⚠️  Bu chapter\'ları silmek istediğinizden emin misiniz?');
    console.log('Bu işlem geri alınamaz!');
    console.log('\nDevam etmek için "EVET" yazın, iptal etmek için başka bir şey yazın:');

    // Node.js'de readline kullanarak input al
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('> ', resolve);
    });
    rl.close();

    if (answer.toUpperCase() !== 'EVET') {
      console.log('❌ İşlem iptal edildi');
      return;
    }

    // Chapter'ları sil
    console.log('\n🗑️  Chapter\'lar siliniyor...');
    for (const chapter of testChapters) {
      await ChapterModel.findByIdAndDelete(chapter._id);
      console.log(`   ✅ Silindi: Chapter ${chapter.chapterNumber} - ${chapter.title}`);
    }

    // Manga'nın chapter listesini güncelle
    await MangaModel.findByIdAndUpdate(testManga._id, {
      chapters: [],
      totalChapters: 0,
      firstChapter: null,
      lastChapter: null
    });

    console.log('\n✅ Tüm test chapter\'ları silindi ve manga güncellendi');
    console.log('🎉 Artık yeni chapter\'lar oluşturabilirsiniz!');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Script çalıştır
if (require.main === module) {
  cleanupTestChapters();
}

module.exports = cleanupTestChapters;