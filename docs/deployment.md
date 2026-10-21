# Production deployment

- Public site: https://pawpointer.app
- Stack: React + Vite static output; no backend, Functions, database, runtime secrets, or runtime Pexels API.
- Build: Node 22.18.0, `npm run build`, output `dist`.
- Production branch: `main`.

## Asset delivery

All 200 photos (AVIF plus WebP fallback), JS and CSS are deployed with Pages. Pages automatically serves static assets through Cloudflare edge and Tiered Cache. R2 is not needed for this fixed, versioned collection; consider it when uploads or independent asset publishing become requirements.

`public/_headers` sets a one-year immutable browser cache for content-hashed `/assets/*`; photos keep stable names and have a one-day browser TTL. If replacing an image, use a new filename so a browser with a fresh cached image does not retain the old pixels. HTML retains Pages default revalidation. No blanket Cache Everything rule is added, avoiding stale HTML and bypassed deployment updates.

References checked 2026-10-22:
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://developers.cloudflare.com/r2/buckets/public-buckets/
