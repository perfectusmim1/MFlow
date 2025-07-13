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

async function fixDuplicateChapters() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Tüm chapter'ları al
    const chapters = await ChapterModel.find({})
      .populate('mangaId', 'title slug')
      .sort({ mangaId: 1, chapterNumber: 1 });

    console.log(`\n=== ${chapters.length} CHAPTER BULUNDU ===`);

    // Manga'ya göre grupla ve duplicate'leri bul
    const chaptersByManga = {};
    const duplicates = [];

    chapters.forEach(chapter => {
      const mangaId = chapter.mangaId._id.toString();
      const key = `${mangaId}-${chapter.chapterNumber}`;
      
      if (!chaptersByManga[key]) {
        chaptersByManga[key] = [];
      }
      chaptersByManga[key].push(chapter);
      
      if (chaptersByManga[key].length > 1) {
        duplicates.push(key);
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ Duplicate chapter bulunamadı');
      return;
    }

    console.log(`\n⚠️  ${duplicates.length} DUPLICATE CHAPTER GRUBU BULUNDU:`);

    for (const key of duplicates) {
      const duplicateChapters = chaptersByManga[key];
      const [mangaId, chapterNumber] = key.split('-');
      
      console.log(`\n📚 Manga: ${duplicateChapters[0].mangaId.title} - Chapter ${chapterNumber}`);
      console.log(`   ${duplicateChapters.length} duplicate chapter:`);
      
      duplicateChapters.forEach((chapter, index) => {
        console.log(`   ${index + 1}. ID: ${chapter._id}`);
        console.log(`      Title: ${chapter.title}`);
        console.log(`      Created: ${chapter.createdAt}`);
        console.log(`      Pages: ${chapter.pages.length}`);
      });

      // En eski olanı tut, diğerlerini sil
      const sortedChapters = duplicateChapters.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const keepChapter = sortedChapters[0];
      const deleteChapters = sortedChapters.slice(1);

      console.log(`   ✅ Tutulacak: ${keepChapter._id} (${keepChapter.title})`);
      
      for (const deleteChapter of deleteChapters) {
        console.log(`   ❌ Silinecek: ${deleteChapter._id} (${deleteChapter.title})`);
        await ChapterModel.findByIdAndDelete(deleteChapter._id);
      }
    }

    // Manga'ların chapter listelerini güncelle
    console.log('\n=== MANGA CHAPTER LİSTELERİ GÜNCELLENİYOR ===');
    const mangas = await MangaModel.find({});
    
    for (const manga of mangas) {
      const mangaChapters = await ChapterModel.find({ mangaId: manga._id })
        .sort({ chapterNumber: 1 });
      
      const chapterIds = mangaChapters.map(ch => ch._id);
      const firstChapter = mangaChapters[0]?._id || null;
      const lastChapter = mangaChapters[mangaChapters.length - 1]?._id || null;
      
      await MangaModel.findByIdAndUpdate(manga._id, {
        chapters: chapterIds,
        totalChapters: mangaChapters.length,
        firstChapter,
        lastChapter
      });
      
      console.log(`✅ ${manga.title}: ${mangaChapters.length} chapter güncellendi`);
    }

    console.log('\n✅ Duplicate chapterlar temizlendi ve manga listeleri güncellendi');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Script çalıştır
if (require.main === module) {
  fixDuplicateChapters();
}

module.exports = fixDuplicateChapters;