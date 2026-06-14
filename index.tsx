import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/index.css'; // Tailwind (build-time) — eski runtime CDN'in yerine
// Font self-host: Inter artık kendi sunucumuzdan (Google'a dış istek yok, daha hızlı FCP)
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-ext-700.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// ---------------------------------------------------------------------------
// Prerender hand-off (no flicker, no hydration, route-aware)
//
// Prerendered pages ship real HTML inside <div id="root" data-prerendered="/route">.
// The SPA fallback serves the HOME index.html for any NON-prerendered route
// (e.g. /admin/login, a detail page). So before booting we compare the snapshot's
// route with the current URL:
//   • match  -> keep the snapshot visible in a click-through overlay (smooth),
//   • mismatch (home shell shown for another route) -> clear it so the wrong page
//     is never displayed.
// We use createRoot (not hydrateRoot): zero hydration warnings, and all live data
// (currency/gold/timestamps/lists) is re-fetched fresh — nothing stays frozen.
// ---------------------------------------------------------------------------
let prerenderOverlay: HTMLDivElement | null = null;
try {
  const preRoute = rootElement.getAttribute('data-prerendered');
  if (preRoute !== null) {
    const current = window.location.pathname.replace(/\/+$/, '') || '/';
    const snapshot = preRoute.replace(/\/+$/, '') || '/';
    if (snapshot === current && rootElement.childElementCount > 0) {
      const overlay = document.createElement('div');
      overlay.id = '__prerender_overlay__';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:2147483646;background:#ffffff;' +
        'overflow:hidden;pointer-events:none;';
      while (rootElement.firstChild) overlay.appendChild(rootElement.firstChild);
      document.body.appendChild(overlay);
      prerenderOverlay = overlay;
    } else {
      // Home snapshot served as SPA fallback for another route -> don't show it.
      rootElement.innerHTML = '';
    }
    rootElement.removeAttribute('data-prerendered');
  }
} catch {
  /* never block boot on the overlay */
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (prerenderOverlay) {
  const overlay = prerenderOverlay;
  let removed = false;
  const reveal = () => {
    if (removed) return;
    removed = true;
    overlay.style.transition = 'opacity 350ms ease';
    overlay.style.opacity = '0';
    window.setTimeout(() => overlay.remove(), 400);
  };
  window.addEventListener('app:ready', reveal, { once: true });
  window.setTimeout(reveal, 900);
  window.setTimeout(reveal, 4000);
}
