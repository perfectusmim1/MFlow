'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Download,
  Upload,
  BookOpen,
  Image as ImageIcon,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/components/providers/NotificationProvider';
import Dropdown from '@/components/ui/Dropdown';

interface Chapter {
  _id: string;
  mangaId: {
    _id: string;
    title: string;
    slug: string;
    coverImage: string;
  };
  title: string;
  chapterNumber: number;
  pages: string[];
  viewCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  search: string;
  mangaId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function AdminChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    mangaId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchChapters();
    fetchMangaList();
  }, [filters, pagination.page]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters.search, filters.mangaId, filters.sortBy, filters.sortOrder]);

  // Chapters'ı manga'lara göre gruplandır
  const groupedChapters = chapters.reduce((acc, chapter) => {
    const mangaId = chapter.mangaId._id;
    if (!acc[mangaId]) {
      acc[mangaId] = {
        manga: chapter.mangaId,
        chapters: []
      };
    }
    acc[mangaId].chapters.push(chapter);
    return acc;
  }, {} as Record<string, { manga: any; chapters: Chapter[] }>);

  // Her manga için chapter'ları sırala
  Object.values(groupedChapters).forEach(group => {
    group.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  });

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      // Filtreleri ekle
      if (filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters.mangaId) {
        params.append('mangaId', filters.mangaId);
      }
      if (filters.sortBy) {
        params.append('sort', filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append('order', filters.sortOrder);
      }

      const response = await fetch(`/api/chapters?${params}`);
      const data = await response.json();

      if (data.success) {
        setChapters(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Chapters fetch error:', error);
      showError('Chapter listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMangaList = async () => {
    try {
      const response = await fetch('/api/manga?limit=1000&fields=title');
      const data = await response.json();
      if (data.success) {
        setMangaList(data.data);
      }
    } catch (error) {
      console.error('Manga list fetch error:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" adlı chapter'ı silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/chapters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Chapter başarıyla silindi');
        fetchChapters();
      } else {
        showError(data.message || 'Chapter silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showError('Silme işlemi sırasında hata oluştu');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedChapters.length === 0) return;
    
    if (!confirm(`${selectedChapters.length} chapter'ı silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const promises = selectedChapters.map(id => 
        fetch(`/api/admin/chapters/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount === selectedChapters.length) {
        showSuccess(`${selectedChapters.length} chapter silindi`);
      } else {
        showSuccess(`${successCount}/${selectedChapters.length} chapter silindi`);
      }
      
      setSelectedChapters([]);
      fetchChapters();
    } catch (error) {
      console.error('Bulk delete error:', error);
      showError('Toplu silme işlemi sırasında hata oluştu');
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/chapters/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chapters-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('Chapter listesi dışa aktarıldı');
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
        const response = await fetch('/api/admin/chapters/import', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          showSuccess(`${data.imported || 0} chapter içe aktarıldı`);
          fetchChapters();
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

  if (loading && chapters.length === 0) {
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
            Chapter Yönetimi
          </h1>
          <p className="text-light-700 dark:text-dark-400">
            Toplam {pagination.total} chapter
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedChapters.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger btn-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {selectedChapters.length} Seçili Sil
            </button>
          )}
          
          <div className="flex items-center gap-1 bg-light-100 dark:bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'grouped' 
                  ? 'bg-white dark:bg-dark-700 text-dark-950 dark:text-light-50 shadow-sm' 
                  : 'text-light-600 dark:text-dark-400 hover:text-dark-950 dark:hover:text-light-50'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-1" />
              Gruplu
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-dark-700 text-dark-950 dark:text-light-50 shadow-sm' 
                  : 'text-light-600 dark:text-dark-400 hover:text-dark-950 dark:hover:text-light-50'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              Liste
            </button>
          </div>
          
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
          
          <Link href="/admin/chapters/create" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni Chapter
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Chapter başlığı ara..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="navbar-search-input pl-10 pr-10"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn flex items-center gap-2 transition-all duration-200 ${
                showFilters 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtreler
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-light-200 dark:border-dark-700">
              <Dropdown
                options={[
                  { value: '', label: 'Tüm Manga' },
                  ...mangaList.map(manga => ({ value: manga._id, label: manga.title }))
                ]}
                value={filters.mangaId}
                onChange={(value) => setFilters(prev => ({ ...prev, mangaId: value }))}
                placeholder="Manga Seç"
              />

              <Dropdown
                options={[
                  { value: 'createdAt', label: 'Eklenme Tarihi' },
                  { value: 'chapterNumber', label: 'Chapter Numarası' },
                  { value: 'title', label: 'Başlık' },
                  { value: 'viewCount', label: 'Görüntülenme' },
                  { value: 'publishedAt', label: 'Yayın Tarihi' }
                ]}
                value={filters.sortBy}
                onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                placeholder="Sıralama Ölçütü"
              />

              <Dropdown
                options={[
                  { value: 'desc', label: 'Azalan' },
                  { value: 'asc', label: 'Artan' }
                ]}
                value={filters.sortOrder}
                onChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))}
                placeholder="Sıralama Düzeni"
              />
            </div>
          )}
        </div>
      </div>

      {/* Chapters Display */}
      {viewMode === 'grouped' ? (
        // Gruplandırılmış görünüm
        <div className="space-y-6">
          {Object.values(groupedChapters).map((group) => (
            <div key={group.manga._id} className="card overflow-hidden">
              {/* Manga Header */}
              <div className="bg-light-50 dark:bg-dark-800 px-6 py-4 border-b border-light-200 dark:border-dark-700">
                <div className="flex items-center gap-4">
                  <img
                    src={group.manga.coverImage}
                    alt={group.manga.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">
                      {group.manga.title}
                    </h3>
                    <p className="text-sm text-light-700 dark:text-dark-400">
                      {group.chapters.length} chapter
                    </p>
                  </div>
                </div>
              </div>

              {/* Chapters Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.chapters.map((chapter) => (
                    <div
                      key={chapter._id}
                      className="border border-light-200 dark:border-dark-700 rounded-lg p-4 hover:bg-light-50 dark:hover:bg-dark-800/50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        // Eğer tıklanan element checkbox, button veya link değilse
                        const target = e.target as HTMLElement;
                        const isInteractiveElement = target.tagName === 'INPUT' || 
                                                   target.tagName === 'BUTTON' || 
                                                   target.tagName === 'A' ||
                                                   target.closest('button') ||
                                                   target.closest('a');
                        
                        if (!isInteractiveElement) {
                          // Checkbox durumunu toggle et ve state'i güncelle
                          const isSelected = selectedChapters.includes(chapter._id);
                          if (isSelected) {
                            setSelectedChapters(prev => prev.filter(id => id !== chapter._id));
                          } else {
                            setSelectedChapters(prev => [...prev, chapter._id]);
                          }
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedChapters.includes(chapter._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                setSelectedChapters(prev => [...prev, chapter._id]);
                              } else {
                                setSelectedChapters(prev => prev.filter(id => id !== chapter._id));
                              }
                            }}
                            className="rounded"
                          />
                          <div className="w-6 h-6 bg-light-300 dark:bg-dark-600 rounded flex items-center justify-center">
                            <span className="text-dark-950 dark:text-light-50 text-xs font-medium">
                              {chapter.chapterNumber}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/manga/${chapter.mangaId.slug}/chapter-${chapter.chapterNumber}`}
                            className="btn btn-ghost btn-xs"
                            title="Oku"
                          >
                            <Eye className="w-3 h-3" />
                          </Link>
                          <Link
                            href={`/admin/chapters/${chapter._id}/edit`}
                            className="btn btn-ghost btn-xs"
                            title="Düzenle"
                          >
                            <Edit className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleDelete(chapter._id, `Chapter ${chapter.chapterNumber}`)}
                            className="btn btn-ghost btn-xs text-red-600 hover:text-red-700"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-dark-950 dark:text-light-50">
                          Chapter {chapter.chapterNumber}
                        </p>
                        {chapter.title && (
                          <p className="text-xs text-light-700 dark:text-dark-400 line-clamp-2">
                            {chapter.title}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-light-600 dark:text-dark-400">
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {chapter.pages.length}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {chapter.viewCount}
                          </div>
                        </div>
                        <div className="text-xs text-light-600 dark:text-dark-400">
                          {new Date(chapter.publishedAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {Object.keys(groupedChapters).length === 0 && !loading && (
            <div className="card">
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-light-400 dark:text-dark-600 mx-auto mb-4" />
                <p className="text-light-700 dark:text-dark-400">Henüz chapter eklenmemiş</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Normal liste görünümü
        <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-100 dark:bg-dark-800 border-b border-light-200 dark:border-dark-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedChapters.length === chapters.length && chapters.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChapters(chapters.map(c => c._id));
                      } else {
                        setSelectedChapters([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Chapter
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Manga
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Sayfa Sayısı
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Görüntülenme
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Yayın Tarihi
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-dark-950 dark:text-light-50">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-200 dark:divide-dark-700">
              {chapters.map((chapter) => (
                <tr key={chapter._id} className="hover:bg-light-50 dark:hover:bg-dark-800/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedChapters.includes(chapter._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChapters(prev => [...prev, chapter._id]);
                        } else {
                          setSelectedChapters(prev => prev.filter(id => id !== chapter._id));
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-light-300 dark:bg-dark-600 rounded flex items-center justify-center">
                        <span className="text-dark-950 dark:text-light-50 text-xs font-medium">
                          {chapter.chapterNumber}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark-950 dark:text-light-50 truncate">
                          Chapter {chapter.chapterNumber}
                        </p>
                        {chapter.title && (
                          <p className="text-xs text-light-700 dark:text-dark-400 truncate">
                            {chapter.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={chapter.mangaId.coverImage}
                        alt={chapter.mangaId.title}
                        className="w-8 h-10 object-cover rounded"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark-950 dark:text-light-50 truncate">
                          {chapter.mangaId.title}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-light-600 dark:text-dark-400" />
                      <span className="text-sm text-dark-950 dark:text-light-50">
                        {chapter.pages.length} sayfa
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-light-600 dark:text-dark-400" />
                      <span className="text-sm text-dark-950 dark:text-light-50">
                        {chapter.viewCount.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-light-700 dark:text-dark-400">
                      <div>{new Date(chapter.publishedAt).toLocaleDateString('tr-TR')}</div>
                      <div>Eklendi: {new Date(chapter.createdAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/manga/${chapter.mangaId.slug}/chapter-${chapter.chapterNumber}`}
                        className="btn btn-ghost btn-sm"
                        title="Oku"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/chapters/${chapter._id}/edit`}
                        className="btn btn-ghost btn-sm"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(chapter._id, `Chapter ${chapter.chapterNumber}`)}
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

        {chapters.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-light-400 dark:text-dark-600 mx-auto mb-4" />
            <p className="text-light-700 dark:text-dark-400">Henüz chapter eklenmemiş</p>
          </div>
        )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-light-700 dark:text-dark-400">
            Sayfa {pagination.page} / {pagination.pages} ({pagination.total} chapter)
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