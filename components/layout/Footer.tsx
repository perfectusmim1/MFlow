'use client';

import Link from 'next/link';
import { BookOpen, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-light-50 dark:bg-dark-950 text-light-700 dark:text-light-300 py-12 border-t border-light-300 dark:border-dark-700 section-glow footer-cinematic">
      <div className="container mx-auto px-4">
        <div>
          <div className="flex flex-col md:flex-row items-center justify-center">
            <p className="text-sm text-muted">
              © 2025 MangaBreaker. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 