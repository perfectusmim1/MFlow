import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import SessionModel from '@/lib/models/Session';
import { verifyToken } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Token gerekli' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz token' },
        { status: 401 }
      );
    }

    // Get recent login activities (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const activities = await SessionModel.find({
      userId: decoded._id,
      createdAt: { $gte: thirtyDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('deviceInfo ipAddress location createdAt isActive');

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      _id: activity._id,
      deviceInfo: activity.deviceInfo,
      ipAddress: activity.ipAddress,
      location: activity.location,
      loginTime: activity.createdAt,
      status: activity.isActive ? 'Başarılı Giriş' : 'Çıkış Yapıldı'
    }));

    return NextResponse.json({
      success: true,
      data: formattedActivities
    });

  } catch (error) {
    console.error('Get login activities error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}