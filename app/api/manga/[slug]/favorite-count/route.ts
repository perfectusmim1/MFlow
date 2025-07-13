import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import UserModel from '@/lib/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase();
    
    const mangaId = params.slug;
    
    // Bu manga'yı favorilerine ekleyen kullanıcı sayısını hesapla
    const favoriteCount = await UserModel.countDocuments({
      favorites: mangaId
    });

    return NextResponse.json({
      success: true,
      data: {
        favoriteCount: favoriteCount || 0
      }
    });

  } catch (error) {
    console.error('Favorite count fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}