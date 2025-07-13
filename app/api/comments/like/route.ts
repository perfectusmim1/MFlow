import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import CommentModel from '@/lib/models/Comment';
import { authMiddleware } from '@/lib/middleware';
import mongoose from 'mongoose';

// POST - Yorumu beğen/beğenme
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { commentId, action } = await request.json();

    if (!commentId || !action) {
      return NextResponse.json(
        { success: false, error: 'Yorum ID ve aksiyon gerekli' },
        { status: 400 }
      );
    }

    if (!['like', 'dislike', 'remove_like', 'remove_dislike'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz aksiyon' },
        { status: 400 }
      );
    }

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Yorum bulunamadı' },
        { status: 404 }
      );
    }

    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bilgisi bulunamadı' },
        { status: 401 }
      );
    }

    const userId = authResult.user._id;

    switch (action) {
      case 'like':
        await comment.addLike(userId);
        break;
      case 'dislike':
        await comment.addDislike(userId);
        break;
      case 'remove_like':
        await comment.removeLike(userId);
        break;
      case 'remove_dislike':
        await comment.removeDislike(userId);
        break;
    }

    // Return updated comment with counts
    const updatedComment = await CommentModel.findById(commentId)
      .populate('userId', 'username avatar');

    if (!updatedComment) {
      return NextResponse.json(
        { success: false, error: 'Güncellenmiş yorum bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        comment: updatedComment,
        likeCount: updatedComment.likes.length,
        dislikeCount: updatedComment.dislikes.length,
        userLiked: updatedComment.likes.some((id: any) => id.toString() === userId),
        userDisliked: updatedComment.dislikes.some((id: any) => id.toString() === userId)
      },
      message: 'İşlem başarıyla tamamlandı'
    });

  } catch (error: any) {
    console.error('Comment like/dislike error:', error);
    return NextResponse.json(
      { success: false, error: 'İşlem sırasında hata oluştu' },
      { status: 500 }
    );
  }
}