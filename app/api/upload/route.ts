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

    // Dosya boyutu kontrolü (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 100MB\'tan büyük olamaz' },
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

    // Basit ve hızlı Cloudinary upload
    const result = await new Promise((resolve, reject) => {
      // 20 saniye timeout
      const timeout = setTimeout(() => {
        reject(new Error('Upload timeout'));
      }, 20000);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `mflow/${type}`,
          resource_type: 'auto',
          quality: 'auto:good',
        },
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
    console.error('Upload error:', error);
    
    // Basit hata yönetimi
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('timeout')) {
        return NextResponse.json(
          { success: false, error: 'Yükleme zaman aşımına uğradı' },
          { status: 408 }
        );
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        return NextResponse.json(
          { success: false, error: 'Cloudinary limit aşıldı' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Dosya yüklenemedi',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}