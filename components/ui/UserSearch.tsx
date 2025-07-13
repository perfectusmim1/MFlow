'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, User, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface SearchUser {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
}

interface UserSearchProps {
  className?: string;
}

export default function UserSearch({ className = '' }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        setSelectedIndex(-1);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.data || []);
          setShowResults(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('User search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const selectedUser = results[selectedIndex];
          window.location.href = `/profile/${selectedUser.username}`;
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleUserSelect = (user: SearchUser) => {
    setShowResults(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={showResults && results.length > 0 ? 
            `${results.length} kullanıcı bulundu...` : 
            "Kullanıcı ara..."
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

      {/* Dropdown Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg shadow-xl shadow-dark-950/10 dark:shadow-light-50/10 z-50 max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((user, index) => (
                <Link
                  key={user._id}
                  href={`/profile/${user.username}`}
                  onClick={() => handleUserSelect(user)}
                  className={`flex items-center gap-3 px-3 py-2 mx-1 rounded transition-all duration-200 ${
                    selectedIndex === index 
                      ? 'bg-blue-100 dark:bg-blue-900/50' 
                      : 'hover:bg-light-100 dark:hover:bg-dark-700'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dark-950 dark:text-light-50 truncate text-sm">
                        {user.username}
                      </span>
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <User className="w-3 h-3 text-light-500 dark:text-dark-500" />
                </Link>
              ))}
            </div>
          ) : query.trim().length >= 2 && !loading ? (
            <div className="p-4 text-center">
              <User className="w-8 h-8 text-light-400 dark:text-dark-600 mx-auto mb-2" />
              <p className="text-light-600 dark:text-dark-400 text-sm">Kullanıcı bulunamadı</p>
              <p className="text-xs text-light-500 dark:text-dark-500 mt-1">
                "{query}" için sonuç yok
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}