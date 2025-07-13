import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    await connectDB();

    const user = await UserModel.findOne({ username: params.username })
      .populate({
        path: 'favorites',
        select: 'title coverImage slug author status description rating createdAt'
      })
      .select('username favorites');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Favori mangaları tarihe göre sırala (en yeni eklenenler önce)
    const favorites = user.favorites?.map((manga: any) => ({
      _id: manga._id,
      title: manga.title,
      coverImage: manga.coverImage,
      slug: manga.slug,
      author: manga.author,
      status: manga.status,
      description: manga.description,
      rating: manga.rating || 0,
      addedAt: manga.createdAt
    })) || [];

    const responseData = {
      username: user.username,
      favorites: favorites,
      totalCount: favorites.length
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Favorites fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}