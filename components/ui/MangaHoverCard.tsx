'use client';

import { useState, useEffect } from 'react';
import { Star, Eye, Heart, ThumbsDown, MessageCircle, Calendar, User, BookOpen, Tag } from 'lucide-react';

interface MangaHoverCardProps {
  manga: {
    _id: string;
    title: string;
    slug: string;
    coverImage: string;
    rating: number;
    viewCount: number;
    likeCount?: number;
    dislikeCount?: number;
    status: string;
    type: string;
    author?: string[];
    genres?: string[];
    description?: string;
    lastChapter?: {
      chapterNumber: number;
    };
    createdAt?: string;
    updatedAt?: string;
  } | null;
  isVisible: boolean;
  position: { x: number; y: number };
}

interface MangaStats {
  commentCount: number;
  likeCount: number;
  dislikeCount: number;
  favoriteCount: number;
}

export default function MangaHoverCard({ manga, isVisible, position }: MangaHoverCardProps) {
  const [stats, setStats] = useState<MangaStats>({
    commentCount: 0,
    likeCount: manga?.likeCount || 0,
    dislikeCount: manga?.dislikeCount || 0,
    favoriteCount: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && manga?._id) {
      fetchMangaStats();
    }
  }, [isVisible, manga?._id]);

  const fetchMangaStats = async () => {
    if (!manga?._id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/manga/${manga._id}/stats`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats({
            commentCount: result.data.commentCount || 0,
            likeCount: result.data.likeCount || manga.likeCount || 0,
            dislikeCount: result.data.dislikeCount || manga.dislikeCount || 0,
            favoriteCount: result.data.favoriteCount || 0
          });
        } else {
          // Fallback to manga data if API fails
          setStats({
            commentCount: 0,
            likeCount: manga.likeCount || 0,
            dislikeCount: manga.dislikeCount || 0,
            favoriteCount: 0
          });
        }
      } else {
        // Fallback to manga data if API fails
        setStats({
          commentCount: 0,
          likeCount: manga.likeCount || 0,
          dislikeCount: manga.dislikeCount || 0,
          favoriteCount: 0
        });
      }
    } catch (error) {
      console.error('Manga stats fetch error:', error);
      // Fallback to manga data if API fails
      setStats({
        commentCount: 0,
        likeCount: manga.likeCount || 0,
        dislikeCount: manga.dislikeCount || 0,
        favoriteCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Bilinmiyor';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'ongoing': 'Devam Ediyor',
      'completed': 'Tamamlandı',
      'hiatus': 'Ara Verildi',
      'cancelled': 'İptal Edildi'
    };
    return statusMap[status] || status;
  };

  const getTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'manga': 'Manga',
      'manhwa': 'Manhwa',
      'manhua': 'Manhua',
      'webtoon': 'Webtoon'
    };
    return typeMap[type] || type;
  };

  if (!isVisible || !manga) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x + 20}px`,
        top: `${position.y - 10}px`,
        transform: position.x > window.innerWidth / 2 ? 'translateX(-100%)' : 'none'
      }}
    >
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-light-200 dark:border-dark-700 p-4 w-80 max-w-sm animate-in fade-in slide-in-from-left-2 duration-200">
        {/* Header */}
        <div className="flex gap-3 mb-3">
          <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={manga.coverImage}
              alt={manga.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-manga.svg';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-dark-950 dark:text-light-50 line-clamp-2 mb-1">
              {manga.title}
            </h3>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                {getTypeText(manga.type)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                manga.status === 'ongoing' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                manga.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                manga.status === 'hiatus' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              }`}>
                {getStatusText(manga.status)}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{manga.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Eye className="w-3 h-3" />
            <span>{manga.viewCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Heart className="w-3 h-3 text-red-500" />
            <span>{loading ? '...' : stats.likeCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <MessageCircle className="w-3 h-3 text-blue-500" />
            <span>{loading ? '...' : stats.commentCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Additional Info */}
        {manga.author && manga.author.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-2">
            <User className="w-3 h-3" />
            <span className="truncate">{manga.author.join(', ')}</span>
          </div>
        )}

        {manga.genres && manga.genres.length > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-2">
            <Tag className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {manga.genres.slice(0, 3).map((genre, index) => (
                <span key={index} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                  {genre}
                </span>
              ))}
              {manga.genres.length > 3 && (
                <span className="text-gray-500">+{manga.genres.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {manga.description && (
          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">
            {manga.description}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Calendar className="w-3 h-3" />
          <span>Güncellendi: {formatDate(manga.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}