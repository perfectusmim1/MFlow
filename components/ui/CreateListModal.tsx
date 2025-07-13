'use client';

import { useState } from 'react';
import { X, Plus, Globe, Lock } from 'lucide-react';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListCreated: () => void;
}

export default function CreateListModal({ isOpen, onClose, onListCreated }: CreateListModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Liste adı gereklidir');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Giriş yapmanız gerekiyor');
        return;
      }

      const response = await fetch('/api/user/custom-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Liste oluşturulamadı');
      }

      // Reset form
      setName('');
      setDescription('');
      setIsPublic(false);
      
      onListCreated();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPublic(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-light-200 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-dark-950 dark:text-light-50">
            Yeni Liste Oluştur
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-light-200 dark:hover:bg-dark-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
              Liste Adı *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-950 dark:text-light-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: Favori Manga'larım"
              maxLength={50}
              required
            />
            <div className="text-xs text-light-600 dark:text-dark-400 mt-1">
              {name.length}/50 karakter
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-950 dark:text-light-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Liste hakkında kısa bir açıklama..."
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-light-600 dark:text-dark-400 mt-1">
              {description.length}/200 karakter
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white dark:bg-dark-800 border-light-300 dark:border-dark-600 rounded focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="w-4 h-4 text-green-600" />
                ) : (
                  <Lock className="w-4 h-4 text-light-600 dark:text-dark-400" />
                )}
                <span className="text-sm text-dark-950 dark:text-light-50">
                  {isPublic ? 'Herkese açık liste' : 'Özel liste'}
                </span>
              </div>
            </label>
            <p className="text-xs text-light-600 dark:text-dark-400 mt-1 ml-7">
              {isPublic 
                ? 'Bu liste diğer kullanıcılar tarafından görülebilir'
                : 'Bu liste sadece size özel olacak'
              }
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-light-300 dark:border-dark-600 text-dark-950 dark:text-light-50 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 transition-colors"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loading ? 'Oluşturuluyor...' : 'Liste Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}