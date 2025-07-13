import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import ChapterModel from '@/lib/models/Chapter';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';

// GET /api/chapters/[id] - Chapter detayları
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Check if user is admin
    const authResult = await authMiddleware(req);
    const isAdmin = authResult.success && authResult.user?.role === 'admin';
    
    const chapter = await ChapterModel.findById(params.id)
      .populate('mangaId', 'title coverImage type author artist isPrivate');

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter bulunamadı' },
        { status: 404 }
      );
    }

    // Check if manga is private and user is not admin
    if (chapter.mangaId && chapter.mangaId.isPrivate && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Bu manga özel ve sadece yöneticiler tarafından görüntülenebilir' },
        { status: 403 }
      );
    }

    // Increment view count
    await chapter.incrementView();

    // Get next and previous chapters
    const nextChapter = await ChapterModel.findOne({
      mangaId: chapter.mangaId,
      chapterNumber: { $gt: chapter.chapterNumber }
    }).sort({ chapterNumber: 1 }).select('_id title chapterNumber');

    const prevChapter = await ChapterModel.findOne({
      mangaId: chapter.mangaId,
      chapterNumber: { $lt: chapter.chapterNumber }
    }).sort({ chapterNumber: -1 }).select('_id title chapterNumber');

    return NextResponse.json({
      success: true,
      data: {
        ...chapter.toObject(),
        nextChapter,
        prevChapter
      }
    });
  } catch (error) {
    console.error('Chapter detayları hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Chapter detayları alınamadı' },
      { status: 500 }
    );
  }
}

// PUT /api/chapters/[id] - Chapter güncelle (Admin only)
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
      publishedAt,
      originalLanguage
    } = body;

    const chapter = await ChapterModel.findById(params.id);
    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter bulunamadı' },
        { status: 404 }
      );
    }

    // Check if chapter number already exists for this manga (except current)
    if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
      const existingChapter = await ChapterModel.findOne({ 
        mangaId: chapter.mangaId, 
        chapterNumber,
        _id: { $ne: params.id }
      });
      if (existingChapter) {
        return NextResponse.json(
          { success: false, error: 'Bu chapter numarası zaten mevcut' },
          { status: 409 }
        );
      }
    }

    // Validate pages if provided
    if (pages && Array.isArray(pages)) {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page.pageNumber || !page.imageUrl || !page.width || !page.height) {
          return NextResponse.json(
            { success: false, error: `Sayfa ${i + 1} eksik bilgiler içeriyor` },
            { status: 400 }
          );
        }
      }
    }

    // Update fields
    if (title) chapter.title = title;
    if (chapterNumber) chapter.chapterNumber = chapterNumber;
    if (volume) chapter.volume = volume;
    if (pages) chapter.pages = pages;
    if (publishedAt) chapter.publishedAt = new Date(publishedAt);
    if (originalLanguage) chapter.originalLanguage = originalLanguage;

    const updatedChapter = await chapter.save();

    // Update first and last chapter references if chapter number changed
    if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
      const firstChapter = await ChapterModel.findOne({ mangaId: chapter.mangaId })
        .sort({ chapterNumber: 1 });
      const lastChapter = await ChapterModel.findOne({ mangaId: chapter.mangaId })
        .sort({ chapterNumber: -1 });

      await MangaModel.findByIdAndUpdate(chapter.mangaId, {
        firstChapter: firstChapter?._id,
        lastChapter: lastChapter?._id
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedChapter,
      message: 'Chapter başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Chapter güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Chapter güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE /api/chapters/[id] - Chapter sil (Admin only)
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

    const mangaId = chapter.mangaId;

    // Delete the chapter
    await ChapterModel.findByIdAndDelete(params.id);

    // Remove from manga's chapters array
    await MangaModel.findByIdAndUpdate(mangaId, {
      $pull: { chapters: params.id }
    });

    // Update first and last chapter references
    const firstChapter = await ChapterModel.findOne({ mangaId })
      .sort({ chapterNumber: 1 });
    const lastChapter = await ChapterModel.findOne({ mangaId })
      .sort({ chapterNumber: -1 });

    await MangaModel.findByIdAndUpdate(mangaId, {
      firstChapter: firstChapter?._id || null,
      lastChapter: lastChapter?._id || null
    });

    return NextResponse.json({
      success: true,
      message: 'Chapter başarıyla silindi'
    });
  } catch (error) {
    console.error('Chapter silme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Chapter silinemedi' },
      { status: 500 }
    );
  }
}