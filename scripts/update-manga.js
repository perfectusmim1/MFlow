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

async function updateManga() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB\'ye bağlanıldı');

    // Manga'yı bul ve güncelle
    const mangaId = '686fbd9357640e1426c87885';
    const title = 'Solo Leveling';
    
    const titleSlug = slugify(title, {
      lower: true,
      strict: true,
      locale: 'tr'
    });

    const result = await Manga.findByIdAndUpdate(
      mangaId,
      { 
        $set: { 
          title,
          titleSlug
        }
      },
      { new: true }
    );

    if (result) {
      console.log('\nManga güncellendi:');
      console.log(`ID: ${result._id}`);
      console.log(`Title: ${result.title}`);
      console.log(`TitleSlug: ${result.titleSlug}`);
    } else {
      console.log('Manga bulunamadı!');
    }

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

updateManga(); 