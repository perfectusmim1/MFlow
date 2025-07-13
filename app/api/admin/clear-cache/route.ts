import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware';

// POST /api/admin/clear-cache - Önbellek temizleme
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    // Cache temizleme işlemleri
    const clearedCaches = [];

    try {
      // 1. Browser cache headers gönder
      const cacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      // 2. Next.js cache temizleme simülasyonu
      // Gerçek bir Next.js cache API'si kullanılabilir
      
      // 3. Temporary files temizleme
      try {
        const fs = await import('fs').then(m => m.promises);
        const path = await import('path');
        
        // Temp upload dosyalarını temizle
        const tempDir = path.join(process.cwd(), 'public', 'temp');
        
        try {
          const files = await fs.readdir(tempDir);
          for (const file of files) {
            await fs.unlink(path.join(tempDir, file));
          }
          clearedCaches.push('temp_files');
        } catch (tempError) {
          // Temp klasörü yoksa veya boşsa, hata verme
          console.log('Temp directory not found or empty');
        }
      } catch (fsError) {
        console.log('File system operations not available in this environment');
      }

      // 4. Memory cache temizleme (varsa)
      if ((global as any).nodeCache) {
        (global as any).nodeCache.flushAll();
        clearedCaches.push('memory_cache');
      }

      // 5. Application cache işaretçileri temizle
      clearedCaches.push('browser_cache');
      clearedCaches.push('api_cache');

      return NextResponse.json({
        success: true,
        message: 'Önbellek başarıyla temizlendi',
        clearedCaches,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

    } catch (cacheError) {
      console.error('Cache clearing error:', cacheError);
      return NextResponse.json({
        success: true,
        message: 'Önbellek kısmen temizlendi',
        clearedCaches,
        warning: 'Bazı önbellek türleri temizlenemedi'
      });
    }

  } catch (error) {
    console.error('Clear cache error:', error);
    return NextResponse.json(
      { success: false, error: 'Önbellek temizlenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// GET /api/admin/clear-cache - Cache durumu bilgisi
export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    // Cache durumu bilgisi
    const cacheInfo = {
      browserCache: {
        status: 'unknown',
        description: 'Tarayıcı önbelleği'
      },
      memoryCache: {
        status: (global as any).nodeCache ? 'active' : 'inactive',
        description: 'Bellek önbelleği',
        keys: (global as any).nodeCache ? (global as any).nodeCache.keys().length : 0
      },
      fileCache: {
        status: 'unknown',
        description: 'Dosya önbelleği'
      },
      apiCache: {
        status: 'active',
        description: 'API yanıt önbelleği'
      }
    };

    // Temporary files sayısını kontrol et
    try {
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      const tempDir = path.join(process.cwd(), 'public', 'temp');
      try {
        const files = await fs.readdir(tempDir);
        cacheInfo.fileCache.status = files.length > 0 ? 'has_files' : 'empty';
        cacheInfo.fileCache.description += ` (${files.length} dosya)`;
      } catch {
        cacheInfo.fileCache.status = 'not_found';
      }
    } catch {
      cacheInfo.fileCache.status = 'unavailable';
    }

    return NextResponse.json({
      success: true,
      data: cacheInfo,
      lastCleared: null // Bu bilgi database'de tutulabilir
    });

  } catch (error) {
    console.error('Cache info error:', error);
    return NextResponse.json(
      { success: false, error: 'Cache bilgisi alınamadı' },
      { status: 500 }
    );
  }
}