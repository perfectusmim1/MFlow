import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import MangaModel from '@/lib/models/Manga';
import CommentModel from '@/lib/models/Comment';
import UserModel from '@/lib/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase();
    
    const mangaId = params.slug;
    
    // Manga'yı bul
    const manga = await MangaModel.findById(mangaId).select('likeCount dislikeCount');
    
    if (!manga) {
      return NextResponse.json(
        { success: false, error: 'Manga bulunamadı' },
        { status: 404 }
      );
    }

    // Yorum sayısını al
    const commentCount = await CommentModel.countByManga(mangaId);
    
    // Favori sayısını al
    const favoriteCount = await UserModel.countDocuments({
      favorites: mangaId
    });

    return NextResponse.json({
      success: true,
      data: {
        likeCount: manga.likeCount || 0,
        dislikeCount: manga.dislikeCount || 0,
        commentCount: commentCount || 0,
        favoriteCount: favoriteCount || 0
      }
    });

  } catch (error) {
    console.error('Manga stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}