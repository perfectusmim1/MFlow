'use client';

import { useEffect, useState } from 'react';
import { BookOpen, FileText, Users, Eye, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalManga: number;
  totalChapters: number;
  totalUsers: number;
  totalViews: number;
  recentManga: any[];
  recentChapters: any[];
  popularManga: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Token'ı al
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Fetch all stats in parallel
      const [mangaRes, chaptersRes, usersRes] = await Promise.all([
        fetch('/api/manga?limit=5&sort=createdAt&order=desc', { headers }),
        fetch('/api/chapters?limit=5&sort=createdAt&order=desc', { headers }),
        fetch('/api/admin/users?limit=5&sort=createdAt&order=desc', { headers })
      ]);

      const mangaData = await mangaRes.json();
      const chaptersData = await chaptersRes.json();
      const usersData = usersRes.ok ? await usersRes.json() : { data: [], pagination: { total: 0 } };

      // Debug için log ekle
      console.log('Users API Response:', {
        status: usersRes.status,
        ok: usersRes.ok,
        data: usersData
      });

      // Calculate total views
      const totalViews = mangaData.data.reduce((sum: number, manga: any) => sum + (manga.viewCount || 0), 0) +
                        chaptersData.data.reduce((sum: number, chapter: any) => sum + (chapter.viewCount || 0), 0);

      // Get popular manga (top 5 by views)
      const popularMangaRes = await fetch('/api/manga?limit=5&sort=viewCount&order=desc', { headers });
      const popularMangaData = await popularMangaRes.json();

      setStats({
        totalManga: mangaData.pagination.total,
        totalChapters: chaptersData.pagination.total,
        totalUsers: usersData.pagination.total,
        totalViews,
        recentManga: mangaData.data.slice(0, 5),
        recentChapters: chaptersData.data.slice(0, 5),
        popularManga: popularMangaData.data.slice(0, 5)
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
      toast.error('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-light-700 dark:text-dark-400">İstatistikler yüklenemedi</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Manga',
      value: stats.totalManga,
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      title: 'Toplam Chapter',
      value: stats.totalChapters,
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      title: 'Toplam Kullanıcı',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Toplam Görüntülenme',
      value: stats.totalViews,
      icon: Eye,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-light-700 dark:text-dark-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-dark-950 dark:text-light-50">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Manga */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">
              Son Eklenen Manga
            </h3>
            <TrendingUp className="w-5 h-5 text-light-600 dark:text-dark-400" />
          </div>
          <div className="space-y-3">
            {stats.recentManga.map((manga) => (
              <div key={manga._id} className="flex items-center gap-3 p-3 rounded-lg bg-light-100 dark:bg-dark-800">
                <img
                  src={manga.coverImage}
                  alt={manga.title}
                  className="w-10 h-10 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" title={manga.title}>
                    {manga.title}
                  </p>
                  <p className="text-xs text-light-700 dark:text-dark-400">
                    {manga.author && Array.isArray(manga.author) ? manga.author.join(', ') : 'Yazar bilinmiyor'}
                  </p>
                </div>
                <div className="text-xs text-light-600 dark:text-dark-400">
                  {new Date(manga.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Chapters */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">
              Son Eklenen Chapter
            </h3>
            <Calendar className="w-5 h-5 text-light-600 dark:text-dark-400" />
          </div>
          <div className="space-y-3">
            {stats.recentChapters.map((chapter) => (
              <div key={chapter._id} className="flex items-center gap-3 p-3 rounded-lg bg-light-100 dark:bg-dark-800">
                <div className="w-10 h-10 bg-dark-950 dark:bg-light-50 rounded flex items-center justify-center">
                  <span className="text-light-50 dark:text-dark-950 text-sm font-medium">
                    {chapter.chapterNumber}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-950 dark:text-light-50 truncate">
                    {chapter.title}
                  </p>
                  <p className="text-xs text-light-700 dark:text-dark-400">
                    {chapter.mangaId?.title || 'Manga bulunamadı'}
                  </p>
                </div>
                <div className="text-xs text-light-600 dark:text-dark-400">
                  {new Date(chapter.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Manga */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">
            Popüler Manga
          </h3>
          <Eye className="w-5 h-5 text-light-600 dark:text-dark-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats.popularManga.map((manga) => (
            <div key={manga._id} className="group">
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg mb-2">
                <img
                  src={manga.coverImage}
                  alt={manga.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">
                    {manga.viewCount.toLocaleString()} görüntülenme
                  </p>
                </div>
              </div>
              <h4 className="text-sm font-medium text-dark-950 dark:text-light-50 truncate">
                {manga.title}
              </h4>
              <p className="text-xs text-light-700 dark:text-dark-400">
                {manga.author && Array.isArray(manga.author) ? manga.author.join(', ') : 'Yazar bilinmiyor'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}