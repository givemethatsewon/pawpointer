# Verification — 2026-10-22

## Functional result

- Production build: passed (`tsc -b && vite build`).
- Unit/catalog tests: 5 passed.
- Chrome browser tests: 9 passed, final clean run 14.5 seconds.
- Built production output also opened in Codex's in-app browser at localhost:4174 and visibly reached a decoded cat photo with the Made by Sewon GitHub link.
- No landing page or start action. Canvas starts on opening.

The mobile regression fixed here was touch `pointerleave`: browsers emit it after the finger is lifted. It previously cancelled the stillness timer. Only mouse/pen exits now cancel it.

Test coverage: initial center alignment, pointer settling, exact annotated-paw alignment (<0.1 CSS pixel in browser assertions), recent four exclusion, keyboard arrows/Space, collection selection, native-dialog Escape/focus restoration, a missing image fallback, total image failure/retry, and delayed stale requests.

Mobile: Chromium touch emulation at 390×844 and rotation to 844×390; 320×568 with reduced motion. Tap-and-release, target alignment, modal controls and no horizontal page overflow passed. Physical iOS/Android devices and Safari were not tested.

## Visual review

Reference: `active-concept.png` (built-in Image Gen, active full-screen photo UI, superseding the welcome concept at the user's request). Final screenshots: `screenshots/desktop.png`, `screenshots/mobile.png`, `screenshots/collection.png`.

In-app browser was used first for real interactions. Automated Chrome captures supplement it because its exposed capabilities do not provide a repeatable viewport/touch emulation control. Final desktop capture is at the reference image's native 1586×992. Functional desktop suite also uses 1440×900. Both reference and final captures were inspected with `view_image`.

| Comparison | Result / intentional adaptation |
|---|---|
| Screen structure | Full-screen photographic canvas retained; no marketing page or CTA. |
| Wordmark | Compact charcoal pill, cream lettering, orange paw in upper left retained. |
| Navigation | Two 44px round controls upper right retained; semantic grid/help SVGs from Lucide. |
| Typography | Small sans controls and restrained labels retained; system font avoids network dependency. |
| Palette | Orange target/accent, charcoal translucent chrome, cream labels retained. |
| Photo treatment | Real licensed photographs replace generated example; exact paw positioning takes priority over mock composition. Blurred same-photo backing fills exposed edges. No tint on foreground photo. |
| Status and credits | Central compact status, lower-left creator GitHub link, lower-right another-cat action retained. |
| Mobile | Status moves to its own bottom row; safe-area insets, 44px controls, no overflowing text. |
| Copy | No landing copy survives. Active desktop status matches reference. Creator GitHub link replaces the main-canvas photo credit; photographer credits remain in collection/About; mobile instruction and error/loading states are deliberate functional additions. |

Concept-to-implementation fidelity was verified for the final interaction-first direction with the documented adaptations above. No outstanding functional or clipping mismatch was observed. Screenshots were taken with finite CSS animations completed to avoid recording a half-transparent entrance frame.

## Delivery

60 local WebP photographs and thumbnails. API credentials are absent from client code; the published build makes no Pexels API calls. Source/photographer/license metadata is retained. Local preview is running; no public hosting deployment has been performed.

## Photo expansion follow-up

Expanded from 20 to 60 visually reviewed photographs with annotated paw coordinates. Main canvas links to https://github.com/givemethatsewon. Credits remain in collection/About and CREDITS.md. Build, 5 unit/catalog tests and 9 browser tests passed. Earlier reference-size screenshots above document the original 20-photo release; the latest in-app preview was also visually verified.

## 200-photo release verification

- Build passed; 5 unit/catalog and 9 Chrome browser tests passed (14.7s browser suite).
- All 200 originals and 200 thumbnails decoded; metadata dimensions verified. No identical full-image hashes and no unreferenced WebP files.
- Catalog expanded to 200; mobile no-prefetch and bounded desktop startup requests now asserted.
- A manually refined point outside [0,1] was caught by the catalog test and corrected before the successful final run.
- Mobile tap, rotation, 320px screen, reduced motion, fallback/retry, stale requests and keyboard/dialog tests passed. Test screenshots were refreshed at 1440×900 desktop and 390×844 touch viewport (DPR2).
- Production IAB collection visibly shows 200; a newly added photo was selected and displayed.
- Performance comparison: [measurement report](performance/README.md). Physical devices/Safari and public hosting remain untested.


## 2026-10-22 performance v2

Build passed; 6 unit tests and 13 browser tests passed. Added AVIF fallback, unchanged mouse dwell with early intended-photo loading, lazy collection chunk, immediate touch/latest input regression coverage. Paired production benchmark: 5 fresh contexts per version and environment, 20 runs total. See performance/v2/README.md and paired.json. IAB verified canvas and 200-cat collection; mobile tests are Chromium emulation.
