import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Manga from '@/lib/models/Manga';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { mangaId, action } = await request.json();

    if (!mangaId) {
      return NextResponse.json(
        { success: false, error: 'Manga ID gerekli' },
        { status: 400 }
      );
    }

    // Get user from token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token gerekli' },
        { status: 401 }
      );
    }

    let userId;
    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz token' },
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

    // Initialize like arrays if they don't exist
    if (!manga.likes) manga.likes = [];
    if (!manga.dislikes) manga.dislikes = [];

    // Remove user from both arrays first
    manga.likes = manga.likes.filter((id: any) => id.toString() !== userId);
    manga.dislikes = manga.dislikes.filter((id: any) => id.toString() !== userId);

    let userLike = null;

    // Add to appropriate array based on action
    if (action === 'like') {
      manga.likes.push(userId);
      userLike = 'like';
    } else if (action === 'dislike') {
      manga.dislikes.push(userId);
      userLike = 'dislike';
    }

    // Update counts
    manga.likeCount = manga.likes.length;
    manga.dislikeCount = manga.dislikes.length;

    await manga.save();

    return NextResponse.json({
      success: true,
      userLike,
      likeCount: manga.likeCount,
      dislikeCount: manga.dislikeCount,
    });

  } catch (error) {
    console.error('Like API error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}