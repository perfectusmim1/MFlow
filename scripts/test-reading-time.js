const { MongoClient, ObjectId } = require('mongodb');

async function testReadingTime() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/mangareader');
  
  try {
    await client.connect();
    console.log('MongoDB bağlantısı başarılı');
    
    const db = client.db();
    const users = db.collection('users');
    const mangas = db.collection('mangas');
    const chapters = db.collection('chapters');
    
    // Test kullanıcısını bul
    const testUser = await users.findOne({ username: 'perfectusmim' });
    
    if (!testUser) {
      console.log('Test kullanıcısı bulunamadı');
      return;
    }
    
    // Mevcut mangaları bul
    const availableMangas = await mangas.find({}).limit(3).toArray();
    console.log(`Bulunan manga sayısı: ${availableMangas.length}`);
    
    if (availableMangas.length === 0) {
      console.log('Hiç manga bulunamadı');
      return;
    }
    
    // Her manga için bölümleri bul ve okuma geçmişi ekle
    const readingHistoryEntries = [];
    
    for (const manga of availableMangas) {
      const mangaChapters = await chapters.find({ mangaId: manga._id }).limit(2).toArray();
      
      for (const chapter of mangaChapters) {
        readingHistoryEntries.push({
          mangaId: new ObjectId(manga._id),
          chapterId: new ObjectId(chapter._id),
          pageNumber: Math.floor(Math.random() * 20) + 1,
          readAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Son 7 gün içinde
          readingTime: Math.floor(Math.random() * 30) + 5 // 5-35 dakika arası
        });
      }
    }
    
    console.log(`Test kullanıcısı: ${testUser.username}`);
    console.log(`Eklenecek okuma geçmişi sayısı: ${readingHistoryEntries.length}`);
    
    // Okuma geçmişini güncelle
    await users.updateOne(
      { _id: testUser._id },
      { 
        $set: { 
          readingHistory: readingHistoryEntries 
        } 
      }
    );
    
    console.log('Test okuma geçmişi eklendi');
    
    // Güncellenmiş kullanıcıyı kontrol et
    const updatedUser = await users.findOne({ _id: testUser._id });
    const totalReadingTime = updatedUser.readingHistory.reduce((total, entry) => {
      return total + (entry.readingTime || 0);
    }, 0);
    
    console.log(`Toplam okuma süresi: ${totalReadingTime} dakika`);
    console.log(`Okuma geçmişi girişleri: ${updatedUser.readingHistory.length}`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await client.close();
  }
}

testReadingTime();