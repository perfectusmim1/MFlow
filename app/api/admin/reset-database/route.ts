import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware';

// DELETE /api/admin/reset-database - Veritabanını sıfırla (TEHLİKELİ!)
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    const clearedCollections = [];
    let totalDocumentsDeleted = 0;

    try {
      const { getDB } = await import('@/lib/database');
      const db = await getDB();

      // Tüm koleksiyonları listele
      const collections = await db.listCollections().toArray();
      
      // Sistem koleksiyonları hariç tüm koleksiyonları temizle
      const systemCollections = ['system.indexes', 'system.users'];
      
      for (const collection of collections) {
        const collectionName = collection.name;
        
        // Sistem koleksiyonlarını atla
        if (systemCollections.includes(collectionName)) {
          continue;
        }

        try {
          // Admin kullanıcısını koru
          if (collectionName === 'users') {
            const result = await db.collection(collectionName).deleteMany({
              role: { $ne: 'admin' }
            });
            clearedCollections.push(`${collectionName}: ${result.deletedCount} kullanıcı silindi (admin korundu)`);
            totalDocumentsDeleted += result.deletedCount;
          } else {
            // Diğer koleksiyonları tamamen temizle
            const result = await db.collection(collectionName).deleteMany({});
            if (result.deletedCount > 0) {
              clearedCollections.push(`${collectionName}: ${result.deletedCount} kayıt silindi`);
              totalDocumentsDeleted += result.deletedCount;
            }
          }
        } catch (collectionError) {
          console.error(`Error clearing collection ${collectionName}:`, collectionError);
          clearedCollections.push(`${collectionName}: Temizleme hatası`);
        }
      }

      // Upload dosyalarını temizle (isteğe bağlı)
      try {
        const fs = await import('fs').then(m => m.promises);
        const path = await import('path');

        const uploadDirs = [
          path.join(process.cwd(), 'public', 'uploads', 'manga'),
          path.join(process.cwd(), 'public', 'uploads', 'chapter'),
          path.join(process.cwd(), 'public', 'uploads', 'user')
        ];

        let filesDeleted = 0;
        for (const uploadDir of uploadDirs) {
          try {
            const files = await fs.readdir(uploadDir);
            
            for (const file of files) {
              // Default dosyaları koru
              if (file.startsWith('default') || file.startsWith('sample')) {
                continue;
              }
              
              const filePath = path.join(uploadDir, file);
              await fs.unlink(filePath);
              filesDeleted++;
            }
          } catch (dirError) {
            console.log(`Upload directory not found: ${uploadDir}`);
          }
        }
        
        if (filesDeleted > 0) {
          clearedCollections.push(`Upload dosyaları: ${filesDeleted} dosya silindi`);
        }
      } catch (fsError) {
        console.log('File system cleanup skipped:', fsError);
      }

      // Site ayarlarını varsayılana sıfırla
      try {
        const defaultSettings = {
          type: 'site_settings',
          siteName: 'MFlow',
          siteDescription: 'Modern Manga, Manhwa, Manhua ve Webtoon okuma platformu',
          siteLogo: '/favicon.svg',
          siteUrl: 'http://localhost:3000',
          contactEmail: 'admin@mflow.com',
          socialLinks: {
            twitter: '',
            facebook: '',
            instagram: '',
            discord: ''
          },
          seoSettings: {
            metaTitle: 'MFlow - Modern Manga Okuma Deneyimi',
            metaDescription: 'En popüler manga, manhwa, manhua ve webtoon\'ları yüksek kalitede okuyun.',
            metaKeywords: 'manga, manhwa, manhua, webtoon, oku, online'
          },
          features: {
            userRegistration: true,
            commentSystem: true,
            ratingSystem: true,
            favoriteSystem: true,
            readingHistory: true,
            notifications: true
          },
          contentSettings: {
            chaptersPerPage: 20,
            autoTranslate: false,
            allowUserUploads: false,
            moderationRequired: true
          },
          emailSettings: {
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPassword: '',
            fromEmail: 'noreply@mflow.com',
            fromName: 'MFlow'
          },
          resetAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('site_settings').replaceOne(
          { type: 'site_settings' },
          defaultSettings,
          { upsert: true }
        );
        
        clearedCollections.push('Site ayarları varsayılana sıfırlandı');
      } catch (settingsError) {
        console.error('Settings reset error:', settingsError);
      }

    } catch (dbError) {
      console.error('Database reset error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Veritabanı sıfırlama işlemi başarısız' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Veritabanı başarıyla sıfırlandı: ${totalDocumentsDeleted} kayıt silindi`,
      details: clearedCollections,
      timestamp: new Date().toISOString(),
      warning: 'Admin kullanıcısı korundu, site ayarları varsayılana sıfırlandı'
    });

  } catch (error) {
    console.error('Reset database error:', error);
    return NextResponse.json(
      { success: false, error: 'Veritabanı sıfırlama sırasında hata oluştu' },
      { status: 500 }
    );
  }
}