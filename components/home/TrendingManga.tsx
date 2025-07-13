'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Eye, TrendingUp } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MangaHoverCard from '@/components/ui/MangaHoverCard';

interface Manga {
  _id: string;
  title: string;
  slug: string;
  coverImage: string;
  rating: number;
  viewCount: number;
  status: string;
  type: string;
  author?: string[];
  genres?: string[];
  description?: string;
  likeCount?: number;
  dislikeCount?: number;
  createdAt?: string;
  updatedAt?: string;
  lastChapter?: {
    chapterNumber: number;
  };
  latestChapters?: Array<{
    _id: string;
    chapterNumber: number;
    title: string;
    slug: string;
    createdAt: string;
  }>;
}

export default function TrendingManga() {
  const [manga, setManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredManga, setHoveredManga] = useState<Manga | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTrendingManga();
  }, []);

  const fetchTrendingManga = async () => {
    try {
      const response = await fetch('/api/manga?limit=14&sort=viewCount&order=desc');
      if (response.ok) {
        const data = await response.json();
        setManga(data.data);
      }
    } catch (error) {
      console.error('Trending manga fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = (item: Manga, event: React.MouseEvent) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const timeout = setTimeout(() => {
      setHoveredManga(item);
      setHoverPosition({ x: event.clientX, y: event.clientY });
    }, 500); // 500ms delay
    
    setHoverTimeout(timeout);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredManga) {
      setHoverPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoveredManga(null);
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center">
          Popüler <span className="text-gradient">Bu Hafta</span>
        </h2>
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (manga.length === 0) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center">
          Popüler <span className="text-gradient">Bu Hafta</span>
        </h2>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Henüz manga eklenmemiş.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Admin panelinden manga ekleyebilirsiniz.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-3xl font-bold mb-8 text-center">
        Popüler <span className="text-gradient">Bu Hafta</span>
      </h2>
      
      <div className="manga-grid-home stagger-animation">
        {manga.map((item, index) => (
          <Link 
            key={item._id} 
            href={`/manga/${item.slug}`} 
            className="manga-card card-cinematic group" 
            style={{animationDelay: `${index * 0.1}s`}}
            onMouseEnter={(e) => handleMouseEnter(item, e)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="card-interactive overflow-hidden relative">
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 flex items-center gap-1 transition-transform duration-200 group-hover:scale-110">
                <TrendingUp className="w-3 h-3" />
                #{index + 1}
              </div>
              <div className="relative overflow-hidden">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="manga-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-manga.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-3">
                <h3 className="manga-title" title={item.title}>
                  {item.title}
                </h3>
                <p className="manga-meta mb-2">
                  {item.lastChapter ? `Bölüm ${item.lastChapter.chapterNumber}` : 'Bölüm yok'}
                </p>
                
                {/* Son 3 Bölüm */}
                <div className="mb-3 h-20">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Son Bölümler:</h4>
                  {item.latestChapters && item.latestChapters.length > 0 ? (
                    <div className="space-y-1">
                      {item.latestChapters.slice(0, 3).map((chapter) => (
                        <Link
                          key={chapter._id}
                          href={`/manga/${item.slug}/${chapter.slug}`}
                          className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {chapter.chapterNumber}. Bölüm
                          {chapter.title && ` - ${chapter.title}`}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Henüz bölüm eklenmemiş
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-xs">{item.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-green-500 transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-xs text-green-500">{item.viewCount} görüntülenme</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Hover Card */}
      <MangaHoverCard
        manga={hoveredManga}
        isVisible={!!hoveredManga}
        position={hoverPosition}
      />
    </section>
  );
}