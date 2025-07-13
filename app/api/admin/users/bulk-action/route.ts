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

// PATCH - Toplu kullanıcı işlemleri
export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const { userIds, action } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı ID listesi gereklidir' },
        { status: 400 }
      );
    }

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz işlem türü' },
        { status: 400 }
      );
    }

    await connectDB();

    // Kendi ID'sini kontrol et - kendini etkileyecek işlemler engellenir
    const adminId = (admin._id as any).toString();
    if (userIds.includes(adminId)) {
      if (action === 'deactivate') {
        return NextResponse.json(
          { success: false, message: 'Kendi hesabınızı deaktif edemezsiniz' },
          { status: 400 }
        );
      }
      if (action === 'delete') {
        return NextResponse.json(
          { success: false, message: 'Kendi hesabınızı silemezsiniz' },
          { status: 400 }
        );
      }
    }

    let result;
    let message;

    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { 
            $set: { 
              isActive: true,
              updatedAt: new Date()
            }
          }
        );
        message = `${result.modifiedCount} kullanıcı aktif edildi`;
        break;

      case 'deactivate':
        // Admin ID'sini hariç tut
        const deactivateIds = userIds.filter(id => id !== adminId);
        result = await User.updateMany(
          { _id: { $in: deactivateIds } },
          { 
            $set: { 
              isActive: false,
              updatedAt: new Date()
            }
          }
        );
        message = `${result.modifiedCount} kullanıcı devre dışı bırakıldı`;
        if (userIds.includes(adminId)) {
          message += ' (Kendi hesabınız hariç)';
        }
        break;

      case 'delete':
        // Admin ID'sini hariç tut
        const deleteIds = userIds.filter(id => id !== adminId);
        result = await User.deleteMany({
          _id: { $in: deleteIds }
        });
        message = `${result.deletedCount} kullanıcı silindi`;
        if (userIds.includes(adminId)) {
          message += ' (Kendi hesabınız hariç)';
        }
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Geçersiz işlem' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        action,
        affectedCount: action === 'delete' ? (result as any).deletedCount : (result as any).modifiedCount,
        requestedCount: userIds.length
      }
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}