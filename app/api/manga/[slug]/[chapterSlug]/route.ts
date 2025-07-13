import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import ChapterModel from '@/lib/models/Chapter';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; chapterSlug: string } }
) {
  try {
    await connectToDatabase();

    // Check if user is admin
    const authResult = await authMiddleware(req);
    const isAdmin = authResult.success && authResult.user?.role === 'admin';

    const { slug, chapterSlug } = params;

    // Önce manga'yı bul (ID, slug veya title ile)
    let manga = null;
    
    // ObjectId kontrolü
    if (mongoose.Types.ObjectId.isValid(slug)) {
      manga = await MangaModel.findById(slug).select('_id title slug isPrivate');
    }
    
    // Slug ile ara
    if (!manga) {
      manga = await MangaModel.findOne({ slug: slug }).select('_id title slug isPrivate');
    }
    
    // Title ile ara (case-insensitive)
    if (!manga) {
      manga = await MangaModel.findOne({
        title: { $regex: new RegExp(`^${slug.replace(/[-_]/g, '\\s*')}$`, 'i') }
      }).select('_id title slug isPrivate');
    }

    if (!manga) {
      return NextResponse.json({ success: false, error: 'Manga bulunamadı' }, { status: 404 });
    }

    // Check if manga is private and user is not admin
    if (manga.isPrivate && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Bu manga özel ve sadece yöneticiler tarafından görüntülenebilir' },
        { status: 403 }
      );
    }

    // Chapter numarasını al - farklı formatları destekle
    let chapterNumber;
    if (chapterSlug.startsWith('chapter-')) {
      chapterNumber = parseInt(chapterSlug.replace('chapter-', ''), 10);
    } else if (chapterSlug.startsWith('bolum-')) {
      chapterNumber = parseInt(chapterSlug.replace('bolum-', ''), 10);
    } else {
      chapterNumber = parseInt(chapterSlug, 10);
    }
    
    if (isNaN(chapterNumber)) {
      return NextResponse.json({ success: false, error: 'Geçersiz bölüm numarası' }, { status: 400 });
    }

    // Chapter'ı bul
    const chapter = await ChapterModel.findOne({
      mangaId: manga._id,
      chapterNumber
    }).populate('mangaId', 'title slug type');

    if (!chapter) {
      return NextResponse.json({ success: false, error: 'Bölüm bulunamadı' }, { status: 404 });
    }

    // Önceki ve sonraki bölümleri bul
    const prevChapter = await ChapterModel.findOne({
      mangaId: manga._id,
      chapterNumber: { $lt: chapterNumber }
    })
      .sort({ chapterNumber: -1 })
      .select('chapterNumber');

    const nextChapter = await ChapterModel.findOne({
      mangaId: manga._id,
      chapterNumber: { $gt: chapterNumber }
    })
      .sort({ chapterNumber: 1 })
      .select('chapterNumber');

    // Chapter verilerini hazırla
    const chapterData = {
      ...chapter.toObject(),
      manga: {
        _id: manga._id,
        title: manga.title,
        slug: manga.slug,
        type: (chapter.mangaId as any)?.type || null
      },
      prevChapter: prevChapter ? {
        chapterNumber: prevChapter.chapterNumber
      } : null,
      nextChapter: nextChapter ? {
        chapterNumber: nextChapter.chapterNumber
      } : null
    };

    return NextResponse.json({
      success: true,
      data: chapterData
    });
  } catch (error) {
    console.error('Bölüm getirme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}