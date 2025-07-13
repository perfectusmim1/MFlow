import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { authMiddleware } from '@/lib/middleware';
import slugify from 'slugify';

// Safe model import function
function getMangaModel() {
  try {
    // Try to get from mongoose.models first
    if (typeof window === 'undefined') {
      const mongoose = require('mongoose');
      if (mongoose.models.Manga) {
        return mongoose.models.Manga;
      }
      // If not found, import the model file
      return require('@/lib/models/Manga').default;
    }
  } catch (error) {
    console.error('Error getting Manga model:', error);
    throw error;
  }
}

function getChapterModel() {
  try {
    if (typeof window === 'undefined') {
      const mongoose = require('mongoose');
      if (mongoose.models.Chapter) {
        return mongoose.models.Chapter;
      }
      return require('@/lib/models/Chapter').default;
    }
  } catch (error) {
    console.error('Error getting Chapter model:', error);
    throw error;
  }
}

// GET /api/manga - Manga listesi
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get models safely
    const MangaModel = getMangaModel();
    const ChapterModel = getChapterModel();
    
    // Check if user is admin
    const authResult = await authMiddleware(req);
    const isAdmin = authResult.success && authResult.user?.role === 'admin';
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const adminPanel = searchParams.get('admin') === 'true'; // Admin paneli kontrolü
    const fields = searchParams.get('fields'); // Fields parametresi

    const skip = (page - 1) * limit;
    
    // Build sort
    const sortObj: any = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Build match conditions
    const matchConditions: any = {};

    // Filter private manga (only show to admin when admin panel is requested)
    if (!isAdmin || (isAdmin && !adminPanel)) {
      matchConditions.isPrivate = { $ne: true };
    }

    // Search in title, author, description
    if (search && search.trim()) {
      matchConditions.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { author: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { genres: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Filter by genre
    if (genre && genre.trim()) {
      matchConditions.genres = { $regex: genre.trim(), $options: 'i' };
    }

    // Filter by status
    if (status && status.trim()) {
      matchConditions.status = status.trim();
    }

    // Filter by type
    if (type && type.trim()) {
      matchConditions.type = type.trim();
    }

    // Build projection based on fields parameter
    let projectStage: any = {
      title: 1,
      slug: 1,
      coverImage: 1,
      rating: 1,
      viewCount: 1,
      status: 1,
      type: 1,
      author: 1,
      artist: 1,
      genres: 1,
      description: 1,
      lastChapter: { $arrayElemAt: ["$lastChapterData", 0] },
      createdAt: 1,
      updatedAt: 1,
      isPrivate: 1,
      totalChapters: { $size: "$allChapters" },
      latestChapters: "$allChapters"
    };

    // If fields parameter is provided, use only those fields
    if (fields) {
      const requestedFields = fields.split(',').map(f => f.trim());
      const newProjectStage: any = { _id: 1 }; // Always include _id
      
      requestedFields.forEach(field => {
        if (field === 'totalChapters') {
          newProjectStage.totalChapters = { $size: "$allChapters" };
        } else if (projectStage[field] !== undefined) {
          newProjectStage[field] = projectStage[field];
        } else {
          newProjectStage[field] = 1;
        }
      });
      
      projectStage = newProjectStage;
    }

    const mangaPipeline: any[] = [
      ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
      {
        $lookup: {
          from: 'chapters',
          localField: '_id',
          foreignField: 'mangaId',
          as: 'allChapters',
          pipeline: [
            { $match: { isPrivate: { $ne: true } } },
            { $sort: { chapterNumber: -1 } },
            { $limit: 3 },
            { $project: { chapterNumber: 1, title: 1, slug: 1, createdAt: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'chapters',
          localField: 'lastChapter',
          foreignField: '_id',
          as: 'lastChapterData',
          pipeline: [
            { $project: { chapterNumber: 1, title: 1, slug: 1 } }
          ]
        }
      },
      {
        $project: projectStage
      },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limit }
    ];

    // Add collation for title sorting
    const aggregateOptions: any = {};
    if (sort === 'title') {
      aggregateOptions.collation = {
        locale: 'tr',
        strength: 1,
        caseLevel: false
      };
    }

    const manga = await MangaModel.aggregate(mangaPipeline, aggregateOptions);

    // Count total with same match conditions
    const countPipeline: any[] = [
      ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
      { $count: "total" }
    ];
    
    const countResult = await MangaModel.aggregate(countPipeline, aggregateOptions);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    return NextResponse.json({
      success: true,
      mangas: manga,
      data: manga,
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
    console.error('Manga listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Manga listesi alınamadı: ' + (error as any).message },
      { status: 500 }
    );
  }
}

// POST /api/manga - Yeni manga oluştur (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Get model safely
    const MangaModel = getMangaModel();
    
    const body = await req.json();
    const {
      title,
      titleAlternative,
      description,
      author,
      artist,
      genres,
      tags,
      status,
      type,
      coverImage,
      bannerImage,
      isNSFW,
      originalLanguage,
      publishedAt,
      isPrivate
    } = body;

    // Detailed validation
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Manga başlığı gerekli');
    }
    
    if (!description || description.trim().length === 0) {
      errors.push('Manga açıklaması gerekli');
    }
    
    if (!author || (Array.isArray(author) && author.length === 0)) {
      errors.push('En az bir yazar gerekli');
    }
    
    if (!genres || (Array.isArray(genres) && genres.length === 0)) {
      errors.push('En az bir tür seçimi gerekli');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    // Check if manga with same title exists
    const existingManga = await MangaModel.findOne({ title: title.trim() });
    if (existingManga) {
      return NextResponse.json(
        { success: false, error: 'Bu isimde bir manga zaten mevcut' },
        { status: 409 }
      );
    }

    const slug = slugify(title.trim(), {
      lower: true,
      strict: true,
      locale: 'tr'
    });

    const manga = new MangaModel({
      title: title.trim(),
      slug,
      titleAlternative: titleAlternative || [],
      description: description.trim(),
      author: Array.isArray(author) ? author.filter(a => a.trim()) : [author].filter(a => a.trim()),
      artist: Array.isArray(artist) ? artist.filter(a => a.trim()) : [artist].filter(a => a.trim()),
      genres: Array.isArray(genres) ? genres : [genres],
      tags: tags || [],
      status: status || 'ongoing',
      type: type || 'manga',
      coverImage,
      bannerImage,
      isNSFW: isNSFW || false,
      originalLanguage: originalLanguage || 'ja',
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      isPrivate: isPrivate || false
    });

    const savedManga = await manga.save();

    return NextResponse.json({
      success: true,
      data: savedManga,
      message: 'Manga başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Manga oluşturma hatası:', error);
    
    // MongoDB validation errors
    if ((error as any).name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: `Doğrulama hatası: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Bu manga zaten mevcut' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Manga oluşturulamadı: ' + (error as any).message },
      { status: 500 }
    );
  }
}

// PUT /api/manga - Manga güncelle (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Get model safely
    const MangaModel = getMangaModel();
    
    const body = await req.json();
    const {
      id,
      title,
      titleAlternative,
      description,
      author,
      artist,
      genres,
      tags,
      status,
      type,
      bannerImage,
      isNSFW,
      originalLanguage,
      publishedAt,
      isPrivate
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Manga ID gerekli' },
        { status: 400 }
      );
    }

    // Find existing manga
    const existingManga = await MangaModel.findById(id);
    if (!existingManga) {
      return NextResponse.json(
        { success: false, error: 'Manga bulunamadı' },
        { status: 404 }
      );
    }

    // Detailed validation
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Manga başlığı gerekli');
    }
    
    if (!description || description.trim().length === 0) {
      errors.push('Manga açıklaması gerekli');
    }
    
    if (!author || (Array.isArray(author) && author.length === 0)) {
      errors.push('En az bir yazar gerekli');
    }
    
    if (!genres || (Array.isArray(genres) && genres.length === 0)) {
      errors.push('En az bir tür seçimi gerekli');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    // Check if another manga with same title exists (excluding current manga)
    const duplicateManga = await MangaModel.findOne({ 
      title: title.trim(),
      _id: { $ne: id }
    });
    if (duplicateManga) {
      return NextResponse.json(
        { success: false, error: 'Bu isimde başka bir manga zaten mevcut' },
        { status: 409 }
      );
    }

    // Update slug if title changed
    let slug = existingManga.slug;
    if (title.trim() !== existingManga.title) {
      slug = slugify(title.trim(), {
        lower: true,
        strict: true,
        locale: 'tr'
      });
    }

    // Update manga
    const updatedManga = await MangaModel.findByIdAndUpdate(
      id,
      {
        title: title.trim(),
        slug,
        titleAlternative: titleAlternative || [],
        description: description.trim(),
        author: Array.isArray(author) ? author.filter(a => a.trim()) : [author].filter(a => a.trim()),
        artist: Array.isArray(artist) ? artist.filter(a => a.trim()) : [artist].filter(a => a.trim()),
        genres: Array.isArray(genres) ? genres : [genres],
        tags: tags || [],
        status: status || 'ongoing',
        type: type || 'manga',
        bannerImage,
        isNSFW: isNSFW || false,
        originalLanguage: originalLanguage || 'ja',
        publishedAt: publishedAt ? new Date(publishedAt) : existingManga.publishedAt,
        isPrivate: isPrivate || false,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedManga,
      message: 'Manga başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Manga güncelleme hatası:', error);
    
    // MongoDB validation errors
    if ((error as any).name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: `Doğrulama hatası: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Bu manga zaten mevcut' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Manga güncellenemedi: ' + (error as any).message },
      { status: 500 }
    );
  }
}