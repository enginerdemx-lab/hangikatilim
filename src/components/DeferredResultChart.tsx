import React from 'react';
import type { PaymentRow } from '../../types';

const ResultChart = React.lazy(() => import('./ResultChart'));

interface DeferredResultChartProps {
  schedule: PaymentRow[];
  theme: 'light' | 'dark';
}

const ChartPlaceholder: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => (
  <div
    className={`h-48 w-full mt-4 rounded-xl border ${
      theme === 'dark'
        ? 'border-slate-700 bg-slate-800/60'
        : 'border-gray-100 bg-gray-50'
    }`}
    aria-hidden="true"
  />
);

export const DeferredResultChart: React.FC<DeferredResultChartProps> = ({ schedule, theme }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = React.useState(false);

  React.useEffect(() => {
    if (shouldLoad) return;
    if (schedule.length === 0) return;
    const element = containerRef.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      const timeout = window.setTimeout(() => setShouldLoad(true), 1200);
      return () => window.clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [schedule.length, shouldLoad]);

  return (
    <div ref={containerRef}>
      {shouldLoad ? (
        <React.Suspense fallback={<ChartPlaceholder theme={theme} />}>
          <ResultChart schedule={schedule} theme={theme} />
        </React.Suspense>
      ) : (
        <ChartPlaceholder theme={theme} />
      )}
    </div>
  );
};
