import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import UserModel from '@/lib/models/User';
import CommentModel from '@/lib/models/Comment';
import { authMiddleware } from '@/lib/middleware';

// GET /api/user/stats - Get user statistics
export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await UserModel.findById(authResult.user._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    // Calculate user's own comments count
    const totalComments = await CommentModel.countDocuments({ 
      userId: authResult.user._id,
      isDeleted: false 
    });

    const stats = {
      totalFavorites: user.favorites?.length || 0,
      totalReadingHistory: user.readingHistory?.length || 0,
      totalReadingList: user.readingList?.length || 0,
      totalComments: totalComments
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('User stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'İstatistikler yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}