import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware } from '@/lib/middleware';

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/upload - Dosya yükleme
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (15MB - daha yüksek limit)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 15MB\'tan büyük olamaz' },
        { status: 400 }
      );
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Desteklenmeyen dosya tipi. Sadece JPG, PNG, WEBP desteklenir.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary upload with timeout and retry logic
    const uploadWithTimeout = (buffer: Buffer, options: any, timeoutMs = 30000) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Upload timeout - işlem 30 saniyede tamamlanamadı'));
        }, timeoutMs);

        const uploadStream = cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            clearTimeout(timeout);
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        
        uploadStream.end(buffer);
      });
    };

    const result = await uploadWithTimeout(buffer, {
      folder: `mflow/${type}`,
      resource_type: 'auto',
      quality: 'auto:good', // Otomatik kalite optimizasyonu
      fetch_format: 'auto', // Otomatik format optimizasyonu
      flags: 'progressive', // Progressive JPEG
    });

    const resultData = result as any;

    return NextResponse.json({
      success: true,
      data: {
        url: resultData.secure_url,
        fileName: resultData.public_id,
        originalName: file.name,
        size: file.size,
        type: file.type,
        provider: 'cloudinary',
        width: resultData.width,
        height: resultData.height,
      },
      message: 'Dosya başarıyla Cloudinary\'ye yüklendi',
    });

  } catch (error) {
    console.error('Detailed upload error:', error);
    
    // Cloudinary spesifik hataları kontrol et
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cloudinary kullanım limitine ulaşıldı. Lütfen hesap planınızı kontrol edin.',
            details: error.message
          },
          { status: 429 }
        );
      }
      
      if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cloudinary kimlik doğrulama hatası. API anahtarlarını kontrol edin.',
            details: error.message
          },
          { status: 401 }
        );
      }
      
      if (errorMessage.includes('timeout')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Yükleme zaman aşımına uğradı. Lütfen tekrar deneyin.',
            details: error.message
          },
          { status: 408 }
        );
      }

      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ağ bağlantısı hatası. Lütfen tekrar deneyin.',
            details: error.message
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Dosya yüklenemedi. Sunucu loglarını kontrol edin.',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}