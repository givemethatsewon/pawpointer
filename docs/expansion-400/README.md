# 200 → 400 photographs

2026-10-22. Added 200 Pexels photographs from 165 photographers. Existing 200 photographs and their corrected annotations are unchanged. The expansion includes calico, black, white and colorpoint cats; kittens, walking, stretching, playing, climbing and winter scenes. These are 400 photographs, not a verified count of distinct animals.

## Curation

Fetched 1,126 candidate records excluding existing Pexels IDs. Selected photographs with visible paws, then reviewed all 200 additions in larger contact sheets with overlaid target points. Enlarged ambiguous cases; corrected toy/face/hind-paw selections and refined several toe positions. Replaced one snow photograph whose front paw was obscured. The final normalized points and source links are in [annotations.json](annotations.json); all 200 final marked photographs are in [review](review/). Source authors and license links are preserved in the main catalog and CREDITS.md.

Validation: 400 unique source IDs and 400 unique full-image SHA-256 hashes. This proves no exact file duplicates; it does not claim that similar poses or the same individual cat never appear. All 1,200 AVIF, WebP and thumbnail files decoded successfully; full-format pixel dimensions match the catalog.

## Size and loading

| Measurement | Before (200) | After (400) |
|---|---:|---:|
| Startup catalog, raw bytes | 48,719 | 97,794 |
| Startup catalog, gzip bytes | 9,745 | 18,506 |
| All photo files, including alternate formats and thumbnails | 73,073,911 | 133,054,371 |
| Preferred full-image files across the collection | 29,718,977 | 55,391,133 |

The added preferred images total 25,672,156 bytes (128,361 bytes per photograph on average). Additional WebP photographs use quality 82, with especially large files at 76; AVIF alternatives use quality 65 with the same pixel dimensions. Existing images were not recompressed. AVIF is selected only when smaller than WebP.

Collection size is not the initial page transfer: only the selected photograph is fetched. The six-image decoded-image cache, dwell preparation, WebP fallback, and Cloudflare Pages cache headers remain unchanged. Catalog gzip adds 8,761 bytes. The production JavaScript bundle is 330.04 kB raw / 92.66 kB gzip, including React and the whole compact catalog.

[assets.json](assets.json) contains per-photo byte counts. [browser.json](browser.json) records fresh-context desktop/mobile initial-photo requests from the local production preview. Both desktop (1440×900) and mobile (390×844) requested exactly one initial AVIF photograph, 110,128 encoded bytes. These local resource timings are not internet latency measurements.

## Validation

- Unit/catalog/geometry tests: 6 passed across all 400 records.
- Browser tests: 11 passed, including mobile taps/rotation, small viewport, latest-input handling, AVIF failure and retry.
- TypeScript and production build passed.
- No runtime Pexels credential or API calls: stock search remains a local curation step.
