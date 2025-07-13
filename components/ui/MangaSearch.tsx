'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchManga {
  _id: string;
  title: string;
  slug?: string;
  coverImage: string;
  author: string[];
  type: string;
  status: string;
}

interface MangaSearchProps {
  className?: string;
}

export default function MangaSearch({ className = '' }: MangaSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchManga[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchManga = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        setSelectedIndex(-1);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/manga?search=${encodeURIComponent(query)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.data || []);
          setShowResults(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Manga search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchManga, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (results.length > 0) {
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (results.length > 0) {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const selectedManga = results[selectedIndex];
          router.push(`/manga/${selectedManga.slug || selectedManga._id}`);
          handleClear();
        } else if (query.trim()) {
          // Arama sayfasına git
          router.push(`/search?search=${encodeURIComponent(query.trim())}`);
          handleClear();
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
      handleClear();
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleMangaSelect = (manga: SearchManga) => {
    setShowResults(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'hiatus':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder={showResults && results.length > 0 ? 
              `${results.length} manga bulundu...` : 
              "Manga, webtoon ara..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setShowResults(true)}
            onKeyDown={handleKeyDown}
            className="navbar-search-input pl-10 pr-10 py-2"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-light-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          )}
          
          {/* Loading indicator inside input */}
          {loading && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg shadow-xl shadow-dark-950/10 dark:shadow-light-50/10 z-50 max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((manga, index) => (
                <Link
                  key={manga._id}
                  href={`/manga/${manga.slug || manga._id}`}
                  onClick={() => handleMangaSelect(manga)}
                  className={`flex items-center gap-3 px-3 py-2 mx-1 rounded transition-all duration-200 ${
                    selectedIndex === index 
                      ? 'bg-blue-100 dark:bg-blue-900/50' 
                      : 'hover:bg-light-100 dark:hover:bg-dark-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-dark-950 dark:text-light-50 truncate text-sm">
                        {manga.title}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded font-medium ${getStatusColor(manga.status)}`}>
                        {manga.type}
                      </span>
                    </div>
                    <div className="text-xs text-light-600 dark:text-dark-400 truncate">
                      {manga.author.join(', ')}
                    </div>
                  </div>
                  <BookOpen className="w-3 h-3 text-light-500 dark:text-dark-500" />
                </Link>
              ))}
              
              {/* Daha fazla sonuç için link */}
              {results.length === 5 && (
                <div className="border-t border-light-200 dark:border-dark-700 mt-1 pt-1">
                  <button
                    onClick={() => {
                      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
                      handleClear();
                    }}
                    className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-light-100 dark:hover:bg-dark-700 transition-colors duration-200 text-center"
                  >
                    Tüm sonuçları gör ({query})
                  </button>
                </div>
              )}
            </div>
          ) : query.trim().length >= 2 && !loading ? (
            <div className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-light-400 dark:text-dark-600 mx-auto mb-2" />
              <p className="text-light-600 dark:text-dark-400 text-sm">Manga bulunamadı</p>
              <p className="text-xs text-light-500 dark:text-dark-500 mt-1">
                "{query}" için sonuç yok
              </p>
              <button
                onClick={() => {
                  router.push(`/search?search=${encodeURIComponent(query.trim())}`);
                  handleClear();
                }}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Arama sayfasında dene
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}