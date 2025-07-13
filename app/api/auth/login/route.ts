import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import SessionModel from '@/lib/models/Session';
import { generateToken } from '@/lib/middleware';
import { parseUserAgent, getClientIP } from '@/utils/deviceUtils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Find user
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user.toJSON() as any);

    // Parse device information
    const userAgent = request.headers.get('user-agent') || '';
    const deviceInfo = parseUserAgent(userAgent);
    const ipAddress = getClientIP(request);

    // Create session
    const session = new SessionModel({
      userId: user._id,
      token,
      deviceInfo,
      ipAddress,
      isActive: true,
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 gün
    });

    await session.save();

    const responseData = {
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: user.toJSON(),
        token,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}