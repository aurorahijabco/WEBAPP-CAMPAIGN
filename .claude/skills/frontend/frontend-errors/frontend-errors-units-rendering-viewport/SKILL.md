---
name: frontend-errors-units-rendering-viewport
description: >
  Use when a mobile hero section overflows because of `100vh`, deciding
  between the small (`svh`), large (`lvh`), and dynamic (`dvh`) viewport-unit
  families, picking between `em` and `rem` for font-size or component spacing,
  reasoning about CSS px versus device px on a HiDPI / Retina display, sizing
  a `<canvas>` backing store to match `devicePixelRatio`, handling iPhone
  notch / Dynamic Island safe areas with `env(safe-area-inset-*)`, configuring
  the `<meta name="viewport">` tag with `viewport-fit=cover`, debugging
  unexpected font-size compounding three levels deep, or migrating off the
  legacy `--vh` JavaScript workaround for the mobile-chrome viewport bug.
  Prevents the most common 2026 unit and viewport regressions : a `100vh`
  hero that gets covered by the mobile browser chrome on first load and shows
  empty whitespace once the chrome retracts, nested `1.5em` font-size
  declarations that compound to 3 375x at three levels deep, `100vw` that
  includes the desktop scrollbar gutter and overflows the body,
  `env(safe-area-inset-*)` that silently returns 0 because
  `viewport-fit=cover` was never added to the viewport meta, hardcoded
  `font-size: 14px` that blocks the user's browser zoom and font-size
  preference, `0.5px` hairline borders that render as 0 on DPR 1 displays and
  full pixel on DPR 2 displays, blurry `<canvas>` output because the backing
  store was sized in CSS pixels instead of device pixels, and the assumption
  that `1in = 96px` is a physical inch on screens.
  Covers absolute units (`px`, `pt`, `pc`, `in`, `cm`, `mm`, `Q` and the
  reference-pixel anchor `1px = 1in / 96`), the font-relative family (`em`,
  `rem`, `ex`, `cap`, `ch`, `ic`, `lh`, `rlh` plus the root-relative `rcap`,
  `rch`, `rex`, `ric`, `rlh`), the viewport-percentage families (default
  `v*`, small `sv*`, large `lv*`, dynamic `dv*`) across all six axes (`w`,
  `h`, `min`, `max`, `i` inline, `b` block), the rule that default `vh`
  currently resolves to `lvh` per MDN, the dvh-update-throttling rule (UA
  may step instead of animating during chrome transitions), the
  `<meta name="viewport" content="width=device-width, initial-scale=1,
  viewport-fit=cover">` baseline, the four `env(safe-area-inset-*)`
  variables plus `safe-area-max-inset-*` and `keyboard-inset-*`, the
  foldable-device `env(viewport-segment-*)` family, `devicePixelRatio` and
  the canvas backing-store pattern, and the rule that 100vw does not include
  scrollbar width on classic-scrollbar systems.
  Keywords: px, em, rem, vw, vh, dvh, svh, lvh, dvw, svw, lvw, dvmin, dvmax,
  dvi, dvb, lvi, lvb, svi, svb, vi, vb, vmin, vmax, ch, ex, cap, ic, lh,
  rlh, rcap, rch, rex, ric, in, cm, mm, pt, pc, Q, devicePixelRatio, DPR,
  Retina, HiDPI, env, safe-area-inset, safe-area-inset-top,
  safe-area-inset-bottom, viewport-fit, cover, meta viewport,
  keyboard-inset, viewport-segment, scrollbar-gutter, 100vh wrong on mobile,
  em compound, font too big nested, hero cut off mobile, browser chrome
  covers content, retina image blurry, viewport jumps when URL bar appears,
  notch overlapping content, font-size keeps growing, layout broken in iOS
  PWA, hairline border not visible, why is 100vh wrong, what is dvh, what
  is svh, what is lvh, em vs rem, fix 100vh mobile, safe area iPhone notch,
  retina images, how to handle notch, what viewport units to use mobile,
  why does my font keep growing
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Errors : Units, Rendering, Viewport

