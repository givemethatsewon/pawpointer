# Full catalog paw-coordinate audit — 2026-10-22

All 400 photographs were visually reviewed with their current pointer overlaid on the full photograph. 100 ambiguous or imprecise annotations were inspected again on larger sheets; eight were also opened individually at up to 1000 pixels. Changes were re-rendered and visually checked before browser testing.

- 47 annotations corrected, including points on a tail, hind pads, background, toy, wrist, or palm rather than the distal front toes.
- 350 retained, including the two user-reported photos corrected immediately before this audit.
- 3 excluded from selection because no sufficiently visible front toe could be annotated: `pexels-2064110`, `pexels-28874308`, `pexels-37228045`.
- 397 photographs remain active. Excluded assets and credits are preserved; their complete metadata is in [excluded.json](excluded.json).

## Evidence

[audit.json](audit.json) records all 400 IDs, original indices, before/after coordinates, dispositions, and reasons. Coordinates use the unchanged full-image dimensions. `src/photos.json` and the compact `src/gallery.json` contain the same corrected values.

`review/sheet-0.jpg` through `sheet-19.jpg` show all 400 original annotations. `review/after-0.jpg` through `after-12.jpg` show the enlarged second pass and final coordinates. Labels retain the original 0-based catalog indices; EXCLUDED marks photos removed from selection. The red circle marks the selected toe; it is an annotation overlay, not part of the asset.

The visual review determines anatomy. Automated geometry checks only establish that an annotated point reaches the requested screen pixel; they cannot prove that a point is anatomically correct. Low-depth-of-field photos can still have soft toe edges.

## Validation

- Six unit tests cover catalog consistency and all 397 active annotations at five target positions on four viewport sizes (7,940 placements), plus selection and resize behavior.
- Eleven browser regression tests cover pointer, touch, keyboard, resizing, loading failures, and startup.
- [browser.json](browser.json) records targeted desktop (1440×900) and touch/mobile (390×844) checks for every corrected photo: 94 rendered cases, all passed; maximum CSS alignment error 0.01494 px. This checks actual image decoding, selection, CSS alignment, overflow and page errors.

No image binaries or loading logic changed. Only catalogs, current photo-count copy, and audit documentation changed; the existing AVIF/WebP caching behavior is preserved.
