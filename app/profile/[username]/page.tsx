'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  User, 
  Calendar, 
  BookOpen, 
  Heart, 
  Eye, 
  Globe,
  Lock,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

interface UserProfile {
  _id: string;
  username: string;
  email?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  stats: {
    totalFavorites: number;
    totalComments: number;
    totalCustomLists: number;
    totalPublicLists?: number;
    totalPrivateLists?: number;
  };
  customLists: Array<{
    _id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    mangaCount: number;
    mangaPreviews: Array<{
      _id: string;
      title: string;
      coverImage: string;
    }>;
  }>;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const username = params.username as string;
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (username && !authLoading) {
      fetchProfile();
    }
  }, [username, currentUser, authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      let response;
      const isOwn = currentUser?.username === username;
      
      if (isOwn) {
        // Kendi profilimiz için auth gerekli
        const token = localStorage.getItem('token');
        response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } else {
        // Başka kullanıcının profili için public endpoint
        response = await fetch(`/api/user/profile/${username}`);
      }

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
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

  if (notFound || !profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50 mb-4">
              Kullanıcı Bulunamadı
            </h1>
            <p className="text-light-700 dark:text-dark-400 mb-6">
              Aradığınız kullanıcı mevcut değil veya profili gizli.
            </p>
            <Link href="/" className="btn btn-primary">
              Ana Sayfaya Dön
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
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-light-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-light-50 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </button>

          {/* Profile Header */}
          <div className="card p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={`${profile.username} profil fotoğrafı`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50">
                    {profile.username}
                  </h1>
                  {profile.role === 'admin' && (
                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 text-light-700 dark:text-dark-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Üye oldu: {new Date(profile.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                {isOwnProfile && (
                  <div className="mt-4">
                    <Link href="/settings" className="btn btn-outline">
                      Profili Düzenle
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href={`/profile/${username}/favorites`} className="block">
              <div className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-2xl font-bold text-dark-950 dark:text-light-50 mb-1">
                  {profile.stats.totalFavorites}
                </div>
                <div className="text-sm text-light-700 dark:text-dark-400">
                  Favori Manga
                </div>
              </div>
            </Link>

            <Link href={`/profile/${username}/comments`} className="block">
              <div className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-dark-950 dark:text-light-50 mb-1">
                  {profile.stats.totalComments || 0}
                </div>
                <div className="text-sm text-light-700 dark:text-dark-400">
                  Toplam Yorum
                </div>
              </div>
            </Link>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-dark-950 dark:text-light-50 mb-1">
                {profile.stats.totalPublicLists || 0}
              </div>
              <div className="text-sm text-light-700 dark:text-dark-400">
                Herkese Açık Liste
              </div>
            </div>
          </div>

          {/* Public Custom Lists */}
          {profile.customLists && profile.customLists.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-dark-950 dark:text-light-50 mb-6">
                Herkese Açık Listeler
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.customLists.map((list) => (
                  <Link
                    key={list._id}
                    href={`/list/${list._id}`}
                    className="block group"
                  >
                    <div className="card p-4 hover:shadow-lg transition-shadow">
                      {/* Manga Previews */}
                      <div className="grid grid-cols-3 gap-1 mb-3 h-24">
                        {list.mangaPreviews.slice(0, 3).map((manga, index) => (
                          <div
                            key={manga._id}
                            className="relative rounded overflow-hidden bg-light-200 dark:bg-dark-800"
                          >
                            <img
                              src={manga.coverImage}
                              alt={manga.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {Array.from({ length: 3 - list.mangaPreviews.length }).map((_, index) => (
                          <div
                            key={`empty-${index}`}
                            className="bg-light-200 dark:bg-dark-800 rounded flex items-center justify-center"
                          >
                            <BookOpen className="w-4 h-4 text-light-500 dark:text-dark-500" />
                          </div>
                        ))}
                      </div>

                      {/* List Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-dark-950 dark:text-light-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {list.name}
                          </h3>
                          <div className="relative group/tooltip">
                            <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-950 text-light-50 text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                              Herkese açık
                            </div>
                          </div>
                        </div>
                        
                        {list.description && (
                          <p className="text-sm text-light-700 dark:text-dark-400 line-clamp-2">
                            {list.description}
                          </p>
                        )}
                        
                        <div className="text-xs text-light-600 dark:text-dark-500">
                          {list.mangaCount} manga
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State for Public Lists */}
          {(!profile.customLists || profile.customLists.length === 0) && (
            <div className="card p-8 text-center">
              <BookOpen className="w-16 h-16 text-light-400 dark:text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-2">
                Henüz Herkese Açık Liste Yok
              </h3>
              <p className="text-light-700 dark:text-dark-400">
                {isOwnProfile 
                  ? "Henüz herkese açık bir liste oluşturmadınız."
                  : `${profile.username} henüz herkese açık bir liste oluşturmamış.`
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