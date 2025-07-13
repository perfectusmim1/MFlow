import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import MangaModel from '@/lib/models/Manga';
import ChapterModel from '@/lib/models/Chapter';
import { authMiddleware } from '@/lib/middleware';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Global type declaration
declare global {
  var viewCache: Map<string, number> | undefined;
}

// GET /api/manga/[slug] - Manga detayları
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    
    // Check if user is admin
    const authResult = await authMiddleware(req);
    const isAdmin = authResult.success && authResult.user?.role === 'admin';
    
    let manga = null;
    const searchParam = params.slug;
    
    // Önce ObjectId olup olmadığını kontrol et
    if (mongoose.Types.ObjectId.isValid(searchParam)) {
      manga = await MangaModel.findById(searchParam);
    }
    
    // Eğer ID ile bulunamadıysa, slug ile ara
    if (!manga) {
      manga = await MangaModel.findOne({ slug: searchParam });
    }
    
    // Eğer slug ile de bulunamadıysa, title ile ara (case-insensitive)
    if (!manga) {
      manga = await MangaModel.findOne({
        title: { $regex: new RegExp(`^${searchParam.replace(/[-_]/g, '\\s*')}$`, 'i') }
      });
    }
    
    // Son olarak titleAlternative dizisinde ara
    if (!manga) {
      manga = await MangaModel.findOne({
        titleAlternative: { $regex: new RegExp(searchParam.replace(/[-_]/g, '\\s*'), 'i') }
      });
    }

    if (!manga) {
      return NextResponse.json(
        { success: false, error: 'Manga bulunamadı' },
        { status: 404 }
      );
    }

    // Check if manga is private and user is not admin
    if (manga.isPrivate && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Bu manga özel ve sadece yöneticiler tarafından görüntülenebilir' },
        { status: 403 }
      );
    }

    const chapters = await ChapterModel.find({ mangaId: manga._id })
      .select('title chapterNumber publishedAt viewCount slug')
      .sort({ chapterNumber: 1 });

    const firstChapter = chapters[0] || null;
    const lastChapter = chapters[chapters.length - 1] || null;

    // View count'u artır - sadece ilk ziyarette
    const userAgent = req.headers.get('user-agent') || '';
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const viewKey = `${manga._id}-${clientIP}-${userAgent}`;
    
    // Simple in-memory cache for view tracking (production'da Redis kullanılabilir)
    if (!global.viewCache) {
      global.viewCache = new Map();
    }
    
    const lastView = global.viewCache.get(viewKey);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 saat
    
    // Eğer son 1 saat içinde görüntülenmediyse view count'u artır
    if (!lastView || (now - lastView) > oneHour) {
      manga.viewCount = (manga.viewCount || 0) + 1;
      await manga.save();
      global.viewCache.set(viewKey, now);
    }

    // Check user's like/dislike and rating status
    let userLike = null;
    let userRating = 0;
    
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const userId = decoded.userId;
        
        // Check if user liked/disliked
        if (manga.likes && manga.likes.includes(userId)) {
          userLike = 'like';
        } else if (manga.dislikes && manga.dislikes.includes(userId)) {
          userLike = 'dislike';
        }
        
        // Check user's rating
        if (manga.ratings) {
          const userRatingObj = manga.ratings.find((r: any) => r.userId.toString() === userId);
          if (userRatingObj) {
            userRating = userRatingObj.rating;
          }
        }
      } catch (error) {
        // Token geçersiz, kullanıcı bilgilerini ekleme
      }
    }

    const mangaWithChapters = {
      ...manga.toObject(),
      chapters,
      firstChapter,
      lastChapter,
      totalChapters: chapters.length,
      userLike,
      userRating
    };

    return NextResponse.json({
      success: true,
      data: mangaWithChapters
    });
  } catch (error) {
    console.error('Manga detayları hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Manga detayları alınamadı' },
      { status: 500 }
    );
  }
}