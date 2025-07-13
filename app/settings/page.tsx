'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Key, 
  User, 
  Sun, 
  Globe, 
  BookOpen, 
  Bell, 
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  Camera,
  Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/providers/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  readingMode: 'horizontal' | 'vertical' | 'webtoon';
  autoTranslate: boolean;
  targetLanguage: string;
  notifications: {
    newChapters: boolean;
    favorites: boolean;
    system: boolean;
  };
  geminiApiKey?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateUserAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    language: 'tr',
    readingMode: 'horizontal',
    autoTranslate: false,
    targetLanguage: 'tr',
    notifications: {
      newChapters: true,
      favorites: true,
      system: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingApiKey, setTestingApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loginActivities, setLoginActivities] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        toast.error('Lütfen giriş yapın');
      } else {
        // AuthProvider'dan gelen user'ın settings'ini kullan
        setSettings(user.settings || settings);
        setLoading(false);
        loadSessions();
        loadLoginActivities();
      }
    }
  }, [user, authLoading, router]);

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.data);
      }
    } catch (error) {
      console.error('Load sessions error:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadLoginActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/login-activities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLoginActivities(data.data);
      }
    } catch (error) {
      console.error('Load login activities error:', error);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        toast.success('Cihazdan çıkış yapıldı');
        loadSessions(); // Refresh sessions
      } else {
        throw new Error('Çıkış yapılamadı');
      }
    } catch (error) {
      console.error('Logout session error:', error);
      toast.error('Çıkış yapılırken hata oluştu');
    }
  };

  const handleLogoutAllSessions = async () => {
    if (!confirm('Tüm cihazlardan çıkış yapmak istediğinize emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ logoutAll: true }),
      });

      if (response.ok) {
        toast.success('Tüm cihazlardan çıkış yapıldı');
        loadSessions(); // Refresh sessions
      } else {
        throw new Error('Çıkış yapılamadı');
      }
    } catch (error) {
      console.error('Logout all sessions error:', error);
      toast.error('Çıkış yapılırken hata oluştu');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Ayarlar kaydedildi');
        
        // Apply theme immediately
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        throw new Error('Ayarlar kaydedilemedi');
      }
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const testApiKey = async () => {
    if (!settings.geminiApiKey) {
      toast.error('API key boş olamaz');
      return;
    }

    try {
      setTestingApiKey(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiKey: settings.geminiApiKey,
        }),
      });

      if (response.ok) {
        setApiKeyValid(true);
        toast.success('API key geçerli');
      } else {
        setApiKeyValid(false);
        toast.error('API key geçersiz');
      }
    } catch (error) {
      console.error('API key test error:', error);
      setApiKeyValid(false);
      toast.error('API key test edilirken hata oluştu');
    } finally {
      setTestingApiKey(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Dosya türü kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    try {
      setUploadingAvatar(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Profil fotoğrafı güncellendi');
        // User state'ini güncelle
        updateUserAvatar(data.data.avatarUrl);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Profil fotoğrafı yüklenemedi');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Profil fotoğrafı yüklenirken hata oluştu');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (authLoading || loading) {
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container-responsive py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark-950 dark:text-light-50 mb-2">
              Ayarlar
            </h1>
            <p className="text-light-700 dark:text-dark-400">
              Hesabınızı ve okuma deneyiminizi kişiselleştirin
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20">
                <nav className="space-y-2">
                  <a href="#profile" className="flex items-center gap-3 px-3 py-2 text-sm text-dark-950 dark:text-light-50 hover:bg-light-100 dark:hover:bg-dark-800 rounded-lg">
                    <User className="w-4 h-4" />
                    Profil
                  </a>
                  <a href="#notifications" className="flex items-center gap-3 px-3 py-2 text-sm text-dark-950 dark:text-light-50 hover:bg-light-100 dark:hover:bg-dark-800 rounded-lg">
                    <Bell className="w-4 h-4" />
                    Bildirimler
                  </a>
                  <a href="#security" className="flex items-center gap-3 px-3 py-2 text-sm text-dark-950 dark:text-light-50 hover:bg-light-100 dark:hover:bg-dark-800 rounded-lg">
                    <Shield className="w-4 h-4" />
                    Güvenlik
                  </a>
                  <a href="#api" className="flex items-center gap-3 px-3 py-2 text-sm text-dark-950 dark:text-light-50 hover:bg-light-100 dark:hover:bg-dark-800 rounded-lg">
                    <Key className="w-4 h-4" />
                    API Ayarları
                  </a>
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Section */}
              <section id="profile" className="card p-6">
                <h2 className="text-xl font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profil Bilgileri
                </h2>
                <div className="space-y-4">
                  {/* Profil Fotoğrafı */}
                  <div>
                    <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                      Profil Fotoğrafı
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-light-200 dark:bg-dark-700 flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt="Profil fotoğrafı"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-light-600 dark:text-dark-400" />
                          )}
                        </div>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <LoadingSpinner />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="btn btn-outline btn-sm flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {uploadingAvatar ? 'Yükleniyor...' : 'Fotoğraf Değiştir'}
                        </button>
                        <p className="text-xs text-light-600 dark:text-dark-400">
                          JPG, PNG veya GIF. Maksimum 5MB.
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      value={user.username}
                      disabled
                      className="input opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                      Kullanıcı adı değiştirilemez
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-950 dark:text-light-50 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="navbar-search-input opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                      Email değiştirilemez
                    </p>
                  </div>
                </div>
              </section>


              {/* Notifications Section */}
              <section id="notifications" className="card p-6">
                <h2 className="text-xl font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Bildirimler
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-dark-950 dark:text-light-50">
                        Yeni Bölüm Bildirimleri
                      </label>
                      <p className="text-xs text-light-600 dark:text-dark-400">
                        Takip ettiğiniz mangaların yeni bölümleri için bildirim alın
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          newChapters: !settings.notifications.newChapters
                        }
                      })}
                      className={`toggle-switch ${
                        settings.notifications.newChapters ? 'toggle-switch-active' : 'toggle-switch-inactive'
                      }`}
                    >
                      <span
                        className={`toggle-switch-handle ${
                          settings.notifications.newChapters ? 'toggle-switch-handle-active' : 'toggle-switch-handle-inactive'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-dark-950 dark:text-light-50">
                        Favori Bildirimleri
                      </label>
                      <p className="text-xs text-light-600 dark:text-dark-400">
                        Favori mangalarınızla ilgili güncellemeler
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          favorites: !settings.notifications.favorites
                        }
                      })}
                      className={`toggle-switch ${
                        settings.notifications.favorites ? 'toggle-switch-active' : 'toggle-switch-inactive'
                      }`}
                    >
                      <span
                        className={`toggle-switch-handle ${
                          settings.notifications.favorites ? 'toggle-switch-handle-active' : 'toggle-switch-handle-inactive'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-dark-950 dark:text-light-50">
                        Sistem Bildirimleri
                      </label>
                      <p className="text-xs text-light-600 dark:text-dark-400">
                        Sistem güncellemeleri ve önemli duyurular
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          system: !settings.notifications.system
                        }
                      })}
                      className={`toggle-switch ${
                        settings.notifications.system ? 'toggle-switch-active' : 'toggle-switch-inactive'
                      }`}
                    >
                      <span
                        className={`toggle-switch-handle ${
                          settings.notifications.system ? 'toggle-switch-handle-active' : 'toggle-switch-handle-inactive'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* Security Section */}
              <section id="security" className="card p-6">
                <h2 className="text-xl font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Güvenlik
                </h2>
                <div className="space-y-6">
                  {/* Device Management */}
                  <div>
                    <h3 className="text-lg font-medium text-dark-950 dark:text-light-50 mb-3">
                      Cihaz Yönetimi
                    </h3>
                    <p className="text-sm text-light-600 dark:text-dark-400 mb-4">
                      Hesabınıza giriş yapan cihazları görüntüleyin ve yönetin
                    </p>
                    
                    {/* Sessions */}
                    <div className="space-y-3">
                      {loadingSessions ? (
                        <div className="flex items-center justify-center py-8">
                          <LoadingSpinner />
                        </div>
                      ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-light-600 dark:text-dark-400">
                          Aktif session bulunamadı
                        </div>
                      ) : (
                        sessions.map((session) => (
                          <div 
                            key={session._id}
                            className={`p-4 border rounded-lg ${
                              session.isCurrentSession 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                : 'bg-light-50 dark:bg-dark-800 border-light-200 dark:border-dark-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  session.isCurrentSession 
                                    ? 'bg-green-100 dark:bg-green-800' 
                                    : 'bg-light-200 dark:bg-dark-700'
                                }`}>
                                  <Shield className={`w-5 h-5 ${
                                    session.isCurrentSession 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-light-600 dark:text-dark-400'
                                  }`} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-dark-950 dark:text-light-50">
                                    {session.deviceInfo.deviceName}
                                    {session.isCurrentSession && ' (Bu Cihaz)'}
                                  </h4>
                                  <p className="text-sm text-light-600 dark:text-dark-400">
                                    {session.deviceInfo.os} • {session.deviceInfo.browser} • {session.ipAddress}
                                  </p>
                                  <p className="text-xs text-light-500 dark:text-dark-500">
                                    Son aktivite: {new Date(session.lastActivity).toLocaleString('tr-TR')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {session.isCurrentSession ? (
                                  <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                    Aktif
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => handleLogoutSession(session._id)}
                                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Çıkış Yap
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-light-200 dark:border-dark-700">
                      <button 
                        onClick={handleLogoutAllSessions}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Tüm Cihazlardan Çıkış Yap
                      </button>
                    </div>
                  </div>

                  {/* Login Activity */}
                  <div>
                    <h3 className="text-lg font-medium text-dark-950 dark:text-light-50 mb-3">
                      Son Giriş Aktiviteleri
                    </h3>
                    <div className="space-y-2">
                      {loginActivities.length === 0 ? (
                        <div className="text-center py-8 text-light-600 dark:text-dark-400">
                          Giriş aktivitesi bulunamadı
                        </div>
                      ) : (
                        loginActivities.map((activity) => (
                          <div key={activity._id} className="flex items-center justify-between py-2 px-3 bg-light-50 dark:bg-dark-800 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-dark-950 dark:text-light-50">
                                {activity.status}
                              </span>
                              <p className="text-xs text-light-600 dark:text-dark-400">
                                {activity.deviceInfo.deviceName} • {activity.deviceInfo.browser} • {activity.ipAddress}
                              </p>
                            </div>
                            <span className="text-xs text-light-600 dark:text-dark-400">
                              {new Date(activity.loginTime).toLocaleString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* API Settings Section */}
              <section id="api" className="card p-6">
                <h2 className="text-xl font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Ayarları
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-dark-950 dark:text-light-50">
                        Gemini API Key
                      </label>
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        API Key Al
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.geminiApiKey || ''}
                        onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
                        placeholder="AIzaSy..."
                        className="navbar-search-input pr-20"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="btn btn-ghost btn-sm"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {apiKeyValid !== null && (
                          <div className={`w-4 h-4 ${apiKeyValid ? 'text-green-500' : 'text-red-500'}`}>
                            {apiKeyValid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                      Auto translate özelliği için gereklidir. API key'iniz güvenli bir şekilde saklanır.
                    </p>
                    <button
                      onClick={testApiKey}
                      disabled={testingApiKey || !settings.geminiApiKey}
                      className="btn btn-outline btn-sm mt-2"
                    >
                      {testingApiKey ? 'Test Ediliyor...' : 'API Key Test Et'}
                    </button>
                  </div>
                  <div className="p-4 bg-light-100 dark:bg-dark-800 rounded-lg">
                    <h4 className="font-medium text-dark-950 dark:text-light-50 mb-2">
                      API Key Kullanımı
                    </h4>
                    <p className="text-sm text-light-700 dark:text-dark-400">
                      Model: <code className="bg-light-200 dark:bg-dark-700 px-2 py-1 rounded">Gemini 2.5 Flash Lite</code>
                    </p>
                    <p className="text-xs text-light-600 dark:text-dark-400 mt-2">
                      API key'iniz yalnızca çeviri istekleri için kullanılır ve güvenli bir şekilde saklanır.
                    </p>
                  </div>
                </div>
              </section>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}