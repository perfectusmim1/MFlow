import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authMiddleware } from '@/lib/middleware';

// POST /api/test-gemini - Test Gemini API key
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key gerekli' },
        { status: 400 }
      );
    }

    try {
      // Initialize Gemini AI with provided API key
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Test with a simple prompt
      const prompt = "Hello, this is a test message. Please respond with 'API key is working correctly'.";
      const result = await model.generateContent(prompt);
      const response = result.response;
      
      if (response && response.text) {
        const text = response.text();
        
        // Check if response contains expected text or is a valid response
        if (text.length > 0) {
          return NextResponse.json({
            success: true,
            message: 'API key geçerli',
            testResponse: text.substring(0, 100) + (text.length > 100 ? '...' : '')
          });
        } else {
          throw new Error('Boş yanıt alındı');
        }
      } else {
        throw new Error('Geçersiz yanıt formatı');
      }
    } catch (error: any) {
      console.error('Gemini API test error:', error);
      
      // Check for specific error types
      if (error.message?.includes('API_KEY_INVALID') || 
          error.message?.includes('invalid API key') ||
          error.status === 400) {
        return NextResponse.json(
          { success: false, error: 'API key geçersiz' },
          { status: 400 }
        );
      }
      
      if (error.message?.includes('PERMISSION_DENIED') || 
          error.status === 403) {
        return NextResponse.json(
          { success: false, error: 'API key izni reddedildi' },
          { status: 403 }
        );
      }
      
      if (error.message?.includes('QUOTA_EXCEEDED') || 
          error.status === 429) {
        return NextResponse.json(
          { success: false, error: 'API kotası aşıldı' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'API test edilirken hata oluştu: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json(
      { success: false, error: 'API test edilirken hata oluştu' },
      { status: 500 }
    );
  }
} 