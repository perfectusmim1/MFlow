import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import ChapterModel from '@/lib/models/Chapter';
import MangaModel from '@/lib/models/Manga';
import { authMiddleware } from '@/lib/middleware';

// GET /api/chapters - Chapter listesi
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check if user is admin
    const authResult = await authMiddleware(req);
    const isAdmin = authResult.success && authResult.user?.role === 'admin';
    
    const { searchParams } = new URL(req.url);
    const mangaId = searchParams.get('mangaId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'chapterNumber';
    const order = searchParams.get('order') || 'asc';

    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};
    if (mangaId) {
      query.mangaId = mangaId;
      
      // Check if the manga is private and user is not admin
      if (!isAdmin) {
        const manga = await MangaModel.findById(mangaId);
        if (manga && manga.isPrivate) {
          return NextResponse.json({
            success: true,
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          });
        }
      }
    }
    
    // Add search filter
    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    // Filter unpublished chapters (only show to admin)
    if (!isAdmin) {
      query.isPublished = { $ne: false };
    }

    // Build sort
    const sortObj: any = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    let chapters;
    if (!isAdmin && !mangaId) {
      // If not admin and no specific mangaId, exclude chapters from private manga
      chapters = await ChapterModel.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'mangaId',
          select: 'title slug coverImage type isPrivate',
          match: { isPrivate: { $ne: true } }
        });
      
      // Filter out chapters where mangaId is null (private manga)
      chapters = chapters.filter(chapter => chapter.mangaId !== null);
    } else {
      chapters = await ChapterModel.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('mangaId', 'title slug coverImage type');
    }

    let total;
    if (!isAdmin && !mangaId) {
      // Count chapters excluding private manga
      const allChapters = await ChapterModel.find(query)
        .populate({
          path: 'mangaId',
          select: 'isPrivate',
          match: { isPrivate: { $ne: true } }
        });
      total = allChapters.filter(chapter => chapter.mangaId !== null).length;
    } else {
      total = await ChapterModel.countDocuments(query);
    }

    return NextResponse.json({
      success: true,
      data: chapters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Chapter listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Chapter listesi alınamadı' },
      { status: 500 }
    );
  }
}

// POST /api/chapters - Yeni chapter oluştur (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const body = await req.json();
    console.log('Chapter oluşturma isteği:', body);
    
    const {
      mangaId,
      title,
      chapterNumber,
      volume,
      pages,
      publishedAt,
      originalLanguage
    } = body;

    // chapterNumber'ı sayıya dönüştür
    const numChapterNumber = parseInt(chapterNumber, 10);

    // Detailed validation
    const errors = [];
    
    if (!mangaId || mangaId.trim().length === 0) {
      errors.push('Manga ID gerekli');
    }
    
    if (!title || title.trim().length === 0) {
      errors.push('Chapter başlığı gerekli');
    }
    
    if (isNaN(numChapterNumber) || numChapterNumber < 0) {
      errors.push('Geçerli chapter numarası gerekli');
    }
    
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      errors.push('En az bir sayfa gerekli');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
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

    // Check if chapter number already exists for this manga
    console.log('Checking for existing chapter with:', { 
      mangaId, 
      chapterNumber: numChapterNumber,
      typeOfChapterNumber: typeof numChapterNumber 
    });

    // Debug: List all chapters for this manga
    const allChapters = await ChapterModel.find({ mangaId })
      .select('_id chapterNumber title')
      .sort({ chapterNumber: 1 });
    console.log('All chapters for this manga:', JSON.stringify(allChapters, null, 2));
    
    const existingChapter = await ChapterModel.findOne({ 
      mangaId, 
      chapterNumber: numChapterNumber
    });

    console.log('Existing chapter query result:', existingChapter ? {
      _id: existingChapter._id,
      chapterNumber: existingChapter.chapterNumber,
      title: existingChapter.title
    } : null);
    
    if (existingChapter) {
      return NextResponse.json(
        { success: false, error: 'Bu chapter numarası zaten mevcut' },
        { status: 409 }
      );
    }

    // Validate pages
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page.pageNumber || !page.imageUrl) {
        return NextResponse.json(
          { success: false, error: `Sayfa ${i + 1} eksik bilgiler içeriyor (pageNumber: ${page.pageNumber}, imageUrl: ${page.imageUrl})` },
          { status: 400 }
        );
      }
      
      // Width ve height opsiyonel yap, varsayılan değerler ata
      if (!page.width) page.width = 800;
      if (!page.height) page.height = 1200;
      if (!page.textRegions) page.textRegions = [];
      if (!page.translatedVersions) page.translatedVersions = [];
    }

    const chapter = new ChapterModel({
      mangaId,
      title: title.trim(),
      chapterNumber: numChapterNumber,
      volume,
      pages,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      originalLanguage: originalLanguage || manga.originalLanguage || 'ja',
      isPublished: true
      // slug pre-save middleware'de otomatik oluşturulacak
    });

    console.log('Chapter oluşturuluyor:', {
      mangaId,
      title: title.trim(),
      chapterNumber: numChapterNumber,
      slug: chapter.slug
    });

    const savedChapter = await chapter.save();
    console.log('Chapter kaydedildi:', savedChapter._id);

    // Update manga's total chapters count and add to chapters array
    const chapterCount = await ChapterModel.countDocuments({ mangaId });
    await MangaModel.findByIdAndUpdate(mangaId, {
      totalChapters: chapterCount,
      $addToSet: { chapters: savedChapter._id },
      $set: {
        lastChapter: savedChapter._id,
        ...(chapterCount === 1 && { firstChapter: savedChapter._id })
      }
    });

    return NextResponse.json({
      success: true,
      data: savedChapter,
      message: 'Chapter başarıyla oluşturuldu'
    });
  } catch (error: any) {
    console.error('Chapter oluşturma hatası:', error);
    
    // MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: `Doğrulama hatası: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Bu chapter zaten mevcut' },
        { status: 409 }
      );
    }
    
    // Cast error (invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Geçersiz manga ID' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Chapter oluşturulamadı: ' + error.message },
      { status: 500 }
    );
  }
}