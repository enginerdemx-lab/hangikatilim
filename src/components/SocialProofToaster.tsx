import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { siteSettingsApi } from '../services/api/siteSettings';

// Predefined activity messages
const ACTIVITY_MESSAGES = [
    { icon: '🏠', text: '{name} az önce ev hesaplaması yaptı', city: 'İstanbul' },
    { icon: '🚗', text: '{name} araç planını inceledi', city: 'Ankara' },
    { icon: '📊', text: '{name} tasarruf hesaplaması yaptı', city: 'İzmir' },
    { icon: '🏠', text: '{name} konut planlarını karşılaştırdı', city: 'Bursa' },
    { icon: '💰', text: '{name} kampanyaları inceledi', city: 'Antalya' },
    { icon: '🚗', text: '{name} araç hesaplaması yaptı', city: 'Konya' },
    { icon: '📋', text: '{name} hesaplama sonucunu kaydetti', city: 'Kayseri' },
    { icon: '🏠', text: '{name} iş yeri planı hesapladı', city: 'Gaziantep' },
    { icon: '💡', text: '{name} katılım firmalarını inceledi', city: 'Trabzon' },
    { icon: '📈', text: '{name} blog yazılarını okudu', city: 'Eskişehir' },
    { icon: '🏠', text: '{name} konut hesaplaması yaptı', city: 'Samsun' },
    { icon: '🚗', text: '{name} araç kampanyalarını inceledi', city: 'Diyarbakır' },
    { icon: '💰', text: '{name} tasarruf planı oluşturdu', city: 'Mersin' },
    { icon: '📊', text: '{name} aylık taksit hesapladı', city: 'Adana' },
    { icon: '🏠', text: '{name} ev planını kaydetti', city: 'Malatya' },
];

// Random Turkish names
const NAMES = [
    'Mehmet B.', 'Ayşe K.', 'Fatma Y.', 'Ali D.', 'Zeynep T.',
    'Mustafa S.', 'Emine A.', 'Ahmet Ç.', 'Hatice G.', 'Hüseyin E.',
    'Elif N.', 'İbrahim Ö.', 'Merve U.', 'Osman K.', 'Selin R.',
    'Burak H.', 'Derya M.', 'Emre İ.', 'Canan L.', 'Serkan P.',
];

const SocialProofToaster: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [dismissed, setDismissed] = useState(false);
    const [currentMessage, setCurrentMessage] = useState<{ icon: string; text: string; city: string; time: string } | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const usedIndices = useRef<Set<number>>(new Set());

    // Generate random activity
    const generateActivity = useCallback(() => {
        // Reset pool if exhausted
        if (usedIndices.current.size >= ACTIVITY_MESSAGES.length) {
            usedIndices.current.clear();
        }

        let msgIndex: number;
        do {
            msgIndex = Math.floor(Math.random() * ACTIVITY_MESSAGES.length);
        } while (usedIndices.current.has(msgIndex));

        usedIndices.current.add(msgIndex);

        const msg = ACTIVITY_MESSAGES[msgIndex];
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];
        const minutesAgo = Math.floor(Math.random() * 5) + 1;

        return {
            icon: msg.icon,
            text: msg.text.replace('{name}', name),
            city: msg.city,
            time: `${minutesAgo} dk önce`,
        };
    }, []);

    // Show a toast
    const showToast = useCallback(() => {
        if (dismissed) return;

        const activity = generateActivity();
        setCurrentMessage(activity);
        setVisible(true);

        // Hide after 4 seconds
        timeoutRef.current = setTimeout(() => {
            setVisible(false);
        }, 4000);
    }, [dismissed, generateActivity]);

    // Check if enabled
    useEffect(() => {
        const checkEnabled = async () => {
            try {
                const settings = await siteSettingsApi.getSettings();
                if (settings?.social_proof_enabled === false) {
                    setEnabled(false);
                }
            } catch (err) {
                console.error('Social proof settings error:', err);
            }
        };
        checkEnabled();

        // Check session dismissal
        const wasDismissed = sessionStorage.getItem('social_proof_dismissed');
        if (wasDismissed === 'true') {
            setDismissed(true);
        }
    }, []);

    // Start interval
    useEffect(() => {
        if (!enabled || dismissed) return;

        // First toast after 8 seconds
        const initialTimeout = setTimeout(() => {
            showToast();

            // Then every 15-25 seconds
            intervalRef.current = setInterval(() => {
                showToast();
            }, 15000 + Math.random() * 10000);
        }, 8000);

        return () => {
            clearTimeout(initialTimeout);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [enabled, dismissed, showToast]);

    const handleDismiss = () => {
        setVisible(false);
        setDismissed(true);
        sessionStorage.setItem('social_proof_dismissed', 'true');
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    if (!enabled || dismissed || !currentMessage) return null;

    return (
        <div
            className={`fixed bottom-4 left-4 z-40 max-w-sm transition-all duration-500 ease-out ${visible
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
                }`}
        >
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 p-4 flex items-start gap-3 relative overflow-hidden">
                {/* Accent bar */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                {/* Icon */}
                <div className="flex-shrink-0 text-2xl mt-0.5">
                    {currentMessage.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                        {currentMessage.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                            📍 {currentMessage.city}
                        </span>
                        <span className="text-xs text-gray-300 dark:text-slate-600">•</span>
                        <span className="text-xs text-gray-400">
                            {currentMessage.time}
                        </span>
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-gray-500 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Bildirimleri kapat"
                >
                    <X size={14} />
                </button>

                {/* Progress bar animation */}
                {visible && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500/30 animate-shrink-width" />
                )}
            </div>

            {/* CSS for shrink animation */}
            <style>{`
                @keyframes shrinkWidth {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-shrink-width {
                    animation: shrinkWidth 4s linear forwards;
                }
            `}</style>
        </div>
    );
};

export default SocialProofToaster;
