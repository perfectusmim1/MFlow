'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  ShieldCheck,
  Calendar,
  Mail,
  User,
  Crown,
  Ban,
  CheckCircle,
  Clock,
  Download,
  Upload,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/components/providers/NotificationProvider';
import Dropdown from '@/components/ui/Dropdown';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLogin: string;
  favoriteCount: number;
  readingHistory: any[];
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  search: string;
  role: string;
  isActive: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    role: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      // Add individual filter parameters
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive) params.append('isActive', filters.isActive);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Users fetch error:', error);
      showError('Kullanıcı listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        showSuccess(`Kullanıcı ${!currentStatus ? 'aktif edildi' : 'devre dışı bırakıldı'}`);
        fetchUsers();
      } else {
        showError('İşlem gerçekleştirilemedi');
      }
    } catch (error) {
      console.error('Toggle active error:', error);
      showError('İşlem sırasında hata oluştu');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin') => {
    if (!confirm(`Bu kullanıcının rolünü ${newRole === 'admin' ? 'Admin' : 'Kullanıcı'} olarak değiştirmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/change-role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        showSuccess(`Kullanıcı rolü ${newRole === 'admin' ? 'Admin' : 'Kullanıcı'} olarak değiştirildi`);
        fetchUsers();
      } else {
        showError('Rol değiştirilemedi');
      }
    } catch (error) {
      console.error('Change role error:', error);
      showError('Rol değiştirme sırasında hata oluştu');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`"${username}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('Kullanıcı başarıyla silindi');
        fetchUsers();
      } else {
        showError('Kullanıcı silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showError('Silme işlemi sırasında hata oluştu');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) return;
    
    const actionText = action === 'activate' ? 'aktif et' : 
                     action === 'deactivate' ? 'devre dışı bırak' : 'sil';
    
    if (!confirm(`Seçili ${selectedUsers.length} kullanıcıyı ${actionText}mak istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/bulk-action`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userIds: selectedUsers,
          action 
        })
      });

      if (response.ok) {
        showSuccess(`${selectedUsers.length} kullanıcı ${actionText}ldı`);
        setSelectedUsers([]);
        fetchUsers();
      } else {
        showError('Toplu işlem gerçekleştirilemedi');
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      showError('Toplu işlem sırasında hata oluştu');
    }
  };

  const roleLabels = {
    user: 'Kullanıcı',
    admin: 'Admin'
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'status-badge bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'user': return 'status-badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'status-badge';
    }
  };

  if (loading && users.length === 0) {
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
            Kullanıcı Yönetimi
          </h1>
          <p className="text-light-700 dark:text-dark-400">
            Toplam {pagination.total} kullanıcı
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="btn btn-success btn-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aktif Et
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Devre Dışı
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="btn btn-danger btn-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sil ({selectedUsers.length})
              </button>
            </div>
          )}
          
          <Link href="/admin/users/create" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni Kullanıcı
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
                  placeholder="Kullanıcı adı veya email ara..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="navbar-search-input pl-10 pr-10"
                />
                {filters.search && (
                  <button
                    type="button"
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
            
            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <Search className="w-4 h-4" />
              Ara
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-light-200 dark:border-dark-700">
              <Dropdown
                options={[
                  { value: '', label: 'Tüm Roller' },
                  { value: 'user', label: 'Kullanıcı' },
                  { value: 'admin', label: 'Admin' }
                ]}
                value={filters.role}
                onChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
                placeholder="Rol Seç"
              />

              <Dropdown
                options={[
                  { value: '', label: 'Tüm Durumlar' },
                  { value: 'true', label: 'Aktif' },
                  { value: 'false', label: 'Devre Dışı' }
                ]}
                value={filters.isActive}
                onChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
                placeholder="Durum Seç"
              />

              <Dropdown
                options={[
                  { value: 'createdAt', label: 'Kayıt Tarihi' },
                  { value: 'username', label: 'Kullanıcı Adı' },
                  { value: 'email', label: 'Email' },
                  { value: 'lastLogin', label: 'Son Giriş' }
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
        </form>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-100 dark:bg-dark-800 border-b border-light-200 dark:border-dark-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(u => u._id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Kullanıcı
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  İstatistikler
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dark-950 dark:text-light-50">
                  Son Giriş
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-dark-950 dark:text-light-50">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-200 dark:divide-dark-700">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-light-50 dark:hover:bg-dark-800/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, user._id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user._id));
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark-950 dark:text-light-50 truncate">
                          {user.username}
                        </p>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-light-600 dark:text-dark-400" />
                          <span className="text-xs text-light-700 dark:text-dark-400 truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={getRoleColor(user.role)}>
                      {user.role === 'admin' && <Crown className="w-3 h-3 inline mr-1" />}
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user._id, user.isActive)}
                      className={`status-badge cursor-pointer hover:scale-105 transition-transform ${
                        user.isActive 
                          ? 'status-ongoing' 
                          : 'status-cancelled'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <Ban className="w-3 h-3 inline mr-1" />
                          Devre Dışı
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{user.readingHistory?.length || 0} okuma</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{user.favoriteCount || 0} favori</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-light-700 dark:text-dark-400">
                      {user.lastLogin ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(user.lastLogin).toLocaleDateString('tr-TR')}
                          </div>
                          <div>{new Date(user.lastLogin).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : (
                        <span className="text-light-500 dark:text-dark-500">Henüz giriş yapmamış</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleChangeRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                        className="btn btn-ghost btn-sm"
                        title={user.role === 'admin' ? 'Kullanıcı Yap' : 'Admin Yap'}
                      >
                        {user.role === 'admin' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <Link
                        href={`/admin/users/${user._id}/edit`}
                        className="btn btn-ghost btn-sm"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(user._id, user.username)}
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

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-light-400 dark:text-dark-600 mx-auto mb-4" />
            <p className="text-light-700 dark:text-dark-400">Henüz kullanıcı bulunamadı</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-light-700 dark:text-dark-400">
            Sayfa {pagination.page} / {pagination.pages} ({pagination.total} kullanıcı)
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