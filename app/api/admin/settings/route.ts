import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { authMiddleware } from '@/lib/middleware';

// MongoDB collection adı
const SETTINGS_COLLECTION = 'site_settings';

// Default settings
const DEFAULT_SETTINGS = {
  siteName: 'MFlow',
  siteDescription: 'Modern Manga, Manhwa, Manhua ve Webtoon okuma platformu',
  siteLogo: '/favicon.svg',
  siteUrl: 'http://localhost:3000',
  contactEmail: 'admin@mflow.com',
  socialLinks: {
    twitter: '',
    facebook: '',
    instagram: '',
    discord: ''
  },
  seoSettings: {
    metaTitle: 'MFlow - Modern Manga Okuma Deneyimi',
    metaDescription: 'En popüler manga, manhwa, manhua ve webtoon\'ları yüksek kalitede okuyun.',
    metaKeywords: 'manga, manhwa, manhua, webtoon, oku, online'
  },
  features: {
    userRegistration: true,
    commentSystem: true,
    ratingSystem: true,
    favoriteSystem: true,
    readingHistory: true,
    notifications: true
  },
  contentSettings: {
    chaptersPerPage: 20,
    autoTranslate: false,
    allowUserUploads: false,
    moderationRequired: true
  },
  emailSettings: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@mflow.com',
    fromName: 'MFlow'
  }
};

// GET /api/admin/settings - Ayarları getir
export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const { getDB } = await import('@/lib/database');
    const db = await getDB();
    const settingsCollection = db.collection(SETTINGS_COLLECTION);
    
    // Mevcut ayarları getir
    let settings = await settingsCollection.findOne({ type: 'site_settings' });
    
    if (!settings) {
      // Eğer ayarlar yoksa default ayarları oluştur
      await settingsCollection.insertOne({
        type: 'site_settings',
        ...DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      settings = { type: 'site_settings', ...DEFAULT_SETTINGS } as any;
    }

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Ayarlar alınamadı' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Ayarları güncelle
export async function PUT(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const body = await req.json();
    const {
      siteName,
      siteDescription,
      siteLogo,
      siteUrl,
      contactEmail,
      socialLinks,
      seoSettings,
      features,
      contentSettings,
      emailSettings
    } = body;

    // Validation
    if (!siteName || !siteDescription || !contactEmail) {
      return NextResponse.json(
        { success: false, error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz email adresi' },
        { status: 400 }
      );
    }

    // URL validation (eğer sağlanmışsa)
    if (siteUrl) {
      try {
        new URL(siteUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Geçersiz site URL' },
          { status: 400 }
        );
      }
    }

    const { getDB } = await import('@/lib/database');
    const db = await getDB();
    const settingsCollection = db.collection(SETTINGS_COLLECTION);
    
    const updatedSettings = {
      siteName,
      siteDescription,
      siteLogo: siteLogo || '/favicon.svg',
      siteUrl: siteUrl || 'http://localhost:3000',
      contactEmail,
      socialLinks: socialLinks || DEFAULT_SETTINGS.socialLinks,
      seoSettings: seoSettings || DEFAULT_SETTINGS.seoSettings,
      features: features || DEFAULT_SETTINGS.features,
      contentSettings: contentSettings || DEFAULT_SETTINGS.contentSettings,
      emailSettings: emailSettings || DEFAULT_SETTINGS.emailSettings,
      updatedAt: new Date()
    };

    const result = await settingsCollection.updateOne(
      { type: 'site_settings' },
      { $set: updatedSettings },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Ayarlar başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Ayarlar güncellenemedi' },
      { status: 500 }
    );
  }
}