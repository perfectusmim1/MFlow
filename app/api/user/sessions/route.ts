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

    // Get user sessions
    const sessions = await SessionModel.find({
      userId: decoded._id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActivity: -1 });

    // Format sessions for frontend
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      location: session.location,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      isCurrentSession: session.token === token
    }));

    return NextResponse.json({
      success: true,
      data: formattedSessions
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { sessionId, logoutAll } = await request.json();

    if (logoutAll) {
      // Logout from all devices except current
      await SessionModel.updateMany(
        { 
          userId: decoded._id, 
          token: { $ne: token },
          isActive: true 
        },
        { isActive: false }
      );

      return NextResponse.json({
        success: true,
        message: 'Tüm cihazlardan çıkış yapıldı'
      });
    } else if (sessionId) {
      // Logout from specific device
      const session = await SessionModel.findOne({
        _id: sessionId,
        userId: decoded._id
      });

      if (!session) {
        return NextResponse.json(
          { success: false, message: 'Session bulunamadı' },
          { status: 404 }
        );
      }

      session.isActive = false;
      await session.save();

      return NextResponse.json({
        success: true,
        message: 'Cihazdan çıkış yapıldı'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'SessionId veya logoutAll gerekli' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Logout session error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}