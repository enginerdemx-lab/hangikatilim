import React, { useState, useEffect } from 'react';
import {
    Users as UsersIcon,
    Search,
    Filter,
    Download,
    MoreVertical,
    Ban,
    UserCheck,
    UserX,
    Eye,
    Trash2,
    RefreshCw,
    Calendar,
    Mail,
    Phone,
    Clock,
    Activity,
    ChevronLeft,
    ChevronRight,
    X,
    AlertTriangle,
    CheckCircle,
    XCircle,
    History
} from 'lucide-react';
import { adminUserService, AdminUser, LoginLog, UserFilters } from '../../services/api/adminUserService';

export const Users: React.FC = () => {
    // State
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [filters, setFilters] = useState<UserFilters>({ status: 'all' });
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal states
    const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
    const [banModalUser, setBanModalUser] = useState<AdminUser | null>(null);
    const [banReason, setBanReason] = useState('');
    const [loginHistory, setLoginHistory] = useState<LoginLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        banned: 0,
        todayLogins: 0
    });

    // Edit State
    const [editForm, setEditForm] = useState<any>({});
    const [isEditing, setIsEditing] = useState(false);

    // Load users
    useEffect(() => {
        loadUsers();
        loadStats();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await adminUserService.getAllUsers(filters);
            setUsers(data);
        } catch (error) {
            console.error('Load users error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await adminUserService.getStatistics();
            setStats(data);
        } catch (error) {
            console.error('Load stats error:', error);
        }
    };

    // Filter users by search
    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            user.full_name?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search) ||
            user.phone?.includes(search) ||
            user.member_number?.toString().includes(search)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handlers
    const handleSelectAll = () => {
        if (selectedUsers.length === paginatedUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(paginatedUsers.map(u => u.id));
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleExportExcel = async () => {
        try {
            const usersToExport = selectedUsers.length > 0
                ? users.filter(u => selectedUsers.includes(u.id))
                : filteredUsers;

            const blob = await adminUserService.exportToExcel(usersToExport);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `uyeler_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert('Dışa aktarma başarısız oldu');
        }
    };

    const handleBanUser = async () => {
        if (!banModalUser || !banReason.trim()) return;

        try {
            await adminUserService.banUser(banModalUser.id, banReason);
            alert('Kullanıcı banlandı');
            setBanModalUser(null);
            setBanReason('');
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Ban error:', error);
            alert('İşlem başarısız oldu');
        }
    };

    const handleUnbanUser = async (userId: string) => {
        if (!confirm('Bu kullanıcının banını kaldırmak istediğinize emin misiniz?')) return;

        try {
            await adminUserService.unbanUser(userId);
            alert('Ban kaldırıldı');
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Unban error:', error);
            alert('İşlem başarısız oldu');
        }
    };

    const handleToggleStatus = async (user: AdminUser) => {
        try {
            if (user.status === 'active') {
                await adminUserService.setUserInactive(user.id);
            } else if (user.status === 'inactive') {
                await adminUserService.setUserActive(user.id);
            }
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Toggle status error:', error);
            alert('İşlem başarısız oldu');
        }
    };

    const handleHardDeleteUser = async (userId: string) => {
        if (!confirm('DİKKAT: Bu üyeyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;

        try {
            await adminUserService.hardDeleteUser(userId);
            alert('Üye kalıcı olarak silindi.');
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Silme işlemi başarısız oldu. Yetkiniz olmayabilir.');
        }
    };

    const handleViewDetails = async (user: AdminUser) => {
        setDetailUser(user);
        setEditForm({
            full_name: user.full_name,
            phone: user.phone,
            education_level: user.education_level,
            employment_status: user.employment_status,
            profession: user.profession,
            work_experience: user.work_experience,
            monthly_income: user.monthly_income,
            has_rent: user.has_rent,
            rent_amount: user.rent_amount,
            preferred_finance_company: user.preferred_finance_company,
            gender: user.gender
        });
        setIsEditing(false);
        setLoadingHistory(true);
        try {
            const history = await adminUserService.getUserLoginHistory(user.id);
            setLoginHistory(history);
        } catch (error) {
            console.error('Load history error:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!detailUser) return;

        try {
            await adminUserService.updateUser(detailUser.id, editForm);
            // Update local state
            const updatedUser = { ...detailUser, ...editForm };
            setUsers(users.map(u => u.id === detailUser.id ? updatedUser : u));
            setDetailUser(updatedUser);
            setIsEditing(false);
            alert('Kullanıcı bilgileri güncellendi!');
        } catch (error) {
            console.error('Update error:', error);
            alert('Güncelleme sırasında bir hata oluştu.');
        }
    };

    const handleRemoveAvatar = async () => {
        if (!detailUser) return;
        if (!confirm('Profil fotoğrafını kaldırmak istediğinize emin misiniz?')) return;

        try {
            await adminUserService.removeAvatar(detailUser.id);
            // Update local state
            const updatedUser = { ...detailUser, avatar_url: null };
            setUsers(users.map(u => u.id === detailUser.id ? updatedUser : u));
            setDetailUser(updatedUser);
            alert('Profil fotoğrafı kaldırıldı.');
        } catch (error) {
            console.error('Remove avatar error:', error);
            alert('Fotoğraf kaldırılırken bir hata oluştu.');
        }
    };

    const getStatusBadge = (status: string, emailConfirmedAt?: string | null) => {
        if (status === 'banned') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    <Ban size={12} /> Banlı
                </span>
            );
        }

        if (!emailConfirmedAt) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                    <Clock size={12} /> Onay Bekliyor
                </span>
            );
        }

        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <CheckCircle size={12} /> Aktif
                    </span>
                );
            case 'inactive':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                        <XCircle size={12} /> Pasif
                    </span>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UsersIcon className="text-blue-600" /> Üye Yönetimi
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Toplam {stats.total} üye kayıtlı
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadUsers}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Yenile"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        <Download size={18} />
                        Excel'e Aktar
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Toplam Üye</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    <div className="text-sm text-gray-500">Aktif</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
                    <div className="text-sm text-gray-500">Pasif</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-red-600">{stats.banned}</div>
                    <div className="text-sm text-gray-500">Banlı</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">{stats.todayLogins}</div>
                    <div className="text-sm text-gray-500">Bugün Giriş</div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="İsim, e-posta, telefon veya üye no ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status || 'all'}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                        <option value="banned">Banlı</option>
                    </select>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter size={18} />
                        Filtreler
                    </button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kayıt Tarihi (Başlangıç)</label>
                            <input
                                type="date"
                                value={filters.dateFrom || ''}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kayıt Tarihi (Bitiş)</label>
                            <input
                                type="date"
                                value={filters.dateTo || ''}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ status: 'all' });
                                    setSearchTerm('');
                                    loadUsers();
                                }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Filtreleri Temizle
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Üye No</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Ad Soyad</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">E-posta</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Telefon</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Kayıt Tarihi</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Son Giriş</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Giriş</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">SON IP</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Durum</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-gray-500">
                                        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-gray-500">
                                        Üye bulunamadı
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="p-4 font-mono text-sm font-bold text-gray-900">
                                            #{user.member_number}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {user.full_name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <span className="font-medium text-gray-900">{user.full_name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="p-4 text-sm text-gray-600">{user.phone || '-'}</td>
                                        <td className="p-4 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                                        <td className="p-4 text-sm text-gray-600">{formatDate(user.last_login_at)}</td>

                                        <td className="p-4 text-sm text-gray-900 font-medium">{user.login_count || 0}</td>
                                        <td className="p-4 text-sm text-gray-500 font-mono">{(user as any).last_sign_in_ip || '-'}</td>
                                        <td className="p-4">{getStatusBadge(user.status, (user as any).email_confirmed_at)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleViewDetails(user)}
                                                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                                    title="Detaylar"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {user.status === 'banned' ? (
                                                    <button
                                                        onClick={() => handleUnbanUser(user.id)}
                                                        className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                                                        title="Banı Kaldır"
                                                    >
                                                        <UserCheck size={16} />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleToggleStatus(user)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                                                            title={user.status === 'active' ? 'Pasife Al' : 'Aktife Al'}
                                                        >
                                                            {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setBanModalUser(user)}
                                                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                                            title="Banla"
                                                        >
                                                            <Ban size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleHardDeleteUser(user.id)}
                                                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-700 bg-red-50 border border-red-200 ml-1"
                                                            title="Kalıcı Olarak Sil"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Toplam {filteredUsers.length} üyeden {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} arası gösteriliyor
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Detail Modal */}
            {
                detailUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {isEditing ? 'Üye Düzenle' : 'Üye Detayları'}
                                </h2>
                                <div className="flex items-center gap-2">
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                                        >
                                            Düzenle
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                                            >
                                                İptal
                                            </button>
                                            <button
                                                onClick={handleUpdateUser}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                            >
                                                Kaydet
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setDetailUser(null)}
                                        className="p-2 hover:bg-gray-100 rounded-lg ml-2"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                {/* User Info & Avatar */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="relative">
                                        {detailUser.avatar_url ? (
                                            <img
                                                src={detailUser.avatar_url}
                                                alt="Avatar"
                                                className="w-20 h-20 rounded-full object-cover border-4 border-blue-50"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                                                {detailUser.full_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}

                                        {/* Remove Avatar Button */}
                                        {detailUser.avatar_url && (
                                            <button
                                                onClick={handleRemoveAvatar}
                                                className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-sm border border-white"
                                                title="Fotoğrafı Kaldır"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editForm.full_name || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                                                    placeholder="Ad Soyad"
                                                />
                                                <div className="text-sm text-gray-500">Üye #{detailUser.member_number}</div>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-xl font-bold text-gray-900">{detailUser.full_name || 'İsimsiz'}</h3>
                                                <p className="text-gray-500">Üye #{detailUser.member_number}</p>
                                            </>
                                        )}
                                        <div className="mt-1">{getStatusBadge(detailUser.status)}</div>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                            <Mail size={14} /> E-posta
                                        </div>
                                        <div className="font-medium text-gray-900">{detailUser.email}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                            <Phone size={14} /> Telefon
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.phone || ''}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="w-full px-2 py-1 border rounded bg-white"
                                            />
                                        ) : (
                                            <div className="font-medium text-gray-900">{detailUser.phone || '-'}</div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                            <Calendar size={14} /> Kayıt Tarihi
                                        </div>
                                        <div className="font-medium text-gray-900">{formatDate(detailUser.created_at)}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                            <Activity size={14} /> Toplam Giriş
                                        </div>
                                        <div className="font-medium text-gray-900">{detailUser.login_count || 0}</div>
                                    </div>
                                </div>

                                {/* Genel Bilgiler Editable Section */}
                                <div className="mb-6">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        📋 Genel Bilgiler
                                    </h4>
                                    {isEditing ? (
                                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="text-xs text-blue-600 block mb-1">Eğitim Durumu</label>
                                                <input
                                                    type="text"
                                                    value={editForm.education_level || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, education_level: e.target.value })}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="text-xs text-blue-600 block mb-1">Çalışma Durumu</label>
                                                <input
                                                    type="text"
                                                    value={editForm.employment_status || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, employment_status: e.target.value })}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="text-xs text-blue-600 block mb-1">Meslek</label>
                                                <input
                                                    type="text"
                                                    value={editForm.profession || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="text-xs text-blue-600 block mb-1">Aylık Gelir</label>
                                                <input
                                                    type="text"
                                                    value={editForm.monthly_income || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, monthly_income: e.target.value })}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.has_rent || false}
                                                        onChange={(e) => setEditForm({ ...editForm, has_rent: e.target.checked })}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <span className="text-sm font-medium">Kira Gideri Var mı?</span>
                                                </label>
                                                {editForm.has_rent && (
                                                    <input
                                                        type="number"
                                                        value={editForm.rent_amount || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, rent_amount: parseInt(e.target.value) || 0 })}
                                                        placeholder="Kira Tutarı"
                                                        className="w-full px-2 py-1 border rounded text-sm"
                                                    />
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs text-purple-600 block mb-1">Tercih Ettiği Finansman Şirketi</label>
                                                <input
                                                    type="text"
                                                    value={editForm.preferred_finance_company || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, preferred_finance_company: e.target.value })}
                                                    className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {detailUser.education_level && (
                                                <div className="p-3 bg-blue-50 rounded-lg">
                                                    <div className="text-xs text-blue-600 mb-1">Eğitim Durumu</div>
                                                    <div className="font-medium text-gray-900">{detailUser.education_level}</div>
                                                </div>
                                            )}
                                            {detailUser.employment_status && (
                                                <div className="p-3 bg-blue-50 rounded-lg">
                                                    <div className="text-xs text-blue-600 mb-1">Çalışma Durumu</div>
                                                    <div className="font-medium text-gray-900">{detailUser.employment_status}</div>
                                                </div>
                                            )}
                                            {/* ... (Other existing fields) ... */}
                                            <div className="p-3 bg-orange-50 rounded-lg col-span-2">
                                                <div className="text-xs text-orange-600 mb-1">Genel Bilgiler</div>
                                                <div className="font-medium text-gray-900 text-sm">
                                                    Diğer bilgiler için "Düzenle" moduna geçiniz.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Login History */}
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <History size={16} /> Giriş Geçmişi
                                    </h4>
                                    {loadingHistory ? (
                                        <div className="p-4 text-center text-gray-500">
                                            <RefreshCw className="animate-spin mx-auto" size={20} />
                                        </div>
                                    ) : loginHistory.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Henüz giriş kaydı yok</p>
                                    ) : (
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {loginHistory.slice(0, 10).map((log) => (
                                                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium">{log.browser} / {log.os}</span>
                                                        <span className="text-gray-500">{log.device_type}</span>
                                                    </div>
                                                    <span className="text-gray-500">{formatDate(log.logged_in_at)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Ban Modal */}
            {
                banModalUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                    <Ban size={20} /> Kullanıcıyı Banla
                                </h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 mb-4">
                                    <strong>{banModalUser.full_name || banModalUser.email}</strong> kullanıcısını banlamak istediğinize emin misiniz?
                                </p>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ban Sebebi *
                                    </label>
                                    <textarea
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                        placeholder="Ban sebebini yazın..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setBanModalUser(null);
                                            setBanReason('');
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleBanUser}
                                        disabled={!banReason.trim()}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Banla
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Users;
