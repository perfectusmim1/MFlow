'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Settings,
  Users,
  BarChart3,
  Menu,
  X,
  LogOut,
  Home
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/providers/AuthProvider';

const sidebarItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: BarChart3
  },
  {
    label: 'Manga Yönetimi',
    href: '/admin/manga',
    icon: BookOpen
  },
  {
    label: 'Chapter Yönetimi',
    href: '/admin/chapters',
    icon: FileText
  },
  {
    label: 'Kullanıcılar',
    href: '/admin/users',
    icon: Users
  },
  {
    label: 'Ayarlar',
    href: '/admin/settings',
    icon: Settings
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        toast.error('Lütfen giriş yapın');
        return;
      }
      
      if (!isAdmin) {
        router.push('/');
        toast.error('Admin yetkisi gereklidir');
        return;
      }
    }
  }, [user, loading, isAdmin, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Çıkış yapıldı');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-100 dark:bg-dark-900 flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="admin-layout">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 admin-sidebar transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-light-200 dark:border-dark-800">
            <div className="flex items-center justify-between">
              <Link href="/admin" className="text-xl font-bold text-gradient">
                Admin Panel
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-dark-950 text-light-50 dark:bg-light-50 dark:text-dark-950' 
                      : 'text-dark-700 hover:bg-light-100 dark:text-light-300 dark:hover:bg-dark-800'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-light-200 dark:border-dark-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-dark-950 dark:bg-light-50 rounded-full flex items-center justify-center">
                  <span className="text-light-50 dark:text-dark-950 text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-950 dark:text-light-50 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-light-700 dark:text-dark-400">
                    Admin
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link
                href="/"
                className="flex-1 btn btn-ghost btn-sm"
                title="Ana Siteye Dön"
              >
                <Home className="w-4 h-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 btn btn-ghost btn-sm"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-light-50 dark:bg-dark-950 border-b border-light-200 dark:border-dark-800 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h1 className="text-xl font-semibold text-dark-950 dark:text-light-50">
              {sidebarItems.find(item => item.href === pathname)?.label || 'Admin Panel'}
            </h1>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-light-700 dark:text-dark-400">
                Hoş geldin, {user.username}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content p-6">
          {children}
        </main>
      </div>
    </div>
  );
}