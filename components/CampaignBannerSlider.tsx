import React, { useState, useEffect, useCallback } from 'react';
import { campaignBannersApi, CampaignBanner } from '../src/services/api/campaignBanners';

export const CampaignBannerSlider: React.FC = () => {
    const [banners, setBanners] = useState<CampaignBanner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBanners = async () => {
            const data = await campaignBannersApi.getActiveBanners();
            setBanners(data);
            setLoading(false);
        };
        loadBanners();
    }, []);

    // Auto-slide every 3 seconds
    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [banners.length]);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    // Don't render if no banners
    if (loading || banners.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 mb-4">
            {/* Title */}
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                İlginizi çekebilecek içerikler
            </p>

            {/* Banner Container - 1200x252 aspect ratio */}
            <div
                className="relative w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800"
                style={{ aspectRatio: '1200 / 252' }}
            >
                {/* Slides */}
                <div
                    className="flex h-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {banners.map((banner) => (
                        <div key={banner.id} className="w-full h-full flex-shrink-0">
                            {banner.link_url ? (
                                <a
                                    href={banner.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full h-full"
                                >
                                    <img
                                        src={banner.image_url}
                                        alt={banner.title || 'Banner'}
                                        className="w-full h-full object-cover"
                                    />
                                </a>
                            ) : (
                                <img
                                    src={banner.image_url}
                                    alt={banner.title || 'Banner'}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Dots Navigation */}
            {banners.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-primary-600 w-6'
                                : 'bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500'
                                }`}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CampaignBannerSlider;
