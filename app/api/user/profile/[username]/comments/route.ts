import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import CommentModel from '@/lib/models/Comment';

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    await connectDB();

    const user = await UserModel.findOne({ username: params.username })
      .select('username _id');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcının yorumlarını getir (en yeni önce)
    const comments = await CommentModel.find({ 
      userId: user._id, 
      isDeleted: false 
    })
      .populate({
        path: 'mangaId',
        select: 'title slug coverImage'
      })
      .populate({
        path: 'chapterId',
        select: 'title chapterNumber',
        populate: {
          path: 'mangaId',
          select: 'title slug'
        }
      })
      .sort({ createdAt: -1 })
      .limit(50); // Son 50 yorum

    // Yorumları formatla
    const formattedComments = comments.map((comment: any) => ({
      _id: comment._id,
      content: comment.content,
      createdAt: comment.createdAt,
      isEdited: comment.isEdited,
      likeCount: comment.likes?.length || 0,
      replyCount: comment.replies?.length || 0,
      manga: comment.mangaId ? {
        _id: comment.mangaId._id,
        title: comment.mangaId.title,
        slug: comment.mangaId.slug,
        coverImage: comment.mangaId.coverImage
      } : null,
      chapter: comment.chapterId ? {
        _id: comment.chapterId._id,
        title: comment.chapterId.title,
        chapterNumber: comment.chapterId.chapterNumber,
        manga: {
          _id: comment.chapterId.mangaId._id,
          title: comment.chapterId.mangaId.title,
          slug: comment.chapterId.mangaId.slug
        }
      } : null
    }));

    const responseData = {
      username: user.username,
      comments: formattedComments,
      totalCount: formattedComments.length
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}