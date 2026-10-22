# Development guide

[← Back to Paw Pointer](../README.md)

## Run

Node.js 22.18+ or 24+ recommended.

```sh
npm ci
npm run dev
```

Vite prints the local URL. If a port is already occupied, use the URL it reports.

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static host. The app uses relative asset paths and can be served from a subdirectory. No secrets or environment variables are needed to build, run, or deploy.

## Interaction

- The canvas opens on black and makes no photo request until the visitor moves the pointer, taps, or presses Space/an arrow key. Resizing before the first input keeps it black.
- Mouse movement starts a 1.2-second stillness timer. Tremors within 6 CSS pixels of the fixed transition anchor update the target without restarting the timer or download; touch uses the tapped position immediately.
- Photographs exclude the last 24 photos and choose from up to eight nearby candidates (within 0.025 squared normalized distance of the best fit). A history-based choice stays stable across preload and reveal.
- An image is decoded before it replaces the previous one. Keyboard and touch load immediately after input. Desktop prepares the intended candidate after 150ms of quiet, overlapping the 1.2-second dwell. Superseded requests are cancelled; six decoded images are retained. A generation counter prevents a slow old request from overwriting a newer target.
- Missing photographs fall back to another candidate; total failure offers a retry.
- Resize/rotation preserves the normalized target.
- Reduced motion is respected. No sound plays.

## The small bit of geometry

For viewport size `V`, natural image size `I`, normalized paw coordinate `q`, and target pixel position `P`:

```text
scale = max(V.width / I.width, V.height / I.height) × 1.2
R = I × scale
translation = P − q × R
```

Therefore `translation + q × R = P`: the annotated paw stays exactly on target. A blurred copy of the same photograph fills exposed edges. This adapts the principles found in our [Pointer Pointer investigation](reverse-engineering.md); it is an independent implementation, not a copied bundle. Our 1.2-second delay is shorter than the original's 2-second debounce.

## Photography

413 active Pexels photographs (397 from the full audit plus 16 targeted additions), stored locally with same-dimension AVIF alternatives, WebP fallbacks, and compact WebP thumbnails. All photographer names, source pages and license links are preserved in [`src/photos.json`](../src/photos.json) and [CREDITS.md](../CREDITS.md). The top-left logo links to the Paw Pointer GitHub repository. Photography credits are preserved in CREDITS.md and the catalog, with source and license links in this README. The canvas has no collection or next-photo buttons; Space remains available.

Photos were discovered with the authorized Pexels API during authoring. **The API key is not in this repository or the browser bundle.** No API access is required for the published site.

To add a photo, review its source/license, optimize a full image and thumbnail into `public/photos`, and add a catalog record with the true pixel dimensions and a paw point in `[0, 1]`. Point at the end of the extended paw, not the middle of the image. Update credits, run `python3 scripts/prepare-catalog.py` with AVIF-enabled Pillow to regenerate `src/gallery.json` and encodings, and run the checks.

## Checks

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

An existing Chrome install can be selected without installing another browser:

```sh
PLAYWRIGHT_CHROME_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:e2e
```

Browser tests use localhost:5174. Coverage includes black startup until input, tremor tolerance, exact alignment, recent-photo exclusion, rapid pointer changes, slow stale requests, load failures/retry, keyboard controls, mobile taps, rotation, small screens and reduced motion. Mobile tests emulate touch in Chromium; physical iPhone/Android testing is separate.

## Structure

```text
src/lib/geometry.ts          Normalization, photo selection and exact alignment
src/lib/usePointerGallery.ts Input, debounce, async lifecycle and recent history
src/lib/images.ts            Decode cache and bounded image loading
src/components/PhotoStage.tsx Photo layers and live target
src/photos.json              Curated photo metadata and paw coordinates
tests/                       Geometry/catalog and browser regression tests
```

The final visual direction is documented in [DESIGN.md](DESIGN.md). The original welcome-screen concept is superseded: the shipped product opens directly into the interactive canvas.

The [full 400-photo coordinate audit](paw-audit-400/README.md) records 47 corrected annotations and 3 exclusions. The latest [200-to-400-photo expansion](expansion-400/README.md) includes annotation review sheets and byte measurements. The earlier 60-to-200-photo expansion and its measurements are recorded in [photo curation](photo-curation.md) and [performance comparison](performance/README.md). The archived benchmark scripts target that earlier UI, including its collection button.

The latency optimization is documented in [performance v2](performance/v2/README.md), with an alternating before/after benchmark and raw samples. The measurements describe the earlier UI; the collection and About controls have since been removed, and their explanatory content now lives here.

## Search and measurement

The production HTML includes a canonical URL, descriptive search metadata, Open Graph/Twitter sharing image, and WebSite structured data. `public/robots.txt` references the single-page `public/sitemap.xml`.

Google Analytics 4 measures visits, traffic sources and engagement through the Paw Pointer web stream. `src/lib/analytics.ts` loads Google's tag asynchronously only on `pawpointer.app`; localhost and Cloudflare preview domains do not send Analytics events. Initialization happens once before React renders, so Strict Mode does not duplicate page views. Standard enhanced measurement is enabled. Google signals and ad personalization are disabled in the tag configuration. There are no custom user identifiers, session replay, pointer coordinates or individual photo-interaction events. Google's tag uses Analytics cookies to distinguish browsers. See Google's [configuration reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).

The [Paw Pointer Analytics dashboard](https://analytics.google.com/analytics/web/#/a287616921p560094920/reports/intelligenthome) uses property `560094920`, web stream `16181612134` and public measurement ID `G-V4E93WF0JR`. The measurement ID is not a credential and requires no build environment variable. To verify production, inspect a `page_view` request to Google's `/g/collect` endpoint with this ID, then check the property's Realtime report. Standard reports may take longer to populate.

Cloudflare Web Analytics continues to provide its separate visitor/performance reports through the existing zone-level automatic injection (EU visitor data excluded). Keep the separate Pages analytics toggle off to avoid duplicate Cloudflare beacons. Browser blockers and reporting delays can affect both services' counts; their totals can differ.

Search Console owns the `pawpointer.app` Domain property through DNS verification. Keep its Google verification TXT record in place. Submission and verification do not guarantee search indexing or rankings.

The [targeted coverage expansion](coverage-expansion/README.md) adds 16 manually reviewed photographs to sparse upper regions, with before/after spatial measurements and toe-detail evidence.
