'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Eye,
  Star,
  Heart,
  Share2,
  Play,
  Clock,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  List
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/providers/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CommentSystem from '@/components/ui/CommentSystem';
import AddToListModal from '@/components/ui/AddToListModal';

interface MangaDetail {
  _id: string;
  title: string;
  slug: string;
  titleAlternative: string[];
  description: string;
  author: string[];
  artist: string[];
  genres: string[];
  tags: string[];
  status: string;
  type: string;
  coverImage: string;
  bannerImage?: string;
  rating: number;
  ratingCount: number;
  viewCount: number;
  favoriteCount: number;
  likeCount: number;
  dislikeCount: number;
  userLike?: 'like' | 'dislike' | null;
  userRating?: number;
  isNSFW: boolean;
  originalLanguage: string;
  chapters: any[];
  firstChapter?: any;
  lastChapter?: any;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function MangaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, updateUserFavorites } = useAuth();
  const [manga, setManga] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userLike, setUserLike] = useState<'like' | 'dislike' | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    if (params.slug) {
      fetchManga();
    }
  }, [params.slug]);

  useEffect(() => {
    if (manga?._id) {
      fetchFavoriteCount();
    }
  }, [manga?._id]);

  const fetchFavoriteCount = async () => {
    if (!manga?._id) return;
    
    try {
      const response = await fetch(`/api/manga/${manga._id}/favorite-count`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFavoriteCount(result.data.favoriteCount || 0);
        }
      }
    } catch (error) {
      console.error('Favorite count fetch error:', error);
    }
  };

  useEffect(() => {
    if (user && manga) {
      // Check if the current manga is in the user's favorites list
      const isFav = user.favorites?.includes(manga._id);
      setIsFavorite(isFav || false);
      
      // Set user's like/dislike and rating from manga data
      setUserLike(manga.userLike || null);
      setUserRating(manga.userRating || 0);
    } else if (!user) {
      // Reset states when user logs out
      setIsFavorite(false);
      setUserLike(null);
      setUserRating(0);
    }
  }, [user, manga]);

  const fetchManga = async () => {
    try {
      setLoading(true);
      
      // Get token for user-specific data
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/manga/${params.slug}`, {
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          // Özel manga uyarısı
          toast.error('Bu manga özel ve sadece yöneticiler tarafından görüntülenebilir');
        } else {
          toast.error('Manga bulunamadı');
        }
        router.push('/');
        return;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Manga bulunamadı');
      }
      
      setManga(data.data);
    } catch (error: any) {
      console.error('Manga fetch error:', error);
      toast.error(error.message || 'Manga yüklenirken hata oluştu');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast.error('Favorilere eklemek için giriş yapmalısınız');
      return;
    }

    if (favoriteLoading) {
      return; // Prevent multiple clicks
    }

    try {
      setFavoriteLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum süreniz dolmuş, lütfen tekrar giriş yapın');
        return;
      }

      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mangaId: manga?._id,
          action: isFavorite ? 'remove' : 'add',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Favori işlemi başarısız oldu');
      }

      // Update local state immediately
      setIsFavorite(data.isFavorite);
      if (manga) {
        setManga({
          ...manga,
          favoriteCount: data.favoriteCount,
        });
      }

      // Update favorite count
      setFavoriteCount(data.favoriteCount || favoriteCount + (data.isFavorite ? 1 : -1));

      // Update user favorites in AuthProvider
      if (user && manga) {
        const updatedFavorites = data.isFavorite
          ? [...(user.favorites || []), manga._id]
          : (user.favorites || []).filter(id => id !== manga._id);
        updateUserFavorites(updatedFavorites);
      }
      
      toast.success(data.message);

    } catch (error: any) {
      console.error('Favorite error:', error);
      toast.error(error.message || 'Favorilere eklenirken hata oluştu');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: manga?.title,
          text: manga?.description.substring(0, 200) + '...',
          url: window.location.href
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı');
    }
  };

  const handleLike = async (action: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Beğenmek için giriş yapmalısınız');
      return;
    }

    if (likeLoading) {
      return; // Prevent multiple clicks
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Oturum süreniz dolmuş, lütfen tekrar giriş yapın');
      return;
    }

    try {
      setLikeLoading(true);
      
      // Determine the new action (toggle if same, set if different)
      const newAction = userLike === action ? null : action;

      const response = await fetch('/api/manga/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mangaId: manga?._id,
          action: newAction,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Beğenme işlemi başarısız oldu');
      }

      // Update with server response
      setUserLike(data.userLike);
      if (manga) {
        setManga({
          ...manga,
          likeCount: data.likeCount,
          dislikeCount: data.dislikeCount,
          userLike: data.userLike,
        });
      }

    } catch (error: any) {
      console.error('Like error:', error);
      toast.error(error.message || 'Beğenme işlemi sırasında hata oluştu');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (authLoading || ratingLoading) {
      toast.error('Lütfen bekleyin...');
      return;
    }
    
    if (!user) {
      toast.error('Puanlamak için giriş yapmalısınız');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Oturum süreniz dolmuş, lütfen tekrar giriş yapın');
      return;
    }

    try {
      setRatingLoading(true);
      
      const response = await fetch('/api/manga/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mangaId: manga?._id,
          rating: rating,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Puanlama işlemi başarısız oldu');
      }

      // Update with server response
      setUserRating(data.userRating);
      setShowRatingModal(false);
      
      if (manga) {
        setManga({
          ...manga,
          rating: data.newRating,
          ratingCount: data.ratingCount,
        });
      }

      toast.success('Puanınız kaydedildi');

    } catch (error: any) {
      console.error('Rating error:', error);
      toast.error(error.message || 'Puanlama sırasında hata oluştu');
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-light-700 dark:text-dark-400">Manga bulunamadı</p>
        </div>
        <Footer />
      </div>
    );
  }

  const statusColors = {
    ongoing: 'status-ongoing',
    completed: 'status-completed',
    hiatus: 'status-hiatus',
    cancelled: 'status-cancelled'
  };

  const displayedChapters = showAllChapters ? manga.chapters : manga.chapters.slice(0, 10);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Background Banner */}
      {manga.bannerImage && (
        <div className="fixed inset-0 -z-20">
          <img
            src={manga.bannerImage}
            alt={manga.title}
            className="w-full h-full object-cover blur scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-light-50 via-light-50/70 to-transparent dark:from-dark-950/80 dark:via-dark-950/60 dark:to-transparent" />
        </div>
      )}
      
      <main className="container-responsive py-8">
        {/* Hero Section */}
        <div className="relative mb-8 pt-12 md:pt-24">
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              <img
                src={manga.coverImage}
                alt={manga.title}
                className="w-48 h-72 object-cover rounded-lg shadow-lg mx-auto md:mx-0"
              />
            </div>
            
            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50 mb-2">
                  {manga.title}
                </h1>
                {manga.titleAlternative.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-sm text-light-700 dark:text-dark-400">
                    {manga.titleAlternative.map((title, index) => (
                      <span key={index}>
                        {title}
                        {index < manga.titleAlternative.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{manga.author.join(', ')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(manga.publishedAt || manga.createdAt).getFullYear()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{manga.viewCount.toLocaleString()} görüntülenme</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer" onClick={() => setShowRatingModal(true)}>
                  <Star className="w-4 h-4" />
                  <span>{manga.rating.toFixed(1)} ({manga.ratingCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike('like')}
                    disabled={likeLoading}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                      userLike === 'like'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'hover:bg-light-200 dark:hover:bg-dark-700'
                    } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{manga.likeCount}</span>
                  </button>
                  <button
                    onClick={() => handleLike('dislike')}
                    disabled={likeLoading}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                      userLike === 'dislike'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : 'hover:bg-light-200 dark:hover:bg-dark-700'
                    } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>{manga.dislikeCount}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={statusColors[manga.status as keyof typeof statusColors]}>
                  {manga.status}
                </span>
                <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {manga.type}
                </span>
                {manga.isNSFW && (
                  <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    18+
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {manga.genres.map((genre) => (
                  <span key={genre} className="px-2 py-1 bg-light-200 dark:bg-dark-800 rounded text-xs">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex flex-col items-start">
                  {favoriteCount > 0 && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {favoriteCount.toLocaleString()} kişi favorilere ekledi
                    </span>
                  )}
                  <button
                    onClick={handleFavorite}
                    disabled={favoriteLoading}
                    className={`btn ${isFavorite ? 'btn-danger' : 'btn-outline'} ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''} w-44 h-10`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    <span className="ml-2">
                      {favoriteLoading ? 'İşleniyor...' : (isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle')}
                    </span>
                  </button>
                </div>
                {user && (
                  <button 
                    onClick={() => setShowAddToListModal(true)} 
                    className="btn btn-outline w-32 h-10"
                  >
                    <List className="w-4 h-4" />
                    <span className="ml-2">Listeye Ekle</span>
                  </button>
                )}
                <button onClick={handleShare} className="btn btn-ghost w-24 h-10">
                  <Share2 className="w-4 h-4" />
                  <span className="ml-2">Paylaş</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          {manga.firstChapter && (
            <Link
              href={`/manga/${manga.slug}/chapter-${manga.firstChapter.chapterNumber}`}
              className="btn btn-primary"
            >
              <Play className="w-4 h-4" />
              <span className="ml-2">Okumaya Başla</span>
            </Link>
          )}
          {manga.lastChapter && (
            <Link
              href={`/manga/${manga.slug}/chapter-${manga.lastChapter.chapterNumber}`}
              className="btn btn-secondary"
            >
              <Clock className="w-4 h-4" />
              <span className="ml-2">Son Bölüm</span>
            </Link>
          )}
        </div>

        {/* Description and Chapters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Description */}
          <div className="lg:col-span-2">
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-semibold text-dark-950 dark:text-light-50 mb-4">
                Özet
              </h2>
              <p className="text-light-700 dark:text-dark-400 leading-relaxed">
                {manga.description}
              </p>
            </div>
          </div>

          {/* Chapters */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-dark-950 dark:text-light-50">
                  Bölümler
                </h2>
                <span className="text-sm text-light-700 dark:text-dark-400">
                  {manga.chapters.length} bölüm
                </span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden pr-2">
                {displayedChapters.map((chapter) => (
                  <Link
                    key={chapter._id}
                    href={`/manga/${manga.slug}/chapter-${chapter.chapterNumber}`}
                    className="btn btn-ghost w-full justify-between p-4 h-auto"
                  >
                    <div className="flex flex-col items-start">
                      <p className="text-sm font-medium text-dark-950 dark:text-light-50">
                        Chapter {chapter.chapterNumber}
                      </p>
                      <p className="text-xs text-light-700 dark:text-dark-400 truncate">
                        {chapter.title}
                      </p>
                    </div>
                    <div className="text-xs text-light-600 dark:text-dark-500">
                      {new Date(chapter.publishedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </Link>
                ))}
              </div>
              
              {manga.chapters.length > 10 && (
                <button
                  onClick={() => setShowAllChapters(!showAllChapters)}
                  className="w-full mt-4 btn btn-ghost btn-sm"
                >
                  {showAllChapters ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Daha Az Göster
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Tüm Bölümleri Göster
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentSystem 
            mangaId={manga._id} 
            user={user} 
            showReactions={true}
            targetType="manga"
            targetId={manga._id}
          />
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-4">
              {manga?.title} için puanınız
            </h3>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className="text-3xl transition-colors hover:scale-110"
                  onMouseEnter={() => {
                    // Show preview on hover
                    const stars = document.querySelectorAll('.rating-star');
                    stars.forEach((s, index) => {
                      if (index < star) {
                        s.classList.add('text-yellow-400', 'fill-current');
                        s.classList.remove('text-gray-300', 'dark:text-gray-600');
                      } else {
                        s.classList.remove('text-yellow-400', 'fill-current');
                        s.classList.add('text-gray-300', 'dark:text-gray-600');
                      }
                    });
                  }}
                  onMouseLeave={() => {
                    // Reset to actual rating
                    const stars = document.querySelectorAll('.rating-star');
                    stars.forEach((s, index) => {
                      if (index < userRating) {
                        s.classList.add('text-yellow-400', 'fill-current');
                        s.classList.remove('text-gray-300', 'dark:text-gray-600');
                      } else {
                        s.classList.remove('text-yellow-400', 'fill-current');
                        s.classList.add('text-gray-300', 'dark:text-gray-600');
                      }
                    });
                  }}
                >
                  <Star
                    className={`w-8 h-8 rating-star ${
                      star <= userRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 btn btn-ghost"
              >
                İptal
              </button>
              {userRating > 0 && (
                <button
                  onClick={() => handleRating(0)}
                  className="flex-1 btn btn-outline"
                >
                  Puanı Kaldır
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add to List Modal */}
      <AddToListModal
        isOpen={showAddToListModal}
        onClose={() => setShowAddToListModal(false)}
        mangaId={manga._id}
        mangaTitle={manga.title}
      />

      <Footer />
    </div>
  );
}