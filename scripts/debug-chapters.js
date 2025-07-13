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
  description: { type: String, trim: true },
  author: { type: String, trim: true },
  artist: { type: String, trim: true },
  status: { type: String, enum: ['ongoing', 'completed', 'hiatus', 'cancelled'], default: 'ongoing' },
  type: { type: String, enum: ['manga', 'manhwa', 'manhua', 'webtoon'], default: 'manga' },
  genres: [{ type: String }],
  tags: [{ type: String }],
  coverImage: { type: String },
  bannerImage: { type: String },
  originalLanguage: { type: String, default: 'ja' },
  translatedLanguages: [{ type: String }],
  publishedYear: { type: Number },
  rating: { type: Number, default: 0, min: 0, max: 10 },
  ratingCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  favoriteCount: { type: Number, default: 0 },
  totalChapters: { type: Number, default: 0 },
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
  firstChapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  lastChapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  isAdult: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ChapterModel = mongoose.model('Chapter', ChapterSchema);
const MangaModel = mongoose.model('Manga', MangaSchema);

async function debugChapters() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Tüm manga'ları listele
    const mangas = await MangaModel.find({}, '_id title slug').sort({ title: 1 });
    console.log('\n=== MANGA LİSTESİ ===');
    mangas.forEach((manga, index) => {
      console.log(`${index + 1}. ${manga.title} (ID: ${manga._id}, Slug: ${manga.slug})`);
    });

    // Tüm chapter'ları listele
    const chapters = await ChapterModel.find({})
      .populate('mangaId', 'title slug')
      .sort({ mangaId: 1, chapterNumber: 1 });
    
    console.log('\n=== CHAPTER LİSTESİ ===');
    console.log(`Toplam ${chapters.length} chapter bulundu\n`);

    // Manga'ya göre grupla
    const chaptersByManga = {};
    chapters.forEach(chapter => {
      const mangaId = chapter.mangaId._id.toString();
      if (!chaptersByManga[mangaId]) {
        chaptersByManga[mangaId] = {
          manga: chapter.mangaId,
          chapters: []
        };
      }
      chaptersByManga[mangaId].chapters.push(chapter);
    });

    // Her manga için chapter'ları göster
    Object.values(chaptersByManga).forEach(({ manga, chapters }) => {
      console.log(`\n📚 ${manga.title} (${manga.slug})`);
      console.log(`   Manga ID: ${manga._id}`);
      console.log(`   Chapter sayısı: ${chapters.length}`);
      
      chapters.forEach(chapter => {
        console.log(`   - Chapter ${chapter.chapterNumber}: ${chapter.title}`);
        console.log(`     ID: ${chapter._id}`);
        console.log(`     Slug: ${chapter.slug}`);
        console.log(`     Sayfa sayısı: ${chapter.pages.length}`);
      });
    });

    // Duplicate chapter number kontrolü
    console.log('\n=== DUPLICATE CHAPTER NUMBER KONTROLÜ ===');
    const duplicates = {};
    chapters.forEach(chapter => {
      const key = `${chapter.mangaId._id}-${chapter.chapterNumber}`;
      if (!duplicates[key]) {
        duplicates[key] = [];
      }
      duplicates[key].push(chapter);
    });

    let foundDuplicates = false;
    Object.entries(duplicates).forEach(([key, chapterList]) => {
      if (chapterList.length > 1) {
        foundDuplicates = true;
        const [mangaId, chapterNumber] = key.split('-');
        console.log(`⚠️  DUPLICATE: Manga ${chapterList[0].mangaId.title} - Chapter ${chapterNumber}`);
        chapterList.forEach(chapter => {
          console.log(`   - ID: ${chapter._id}, Slug: ${chapter.slug}`);
        });
      }
    });

    if (!foundDuplicates) {
      console.log('✅ Duplicate chapter number bulunamadı');
    }

    // Duplicate slug kontrolü
    console.log('\n=== DUPLICATE SLUG KONTROLÜ ===');
    const slugDuplicates = {};
    chapters.forEach(chapter => {
      const key = `${chapter.mangaId._id}-${chapter.slug}`;
      if (!slugDuplicates[key]) {
        slugDuplicates[key] = [];
      }
      slugDuplicates[key].push(chapter);
    });

    let foundSlugDuplicates = false;
    Object.entries(slugDuplicates).forEach(([key, chapterList]) => {
      if (chapterList.length > 1) {
        foundSlugDuplicates = true;
        const [mangaId, slug] = key.split('-');
        console.log(`⚠️  DUPLICATE SLUG: Manga ${chapterList[0].mangaId.title} - Slug ${slug}`);
        chapterList.forEach(chapter => {
          console.log(`   - ID: ${chapter._id}, Chapter: ${chapter.chapterNumber}`);
        });
      }
    });

    if (!foundSlugDuplicates) {
      console.log('✅ Duplicate slug bulunamadı');
    }

    // Orphan chapter kontrolü (manga'sı olmayan chapter'lar)
    console.log('\n=== ORPHAN CHAPTER KONTROLÜ ===');
    const orphanChapters = await ChapterModel.find({})
      .populate('mangaId')
      .then(chapters => chapters.filter(chapter => !chapter.mangaId));
    
    if (orphanChapters.length > 0) {
      console.log(`⚠️  ${orphanChapters.length} orphan chapter bulundu:`);
      orphanChapters.forEach(chapter => {
        console.log(`   - ID: ${chapter._id}, Chapter: ${chapter.chapterNumber}, Title: ${chapter.title}`);
      });
    } else {
      console.log('✅ Orphan chapter bulunamadı');
    }

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Script çalıştır
if (require.main === module) {
  debugChapters();
}

module.exports = debugChapters;