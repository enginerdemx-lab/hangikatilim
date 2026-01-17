import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { popupApi, Popup } from '../services/popupApi';

interface PopupContextType {
    activePopups: Popup[];
    dismissPopup: (id: string) => void;
    refreshPopups: () => void;
}

const PopupContext = createContext<PopupContextType>({
    activePopups: [],
    dismissPopup: () => { },
    refreshPopups: () => { },
});

export const usePopups = () => useContext(PopupContext);

// Check if popup should be shown based on localStorage (daily reset)
const shouldShowPopup = (popup: Popup): boolean => {
    // If show_once_per_session is explicitly false or undefined, always show
    if (popup.show_once_per_session === false) {
        console.log('[PopupProvider] Popup allows multiple shows:', popup.id);
        return true;
    }

    const key = `popup_shown_${popup.id}`;
    const lastShown = localStorage.getItem(key);

    if (!lastShown) {
        console.log('[PopupProvider] Popup never shown:', popup.id);
        return true;
    }

    // Check if shown today
    const today = new Date().toDateString();
    const wasShownToday = lastShown === today;

    console.log('[PopupProvider] Session check:', popup.id, 'lastShown:', lastShown, 'today:', today, 'skip:', wasShownToday);
    return !wasShownToday;
};

// Mark popup as shown (stored with today's date for daily reset)
const markPopupShown = (popup: Popup) => {
    if (popup.show_once_per_session !== false) {
        const today = new Date().toDateString();
        localStorage.setItem(`popup_shown_${popup.id}`, today);
    }
};

// Check if current page matches popup's target pages
const matchesCurrentPage = (popup: Popup): boolean => {
    const currentPath = window.location.pathname;

    // Handle show_on_pages - could be array or JSON string
    let pages: string[] = ['*'];
    if (popup.show_on_pages) {
        if (Array.isArray(popup.show_on_pages)) {
            pages = popup.show_on_pages;
        } else if (typeof popup.show_on_pages === 'string') {
            try {
                pages = JSON.parse(popup.show_on_pages);
            } catch {
                pages = [popup.show_on_pages];
            }
        }
    }

    console.log('[PopupProvider] Page match check:', popup.id, 'current:', currentPath, 'targets:', pages);

    if (pages.includes('*') || pages.length === 0) return true;

    const matches = pages.some(page => {
        if (page.endsWith('*')) {
            return currentPath.startsWith(page.slice(0, -1));
        }
        return currentPath === page || currentPath === page + '/';
    });

    console.log('[PopupProvider] Page match result:', popup.id, matches);
    return matches;
};

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [popups, setPopups] = useState<Popup[]>([]);
    const [activePopups, setActivePopups] = useState<Popup[]>([]);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const triggeredIdsRef = React.useRef<Set<string>>(new Set()); // Track triggered popups

    const fetchPopups = useCallback(async () => {
        try {
            const data = await popupApi.getActive();
            console.log('[PopupProvider] Fetched popups:', data.length, data);
            // Filter by session storage and page match
            const filtered = data.filter(p => {
                const sessionCheck = shouldShowPopup(p);
                const pageCheck = matchesCurrentPage(p);
                console.log('[PopupProvider] Popup', p.id, '- session:', sessionCheck, 'page:', pageCheck);
                return sessionCheck && pageCheck;
            });

            console.log('[PopupProvider] Filtered popups:', filtered.length);
            setPopups(filtered);
        } catch (error) {
            console.error('Failed to fetch popups:', error);
        }
    }, []);

    useEffect(() => {
        fetchPopups();
    }, [fetchPopups]);

    // Handle popup triggers
    useEffect(() => {
        console.log('[PopupProvider] Trigger effect running, popups:', popups.length);
        const timeouts: ReturnType<typeof setTimeout>[] = [];

        const scrollHandler = () => {
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

            popups.forEach(popup => {
                if (popup.trigger_type === 'scroll' && !dismissedIds.has(popup.id) && !triggeredIdsRef.current.has(popup.id)) {
                    if (scrollPercent >= (popup.trigger_scroll_percent || 50)) {
                        console.log('[PopupProvider] Triggering scroll popup:', popup.id);
                        triggeredIdsRef.current.add(popup.id);
                        setActivePopups(prev => {
                            if (prev.find(p => p.id === popup.id)) return prev;
                            return [...prev, popup];
                        });
                        markPopupShown(popup);
                    }
                }
            });
        };

        popups.forEach(popup => {
            if (dismissedIds.has(popup.id) || triggeredIdsRef.current.has(popup.id)) {
                console.log('[PopupProvider] Skipping popup (dismissed or triggered):', popup.id);
                return;
            }

            console.log('[PopupProvider] Processing popup:', popup.id, 'type:', popup.trigger_type);

            if (popup.trigger_type === 'immediate') {
                console.log('[PopupProvider] Triggering immediate popup:', popup.id);
                triggeredIdsRef.current.add(popup.id);
                setActivePopups(prev => {
                    if (prev.find(p => p.id === popup.id)) return prev;
                    return [...prev, popup];
                });
                markPopupShown(popup);
            } else if (popup.trigger_type === 'delay') {
                console.log('[PopupProvider] Scheduling delayed popup:', popup.id, 'delay:', popup.trigger_delay_seconds);
                triggeredIdsRef.current.add(popup.id);
                const timeout = setTimeout(() => {
                    if (!dismissedIds.has(popup.id)) {
                        console.log('[PopupProvider] Triggering delayed popup:', popup.id);
                        setActivePopups(prev => {
                            if (prev.find(p => p.id === popup.id)) return prev;
                            return [...prev, popup];
                        });
                        markPopupShown(popup);
                    }
                }, (popup.trigger_delay_seconds || 3) * 1000);
                timeouts.push(timeout);
            }
        });

        window.addEventListener('scroll', scrollHandler);

        return () => {
            timeouts.forEach(clearTimeout);
            window.removeEventListener('scroll', scrollHandler);
        };
    }, [popups, dismissedIds]);

    const dismissPopup = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]));
        setActivePopups(prev => prev.filter(p => p.id !== id));
    };

    return (
        <PopupContext.Provider value={{ activePopups, dismissPopup, refreshPopups: fetchPopups }}>
            {children}
            <PopupRenderer />
        </PopupContext.Provider>
    );
};

