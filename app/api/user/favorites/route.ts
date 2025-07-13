import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import UserModel from '@/lib/models/User';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';

// GET /api/user/favorites - Get user's favorite manga
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const genre = searchParams.get('genre');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const sort = searchParams.get('sort') || 'updatedAt';
    const order = searchParams.get('order') || 'desc';

    // Build match criteria for filtering
    const matchCriteria: any = {};
    if (genre) matchCriteria.genres = { $in: [genre] };
    if (status) matchCriteria.status = status;
    if (type) matchCriteria.type = type;

    // Build sort criteria
    const sortCriteria: any = {};
    sortCriteria[sort] = order === 'asc' ? 1 : -1;

    const user = await UserModel.findById(authResult.user._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Get favorites with filtering and sorting
    const pipeline: any[] = [
      { $match: { _id: { $in: user.favorites } } },
      ...(Object.keys(matchCriteria).length > 0 ? [{ $match: matchCriteria }] : []),
      { $sort: sortCriteria },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                title: 1,
                slug: 1,
                coverImage: 1,
                author: 1,
                genres: 1,
                status: 1,
                type: 1,
                rating: 1,
                viewCount: 1,
                updatedAt: 1
              }
            }
          ],
          totalCount: [{ $count: "count" }]
        }
      }
    ];

    const result = await MangaModel.aggregate(pipeline);
    const favorites = result[0]?.data || [];
    const totalFavorites = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalFavorites / limit);

    return NextResponse.json({
      success: true,
      data: favorites,
      pagination: {
        page,
        limit,
        total: totalFavorites,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Favorites fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Favoriler yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/user/favorites - Add/remove favorite manga
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { mangaId, action } = await req.json();

    if (!mangaId || !action) {
      return NextResponse.json(
        { success: false, error: 'MangaId ve action gerekli' },
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action add veya remove olmalı' },
        { status: 400 }
      );
    }

    // Check if manga exists
    const manga = await MangaModel.findById(mangaId);
    if (!manga) {
      return NextResponse.json(
        { success: false, error: 'Manga bulunamadı' },
        { status: 404 }
      );
    }

    const user = await UserModel.findById(authResult.user._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    let message = '';
    let isFavorite = false;

    if (action === 'add') {
      // Check if already in favorites
      if (user.favorites.includes(mangaId)) {
        return NextResponse.json({
          success: true,
          message: 'Manga zaten favorilerde',
          isFavorite: true
        });
      }

      // Add to favorites
      user.favorites.push(mangaId);
      
      // Increment manga favorite count
      manga.favoriteCount = (manga.favoriteCount || 0) + 1;
      await manga.save();
      
      message = 'Manga favorilere eklendi';
      isFavorite = true;
    } else {
      // Remove from favorites
      const index = user.favorites.indexOf(mangaId);
      if (index === -1) {
        return NextResponse.json({
          success: true,
          message: 'Manga zaten favorilerde değil',
          isFavorite: false
        });
      }

      user.favorites.splice(index, 1);
      
      // Decrement manga favorite count
      manga.favoriteCount = Math.max(0, (manga.favoriteCount || 0) - 1);
      await manga.save();
      
      message = 'Manga favorilerden kaldırıldı';
      isFavorite = false;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message,
      isFavorite,
      favoriteCount: manga.favoriteCount
    });

  } catch (error) {
    console.error('Favorites update error:', error);
    return NextResponse.json(
      { success: false, error: 'Favoriler güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}