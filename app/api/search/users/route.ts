import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const users = await UserModel.find(
      {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } }
        ]
      },
      {
        _id: 1,
        username: 1,
        displayName: 1,
        avatar: 1
      }
    ).limit(10);

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}