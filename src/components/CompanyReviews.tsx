import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, TrendingUp, User, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { StarRating } from './StarRating';
import { ReviewForm } from './ReviewForm';
import { reviewsApi } from '../services/api/reviews';
import { useAuth } from '../contexts/AuthContext';
import type { CompanyReview, CompanyRatingStats } from '../types/database';

interface CompanyReviewsProps {
  companyId: string;
  companyName: string;
}

export const CompanyReviews: React.FC<CompanyReviewsProps> = ({ companyId, companyName }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [stats, setStats] = useState<CompanyRatingStats | null>(null);
  const [userReview, setUserReview] = useState<CompanyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      // Her sorguyu bağımsız try-catch ile yap, biri patlarsa diğerleri çalışsın
      let reviewsData: CompanyReview[] = [];
      let statsData: CompanyRatingStats = { avg_rating: 0, total_reviews: 0, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0 };

      try { reviewsData = await reviewsApi.getApprovedReviews(companyId); } catch (e) { console.warn('Reviews fetch failed:', e); }
      try { statsData = await reviewsApi.getRatingStats(companyId); } catch (e) { console.warn('Stats fetch failed:', e); }

      setReviews(reviewsData);
      setStats(statsData);

      if (user) {
        try {
          const existing = await reviewsApi.getUserReview(companyId, user.id);
          setUserReview(existing);
        } catch (e) { console.warn('User review check failed:', e); }
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getRatingPercentage = (count: number) => {
    if (!stats || stats.total_reviews === 0) return 0;
    return Math.round((count / stats.total_reviews) * 100);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare size={24} className="text-primary-500" />
          Kullanıcı Değerlendirmeleri
        </h2>
        {!userReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Değerlendir
          </button>
        )}
      </div>

      {/* Rating Summary */}
      {stats && stats.total_reviews > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Big Rating */}
            <div className="flex flex-col items-center justify-center min-w-[140px]">
              <div className="text-5xl font-bold text-gray-900 dark:text-white">
                {stats.avg_rating}
              </div>
              <StarRating rating={Number(stats.avg_rating)} size={20} className="mt-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stats.total_reviews} değerlendirme
              </p>
            </div>

            {/* Rating Bars */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats[`rating_${star}` as keyof CompanyRatingStats] as number;
                const pct = getRatingPercentage(count);
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
                      {star}
                    </span>
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* No Reviews */}
      {stats && stats.total_reviews === 0 && !showForm && (
        <div className="bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-8 text-center">
          <Star size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            Henüz değerlendirme yapılmamış. İlk değerlendiren siz olun!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Değerlendirme Yap
          </button>
        </div>
      )}

      {/* Review Form */}
      {(showForm || userReview) && (
        <ReviewForm
          companyId={companyId}
          companyName={companyName}
          existingReview={userReview}
          onReviewSubmitted={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <User size={20} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {review.user_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size={14} />
                      <span className="text-xs text-gray-400">{review.rating}/5</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  {formatDate(review.created_at)}
                </div>
              </div>

              {/* Title */}
              {review.title && (
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {review.title}
                </h4>
              )}

              {/* Comment */}
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3">
                {review.comment}
              </p>

              {/* Pros & Cons */}
              {(review.pros || review.cons) && (
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {review.pros && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-green-700 dark:text-green-400 text-xs font-semibold mb-1">
                        <ThumbsUp size={12} /> Artılar
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-300">{review.pros}</p>
                    </div>
                  )}
                  {review.cons && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-red-700 dark:text-red-400 text-xs font-semibold mb-1">
                        <ThumbsDown size={12} /> Eksiler
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-300">{review.cons}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
