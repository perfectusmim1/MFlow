const mongoose = require('mongoose');
const slugify = require('slugify');

// MongoDB bağlantı URL'si
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangareader';

// Manga şeması
const MangaSchema = new mongoose.Schema({
  title: String,
  titleSlug: String,
  _id: mongoose.Schema.Types.ObjectId
});

const Manga = mongoose.model('Manga', MangaSchema);

async function checkManga() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB\'ye bağlanıldı');

    // Tüm mangaları getir
    const mangas = await Manga.find().select('_id title titleSlug');
    console.log('\nMevcut mangalar:');
    mangas.forEach(manga => {
      console.log(`\nID: ${manga._id}`);
      console.log(`Title: ${manga.title}`);
      console.log(`TitleSlug: ${manga.titleSlug}`);
      
      // Olması gereken slug'ı hesapla
      const expectedSlug = slugify(manga.title, {
        lower: true,
        strict: true,
        locale: 'tr'
      });
      console.log(`Olması gereken slug: ${expectedSlug}`);
      
      if (manga.titleSlug !== expectedSlug) {
        console.log('!!! UYARI: Slug eşleşmiyor !!!');
      }
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

checkManga(); 