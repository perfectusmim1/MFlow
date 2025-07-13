import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import ReactionModel from '@/lib/models/Reaction';
import { authMiddleware } from '@/lib/middleware';

// GET - Tepkileri getir
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json(
        { success: false, error: 'Target type ve target ID gerekli' },
        { status: 400 }
      );
    }

    // Try to get user info (optional)
    let userId: string | undefined;
    let userIp: string | undefined;
    
    try {
      const authResult = await authMiddleware(request);
      if (authResult.success && authResult.user) {
        userId = authResult.user._id;
      }
    } catch (error) {
      // Auth failed, continue as anonymous user
    }

    // Get user IP for anonymous users
    if (!userId) {
      userIp = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               'anonymous';
    }

    const reactions = await ReactionModel.findByTarget(targetType, targetId, userId, userIp);

    return NextResponse.json({
      success: true,
      data: reactions
    });

  } catch (error: any) {
    console.error('Reactions fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Tepkiler yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Tepki ekle/çıkar
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { targetType, targetId, reactionName } = await request.json();

    if (!targetType || !targetId || !reactionName) {
      return NextResponse.json(
        { success: false, error: 'Eksik parametreler' },
        { status: 400 }
      );
    }

    // Try to get user info (optional)
    let userId: string | undefined;
    let userIp: string | undefined;
    
    try {
      const authResult = await authMiddleware(request);
      if (authResult.success && authResult.user) {
        userId = authResult.user._id;
      }
    } catch (error) {
      // Auth failed, continue as anonymous user
    }

    // Get user IP for anonymous users
    if (!userId) {
      userIp = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               'anonymous';
    }

    // Check if user/IP already reacted with this reaction
    const query: any = {
      targetType,
      targetId,
      reactionName
    };

    if (userId) {
      query.userId = userId;
    } else {
      query.userIp = userIp;
    }

    const existingReaction = await ReactionModel.findOne(query);

    let result;
    if (existingReaction) {
      // Remove reaction
      await ReactionModel.deleteOne({ _id: existingReaction._id });
      const count = await ReactionModel.countDocuments({
        targetType,
        targetId,
        reactionName
      });
      result = { count, userReacted: false };
    } else {
      // Add reaction
      const reactionData: any = {
        targetType,
        targetId,
        reactionName
      };

      if (userId) {
        reactionData.userId = userId;
      } else {
        reactionData.userIp = userIp;
      }

      const reaction = new ReactionModel(reactionData);
      await reaction.save();
      
      const count = await ReactionModel.countDocuments({
        targetType,
        targetId,
        reactionName
      });
      result = { _id: reaction._id, count, userReacted: true };
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: existingReaction ? 'Tepki kaldırıldı' : 'Tepki eklendi'
    });

  } catch (error: any) {
    console.error('Reaction error:', error);
    return NextResponse.json(
      { success: false, error: 'Tepki işlemi sırasında hata oluştu' },
      { status: 500 }
    );
  }
}