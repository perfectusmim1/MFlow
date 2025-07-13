import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import CommentModel from '@/lib/models/Comment';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await UserModel.findById(authResult.user._id)
      .select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcının toplam yorum sayısını hesapla
    const totalComments = await CommentModel.countDocuments({ 
      userId: user._id, 
      isDeleted: false 
    });

    // Herkese açık ve özel listeleri ayır
    const publicCustomLists = user.customReadingLists?.filter((list: any) => list.isPublic) || [];
    const privateCustomLists = user.customReadingLists?.filter((list: any) => !list.isPublic) || [];

    // İstatistikleri hesapla
    const stats = {
      totalFavorites: user.favorites?.length || 0,
      totalComments: totalComments,
      totalPublicLists: publicCustomLists.length,
      totalPrivateLists: privateCustomLists.length,
      totalCustomLists: user.customReadingLists?.length || 0,
      totalReadingTime: user.readingHistory?.reduce((total: number, history: any) => {
        return total + (history.readingTime || 0);
      }, 0) || 0,
    };

    // Özel listelere manga sayısını ve preview'ları ekle (sadece public olanlar)
    const customListsWithCount = await Promise.all(
      publicCustomLists.map(async (list: any) => {
        // İlk 3 manga'nın preview'larını al
        const mangaPreviews = [];
        if (list.mangas && list.mangas.length > 0) {
          const mangaIds = list.mangas.slice(0, 3);
          const mangas = await MangaModel.find({ _id: { $in: mangaIds } })
            .select('title coverImage')
            .limit(3);
          mangaPreviews.push(...mangas);
        }

        return {
          _id: list._id,
          name: list.name,
          description: list.description,
          isPublic: list.isPublic,
          mangaCount: list.mangas?.length || 0,
          mangaPreviews
        };
      })
    );

    const profileData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      stats,
      customLists: customListsWithCount
    };

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}