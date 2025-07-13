'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  Star, 
  Eye, 
  Calendar,
  Filter,
  SlidersHorizontal,
  Trash2,
  Plus,
  List,
  Edit,
  Globe,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';
import { useAuth } from '@/components/providers/AuthProvider';
import AddToListModal from '@/components/ui/AddToListModal';
import CreateListModal from '@/components/ui/CreateListModal';

interface LibraryItem {
  _id: string;
  title: string;
  slug: string;
  coverImage: string;
  author: string[];
  genres: string[];
  status: string;
  type: string;
  rating: number;
  viewCount: number;
  updatedAt: string;
  readingHistory?: {
    chapterId: string;
    pageNumber: number;
    readAt: string;
  }[];
}

interface CustomReadingList {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  mangaCount: number;
  mangas: LibraryItem[];
  createdAt: string;
  updatedAt: string;
}

type LibraryTab = 'favorites' | 'custom-lists';

export default function LibraryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<LibraryTab>('favorites');
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomReadingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    genre: '',
    status: '',
    type: '',
    sort: 'updatedAt',
    order: 'desc'
  });

  const sortOptions = [
    { value: 'updatedAt', label: 'Son Güncelleme' },
    { value: 'title', label: 'Alfabetik' },
    { value: 'rating', label: 'Puan' },
    { value: 'viewCount', label: 'Görüntülenme' }
  ];

  const orderOptions = [
    { value: 'desc', label: '↓' },
    { value: 'asc', label: '↑' }
  ];

  const genreOptions = [
    { value: '', label: 'Tüm Türler' },
    { value: 'Action', label: 'Action' },
    { value: 'Adventure', label: 'Adventure' },
    { value: 'Comedy', label: 'Comedy' },
    { value: 'Drama', label: 'Drama' },
    { value: 'Fantasy', label: 'Fantasy' },
    { value: 'Romance', label: 'Romance' }
  ];

  const statusOptions = [
    { value: '', label: 'Tüm Durumlar' },
    { value: 'ongoing', label: 'Devam Ediyor' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'hiatus', label: 'Ara Verildi' },
    { value: 'cancelled', label: 'İptal Edildi' }
  ];

  const typeOptions = [
    { value: '', label: 'Tüm Tipler' },
    { value: 'manga', label: 'Manga' },
    { value: 'manhwa', label: 'Manhwa' },
    { value: 'manhua', label: 'Manhua' },
    { value: 'webtoon', label: 'Webtoon' }
  ];

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        toast.error('Lütfen giriş yapın');
      } else {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchLibraryItems();
    }
  }, [user, authLoading, activeTab]);

  useEffect(() => {
    if (user && !authLoading && !initialLoading) {
      fetchLibraryItems();
    }
  }, [filters]);

  const fetchLibraryItems = async () => {
    try {
      if (initialLoading) {
        setLoading(true);
      }
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      let endpoint = '';
      
      switch (activeTab) {
        case 'favorites':
          endpoint = '/api/user/favorites';
          break;
        case 'custom-lists':
          endpoint = '/api/user/custom-lists';
          break;
      }

      if (activeTab === 'custom-lists') {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setCustomLists(data.data || []);
        } else if (response.status === 404) {
          setCustomLists([]);
        } else {
          throw new Error('Özel listeler yüklenemedi');
        }
      } else {
        const params = new URLSearchParams({
          sort: filters.sort,
          order: filters.order
        });

        if (filters.genre) params.append('genre', filters.genre);
        if (filters.status) params.append('status', filters.status);
        if (filters.type) params.append('type', filters.type);

        const response = await fetch(`${endpoint}?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setItems(data.data || []);
        } else if (response.status === 404) {
          setItems([]);
        } else {
          throw new Error('Kütüphane yüklenemedi');
        }
      }
    } catch (error) {
      console.error('Library fetch error:', error);
      if (activeTab === 'custom-lists') {
        setCustomLists([]);
      } else {
        setItems([]);
      }
    } finally {
      if (initialLoading) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  };

  const handleRemoveFromLibrary = async (mangaId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      let endpoint = '';
      let body = {};
      
      switch (activeTab) {
        case 'favorites':
          endpoint = '/api/user/favorites';
          body = { mangaId, action: 'remove' };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setItems(items.filter(item => item._id !== mangaId));
        toast.success('Kütüphaneden kaldırıldı');
      } else {
        throw new Error('Kaldırma işlemi başarısız');
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Kaldırma işlemi sırasında hata oluştu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      case 'hiatus': return 'status-hiatus';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-badge';
    }
  };

  const getTabTitle = (tab: LibraryTab) => {
    switch (tab) {
      case 'favorites': return 'Favoriler';
      case 'custom-lists': return 'Özel Listeler';
    }
  };

  const getTabIcon = (tab: LibraryTab) => {
    switch (tab) {
      case 'favorites': return Heart;
      case 'custom-lists': return List;
    }
  };

  const getEmptyMessage = (tab: LibraryTab) => {
    switch (tab) {
      case 'favorites': return 'Henüz favoriye eklediğiniz manga bulunmuyor.';
      case 'custom-lists': return 'Henüz özel liste oluşturmamışsınız.';
    }
  };

  if (authLoading || loading) {
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container-responsive py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50 mb-4">
            Kütüphanem
          </h1>
          
          {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-light-200 dark:bg-dark-800 rounded-lg p-1">
            {(['favorites', 'custom-lists'] as LibraryTab[]).map((tab) => {
              const Icon = getTabIcon(tab);
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ease-in-out transform ${
                    activeTab === tab
                      ? 'bg-white dark:bg-dark-700 text-blue-600 dark:text-blue-400 shadow-sm scale-105'
                      : 'text-light-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-light-50 hover:bg-light-100 dark:hover:bg-dark-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab ? 'scale-110' : ''}`} />
                  <span className="transition-all duration-300">{getTabTitle(tab)}</span>
                </button>
              );
            })}
          </div>
          
          {activeTab === 'custom-lists' && (
            <button
              onClick={() => setShowCreateListModal(true)}
              className="btn btn-primary flex items-center gap-2 transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Yeni Liste
            </button>
          )}
        </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline btn-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtreler
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-light-700 dark:text-dark-400">
                Sıralama:
              </span>
              <Dropdown
                options={sortOptions}
                value={filters.sort}
                onChange={(value) => setFilters({...filters, sort: value})}
                buttonClassName="btn-sm"
                menuClassName="w-40"
              />
              <Dropdown
                options={orderOptions}
                value={filters.order}
                onChange={(value) => setFilters({...filters, order: value})}
                buttonClassName="btn-sm w-16"
                menuClassName="w-16"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="card p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                    Tür
                  </label>
                  <Dropdown
                    options={genreOptions}
                    value={filters.genre}
                    onChange={(value) => setFilters({...filters, genre: value})}
                    placeholder="Tür Seçin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                    Durum
                  </label>
                  <Dropdown
                    options={statusOptions}
                    value={filters.status}
                    onChange={(value) => setFilters({...filters, status: value})}
                    placeholder="Durum Seçin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                    Tip
                  </label>
                  <Dropdown
                    options={typeOptions}
                    value={filters.type}
                    onChange={(value) => setFilters({...filters, type: value})}
                    placeholder="Tip Seçin"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="transition-all duration-500 ease-in-out">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {activeTab === 'custom-lists' ? (
                // Custom Lists View
                <div className="animate-fadeIn">
                  {customLists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customLists.map((list) => (
                    <div key={list._id} className="card group cursor-pointer" onClick={() => router.push(`/list/${list._id}`)}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-dark-950 dark:text-light-50">
                                {list.name}
                              </h3>
                              {list.isPublic ? (
                                <div className="relative group">
                                  <Globe className="w-4 h-4 text-green-600" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Herkese açık
                                  </div>
                                </div>
                              ) : (
                                <div className="relative group">
                                  <Lock className="w-4 h-4 text-light-600 dark:text-dark-400" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Özel
                                  </div>
                                </div>
                              )}
                            </div>
                            {list.description && (
                              <p className="text-sm text-light-700 dark:text-dark-400 mb-2">
                                {list.description}
                              </p>
                            )}
                            <p className="text-sm text-light-600 dark:text-dark-500">
                              {list.mangaCount} manga
                            </p>
                          </div>
                          <button 
                            className="p-1 hover:bg-light-200 dark:hover:bg-dark-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/list/${list._id}`);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Preview of first few manga covers */}
                        <div className="flex -space-x-2 mb-4">
                          {list.mangas.slice(0, 4).map((manga, index) => (
                            <img
                              key={manga._id}
                              src={manga.coverImage}
                              alt={manga.title}
                              className="w-12 h-16 object-cover rounded border-2 border-white dark:border-dark-900"
                              style={{ zIndex: 4 - index }}
                            />
                          ))}
                          {list.mangaCount > 4 && (
                            <div className="w-12 h-16 bg-light-200 dark:bg-dark-800 rounded border-2 border-white dark:border-dark-900 flex items-center justify-center">
                              <span className="text-xs text-light-600 dark:text-dark-400">
                                +{list.mangaCount - 4}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-light-600 dark:text-dark-500">
                          <span>Oluşturulma: {new Date(list.createdAt).toLocaleDateString('tr-TR')}</span>
                          <span>Güncelleme: {new Date(list.updatedAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 p-4 bg-light-200 dark:bg-dark-800 rounded-full">
                    <List className="w-8 h-8 text-light-600 dark:text-dark-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-2">
                    Özel Listeler Boş
                  </h3>
                  <p className="text-light-700 dark:text-dark-400 mb-4">
                    Henüz özel liste oluşturmamışsınız.
                  </p>
                  <Link href="/search" className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    Manga Keşfet
                  </Link>
                </div>
              )}
            </div>
          ) : (
            // Regular manga grid view for favorites and reading list
            <div className="animate-fadeIn">
              {items.length > 0 ? (
                <div className="manga-grid stagger-animation">
                  {items.map((item, index) => (
                    <Link key={item._id} href={`/manga/${item.slug || item._id}`} className="manga-card card-cinematic group" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="card-interactive overflow-hidden relative">
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
                        
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 bg-black/60 text-white text-xs rounded">
                            {item.type}
                          </span>
                        </div>
                        
                        <div className="absolute top-2 right-2 flex gap-1">
                          <span className={`${getStatusColor(item.status)} text-xs`}>
                            {item.status}
                          </span>
                          <div className="relative group/remove">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveFromLibrary(item._id);
                              }}
                              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/remove:opacity-100 transition-opacity whitespace-nowrap">
                              Kütüphaneden Kaldır
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h3 className="manga-title" title={item.title}>
                            {item.title}
                          </h3>
                          <p className="manga-meta mb-2">
                            {(item.author || []).join(', ')}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {(item.genres || []).slice(0, 2).map((genre) => (
                              <span key={genre} className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                                {genre}
                              </span>
                            ))}
                            {(item.genres || []).length > 2 && (
                              <span className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                                +{(item.genres || []).length - 2}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current transition-transform duration-200 group-hover:scale-110" />
                              <span className="text-xs">{(item.rating || 0).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-gray-500 transition-transform duration-200 group-hover:scale-110" />
                              <span className="text-xs text-gray-500">{(item.viewCount || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 p-4 bg-light-200 dark:bg-dark-800 rounded-full">
                    {(() => {
                      const Icon = getTabIcon(activeTab);
                      return <Icon className="w-8 h-8 text-light-600 dark:text-dark-400" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-2">
                    {getTabTitle(activeTab)} Boş
                  </h3>
                  <p className="text-light-700 dark:text-dark-400 mb-4">
                    {getEmptyMessage(activeTab)}
                  </p>
                  <Link href="/search" className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    Manga Keşfet
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>

      </main>

      <Footer />
      
      <CreateListModal
        isOpen={showCreateListModal}
        onClose={() => setShowCreateListModal(false)}
        onListCreated={() => {
          if (activeTab === 'custom-lists') {
            fetchLibraryItems();
          }
        }}
      />
    </div>
  );
}