import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { authMiddleware } from '@/lib/middleware';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectDB();

    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Dosya boyutu 5MB\'dan küçük olmalıdır' },
        { status: 400 }
      );
    }

    // Dosya türü kontrolü
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Sadece resim dosyaları yüklenebilir' },
        { status: 400 }
      );
    }

    // Dosya uzantısını al
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${authResult.user._id}_${Date.now()}.${fileExtension}`;
    
    // Upload dizinini oluştur
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Dizin zaten varsa hata vermez
    }

    // Dosyayı kaydet
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Veritabanında kullanıcının avatar'ını güncelle
    const avatarUrl = `/uploads/avatars/${fileName}`;
    await UserModel.findByIdAndUpdate(authResult.user._id, {
      avatar: avatarUrl
    });

    return NextResponse.json({
      success: true,
      data: {
        avatarUrl
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}