import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import CommentModel from '@/lib/models/Comment';
import { authMiddleware } from '@/lib/middleware';

// GET - Manga yorumlarını getir
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get('mangaId');
    const chapterId = searchParams.get('chapterId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!mangaId && !chapterId) {
      return NextResponse.json(
        { success: false, error: 'Manga ID veya Chapter ID gerekli' },
        { status: 400 }
      );
    }

    let comments;
    let total;

    if (mangaId) {
      comments = await CommentModel.findByManga(mangaId, page, limit);
      total = await CommentModel.countByManga(mangaId);
    } else {
      comments = await CommentModel.findByChapter(chapterId!, page, limit);
      total = await CommentModel.countByChapter(chapterId!);
    }

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Comments fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Yorumlar yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni yorum ekle
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yorum yapmak için giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectDB();

    const { mangaId, chapterId, parentId, content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Yorum içeriği boş olamaz' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Yorum 1000 karakterden uzun olamaz' },
        { status: 400 }
      );
    }

    if (!mangaId && !chapterId) {
      return NextResponse.json(
        { success: false, error: 'Manga ID veya Chapter ID gerekli' },
        { status: 400 }
      );
    }

    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bilgisi bulunamadı' },
        { status: 401 }
      );
    }

    const commentData: any = {
      userId: authResult.user._id,
      content: content.trim(),
    };

    if (mangaId) commentData.mangaId = mangaId;
    if (chapterId) commentData.chapterId = chapterId;
    if (parentId) commentData.parentId = parentId;

    const comment = new CommentModel(commentData);
    await comment.save();

    // If this is a reply, add it to parent's replies array
    if (parentId) {
      const parentComment = await CommentModel.findById(parentId);
      if (parentComment) {
        await parentComment.addReply(comment._id);
      }
    }

    // Populate user data for response
    await comment.populate('userId', 'username avatar');

    return NextResponse.json({
      success: true,
      data: comment,
      message: 'Yorum başarıyla eklendi'
    });

  } catch (error: any) {
    console.error('Comment creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Yorum eklenirken hata oluştu' },
      { status: 500 }
    );
  }
}