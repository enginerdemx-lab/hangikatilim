import React, { useState, useEffect } from 'react';
import {
  MessageSquare, CheckCircle, XCircle, Clock, Trash2, Star,
  Search, Building2, User, Loader2, ThumbsUp, ThumbsDown,
  AlertTriangle, BarChart3
} from 'lucide-react';
import { reviewsApi } from '../../services/api/reviews';
import type { CompanyReview } from '../../types/database';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewsApi.getAllReviews(
        filterStatus === 'all' ? undefined : filterStatus
      );
      setReviews(data);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [filterStatus]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await reviewsApi.updateReviewStatus(id, 'approved');
      showToast('Yorum onaylandı!', 'success');
      await loadReviews();
    } catch (err) {
      showToast('Onaylama başarısız', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      await reviewsApi.updateReviewStatus(id, 'rejected', rejectNote || undefined);
      setRejectingId(null);
      setRejectNote('');
      showToast('Yorum reddedildi', 'success');
      await loadReviews();
    } catch (err) {
      showToast('İşlem başarısız', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu yorumu kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      setActionLoading(id);
      await reviewsApi.adminDeleteReview(id);
      showToast('Yorum silindi', 'success');
      await loadReviews();
    } catch (err) {
      showToast('Silme başarısız', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.comment?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q) ||
      r.company_name?.toLowerCase().includes(q) ||
      r.user_name?.toLowerCase().includes(q)
    );
  });

  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const approvedCount = reviews.filter(r => r.status === 'approved').length;
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-600'}
        />
      ))}
    </div>
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <MessageSquare size={28} className="text-primary-600" />
          Değerlendirme Yönetimi
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Kullanıcı yorumlarını inceleyin, onaylayın veya reddedin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviews.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Toplam</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('pending')}
          className={`rounded-2xl p-5 border shadow-sm cursor-pointer transition-all ${
            filterStatus === 'pending'
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 ring-2 ring-amber-200 dark:ring-amber-700'
              : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Bekleyen</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
          )}
        </div>

        <div
          onClick={() => setFilterStatus('approved')}
          className={`rounded-2xl p-5 border shadow-sm cursor-pointer transition-all ${
            filterStatus === 'approved'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 ring-2 ring-green-200 dark:ring-green-700'
              : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{approvedCount}</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Onaylı</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('rejected')}
          className={`rounded-2xl p-5 border shadow-sm cursor-pointer transition-all ${
            filterStatus === 'rejected'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 ring-2 ring-red-200 dark:ring-red-700'
              : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <XCircle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{rejectedCount}</p>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">Reddedilen</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Star size={20} className="text-amber-500 fill-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ort. Puan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Yorum, firma veya kullanıcı ara..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {([
              { key: 'all' as FilterStatus, label: 'Tümü', count: reviews.length },
              { key: 'pending' as FilterStatus, label: 'Bekleyen', count: pendingCount },
              { key: 'approved' as FilterStatus, label: 'Onaylı', count: approvedCount },
              { key: 'rejected' as FilterStatus, label: 'Reddedilen', count: rejectedCount },
            ]).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  filterStatus === key
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-md ${
                    filterStatus === key ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary-600 mb-4" />
          <p className="text-gray-500 text-sm">Yorumlar yükleniyor...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredReviews.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-gray-400 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">Yorum Bulunamadı</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Arama kriterlerinize uygun yorum yok.' : 'Bu filtrede henüz yorum bulunmuyor.'}
          </p>
        </div>
      )}

      {/* Review Cards */}
      {!loading && filteredReviews.length > 0 && (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const isActioning = actionLoading === review.id;

            return (
              <div
                key={review.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  review.status === 'pending'
                    ? 'border-amber-200 dark:border-amber-800/50'
                    : review.status === 'approved'
                      ? 'border-gray-100 dark:border-slate-700'
                      : 'border-red-100 dark:border-red-900/30'
                }`}
              >
                {/* Status top bar */}
                {review.status === 'pending' && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 px-5 py-2 flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold border-b border-amber-100 dark:border-amber-800/30">
                    <Clock size={13} />
                    Onay bekliyor - {formatDate(review.created_at)} {formatTime(review.created_at)}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Company Logo */}
                    <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {review.company_logo_url ? (
                        <img src={review.company_logo_url} alt="" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Building2 size={22} className="text-gray-400 dark:text-slate-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Company + Stars */}
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {review.company_name || 'Bilinmeyen Firma'}
                        </h3>

                        {review.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold border border-green-100 dark:border-green-800/30">
                            <CheckCircle size={11} /> Onaylı
                          </span>
                        )}
                        {review.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-100 dark:border-red-800/30">
                            <XCircle size={11} /> Reddedildi
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          {renderStars(review.rating)}
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{review.rating}/5</span>
                        </div>
                      </div>

                      {/* User */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <User size={12} />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{review.user_name}</span>
                        {review.is_anonymous && (
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded text-[10px] font-medium">anonim</span>
                        )}
                        <span className="text-gray-300 dark:text-slate-600">|</span>
                        <span>{formatDate(review.created_at)} {formatTime(review.created_at)}</span>
                      </div>

                      {/* Title */}
                      {review.title && (
                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                          {review.title}
                        </p>
                      )}

                      {/* Comment */}
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Pros & Cons */}
                      {(review.pros || review.cons) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {review.pros && (
                            <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20 rounded-xl px-3 py-2.5">
                              <ThumbsUp size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">{review.pros}</p>
                            </div>
                          )}
                          {review.cons && (
                            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20 rounded-xl px-3 py-2.5">
                              <ThumbsDown size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{review.cons}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin Note */}
                      {review.admin_note && (
                        <div className="flex items-start gap-2 mt-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 rounded-xl px-3 py-2.5">
                          <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 font-bold uppercase tracking-wider mb-0.5">Admin Notu</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">{review.admin_note}</p>
                          </div>
                        </div>
                      )}

                      {/* Reject note input */}
                      {rejectingId === review.id && (
                        <div className="mt-4 bg-gray-50 dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2">
                            Reddetme Sebebi (opsiyonel)
                          </label>
                          <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Kullanıcıya gösterilecek sebep..."
                            rows={2}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleReject(review.id)}
                              disabled={isActioning}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isActioning ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                              Reddet
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectNote(''); }}
                              className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                            >
                              Vazgeç
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {rejectingId !== review.id && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 ml-[72px]">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                          >
                            {isActioning ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                            Onayla
                          </button>
                          <button
                            onClick={() => setRejectingId(review.id)}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 border border-red-200 dark:border-red-800/30"
                          >
                            <XCircle size={13} /> Reddet
                          </button>
                        </>
                      )}
                      {review.status === 'approved' && (
                        <button
                          onClick={() => setRejectingId(review.id)}
                          disabled={isActioning}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 border border-amber-200 dark:border-amber-800/30"
                        >
                          <XCircle size={13} /> Onayı Geri Al
                        </button>
                      )}
                      {review.status === 'rejected' && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          disabled={isActioning}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {isActioning ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                          Onayla
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 px-3 py-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs rounded-lg transition-all disabled:opacity-50"
                      >
                        <Trash2 size={13} /> Sil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
