'use client';

import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  Calendar,
  Star,
  Download,
  Upload,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/components/providers/NotificationProvider';
import Dropdown from '@/components/ui/Dropdown';

interface Manga {
  _id: string;
  title: string;
  slug?: string;
  alternativeTitles: string[];
  author: string[];
  artist: string[];
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  genres: string[];
  description: string;
  coverImage: string;
  type: 'manga' | 'manhwa' | 'manhua' | 'webtoon';
  rating: number;
  viewCount: number;
  totalChapters: number;
  createdAt: string;
  updatedAt: string;
  isPrivate?: boolean;
}

interface Filters {
  search: string;
  type: string;
  status: string;
  genre: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function AdminMangaPage() {
  const [manga, setManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: '',
    status: '',
    genre: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedManga, setSelectedManga] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters.search, filters.type, filters.status, filters.genre, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchManga();
  }, [filters, pagination.page]);

  const fetchManga = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        admin: 'true' // Admin paneli için özel parametre
      });

      // Filtreleri ekle
      if (filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.genre) {
        params.append('genre', filters.genre);
      }
      if (filters.sortBy) {
        params.append('sort', filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append('order', filters.sortOrder);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/manga?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setManga(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Manga fetch error:', error);
      showError('Manga listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchManga();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" adlı mangayı silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/manga/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Manga başarıyla silindi');
        fetchManga();
      } else {
        showError(data.message || 'Manga silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showError('Silme işlemi sırasında hata oluştu');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedManga.length === 0) return;
    
    if (!confirm(`${selectedManga.length} mangayı silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const promises = selectedManga.map(id => 
        fetch(`/api/admin/manga/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount === selectedManga.length) {
        showSuccess(`${selectedManga.length} manga silindi`);
      } else {
        showSuccess(`${successCount}/${selectedManga.length} manga silindi`);
      }
      
      setSelectedManga([]);
      fetchManga();
    } catch (error) {
      console.error('Bulk delete error:', error);
      showError('Toplu silme işlemi sırasında hata oluştu');
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/manga/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manga-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('Manga listesi dışa aktarıldı');
      } else {
        showError('Dışa aktarma işlemi başarısız');
      }
    } catch (error) {
      console.error('Export error:', error);
      showError('Dışa aktarma sırasında hata oluştu');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/manga/import', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          showSuccess(`${data.imported || 0} manga içe aktarıldı`);
          fetchManga();
        } else {
          showError(data.message || 'İçe aktarma işlemi başarısız');
        }
      } catch (error) {
        console.error('Import error:', error);
        showError('İçe aktarma sırasında hata oluştu');
      }
    };
    input.click();
  };

  const statusLabels = {
    ongoing: 'Devam Ediyor',
    completed: 'Tamamlandı',
    hiatus: 'Ara Verildi',
    cancelled: 'İptal Edildi'
  };

  const typeLabels = {
    manga: 'Manga',
    manhwa: 'Manhwa',
    manhua: 'Manhua',
    webtoon: 'Webtoon'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      case 'hiatus': return 'status-hiatus';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-badge';
    }
  };

  if (loading && manga.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
            Manga Yönetimi
          </h1>
          <p className="text-light-700 dark:text-dark-400">
            Toplam {pagination.total} manga
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedManga.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger btn-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {selectedManga.length} Seçili Sil
            </button>
          )}
          
          <button 
            onClick={handleImport}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            İçe Aktar
          </button>
          
          <button 
            onClick={handleExport}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Dışa Aktar
          </button>
          
          <Link href="/admin/manga/create" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni Manga
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Manga adı, yazar, türü ara..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="navbar-search-input pl-10 pr-10"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-light-200 dark:hover:bg-dark-700 rounded transition-all duration-200"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </button>
                )}
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-ghost flex items-center gap-2 rounded-2xl ${showFilters ? 'bg-light-200 dark:bg-dark-700' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filtreler
            </button>
            
            <button type="submit" className="btn btn-primary rounded-2xl flex items-center gap-2">
              <Search className="w-4 h-4" />
              Ara
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-light-200 dark:border-dark-700">
              <Dropdown
                options={[
                  { value: '', label: 'Tüm Türler' },
                  { value: 'manga', label: 'Manga' },
                  { value: 'manhwa', label: 'Manhwa' },
                  { value: 'manhua', label: 'Manhua' },
                  { value: 'webtoon', label: 'Webtoon' }
                ]}
                value={filters.type}
                onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                placeholder="Tüm Türler"
                buttonClassName="w-full justify-between rounded-2xl"
                menuClassName="w-full"
              />

              <Dropdown
                options={[
                  { value: '', label: 'Tüm Durumlar' },
                  { value: 'ongoing', label: 'Devam Ediyor' },
                  { value: 'completed', label: 'Tamamlandı' },
                  { value: 'hiatus', label: 'Ara Verildi' },
                  { value: 'cancelled', label: 'İptal Edildi' }
                ]}
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                placeholder="Tüm Durumlar"
                buttonClassName="w-full justify-between rounded-2xl"
                menuClassName="w-full"
              />

              <Dropdown
                options={[
                  { value: '', label: 'Tüm Türler' },
                  { value: 'Action', label: 'Aksiyon' },
                  { value: 'Adventure', label: 'Macera' },
                  { value: 'Comedy', label: 'Komedi' },
                  { value: 'Drama', label: 'Drama' },
                  { value: 'Fantasy', label: 'Fantastik' },
                  { value: 'Horror', label: 'Korku' },
                  { value: 'Mystery', label: 'Gizem' },
                  { value: 'Romance', label: 'Romantik' },
                  { value: 'Sci-Fi', label: 'Bilim Kurgu' },
                  { value: 'Slice of Life', label: 'Yaşam Dilimi' },
                  { value: 'Sports', label: 'Spor' },
                  { value: 'Supernatural', label: 'Doğaüstü' },
                  { value: 'Thriller', label: 'Gerilim' }
                ]}
                value={filters.genre}
                onChange={(value) => setFilters(prev => ({ ...prev, genre: value }))}
                placeholder="Tüm Türler"
                buttonClassName="w-full justify-between rounded-2xl"
                menuClassName="w-full"
              />

              <Dropdown
                options={[
                  { value: 'createdAt', label: 'Eklenme Tarihi' },
                  { value: 'title', label: 'Başlık' },
                  { value: 'viewCount', label: 'Görüntülenme' },
                  { value: 'rating', label: 'Değerlendirme' },
                  { value: 'totalChapters', label: 'Chapter Sayısı' }
                ]}
                value={filters.sortBy}
                onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                placeholder="Sıralama"
                buttonClassName="w-full justify-between rounded-2xl"
                menuClassName="w-full"
              />

              <Dropdown
                options={[
                  { value: 'desc', label: 'Azalan' },
                  { value: 'asc', label: 'Artan' }
                ]}
                value={filters.sortOrder}
                onChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))}
                placeholder="Sıra"
                buttonClassName="w-full justify-between rounded-2xl"
                menuClassName="w-full"
              />
            </div>
          )}
        </form>
      </div>

      {/* Manga Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-100 dark:bg-dark-800 border-b border-light-200 dark:border-dark-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedManga.length === manga.length && manga.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedManga(manga.map(m => m._id));
                      } else {
                        setSelectedManga([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Manga
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Tür
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  İstatistikler
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Tarih
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-dark-950 dark:text-light-50">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-200 dark:divide-dark-700">
              {manga.map((item) => (
                <tr key={item._id} className="hover:bg-light-50 dark:hover:bg-dark-800/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedManga.includes(item._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedManga(prev => [...prev, item._id]);
                        } else {
                          setSelectedManga(prev => prev.filter(id => id !== item._id));
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate" title={item.title}>
                            {item.title}
                          </p>
                          {item.isPrivate && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Özel
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-light-700 dark:text-dark-400">
                          {item.author && Array.isArray(item.author) ? item.author.join(', ') : 'Yazar bilinmiyor'}
                        </p>
                        {item.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-light-600 dark:text-dark-400">
                              {item.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {typeLabels[item.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={getStatusColor(item.status)}>
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{item.viewCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{item.totalChapters} chapter</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-light-700 dark:text-dark-400">
                      <div>{new Date(item.createdAt).toLocaleDateString('tr-TR')}</div>
                      <div>Son: {new Date(item.updatedAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/manga/${item.slug || item._id}`}
                        className="btn btn-ghost btn-sm"
                        title="Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/manga/${item._id}/edit`}
                        className="btn btn-ghost btn-sm"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(item._id, item.title)}
                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {manga.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-light-400 dark:text-dark-600 mx-auto mb-4" />
            <p className="text-light-700 dark:text-dark-400">Henüz manga eklenmemiş</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-light-700 dark:text-dark-400">
            Sayfa {pagination.page} / {pagination.pages} ({pagination.total} manga)
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Önceki
            </button>
            
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setPagination(prev => ({ ...prev, page }))}
                  className={`btn btn-sm ${
                    pagination.page === page ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}