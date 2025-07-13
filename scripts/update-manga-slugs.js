const mongoose = require('mongoose');
const slugify = require('slugify');

// MongoDB bağlantısı
const connectToDatabase = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mangareader');
    console.log('MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// Manga şeması
const MangaSchema = new mongoose.Schema({
  title: String,
  slug: String,
  // Diğer alanlar...
}, { strict: false });

const Manga = mongoose.model('Manga', MangaSchema);

const updateMangaSlugs = async () => {
  try {
    await connectToDatabase();
    
    // Slug'ı olmayan mangaları bul
    const mangasWithoutSlug = await Manga.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    console.log(`${mangasWithoutSlug.length} manga bulundu, slug'ları güncelleniyor...`);
    
    for (const manga of mangasWithoutSlug) {
      const slug = slugify(manga.title, { 
        lower: true, 
        strict: true,
        locale: 'tr'
      });
      
      await Manga.updateOne(
        { _id: manga._id },
        { $set: { slug: slug } }
      );
      
      console.log(`"${manga.title}" -> "${slug}"`);
    }
    
    console.log('Tüm manga slug\'ları güncellendi!');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

updateMangaSlugs();