import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Send, X, MessageCircle, Loader2, CheckCircle } from 'lucide-react';
import { testimonialsApi, type TestimonialFormData } from '../services/api/testimonials';
import { siteSettingsApi } from '../services/api/siteSettings';
import { supabase } from '../services/supabaseClient';
import type { Testimonial } from '../types/database';

// Star Rating Component
const StarRating: React.FC<{
    value: number;
    onChange?: (val: number) => void;
    readonly?: boolean;
    size?: number;
}> = ({ value, onChange, readonly = false, size = 18 }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => !readonly && setHover(0)}
                    className={`transition-all duration-150 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                >
                    <Star
                        size={size}
                        className={`transition-colors ${(hover || value) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-transparent text-gray-300'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
};

// Testimonial Card
const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col h-full">
        {/* Stars */}
        <div className="mb-4">
            <StarRating value={testimonial.rating} readonly size={16} />
        </div>

        {/* Comment */}
        <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed flex-1 italic">
            "{testimonial.comment}"
        </p>

        {/* User Info */}
        <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {testimonial.user_name.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {testimonial.user_name}
                </p>
                {testimonial.user_city && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        📍 {testimonial.user_city}
                    </p>
                )}
            </div>
        </div>
    </div>
);

// Review Submit Modal
const ReviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TestimonialFormData) => Promise<void>;
    userName: string;
}> = ({ isOpen, onClose, onSubmit, userName }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || rating === 0) return;

        setLoading(true);
        try {
            await onSubmit({
                user_name: userName,
                user_city: city,
                rating,
                comment: comment.trim(),
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setComment('');
                setCity('');
                setRating(5);
            }, 2000);
        } catch (err) {
            console.error('Review submit error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        ⭐ Deneyiminizi Paylaşın
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Yorumunuz Alındı!
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Yorumunuz onaylandıktan sonra yayınlanacaktır.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Puanınız
                            </label>
                            <StarRating value={rating} onChange={setRating} size={28} />
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Şehir <span className="text-gray-400">(opsiyonel)</span>
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="İstanbul"
                                maxLength={100}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Yorumunuz
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Deneyiminizi bizimle paylaşın..."
                                rows={4}
                                maxLength={500}
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1 text-right">
                                {comment.length}/500
                            </p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !comment.trim() || rating === 0}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                            {loading ? 'Gönderiliyor...' : 'Yorumu Gönder'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

// Main Component
const TestimonialsCarousel: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState('');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Items per view based on screen size
    const getItemsPerView = useCallback(() => {
        if (typeof window === 'undefined') return 1;
        if (window.innerWidth >= 1024) return 3;
        if (window.innerWidth >= 640) return 2;
        return 1;
    }, []);

    const [itemsPerView, setItemsPerView] = useState(getItemsPerView());

    useEffect(() => {
        const handleResize = () => setItemsPerView(getItemsPerView());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [getItemsPerView]);

    // Load data
    useEffect(() => {
        const load = async () => {
            try {
                // Check if enabled
                const settings = await siteSettingsApi.getSettings();
                if (settings?.testimonials_enabled === false) {
                    setEnabled(false);
                    setLoading(false);
                    return;
                }

                // Load testimonials
                const data = await testimonialsApi.getApproved();
                setTestimonials(data);

                // Check if user is logged in
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı');
                }
            } catch (err) {
                console.error('Testimonials load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Auto-slide
    const maxIndex = Math.max(0, testimonials.length - itemsPerView);

    useEffect(() => {
        if (testimonials.length <= itemsPerView) return;

        intervalRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, 5000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [testimonials.length, itemsPerView, maxIndex]);

    const goTo = (direction: 'prev' | 'next') => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setCurrentIndex((prev) => {
            if (direction === 'prev') return prev <= 0 ? maxIndex : prev - 1;
            return prev >= maxIndex ? 0 : prev + 1;
        });
    };

    const handleSubmitReview = async (data: TestimonialFormData) => {
        if (!userId) return;
        await testimonialsApi.submit(userId, data);
    };

    if (!enabled || loading) return null;
    if (testimonials.length === 0 && !userId) return null;

    return (
        <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium mb-4">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        Kullanıcı Değerlendirmeleri
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Kullanıcılarımız Ne Diyor?
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
                        Binlerce kullanıcımızın deneyimlerini keşfedin
                    </p>
                </div>

                {/* Carousel */}
                {testimonials.length > 0 ? (
                    <div className="relative">
                        {/* Navigation Arrows */}
                        {testimonials.length > itemsPerView && (
                            <>
                                <button
                                    onClick={() => goTo('prev')}
                                    className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-slate-700 rounded-full shadow-lg border border-gray-200 dark:border-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all hover:scale-110"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => goTo('next')}
                                    className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-slate-700 rounded-full shadow-lg border border-gray-200 dark:border-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all hover:scale-110"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}

                        {/* Cards Container */}
                        <div className="overflow-hidden mx-2 sm:mx-6">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{
                                    transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                                }}
                            >
                                {testimonials.map((t) => (
                                    <div
                                        key={t.id}
                                        className="flex-shrink-0 px-2 sm:px-3"
                                        style={{ width: `${100 / itemsPerView}%` }}
                                    >
                                        <TestimonialCard testimonial={t} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dots */}
                        {testimonials.length > itemsPerView && (
                            <div className="flex justify-center gap-1.5 mt-8">
                                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (intervalRef.current) clearInterval(intervalRef.current);
                                            setCurrentIndex(i);
                                        }}
                                        className={`h-2 rounded-full transition-all duration-300 ${currentIndex === i
                                            ? 'w-8 bg-blue-600'
                                            : 'w-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            Henüz onaylanmış yorum bulunmuyor.
                        </p>
                    </div>
                )}

                {/* CTA - Write Review */}
                {userId && (
                    <div className="text-center mt-10">
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300 rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <MessageCircle size={18} />
                            Yorum Yap
                        </button>
                    </div>
                )}

                {/* Review Modal */}
                <ReviewModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmitReview}
                    userName={userName}
                />
            </div>
        </section>
    );
};

export default TestimonialsCarousel;
