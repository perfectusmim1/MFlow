'use client';

import { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Lock, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CustomReadingList {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  mangaCount: number;
  mangas: any[];
}

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  mangaId: string;
  mangaTitle: string;
}

export default function AddToListModal({ isOpen, onClose, mangaId, mangaTitle }: AddToListModalProps) {
  const [lists, setLists] = useState<CustomReadingList[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIsPublic, setNewListIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLists();
    }
  }, [isOpen]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/custom-lists', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLists(data.data || []);
      }
    } catch (error) {
      console.error('Lists fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (listId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/user/custom-lists/${listId}/manga`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mangaId,
          action: 'add'
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        fetchLists(); // Refresh lists to update manga counts
      } else {
        toast.error(data.error || 'Liste güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Add to list error:', error);
      toast.error('Liste güncellenirken hata oluştu');
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error('Liste adı gerekli');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/custom-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription,
          isPublic: newListIsPublic
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setNewListName('');
        setNewListDescription('');
        setNewListIsPublic(false);
        setShowCreateForm(false);
        fetchLists();
      } else {
        toast.error(data.error || 'Liste oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Create list error:', error);
      toast.error('Liste oluşturulurken hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const isInList = (list: CustomReadingList) => {
    return list.mangas.some(manga => manga._id === mangaId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-light-200 dark:border-dark-700">
          <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">
            Listeye Ekle
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-light-200 dark:hover:bg-dark-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-light-700 dark:text-dark-400 mb-4">
            "{mangaTitle}" mangasını hangi listeye eklemek istiyorsunuz?
          </p>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {lists.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-light-400 dark:text-dark-600 mx-auto mb-2" />
                  <p className="text-light-700 dark:text-dark-400">
                    Henüz liste oluşturmamışsınız
                  </p>
                </div>
              ) : (
                lists.map((list) => (
                  <div
                    key={list._id}
                    className="flex items-center justify-between p-3 border border-light-200 dark:border-dark-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-dark-950 dark:text-light-50">
                          {list.name}
                        </h4>
                        {list.isPublic ? (
                          <Globe className="w-4 h-4 text-green-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-light-600 dark:text-dark-400" />
                        )}
                      </div>
                      <p className="text-sm text-light-700 dark:text-dark-400">
                        {list.mangaCount} manga
                      </p>
                      {list.description && (
                        <p className="text-xs text-light-600 dark:text-dark-500 mt-1">
                          {list.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToList(list._id)}
                      disabled={isInList(list)}
                      className={`px-3 py-1 text-sm rounded ${
                        isInList(list)
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isInList(list) ? 'Eklendi' : 'Ekle'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-light-200 dark:border-dark-700">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-light-300 dark:border-dark-600 rounded-lg text-light-700 dark:text-dark-400 hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Yeni Liste Oluştur
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Liste adı"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-3 py-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-950 dark:text-light-50"
                />
                <textarea
                  placeholder="Açıklama (isteğe bağlı)"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-950 dark:text-light-50 resize-none"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newListIsPublic}
                    onChange={(e) => setNewListIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-light-700 dark:text-dark-400">
                    Herkese açık liste
                  </span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-3 py-2 border border-light-300 dark:border-dark-600 rounded-lg text-light-700 dark:text-dark-400 hover:bg-light-100 dark:hover:bg-dark-800"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleCreateList}
                    disabled={creating || !newListName.trim()}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-light-400 dark:disabled:bg-dark-600 text-white rounded-lg"
                  >
                    {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}