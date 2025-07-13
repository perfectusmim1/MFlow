'use client';

import { Suspense } from 'react';
import SearchPageContent from './SearchPageContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}