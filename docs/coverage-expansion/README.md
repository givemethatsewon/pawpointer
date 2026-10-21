# Targeted paw-position coverage expansion

2026-10-22. Added 16 visually reviewed Pexels photographs: **397 → 413 active photographs**. These are source photographs, not a verified count of distinct cats. Existing images and annotations are unchanged.

## Find the gaps first

Measured normalized paw positions on an 11 × 11 target grid. `within015` counts paws within Euclidean distance 0.15 of the target; `eighthDistance` measures the distance to its eighth-nearest candidate. This is a spatial-density measure before recent-history exclusions, not a guarantee of eight equally good images after every interaction.

| Target (x, y) | Nearby candidates before → after | Eighth-nearest distance before → after |
|---|---:|---:|
| Upper right (0.9, 0.2) | 4 → 7 | 0.198 → 0.159 |
| Upper center (0.5, 0.1) | 6 → 10 | 0.159 → 0.140 |
| Upper left (0.1, 0.2) | 10 → 11 | 0.144 → 0.144 |
| Top-left corner (0, 0) | 2 → 2 | 0.320 → 0.271 |
| Top-right corner (1, 0) | 0 → 0 | 0.364 → 0.321 |

Exact corners remain sparse. The placement geometry still aligns any selected annotated toe to the cursor; this expansion reduces the distance to suitable original compositions without pretending the corner gaps are completely filled. Full before/after grid data is in [coverage.json](coverage.json).

## Browser discovery and manual review

Used Aside's browser directly to search Pexels for `cat reaching`, `cat high five`, `cat climbing`, `cat paw`, and `cat playing`, including additional result pages. The delegated Aside agent returned a rate-limit error, so discovery continued through Aside REPL. Collected 99 candidate records not in the active catalog and inspected contact sheets; some search results were irrelevant or previously rejected photographs. Only 16 were accepted.

Downloaded source images at up to 1800 pixels, preserving the full composition and orientation. Reviewed each selected photo with a coordinate overlay, then enlarged the target area. Corrected preliminary points that floated above the paw. Rejected cropped toes, obscured paws, ambiguous fore/hind legs, and unrelated results. The earlier audit's excluded photographs were not restored.

[annotations.json](annotations.json) records the final normalized coordinates, authors, original links and licenses. [review/](review/) contains the 16 final full-photo overlays and toe-detail sheets. Black margins in the toe-detail sheets are diagnostic padding outside the photograph, not part of the shipped image.

## Assets and validation

- New assets: same-dimension AVIF/WebP alternatives plus WebP thumbnails. No new runtime dependency or stock API call.
- Preferred image payloads for all 16 additions total **2,133,205 bytes**. Only the selected image loads; the collection is not eagerly downloaded.
- Gzipped startup catalog grows by **764 bytes**. Existing six-image decoded cache and Cloudflare Pages cache policy are preserved.
- All 413 full-image file hashes are unique; AVIF and WebP files decode with catalog-matching dimensions. This is not a claim that similar poses cannot appear.
- Unit tests check catalog integrity, alignment across viewport sizes and edges, nearby selection and repeat exclusion.
- [browser.json](browser.json) records every new photo at its annotated target on desktop and mobile. These geometry-only checks disable toolbar pointer interception so top-left target coordinates remain testable; the normal browser suite separately checks the working logo link. [production.json](production.json) records the equivalent deployed checks.
