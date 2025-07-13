import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware } from '@/lib/middleware';

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

    // Dosya boyutu kontrolü (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 10MB\'tan büyük olamaz' },
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

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `mflow/${type}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    const fileUrl = (result as any).secure_url;

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
      },
      message: 'Dosya başarıyla Cloudinary\'ye yüklendi',
    });

  } catch (error) {
    console.error('Detailed upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Dosya yüklenemedi. Sunucu loglarını kontrol edin.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}