import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import UserModel from '@/lib/models/User';
import { authMiddleware } from '@/lib/middleware';

// PUT /api/user/settings - Update user settings
export async function PUT(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const settings = await req.json();
    
    // Validate settings
    const validThemes = ['light', 'dark'];
    const validReadingModes = ['horizontal', 'vertical', 'webtoon'];
    const validLanguages = ['tr', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
    
    if (settings.theme && !validThemes.includes(settings.theme)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz tema' },
        { status: 400 }
      );
    }
    
    if (settings.readingMode && !validReadingModes.includes(settings.readingMode)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz okuma modu' },
        { status: 400 }
      );
    }
    
    if (settings.language && !validLanguages.includes(settings.language)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz dil' },
        { status: 400 }
      );
    }
    
    if (settings.targetLanguage && !validLanguages.includes(settings.targetLanguage)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz hedef dil' },
        { status: 400 }
      );
    }

    // Update user settings
    const user = await UserModel.findByIdAndUpdate(
      authResult.user._id,
      { 
        $set: { 
          'settings.theme': settings.theme,
          'settings.language': settings.language,
          'settings.readingMode': settings.readingMode,
          'settings.autoTranslate': settings.autoTranslate,
          'settings.targetLanguage': settings.targetLanguage,
          'settings.notifications': settings.notifications,
          'settings.geminiApiKey': settings.geminiApiKey
        } 
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.settings,
      message: 'Ayarlar güncellendi'
    });

  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Ayarlar güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}