import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { authMiddleware } from '@/lib/middleware';

// GET /api/admin/backup - Sistem yedeklemesi
export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const { getDB } = require('@/lib/database');
    const db = await getDB();
    
    // Backup data structure
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        settings: null as any,
        users: [] as any[],
        manga: [] as any[],
        chapters: [] as any[],
        statistics: null as any
      }
    };

    try {
      // Settings yedekle
      const settingsCollection = db.collection('site_settings');
      const settings = await settingsCollection.findOne({ type: 'site_settings' });
      backupData.data.settings = settings;

      // Users yedekle (şifreler hariç)
      const usersCollection = db.collection('users');
      const users = await usersCollection.find({}, {
        projection: { password: 0 } // Şifreleri dahil etme
      }).toArray();
      backupData.data.users = users;

      // Manga yedekle
      const mangaCollection = db.collection('mangas');
      const manga = await mangaCollection.find({}).toArray();
      backupData.data.manga = manga;

      // Chapters yedekle (sadece metadata, dosyalar değil)
      const chaptersCollection = db.collection('chapters');
      const chapters = await chaptersCollection.find({}).toArray();
      backupData.data.chapters = chapters;

      // İstatistikleri hesapla
      backupData.data.statistics = {
        totalUsers: users.length,
        totalManga: manga.length,
        totalChapters: chapters.length,
        backupSize: JSON.stringify(backupData).length
      };

    } catch (collectionError) {
      console.error('Collection backup error:', collectionError);
      // Hata durumunda boş data ile devam et
    }

    // JSON olarak response döndür
    const backupJson = JSON.stringify(backupData, null, 2);
    
    return new NextResponse(backupJson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="mangabreaker-backup-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Length': backupJson.length.toString()
      }
    });

  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { success: false, error: 'Yedekleme işlemi başarısız' },
      { status: 500 }
    );
  }
}

// POST /api/admin/backup - Yedek geri yükleme
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { backupData, restoreOptions } = body;

    if (!backupData || !backupData.data) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz yedek dosyası' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { getDB } = require('@/lib/database');
    const db = await getDB();

    const restoredCollections = [];

    try {
      // Settings geri yükle
      if (restoreOptions?.settings && backupData.data.settings) {
        const settingsCollection = db.collection('site_settings');
        await settingsCollection.replaceOne(
          { type: 'site_settings' },
          backupData.data.settings,
          { upsert: true }
        );
        restoredCollections.push('settings');
      }

      // Manga geri yükle
      if (restoreOptions?.manga && backupData.data.manga && backupData.data.manga.length > 0) {
        const mangaCollection = db.collection('mangas');
        if (restoreOptions.overwrite) {
          await mangaCollection.deleteMany({});
        }
        await mangaCollection.insertMany(backupData.data.manga);
        restoredCollections.push('manga');
      }

      // Chapters geri yükle
      if (restoreOptions?.chapters && backupData.data.chapters && backupData.data.chapters.length > 0) {
        const chaptersCollection = db.collection('chapters');
        if (restoreOptions.overwrite) {
          await chaptersCollection.deleteMany({});
        }
        await chaptersCollection.insertMany(backupData.data.chapters);
        restoredCollections.push('chapters');
      }

      return NextResponse.json({
        success: true,
        message: 'Yedek başarıyla geri yüklendi',
        restoredCollections
      });

    } catch (restoreError) {
      console.error('Restore error:', restoreError);
      return NextResponse.json(
        { success: false, error: 'Geri yükleme sırasında hata oluştu' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Restore operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Geri yükleme işlemi başarısız' },
      { status: 500 }
    );
  }
}