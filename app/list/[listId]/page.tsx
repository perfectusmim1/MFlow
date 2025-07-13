'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Heart, 
  Eye, 
  Globe,
  Lock,
  ArrowLeft,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/providers/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

interface CustomList {
  _id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdBy: {
    _id: string;
    username: string;
  };
  mangas: Array<{
    _id: string;
    title: string;
    coverImage: string;
    slug: string;
    author: string;
    status: string;
  }>;
  createdAt: string;
}

export default function CustomListPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [list, setList] = useState<CustomList | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  const listId = params.listId as string;

  useEffect(() => {
    if (listId) {
      fetchList();
    }
  }, [listId]);

  const fetchList = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/user/custom-lists/${listId}`, {
        headers
      });

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setList(data.data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching list:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const removeMangaFromList = async (mangaId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/user/custom-lists/${listId}/manga`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mangaId, action: 'remove' }),
      });

      if (response.ok) {
        // Liste güncellendi, yeniden fetch et
        fetchList();
        toast.success('Manga listeden kaldırıldı');
      } else {
        toast.error('Manga kaldırılırken hata oluştu');
      }
    } catch (error) {
      console.error('Error removing manga from list:', error);
      toast.error('Manga kaldırılırken hata oluştu');
    }
  };

  const handleEditList = () => {
    if (list) {
      setEditForm({
        name: list.name,
        description: list.description || '',
        isPublic: list.isPublic
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateList = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/user/custom-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        fetchList();
        setShowEditModal(false);
        toast.success('Liste başarıyla güncellendi');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Liste güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating list:', error);
      toast.error('Liste güncellenirken hata oluştu');
    }
  };

  const handleDeleteList = async () => {
    if (!confirm('Bu listeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/user/custom-lists/${listId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Liste başarıyla silindi');
        router.push('/library');
      } else {
        toast.error('Liste silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Liste silinirken hata oluştu');
    }
  };

  const isOwner = user && list && user._id === list.createdBy._id;

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !list) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50 mb-4">
              Liste Bulunamadı
            </h1>
            <p className="text-light-700 dark:text-dark-400 mb-6">
              Aradığınız liste mevcut değil veya erişim izniniz yok.
            </p>
            <Link href="/library" className="btn btn-primary">
              Kütüphaneye Dön
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-light-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-light-50 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </button>

          {/* List Header */}
          <div className="card p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50">
                    {list.name}
                  </h1>
                  <div className="relative group">
                    {list.isPublic ? (
                      <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-950 text-light-50 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {list.isPublic ? 'Herkese açık' : 'Özel'}
                    </div>
                  </div>
                </div>
                
                {list.description && (
                  <p className="text-light-700 dark:text-dark-400 mb-4">
                    {list.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-light-600 dark:text-dark-500">
                  <span>
                    Oluşturan: <Link href={`/profile/${list.createdBy.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {list.createdBy.username}
                    </Link>
                  </span>
                  <span>•</span>
                  <span>{list.mangas.length} manga</span>
                  <span>•</span>
                  <span>{new Date(list.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleEditList}
                    className="btn btn-outline flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button 
                    onClick={handleDeleteList}
                    className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manga Grid */}
          {list.mangas.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {list.mangas.map((manga) => (
                <div key={manga._id} className="group relative">
                  <Link href={`/manga/${manga.slug}`} className="block">
                    <div className="card overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-[3/4] relative">
                        <img
                          src={manga.coverImage}
                          alt={manga.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-dark-950 dark:text-light-50 mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {manga.title}
                        </h3>
                        <p className="text-sm text-light-700 dark:text-dark-400 mb-1">
                          {manga.author}
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          manga.status === 'ongoing' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        }`}>
                          {manga.status === 'ongoing' ? 'Devam Ediyor' : 'Tamamlandı'}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Remove Button (only for list owner) */}
                  {isOwner && (
                    <button
                      onClick={() => removeMangaFromList(manga._id)}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <div className="relative group/tooltip">
                        <Trash2 className="w-4 h-4" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-950 text-light-50 text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                          Listeden Kaldır
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <BookOpen className="w-16 h-16 text-light-400 dark:text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-2">
                Liste Boş
              </h3>
              <p className="text-light-700 dark:text-dark-400 mb-6">
                Bu listede henüz manga bulunmuyor.
              </p>
              {isOwner && (
                <Link href="/discover" className="btn btn-primary">
                  Manga Keşfet
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-4">
              Liste Düzenle
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                  Liste Adı
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-light-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-950 dark:text-light-50"
                  placeholder="Liste adı girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                  Açıklama (İsteğe bağlı)
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-light-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-950 dark:text-light-50"
                  placeholder="Liste açıklaması girin"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm({...editForm, isPublic: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-dark-950 dark:text-light-50">
                  Herkese açık liste
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-light-300 dark:border-dark-700 text-dark-950 dark:text-light-50 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleUpdateList}
                disabled={!editForm.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}