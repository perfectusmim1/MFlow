'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Star, 
  Eye, 
  Calendar,
  BookOpen,
  X,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';

interface SearchResult {
  _id: string;
  title: string;
  slug?: string;
  coverImage: string;
  author: string[];
  genres: string[];
  status: string;
  type: string;
  rating: number;
  ratingCount: number;
  viewCount: number;
  updatedAt: string;
  description: string;
}

interface SearchFilters {
  search: string;
  genre: string;
  status: string;
  type: string;
  sort: string;
  order: string;
}

const genres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Supernatural', 'Thriller', 'Yaoi', 'Yuri', 'Ecchi', 'Harem',
  'Isekai', 'Mecha', 'School', 'Historical', 'Military', 'Music',
  'Psychological', 'Seinen', 'Shoujo', 'Shounen', 'Josei'
];

const genreOptions = [
  { value: '', label: 'Tüm Türler' },
  ...genres.map(genre => ({ value: genre, label: genre }))
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

const sortOptions = [
  { value: 'updatedAt', label: 'Son Güncelleme' },
  { value: 'createdAt', label: 'Yayın Tarihi' },
  { value: 'title', label: 'Alfabetik' },
  { value: 'rating', label: 'Puan' },
  { value: 'viewCount', label: 'Görüntülenme' },
  { value: 'favoriteCount', label: 'Favori' }
];

const orderOptions = [
  { value: 'desc', label: '↓' },
  { value: 'asc', label: '↑' }
];

export default function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    genre: '',
    status: '',
    type: '',
    sort: 'updatedAt',
    order: 'desc'
  });

  useEffect(() => {
    // Initialize filters from URL params
    const initialFilters = {
      search: searchParams.get('search') || '',
      genre: searchParams.get('genre') || '',
      status: searchParams.get('status') || '',
      type: searchParams.get('type') || '',
      sort: searchParams.get('sort') || 'updatedAt',
      order: searchParams.get('order') || 'desc'
    };
    
    setFilters(initialFilters);
    
    // Initial search
    if (initialFilters.search || initialFilters.genre || initialFilters.status || initialFilters.type) {
      searchManga(initialFilters, 1);
    }
  }, [searchParams]);

  const searchManga = async (searchFilters: SearchFilters, page: number = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort: searchFilters.sort,
        order: searchFilters.order
      });

      if (searchFilters.search) params.append('search', searchFilters.search);
      if (searchFilters.genre) params.append('genre', searchFilters.genre);
      if (searchFilters.status) params.append('status', searchFilters.status);
      if (searchFilters.type) params.append('type', searchFilters.type);

      const response = await fetch(`/api/manga?${params}`);
      
      if (!response.ok) {
        throw new Error('Arama başarısız');
      }
      
      const data = await response.json();
      setResults(data.data);
      setPagination(data.pagination);
      
      // Update URL
      const newUrl = new URL(window.location.href);
      newUrl.search = params.toString();
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Arama yapılırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Auto search when filters change
    if (key !== 'search') {
      searchManga(newFilters, 1);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchManga(filters, 1);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      search: '',
      genre: '',
      status: '',
      type: '',
      sort: 'updatedAt',
      order: 'desc'
    };
    setFilters(clearedFilters);
    setResults([]);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    });
    router.push('/search');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'px-2 py-1 bg-green-100 text-green-800 rounded';
      case 'completed':
        return 'px-2 py-1 bg-blue-100 text-blue-800 rounded';
      case 'hiatus':
        return 'px-2 py-1 bg-yellow-100 text-yellow-800 rounded';
      case 'cancelled':
        return 'px-2 py-1 bg-red-100 text-red-800 rounded';
      default:
        return 'px-2 py-1 bg-gray-100 text-gray-800 rounded';
    }
  };

  return (
    <div className="min-h-screen bg-light-50 dark:bg-dark-950">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50 mb-6">
            Manga Ara
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-600 dark:text-dark-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Manga adı, yazar, tür..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-light-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-900 text-dark-950 dark:text-light-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary px-6"
              >
                Ara
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline px-4 flex items-center gap-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white dark:bg-dark-900 rounded-lg p-6 mb-6 border border-light-200 dark:border-dark-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">
                  Filtreler
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-light-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Temizle
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Genre Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                    Tür
                  </label>
                  <Dropdown
                    options={genreOptions}
                    value={filters.genre}
                    onChange={(value) => handleFilterChange('genre', value)}
                    placeholder="Tür Seçin"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                    Durum
                  </label>
                  <Dropdown
                    options={statusOptions}
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                    placeholder="Durum Seçin"
                  />
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                    Tip
                  </label>
                  <Dropdown
                    options={typeOptions}
                    value={filters.type}
                    onChange={(value) => handleFilterChange('type', value)}
                    placeholder="Tip Seçin"
                  />
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                    Sıralama
                  </label>
                  <div className="flex gap-2">
                    <Dropdown
                      options={sortOptions}
                      value={filters.sort}
                      onChange={(value) => handleFilterChange('sort', value)}
                      placeholder="Sıralama"
                      className="flex-1"
                    />
                    <Dropdown
                      options={orderOptions}
                      value={filters.order}
                      onChange={(value) => handleFilterChange('order', value)}
                      buttonClassName="w-16"
                      menuClassName="w-16"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {results.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-light-700 dark:text-dark-400">
                    {pagination.total} sonuç bulundu
                  </p>
                  <div className="text-sm text-light-600 dark:text-dark-400">
                    Sayfa {pagination.page} / {pagination.totalPages}
                  </div>
                </div>

                <div className="manga-grid stagger-animation">
                  {results.map((manga, index) => (
                    <Link
                      key={manga._id}
                      href={`/manga/${manga.slug || manga._id}`}
                      className="manga-card card-cinematic group"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <div className="card-interactive overflow-hidden relative">
                        <div className="relative overflow-hidden">
                          <img
                            src={manga.coverImage}
                            alt={manga.title}
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
                            {manga.type || 'Manga'}
                          </span>
                        </div>
                        
                        <div className="absolute top-2 right-2">
                          <span className={`${getStatusColor(manga.status)} text-xs`}>
                            {manga.status}
                          </span>
                        </div>
                        
                        <div className="p-3">
                          <h3 className="manga-title" title={manga.title}>
                            {manga.title}
                          </h3>
                          <p className="manga-meta mb-2">
                            {manga.author && manga.author.length > 0 ? manga.author.join(', ') : manga.author || 'Bilinmeyen Yazar'}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {manga.genres && manga.genres.length > 0 ? manga.genres.slice(0, 2).map((genre) => (
                              <span key={genre} className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                                {genre}
                              </span>
                            )) : (
                              <span className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                                Tür Belirtilmemiş
                              </span>
                            )}
                            {manga.genres && manga.genres.length > 2 && (
                              <span className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                                +{manga.genres.length - 2}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current transition-transform duration-200 group-hover:scale-110" />
                              <span className="text-xs">{(manga.rating || 0).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-gray-500 transition-transform duration-200 group-hover:scale-110" />
                              <span className="text-xs text-gray-500">{(manga.viewCount || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => searchManga(filters, pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="btn btn-outline btn-sm disabled:opacity-50"
                    >
                      Önceki
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => searchManga(filters, pageNum)}
                            className={`btn btn-sm ${pageNum === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => searchManga(filters, pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="btn btn-outline btn-sm disabled:opacity-50"
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-light-400 dark:text-dark-600 mb-4" />
                <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-2">
                  Sonuç Bulunamadı
                </h3>
                <p className="text-light-700 dark:text-dark-400 mb-4">
                  Arama kriterlerinize uygun manga bulunamadı.
                </p>
                <button
                  onClick={clearFilters}
                  className="btn btn-primary"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}