import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';

// GET /api/user/reading-list - Get user's reading list
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

    // Get reading list with filtering and sorting
    const pipeline: any[] = [
      { $match: { _id: { $in: user.readingList } } },
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
    const readingList = result[0]?.data || [];
    const totalItems = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      success: true,
      data: readingList,
      pagination: {
        page,
        limit,
        total: totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Reading list fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Okuma listesi yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/user/reading-list - Add/Remove manga from reading list
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectDB();

    const { mangaId, action } = await req.json();

    if (!mangaId || !action) {
      return NextResponse.json(
        { success: false, error: 'MangaId ve action gerekli' },
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

    if (action === 'add') {
      if (!user.readingList.includes(mangaId)) {
        user.readingList.push(mangaId);
        await user.save();
      }
      return NextResponse.json({
        success: true,
        message: 'Okuma listesine eklendi'
      });
    } else if (action === 'remove') {
      user.readingList = user.readingList.filter(id => id.toString() !== mangaId);
      await user.save();
      return NextResponse.json({
        success: true,
        message: 'Okuma listesinden kaldırıldı'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Geçersiz action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Reading list update error:', error);
    return NextResponse.json(
      { success: false, error: 'Okuma listesi güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}