'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useNotification } from '@/components/providers/NotificationProvider';
import NotificationDropdown from '@/components/ui/NotificationDropdown';
import UserSearch from '@/components/ui/UserSearch';
import MangaSearch from '@/components/ui/MangaSearch';
import { 
  Search, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User,
  Settings,
  LogOut,
  BookOpen,
  Star,
  History,
  Shield
} from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUserMenuClosing, setIsUserMenuClosing] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const { user, logout, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const { 
    showSuccess, 
    showInfo, 
    storedNotifications, 
    markAsRead, 
    removeStoredNotification, 
    clearAllStored,
    showError,
    showWarning,
    showNewChapterNotification,
    showFavoriteNotification,
    showSystemNotification
  } = useNotification();
  const router = useRouter();

  const handleThemeChange = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    showSuccess(
      'Tema değiştirildi!',
      `${newTheme === 'dark' ? 'Karanlık' : 'Aydınlık'} tema aktif edildi`
    );
  };

  const handleLogout = () => {
    logout();
    showSuccess(
      'Başarıyla çıkış yapıldı',
      'Görüşmek üzere! 👋'
    );
  };

  const handleUserMenuClose = () => {
    setIsUserMenuClosing(true);
    setTimeout(() => {
      setIsUserMenuOpen(false);
      setIsUserMenuClosing(false);
    }, 150);
  };

  const getThemeIcon = () => {
    return theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        if (isUserMenuOpen && !isUserMenuClosing) {
          handleUserMenuClose();
        }
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isUserMenuClosing]);

  return (
    <nav className="navbar sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="MFlow Logo" 
              className="w-16 h-16 object-contain"
            />
            <span className="text-xl font-bold text-gradient">
              MFlow
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 justify-center max-w-2xl mx-8 ml-12 gap-4">
            {/* Manga Search */}
            <div className="flex-1 max-w-md">
              <MangaSearch />
            </div>
            
            {/* User Search */}
            <div className="flex-shrink-0">
              <UserSearch />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/manga" className="btn-ghost rounded-2xl nav-link">
              Manga
            </Link>
            <Link href="/webtoon" className="btn-ghost rounded-2xl nav-link">
              Webtoon
            </Link>
            <Link href="/browse" className="btn-ghost rounded-2xl nav-link">
              Keşfet
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={handleThemeChange}
              className="theme-toggle"
              title={`Tema: ${theme}`}
            >
              {getThemeIcon()}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* Notification Dropdown */}
                <NotificationDropdown
                  notifications={storedNotifications}
                  onMarkAsRead={markAsRead}
                  onRemove={removeStoredNotification}
                  onClearAll={clearAllStored}
                />

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      if (isUserMenuOpen) {
                        handleUserMenuClose();
                      } else {
                        setIsUserMenuOpen(true);
                      }
                    }}
                    className="btn-ghost flex items-center gap-2 nav-link"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={`${user.username} profil fotoğrafı`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    {user.username}
                  </button>

                  {isUserMenuOpen && (
                    <div className={`dropdown-menu ${isUserMenuClosing ? 'closing' : ''}`}>
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-light-200 dark:border-dark-700">
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted">{user.email}</p>
                        </div>
                        
                        <Link href="/profile" className="dropdown-item">
                          <User className="w-4 h-4" />
                          Profil
                        </Link>
                        
                        <Link href="/library" className="dropdown-item">
                          <Star className="w-4 h-4" />
                          Kütüphane
                        </Link>
                        
                        <Link href="/history" className="dropdown-item">
                          <History className="w-4 h-4" />
                          Geçmiş
                        </Link>
                        
                        <Link href="/settings" className="dropdown-item">
                          <Settings className="w-4 h-4" />
                          Ayarlar
                        </Link>
                        
                        {isAdmin && (
                          <Link href="/admin" className="dropdown-item">
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        
                        <button
                          onClick={handleLogout}
                          className="dropdown-item w-full text-left text-red-600 dark:text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost rounded-2xl nav-link">
                  Giriş
                </Link>
                <Link href="/register" className="btn-primary rounded-2xl nav-link">
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden btn-ghost p-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-light-200 dark:border-dark-700">
            {/* Mobile Search */}
            <div className="mb-4">
              <MangaSearch />
            </div>

            {/* Mobile Navigation */}
            <div className="space-y-2">
              <Link href="/manga" className="block px-3 py-2 hover-bg rounded-2xl">
                Manga
              </Link>
              <Link href="/webtoon" className="block px-3 py-2 hover-bg rounded-2xl">
                Webtoon
              </Link>
              <Link href="/browse" className="block px-3 py-2 hover-bg rounded-2xl">
                Keşfet
              </Link>

              {user ? (
                <>
                  <div className="border-t border-light-200 dark:border-dark-700 pt-2 mt-2">
                    {/* Mobil bildirimler */}
                    <div className="px-3 py-2 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Bildirimler</span>
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {storedNotifications.filter(n => !n.read).length}
                        </span>
                      </div>
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                        {storedNotifications.slice(0, 3).map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => {
                              if (!notification.read) markAsRead(notification.id);
                            }}
                            className={`text-xs p-2 rounded-lg border-l-2 ${
                              notification.read 
                                ? 'border-gray-300 opacity-70' 
                                : notification.type === 'success' 
                                  ? 'border-green-500' 
                                  : notification.type === 'error'
                                    ? 'border-red-500'
                                    : notification.type === 'warning'
                                      ? 'border-yellow-500'
                                      : 'border-blue-500'
                            }`}
                          >
                            <div className="font-medium">{notification.title}</div>
                            {notification.message && (
                              <div className="text-muted mt-1">{notification.message}</div>
                            )}
                          </div>
                        ))}
                        {storedNotifications.length === 0 && (
                          <div className="text-muted text-xs text-center py-2">
                            Henüz bildiriminiz yok
                          </div>
                        )}
                      </div>
                      {storedNotifications.length > 0 && (
                        <button
                          onClick={clearAllStored}
                          className="text-xs text-red-600 mt-2"
                        >
                          Tümünü Temizle
                        </button>
                      )}
                    </div>

                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 hover-bg rounded-2xl">
                      <User className="w-4 h-4" />
                      Profil
                    </Link>
                    <Link href="/library" className="flex items-center gap-2 px-3 py-2 hover-bg rounded-2xl">
                      <BookOpen className="w-4 h-4" />
                      Kütüphanem
                    </Link>
                    <Link href="/history" className="flex items-center gap-2 px-3 py-2 hover-bg rounded-2xl">
                      <BookOpen className="w-4 h-4" />
                      Geçmiş
                    </Link>
                    <Link href="/settings" className="flex items-center gap-2 px-3 py-2 hover-bg rounded-2xl">
                      <Settings className="w-4 h-4" />
                      Ayarlar
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-2 px-3 py-2 hover-bg rounded">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 hover-bg rounded-2xl w-full text-left text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-light-200 dark:border-dark-700 pt-2 mt-2">
                  <Link href="/login" className="block px-3 py-2 hover-bg rounded-2xl">
                    Giriş Yap
                  </Link>
                  <Link href="/register" className="block px-3 py-2 hover-bg rounded-2xl">
                    Kayıt Ol
                  </Link>
                </div>
              )}

              <div className="border-t border-light-200 dark:border-dark-700 pt-2 mt-2">
                <button
                  onClick={handleThemeChange}
                  className="flex items-center gap-2 px-3 py-2 hover-bg rounded-2xl w-full text-left"
                >
                  {getThemeIcon()}
                  Tema: {theme === 'dark' ? 'Karanlık' : 'Aydınlık'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}