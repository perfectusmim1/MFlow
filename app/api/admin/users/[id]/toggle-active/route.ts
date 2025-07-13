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

// PATCH - Kullanıcı aktif/deaktif durumunu değiştir
export async function PATCH(
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

    const { isActive } = await request.json();

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Geçersiz isActive değeri' },
        { status: 400 }
      );
    }

    await connectDB();

    // Kendi hesabını deaktif etmeye çalışıyor mu kontrol et
    if ((admin._id as any).toString() === params.id && !isActive) {
      return NextResponse.json(
        { success: false, message: 'Kendi hesabınızı deaktif edemezsiniz' },
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

    user.isActive = isActive;
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Kullanıcı ${isActive ? 'aktif edildi' : 'devre dışı bırakıldı'}`,
      data: {
        id: user._id,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Toggle active error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}