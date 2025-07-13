const { MongoClient } = require('mongodb');

async function clearReadingHistory() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('MongoDB bağlantısı başarılı');
    
    const db = client.db('mangareader');
    const users = db.collection('users');
    
    // Tüm kullanıcıların okuma geçmişini temizle
    const result = await users.updateMany(
      {},
      { $set: { readingHistory: [] } }
    );
    
    console.log(`${result.modifiedCount} kullanıcının okuma geçmişi temizlendi`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await client.close();
  }
}

clearReadingHistory();