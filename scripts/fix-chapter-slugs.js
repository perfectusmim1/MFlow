const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangareader';

async function fixChapterSlugs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('MongoDB bağlantısı başarılı');
    
    const db = client.db();
    const chaptersCollection = db.collection('chapters');
    
    // Tüm chapter'ları al
    const chapters = await chaptersCollection.find({}).toArray();
    console.log(`Toplam ${chapters.length} chapter bulundu`);
    
    let updatedCount = 0;
    
    for (const chapter of chapters) {
      // Yeni slug formatı: mangaId-chapter-chapterNumber
      const correctSlug = `${chapter.mangaId}-chapter-${chapter.chapterNumber}`;
      
      if (chapter.slug !== correctSlug) {
        console.log(`Chapter ${chapter._id} slug güncelleniyor: ${chapter.slug} -> ${correctSlug}`);
        
        await chaptersCollection.updateOne(
          { _id: chapter._id },
          { $set: { slug: correctSlug } }
        );
        
        updatedCount++;
      }
    }
    
    console.log(`${updatedCount} chapter slug'ı güncellendi`);
    
    // Global duplicate slug'ları kontrol et (artık olmamalı)
    const globalDuplicates = await chaptersCollection.aggregate([
      {
        $group: {
          _id: '$slug',
          count: { $sum: 1 },
          chapters: { $push: { _id: '$_id', title: '$title', chapterNumber: '$chapterNumber', mangaId: '$mangaId' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();
    
    if (globalDuplicates.length > 0) {
      console.log('Global duplicate slug\'lar var:');
      globalDuplicates.forEach(dup => {
        console.log(`Slug: ${dup._id}, Count: ${dup.count}`);
        dup.chapters.forEach(ch => {
          console.log(`  - Chapter ${ch._id}: ${ch.title} (${ch.chapterNumber}) - Manga: ${ch.mangaId}`);
        });
      });
    } else {
      console.log('Tüm slug\'lar global olarak unique!');
    }
    
    // Aynı manga içinde duplicate chapter number'ları kontrol et
    const duplicateChapterNumbers = await chaptersCollection.aggregate([
      {
        $group: {
          _id: { mangaId: '$mangaId', chapterNumber: '$chapterNumber' },
          count: { $sum: 1 },
          chapters: { $push: { _id: '$_id', title: '$title', slug: '$slug' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();
    
    if (duplicateChapterNumbers.length > 0) {
      console.log('Aynı manga içinde duplicate chapter number\'lar var:');
      duplicateChapterNumbers.forEach(dup => {
        console.log(`Manga ID: ${dup._id.mangaId}, Chapter Number: ${dup._id.chapterNumber}, Count: ${dup.count}`);
        dup.chapters.forEach(ch => {
          console.log(`  - Chapter ${ch._id}: ${ch.title} (${ch.slug})`);
        });
      });
    } else {
      console.log('Aynı manga içinde tüm chapter number\'lar unique!');
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await client.close();
  }
}

fixChapterSlugs();