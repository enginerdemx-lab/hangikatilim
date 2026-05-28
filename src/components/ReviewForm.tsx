import React, { useState } from 'react';
import { Send, Eye, EyeOff, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle, Loader2, X, Star } from 'lucide-react';
import { StarRating } from './StarRating';
import { reviewsApi } from '../services/api/reviews';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface ReviewFormProps {
  companyId: string;
  companyName: string;
  existingReview?: any;
  onReviewSubmitted: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  companyId,
  companyName,
  existingReview,
  onReviewSubmitted,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [pros, setPros] = useState(existingReview?.pros || '');
  const [cons, setCons] = useState(existingReview?.cons || '');
  const [isAnonymous, setIsAnonymous] = useState(existingReview?.is_anonymous || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!user) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          Değerlendirme yapmak için giriş yapmanız gerekiyor.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  if (existingReview && existingReview.status !== 'pending') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={20} className="text-green-600" />
          <span className="font-semibold text-green-800 dark:text-green-300">
            Değerlendirmeniz {existingReview.status === 'approved' ? 'onaylandı' : 'incelendi'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={existingReview.rating} size={16} />
          <span className="text-sm text-gray-500">{existingReview.rating}/5</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{existingReview.comment}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Lütfen bir puan seçin.');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Yorumunuz en az 10 karakter olmalıdır.');
      return;
    }

    try {
      setLoading(true);

      if (existingReview) {
        await reviewsApi.updateReview(existingReview.id, {
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          pros: pros.trim() || undefined,
          cons: cons.trim() || undefined,
          is_anonymous: isAnonymous,
        });
      } else {
        await reviewsApi.addReview({
          company_id: companyId,
          user_id: user.id,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          pros: pros.trim() || undefined,
          cons: cons.trim() || undefined,
          is_anonymous: isAnonymous,
        });
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    onReviewSubmitted();
  };

  return (
    <>
      {/* Success Modal / Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseSuccess}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-white" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Değerlendirmeniz Alındı!
            </h3>

            {/* Rating Display */}
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={24}
                  className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                />
              ))}
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-2">
              <strong className="text-gray-900 dark:text-white">{companyName}</strong> hakkındaki değerlendirmeniz başarıyla gönderildi.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              Yorumunuz ekibimiz tarafından incelendikten sonra yayınlanacaktır. Teşekkür ederiz!
            </p>

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Yorumlar genellikle 24 saat içinde incelenir ve onaylanır.
              </p>
            </div>

            {/* Button */}
            <button
              onClick={handleCloseSuccess}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {companyName} Hakkında Değerlendirmeniz
        </h3>

        {/* Rating */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Puanınız *
          </label>
          <StarRating rating={rating} interactive onChange={setRating} size={32} />
          {rating > 0 && (
            <span className="ml-3 text-sm text-gray-500">
              {rating === 1 && 'Çok Kötü'}
              {rating === 2 && 'Kötü'}
              {rating === 3 && 'Orta'}
              {rating === 4 && 'İyi'}
              {rating === 5 && 'Mükemmel'}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Başlık <span className="text-gray-400">(opsiyonel)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Değerlendirmenizi özetleyin..."
            maxLength={200}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Comment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Yorumunuz *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Deneyiminizi paylaşın... (en az 10 karakter)"
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">{comment.length} karakter</div>
        </div>

        {/* Pros & Cons */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-400 mb-1">
              <ThumbsUp size={14} /> Artıları <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <textarea
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              placeholder="Beğendiğiniz yönler..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-400 mb-1">
              <ThumbsDown size={14} /> Eksileri <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <textarea
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              placeholder="Geliştirilmesi gereken yönler..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
              isAnonymous
                ? 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {isAnonymous ? <EyeOff size={16} /> : <Eye size={16} />}
            {isAnonymous ? 'Anonim olarak paylaş' : 'İsminizle paylaşılacak'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          {loading ? 'Gönderiliyor...' : existingReview ? 'Güncelle' : 'Değerlendirmeyi Gönder'}
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
          Yorumunuz moderasyon sonrası yayınlanacaktır.
        </p>
      </form>
    </>
  );
};
