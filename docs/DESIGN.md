# Paw Pointer — interaction-first design

The user's final direction is immediate play: no landing, hero, start button or onboarding gate. `active-concept.png` is the visual reference; `concept.png` is superseded.

## Surface
A single edge-to-edge photographic stage. Top-left compact charcoal wordmark and orange paw; top-right 44px collection and help buttons. Bottom-left real photographer/source credit. Bottom-center compact charcoal status pill. Bottom-right keyboard shortcut. Real licensed cat photographs replace the illustrative concept cat. The target is a small orange ring, not a ball. These are intentional fidelity changes required by the actual interaction and licensed assets.

## Tokens
Canvas #f5f0df (warm paper, only while waiting), ink #242822, accent #f25a32, cream #fff9ec. Chrome uses translucent charcoal with blur and a faint border to remain readable on diverse photographs. System rounded sans for small controls; wordmark weight 800, tracking -.04em. Insets 24px desktop, 16px mobile plus safe area. Controls at least 44px. Status 13px/1.4. Credit 12px/1.4. Motion 220ms opacity; no image transform animation because paw alignment must be exact. Reduced motion disables fading and pulses.

## States
Loading is part of the live stage, never a landing page. Capture pointer immediately; after 1.2 seconds of stillness select and decode a photo. The initial automatic target is viewport center until actual pointer/touch input arrives. Searching retains the previous photo, with a progress ring at the new position. A newer input invalidates any stale image decode. A photo must be ready before replacing the current photo.

Touch selects a point on pointerdown; mouse uses pointermove. Space gets another cat, arrow keys move a visible target, Escape closes a dialog. Collection is a credited set of the app's cats, not a stock download service. About explains the toy, credits Pointer Pointer as inspiration, and credits Sewon. Native dialogs trap focus and restore it. Dialog interaction pauses the canvas.

## Composition and math
Normalized nearest-neighbor selection; exclude the last four photos. At 1.2x cover size, translate by cursor minus normalized paw multiplied by rendered size. Use the same image blurred behind for exposed edges. Resizing repositions the current photo with a normalized target. Metadata and image paths are bundled; API key is used only by offline authoring tools, never frontend.