This skill is the operational reference for CSS length units, viewport-percentage units, font-relative units, the CSS pixel versus device pixel distinction, and the `env(safe-area-inset-*)` + `viewport-fit=cover` pairing for notch and Dynamic Island handling. It is an errors-class skill : every section is anchored to a real-world failure mode, with the spec citation that explains it. The skill does NOT cover container-query units (`cqw`, `cqh`, `cqi`, `cqb`, `cqmin`, `cqmax` ; see `[[frontend-syntax-css-container-queries]]`), `clamp()` typography (see `[[frontend-impl-typography-system]]`), or animation jank (see `[[frontend-errors-animation-jank]]`).

## Quick Reference

### Floor rules

- ALWAYS use `100dvh` (or `100svh` for guaranteed-fit) for full-height mobile heroes. NEVER use `100vh` ; per MDN it currently resolves to `100lvh`, so the hero overflows when mobile chrome is visible.
- ALWAYS use `rem` (or `%`) for `font-size`. NEVER use `em` for `font-size` in nested contexts ; it compounds (1 5 × 1 5 × 1 5 = 3 375 at three levels deep).
- ALWAYS use `em` for properties that should scale WITH the local font-size : button padding, line-height multipliers, icon sizing inside a text element. NEVER use `rem` for those ; the relationship to the local text breaks.
- ALWAYS include `viewport-fit=cover` in `<meta name="viewport">` AND pair every edge-touching surface with `env(safe-area-inset-*)`. NEVER use `env(safe-area-inset-*)` alone ; without `viewport-fit=cover` the values are 0 on iOS.
- ALWAYS multiply `<canvas>` backing-store width and height by `devicePixelRatio` and call `ctx.scale(dpr, dpr)`. NEVER set `canvas.width = canvas.style.width` ; the result is blurry on Retina.
- ALWAYS prefer `100%` over `100vw` for full-bleed sections that are children of `<body>`. NEVER use `100vw` without considering classic-scrollbar systems where `100vw` overflows by the scrollbar width.
- ALWAYS use `rem`-based font sizes that respect the user's browser zoom and font-size preference. NEVER hardcode `font-size: 14px` ; it blocks accessibility scaling.
- NEVER use `in`, `cm`, `mm`, `Q` for screen layouts. They are anchored to the CSS reference inch (`1in = 96px`), NOT to physical inches. Reserve for `@media print`.

### Decision tree 1 : Which viewport unit for which use case ?

```
Full-height hero that should adapt as mobile chrome shows / hides ?
  -> 100dvh. UA throttles updates (step, not animate) during chrome transition.

Hero / modal that must NEVER overflow even with chrome fully visible ?
  -> 100svh. Conservative ; works on every device.

Full-screen overlay that should fill the maximum extent when chrome is retracted ?
  -> 100lvh. Equivalent to current default vh behavior per MDN.

Writing-mode-agnostic full-width container (vertical-rl Japanese, ltr Latin, rtl Arabic) ?
  -> 100dvi (or 100vi for legacy). Inline-axis percentage, follows writing-mode.

Full-block-axis container with writing-mode awareness ?
  -> 100dvb (or 100vb for legacy).

Layered fallback for older browsers that lack dv* ?
  -> Author 100svh as the conservative default, override with 100dvh inside an
     @supports (height: 100dvh) block. Modern browsers get adaptive ; older
     get guaranteed-fit.

Legacy support needed and you cannot rewrite ?
  -> 100vh, but acknowledge mobile chrome catastrophe. Document the trade-off.
     Pre-2022 community workaround : --vh CSS custom property updated from JS
     on resize. This is now obsolete ; migrate to dvh as soon as possible.
```

### Decision tree 2 : `em` or `rem` ?

