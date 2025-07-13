import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware';

// POST /api/admin/clear-temp - Geçici dosyaları temizle
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    // Geçici dosyaları temizle
    const clearedFiles = [];
    let totalFilesDeleted = 0;

    try {
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');

      // Temp klasörleri
      const tempDirs = [
        path.join(process.cwd(), 'public', 'temp'),
        path.join(process.cwd(), 'public', 'uploads', 'temp'),
        path.join(process.cwd(), 'temp')
      ];

      for (const tempDir of tempDirs) {
        try {
          const files = await fs.readdir(tempDir);
          
          for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);
            
            // 24 saatten eski dosyaları sil
            const age = Date.now() - stats.mtime.getTime();
            const hoursOld = age / (1000 * 60 * 60);
            
            if (hoursOld > 24 || file.startsWith('temp_')) {
              await fs.unlink(filePath);
              totalFilesDeleted++;
            }
          }
          
          clearedFiles.push(`${tempDir}: ${files.length} dosya kontrol edildi`);
        } catch (dirError) {
          console.log(`Temp directory not found: ${tempDir}`);
        }
      }

      // Veritabanındaki geçici kayıtları temizle
      try {
        const { getDB } = await import('@/lib/database');
        const db = await getDB();
        
        // 24 saatten eski geçici session'ları sil
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        
        const result = await db.collection('temp_sessions').deleteMany({
          createdAt: { $lt: yesterday }
        });
        
        clearedFiles.push(`Veritabanı: ${result.deletedCount} geçici kayıt silindi`);
      } catch (dbError) {
        console.log('Database temp cleanup skipped:', dbError);
      }

    } catch (fsError) {
      console.log('File system operations not available:', fsError);
      clearedFiles.push('Dosya sistemi operasyonları mevcut değil');
    }

    return NextResponse.json({
      success: true,
      message: `Geçici dosyalar temizlendi: ${totalFilesDeleted} dosya silindi`,
      details: clearedFiles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Clear temp files error:', error);
    return NextResponse.json(
      { success: false, error: 'Geçici dosyalar temizlenirken hata oluştu' },
      { status: 500 }
    );
  }
}