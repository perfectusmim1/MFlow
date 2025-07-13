const mongoose = require('mongoose');
const slugify = require('slugify');

// MongoDB bağlantı URL'si
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangareader';

// Manga şeması
const MangaSchema = new mongoose.Schema({
  title: String,
  titleSlug: String
});

const Manga = mongoose.model('Manga', MangaSchema);

async function updateSlugs() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB\'ye bağlanıldı');

    // Tüm mangaları getir
    const mangas = await Manga.find({});
    console.log(`${mangas.length} manga bulundu`);

    // Her manga için yeni slug oluştur
    for (const manga of mangas) {
      const titleSlug = slugify(manga.title, {
        lower: true,
        strict: true,
        locale: 'tr'
      });

      // Manga'yı güncelle
      await Manga.findByIdAndUpdate(manga._id, { titleSlug });
      console.log(`"${manga.title}" için yeni slug oluşturuldu: ${titleSlug}`);
    }

    console.log('Tüm sluglar güncellendi');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

updateSlugs(); 