```
Property is font-size ?
  -> rem (or %). em compounds in nested rules and produces unpredictable
     sizing three levels deep.

Property is button / control padding that should grow with button label text ?
  -> em. Padding 0 5em 1em on a <button> scales naturally with the button's
     own font-size.

Property is line-height ?
  -> Unitless (preferred ; multiplies the local font-size without compounding
     inheritance issues) OR em (same scaling behavior).

Property is a container max-width for prose ?
  -> ch. max-width: 65ch produces the canonical 45-to-75-character measure.

Property is an icon height that aligns with surrounding lowercase text ?
  -> ex (height of x). The icon sits flush with the baseline of lowercase glyphs.

Property is the gap between flex items in a card grid that scales with the
parent's rem-based font-size ?
  -> rem. Predictable across nesting.

Property is a uppercase-only logo height aligned to capital-letter visual extent ?
  -> cap. Excludes ascenders and descenders.
```

### Decision tree 3 : Notch / safe-area / device-pixel ?

```
Designing a page that touches the top, bottom, left, or right viewport edge ?
  -> Add viewport-fit=cover to the viewport meta tag AND pad each edge-touching
     surface with the matching env(safe-area-inset-*) variable, wrapped in calc().

Sticky bottom nav above the iPhone home indicator ?
  -> padding-bottom: calc(1rem + env(safe-area-inset-bottom));

Sticky top nav under the iPhone Dynamic Island ?
  -> padding-top: calc(0.75rem + env(safe-area-inset-top));

Foldable / dual-screen layout that should respect the hinge ?
  -> env(viewport-segment-width 0 0), env(viewport-segment-left 0 0), etc.
     The integers select which segment (0-based row, column).

Soft keyboard overlay pushing UI ?
  -> navigator.virtualKeyboard.overlaysContent = true PLUS env(keyboard-inset-*).
     Chromium-only ; feature-detect and fall back to viewport resize.

Canvas / WebGL drawing on a Retina / HiDPI display ?
  -> Read devicePixelRatio. Set canvas.style.width / height in CSS px ; set
     canvas.width / height to size * dpr. Call ctx.scale(dpr, dpr).

Raster image that should stay sharp on HiDPI ?
  -> <img srcset="img.png 1x, img-2x.png 2x" src="img.png" ...> Let the browser
     pick the right asset.

Hairline border that must render at exactly one device pixel ?
  -> Accept 1 CSS px (renders fine on every DPR) OR use SVG line of stroke-width=1.
     NEVER use border: 0.5px ; behaviour is inconsistent across DPRs.
```

## Patterns

### Pattern : Mobile-safe full-height hero

```css
.hero {
  min-height: 100svh;
}

@supports (height: 100dvh) {
  .hero {
    min-height: 100dvh;
  }
}
```

`100svh` is the conservative baseline. Where supported, `100dvh` upgrades the experience to adapt as chrome retracts. Both avoid the `100vh` catastrophe.

### Pattern : Safe-area-respecting sticky footer

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
footer {
  position: sticky;
  bottom: 0;
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
}
```

The `calc()` wrapper is mandatory ; `env()` values cannot be added to a bare length without `calc()`. The MDN warning : `env(SAFE-AREA-INSET-BOTTOM)` is invalid (uppercase) and falls back silently.

### Pattern : Predictable font-size + scaling padding

```css
:root {
  font-size: 100%; /* respects user browser preference, typically 16px */
}

body {
  font-size: 1rem; /* explicit */
}

.heading {
  font-size: 1.5rem; /* always 1.5x root, regardless of nesting */
}

.button {
  font-size: 1rem;
  padding: 0.5em 1em; /* em so padding scales WITH the button's font-size */
}

