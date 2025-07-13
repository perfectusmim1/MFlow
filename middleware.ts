import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Manga sayfası için özel işlem
  if (request.nextUrl.pathname.startsWith('/manga/')) {
    // URL'den manga slug'ını al
    const mangaSlug = request.nextUrl.pathname.split('/')[2];
    
    // Eğer manga slug'ı yoksa ana sayfaya yönlendir
    if (!mangaSlug) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Eğer ID formatındaysa (eski format) ve geçerli bir ObjectId ise
    if (mangaSlug.match(/^[0-9a-fA-F]{24}$/)) {
      // API'den manga bilgisini al
      return NextResponse.rewrite(new URL(`/api/manga/id/${mangaSlug}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/manga/:path*',
    '/api/manga/:path*'
  ]
}; 