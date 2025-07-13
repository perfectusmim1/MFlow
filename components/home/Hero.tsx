'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNotification } from '@/components/providers/NotificationProvider';

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('');
  const { showSuccess, showInfo } = useNotification();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      showSuccess(
        'Arama başlatıldı!', 
        `"${searchQuery}" için arama yapılıyor...`,
        {
          action: {
            label: 'Sonuçları Gör',
            onClick: () => {
              window.location.href = `/search?search=${encodeURIComponent(searchQuery.trim())}`;
            }
          }
        }
      );
      
      // Navigate after showing notification
      setTimeout(() => {
        window.location.href = `/search?search=${encodeURIComponent(searchQuery.trim())}`;
      }, 1500);
    } else {
      showInfo('Arama yapmak için bir şeyler yazın', 'Favori manganızı aramaya başlayın');
    }
  };

  return (
    <section className="py-20 bg-light-50 dark:bg-dark-950">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-6 leading-tight">
            Modern Manga <br />
            <span className="text-green-500">Okuma Deneyimi</span>
          </h1>
          
          <p className="text-xl text-light-700 dark:text-dark-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            En popüler manga, manhwa, manhua ve webtoon'ları yüksek kalitede okuyun. 
            Auto translate özelliği ile tüm dillerde okuma keyfi.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-12 max-w-2xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Favori manganızı arayın..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-20 py-5 text-lg bg-light-50 border-2 border-light-300 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:border-green-500 focus:shadow-xl focus:shadow-green-500/25 focus:scale-[1.02] placeholder-light-600 dark:bg-dark-800 dark:border-dark-600 dark:text-light-50 dark:placeholder-dark-400 dark:focus:border-green-400 dark:focus:shadow-xl dark:focus:shadow-green-400/25 hover:border-light-400 dark:hover:border-dark-500 hover:scale-[1.01] group-hover:shadow-lg transform"
              />
              <button 
                type="submit" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg hover:shadow-green-500/30 focus:outline-none focus:ring-4 focus:ring-green-500/20 active:scale-95"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>



          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse" className="btn btn-primary btn-lg">
              Keşfetmeye Başla
            </Link>
            <Link href="/trending" className="btn btn-outline btn-lg">
              Trend Olan
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 