.button.large {
  font-size: 1.25rem;
  /* padding stays 0.5em 1em ; the em re-resolves against the new font-size */
}
```

`rem` for font-size avoids compounding. `em` for padding lets the button's footprint grow naturally when the label text grows.

### Pattern : Retina-sharp canvas

```js
function setupCanvas(canvas, size) {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width  = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.width  = Math.floor(size * dpr);
  canvas.height = Math.floor(size * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return ctx;
}
```

CSS pixels are the layout unit ; backing-store pixels carry the actual rendering resolution. Without the scale, every drawing call is sized in backing-store pixels and the result is half-size on DPR 2.

### Pattern : HiDPI raster images

```html
<img
  src="hero.jpg"
  srcset="hero-1x.jpg 1x, hero-2x.jpg 2x, hero-3x.jpg 3x"
  width="800"
  height="450"
  alt="..."
/>
```

The browser picks the highest-density asset that fits the display. Pair with explicit `width` / `height` to reserve the layout box (see `[[frontend-perf-core-web-vitals-inp]]`).

### Pattern : Writing-mode-agnostic full-bleed

```css
.section {
  inline-size: 100dvi;
  block-size:  100dvb;
}
```

`100dvi` resolves to width in horizontal writing modes and height in vertical ones. Combine with logical properties (`inline-size`, `block-size`, `padding-inline`, `padding-block`) to keep layouts portable across `writing-mode` and `direction`.

### Pattern : Scrollbar-aware 100vw

```css
:root {
  scrollbar-gutter: stable;
}

.full-bleed {
  width: 100%; /* preferred for body children */
}

.alt-full-bleed {
  width: 100dvw; /* if you specifically need the dynamic viewport width */
  margin-inline: calc(50% - 50dvw); /* break out of a constrained parent */
}
```

`100vw` includes the scrollbar gutter on classic-scrollbar systems. `100%` of a body child sidesteps the issue. `scrollbar-gutter: stable` reserves the gutter consistently so layouts do not jump when scrollbars appear / disappear.

## Baseline status

| Surface | Status | Notes |
|---------|--------|-------|
| `vh`, `vw`, `vmin`, `vmax`, `vi`, `vb` | Widely Available since July 2015 | Default `vh` resolves to `lvh` per MDN. |
| `sv*`, `lv*`, `dv*` families | Newly Available 2023, Widely Available 2026 | Cross-browser : Chrome 108+, Edge 108+, Firefox 101+, Safari 15 4+. |
| `env(safe-area-inset-*)` | Widely Available since January 2020 | Requires `viewport-fit=cover` on iOS. |
| `env(keyboard-inset-*)` | Limited Availability | Chromium-only behind `navigator.virtualKeyboard.overlaysContent = true`. |
| `env(viewport-segment-*)` | Limited Availability | Foldable / dual-screen devices only. |
| `devicePixelRatio` | Baseline Widely Available | Common values 1 / 1 5 / 2 / 2 5 / 3 / 4. |
| `scrollbar-gutter` | Baseline Widely Available | Reserves the scrollbar space ; `stable` is the common value. |

## Cross-references

- `[[frontend-impl-responsive-layout-fluid]]` : fluid type-scale, `clamp()`, container-query-based layout.
- `[[frontend-impl-typography-system]]` : type-scale tokens, `clamp()`-based fluid sizing, webfont strategy.
- `[[frontend-syntax-css-container-queries]]` : container-query units (`cqw`, `cqh`, `cqi`, `cqb`, `cqmin`, `cqmax`).
- `[[frontend-perf-core-web-vitals-inp]]` : CLS prevention via explicit `width` / `height` on images.
- `[[frontend-errors-layout-pitfalls]]` : layout-specific failure modes.

## Reference Links

- [references/methods.md](references/methods.md) : full unit surface, viewport family table with `w` / `h` / `min` / `max` / `i` / `b` axes, `env()` variable list, `<meta name="viewport">` attribute matrix.
- [references/examples.md](references/examples.md) : renderable HTML demo comparing `100vh` vs `100dvh` vs `100svh` side-by-side, safe-area inset visualisation, retina canvas pattern.
- [references/anti-patterns.md](references/anti-patterns.md) : nine anti-patterns with symptom, root cause, and fix.

## Authoritative sources

- [MDN : length](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19)
- [MDN : CSS values and units : Numeric data types](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_values_and_units/Numeric_data_types) (verified 2026-05-19)
- [MDN : env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env) (verified 2026-05-19)
- [MDN : Window.devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) (verified 2026-05-19)
- [MDN : `<meta name="viewport">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport) (verified 2026-05-19)
- [W3C : css-values-4 : viewport-relative-lengths](https://www.w3.org/TR/css-values-4/#viewport-relative-lengths) (verified 2026-05-19)
- [web.dev : viewport-units](https://web.dev/blog/viewport-units) (verified 2026-05-19)
