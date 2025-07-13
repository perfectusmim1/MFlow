'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText, 
  BookOpen, 
  User, 
  Users,
  Tag,
  Hash,
  Calendar, 
  Upload,
  Save,
  Image as ImageIcon,
  X,
  Plus,
  Eye,
  Volume2,
  Globe,
  Star,
  Info
} from 'lucide-react';
import { useNotification } from '@/components/providers/NotificationProvider';
import Dropdown from '@/components/ui/Dropdown';

interface CreateMangaForm {
  title: string;
  titleAlternative: string[];
  description: string;
  author: string[];
  artist: string[];
  genres: string[];
  tags: string[];
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  type: 'manga' | 'manhwa' | 'manhua' | 'webtoon';
  coverImage: File | null;
  bannerImage: File | null;
  isNSFW: boolean;
  originalLanguage: string;
  publishedAt: string;
}

const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Supernatural', 'Thriller', 'Yaoi', 'Yuri', 'Ecchi', 'Harem',
  'Isekai', 'Mecha', 'School', 'Historical', 'Military', 'Music',
  'Psychological', 'Seinen', 'Shoujo', 'Shounen', 'Josei'
];

const STATUS_OPTIONS = [
  { value: 'ongoing', label: 'Devam Ediyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'hiatus', label: 'Ara Verildi' },
  { value: 'cancelled', label: 'İptal Edildi' }
];

const TYPE_OPTIONS = [
  { value: 'manga', label: 'Manga' },
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'manhua', label: 'Manhua' },
  { value: 'webtoon', label: 'Webtoon' }
];

const LANGUAGE_OPTIONS = [
  { value: 'ja', label: 'Japonca' },
  { value: 'ko', label: 'Korece' },
  { value: 'zh', label: 'Çince' },
  { value: 'en', label: 'İngilizce' },
  { value: 'tr', label: 'Türkçe' }
];

