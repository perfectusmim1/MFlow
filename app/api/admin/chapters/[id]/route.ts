import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import ChapterModel from '@/lib/models/Chapter';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';

// DELETE /api/admin/chapters/[id] - Chapter silme (Admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const chapter = await ChapterModel.findById(params.id);
    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter bulunamadı' },
        { status: 404 }
      );
    }

    // Chapter'ı sil
    await ChapterModel.findByIdAndDelete(params.id);

    // Manga'nın chapter sayısını güncelle
    await MangaModel.findByIdAndUpdate(
      chapter.mangaId,
      { $inc: { chapterCount: -1 } }
    );

    console.log(`Chapter silindi: ${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Chapter başarıyla silindi'
    });

  } catch (error) {
    console.error('Chapter silme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Chapter silinirken hata oluştu' },
      { status: 500 }
    );
  }
}

// GET /api/admin/chapters/[id] - Chapter detayları (Admin)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const chapter = await ChapterModel.findById(params.id)
      .populate('mangaId', 'title coverImage type author artist');

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: chapter
    });

  } catch (error) {
    console.error('Chapter getirme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Chapter getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/chapters/[id] - Chapter güncelleme (Admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const body = await req.json();
    const {
      title,
      chapterNumber,
      volume,
      pages,
      publishedAt
    } = body;

    const chapter = await ChapterModel.findById(params.id);
    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter bulunamadı' },
        { status: 404 }
      );
    }

    // Aynı manga'da aynı chapter numarası var mı kontrol et (kendisi hariç)
    const existingChapter = await ChapterModel.findOne({
      mangaId: chapter.mangaId,
      chapterNumber: chapterNumber,
      _id: { $ne: params.id }
    });

    if (existingChapter) {
      return NextResponse.json(
        { success: false, error: 'Bu chapter numarası zaten mevcut' },
        { status: 400 }
      );
    }

    // Chapter'ı güncelle
    const updatedChapter = await ChapterModel.findByIdAndUpdate(
      params.id,
      {
        title,
        chapterNumber,
        volume,
        pages,
        publishedAt: new Date(publishedAt),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('mangaId', 'title coverImage type author artist');

    console.log(`Chapter güncellendi: ${params.id}`);

    return NextResponse.json({
      success: true,
      data: updatedChapter,
      message: 'Chapter başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Chapter güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Chapter güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}