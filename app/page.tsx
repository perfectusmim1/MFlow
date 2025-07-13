import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import FeaturedManga from '@/components/home/FeaturedManga';
import LatestChapters from '@/components/home/LatestChapters';
import TrendingManga from '@/components/home/TrendingManga';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  return (
    <div className="min-h-screen cinematic-glow">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative hero-cinematic">
          <Hero />
        </section>

        {/* Trending Manga */}
        <section className="py-16 section-professional">
          <div className="container mx-auto px-4">
            <Suspense fallback={<LoadingSpinner />}>
              <TrendingManga />
            </Suspense>
          </div>
        </section>

        {/* Featured Content */}
        <section className="py-16 section-alternate">
          <div className="container mx-auto px-4">
            <Suspense fallback={<LoadingSpinner />}>
              <FeaturedManga />
            </Suspense>
          </div>
        </section>

        {/* Latest Chapters */}
        <section className="py-16 section-alternate">
          <div className="container mx-auto px-4">
            <Suspense fallback={<LoadingSpinner />}>
              <LatestChapters />
            </Suspense>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}