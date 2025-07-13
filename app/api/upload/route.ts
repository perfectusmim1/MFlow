import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware';

// POST /api/upload - Dosya yükleme (Cloudinary ile)
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

    // Cloudinary'ye yükle
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Environment variables kontrolü
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    
    console.log('Cloudinary Config:', { cloudName, uploadPreset });
    
    if (!cloudName) {
      throw new Error('CLOUDINARY_CLOUD_NAME environment variable is missing');
    }
    
    if (!uploadPreset) {
      throw new Error('CLOUDINARY_UPLOAD_PRESET environment variable is missing');
    }

    // Cloudinary upload URL
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const uploadData = new FormData();
    uploadData.append('file', dataURI);
    uploadData.append('upload_preset', uploadPreset);
    uploadData.append('folder', `mangareader/${type}`);

    console.log('Uploading to Cloudinary:', cloudinaryUrl);

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadData,
    });

    console.log('Cloudinary response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary error:', errorText);
      throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        fileName: result.public_id,
        originalName: file.name,
        size: file.size,
        type: file.type
      },
      message: 'Dosya başarıyla yüklendi'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Dosya yüklenemedi' },
      { status: 500 }
    );
  }
}