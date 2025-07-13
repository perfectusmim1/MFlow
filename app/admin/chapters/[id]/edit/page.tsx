'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Plus, Image as ImageIcon, FileImage, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/components/providers/NotificationProvider';

interface ChapterFormData {
  title: string;
  chapterNumber: number;
  pages: string[];
  publishedAt: string;
}

interface Manga {
  _id: string;
  title: string;
  slug: string;
}

export default function EditChapterPage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manga, setManga] = useState<Manga | null>(null);
  const [formData, setFormData] = useState<ChapterFormData>({
    title: '',
    chapterNumber: 1,
    pages: [],
    publishedAt: new Date().toISOString().split('T')[0]
  });

  const [newPageUrl, setNewPageUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchChapter();
    }
  }, [params.id]);

  const fetchChapter = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chapters/${params.id}`);
      const data = await response.json();

      if (data.success) {
        const chapter = data.data;
        
        // Pages array'ini düzelt - object'leri string'e çevir
        let pages = chapter.pages || [];
        if (Array.isArray(pages)) {
          pages = pages.map((page: any) => {
            if (typeof page === 'string') {
              return page;
            } else if (page && typeof page === 'object') {
              // Object ise url property'sini al veya toString() kullan
              return page.url || page.src || page.path || String(page);
            }
            return String(page);
          }).filter(page => page && page !== '[object Object]');
        }
        
        setFormData({
          title: chapter.title || '',
          chapterNumber: chapter.chapterNumber || 1,
          pages: pages,
          publishedAt: chapter.publishedAt ? new Date(chapter.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        
        // Manga bilgisini al
        if (chapter.mangaId) {
          setManga(chapter.mangaId);
        }
      } else {
        showError('Chapter bulunamadı');
        router.push('/admin/chapters');
      }
    } catch (error) {
      console.error('Fetch chapter error:', error);
      showError('Chapter yüklenirken hata oluştu');
      router.push('/admin/chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showError('Chapter başlığı gereklidir');
      return;
    }

    if (formData.chapterNumber <= 0) {
      showError('Chapter numarası 0\'dan büyük olmalıdır');
      return;
    }

    if (formData.pages.length === 0) {
      showError('En az bir sayfa eklemelisiniz');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/chapters/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Chapter başarıyla güncellendi');
        router.push('/admin/chapters');
      } else {
        showError(data.message || 'Chapter güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Update chapter error:', error);
      showError('Güncelleme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const addPage = () => {
    if (newPageUrl.trim() && !formData.pages.includes(newPageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        pages: [...prev.pages, newPageUrl.trim()]
      }));
      setNewPageUrl('');
    }
  };

  const uploadFiles = async (files: FileList) => {
    if (!files.length) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          showError(`${file.name} bir resim dosyası değil`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'chapter');

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          uploadedUrls.push(data.url);
        } else {
          showError(`${file.name} yüklenemedi: ${data.message}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          pages: [...prev.pages, ...uploadedUrls]
        }));
        showSuccess(`${uploadedUrls.length} dosya başarıyla yüklendi`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Dosya yükleme sırasında hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removePage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index)
    }));
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.pages.length) return;
    
    const newPages = [...formData.pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);
    
    setFormData(prev => ({
      ...prev,
      pages: newPages
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/chapters"
          className="btn btn-ghost btn-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
            Chapter Düzenle
          </h1>
          {manga && (
            <p className="text-light-700 dark:text-dark-400">
              {manga.title} - {formData.title}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon - Temel Bilgiler */}
          <div className="lg:col-span-2 space-y-6">
            {/* Temel Bilgiler */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Temel Bilgiler</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chapter Başlığı *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="input w-full"
                    placeholder="Örn: Chapter 1: Başlangıç"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chapter Numarası *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={formData.chapterNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, chapterNumber: parseFloat(e.target.value) || 1 }))}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Yayın Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Sayfalar */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">
                Sayfalar ({formData.pages.length})
              </h2>
              
              {/* Sayfa Ekleme Seçenekleri */}
              <div className="space-y-4 mb-6">
                {/* URL ile Ekleme */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    URL ile Sayfa Ekle
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newPageUrl}
                      onChange={(e) => setNewPageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="input flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPage())}
                    />
                    <button
                      type="button"
                      onClick={addPage}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ekle
                    </button>
                  </div>
                </div>

                {/* Dosya Yükleme */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FileImage className="w-4 h-4 inline mr-1" />
                    Dosya Yükle
                  </label>
                  
                  {/* Drag & Drop Area */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragOver 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-light-300 dark:border-dark-600 hover:border-primary-400'
                    }`}
                  >
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-light-400 dark:text-dark-500" />
                      <div>
                        <p className="text-sm font-medium">
                          Dosyaları buraya sürükleyin veya 
                          <button
                            type="button"
                            onClick={handleFileSelect}
                            className="text-primary-600 hover:text-primary-700 ml-1"
                          >
                            seçin
                          </button>
                        </p>
                        <p className="text-xs text-light-600 dark:text-dark-400">
                          PNG, JPG, JPEG, WebP desteklenir
                        </p>
                      </div>
                      {uploading && (
                        <div className="flex items-center justify-center gap-2">
                          <div className="loading-spinner w-4 h-4"></div>
                          <span className="text-sm">Yükleniyor...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Sayfa Listesi */}
              <div className="space-y-3">
                {formData.pages.map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border border-light-200 dark:border-dark-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-light-600 dark:text-dark-400 min-w-[3rem]">
                        {index + 1}.
                      </span>
                      <div className="w-16 h-20 bg-light-100 dark:bg-dark-800 rounded overflow-hidden">
                        <img
                          src={page}
                          alt={`Sayfa ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-light-400 dark:text-dark-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <input
                        type="url"
                        value={page}
                        onChange={(e) => {
                          const newPages = [...formData.pages];
                          newPages[index] = e.target.value;
                          setFormData(prev => ({ ...prev, pages: newPages }));
                        }}
                        className="input w-full text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => movePage(index, index - 1)}
                        disabled={index === 0}
                        className="btn btn-ghost btn-sm disabled:opacity-50"
                        title="Yukarı taşı"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => movePage(index, index + 1)}
                        disabled={index === formData.pages.length - 1}
                        className="btn btn-ghost btn-sm disabled:opacity-50"
                        title="Aşağı taşı"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removePage(index)}
                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                        title="Sil"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {formData.pages.length === 0 && (
                  <div className="text-center py-8 text-light-600 dark:text-dark-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Henüz sayfa eklenmemiş</p>
                    <p className="text-sm">Yukarıdaki yöntemlerle sayfa ekleyebilirsiniz</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ Kolon - Manga Bilgisi */}
          <div className="space-y-6">
            {manga && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Manga Bilgisi</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-light-600 dark:text-dark-400">
                      Manga:
                    </span>
                    <p className="font-medium">{manga.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-light-600 dark:text-dark-400">
                      Slug:
                    </span>
                    <p className="text-sm text-light-700 dark:text-dark-300">{manga.slug}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Önizleme */}
            {formData.pages.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Önizleme</h2>
                <div className="space-y-2">
                  <p className="text-sm text-light-600 dark:text-dark-400">
                    Toplam {formData.pages.length} sayfa
                  </p>
                  {formData.pages.slice(0, 3).map((page, index) => (
                    <div key={index} className="w-full h-32 bg-light-100 dark:bg-dark-800 rounded overflow-hidden">
                      <img
                        src={page}
                        alt={`Sayfa ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {formData.pages.length > 3 && (
                    <p className="text-sm text-light-600 dark:text-dark-400 text-center">
                      +{formData.pages.length - 3} sayfa daha
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/chapters"
            className="btn btn-outline"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="loading-spinner w-4 h-4"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Kaydet
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}