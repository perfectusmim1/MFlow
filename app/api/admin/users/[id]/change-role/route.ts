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

// PATCH - Kullanıcı rolünü değiştir
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

    const { role } = await request.json();

    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz rol değeri' },
        { status: 400 }
      );
    }

    await connectDB();

    // Kendi rolünü user yapmaya çalışıyor mu kontrol et
    if ((admin._id as any).toString() === params.id && role === 'user') {
      return NextResponse.json(
        { success: false, message: 'Kendi admin rolünüzü kaldıramazsınız' },
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

    const oldRole = user.role;
    user.role = role;
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Kullanıcı rolü ${oldRole === 'admin' ? 'Admin' : 'Kullanıcı'}'dan ${role === 'admin' ? 'Admin' : 'Kullanıcı'}'ya değiştirildi`,
      data: {
        id: user._id,
        role: user.role,
        oldRole
      }
    });

  } catch (error) {
    console.error('Change role error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}