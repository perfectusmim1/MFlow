import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    await connectDB();

    const { listId } = params;
    
    // Token kontrolü (opsiyonel - public listeler için)
    const authResult = await authMiddleware(request);
    let currentUserId = null;
    
    if (authResult.success && authResult.user) {
      currentUserId = authResult.user._id;
    }

    // Liste sahibini bul
    const listOwner = await UserModel.findOne({
      'customReadingLists._id': listId
    });

    if (!listOwner) {
      return NextResponse.json(
        { success: false, error: 'Liste bulunamadı' },
        { status: 404 }
      );
    }

    const list = listOwner.customReadingLists?.find(
      l => l._id?.toString() === listId
    );

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'Liste bulunamadı' },
        { status: 404 }
      );
    }

    // Erişim kontrolü
    const isOwner = currentUserId && (listOwner._id as any).toString() === currentUserId;
    const isPublic = list.isPublic;

    if (!isPublic && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Bu listeye erişim izniniz yok' },
        { status: 403 }
      );
    }

    // Manga detaylarını getir
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

    const responseData = {
      _id: list._id,
      name: list.name,
      description: list.description,
      isPublic: list.isPublic,
      mangas: mangas,
      createdBy: {
        _id: (listOwner._id as any),
        username: listOwner.username
      },
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Get custom list error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { name, description, isPublic } = await request.json();

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

    // İsim çakışması kontrolü (aynı kullanıcının diğer listeleri)
    if (name && name !== user.customReadingLists[listIndex].name) {
      const nameExists = user.customReadingLists?.some(
        (list, index) => index !== listIndex && list.name === name
      );

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'Bu isimde bir liste zaten mevcut' },
          { status: 400 }
        );
      }
    }

    // Liste güncelle
    const list = user.customReadingLists[listIndex];
    if (name !== undefined) list.name = name;
    if (description !== undefined) list.description = description;
    if (isPublic !== undefined) list.isPublic = isPublic;
    list.updatedAt = new Date();

    await user.save();

    // Manga detaylarını getir
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

    const responseData = {
      _id: list._id,
      name: list.name,
      description: list.description,
      isPublic: list.isPublic,
      mangas: mangas,
      createdBy: {
        _id: (user._id as any),
        username: user.username
      },
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Update custom list error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Listeyi sil
    user.customReadingLists.splice(listIndex, 1);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Liste başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete custom list error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}