// Popup Renderer Component
const PopupRenderer: React.FC = () => {
    const { activePopups, dismissPopup } = usePopups();
    const [email, setEmail] = useState('');
    const [subscribing, setSubscribing] = useState(false);
    const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);

    const handleSubscribe = async (popup: Popup) => {
        if (!email || !email.includes('@')) return;

        try {
            setSubscribing(true);
            await popupApi.subscribeEmail(popup.id, email);
            setSubscribeSuccess(popup.id);
            setEmail('');
            setTimeout(() => {
                dismissPopup(popup.id);
            }, 2000);
        } catch (error: any) {
            console.error('Subscribe error:', error);
            alert(error.message || 'Bir hata oluştu');
        } finally {
            setSubscribing(false);
        }
    };

    const handleButtonClick = (popup: Popup, url?: string) => {
        if (url) {
            if (url.startsWith('http')) {
                window.open(url, '_blank');
            } else {
                window.location.href = url;
            }
        }
        dismissPopup(popup.id);
    };

    // Separate popups by type
    const cornerPopups = activePopups.filter(p => p.type === 'corner');
    const modalPopups = activePopups.filter(p => p.type === 'modal' || p.type === 'fullscreen');

    return (
        <>
            {/* Corner Popups */}
            {cornerPopups.map((popup, index) => (
                <div
                    key={popup.id}
                    className="fixed z-50 animate-slideInRight"
                    style={{
                        bottom: `${20 + index * 10}px`,
                        right: '20px',
                        maxWidth: '320px',
                    }}
                >
                    <div
                        className="shadow-2xl overflow-hidden relative"
                        style={{
                            backgroundColor: popup.styles?.bgColor || '#ffffff',
                            borderRadius: popup.styles?.borderRadius || '16px',
                        }}
                    >
                        <button
                            onClick={() => dismissPopup(popup.id)}
                            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                        >
                            <X size={16} className="text-gray-600" />
                        </button>

                        {popup.image_url && (
                            <img
                                src={popup.image_url}
                                alt=""
                                className="w-full h-32 object-cover"
                            />
                        )}

                        <div className="p-4">
                            {popup.title && (
                                <h3
                                    className="font-bold mb-1"
                                    style={{
                                        fontFamily: popup.styles?.titleFont || 'Inter',
                                        fontSize: popup.styles?.titleSize || '20px',
                                        color: popup.styles?.titleColor || '#111827',
                                    }}
                                >
                                    {popup.title}
                                </h3>
                            )}

                            {popup.subtitle && (
                                <p className="text-sm text-gray-500 mb-2">{popup.subtitle}</p>
                            )}

                            {popup.body_text && (
                                <p
                                    className="mb-4"
                                    style={{
                                        fontFamily: popup.styles?.bodyFont || 'Inter',
                                        fontSize: popup.styles?.bodySize || '14px',
                                        color: popup.styles?.bodyColor || '#6b7280',
                                    }}
                                >
                                    {popup.body_text}
                                </p>
                            )}

                            {/* Email Form */}
                            {popup.collect_email && subscribeSuccess !== popup.id && (
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={popup.email_placeholder || 'E-posta adresiniz'}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <button
                                        onClick={() => handleSubscribe(popup)}
                                        disabled={subscribing}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        {subscribing ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                                    </button>
                                </div>
                            )}

                            {subscribeSuccess === popup.id && (
                                <div className="text-center text-green-600 font-medium mb-3">
                                    ✓ Başarıyla abone oldunuz!
                                </div>
                            )}

                            {/* Buttons */}
                            {popup.button1_text && !popup.collect_email && (
                                <button
                                    onClick={() => handleButtonClick(popup, popup.button1_url)}
                                    className="w-full py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
                                    style={{
                                        backgroundColor: popup.button1_style?.bg || '#3b82f6',
                                        color: popup.button1_style?.text || '#ffffff',
                                    }}
                                >
                                    {popup.button1_text}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Modal/Fullscreen Popups */}
            {modalPopups.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    {modalPopups.slice(0, 1).map(popup => {
                        const isFullscreen = popup.type === 'fullscreen';

                        return (
                            <div
                                key={popup.id}
                                className={`relative shadow-2xl overflow-hidden animate-scaleIn ${isFullscreen
                                    ? 'w-full max-w-5xl flex flex-col md:flex-row'
                                    : 'w-full max-w-md'
                                    }`}
                                style={{
                                    backgroundColor: popup.styles?.bgColor || '#ffffff',
                                    borderRadius: popup.styles?.borderRadius || '16px',
                                    maxHeight: '90vh',
                                }}
                            >
                                <button
                                    onClick={() => dismissPopup(popup.id)}
                                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>

                                {isFullscreen ? (
                                    /* Fullscreen Layout - Side by Side */
                                    <>
                                        {popup.image_url && (
                                            <div className="md:w-1/2 relative">
                                                <img
                                                    src={popup.image_url}
                                                    alt=""
                                                    className="w-full h-48 md:h-full object-cover"
                                                    style={{ minHeight: '250px' }}
                                                />
                                            </div>
                                        )}
                                        <div className={`flex-1 p-8 flex flex-col justify-center ${popup.image_url ? '' : 'md:w-full'}`}>
                                            {popup.title && (
                                                <h2
                                                    className="font-bold mb-3"
                                                    style={{
                                                        fontFamily: popup.styles?.titleFont || 'Inter',
                                                        fontSize: popup.styles?.titleSize || '32px',
                                                        color: popup.styles?.titleColor || '#111827',
                                                    }}
                                                >
                                                    {popup.title}
                                                </h2>
                                            )}

                                            {popup.subtitle && (
                                                <p className="text-gray-500 text-lg mb-2">{popup.subtitle}</p>
                                            )}

                                            {popup.body_text && (
                                                <p
                                                    className="mb-6"
                                                    style={{
                                                        fontFamily: popup.styles?.bodyFont || 'Inter',
                                                        fontSize: popup.styles?.bodySize || '16px',
                                                        color: popup.styles?.bodyColor || '#6b7280',
                                                    }}
                                                >
                                                    {popup.body_text}
                                                </p>
                                            )}

                                            {/* Email Form */}
                                            {popup.collect_email && subscribeSuccess !== popup.id && (
                                                <div className="flex gap-2 mb-4">
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder={popup.email_placeholder || 'E-posta adresiniz'}
                                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                    />
                                                    <button
                                                        onClick={() => handleSubscribe(popup)}
                                                        disabled={subscribing}
                                                        className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                                                    >
                                                        {subscribing ? <Loader2 className="animate-spin" size={20} /> : popup.email_button_text || 'Abone Ol'}
                                                    </button>
                                                </div>
                                            )}

                                            {subscribeSuccess === popup.id && (
                                                <div className="text-green-600 font-medium text-lg mb-4">
                                                    ✓ Başarıyla abone oldunuz!
                                                </div>
                                            )}

                                            {/* Buttons */}
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {popup.button1_text && !popup.collect_email && (
                                                    <button
                                                        onClick={() => handleButtonClick(popup, popup.button1_url)}
                                                        className="flex-1 py-3 px-6 rounded-lg font-medium transition-opacity hover:opacity-90"
                                                        style={{
                                                            backgroundColor: popup.button1_style?.bg || '#3b82f6',
                                                            color: popup.button1_style?.text || '#ffffff',
                                                        }}
                                                    >
                                                        {popup.button1_text}
                                                    </button>
                                                )}

                                                {popup.button2_text && (
                                                    <button
                                                        onClick={() => handleButtonClick(popup, popup.button2_url)}
                                                        className="flex-1 py-3 px-6 rounded-lg font-medium transition-opacity hover:opacity-90"
                                                        style={{
                                                            backgroundColor: popup.button2_style?.bg || '#e5e7eb',
                                                            color: popup.button2_style?.text || '#374151',
                                                        }}
                                                    >
                                                        {popup.button2_text}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Modal Layout - Compact Vertical */
                                    <>
                                        {popup.image_url && (
                                            <img
                                                src={popup.image_url}
                                                alt=""
                                                className="w-full h-40 object-cover"
                                            />
                                        )}

                                        <div className="p-6">
                                            {popup.title && (
                                                <h2
                                                    className="font-bold mb-2 text-center"
                                                    style={{
                                                        fontFamily: popup.styles?.titleFont || 'Inter',
                                                        fontSize: popup.styles?.titleSize || '24px',
                                                        color: popup.styles?.titleColor || '#111827',
                                                    }}
                                                >
                                                    {popup.title}
                                                </h2>
                                            )}

                                            {popup.subtitle && (
                                                <p className="text-center text-gray-500 mb-2">{popup.subtitle}</p>
                                            )}

                                            {popup.body_text && (
                                                <p
                                                    className="mb-6 text-center"
                                                    style={{
                                                        fontFamily: popup.styles?.bodyFont || 'Inter',
                                                        fontSize: popup.styles?.bodySize || '16px',
                                                        color: popup.styles?.bodyColor || '#6b7280',
                                                    }}
                                                >
                                                    {popup.body_text}
                                                </p>
                                            )}

                                            {/* Email Form */}
                                            {popup.collect_email && subscribeSuccess !== popup.id && (
                                                <div className="flex gap-2 mb-4 max-w-sm mx-auto">
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder={popup.email_placeholder || 'E-posta adresiniz'}
                                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                    />
                                                    <button
                                                        onClick={() => handleSubscribe(popup)}
                                                        disabled={subscribing}
                                                        className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                                                    >
                                                        {subscribing ? <Loader2 className="animate-spin" size={20} /> : popup.email_button_text || 'Abone Ol'}
                                                    </button>
                                                </div>
                                            )}

                                            {subscribeSuccess === popup.id && (
                                                <div className="text-center text-green-600 font-medium text-lg mb-4">
                                                    ✓ Başarıyla abone oldunuz!
                                                </div>
                                            )}

                                            {/* Buttons */}
                                            <div className="space-y-3 max-w-sm mx-auto">
                                                {popup.button1_text && !popup.collect_email && (
                                                    <button
                                                        onClick={() => handleButtonClick(popup, popup.button1_url)}
                                                        className="w-full py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                                                        style={{
                                                            backgroundColor: popup.button1_style?.bg || '#3b82f6',
                                                            color: popup.button1_style?.text || '#ffffff',
                                                        }}
                                                    >
                                                        {popup.button1_text}
                                                    </button>
                                                )}

                                                {popup.button2_text && (
                                                    <button
                                                        onClick={() => handleButtonClick(popup, popup.button2_url)}
                                                        className="w-full py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                                                        style={{
                                                            backgroundColor: popup.button2_style?.bg || '#e5e7eb',
                                                            color: popup.button2_style?.text || '#374151',
                                                        }}
                                                    >
                                                        {popup.button2_text}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
        </>
    );
};

export default PopupProvider;
