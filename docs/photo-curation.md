# 200-photo curation — 2026-10-22

The catalog grew from 60 to 200 Pexels photographs. The new API searches produced 567 candidates after excluding existing IDs; the first 264 candidates were visually screened on contact sheets. A shortlist was annotated by hand and reviewed again with a visible paw marker. Images with hidden paws, cropped endpoints or a toy mistaken for a paw were replaced. The final addition is 140 images. There is no runtime paw detection.

Every new photo has a normalized paw coordinate, actual optimized dimensions, descriptive alt text, photographer name, original source URL and license URL. The complete catalog is in `src/photos.json`; human-readable credits are in `CREDITS.md`.

The default full-image output is maximum 1800px long edge and WebP quality 85; thumbnails use maximum 400px and quality 75. After measurement, 22 full images larger than 400 KiB were selectively recompressed (quality 75–80, with resizing only where needed). All full images now fit a 500 KiB ceiling (400 KiB was the optimization trigger). Original pre-optimization files remain in ignored local scratch storage; the per-file changes are recorded in `performance/asset-optimization.json`. The three largest before/after pairs were visually compared. No blanket reduction was applied to the other 178 images. Some different photographs show the same cat or shoot. No full-image files are byte-identical. A small preview cannot guarantee pixel-perfect anatomical annotation, so coordinate correctness and numerical alignment remain distinct checks.

All 200 full images and 200 thumbnails were decoded successfully with Pillow. Their full-image dimensions match the catalog. There are no extra unreferenced WebP files in `public/photos`.

Only a selected photo is required to play. Desktop also preloads one next candidate. Touch/coarse-pointer devices skip speculative preloading to avoid bandwidth contention. Collection thumbnails are lazy-loaded, and the collection is not mounted until opened.

Performance conditions, measured regressions and final comparison are documented in `performance/README.md`. API keys and downloaded API responses are not included in source control.
