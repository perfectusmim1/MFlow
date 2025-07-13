'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Dropdown from '@/components/ui/Dropdown';
import MangaHoverCard from '@/components/ui/MangaHoverCard';
import { Search, Filter, Grid, List } from 'lucide-react';

export default function WebtoonPage() {
  const [webtoons, setWebtoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('title');
  const [filterGenre, setFilterGenre] = useState('all');
  const [hoveredManga, setHoveredManga] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchWebtoons();
  }, []);

  const fetchWebtoons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manga?type=webtoon');
      if (response.ok) {
        const data = await response.json();
        setWebtoons(data.mangas || []);
      }
    } catch (error) {
      console.error('Webtoon fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=webtoon`);
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

  const filteredWebtoons = webtoons.filter((webtoon: any) => 
    webtoon.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterGenre === 'all' || webtoon.genres?.includes(filterGenre))
  );

  const sortedWebtoons = [...filteredWebtoons].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

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
    { value: 'updated', label: 'Güncelleme Tarihine Göre' }
  ];

  return (
    <div className="min-h-screen cinematic-glow">
      <Navbar />
      
      <main className="section-professional py-8">
        <div className="container-responsive">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50 mb-2">
              Webtoon Koleksiyonu
            </h1>
            <p className="text-muted">
              Renkli webtoon koleksiyonumuzu keşfedin
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Webtoon ara..."
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
              {/* Genre Filter Dropdown */}
              <Dropdown
                options={genreOptions}
                value={filterGenre}
                onChange={setFilterGenre}
                icon={<Filter className="w-4 h-4" />}
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
            <div className={
              viewMode === 'grid' 
                ? "manga-grid" 
                : "space-y-4"
            }>
              {sortedWebtoons.map((webtoon: any) => (
                <Link
                  key={webtoon._id}
                  href={`/manga/${webtoon.slug || webtoon._id}`}
                  className={viewMode === 'grid' ? 'manga-card block group' : 'card p-4 hover:shadow-lg transition-all duration-300 block'}
                  onMouseEnter={(e) => handleMouseEnter(webtoon, e)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-[3/4] overflow-hidden rounded-t-3xl">
                        {webtoon.coverImage ? (
                          <img 
                            src={webtoon.coverImage} 
                            alt={webtoon.title}
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
                          {webtoon.title}
                        </h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {webtoon.genres && webtoon.genres.length > 0 ? webtoon.genres.slice(0, 2).map((genre: string) => (
                            <span key={genre} className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                              {genre}
                            </span>
                          )) : (
                            <span className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                              Tür Belirtilmemiş
                            </span>
                          )}
                          {webtoon.genres && webtoon.genres.length > 2 && (
                            <span className="px-2 py-1 bg-light-200 dark:bg-dark-800 text-xs rounded">
                              +{webtoon.genres.length - 2}
                            </span>
                          )}
                        </div>
                        {webtoon.rating > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-yellow-500">★</span>
                            <span className="manga-meta">{webtoon.rating}</span>
                          </div>
                        )}
                        
                        {/* Latest Chapters */}
                        {webtoon.latestChapters && webtoon.latestChapters.length > 0 ? (
                          <div className="mt-3 pt-3 border-t border-light-200 dark:border-dark-700 h-20">
                            <h4 className="text-xs font-medium text-dark-950 dark:text-light-50 mb-2">
                              Son Bölümler:
                            </h4>
                            <div className="space-y-1 overflow-hidden">
                              {webtoon.latestChapters.slice(0, 3).map((chapter: any, index: number) => (
                                <Link
                                  key={chapter._id}
                                  href={`/manga/${webtoon.slug}/chapter/${chapter.slug}`}
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
                        {webtoon.coverImage ? (
                          <img 
                            src={webtoon.coverImage} 
                            alt={webtoon.title}
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
                          {webtoon.title}
                        </h3>
                        <p className="text-sm text-muted mb-2">
                          {webtoon.description || 'Açıklama bulunmuyor.'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted">
                          <span>{webtoon.genres?.join(', ')}</span>
                          {webtoon.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span>{webtoon.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
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