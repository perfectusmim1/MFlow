import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { User } from '@/types';
import connectDB from './database';
import SessionModel from './models/Session';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends NextRequest {
  user?: User;
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function generateToken(user: User): string {
  const payload = {
    _id: user._id,
    id: user._id,
    userId: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
  };
  
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  return token;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

export async function requireAuth(request: NextRequest): Promise<{ success: boolean; userId?: string; message?: string }> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { success: false, message: 'Token bulunamadı' };
  }

  const user = verifyToken(token);
  
  if (!user) {
    return { success: false, message: 'Geçersiz token' };
  }

  return { success: true, userId: user._id };
}

export async function requireAdmin(request: NextRequest): Promise<{ success: boolean; userId?: string; message?: string }> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }

  // Get user from token to check role
  const token = getTokenFromRequest(request);
  const user = verifyToken(token!);
  
  if (user?.role !== 'admin') {
    return { success: false, message: 'Admin yetkisi gerekli' };
  }
  
  return authResult;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await connectDB();
    
    const session = await SessionModel.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (session) {
      // Update last activity
      session.lastActivity = new Date();
      await session.save();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Session verification error:', error);
    return false;
  }
}

export async function requireAuthWithSession(request: NextRequest): Promise<{ success: boolean; userId?: string; message?: string }> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { success: false, message: 'Token bulunamadı' };
  }

  const user = verifyToken(token);
  
  if (!user) {
    return { success: false, message: 'Geçersiz token' };
  }

  // Check if session is active
  const sessionValid = await verifySession(token);
  
  if (!sessionValid) {
    return { success: false, message: 'Session geçersiz veya süresi dolmuş' };
  }

  return { success: true, userId: user._id };
}

export async function requireAdminWithSession(request: NextRequest): Promise<{ success: boolean; userId?: string; message?: string }> {
  const authResult = await requireAuthWithSession(request);
  
  if (!authResult.success) {
    return authResult;
  }

  // Get user from token to check role
  const token = getTokenFromRequest(request);
  const user = verifyToken(token!);
  
  if (user?.role !== 'admin') {
    return { success: false, message: 'Admin yetkisi gerekli' };
  }
  
  return authResult;
}

// Legacy function for backward compatibility
export async function authMiddleware(request: NextRequest): Promise<{ success: boolean; user?: User; message?: string }> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { success: false, message: 'Token bulunamadı' };
  }

  const user = verifyToken(token);
  
  if (!user) {
    return { success: false, message: 'Geçersiz token' };
  }

  return { success: true, user };
}