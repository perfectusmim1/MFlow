import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';

// GET /api/user/custom-lists - Get user's custom reading lists
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

    const user = await UserModel.findById(authResult.user._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Get custom reading lists with manga details
    const listsWithDetails = await Promise.all(
      (user.customReadingLists || []).map(async (list) => {
        const mangas = await MangaModel.find(
          { _id: { $in: list.mangas } },
          {
            title: 1,
            slug: 1,
            coverImage: 1,
            author: 1,
            status: 1,
            type: 1,
            rating: 1
          }
        );

        return {
          _id: list._id,
          name: list.name,
          description: list.description,
          isPublic: list.isPublic,
          mangaCount: list.mangas.length,
          mangas: mangas,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: listsWithDetails
    });

  } catch (error) {
    console.error('Custom lists fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Listeler yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/user/custom-lists - Create new custom reading list
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

    const { name, description, isPublic } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Liste adı gerekli' },
        { status: 400 }
      );
    }

    const user = await UserModel.findById(authResult.user._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Check if list name already exists
    const existingList = user.customReadingLists?.find(
      list => list.name.toLowerCase() === name.toLowerCase()
    );

    if (existingList) {
      return NextResponse.json(
        { success: false, error: 'Bu isimde bir liste zaten mevcut' },
        { status: 400 }
      );
    }

    // Create new list
    const newList = {
      name: name.trim(),
      description: description?.trim() || '',
      isPublic: Boolean(isPublic),
      mangas: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!user.customReadingLists) {
      user.customReadingLists = [];
    }

    user.customReadingLists.push(newList);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Liste başarıyla oluşturuldu',
      data: newList
    });

  } catch (error) {
    console.error('Custom list creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Liste oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}