export default function CreateMangaPage() {
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [form, setForm] = useState<CreateMangaForm>({
    title: '',
    titleAlternative: [],
    description: '',
    author: [],
    artist: [],
    genres: [],
    tags: [],
    status: 'ongoing',
    type: 'manga',
    coverImage: null,
    bannerImage: null,
    isNSFW: false,
    originalLanguage: 'ja',
    publishedAt: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateMangaForm, string>>>({});
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [bannerImagePreview, setBannerImagePreview] = useState<string>('');
  
  // Input states for arrays
  const [newAlternativeTitle, setNewAlternativeTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newTag, setNewTag] = useState('');

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CreateMangaForm, string>> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Manga başlığı gereklidir';
    } else if (form.title.length > 200) {
      newErrors.title = 'Başlık 200 karakterden uzun olamaz';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Açıklama gereklidir';
    } else if (form.description.length > 2000) {
      newErrors.description = 'Açıklama 2000 karakterden uzun olamaz';
    }

    if (form.author.length === 0) {
      newErrors.author = 'En az bir yazar gereklidir';
    }

    if (form.genres.length === 0) {
      newErrors.genres = 'En az bir tür seçmelisiniz';
    }

    if (!form.coverImage) {
      newErrors.coverImage = 'Kapak görseli gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (type: 'cover' | 'banner', file: File | null) => {
    if (!file) return;

    // Dosya türü kontrolü
    if (!file.type.startsWith('image/')) {
      showError('Sadece resim dosyaları yüklenebilir');
      return;
    }

    // Dosya boyutu kontrolü (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('Dosya boyutu 10MB\'tan büyük olamaz');
      return;
    }

    if (type === 'cover') {
      setForm(prev => ({ ...prev, coverImage: file }));
      setCoverImagePreview(URL.createObjectURL(file));
    } else {
      setForm(prev => ({ ...prev, bannerImage: file }));
      setBannerImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = (type: 'cover' | 'banner') => {
    if (type === 'cover') {
      setForm(prev => ({ ...prev, coverImage: null }));
      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
        setCoverImagePreview('');
      }
    } else {
      setForm(prev => ({ ...prev, bannerImage: null }));
      if (bannerImagePreview) {
        URL.revokeObjectURL(bannerImagePreview);
        setBannerImagePreview('');
      }
    }
  };

  const addToArray = (field: 'titleAlternative' | 'author' | 'artist' | 'tags', value: string) => {
    if (!value.trim()) return;
    
    const trimmedValue = value.trim();
    if (form[field].includes(trimmedValue)) {
      showError('Bu değer zaten eklenmiş');
      return;
    }

    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], trimmedValue]
    }));

    // Clear input
    if (field === 'titleAlternative') setNewAlternativeTitle('');
    if (field === 'author') setNewAuthor('');
    if (field === 'artist') setNewArtist('');
    if (field === 'tags') setNewTag('');
  };

  const removeFromArray = (field: 'titleAlternative' | 'author' | 'artist' | 'genres' | 'tags', index: number) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const uploadImage = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = localStorage.getItem('token');
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `${type} görseli yüklenemedi`);
    }

    const data = await response.json();
    return data.data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Lütfen tüm alanları doğru şekilde doldurunuz');
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      let coverImageUrl = '';
      let bannerImageUrl = '';

      // Kapak görseli yükle
      if (form.coverImage) {
        showInfo('Kapak görseli yükleniyor...');
        try {
          coverImageUrl = await uploadImage(form.coverImage, 'manga');
          console.log('Kapak görseli yüklendi:', coverImageUrl);
        } catch (uploadError: any) {
          console.error('Kapak görseli yükleme hatası:', uploadError);
          showError(`Kapak görseli yüklenemedi: ${uploadError.message}`);
          return;
        }
      }

      // Banner görseli yükle (opsiyonel)
      if (form.bannerImage) {
        showInfo('Banner görseli yükleniyor...');
        try {
          bannerImageUrl = await uploadImage(form.bannerImage, 'manga');
          console.log('Banner görseli yüklendi:', bannerImageUrl);
        } catch (uploadError: any) {
          console.error('Banner görseli yükleme hatası:', uploadError);
          showError(`Banner görseli yüklenemedi: ${uploadError.message}`);
          return;
        }
      }

      setUploading(false);

      // Manga oluştur
      showInfo('Manga oluşturuluyor...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        showError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        return;
      }

      const mangaData = {
        ...form,
        coverImage: coverImageUrl,
        bannerImage: bannerImageUrl || undefined,
        publishedAt: form.publishedAt ? new Date(form.publishedAt) : new Date()
      };
      
      console.log('Gönderilen manga verisi:', mangaData);

      const response = await fetch('/api/manga', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mangaData)
      });

      const data = await response.json();
      console.log('API yanıtı:', data);

      if (data.success) {
        showSuccess('Manga başarıyla oluşturuldu');
        router.push('/admin/manga');
      } else {
        console.error('API hatası:', data.error);
        showError(data.error || 'Manga oluşturulamadı');
      }
    } catch (error: any) {
      console.error('Manga creation error:', error);
      showError(`Manga oluşturulurken hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleInputChange = (field: keyof CreateMangaForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleGenre = (genre: string) => {
    if (form.genres.includes(genre)) {
      removeFromArray('genres', form.genres.indexOf(genre));
    } else {
      setForm(prev => ({ ...prev, genres: [...prev.genres, genre] }));
    }
  };

  return (
    <div className="min-h-screen bg-light-50 dark:bg-dark-950">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/manga"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
              Yeni Manga Ekle
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Yeni bir manga oluşturun
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Temel Bilgiler */}
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Temel Bilgiler
            </h2>

            <div className="space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Manga Başlığı *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`navbar-search-input ${
                    errors.title ? 'border-red-500' : ''
                  }`}
                  placeholder="Manga başlığını girin"
                  maxLength={200}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Alternatif Başlıklar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alternatif Başlıklar
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAlternativeTitle}
                    onChange={(e) => setNewAlternativeTitle(e.target.value)}
                    className="navbar-search-input flex-1"
                    placeholder="Alternatif başlık ekle"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('titleAlternative', newAlternativeTitle);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('titleAlternative', newAlternativeTitle)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.titleAlternative.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.titleAlternative.map((title, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-light-100 dark:bg-dark-700 text-dark-800 dark:text-light-200 rounded-md text-sm"
                      >
                        {title}
                        <button
                          type="button"
                          onClick={() => removeFromArray('titleAlternative', index)}
                          className="text-dark-600 dark:text-light-400 hover:text-dark-800 dark:hover:text-light-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className={`navbar-search-input resize-vertical ${
                    errors.description ? 'border-red-500' : ''
                  }`}
                  placeholder="Manga açıklamasını girin"
                  maxLength={2000}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <p className="text-red-500 text-sm">{errors.description}</p>
                  )}
                  <p className="text-gray-500 text-sm ml-auto">
                    {form.description.length}/2000
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Yazarlar ve Sanatçılar */}
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Yazarlar ve Sanatçılar
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Yazarlar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yazarlar *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="navbar-search-input flex-1"
                    placeholder="Yazar adı ekle"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('author', newAuthor);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('author', newAuthor)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.author.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.author.map((author, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm"
                      >
                        {author}
                        <button
                          type="button"
                          onClick={() => removeFromArray('author', index)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.author && (
                  <p className="text-red-500 text-sm mt-1">{errors.author}</p>
                )}
              </div>

              {/* Sanatçılar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sanatçılar
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="navbar-search-input flex-1"
                    placeholder="Sanatçı adı ekle"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('artist', newArtist);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('artist', newArtist)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.artist.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.artist.map((artist, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-sm"
                      >
                        {artist}
                        <button
                          type="button"
                          onClick={() => removeFromArray('artist', index)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kategoriler ve Türler */}
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Kategoriler ve Türler
            </h2>

            <div className="space-y-4">
              {/* Türler */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Türler * (En az 1 tür seçin)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {AVAILABLE_GENRES.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        form.genres.includes(genre)
                          ? 'btn-primary'
                          : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                {errors.genres && (
                  <p className="text-red-500 text-sm mt-1">{errors.genres}</p>
                )}
              </div>

              {/* Etiketler */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Etiketler
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="navbar-search-input flex-1"
                    placeholder="Etiket ekle"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('tags', newTag);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('tags', newTag)}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeFromArray('tags', index)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Durum ve Özellikler */}
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Durum ve Özellikler
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Durum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durum
                </label>
                <Dropdown
                  value={form.status}
                  onChange={(value) => handleInputChange('status', value)}
                  options={STATUS_OPTIONS}
                  placeholder="Durum seçin"
                />
              </div>

              {/* Tip */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tip
                </label>
                <Dropdown
                  value={form.type}
                  onChange={(value) => handleInputChange('type', value)}
                  options={TYPE_OPTIONS}
                  placeholder="Tip seçin"
                />
              </div>

              {/* Orijinal Dil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Orijinal Dil
                </label>
                <Dropdown
                  value={form.originalLanguage}
                  onChange={(value) => handleInputChange('originalLanguage', value)}
                  options={LANGUAGE_OPTIONS}
                  placeholder="Dil seçin"
                />
              </div>

              {/* Yayın Tarihi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yayın Tarihi
                </label>
                <input
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) => handleInputChange('publishedAt', e.target.value)}
                  className="navbar-search-input w-full"
                />
              </div>

              {/* NSFW */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNSFW}
                    onChange={(e) => handleInputChange('isNSFW', e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    NSFW İçerik (18+ yaş sınırı)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Görseller */}
          <div className="bg-white dark:bg-dark-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Görseller
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kapak Görseli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kapak Görseli *
                </label>
                
                {coverImagePreview ? (
                  <div className="relative">
                    <img
                      src={coverImagePreview}
                      alt="Kapak önizleme"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage('cover')}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-dark-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Tıklayın</span> veya sürükleyin
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, WEBP (Max. 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageChange('cover', e.target.files?.[0] || null)}
                    />
                  </label>
                )}
                {errors.coverImage && (
                  <p className="text-red-500 text-sm mt-1">{errors.coverImage}</p>
                )}
              </div>

              {/* Banner Görseli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banner Görseli (Opsiyonel)
                </label>
                
                {bannerImagePreview ? (
                  <div className="relative">
                    <img
                      src={bannerImagePreview}
                      alt="Banner önizleme"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage('banner')}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-dark-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Tıklayın</span> veya sürükleyin
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, WEBP (Max. 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageChange('banner', e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Submit Butonları */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link
              href="/admin/manga"
              className="px-6 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-center"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="btn btn-primary flex items-center gap-2 justify-center"
            >
              {loading || uploading ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  {uploading ? 'Yükleniyor...' : 'Oluşturuluyor...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Manga Oluştur
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}