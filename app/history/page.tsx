'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Clock, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface ReadingHistoryItem {
  _id: string;
  mangaId: {
    _id: string;
    title: string;
    slug: string;
    coverImage: string;
    author: string[];
    status: string;
    type: string;
  };
  chapterId: {
    _id: string;
    title: string;
    chapterNumber: number;
  };
  pageNumber: number;
  readAt: string;
  readingTime?: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      fetchHistory();
    }
  }, [user, authLoading, router]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/reading-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data || []);
      } else {
        console.error('Failed to fetch history:', data.error);
        toast.error('Geçmiş yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Okuma geçmişi yüklenirken hata oluştu');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Tüm okuma geçmişini silmek istediğinizden emin misiniz?')) {
      return;
    }

    setClearing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/reading-history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      const data = await response.json();
      
      if (data.success) {
        setHistory([]);
        toast.success('Okuma geçmişi temizlendi');
      } else {
        console.error('Failed to clear history:', data.error);
        toast.error('Geçmiş temizlenirken hata oluştu');
      }
    } catch (error) {
      console.error('Clear history error:', error);
      toast.error('Geçmiş temizlenirken hata oluştu');
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Az önce';
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else if (diffInHours < 48) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-light-50 dark:bg-dark-950">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-light-50 dark:bg-dark-950">
      <Navbar />
      
      <div className="min-h-screen bg-light-50 dark:bg-dark-950 py-8 section-professional">
        <div className="max-w-6xl mx-auto px-4">
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-green-500" />
                Okuma Geçmişi
              </h1>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  disabled={clearing}
                  className="btn-danger flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {clearing ? 'Temizleniyor...' : 'Geçmişi Temizle'}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-20 h-20 text-light-400 dark:text-dark-600 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-dark-950 dark:text-light-50 mb-3">
                  Henüz okuma geçmişiniz yok
                </h3>
                <p className="text-light-700 dark:text-dark-400 mb-8 max-w-md mx-auto">
                  Manga okumaya başladığınızda geçmişiniz burada görünecek. Kaldığınız yerden devam edebilirsiniz.
                </p>
                <Link
                  href="/"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Manga Keşfet
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="card-cinematic group hover:shadow-xl hover:shadow-green-500/10 transition-all duration-500 ease-out border border-light-200 dark:border-dark-700 hover:border-green-500/30 dark:hover:border-green-400/30"
                  >
                    <div className="flex items-center gap-6 p-6">
                      {/* Manga Cover */}
                      <div className="flex-shrink-0">
                        <Link href={`/manga/${item.mangaId?.slug}`}>
                          <div className="relative overflow-hidden rounded-xl shadow-md group-hover:shadow-lg transition-all duration-500 ease-out">
                            <Image
                              src={item.mangaId.coverImage || '/placeholder-manga.svg'}
                              alt={item.mangaId.title}
                              width={80}
                              height={112}
                              className="w-20 h-28 object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-manga.svg';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </div>
                        </Link>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <Link
                            href={`/manga/${item.mangaId?.slug}`}
                            className="text-xl font-bold text-dark-950 dark:text-light-50 block truncate"
                          >
                            {item.mangaId?.title || 'Bilinmeyen Manga'}
                          </Link>
                          <p className="text-sm text-light-600 dark:text-dark-500 mt-1 group-hover:text-light-700 dark:group-hover:text-dark-400 transition-colors duration-300">
                            {item.mangaId?.author?.join(', ') || 'Bilinmeyen Yazar'} • {item.mangaId?.type === 'manga' ? 'Manga' : 'Webtoon'}
                          </p>
                        </div>
                        
                        <Link
                            href={`/manga/${item.mangaId?.slug}/chapter-${item.chapterId?.chapterNumber || 1}`}
                            className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-300 font-medium mb-3 group/chapter"
                          >
                            <span>Bölüm {item.chapterId?.chapterNumber || '?'}</span>
                            {item.chapterId?.title && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-xs">{item.chapterId.title}</span>
                              </>
                            )}
                            <ArrowRight className="w-4 h-4 group-hover/chapter:translate-x-1 transition-transform duration-300" />
                          </Link>
                        
                        <div className="flex items-center gap-6 text-sm text-light-600 dark:text-dark-400 group-hover:text-light-700 dark:group-hover:text-dark-300 transition-colors duration-300">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(item.readAt)}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatTime(item.readAt)}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                          item.mangaId?.status === 'ongoing' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-900/50'
                            : item.mangaId?.status === 'completed'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                        }`}>
                          {item.mangaId?.status === 'ongoing' ? 'Devam Ediyor' : 
                           item.mangaId?.status === 'completed' ? 'Tamamlandı' : 'Bilinmiyor'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}