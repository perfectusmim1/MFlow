import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware';
import { getDB } from '@/lib/database';

// DELETE /api/admin/clear-logs - Tüm logları temizle
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    const clearedLogs = [];
    let totalLogsDeleted = 0;

    try {
      const db = await getDB();

      // Log koleksiyonlarını temizle
      const logCollections = [
        'logs',
        'error_logs',
        'access_logs',
        'admin_logs',
        'user_activity_logs',
        'system_logs'
      ];

      for (const collectionName of logCollections) {
        try {
          const result = await db.collection(collectionName).deleteMany({});
          if (result.deletedCount > 0) {
            clearedLogs.push(`${collectionName}: ${result.deletedCount} kayıt silindi`);
            totalLogsDeleted += result.deletedCount;
          }
        } catch (collectionError) {
          console.log(`Collection ${collectionName} not found or empty`);
        }
      }

      // Console log dosyalarını temizle (eğer varsa)
      try {
        const fs = await import('fs').then(m => m.promises);
        const path = await import('path');

        const logDirs = [
          path.join(process.cwd(), 'logs'),
          path.join(process.cwd(), '.next', 'logs'),
          path.join(process.cwd(), 'temp', 'logs')
        ];

        for (const logDir of logDirs) {
          try {
            const files = await fs.readdir(logDir);
            
            for (const file of files) {
              if (file.endsWith('.log') || file.endsWith('.txt')) {
                const filePath = path.join(logDir, file);
                await fs.unlink(filePath);
                totalLogsDeleted++;
              }
            }
            
            if (files.length > 0) {
              clearedLogs.push(`${logDir}: ${files.length} log dosyası silindi`);
            }
          } catch (dirError) {
            console.log(`Log directory not found: ${logDir}`);
          }
        }
      } catch (fsError) {
        console.log('File system log cleanup skipped:', fsError);
      }

      // Browser console logları için session storage temizleme önerisi
      clearedLogs.push('Tarayıcı console logları için sayfa yenilenmesi önerilir');

    } catch (dbError) {
      console.error('Database log cleanup error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Veritabanı log temizliği başarısız' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Tüm loglar temizlendi: ${totalLogsDeleted} kayıt/dosya silindi`,
      details: clearedLogs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Clear logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Loglar temizlenirken hata oluştu' },
      { status: 500 }
    );
  }
}