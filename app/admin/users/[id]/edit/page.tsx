'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, User, Mail, Shield, Calendar, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/components/providers/NotificationProvider';

interface UserFormData {
  username: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  password?: string;
}

interface UserStats {
  favoriteCount: number;
  readingHistoryCount: number;
  commentsCount: number;
  lastLogin: string;
  createdAt: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    role: 'user',
    isActive: true,
    password: ''
  });
  const [stats, setStats] = useState<UserStats>({
    favoriteCount: 0,
    readingHistoryCount: 0,
    commentsCount: 0,
    lastLogin: '',
    createdAt: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchUser();
    }
  }, [params.id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data;
        setFormData({
          username: user.username || '',
          email: user.email || '',
          role: user.role || 'user',
          isActive: user.isActive !== false,
          password: ''
        });
        
        setStats({
          favoriteCount: user.favoriteCount || 0,
          readingHistoryCount: user.readingHistory?.length || 0,
          commentsCount: user.commentsCount || 0,
          lastLogin: user.lastLogin || '',
          createdAt: user.createdAt || ''
        });
      } else {
        showError('Kullanıcı bulunamadı');
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      showError('Kullanıcı yüklenirken hata oluştu');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      showError('Kullanıcı adı gereklidir');
      return;
    }

    if (!formData.email.trim()) {
      showError('E-posta adresi gereklidir');
      return;
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showError('Geçerli bir e-posta adresi giriniz');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Şifre boşsa gönderme
      const updateData = { ...formData };
      if (!updateData.password?.trim()) {
        delete updateData.password;
      }
      
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Kullanıcı başarıyla güncellendi');
        router.push('/admin/users');
      } else {
        showError(data.message || 'Kullanıcı güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Update user error:', error);
      showError('Güncelleme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
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
          href="/admin/users"
          className="btn btn-ghost btn-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
            Kullanıcı Düzenle
          </h1>
          <p className="text-light-700 dark:text-dark-400">
            {formData.username}
          </p>
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
                    Kullanıcı Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Yeni Şifre (Boş bırakılırsa değiştirilmez)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="input w-full pr-10"
                      placeholder="Yeni şifre (opsiyonel)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-600 dark:text-dark-400 hover:text-light-800 dark:hover:text-dark-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                    Şifre en az 6 karakter olmalıdır
                  </p>
                </div>
              </div>
            </div>

            {/* Rol ve Durum */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Rol ve Durum</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kullanıcı Rolü
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                    className="input w-full"
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                    Admin rolü tüm yönetim paneli özelliklerine erişim sağlar
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Aktif Kullanıcı</span>
                  </label>
                  <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                    Pasif kullanıcılar sisteme giriş yapamaz
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon - İstatistikler */}
          <div className="space-y-6">
            {/* Kullanıcı İstatistikleri */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">İstatistikler</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-light-600 dark:text-dark-400">
                    Favori Manga
                  </span>
                  <span className="font-medium">
                    {stats.favoriteCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-light-600 dark:text-dark-400">
                    Okuma Geçmişi
                  </span>
                  <span className="font-medium">
                    {stats.readingHistoryCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-light-600 dark:text-dark-400">
                    Yorumlar
                  </span>
                  <span className="font-medium">
                    {stats.commentsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarih Bilgileri */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Tarih Bilgileri</h2>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-light-600 dark:text-dark-400 block">
                    Kayıt Tarihi
                  </span>
                  <span className="font-medium">
                    {stats.createdAt ? new Date(stats.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Bilinmiyor'}
                  </span>
                </div>

                <div>
                  <span className="text-sm text-light-600 dark:text-dark-400 block">
                    Son Giriş
                  </span>
                  <span className="font-medium">
                    {stats.lastLogin ? new Date(stats.lastLogin).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Hiç giriş yapmamış'}
                  </span>
                </div>
              </div>
            </div>

            {/* Durum Göstergesi */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Durum</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">
                    {formData.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${formData.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`} />
                  <span className="text-sm">
                    {formData.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/users"
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