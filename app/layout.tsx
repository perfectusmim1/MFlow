import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import NotificationProvider from '@/components/providers/NotificationProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MFlow - Modern Manga & Webtoon Okuma Sitesi',
  description: 'En popüler manga, manhwa, manhua ve webtoon\'ları okuyun. Auto translate özelliği ile tüm dillerde okuma keyfi.',
  keywords: 'manga, manhwa, manhua, webtoon, okuma, çeviri, auto translate, türkçe manga',
  authors: [{ name: 'MFlow Team' }],
  creator: 'MFlow',
  publisher: 'MFlow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: '256x256', type: 'image/png' },
      { url: '/logo.png', sizes: '128x128', type: 'image/png' },
      { url: '/logo.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/logo.png',
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://mangareader.com',
    title: 'MFlow - Modern Manga & Webtoon Okuma Sitesi',
    description: 'En popüler manga, manhwa, manhua ve webtoon\'ları okuyun.',
    siteName: 'MFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MFlow - Modern Manga & Webtoon Okuma Sitesi',
    description: 'En popüler manga, manhwa, manhua ve webtoon\'ları okuyun.',
    creator: '@mflow',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-verification-code',
    yandex: 'yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} page-container`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <div className="page-transition page-cinematic-transition">
                {children}
              </div>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}