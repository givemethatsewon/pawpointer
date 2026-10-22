declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const measurementId = 'G-V4E93WF0JR';

export function initializeAnalytics() {
  // Keep development and Cloudflare preview visits out of production reports.
  if (window.location.hostname !== 'pawpointer.app') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
}

export function trackCatView(photoId: string, catNumber: number) {
  if (window.location.hostname !== 'pawpointer.app' || !window.gtag) return;
  window.gtag('event', 'cat_view', {
    cat_count: 1,
    photo_id: photoId,
    cat_number: catNumber,
  });
}
