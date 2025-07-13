'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Save,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react';
import { useNotification } from '@/components/providers/NotificationProvider';
import Dropdown from '@/components/ui/Dropdown';

interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'admin';
  isActive: boolean;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  
  const [form, setForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserForm>>({});

  const validateForm = () => {
    const newErrors: Partial<CreateUserForm> = {};

    // Username validation
    if (!form.username.trim()) {
      newErrors.username = 'Kullanıcı adı gereklidir';
    } else if (form.username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.username = 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir';
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email gereklidir';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Geçerli bir email adresi giriniz';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (form.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          isActive: form.isActive
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(`Kullanıcı "${form.username}" başarıyla oluşturuldu`);
        router.push('/admin/users');
      } else {
        showError(data.message || 'Kullanıcı oluşturulurken hata oluştu');
        
        // Handle specific errors
        if (data.code === 'USERNAME_EXISTS') {
          setErrors({ username: 'Bu kullanıcı adı zaten kullanılmaktadır' });
        } else if (data.code === 'EMAIL_EXISTS') {
          setErrors({ email: 'Bu email adresi zaten kullanılmaktadır' });
        }
      }
    } catch (error) {
      console.error('Create user error:', error);
      showError('Sunucu hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="btn btn-ghost btn-sm"
          title="Geri Dön"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        
        <div>
          <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
            Yeni Kullanıcı Oluştur
          </h1>
          <p className="text-light-700 dark:text-dark-400">
            Sisteme yeni kullanıcı ekleyin
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-950 dark:text-light-50">
                Kullanıcı Bilgileri
              </h2>
              <p className="text-sm text-light-700 dark:text-dark-400">
                Lütfen tüm alanları doldurunuz
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div className="form-group">
              <label className="form-label">
                <User className="w-4 h-4 inline mr-2" />
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`navbar-search-input ${errors.username ? 'border-red-500' : ''}`}
                placeholder="kullaniciadi"
                disabled={loading}
              />
              {errors.username && (
                <p className="form-error">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`navbar-search-input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="user@example.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                <Lock className="w-4 h-4 inline mr-2" />
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`navbar-search-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-600 dark:text-dark-400 hover:text-dark-950 dark:hover:text-light-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">
                <Lock className="w-4 h-4 inline mr-2" />
                Şifre Tekrar
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`navbar-search-input pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-600 dark:text-dark-400 hover:text-dark-950 dark:hover:text-light-50"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role */}
            <div className="form-group">
              <label className="form-label">
                <Shield className="w-4 h-4 inline mr-2" />
                Kullanıcı Rolü
              </label>
              <Dropdown
                value={form.role}
                onChange={(value) => handleInputChange('role', value as 'user' | 'admin')}
                options={[
                  { value: 'user', label: 'Kullanıcı' },
                  { value: 'admin', label: 'Admin' }
                ]}
                placeholder="Rol seçin"
                disabled={loading}
              />
              <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                {form.role === 'admin' 
                  ? 'Admin kullanıcıları tüm yönetim paneline erişebilir' 
                  : 'Normal kullanıcı, sadece okuma ve favori işlemleri yapabilir'
                }
              </p>
            </div>

            {/* Active Status */}
            <div className="form-group">
              <label className="form-label">Hesap Durumu</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('isActive', !form.isActive)}
                  className={`toggle-switch ${
                    form.isActive ? 'toggle-switch-active' : 'toggle-switch-inactive'
                  }`}
                  disabled={loading}
                >
                  <span
                    className={`toggle-switch-handle ${
                      form.isActive ? 'toggle-switch-handle-active' : 'toggle-switch-handle-inactive'
                    }`}
                  />
                </button>
                <span className="text-sm text-dark-950 dark:text-light-50">
                  {form.isActive ? 'Aktif' : 'Devre Dışı'}
                </span>
              </div>
              <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                {form.isActive 
                  ? 'Kullanıcı sisteme giriş yapabilir' 
                  : 'Kullanıcı sisteme giriş yapamaz'
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-6 border-t border-light-200 dark:border-dark-700">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
            </button>
            
            <Link
              href="/admin/users"
              className="btn btn-ghost"
            >
              İptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}