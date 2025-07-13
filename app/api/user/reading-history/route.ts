import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import UserModel from '@/lib/models/User';
import MangaModel from '@/lib/models/Manga'; // Add this import
import ChapterModel from '@/lib/models/Chapter'; // Add this import
import { authMiddleware } from '@/lib/middleware';

// GET /api/user/reading-history - Get user's reading history
export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await UserModel.findById(authResult.user._id)
      .populate({
        path: 'readingHistory.mangaId',
        model: 'Manga',
        select: 'title slug coverImage author status type genres description'
      })
      .populate({
        path: 'readingHistory.chapterId',
        model: 'Chapter',
        select: 'title chapterNumber slug'
      });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Sort by readAt descending (newest first)
    const sortedHistory = (user.readingHistory || []).sort((a, b) => 
      new Date(b.readAt).getTime() - new Date(a.readAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: sortedHistory
    });

  } catch (error) {
    console.error('Reading history fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Okuma geçmişi yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/user/reading-history - Add reading history entry
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { mangaId, chapterId, pageNumber, readingTime } = await req.json();

    if (!mangaId || !chapterId || pageNumber === undefined) {
      return NextResponse.json(
        { success: false, error: 'MangaId, chapterId ve pageNumber gerekli' },
        { status: 400 }
      );
    }

    const userId = authResult.user._id;
    
    // Get the user to work with their reading history
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Find existing entry for this chapter
    const existingEntryIndex = user.readingHistory.findIndex(entry => 
      entry.mangaId?.toString() === mangaId && entry.chapterId?.toString() === chapterId
    );

    if (existingEntryIndex !== -1) {
      // Update existing entry
      const existingEntry = user.readingHistory[existingEntryIndex];
      existingEntry.pageNumber = pageNumber;
      existingEntry.readAt = new Date();
      if (readingTime) {
        existingEntry.readingTime = (existingEntry.readingTime || 0) + readingTime;
      }

      // Remove from current position and add to beginning
      user.readingHistory.splice(existingEntryIndex, 1);
      user.readingHistory.unshift(existingEntry);
    } else {
      // Create new entry and add to beginning
      const newEntry = {
        mangaId,
        chapterId,
        pageNumber,
        readAt: new Date(),
        readingTime: readingTime || 0
      };
      user.readingHistory.unshift(newEntry);
    }

    // Clean up old entries (keep only last 50)
    if (user.readingHistory.length > 50) {
      user.readingHistory = user.readingHistory.slice(0, 50);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Okuma geçmişi güncellendi'
    });

  } catch (error) {
    console.error('Add reading history error:', error);
    return NextResponse.json(
      { success: false, error: 'Okuma geçmişi eklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/reading-history - Clear all reading history
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await UserModel.findById(authResult.user._id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    user.readingHistory = [];
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Okuma geçmişi temizlendi'
    });

  } catch (error) {
    console.error('Clear reading history error:', error);
    return NextResponse.json(
      { success: false, error: 'Okuma geçmişi temizlenirken hata oluştu' },
      { status: 500 }
    );
  }
}