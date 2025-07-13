import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// JWT doğrulama ve admin kontrolü
async function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// GET - Tek kullanıcı detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(params.id)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // İstatistikleri ekle
    const userWithStats = {
      ...user,
      favoriteCount: user.favorites?.length || 0,
      readingHistoryCount: user.readingHistory?.length || 0
    };

    return NextResponse.json({
      success: true,
      data: userWithStats
    });

  } catch (error) {
    console.error('Admin user GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// DELETE - Kullanıcı sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectDB();

    // Kendi hesabını silmeye çalışıyor mu kontrol et
    if ((admin._id as any).toString() === params.id) {
      return NextResponse.json(
        { success: false, message: 'Kendi hesabınızı silemezsiniz' },
        { status: 400 }
      );
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });

  } catch (error) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}