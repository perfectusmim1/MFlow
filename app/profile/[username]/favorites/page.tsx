'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Calendar, Star } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

interface FavoriteManga {
  _id: string;
  title: string;
  coverImage: string;
  slug: string;
  author: string;
  status: string;
  description: string;
  rating: number;
  addedAt: string;
}

interface FavoritesData {
  username: string;
  favorites: FavoriteManga[];
  totalCount: number;
}

export default function UserFavoritesPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<FavoritesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const username = params.username as string;
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (username) {
      fetchFavorites();
    }
  }, [username]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/user/profile/${username}/favorites`);

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
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

  if (notFound || !data) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50 mb-4">
              Sayfa Bulunamadı
            </h1>
            <p className="text-light-700 dark:text-dark-400 mb-6">
              Aradığınız sayfa mevcut değil.
            </p>
            <Link href={`/profile/${username}`} className="btn btn-primary">
              Profile Dön
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-light-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-light-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
                  {data.username} - Favori Mangalar
                </h1>
                <p className="text-light-700 dark:text-dark-400">
                  {data.totalCount} favori manga
                </p>
              </div>
            </div>
          </div>

          {/* Favorites Grid */}
          {data.favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.favorites.map((manga) => (
                <Link
                  key={manga._id}
                  href={`/manga/${manga.slug}`}
                  className="group block"
                >
                  <div className="card overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Cover Image */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={manga.coverImage}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                      {manga.rating > 0 && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {manga.rating.toFixed(1)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-dark-950 dark:text-light-50 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {manga.title}
                      </h3>
                      
                      <p className="text-sm text-light-700 dark:text-dark-400 mb-2">
                        {manga.author}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-light-600 dark:text-dark-500">
                        <span className={`px-2 py-1 rounded-full ${
                          manga.status === 'ongoing' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                        }`}>
                          {manga.status === 'ongoing' ? 'Devam Ediyor' : 'Tamamlandı'}
                        </span>
                      </div>
                      
                      {manga.description && (
                        <p className="text-xs text-light-600 dark:text-dark-500 mt-2 line-clamp-2">
                          {manga.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-light-400 dark:text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-2">
                Henüz Favori Manga Yok
              </h3>
              <p className="text-light-700 dark:text-dark-400">
                {isOwnProfile 
                  ? "Henüz hiç manga favorilerinize eklemediniz."
                  : `${data.username} henüz hiç manga favorilerine eklememiş.`
                }
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}