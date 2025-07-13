'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Eye, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Chapter {
  _id: string;
  title: string;
  chapterNumber: number;
  viewCount: number;
  createdAt: string;
  mangaId: {
    _id: string;
    title: string;
    slug: string;
    coverImage: string;
  };
}

export default function LatestChapters() {
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [displayedChapters, setDisplayedChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 21; // 7 sütun x 3 satır = 21 bölüm

  useEffect(() => {
    fetchLatestChapters();
  }, []);

  useEffect(() => {
    const startIndex = (currentPage - 1) * chaptersPerPage;
    const endIndex = startIndex + chaptersPerPage;
    setDisplayedChapters(allChapters.slice(startIndex, endIndex));
  }, [allChapters, currentPage]);

  const fetchLatestChapters = async () => {
    try {
      const response = await fetch('/api/chapters?limit=50&sort=createdAt&order=desc');
      if (response.ok) {
        const data = await response.json();
        setAllChapters(data.data);
      }
    } catch (error) {
      console.error('Latest chapters fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const hasMoreChapters = currentPage * chaptersPerPage < allChapters.length;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} hafta önce`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ay önce`;
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center">
          Son <span className="text-gradient">Bölümler</span>
        </h2>
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (allChapters.length === 0) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center">
          Son <span className="text-gradient">Bölümler</span>
        </h2>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Henüz bölüm eklenmemiş.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Admin panelinden manga ve bölüm ekleyebilirsiniz.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-3xl font-bold mb-8 text-center">
        Son <span className="text-gradient">Bölümler</span>
      </h2>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 stagger-animation">
        {displayedChapters.map((chapter, index) => (
          <Link 
            key={chapter._id} 
            href={`/manga/${chapter.mangaId.slug || chapter.mangaId._id}/chapter-${chapter.chapterNumber}`}
            className="card-interactive card-cinematic p-0 cursor-pointer block group overflow-hidden"
            style={{animationDelay: `${index * 0.03}s`}}
          >
            <div className="flex flex-col h-full">
              <div className="w-full aspect-[3/4] rounded-t overflow-hidden relative flex-shrink-0">
                <img
                  src={chapter.mangaId.coverImage}
                  alt={chapter.mangaId.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-manga.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Hover Oku Yazısı */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                  <div className="bg-primary-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm">
                    Oku
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 p-2">
                {/* Üst satır: İsim sol, Bölüm sağ */}
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-xs truncate transition-colors duration-200 group-hover:text-primary-500 flex-1 mr-1" title={chapter.mangaId.title}>
                    {chapter.mangaId.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-200 whitespace-nowrap">
                    Bölüm {chapter.chapterNumber}
                  </p>
                </div>
                
                {/* Alt satır: Zaman sol, Görüntülenme sağ */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span className="truncate text-xs">{formatTimeAgo(chapter.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-2.5 h-2.5" />
                    <span className="text-xs">{chapter.viewCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {hasMoreChapters && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200 hover:scale-105 font-medium text-sm"
          >
            Devamını Gör
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </section>
  );
}