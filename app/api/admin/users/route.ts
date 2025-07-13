import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT doğrulama ve admin kontrolü
async function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    await connectDB();
    
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// GET - Kullanıcı listesi
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('isActive') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Filtreleme koşulları
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    // Toplam sayı
    const total = await User.countDocuments(filter);
    
    // Sayfalama hesaplama
    const skip = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Kullanıcıları getir
    const users = await User.find(filter)
      .select('-password')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Her kullanıcı için istatistikleri hesapla
    const usersWithStats = users.map(user => ({
      ...user,
      favoriteCount: user.favorites?.length || 0,
      readingHistoryCount: user.readingHistory?.length || 0
    }));

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// POST - Yeni kullanıcı oluştur
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const { username, email, password, role = 'user', isActive = true } = await request.json();

    // Validasyon
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Tüm alanlar gereklidir' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı en az 3 karakter olmalıdır' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      );
    }

    await connectDB();

    // Kullanıcı adı kontrolü
    const existingUsername = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    
    if (existingUsername) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Bu kullanıcı adı zaten kullanılmaktadır',
          code: 'USERNAME_EXISTS'
        },
        { status: 409 }
      );
    }

    // Email kontrolü
    const existingEmail = await User.findOne({ 
      email: email.toLowerCase() 
    });
    
    if (existingEmail) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Bu email adresi zaten kullanılmaktadır',
          code: 'EMAIL_EXISTS'
        },
        { status: 409 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12);

    // Yeni kullanıcı oluştur
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role,
      isActive: isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();

    // Şifreyi response'dan çıkar
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: userResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}