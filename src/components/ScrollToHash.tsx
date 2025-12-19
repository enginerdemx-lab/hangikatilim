import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToHash component handles smooth scrolling to hash-based anchors.
 * Works across SPA navigation - scrolls even when navigating from other pages.
 * 
 * Usage: Place inside BrowserRouter, before Routes.
 * 
 * Features:
 * - Smooth scrolling to #id elements
 * - Retry mechanism for lazy-loaded content
 * - Works on initial page load and navigation
 * - Silent failure if element not found
 */
export const ScrollToHash: React.FC = () => {
    const { pathname, hash } = useLocation();
    const lastHash = useRef('');

    useEffect(() => {
        // Skip if no hash or same hash as before (avoid re-scroll)
        if (!hash) {
            lastHash.current = '';
            return;
        }

        // If hash changed or pathname changed with hash
        if (hash !== lastHash.current || pathname !== '/') {
            lastHash.current = hash;

            const elementId = hash.replace('#', '');

            // Retry mechanism for lazy-loaded content
            let attempts = 0;
            const maxAttempts = 15;
            const retryDelay = 100; // ms

            const scrollToElement = () => {
                const element = document.getElementById(elementId);

                if (element) {
                    // Small delay to ensure page is fully rendered
                    requestAnimationFrame(() => {
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                        });
                    });
                    return true;
                }

                return false;
            };

            const tryScroll = () => {
                if (scrollToElement()) return;

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryScroll, retryDelay);
                }
                // Silent failure - don't log errors if element not found
            };

            // Initial attempt with slight delay for content render
            setTimeout(tryScroll, 50);
        }
    }, [pathname, hash]);

    return null; // This component renders nothing
};
