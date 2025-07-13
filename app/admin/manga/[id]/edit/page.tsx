'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/components/providers/NotificationProvider';

interface MangaFormData {
  title: string;
  alternativeTitles: string[];
  author: string[];
  artist: string[];
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  genres: string[];
  description: string;
  coverImage: string;
  type: 'manga' | 'manhwa' | 'manhua' | 'webtoon';
  isPrivate: boolean;
}

const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  'Historical', 'Psychological', 'School Life', 'Martial Arts', 'Mecha',
  'Military', 'Music', 'Parody', 'Police', 'Political', 'Samurai', 'Space',
  'Super Power', 'Vampire', 'Yaoi', 'Yuri', 'Josei', 'Seinen', 'Shoujo', 'Shounen'
];

export default function EditMangaPage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<MangaFormData>({
    title: '',
    alternativeTitles: [],
    author: [],
    artist: [],
    status: 'ongoing',
    genres: [],
    description: '',
    coverImage: '',
    type: 'manga',
    isPrivate: false
  });

  const [newAlternativeTitle, setNewAlternativeTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newArtist, setNewArtist] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchManga();
    }
  }, [params.id]);

  const fetchManga = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/manga/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        const manga = data.data;
        setFormData({
          title: manga.title || '',
          alternativeTitles: manga.alternativeTitles || [],
          author: manga.author || [],
          artist: manga.artist || [],
          status: manga.status || 'ongoing',
          genres: manga.genres || [],
          description: manga.description || '',
          coverImage: manga.coverImage || '',
          type: manga.type || 'manga',
          isPrivate: manga.isPrivate || false
        });
      } else {
        showError('Manga bulunamadı');
        router.push('/admin/manga');
      }
    } catch (error) {
      console.error('Fetch manga error:', error);
      showError('Manga yüklenirken hata oluştu');
      router.push('/admin/manga');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showError('Manga başlığı gereklidir');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/manga`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, id: params.id })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Manga başarıyla güncellendi');
        router.push('/admin/manga');
      } else {
        showError(data.message || 'Manga güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Update manga error:', error);
      showError('Güncelleme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const addAlternativeTitle = () => {
    if (newAlternativeTitle.trim() && !formData.alternativeTitles.includes(newAlternativeTitle.trim())) {
      setFormData(prev => ({
        ...prev,
        alternativeTitles: [...prev.alternativeTitles, newAlternativeTitle.trim()]
      }));
      setNewAlternativeTitle('');
    }
  };

  const removeAlternativeTitle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      alternativeTitles: prev.alternativeTitles.filter((_, i) => i !== index)
    }));
  };

  const addAuthor = () => {
    if (newAuthor.trim() && !formData.author.includes(newAuthor.trim())) {
      setFormData(prev => ({
        ...prev,
        author: [...prev.author, newAuthor.trim()]
      }));
      setNewAuthor('');
    }
  };

  const removeAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      author: prev.author.filter((_, i) => i !== index)
    }));
  };

  const addArtist = () => {
    if (newArtist.trim() && !formData.artist.includes(newArtist.trim())) {
      setFormData(prev => ({
        ...prev,
        artist: [...prev.artist, newArtist.trim()]
      }));
      setNewArtist('');
    }
  };

  const removeArtist = (index: number) => {
    setFormData(prev => ({
      ...prev,
      artist: prev.artist.filter((_, i) => i !== index)
    }));
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
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
          href="/admin/manga"
          className="btn btn-ghost btn-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
            Manga Düzenle
          </h1>
          <p className="text-light-700 dark:text-dark-400">
            {formData.title}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon - Temel Bilgiler */}
          <div className="lg:col-span-2 space-y-6">
            {/* Başlık */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Temel Bilgiler</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Manga Başlığı *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>

                {/* Alternatif Başlıklar */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Alternatif Başlıklar
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAlternativeTitle}
                      onChange={(e) => setNewAlternativeTitle(e.target.value)}
                      placeholder="Alternatif başlık ekle"
                      className="input flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAlternativeTitle())}
                    />
                    <button
                      type="button"
                      onClick={addAlternativeTitle}
                      className="btn btn-outline"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.alternativeTitles.map((title, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                      >
                        {title}
                        <button
                          type="button"
                          onClick={() => removeAlternativeTitle(index)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Yazarlar */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Yazarlar
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="Yazar ekle"
                      className="input flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                    />
                    <button
                      type="button"
                      onClick={addAuthor}
                      className="btn btn-outline"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.author.map((author, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {author}
                        <button
                          type="button"
                          onClick={() => removeAuthor(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Çizerler */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Çizerler
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newArtist}
                      onChange={(e) => setNewArtist(e.target.value)}
                      placeholder="Çizer ekle"
                      className="input flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArtist())}
                    />
                    <button
                      type="button"
                      onClick={addArtist}
                      className="btn btn-outline"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.artist.map((artist, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {artist}
                        <button
                          type="button"
                          onClick={() => removeArtist(index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="input w-full"
                    placeholder="Manga açıklaması..."
                  />
                </div>
              </div>
            </div>

            {/* Türler */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Türler</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {AVAILABLE_GENRES.map((genre) => (
                  <label
                    key={genre}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-light-100 dark:hover:bg-dark-800"
                  >
                    <input
                      type="checkbox"
                      checked={formData.genres.includes(genre)}
                      onChange={() => toggleGenre(genre)}
                      className="rounded"
                    />
                    <span className="text-sm">{genre}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Kolon - Metadata */}
          <div className="space-y-6">
            {/* Kapak Resmi */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Kapak Resmi</h2>
              
              {formData.coverImage && (
                <div className="mb-4">
                  <img
                    src={formData.coverImage}
                    alt="Kapak"
                    className="w-full max-w-48 mx-auto rounded-lg"
                  />
                </div>
              )}
              
              <p className="text-sm text-light-600 dark:text-dark-400">
                Kapak resmi değiştirilemez. Yeni kapak için yeni manga oluşturun.
              </p>
            </div>

            {/* Durum ve Tür */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Durum ve Tür</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Durum
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="input w-full"
                  >
                    <option value="ongoing">Devam Ediyor</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="hiatus">Ara Verildi</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tür
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="input w-full"
                  >
                    <option value="manga">Manga</option>
                    <option value="manhwa">Manhwa</option>
                    <option value="manhua">Manhua</option>
                    <option value="webtoon">Webtoon</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Özel Manga</span>
                  </label>
                  <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                    Özel mangalar sadece admin tarafından görülebilir
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/manga"
            className="btn btn-outline"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={saving}
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