const { MongoClient } = require('mongodb');

async function checkReadingTime() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/mangareader');
  
  try {
    await client.connect();
    console.log('MongoDB bağlantısı başarılı');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Tüm kullanıcıları ve okuma geçmişlerini getir
    const allUsers = await users.find({}).toArray();
    
    console.log('\n=== OKUMA SÜRESİ RAPORU ===\n');
    
    for (const user of allUsers) {
      console.log(`Kullanıcı: ${user.username} (${user.email})`);
      console.log(`Okuma Geçmişi Sayısı: ${user.readingHistory?.length || 0}`);
      
      if (user.readingHistory && user.readingHistory.length > 0) {
        let totalReadingTime = 0;
        
        console.log('\nOkuma Geçmişi Detayları:');
        user.readingHistory.forEach((entry, index) => {
          const readingTime = entry.readingTime || 0;
          totalReadingTime += readingTime;
          
          console.log(`  ${index + 1}. Manga: ${entry.mangaId}`);
          console.log(`     Chapter: ${entry.chapterId}`);
          console.log(`     Sayfa: ${entry.pageNumber}`);
          console.log(`     Okuma Süresi: ${readingTime} dakika`);
          console.log(`     Tarih: ${entry.readAt}`);
          console.log('');
        });
        
        console.log(`Toplam Okuma Süresi: ${totalReadingTime} dakika (${Math.round(totalReadingTime / 60 * 100) / 100} saat)`);
      } else {
        console.log('Okuma geçmişi bulunamadı');
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await client.close();
  }
}

checkReadingTime();