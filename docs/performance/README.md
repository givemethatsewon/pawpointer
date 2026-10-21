# 60 → 200 photos: performance comparison

Measured on the same local Mac/Chrome installation, production Vite preview at port 4174. Three fresh contexts for each device profile, HTTP cache disabled. Desktop: 1440×900, DPR1, unthrottled. Mobile: 390×844, DPR2, touch emulation, 4× CPU slowdown, 1.6 Mbps download, 750 Kbps upload, 150ms latency. These are lab measurements, not physical-device or deployed-site measurements.

`ready` measures navigation through decoded photo state. Transition measures input through the next decoded photo state; both include the intentional 1,200ms stillness timer. The benchmark does not wait for the visual entrance animation to finish. Collection time measures opening the dialog, not downloading every thumbnail. Three pointer positions per run are used; they are a small reproducible sample, not all 200 photo paths.

| Median | Original 60 | Final 200 |
| --- | ---: | ---: |
| Desktop ready | 1335 ms | 1332 ms |
| Desktop transition | 1249 ms | 1249 ms |
| Mobile ready | 3697 ms | 3760 ms |
| Mobile transition | 2059 ms | 1979 ms |
| Mobile collection open | 211 ms | 245 ms |

The center image is unchanged, so initial-load comparison uses the same photograph. At the other positions the nearest photo can change; transition differences include asset choice, not just catalog size.

| Mobile target | Original 60 | Final 200 |
| --- | ---: | ---: |
| 80,180 | 2059 ms | 2323 ms |
| 300,600 | 1946 ms | 1965 ms |
| 180,400 | 2110 ms | 1979 ms |

The aggregate median improved slightly; the first sampled transition became slower. These results do not establish that every photograph is faster. Initial-load long-task observer recorded no >50ms tasks in these samples; this is not an INP or full runtime smoothness audit.

## Asset size and loading policy

- Bundled photos plus thumbnails: 10.74 → 41.29 MiB. This is storage/deployment size, not initial download size.
- Full-image median: 126.3 → 179.1 KiB; maximum: 461.4 → 464.8 KiB.
- Compressed application JS transfer grows from roughly 79 KiB to 91 KiB due to catalog metadata.
- Startup regression tests assert at most two photo requests on desktop and exactly one on touch. Thumbnails are not requested before the collection is opened.
- Speculative next-photo loading initially caused competition on the mobile profile: the 200-photo pre-optimization run had a 2,446ms transition median. It is now disabled on touch/coarse devices; desktop keeps one speculative candidate.
- 22 oversized full images were selectively recompressed; eight also needed reduced dimensions. The remaining 178 were not changed. Largest before/after pairs were visually checked. Full images fit a 500 KiB ceiling. The per-file settings and byte counts are in `asset-optimization.json`.

## Reproduce and inspect

Run `node scripts/benchmark.mjs <label>` after `npm run build`, with production preview on port 4174. Raw records: `baseline-60.json`, `expanded-200.json` (before touch prefetch fix), `final-200.json` (prefetch fix), `optimized-200.json` (final asset optimization). No credentials are needed.
