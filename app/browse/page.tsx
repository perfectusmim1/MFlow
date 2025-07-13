'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';
import MangaHoverCard from '@/components/ui/MangaHoverCard';
import { Search, Filter, Grid, List, BookOpen, Star, TrendingUp, Clock } from 'lucide-react';

export default function BrowsePage() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('title');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredManga, setHoveredManga] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manga');
      if (response.ok) {
        const data = await response.json();
        setContent(data.mangas || []);
      }
    } catch (error) {
      console.error('Content fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=all`);
    }
  };

  const handleMouseEnter = (item: any, event: React.MouseEvent) => {
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

  const filteredContent = content.filter((item: any) => {
    // Search filter
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Genre filter
    const matchesGenre = filterGenre === 'all' || item.genres?.includes(filterGenre);
    
    // Type filter - check both type and category fields
    const matchesType = filterType === 'all' || 
      item.type === filterType || 
      item.category === filterType ||
      (filterType === 'manga' && (item.type === 'manga' || item.category === 'manga')) ||
      (filterType === 'manhwa' && (item.type === 'manhwa' || item.category === 'manhwa')) ||
      (filterType === 'manhua' && (item.type === 'manhua' || item.category === 'manhua')) ||
      (filterType === 'webtoon' && (item.type === 'webtoon' || item.category === 'webtoon'));
    
    // Category tab filter
    let matchesCategory = true;
    switch (activeTab) {
      case 'popular':
        matchesCategory = (item.rating || 0) >= 4;
        break;
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        matchesCategory = new Date(item.createdAt) > weekAgo;
        break;
      case 'top-rated':
        matchesCategory = (item.rating || 0) >= 4.5;
        break;
      case 'all':
      default:
        matchesCategory = true;
        break;
    }
    
    return matchesSearch && matchesGenre && matchesType && matchesCategory;
  });

  const sortedContent = [...filteredContent].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'views':
        return (b.viewCount || 0) - (a.viewCount || 0);
      default:
        return 0;
    }
  });

  const categories = [
    { id: 'all', name: 'Tümü', icon: BookOpen, count: content.length },
    { id: 'popular', name: 'Popüler', icon: TrendingUp, count: content.filter((item: any) => item.rating >= 4).length },
    { id: 'recent', name: 'Yeni Eklenen', icon: Clock, count: content.filter((item: any) => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(item.createdAt) > weekAgo;
    }).length },
    { id: 'top-rated', name: 'En Yüksek Puanlı', icon: Star, count: content.filter((item: any) => item.rating >= 4.5).length }
  ];

  const typeOptions = [
    { value: 'all', label: 'Tüm Türler' },
    { value: 'manga', label: 'Manga' },
    { value: 'manhwa', label: 'Manhwa' },
    { value: 'manhua', label: 'Manhua' },
    { value: 'webtoon', label: 'Webtoon' }
  ];

  const genreOptions = [
    { value: 'all', label: 'Tüm Türler' },
    { value: 'action', label: 'Aksiyon' },
    { value: 'adventure', label: 'Macera' },
    { value: 'comedy', label: 'Komedi' },
    { value: 'drama', label: 'Drama' },
    { value: 'fantasy', label: 'Fantastik' },
    { value: 'romance', label: 'Romantik' },
    { value: 'sci-fi', label: 'Bilim Kurgu' }
  ];

  const sortOptions = [
    { value: 'title', label: 'İsme Göre' },
    { value: 'rating', label: 'Puana Göre' },
    { value: 'updated', label: 'Güncelleme Tarihine Göre' },
    { value: 'views', label: 'Görüntülenme Sayısına Göre' }
  ];

  return (
    <div className="min-h-screen cinematic-glow">
      <Navbar />
      
      <main className="section-professional py-8">
        <div className="container-responsive">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50 mb-2">
              Keşfet
            </h1>
            <p className="text-muted">
              Manga, manhwa, manhua ve webtoon koleksiyonunu keşfedin
            </p>
          </div>

          {/* Category Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`btn ${activeTab === category.id ? 'btn-primary' : 'btn-ghost'} flex items-center gap-2`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                    <span className="bg-light-200 dark:bg-dark-700 text-xs px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Manga, webtoon ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="navbar-search-input pl-10 pr-4 py-2"
                />
              </div>
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <Search className="w-4 h-4" />
                Ara
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-4">
              {/* Type Filter Dropdown */}
              <Dropdown
                options={typeOptions}
                value={filterType}
                onChange={setFilterType}
                icon={<Filter className="w-4 h-4" />}
                placeholder="Tip Seçin"
              />

              {/* Genre Filter Dropdown */}
              <Dropdown
                options={genreOptions}
                value={filterGenre}
                onChange={setFilterGenre}
                placeholder="Tür Seçin"
              />

              {/* Sort Dropdown */}
              <Dropdown
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                placeholder="Sıralama"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {sortedContent.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted text-lg">
                    {searchQuery ? 'Arama kriterlerinize uygun içerik bulunamadı.' : 'Henüz içerik eklenmemiş.'}
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'manga-grid' : 'space-y-4'}>
                  {sortedContent.map((item: any) => (
                    <Link
                      key={item._id}
                      href={`/manga/${item.slug || item._id}`}
                      className={viewMode === 'grid' ? 'manga-card block group' : 'card p-4 hover:shadow-lg transition-all duration-300 block'}
                      onMouseEnter={(e) => handleMouseEnter(item, e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div className="aspect-[3/4] overflow-hidden rounded-t-3xl">
                            {item.coverImage ? (
                              <img 
                                src={item.coverImage} 
                                alt={item.title}
                                className="manga-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-light-200 dark:bg-dark-800 flex items-center justify-center text-muted">
                                Kapak
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="manga-title mb-1">
                              {item.title}
                            </h3>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.genres && item.genres.length > 0 ? item.genres.slice(0, 2).map((genre: string) => (
                                <span key={genre} className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                                  {genre}
                                </span>
                              )) : (
                                <span className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                                  Tür Belirtilmemiş
                                </span>
                              )}
                              {item.genres && item.genres.length > 2 && (
                                <span className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                                  +{item.genres.length - 2}
                                </span>
                              )}
                            </div>
                            {item.rating > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <span className="text-yellow-500">★</span>
                                <span className="manga-meta">{item.rating}</span>
                              </div>
                            )}
                            
                            {/* Latest Chapters */}
                            {item.latestChapters && item.latestChapters.length > 0 ? (
                              <div className="mt-3 pt-3 border-t border-light-200 dark:border-dark-700 h-20">
                                <h4 className="text-xs font-medium text-dark-950 dark:text-light-50 mb-2">
                                  Son Bölümler:
                                </h4>
                                <div className="space-y-1 overflow-hidden">
                                  {item.latestChapters.slice(0, 3).map((chapter: any, index: number) => (
                                    <Link
                                      key={chapter._id}
                                      href={`/manga/${item.slug}/chapter/${chapter.slug}`}
                                      className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 truncate"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {chapter.chapterNumber}. bölüm{chapter.title && ` - ${chapter.title}`}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 pt-3 border-t border-light-200 dark:border-dark-700 h-20">
                                <h4 className="text-xs font-medium text-dark-950 dark:text-light-50 mb-2">
                                  Son Bölümler:
                                </h4>
                                <div className="text-xs text-muted">
                                  Henüz bölüm eklenmemiş
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex gap-4">
                          <div className="w-20 h-28 bg-light-200 dark:bg-dark-800 rounded flex-shrink-0">
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
                          <div className="flex-1">
                            <h3 className="font-semibold text-dark-950 dark:text-light-50 mb-1">
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted mb-2">
                              {item.description || 'Açıklama bulunmuyor.'}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted">
                              <span>{item.genres?.join(', ')}</span>
                              {item.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">★</span>
                                  <span>{item.rating}</span>
                                </div>
                              )}
                              {item.viewCount && (
                                <span>{item.viewCount} görüntülenme</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Hover Card */}
      <MangaHoverCard
        manga={hoveredManga}
        isVisible={!!hoveredManga}
        position={hoverPosition}
      />

      <Footer />
    </div>
  );
}