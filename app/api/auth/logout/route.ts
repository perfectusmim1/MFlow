import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import SessionModel from '@/lib/models/Session';
import { getTokenFromRequest } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token bulunamadı' },
        { status: 401 }
      );
    }

    // Deactivate the session
    await SessionModel.updateOne(
      { token, isActive: true },
      { isActive: false }
    );

    return NextResponse.json({
      success: true,
      message: 'Çıkış başarılı'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}