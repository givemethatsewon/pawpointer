# Paw coordinate visual audit — 2026-10-22

Reviewed all 200 photos as contact sheets with the existing target marker (sheet-0 through sheet-9). Enlarged 24 ambiguous candidates; corrected 14 entries in both photos.json and the runtime gallery.json. No photos removed or re-encoded. Before/after coordinates and reasons are recorded in ../paw-coordinate-audit.json.

The user-reported sofa kitten is pexels-16761390. The old point was on a hind paw beside the tail; it now points at the visible pink front paw. A separate image, pexels-12125507, really did point at a dangling tail; it now points at the front paw on the tabletop. Other fixes include grass, a face, cord/toy, shadow, and paw-tip refinements. Some suspicious small previews were already valid (e.g. a paw covering a face); those stayed unchanged.

Visual review is the semantic check: geometry tests alone can prove that a stored point lands at the cursor, but cannot tell a tail from a paw. This is a manual review, not an automated anatomical accuracy guarantee. In future additions, inspect the marked full image and an enlarged crop before importing it.
