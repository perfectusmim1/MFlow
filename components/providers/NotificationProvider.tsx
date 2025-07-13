'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import NotificationSystem, { Notification } from '@/components/ui/NotificationSystem';
import { StoredNotification } from '@/components/ui/NotificationDropdown';
import { useAuth } from '@/components/providers/AuthProvider';

interface NotificationContextType {
  // Toast bildirimleri (geçici)
  showNotification: (notification: Omit<Notification, 'id'>, notificationType?: string) => void;
  showSuccess: (title: string, message?: string, options?: Partial<Notification>) => void;
  showError: (title: string, message?: string, options?: Partial<Notification>) => void;
  showWarning: (title: string, message?: string, options?: Partial<Notification>) => void;
  showInfo: (title: string, message?: string, options?: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Özel bildirim türleri
  showNewChapterNotification: (title: string, message?: string, options?: Partial<Notification>) => void;
  showFavoriteNotification: (title: string, message?: string, options?: Partial<Notification>) => void;
  showSystemNotification: (title: string, message?: string, options?: Partial<Notification>) => void;
  
  // Kalıcı bildirimler (dropdown için)
  storedNotifications: StoredNotification[];
  addStoredNotification: (notification: Omit<StoredNotification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  removeStoredNotification: (id: string) => void;
  clearAllStored: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [storedNotifications, setStoredNotifications] = useState<StoredNotification[]>([]);
  const { user } = useAuth();

  // Kullanıcı giriş yaptığında bildirimlerini yükle
  useEffect(() => {
    if (user) {
      loadStoredNotifications();
    } else {
      setStoredNotifications([]);
    }
  }, [user]);

  const loadStoredNotifications = () => {
    if (!user) return;
    
    try {
      const stored = localStorage.getItem(`notifications_${user._id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Son 50 bildirimi al ve zamana göre sırala
        const sorted = parsed
          .sort((a: StoredNotification, b: StoredNotification) => b.timestamp - a.timestamp)
          .slice(0, 50);
        setStoredNotifications(sorted);
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    }
  };

  const saveStoredNotifications = (notifications: StoredNotification[]) => {
    if (!user) return;
    
    try {
      localStorage.setItem(`notifications_${user._id}`, JSON.stringify(notifications));
    } catch (error) {
      console.error('Bildirimler kaydedilirken hata:', error);
    }
  };

  // Bildirim ayarlarını kontrol et
  const shouldShowNotification = (type: string): boolean => {
    if (!user) return true;
    
    // Eğer kullanıcının ayarları yoksa varsayılan olarak true döndür
    if (!user.settings?.notifications) return true;
    
    const settings = user.settings.notifications;
    switch (type) {
      case 'newChapter':
        return settings.newChapters !== false; // undefined ise true kabul et
      case 'favorite':
        return settings.favorites !== false;
      case 'system':
        return settings.system !== false;
      default:
        return true;
    }
  };

  // Toast bildirimleri
  const showNotification = (notification: Omit<Notification, 'id'>, notificationType?: string) => {
    // Bildirim ayarlarını kontrol et
    if (notificationType && !shouldShowNotification(notificationType)) {
      return; // Bildirim ayarları kapalıysa gösterme
    }

    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Eğer sistem bildirimi değilse ve persistent değilse, kalıcı bildirim olarak da kaydet
    // Tema değişikliği ve çıkış gibi geçici bildirimler kalıcı olarak kaydedilmez
    if (!notification.persistent && user && notificationType && 
        !['theme', 'logout', 'search'].includes(notificationType)) {
      const storedNotification: StoredNotification = {
        id: id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: Date.now(),
        read: false
      };
      
      addStoredNotification(storedNotification);
    }
  };

  const showSuccess = (title: string, message?: string, options?: Partial<Notification>) => {
    showNotification({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options,
    });
  };

  const showError = (title: string, message?: string, options?: Partial<Notification>) => {
    showNotification({
      type: 'error',
      title,
      message,
      duration: 6000,
      ...options,
    });
  };

  const showWarning = (title: string, message?: string, options?: Partial<Notification>) => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options,
    });
  };

  const showInfo = (title: string, message?: string, options?: Partial<Notification>) => {
    showNotification({
      type: 'info',
      title,
      message,
      duration: 4000,
      ...options,
    });
  };

  // Özel bildirim türleri için yardımcı fonksiyonlar
  const showNewChapterNotification = (title: string, message?: string, options?: Partial<Notification>) => {
    showNotification({
      type: 'info',
      title,
      message,
      duration: 5000,
      ...options,
    }, 'newChapter');
  };

  const showFavoriteNotification = (title: string, message?: string, options?: Partial<Notification>) => {
    showNotification({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options,
    }, 'favorite');
  };

  const showSystemNotification = (title: string, message?: string, options?: Partial<Notification>) => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration: 6000,
      ...options,
    }, 'system');
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Kalıcı bildirimler
  const addStoredNotification = (notification: Omit<StoredNotification, 'id' | 'timestamp'> | StoredNotification) => {
    if (!user) return;

    const newNotification: StoredNotification = {
      ...notification,
      id: 'id' in notification ? notification.id : Math.random().toString(36).substr(2, 9),
      timestamp: 'timestamp' in notification ? notification.timestamp : Date.now(),
    };

    setStoredNotifications((prev) => {
      const updated = [newNotification, ...prev].slice(0, 50); // Son 50 bildirimi tut
      saveStoredNotifications(updated);
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setStoredNotifications((prev) => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveStoredNotifications(updated);
      return updated;
    });
  };

  const removeStoredNotification = (id: string) => {
    setStoredNotifications((prev) => {
      const updated = prev.filter(n => n.id !== id);
      saveStoredNotifications(updated);
      return updated;
    });
  };

  const clearAllStored = () => {
    setStoredNotifications([]);
    if (user) {
      localStorage.removeItem(`notifications_${user._id}`);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
        clearAll,
        storedNotifications,
        addStoredNotification,
        markAsRead,
        removeStoredNotification,
        clearAllStored,
        showNewChapterNotification,
        showFavoriteNotification,
        showSystemNotification,
      }}
    >
      {children}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
}