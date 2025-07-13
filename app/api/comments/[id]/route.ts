import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import CommentModel from '@/lib/models/Comment';
import { authMiddleware } from '@/lib/middleware';

// PUT - Yorumu düzenle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { content } = await request.json();
    const commentId = params.id;

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

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Yorum bulunamadı' },
        { status: 404 }
      );
    }

    // Check if user owns the comment
    if (!authResult.user || comment.userId.toString() !== authResult.user._id) {
      return NextResponse.json(
        { success: false, error: 'Bu yorumu düzenleme yetkiniz yok' },
        { status: 403 }
      );
    }

    comment.content = content.trim();
    comment.isEdited = true;
    await comment.save();

    await comment.populate('userId', 'username avatar');

    return NextResponse.json({
      success: true,
      data: comment,
      message: 'Yorum başarıyla güncellendi'
    });

  } catch (error: any) {
    console.error('Comment update error:', error);
    return NextResponse.json(
      { success: false, error: 'Yorum güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Yorumu sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const commentId = params.id;
    const comment = await CommentModel.findById(commentId);
    
    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Yorum bulunamadı' },
        { status: 404 }
      );
    }

    // Check if user owns the comment or is admin
    if (!authResult.user || (comment.userId.toString() !== authResult.user._id && authResult.user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Bu yorumu silme yetkiniz yok' },
        { status: 403 }
      );
    }

    // Soft delete
    comment.isDeleted = true;
    comment.content = '[Silinen yorum]';
    await comment.save();

    return NextResponse.json({
      success: true,
      message: 'Yorum başarıyla silindi'
    });

  } catch (error: any) {
    console.error('Comment delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Yorum silinirken hata oluştu' },
      { status: 500 }
    );
  }
}