import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Manga from '@/lib/models/Manga';
import User from '@/lib/models/User';
import { requireAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Verify token and get user ID
    const authResult = await requireAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }

    await connectDB();

    const { mangaId, rating } = await request.json();

    if (!mangaId || rating === undefined) {
      return NextResponse.json(
        { success: false, error: 'Manga ID ve puan gerekli' },
        { status: 400 }
      );
    }

    if (rating < 0 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Puan 0-5 arasında olmalı' },
        { status: 400 }
      );
    }

    // Get user ID from authenticated request
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID bulunamadı' },
        { status: 401 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return NextResponse.json(
        { success: false, error: 'Manga bulunamadı' },
        { status: 404 }
      );
    }

    // Initialize ratings array if it doesn't exist
    if (!manga.ratings) manga.ratings = [];

    // Find existing rating by this user
    const existingRatingIndex = manga.ratings.findIndex(
      (r: any) => r.userId.toString() === userId
    );

    if (rating === 0) {
      // Remove rating
      if (existingRatingIndex !== -1) {
        manga.ratings.splice(existingRatingIndex, 1);
      }
    } else {
      // Add or update rating
      if (existingRatingIndex !== -1) {
        manga.ratings[existingRatingIndex].rating = rating;
      } else {
        manga.ratings.push({ userId, rating, createdAt: new Date() });
      }
    }

    // Calculate new average rating
    if (manga.ratings.length > 0) {
      const totalRating = manga.ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
      manga.rating = totalRating / manga.ratings.length;
      manga.ratingCount = manga.ratings.length;
    } else {
      manga.rating = 0;
      manga.ratingCount = 0;
    }

    await manga.save();

    return NextResponse.json({
      success: true,
      userRating: rating,
      newRating: manga.rating,
      ratingCount: manga.ratingCount,
    });

  } catch (error) {
    console.error('Rate API error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}