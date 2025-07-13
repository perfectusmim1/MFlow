'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProfileRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Kullanıcı giriş yapmışsa kendi profil sayfasına yönlendir
        router.replace(`/profile/${user.username}`);
      } else {
        // Giriş yapmamışsa login sayfasına yönlendir
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-light-50 dark:bg-dark-950 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}