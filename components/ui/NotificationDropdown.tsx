'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export interface StoredNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  timestamp: number;
  read?: boolean;
}

interface NotificationDropdownProps {
  notifications: StoredNotification[];
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationDropdown({ 
  notifications, 
  onMarkAsRead, 
  onRemove, 
  onClearAll 
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen && !isClosing) {
          handleClose();
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isClosing]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 150);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}g`;
    if (hours > 0) return `${hours}s`;
    if (minutes > 0) return `${minutes}dk`;
    return 'şimdi';
  };

  const handleNotificationClick = (notification: StoredNotification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative btn-ghost p-2 rounded-xl nav-link"
        title="Bildirimler"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`notification-dropdown ${isClosing ? 'closing' : ''}`}>
          <div className="p-4 border-b border-light-200 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-dark-950 dark:text-light-50">
                Bildirimler
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Temizle
                </button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-muted mt-1">
                {unreadCount} okunmamış bildirim
              </p>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                <p className="text-muted text-sm">Henüz bildiriminiz yok</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative px-4 py-3 hover:bg-light-50 dark:hover:bg-dark-800 cursor-pointer border-l-4 ${
                      notification.read 
                        ? 'border-transparent opacity-70' 
                        : notification.type === 'success' 
                          ? 'border-green-500' 
                          : notification.type === 'error'
                            ? 'border-red-500'
                            : notification.type === 'warning'
                              ? 'border-yellow-500'
                              : 'border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-dark-950 dark:text-light-50 text-sm">
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(notification.id);
                            }}
                            className="text-muted hover:text-red-500 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {notification.message && (
                          <p className="text-muted text-xs mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-muted text-xs mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="absolute top-3 right-12 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 