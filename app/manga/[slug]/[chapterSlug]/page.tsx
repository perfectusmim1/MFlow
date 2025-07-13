'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, List, Settings, ZoomIn, ZoomOut, Eye, EyeOff, Home, BookOpen, Languages } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CommentSystem from '@/components/ui/CommentSystem';
import { useAuth } from '@/components/providers/AuthProvider';

interface Chapter {
  _id: string;
  title: string;
  chapterNumber: number;
  pages: {
    pageNumber: number;
    imageUrl: string;
  }[];
  manga: {
    _id: string;
    title: string;
    slug: string;
    type?: string;
  };
  nextChapter?: {
    chapterNumber: number;
  };
  prevChapter?: {
    chapterNumber: number;
    slug?: string;
  };
  isPublished?: boolean;
  viewCount: number;
}

type ReadingMode = 'horizontal' | 'vertical' | 'webtoon';

export default function ReadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [readingMode, setReadingMode] = useState<ReadingMode>('vertical');
  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [aiTranslateEnabled, setAiTranslateEnabled] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState('tr');
  
  // Reading time tracking
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [totalReadingTime, setTotalReadingTime] = useState(0); // in seconds
  const readingTimeRef = useRef<NodeJS.Timeout | null>(null);
  
  const { slug: mangaSlug, chapterSlug } = params;

  useEffect(() => {
    if (mangaSlug && chapterSlug) {
      fetchChapter();
    }
  }, [mangaSlug, chapterSlug]);

  const fetchChapter = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manga/${mangaSlug}/${chapterSlug}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.status === 403) {
        toast.error('Bu manga özel ve sadece yöneticiler tarafından görüntülenebilir.');
        router.push('/');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Bölüm bulunamadı');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Bölüm bulunamadı');
      }
      
      console.log('Yüklenen bölüm:', data.data);
      setChapter(data.data);
      
      // Manga türüne göre otomatik okuma modu seçimi
      if (data.data.manga.type) {
        const mangaType = data.data.manga.type.toLowerCase();
        if (mangaType === 'webtoon' || mangaType === 'manhwa' || mangaType === 'manhua') {
          setReadingMode('webtoon');
        } else if (mangaType === 'manga') {
          setReadingMode('vertical');
        }
      }
      
      // Save reading history if user is logged in
      if (user && data.data) {
        saveReadingHistory(data.data.manga._id, data.data._id, 1);
      }
    } catch (error) {
      console.error('Bölüm yüklenirken hata oluştu:', error);
      toast.error('Bölüm yüklenirken bir hata oluştu.');
      router.push(`/manga/${mangaSlug}`);
    } finally {
      setLoading(false);
    }
  };

  const saveReadingHistory = async (mangaId: string, chapterId: string, pageNumber: number, readingTimeMinutes?: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const body: any = {
        mangaId,
        chapterId,
        pageNumber
      };
      
      if (readingTimeMinutes !== undefined) {
        body.readingTime = readingTimeMinutes;
      }

      await fetch('/api/user/reading-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Reading history save error:', error);
    }
  };

  // Update reading history when page changes
  useEffect(() => {
    if (user && chapter && currentPage > 0) {
      // Save reading time for previous page if any
      if (readingStartTime && totalReadingTime > 0) {
        const readingTimeSeconds = totalReadingTime;
        if (readingTimeSeconds >= 1) { // Save if at least 1 second
          saveReadingHistory(chapter.manga._id, chapter._id, currentPage, readingTimeSeconds);
        }
      }
      
      // Update reading history for current page
      saveReadingHistory(chapter.manga._id, chapter._id, currentPage);
      
      // Reset reading time for new page
      setReadingStartTime(new Date());
      setTotalReadingTime(0);
    }
  }, [currentPage, user, chapter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (chapter?.prevChapter) {
            router.push(getChapterUrl(chapter.prevChapter.chapterNumber));
          }
          break;
        case 'ArrowRight':
          if (chapter?.nextChapter) {
            router.push(getChapterUrl(chapter.nextChapter.chapterNumber));
          }
          break;
        case 'h':
          setShowUI(!showUI);
          break;
        case 's':
          setShowSettings(!showSettings);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [chapter, showUI, showSettings, router]);

  // Reading time tracking - Start timer when chapter loads
  useEffect(() => {
    if (chapter && user) {
      setReadingStartTime(new Date());
      setTotalReadingTime(0);
      
      // Update reading time every 5 seconds for more accurate tracking
      readingTimeRef.current = setInterval(() => {
        setTotalReadingTime(prev => prev + 5);
      }, 5000);
      
      return () => {
        if (readingTimeRef.current) {
          clearInterval(readingTimeRef.current);
        }
      };
    }
  }, [chapter, user]);

  // Save reading time when leaving the page or changing chapter
  useEffect(() => {
    const saveReadingTime = () => {
    if (chapter && readingStartTime && totalReadingTime > 0) {
      // Save reading time in seconds, not minutes
      const readingTimeSeconds = totalReadingTime;
      if (readingTimeSeconds >= 1) { // Save if at least 1 second
        saveReadingHistory(chapter.manga._id, chapter._id, currentPage, readingTimeSeconds);
      }
    }
  };

    const handleBeforeUnload = () => {
      saveReadingTime();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveReadingTime();
      } else if (chapter && user) {
        // Reset timer when page becomes visible again
        setReadingStartTime(new Date());
        setTotalReadingTime(0);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      saveReadingTime();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (readingTimeRef.current) {
        clearInterval(readingTimeRef.current);
      }
    };
  }, [chapter, currentPage, readingStartTime, totalReadingTime, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-950">
        <LoadingSpinner />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-950 text-light-50">
        <p className="mb-4">Bölüm bulunamadı.</p>
        <Link href={`/manga/${mangaSlug}`} className="btn btn-primary">
          Mangaya Geri Dön
        </Link>
      </div>
    );
  }

  const getChapterUrl = (chapterNumber: number) => {
    return `/manga/${chapter.manga.slug}/chapter-${chapterNumber}`;
  };

  const handleAiTranslate = async () => {
    if (!aiTranslateEnabled) {
      toast.success('AI Translate aktif edildi!');
      setAiTranslateEnabled(true);
    } else {
      toast.success('AI Translate devre dışı bırakıldı!');
      setAiTranslateEnabled(false);
    }
  };

  return (
    <div className="bg-dark-950 text-light-50 min-h-screen">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-sm transition-transform duration-300 ${showUI ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container-responsive mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="btn btn-outline p-2" title="Ana Sayfa">
              <Home className="w-5 h-5" />
            </Link>
            <Link href={`/manga/${chapter.manga.slug}`} className="btn btn-outline p-2" title="Manga Sayfası">
              <BookOpen className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <span className="font-bold text-lg">{chapter.manga.title}</span>
              <span className="text-sm text-dark-400">Bölüm {chapter.chapterNumber}: {chapter.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-outline p-2"
              title="Ayarlar (S)"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowUI(!showUI)}
              className="btn btn-outline p-2"
              title="UI Gizle/Göster (H)"
            >
              {showUI ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {chapter.prevChapter ? (
              <Link href={getChapterUrl(chapter.prevChapter.chapterNumber)} className="btn btn-outline p-2" title="Önceki Bölüm (←)">
                <ChevronLeft className="w-6 h-6" />
              </Link>
            ) : (
              <button className="btn btn-outline p-2" disabled><ChevronLeft className="w-6 h-6" /></button>
            )}
            {chapter.nextChapter ? (
              <Link href={getChapterUrl(chapter.nextChapter.chapterNumber)} className="btn btn-outline p-2" title="Sonraki Bölüm (→)">
                <ChevronRight className="w-6 h-6" />
              </Link>
            ) : (
              <button className="btn btn-outline p-2" disabled><ChevronRight className="w-6 h-6" /></button>
            )}
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-20 right-4 z-40 bg-dark-900 border border-dark-700 rounded-lg p-4 shadow-lg min-w-[280px]">
          <h3 className="text-lg font-semibold mb-4">Okuma Ayarları</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Okuma Modu</label>
              <select
                value={readingMode}
                onChange={(e) => setReadingMode(e.target.value as ReadingMode)}
                className="w-full bg-dark-800 border border-dark-600 rounded px-3 py-2"
              >
                <option value="vertical">Sayfa</option>
                <option value="horizontal">Yatay</option>
                <option value="webtoon">Webtoon</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Zoom: {Math.round(zoom * 100)}%</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="btn btn-outline btn-sm"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  className="btn btn-outline btn-sm"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="border-t border-dark-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  AI Translate
                </label>
                <button
                  onClick={handleAiTranslate}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    aiTranslateEnabled ? 'bg-primary-600' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiTranslateEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {aiTranslateEnabled && (
                <div className="space-y-2">
                  <label className="block text-xs text-dark-400 mb-1">Çeviri Dili</label>
                  <select
                    value={translationLanguage}
                    onChange={(e) => setTranslationLanguage(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="zh">中文</option>
                  </select>
                  <p className="text-xs text-dark-400">
                    AI çeviri özelliği manga sayfalarındaki metinleri otomatik olarak çevirir.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="pt-24 pb-16">
        <div className={`flex ${readingMode === 'horizontal' ? 'flex-row overflow-x-auto' : 'flex-col'} items-center`}>
          {chapter.pages.map((page, index) => (
            <img
              key={index}
              src={page.imageUrl}
              alt={`Sayfa ${page.pageNumber}`}
              className={`${readingMode === 'horizontal' ? 'h-screen flex-shrink-0' : 'max-w-full'} h-auto`}
              style={{ transform: `scale(${zoom})` }}
            />
          ))}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className={`fixed bottom-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-sm transition-transform duration-300 ${showUI ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="container-responsive mx-auto flex items-center justify-center p-4 gap-4">
          {chapter.prevChapter ? (
            <Link href={getChapterUrl(chapter.prevChapter.chapterNumber)} className="btn btn-primary flex-1">
              <ChevronLeft className="w-5 h-5 mr-2" />
              Önceki Bölüm
            </Link>
          ) : (
            <button className="btn btn-primary flex-1" disabled>
              <ChevronLeft className="w-5 h-5 mr-2" />
              Önceki Bölüm
            </button>
          )}
          {chapter.nextChapter ? (
            <Link href={getChapterUrl(chapter.nextChapter.chapterNumber)} className="btn btn-primary flex-1">
              Sonraki Bölüm
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          ) : (
            <button className="btn btn-primary flex-1" disabled>
              Sonraki Bölüm
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </footer>

      {/* Comments Section */}
      <div className="bg-dark-900">
        <div className="container-responsive mx-auto py-8">
          <CommentSystem
            chapterId={chapter._id}
            targetType="chapter"
            targetId={chapter._id}
            title={`${chapter.manga.title} - Bölüm ${chapter.chapterNumber} Yorumları`}
            user={user}
            showReactions={true}
          />
        </div>
      </div>
    </div>
  );
}