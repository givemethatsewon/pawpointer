# Paw Pointer

[**Play at pawpointer.app**](https://pawpointer.app)

**A tiny internet distraction.**

Move. Pause. Paw.

### The internet could use a little more *cat.*

Move somewhere. Hold still. A curious paw finds you. That's the whole idea.

Open the site and play immediately. No landing page, login, or runtime photo API.

## How to play

- **On a computer:** Move your cursor, then pause for a moment.
- **On your phone:** Tap anywhere. That spot belongs to a cat now.
- **Prefer a keyboard?** Arrow keys move the target. Space brings another cat.

### A little peek behind the paws

Each photo has a hand-marked paw position. We find a nearby match, skip the last four cats, then scale and shift the photo until its paw lands on your cursor. No AI running in the background. Just a little geometry.

An interactive experiment by [**Sewon**](https://github.com/givemethatsewon).

Inspired by [Pointer Pointer](https://pointerpointer.com/).

Photography from [Pexels](https://www.pexels.com/), used under the [Pexels License](https://www.pexels.com/license/). Individual photographer credits are preserved in [CREDITS.md](CREDITS.md).

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
- Mouse movement starts a 1.2-second stillness timer; touch uses the tapped position.
- Photographs are selected by squared distance between normalized cursor and paw coordinates, excluding the last four photos.
- An image is decoded before it replaces the previous one. Startup and touch load immediately. Desktop prepares the intended candidate after 150ms of quiet, overlapping the 1.2-second dwell. Superseded requests are cancelled; six decoded images are retained. A generation counter prevents a slow old request from overwriting a newer target.
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

Therefore `translation + q × R = P`: the annotated paw stays exactly on target. A blurred copy of the same photograph fills exposed edges. This adapts the principles found in our [Pointer Pointer investigation](docs/reverse-engineering.md); it is an independent implementation, not a copied bundle. Our 1.2-second delay is shorter than the original's 2-second debounce.

## Photography

397 active Pexels photographs (400 reviewed; 3 excluded because their front toes are cropped or obscured), stored locally with same-dimension AVIF alternatives, WebP fallbacks, and compact WebP thumbnails. All photographer names, source pages and license links are preserved in [`src/photos.json`](src/photos.json) and [CREDITS.md](CREDITS.md). The top-left logo links to Sewon’s GitHub profile. Photography credits are preserved in CREDITS.md and the catalog, with source and license links in this README. The canvas has no collection or next-photo buttons; Space remains available.

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

Browser tests use localhost:5174. Coverage includes immediate play, exact alignment, recent-photo exclusion, rapid pointer changes, slow stale requests, load failures/retry, keyboard controls, mobile taps, rotation, small screens and reduced motion. Mobile tests emulate touch in Chromium; physical iPhone/Android testing is separate.

## Structure

```text
src/lib/geometry.ts          Normalization, photo selection and exact alignment
src/lib/usePointerGallery.ts Input, debounce, async lifecycle and recent history
src/lib/images.ts            Decode cache and bounded image loading
src/components/PhotoStage.tsx Photo layers and live target
src/photos.json              Curated photo metadata and paw coordinates
tests/                       Geometry/catalog and browser regression tests
```

The final visual direction is documented in [DESIGN.md](docs/DESIGN.md). The original welcome-screen concept is superseded: the shipped product opens directly into the interactive canvas.

The [full 400-photo coordinate audit](docs/paw-audit-400/README.md) records 47 corrected annotations and 3 exclusions. The latest [200-to-400-photo expansion](docs/expansion-400/README.md) includes annotation review sheets and byte measurements. The earlier 60-to-200-photo expansion and its measurements are recorded in [photo curation](docs/photo-curation.md) and [performance comparison](docs/performance/README.md). The archived benchmark scripts target that earlier UI, including its collection button.

The latency optimization is documented in [performance v2](docs/performance/v2/README.md), with an alternating before/after benchmark and raw samples. The measurements describe the earlier UI; the collection and About controls have since been removed, and their explanatory content now lives here.

## Search and measurement

The production HTML includes a canonical URL, descriptive search metadata, Open Graph/Twitter sharing image, and WebSite structured data. `public/robots.txt` references the single-page `public/sitemap.xml`.

Basic visitor and performance measurement uses Cloudflare Web Analytics through the existing zone-level automatic injection (EU visitor data excluded), rather than a bundled GA or Mixpanel SDK. Keep the separate Pages analytics toggle off to avoid duplicate beacons. There are no custom user identifiers, session replay, or individual photo-interaction events. It measures visits and page performance, not how many cats someone has seen. Browser blockers and reporting delays can affect counts.

Search Console owns the `pawpointer.app` Domain property through DNS verification. Keep its Google verification TXT record in place. Submission and verification do not guarantee search indexing or rankings.
