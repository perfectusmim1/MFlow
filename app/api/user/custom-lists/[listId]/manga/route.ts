import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';

// POST /api/user/custom-lists/[listId]/manga - Add/Remove manga from custom reading list
export async function POST(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectDB();

    const { listId } = params;
    const { mangaId, action } = await request.json();

    if (!mangaId || !action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz parametreler' },
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

    const listIndex = user.customReadingLists?.findIndex(
      list => list._id?.toString() === listId
    );

    if (listIndex === -1 || listIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Liste bulunamadı' },
        { status: 404 }
      );
    }

    // Manga varlığını kontrol et
    const manga = await MangaModel.findById(mangaId);
    if (!manga) {
      return NextResponse.json(
        { success: false, error: 'Manga bulunamadı' },
        { status: 404 }
      );
    }

    let message;
    const list = user.customReadingLists[listIndex];

    if (action === 'add') {
      // Manga zaten listede mi kontrol et
      if (list.mangas.includes(mangaId)) {
        return NextResponse.json(
          { success: false, error: 'Manga zaten listede mevcut' },
          { status: 400 }
        );
      }

      list.mangas.push(mangaId);
      message = 'Manga listeye eklendi';
    } else {
      // Manga listede mi kontrol et
      const mangaIndex = list.mangas.indexOf(mangaId);
      if (mangaIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'Manga listede bulunamadı' },
          { status: 400 }
        );
      }

      list.mangas.splice(mangaIndex, 1);
      message = 'Manga listeden kaldırıldı';
    }

    list.updatedAt = new Date();
    await user.save();

    // Get manga details for response
    const mangas = await MangaModel.find(
      { _id: { $in: list.mangas } },
      {
        title: 1,
        slug: 1,
        coverImage: 1,
        author: 1,
        status: 1
      }
    );

    const updatedList = {
      _id: list._id,
      name: list.name,
      description: list.description,
      isPublic: list.isPublic,
      mangas: mangas,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    };

    return NextResponse.json({
      success: true,
      message,
      data: updatedList
    });

  } catch (error) {
    console.error('Manga list operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}