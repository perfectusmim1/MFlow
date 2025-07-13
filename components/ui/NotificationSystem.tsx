'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

function NotificationItem({ 
  notification, 
  onRemove 
}: { 
  notification: Notification; 
  onRemove: (id: string) => void; 
}) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(100);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (notification.persistent || notification.duration === 0) {
      return;
    }

    const duration = notification.duration || 5000;

    // Basit timeout yaklaşımı - daha stabil
    timeoutRef.current = setTimeout(() => {
      handleRemove();
    }, duration);

    // Progress bar animasyonu
    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const newProgress = (remaining / duration) * 100;
      
      setProgress(newProgress);

      if (remaining > 0 && !isRemoving) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification.duration, notification.persistent]);

  const handleRemove = () => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`notification-item notification-${notification.type} ${isRemoving ? 'removing' : ''}`}
      role="alert"
      aria-live="polite"
      onClick={handleRemove}
    >
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        
        <div className="notification-text">
          <div className="notification-title">
            {notification.title}
          </div>
          {notification.message && (
            <div className="notification-message">
              {notification.message}
            </div>
          )}
          {notification.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                notification.action!.onClick();
              }}
              className="mt-2 text-xs font-medium text-current hover:underline focus:outline-none focus:underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!notification.persistent && notification.duration !== 0 && (
        <div 
          className="notification-progress"
          style={{ 
            width: `${progress}%`,
            transition: 'width 100ms linear'
          }}
        />
      )}
    </div>
  );
}

export default function NotificationSystem({ notifications, onRemove }: NotificationSystemProps) {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
} 