'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { TrendingUp, Star, Eye, Clock, BookOpen } from 'lucide-react';

export default function TrendingPage() {
  const [trendingContent, setTrendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('popular');

  useEffect(() => {
    fetchTrendingContent();
  }, []);

  const fetchTrendingContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manga?sort=rating&order=desc&limit=50');
      if (response.ok) {
        const data = await response.json();
        setTrendingContent(data.mangas || []);
      }
    } catch (error) {
      console.error('Trending content fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredContent = () => {
    switch (activeTab) {
      case 'popular':
        return trendingContent.filter((item: any) => item.rating >= 4);
      case 'top-rated':
        return trendingContent.filter((item: any) => item.rating >= 4.5);
      case 'most-viewed':
        return [...trendingContent].sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0));
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return trendingContent.filter((item: any) => new Date(item.createdAt) > weekAgo);
      default:
        return trendingContent;
    }
  };

  const filteredContent = getFilteredContent();

  const tabs = [
    { id: 'popular', name: 'Popüler', icon: TrendingUp, description: 'En beğenilen içerikler' },
    { id: 'top-rated', name: 'En Yüksek Puanlı', icon: Star, description: '4.5+ puana sahip içerikler' },
    { id: 'most-viewed', name: 'En Çok Görüntülenen', icon: Eye, description: 'En çok okunan içerikler' },
    { id: 'recent', name: 'Yeni Trendler', icon: Clock, description: 'Son 7 günde eklenen popüler içerikler' }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container-responsive py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50 mb-2">
            Popüler İçerikler
          </h1>
          <p className="text-muted">
            En popüler manga, manhwa, manhua ve webtoon'ları keşfedin
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-4 rounded-lg border transition-all ${
                    activeTab === tab.id 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-light-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary-600' : 'text-muted'}`} />
                    <h3 className={`font-semibold ${activeTab === tab.id ? 'text-primary-600' : 'text-dark-950 dark:text-light-50'}`}>
                      {tab.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted text-left">
                    {tab.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-muted text-lg mb-2">
              Bu kategoride henüz içerik bulunmuyor.
            </p>
            <p className="text-muted text-sm">
              Farklı bir kategori deneyebilirsiniz.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-dark-950 dark:text-light-50">
                {tabs.find(tab => tab.id === activeTab)?.name}
              </h2>
              <p className="text-muted">
                {filteredContent.length} içerik
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item: any, index: number) => (
                <Link
                  key={item._id}
                  href={`/manga/${item.slug || item._id}`}
                  className="card p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="w-16 h-20 bg-light-200 dark:bg-dark-800 rounded flex-shrink-0">
                        {item.coverImage ? (
                          <img 
                            src={item.coverImage} 
                            alt={item.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                            Kapak
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-dark-950 dark:text-light-50 truncate">
                          {item.title}
                        </h3>
                        {item.type && (
                          <span className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 px-2 py-1 rounded text-xs flex-shrink-0">
                            {item.type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted mb-2 line-clamp-2">
                        {item.description || 'Açıklama bulunmuyor.'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted">
                        {item.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{item.rating}</span>
                          </div>
                        )}
                        {item.viewCount && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{item.viewCount}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {item.genres?.slice(0, 3).map((genre: string) => (
                            <span key={genre} className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
} 