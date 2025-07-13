'use client';

import { useEffect, useState } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Mail, 
  Globe, 
  Shield, 
  Palette,
  Bell,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Server,
  Key,
  Image as ImageIcon
} from 'lucide-react';
import { useNotification } from '@/components/providers/NotificationProvider';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  siteUrl: string;
  contactEmail: string;
  socialLinks: {
    twitter: string;
    facebook: string;
    instagram: string;
    discord: string;
  };
  seoSettings: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  };
  features: {
    userRegistration: boolean;
    commentSystem: boolean;
    ratingSystem: boolean;
    favoriteSystem: boolean;
    readingHistory: boolean;
    notifications: boolean;
  };
  contentSettings: {
    chaptersPerPage: number;
    autoTranslate: boolean;
    allowUserUploads: boolean;
    moderationRequired: boolean;
  };
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const { showSuccess, showError, showInfo } = useNotification();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data || getDefaultSettings());
      } else {
        setSettings(getDefaultSettings());
        showInfo('Varsayılan ayarlar yüklendi');
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
      setSettings(getDefaultSettings());
      showError('Ayarlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = (): SiteSettings => ({
    siteName: 'MFlow',
    siteDescription: 'Modern Manga, Manhwa, Manhua ve Webtoon okuma platformu',
    siteLogo: '/favicon.svg',
    siteUrl: 'http://localhost:3000',
    contactEmail: 'admin@mflow.com',
    socialLinks: {
      twitter: '',
      facebook: '',
      instagram: '',
      discord: ''
    },
    seoSettings: {
      metaTitle: 'MFlow - Modern Manga Okuma Deneyimi',
      metaDescription: 'En popüler manga, manhwa, manhua ve webtoon\'ları yüksek kalitede okuyun.',
      metaKeywords: 'manga, manhwa, manhua, webtoon, oku, online'
    },
    features: {
      userRegistration: true,
      commentSystem: true,
      ratingSystem: true,
      favoriteSystem: true,
      readingHistory: true,
      notifications: true
    },
    contentSettings: {
      chaptersPerPage: 20,
      autoTranslate: false,
      allowUserUploads: false,
      moderationRequired: true
    },
    emailSettings: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@mflow.com',
      fromName: 'MFlow'
    }
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showSuccess('Ayarlar başarıyla kaydedildi');
      } else {
        showError('Ayarlar kaydedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Settings save error:', error);
      showError('Kaydetme işlemi sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/backup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        showSuccess('Yedekleme başarıyla indirildi');
      } else {
        showError('Yedekleme işlemi başarısız');
      }
    } catch (error) {
      console.error('Backup error:', error);
      showError('Yedekleme sırasında hata oluştu');
    }
  };

  const handleClearCache = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Önbellek temizlendi');
      } else {
        showError('Önbellek temizlenirken hata oluştu');
      }
    } catch (error) {
      console.error('Cache clear error:', error);
      showError('Önbellek temizleme sırasında hata oluştu');
    }
  };

  const handleRestoreBackup = async (file: File) => {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backupData,
          restoreOptions: {
            settings: true,
            manga: true,
            chapters: true,
            overwrite: false
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(`Yedekleme geri yüklendi: ${data.restoredCollections?.join(', ')}`);
        fetchSettings(); // Ayarları yenile
      } else {
        showError('Yedekleme geri yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Restore error:', error);
      showError('Geçersiz yedekleme dosyası');
    }
  };

  const handleClearTempFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/clear-temp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Geçici dosyalar temizlendi');
      } else {
        showError('Geçici dosyalar temizlenirken hata oluştu');
      }
    } catch (error) {
      console.error('Clear temp files error:', error);
      showError('Dosya temizleme sırasında hata oluştu');
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Tüm logları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/clear-logs', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Tüm loglar silindi');
      } else {
        showError('Loglar silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Clear logs error:', error);
      showError('Log silme sırasında hata oluştu');
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('VERİTABANINI SIFIRLAMAK İSTEDİĞİNİZE EMİN MİSİNİZ? Bu işlem geri alınamaz ve tüm verileri siler!')) {
      return;
    }
    
    if (!confirm('Bu işlem tüm manga, kullanıcı ve chapter verilerini silecek. GERÇEKTEN EMİN MİSİNİZ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reset-database', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Veritabanı sıfırlandı. Sayfa yenileniyor...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showError('Veritabanı sıfırlanırken hata oluştu');
      }
    } catch (error) {
      console.error('Reset database error:', error);
      showError('Veritabanı sıfırlama sırasında hata oluştu');
    }
  };

  const updateSettings = (section: string, field: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => {
      if (!prev) return prev;
      const sectionKey = section as keyof SiteSettings;
      const currentSection = prev[sectionKey];
      
      if (typeof currentSection === 'object' && currentSection !== null) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [field]: value
          }
        };
      }
      return prev;
    });
  };

  const updateNestedSettings = (section: string, subsection: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => {
      if (!prev) return prev;
      const sectionKey = section as keyof SiteSettings;
      const currentSection = prev[sectionKey];
      
      if (typeof currentSection === 'object' && currentSection !== null) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [subsection]: value
          }
        };
      }
      return prev;
    });
  };

  const tabs = [
    { id: 'general', label: 'Genel', icon: Settings },
    { id: 'features', label: 'Özellikler', icon: CheckCircle },
    { id: 'content', label: 'İçerik', icon: Globe },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'maintenance', label: 'Bakım', icon: Server }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-light-700 dark:text-dark-400">Ayarlar yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
            Site Ayarları
          </h1>
          <p className="text-light-700 dark:text-dark-400">
            Site yapılandırmasını yönetin
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearCache}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Önbellek Temizle
          </button>
          
          <button
            onClick={handleBackup}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Yedekle
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Kaydet
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-6">
        <div className="border-b border-light-200 dark:border-dark-700 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Site Adı</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings(prev => ({ ...prev!, siteName: e.target.value }))}
                  className="navbar-search-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Site URL</label>
                <input
                  type="url"
                  value={settings.siteUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev!, siteUrl: e.target.value }))}
                  className="navbar-search-input"
                />
              </div>

              <div className="form-group lg:col-span-2">
                <label className="form-label">Site Açıklaması</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev!, siteDescription: e.target.value }))}
                  className="navbar-search-input resize-none"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">İletişim Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev!, contactEmail: e.target.value }))}
                  className="navbar-search-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Site Logo</label>
                <input
                  type="text"
                  value={settings.siteLogo}
                  onChange={(e) => setSettings(prev => ({ ...prev!, siteLogo: e.target.value }))}
                  className="navbar-search-input"
                  placeholder="/path/to/logo.svg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">Sosyal Medya Bağlantıları</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Twitter</label>
                  <input
                    type="url"
                    value={settings.socialLinks.twitter}
                    onChange={(e) => updateNestedSettings('socialLinks', 'twitter', e.target.value)}
                    className="navbar-search-input"
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Facebook</label>
                  <input
                    type="url"
                    value={settings.socialLinks.facebook}
                    onChange={(e) => updateNestedSettings('socialLinks', 'facebook', e.target.value)}
                    className="navbar-search-input"
                    placeholder="https://facebook.com/page"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instagram</label>
                  <input
                    type="url"
                    value={settings.socialLinks.instagram}
                    onChange={(e) => updateNestedSettings('socialLinks', 'instagram', e.target.value)}
                    className="navbar-search-input"
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discord</label>
                  <input
                    type="url"
                    value={settings.socialLinks.discord}
                    onChange={(e) => updateNestedSettings('socialLinks', 'discord', e.target.value)}
                    className="navbar-search-input"
                    placeholder="https://discord.gg/invite"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">SEO Ayarları</h3>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Meta Başlık</label>
                  <input
                    type="text"
                    value={settings.seoSettings.metaTitle}
                    onChange={(e) => updateNestedSettings('seoSettings', 'metaTitle', e.target.value)}
                    className="navbar-search-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Meta Açıklama</label>
                  <textarea
                    value={settings.seoSettings.metaDescription}
                    onChange={(e) => updateNestedSettings('seoSettings', 'metaDescription', e.target.value)}
                    className="navbar-search-input resize-none"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Anahtar Kelimeler</label>
                  <input
                    type="text"
                    value={settings.seoSettings.metaKeywords}
                    onChange={(e) => updateNestedSettings('seoSettings', 'metaKeywords', e.target.value)}
                    className="navbar-search-input"
                    placeholder="manga, webtoon, manhwa"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Settings */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">Site Özellikleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(settings.features).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-light-100 dark:bg-dark-800">
                  <div>
                    <h4 className="font-medium text-dark-950 dark:text-light-50">
                      {key === 'userRegistration' && 'Kullanıcı Kaydı'}
                      {key === 'commentSystem' && 'Yorum Sistemi'}
                      {key === 'ratingSystem' && 'Değerlendirme Sistemi'}
                      {key === 'favoriteSystem' && 'Favori Sistemi'}
                      {key === 'readingHistory' && 'Okuma Geçmişi'}
                      {key === 'notifications' && 'Bildirimler'}
                    </h4>
                    <p className="text-sm text-light-700 dark:text-dark-400">
                      {key === 'userRegistration' && 'Yeni kullanıcıların kayıt olmasına izin ver'}
                      {key === 'commentSystem' && 'Kullanıcıların yorum yapmasına izin ver'}
                      {key === 'ratingSystem' && 'Manga değerlendirme sistemi'}
                      {key === 'favoriteSystem' && 'Favori manga listesi'}
                      {key === 'readingHistory' && 'Okuma geçmişi tutma'}
                      {key === 'notifications' && 'Sistem bildirimleri'}
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateNestedSettings('features', key, e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`toggle-switch ${value ? 'toggle-switch-active' : 'toggle-switch-inactive'}`}>
                      <div className={`toggle-switch-handle ${value ? 'toggle-switch-handle-active' : 'toggle-switch-handle-inactive'}`} />
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Settings */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">İçerik Ayarları</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Sayfa Başına Chapter Sayısı</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.contentSettings.chaptersPerPage}
                  onChange={(e) => updateNestedSettings('contentSettings', 'chaptersPerPage', parseInt(e.target.value))}
                  className="navbar-search-input"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-light-100 dark:bg-dark-800">
                  <div>
                    <h4 className="font-medium text-dark-950 dark:text-light-50">Otomatik Çeviri</h4>
                    <p className="text-sm text-light-700 dark:text-dark-400">AI destekli çeviri sistemi</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.contentSettings.autoTranslate}
                      onChange={(e) => updateNestedSettings('contentSettings', 'autoTranslate', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`toggle-switch ${settings.contentSettings.autoTranslate ? 'toggle-switch-active' : 'toggle-switch-inactive'}`}>
                      <div className={`toggle-switch-handle ${settings.contentSettings.autoTranslate ? 'toggle-switch-handle-active' : 'toggle-switch-handle-inactive'}`} />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-light-100 dark:bg-dark-800">
                  <div>
                    <h4 className="font-medium text-dark-950 dark:text-light-50">Kullanıcı Yüklemeleri</h4>
                    <p className="text-sm text-light-700 dark:text-dark-400">Kullanıcıların içerik yüklemesine izin ver</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.contentSettings.allowUserUploads}
                      onChange={(e) => updateNestedSettings('contentSettings', 'allowUserUploads', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`toggle-switch ${settings.contentSettings.allowUserUploads ? 'toggle-switch-active' : 'toggle-switch-inactive'}`}>
                      <div className={`toggle-switch-handle ${settings.contentSettings.allowUserUploads ? 'toggle-switch-handle-active' : 'toggle-switch-handle-inactive'}`} />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-light-100 dark:bg-dark-800">
                  <div>
                    <h4 className="font-medium text-dark-950 dark:text-light-50">Moderasyon Gerekli</h4>
                    <p className="text-sm text-light-700 dark:text-dark-400">Yeni içeriklerin onay beklemesi</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.contentSettings.moderationRequired}
                      onChange={(e) => updateNestedSettings('contentSettings', 'moderationRequired', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`toggle-switch ${settings.contentSettings.moderationRequired ? 'toggle-switch-active' : 'toggle-switch-inactive'}`}>
                      <div className={`toggle-switch-handle ${settings.contentSettings.moderationRequired ? 'toggle-switch-handle-active' : 'toggle-switch-handle-inactive'}`} />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">Email Ayarları</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">SMTP Host</label>
                <input
                  type="text"
                  value={settings.emailSettings.smtpHost}
                  onChange={(e) => updateNestedSettings('emailSettings', 'smtpHost', e.target.value)}
                  className="navbar-search-input"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Port</label>
                <input
                  type="number"
                  value={settings.emailSettings.smtpPort}
                  onChange={(e) => updateNestedSettings('emailSettings', 'smtpPort', parseInt(e.target.value))}
                  className="navbar-search-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Kullanıcı</label>
                <input
                  type="text"
                  value={settings.emailSettings.smtpUser}
                  onChange={(e) => updateNestedSettings('emailSettings', 'smtpUser', e.target.value)}
                  className="navbar-search-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Şifre</label>
                <input
                  type="password"
                  value={settings.emailSettings.smtpPassword}
                  onChange={(e) => updateNestedSettings('emailSettings', 'smtpPassword', e.target.value)}
                  className="navbar-search-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gönderen Email</label>
                <input
                  type="email"
                  value={settings.emailSettings.fromEmail}
                  onChange={(e) => updateNestedSettings('emailSettings', 'fromEmail', e.target.value)}
                  className="navbar-search-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gönderen Adı</label>
                <input
                  type="text"
                  value={settings.emailSettings.fromName}
                  onChange={(e) => updateNestedSettings('emailSettings', 'fromName', e.target.value)}
                  className="navbar-search-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Maintenance */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">Bakım ve Yönetim</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-6 h-6 text-blue-500" />
                  <h4 className="text-lg font-semibold text-dark-950 dark:text-light-50">Veritabanı</h4>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleBackup}
                    className="btn btn-outline w-full"
                  >
                    <Download className="w-4 h-4" />
                    Yedekleme Al
                  </button>
                  <label className="btn btn-outline w-full cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Yedekleme Yükle
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRestoreBackup(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <RefreshCw className="w-6 h-6 text-green-500" />
                  <h4 className="text-lg font-semibold text-dark-950 dark:text-light-50">Önbellek</h4>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleClearCache}
                    className="btn btn-outline w-full"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Önbellek Temizle
                  </button>
                  <button
                    onClick={handleClearTempFiles}
                    className="btn btn-outline w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Geçici Dosyalar
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200">Tehlikeli İşlemler</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Bu işlemler geri alınamaz. Lütfen dikkatli olun.
                  </p>
                  <div className="mt-3 space-x-2">
                    <button
                      onClick={handleClearLogs}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Tüm Logları Sil
                    </button>
                    <button
                      onClick={handleResetDatabase}
                      className="btn btn-danger btn-sm"
                    >
                      <Database className="w-4 h-4" />
                      Veritabanını Sıfırla
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}