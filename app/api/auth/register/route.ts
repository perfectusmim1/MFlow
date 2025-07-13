import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import { generateToken } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, username, password } = await request.json();

    // Validation
    if (!email || !username || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Şifre en az 6 karakter olmalı' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı 3-20 karakter arasında olmalı' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Kullanıcı adı';
      return NextResponse.json(
        { success: false, message: `${field} zaten kullanımda` },
        { status: 409 }
      );
    }

    // Create user
    const user = new UserModel({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      role: 'user',
    });

    await user.save();

    // Generate token
    const token = generateToken(user.toJSON() as any);

    return NextResponse.json({
      success: true,
      message: 'Kayıt başarılı',
      data: {
        user: user.toJSON(),
        token,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error);

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: errors[0] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}