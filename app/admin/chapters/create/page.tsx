'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText, 
  BookOpen, 
  Hash, 
  Calendar, 
  Upload,
  Save,
  Image as ImageIcon,
  X,
  Plus,
  Eye,
  Volume2
} from 'lucide-react';
import { useNotification } from '@/components/providers/NotificationProvider';
import Dropdown from '@/components/ui/Dropdown';

interface CreateChapterForm {
  mangaId: string;
  title: string;
  chapterNumber: number;
  volume?: number;
  publishedAt: string;
  originalLanguage: string;
  pages: File[];
}

interface CreateChapterFormErrors {
  mangaId?: string;
  title?: string;
  chapterNumber?: string;
  volume?: string;
  publishedAt?: string;
  originalLanguage?: string;
  pages?: string;
}

interface Manga {
  _id: string;
  title: string;
  coverImage: string;
  totalChapters: number;
}

export default function CreateChapterPage() {
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [form, setForm] = useState<CreateChapterForm>({
    mangaId: '',
    title: '',
    chapterNumber: 1,
    volume: undefined,
    publishedAt: new Date().toISOString().split('T')[0],
    originalLanguage: 'ja',
    pages: []
  });
  
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<CreateChapterFormErrors>({});
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchMangaList();
  }, []);

  const fetchMangaList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/manga?limit=1000&fields=title,coverImage,totalChapters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMangaList(data.data);
      }
    } catch (error) {
      console.error('Manga list fetch error:', error);
      showError('Manga listesi yüklenirken hata oluştu');
    }
  };

  const validateForm = (showErrors: boolean = true) => {
    const newErrors: CreateChapterFormErrors = {};

    if (!form.mangaId) {
      newErrors.mangaId = 'Manga seçimi gereklidir';
    }

    if (!form.title.trim()) {
      newErrors.title = 'Chapter başlığı gereklidir';
    } else if (form.title.length > 200) {
      newErrors.title = 'Başlık 200 karakterden uzun olamaz';
    }

    const chapterNum = Number(form.chapterNumber);
    if (isNaN(chapterNum) || chapterNum < 0) {
      newErrors.chapterNumber = 'Geçerli bir chapter numarası giriniz';
    }

    if (form.volume !== undefined && form.volume < 1) {
      newErrors.volume = 'Volume numarası 1\'den küçük olamaz';
    }

    if (form.pages.length === 0) {
      newErrors.pages = 'En az bir sayfa yüklemelisiniz';
    }

    if (showErrors) {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      showError('Sadece resim dosyaları yüklenebilir');
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = imageFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      showError('Dosya boyutu 5MB\'tan büyük olamaz');
      return;
    }

    setForm(prev => ({ ...prev, pages: [...prev.pages, ...imageFiles] }));

    // Preview URL'leri oluştur
    const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);

    showInfo(`${imageFiles.length} dosya eklendi`);
  };

  const removeFile = (index: number) => {
    const newPages = form.pages.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    // Eski URL'yi temizle
    URL.revokeObjectURL(previewUrls[index]);
    
    setForm(prev => ({ ...prev, pages: newPages }));
    setPreviewUrls(newPreviews);
  };

  const reorderPages = (fromIndex: number, toIndex: number) => {
    const newPages = [...form.pages];
    const newPreviews = [...previewUrls];
    
    const [movedPage] = newPages.splice(fromIndex, 1);
    const [movedPreview] = newPreviews.splice(fromIndex, 1);
    
    newPages.splice(toIndex, 0, movedPage);
    newPreviews.splice(toIndex, 0, movedPreview);
    
    setForm(prev => ({ ...prev, pages: newPages }));
    setPreviewUrls(newPreviews);
  };

  const uploadPages = async (): Promise<string[]> => {
    if (form.pages.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }

      for (let i = 0; i < form.pages.length; i++) {
        const formData = new FormData();
        formData.append('file', form.pages[i]);
        formData.append('type', 'chapter');

        console.log(`Sayfa ${i + 1} yükleniyor...`);

        // İstekler arasına küçük bir gecikme ekleyerek sunucuyu rahatlat
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms bekle

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Sayfa ${i + 1} yükleme hatası:`, errorData);
          throw new Error(errorData.error || `Sayfa ${i + 1} yüklenemedi`);
        }

        const data = await response.json();
        console.log(`Sayfa ${i + 1} yüklendi:`, data);
        
        // API yanıtında data.data.url kullanılması gerekiyor
        const imageUrl = data.data?.url || data.url;
        if (!imageUrl) {
          throw new Error(`Sayfa ${i + 1} URL'si alınamadı`);
        }
        
        uploadedUrls.push(imageUrl);
        showInfo(`Sayfa ${i + 1}/${form.pages.length} yüklendi`);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Lütfen tüm alanları doğru şekilde doldurunuz');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum süresi dolmuş');
      }

      // Önce mevcut chapter'ı kontrol et
      const checkResponse = await fetch(`/api/chapters?mangaId=${form.mangaId}&chapterNumber=${form.chapterNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const checkData = await checkResponse.json();
      console.log('Mevcut chapter kontrolü:', checkData);

      // Sadece aynı numaralı chapter varsa sil
      const existingChapter = checkData.success && checkData.data.find(
        (chapter: any) => chapter.chapterNumber === Number(form.chapterNumber)
      );

      if (existingChapter) {
        console.log('Aynı numaralı chapter bulundu:', existingChapter);
        
        // Mevcut chapter'ı sil
        const deleteResponse = await fetch(`/api/chapters/${existingChapter._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const deleteData = await deleteResponse.json();
        if (!deleteData.success) {
          throw new Error('Mevcut chapter silinemedi: ' + deleteData.error);
        }
        
        console.log('Mevcut chapter silindi');
      }

      // Sayfaları yükle
      showInfo('Sayfalar yükleniyor...');
      const pageUrls = await uploadPages();
      
      if (pageUrls.length === 0) {
        showError('Sayfa yükleme başarısız');
        return;
      }

      console.log('Sayfalar yüklendi:', pageUrls);

      // Form verilerini hazırla ve chapterNumber'ı sayıya dönüştür
      const chapterData = {
        ...form,
        chapterNumber: Number(form.chapterNumber),
        pages: pageUrls.map((url, index) => ({
          pageNumber: index + 1,
          imageUrl: url,
          width: 800, // Varsayılan değerler
          height: 1200,
          textRegions: [],
          translatedVersions: []
        }))
      };

      console.log('Gönderilecek chapter verisi:', chapterData);

      // Yeni chapter'ı oluştur
      const response = await fetch('/api/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(chapterData)
      });

      const data = await response.json();
      console.log('API yanıtı:', data);

      if (response.ok && data.success) {
        showSuccess(`Chapter ${form.chapterNumber} başarıyla oluşturuldu`);
        
        // Preview URL'leri temizle
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        
        router.push('/admin/chapters');
      } else {
        console.error('Chapter oluşturma hatası:', data);
        showError(data.error || data.message || 'Chapter oluşturulurken hata oluştu');
      }
    } catch (error: any) {
      console.error('Create chapter error:', error);
      showError(`Sunucu hatası oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateChapterForm, value: any, clearError: boolean = true) => {
    let processedValue = value;
    
    // Sayısal alanlar için özel işlem
    if (field === 'chapterNumber') {
      processedValue = value === '' ? 0 : Number(value);
      if (isNaN(processedValue)) return; // Geçersiz sayı girişini engelle
    } else if (field === 'volume') {
      if (value === '') {
        processedValue = undefined;
      } else {
        processedValue = Number(value);
        if (isNaN(processedValue)) return;
      }
    }

    setForm(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Hata temizleme - sadece clearError true ise ve kullanıcı bir alana değer girdiğinde o alanın hatasını temizle
    if (clearError && errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const selectedManga = mangaList.find(m => m._id === form.mangaId);
  const suggestedChapterNumber = selectedManga ? (selectedManga.totalChapters || 0) + 1 : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/chapters"
          className="btn btn-ghost btn-sm"
          title="Geri Dön"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
            Yeni Chapter Oluştur
          </h1>
          <p className="text-light-700 dark:text-dark-400">
            Manga'ya yeni chapter ekleyin
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-dark-950 dark:text-light-50">
                  Chapter Bilgileri
                </h2>
                <p className="text-sm text-light-700 dark:text-dark-400">
                  Temel chapter bilgilerini doldurun
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manga Selection */}
              <div className="form-group md:col-span-2">
                <label className="form-label">
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Manga
                </label>
                <Dropdown
                  options={[
                    { value: '', label: 'Manga seçiniz...' },
                    ...mangaList.map((manga) => ({
                      value: manga._id,
                      label: `${manga.title} (${manga.totalChapters || 0} chapter)`
                    }))
                  ]}
                  value={form.mangaId}
                  onChange={(value) => {
                    // Manga değiştiğinde hem mangaId hem de chapterNumber'ı aynı anda güncelle
                    const selected = mangaList.find(m => m._id === value);
                    const suggestedChapter = selected ? (selected.totalChapters || 0) + 1 : 1;
                    
                    setForm(prev => ({
                      ...prev,
                      mangaId: value,
                      chapterNumber: suggestedChapter
                    }));

                    // Sadece değer varsa hataları temizle, boş değer için hata temizleme
                    if (value && errors.mangaId) {
                      setErrors(prev => ({
                        ...prev,
                        mangaId: undefined
                      }));
                    }
                  }}
                  placeholder="Manga seçiniz..."
                  disabled={loading}
                  className={errors.mangaId ? 'border-red-500' : ''}
                />
                {errors.mangaId && (
                  <p className="form-error">{errors.mangaId}</p>
                )}
                {selectedManga && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-light-100 dark:bg-dark-800 rounded-lg">
                    <img
                      src={selectedManga.coverImage}
                      alt={selectedManga.title}
                      className="w-8 h-10 object-cover rounded"
                    />
                    <span className="text-sm font-medium">{selectedManga.title}</span>
                  </div>
                )}
              </div>

              {/* Chapter Title */}
              <div className="form-group">
                <label className="form-label">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Chapter Başlığı
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value, true)}
                  className={`navbar-search-input ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="Chapter başlığı..."
                  disabled={loading}
                  maxLength={200}
                />
                {errors.title && (
                  <p className="form-error">{errors.title}</p>
                )}
                <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                  {form.title.length}/200 karakter
                </p>
              </div>

              {/* Chapter Number */}
              <div className="form-group">
                <label className="form-label">
                  <Hash className="w-4 h-4 inline mr-2" />
                  Chapter Numarası
                </label>
                <input
                  type="number"
                  value={form.chapterNumber}
                  onChange={(e) => handleInputChange('chapterNumber', parseInt(e.target.value) || 0, true)}
                  className={`navbar-search-input ${errors.chapterNumber ? 'border-red-500' : ''}`}
                  placeholder="1"
                  min="0"
                  step="1"
                  disabled={loading}
                />
                {errors.chapterNumber && (
                  <p className="form-error">{errors.chapterNumber}</p>
                )}
                {selectedManga && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Önerilen: {suggestedChapterNumber}
                  </p>
                )}
              </div>

              {/* Volume (Optional) */}
              <div className="form-group">
                <label className="form-label">
                  <Volume2 className="w-4 h-4 inline mr-2" />
                  Volume (Opsiyonel)
                </label>
                <input
                  type="number"
                  value={form.volume || ''}
                  onChange={(e) => handleInputChange('volume', e.target.value ? parseInt(e.target.value) : undefined, true)}
                  className={`navbar-search-input ${errors.volume ? 'border-red-500' : ''}`}
                  placeholder="Volume numarası..."
                  min="1"
                  step="1"
                  disabled={loading}
                />
                {errors.volume && (
                  <p className="form-error">{errors.volume}</p>
                )}
              </div>

              {/* Published Date */}
              <div className="form-group">
                <label className="form-label">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Yayın Tarihi
                </label>
                <input
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) => handleInputChange('publishedAt', e.target.value, true)}
                  className="navbar-search-input"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Pages Upload Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-dark-950 dark:text-light-50">
                  Sayfa Yüklemeleri
                </h2>
                <p className="text-sm text-light-700 dark:text-dark-400">
                  Chapter sayfalarını yükleyin (sıralama önemlidir)
                </p>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-light-300 dark:border-dark-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pages-upload"
                  disabled={loading || uploading}
                />
                <label
                  htmlFor="pages-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="w-8 h-8 text-light-600 dark:text-dark-400" />
                  <div>
                    <p className="font-medium text-dark-950 dark:text-light-50">
                      Sayfaları yüklemek için tıklayın
                    </p>
                    <p className="text-sm text-light-600 dark:text-dark-400">
                      PNG, JPG, WEBP (Max 5MB per file)
                    </p>
                  </div>
                </label>
              </div>

              {errors.pages && (
                <p className="form-error">{errors.pages}</p>
              )}

              {/* Pages Preview */}
              {form.pages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-dark-950 dark:text-light-50">
                      Yüklenen Sayfalar ({form.pages.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, pages: [] }));
                        previewUrls.forEach(url => URL.revokeObjectURL(url));
                        setPreviewUrls([]);
                      }}
                      className="btn btn-ghost btn-sm text-red-600"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                      Tümünü Temizle
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-[3/4] bg-light-100 dark:bg-dark-800 rounded-lg overflow-hidden">
                          <img
                            src={url}
                            alt={`Sayfa ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-dark-950/80 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={loading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-6 border-t border-light-200 dark:border-dark-700">
            <button
              type="submit"
              disabled={loading || uploading}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Oluşturuluyor...' : uploading ? 'Sayfalar Yükleniyor...' : 'Chapter Oluştur'}
            </button>
            
            <Link
              href="/admin/chapters"
              className="btn btn-ghost"
            >
              İptal
            </Link>

            {form.pages.length > 0 && (
              <div className="ml-auto text-sm text-light-600 dark:text-dark-400">
                {form.pages.length} sayfa hazır
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}