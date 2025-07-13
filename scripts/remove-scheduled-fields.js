const { MongoClient } = require('mongodb');

// MongoDB connection string - .env dosyasından alın
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangareader';

async function removeScheduledFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('MongoDB\'ye bağlanıldı');
    
    const db = client.db();
    const chaptersCollection = db.collection('chapters');
    
    // Zamanlı yayınlama alanlarını kaldır
    const result = await chaptersCollection.updateMany(
      {},
      {
        $unset: {
          isScheduled: "",
          scheduledAt: "",
          "metadata.wasScheduled": "",
          "metadata.originalScheduledAt": ""
        }
      }
    );
    
    console.log(`${result.modifiedCount} chapter güncellendi`);
    
    // Tüm chapter'ları yayınlanmış olarak işaretle
    const publishResult = await chaptersCollection.updateMany(
      { isPublished: { $ne: true } },
      { $set: { isPublished: true } }
    );
    
    console.log(`${publishResult.modifiedCount} chapter yayınlanmış olarak işaretlendi`);
    
    console.log('Zamanlı yayınlama alanları başarıyla kaldırıldı');
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await client.close();
  }
}

// Script'i çalıştır
if (require.main === module) {
  removeScheduledFields();
}

module.exports = { removeScheduledFields };