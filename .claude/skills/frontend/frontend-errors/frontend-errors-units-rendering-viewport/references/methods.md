# References : Units, Viewport, Device-Pixel Surface

Complete surface for `frontend-errors-units-rendering-viewport`. All citations verified 2026-05-19.

## Absolute lengths

Source : [MDN : length](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19).

| Unit | Definition | Use |
|------|------------|-----|
| `px` | Reference pixel. `1px = 1in / 96`. | Screen layouts ; the default authoring unit. |
| `pt` | `1pt = 1in / 72`. | Print stylesheets. |
| `pc` | `1pc = 12pt = 16px`. | Print stylesheets. |
| `in` | CSS reference inch. `1in = 96px`. NOT a physical inch on screens. | Print only. |
| `cm` | `1cm = 96px / 2.54 ≈ 37.795px`. NOT physical cm on screens. | Print only. |
| `mm` | `1mm = 1cm / 10`. | Print only. |
| `Q` | `1Q = 1cm / 40 = 1mm / 4`. | Print only. |

The MDN warning : "For low-dpi devices, the unit `px` represents the physical reference pixel ; other units are defined relative to it. The consequence of this definition is that on such devices, dimensions described in inches, centimeters, or millimeters don't necessarily match the size of the physical unit with the same name."

## Font-relative lengths

Source : [MDN : length / font-relative_lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length#font-relative_lengths) (verified 2026-05-19).

| Unit | Reference | Use |
|------|-----------|-----|
| `em` | Calculated `font-size` of the element ; on `font-size` itself, the inherited size. COMPOUNDS in nested rules. | Component-internal scaling (padding, line-height, icon size). |
| `rem` | `font-size` of the root element. Does NOT compound. | Font-size declarations, root-level spacing, predictable global sizing. |
| `ex` | x-height of the active font. Typically `1ex ≈ 0.5em`. | Inline-icon alignment with lowercase baseline. |
| `cap` | Cap height (nominal height of capital letters). | Uppercase-only logo / label height. |
| `ch` | Advance of `0` glyph (U+0030). | `max-width` for prose readability (`65ch`). |
| `ic` | Advance of `水` glyph (U+6C34, CJK water ideograph). | CJK typography spacing. |
| `lh` | Computed `line-height` of the element. | Vertical rhythm spacing. |
| `rlh` | Computed `line-height` of the root. | Root-anchored vertical rhythm. |
| `rcap` | Root element's cap height. | Cross-component cap alignment. |
| `rch` | Root element's `ch`. | Cross-component prose width. |
| `rex` | Root element's x-height. | Cross-component icon alignment. |
| `ric` | Root element's `ic`. | Cross-component CJK spacing. |

### Compounding rule

```css
html { font-size: 16px; }
.a { font-size: 1.5em; }  /* 24px */
.a .a { font-size: 1.5em; } /* 24px * 1.5 = 36px */
.a .a .a { font-size: 1.5em; } /* 36px * 1.5 = 54px */
```

The same selectors with `rem` produce `24px` at every depth. Compounding is the reason `em` is the wrong unit for `font-size` in nested contexts.

### Accessibility rule

The MDN guidance : "Many users increase their user agent's default font size to make text more legible. Absolute lengths can cause accessibility problems because they are fixed and do not scale according to user settings. For this reason, prefer relative lengths (such as `em` or `rem`) when setting `font-size`."

`font-size: 14px` blocks browser font-size preference. `font-size: 0.875rem` respects it.

## Viewport-percentage lengths

Source : [MDN : length / viewport-percentage_lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport-percentage_lengths) (verified 2026-05-19), [W3C : css-values-4](https://www.w3.org/TR/css-values-4/#viewport-relative-lengths) (verified 2026-05-19), [web.dev : viewport-units](https://web.dev/blog/viewport-units) (verified 2026-05-19).

### Family x axis matrix

The full matrix is four families x six axes :

| Axis | Default | Small | Large | Dynamic |
|------|---------|-------|-------|---------|
| Width | `vw` | `svw` | `lvw` | `dvw` |
| Height | `vh` | `svh` | `lvh` | `dvh` |
| min | `vmin` | `svmin` | `lvmin` | `dvmin` |
| max | `vmax` | `svmax` | `lvmax` | `dvmax` |
| Inline | `vi` | `svi` | `lvi` | `dvi` |
| Block | `vb` | `svb` | `lvb` | `dvb` |

### Family semantics

| Family | Viewport size assumed | Stable ? | Use |
|--------|----------------------|----------|-----|
| Default (`vw`, `vh`, ...) | UA-default ; currently equivalent to large per MDN | Stable | Legacy compatibility only. |
| Small (`svw`, `svh`, ...) | UA chrome fully expanded | Stable | Guaranteed-to-fit content. |
| Large (`lvw`, `lvh`, ...) | UA chrome fully retracted | Stable | Maximum extent ; modal overlays. |
| Dynamic (`dvw`, `dvh`, ...) | Current chrome state | NOT stable | Hero / full-screen layouts that should adapt. |

### Dynamic-update throttling rule

Per the W3C spec : "The UA is not required to animate the dynamic viewport-percentage units while expanding and retracting any relevant interfaces, and may instead calculate the units as if the relevant interface was fully expanded or retracted during the UI animation."

Practical implication : `dvh` jumps from old value to new value at the start or end of the chrome transition. It does NOT tween at 60 fps. Transitions declared on `dvh`-sized elements produce step changes, not smooth animation.

### Scrollbar trap

Per MDN : "None of the viewport units take the size of scrollbars into account. On systems that have classic scrollbars enabled, an element sized to `100vw` will therefore be a little bit too wide."

Mitigation : `scrollbar-gutter: stable` on `:root` reserves the gutter, but does not change that `100vw` is the full viewport width including the gutter. Prefer `width: 100%` for full-bleed sections that are direct children of `<body>`.

### Virtual-keyboard exclusion

Per web.dev : "The on-screen keyboard doesn't affect viewport units." Authors needing keyboard-aware layout MUST use `env(keyboard-inset-*)` from the VirtualKeyboard API, not viewport units.

### Writing-mode-aware variants

| Unit | Resolves to in horizontal-tb (default Latin) | Resolves to in vertical-rl (Japanese) |
|------|----------------------------------------------|---------------------------------------|
| `vi` | viewport width | viewport height |
| `vb` | viewport height | viewport width |

Use `vi` / `vb` for writing-mode-portable layouts ; pair with logical properties (`inline-size`, `block-size`, `padding-inline`, `padding-block`).

## `env()` environment variables

Source : [MDN : env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env) (verified 2026-05-19).

### Syntax

```css
property: env(<variable-name> [, <fallback> ]);
```

Cannot stand alone as part of an arithmetic expression ; wrap in `calc()` :

```css
/* Wrong */
padding-bottom: 1rem + env(safe-area-inset-bottom);

/* Right */
padding-bottom: calc(1rem + env(safe-area-inset-bottom));
```

Variable names are case-sensitive. `env(SAFE-AREA-INSET-BOTTOM)` is invalid and silently returns the fallback or `0`.

### Safe-area variables

| Variable | Meaning |
|----------|---------|
| `safe-area-inset-top` | Top inset to clear notch / Dynamic Island / status bar. |
| `safe-area-inset-right` | Right inset (landscape notches). |
| `safe-area-inset-bottom` | Bottom inset to clear home indicator. |
| `safe-area-inset-left` | Left inset (landscape notches). |
| `safe-area-max-inset-top` | Static maximum of `safe-area-inset-top`. |
| `safe-area-max-inset-right` | Static maximum of `safe-area-inset-right`. |
| `safe-area-max-inset-bottom` | Static maximum of `safe-area-inset-bottom`. |
| `safe-area-max-inset-left` | Static maximum of `safe-area-inset-left`. |

Per MDN : the safe-area-inset variables are `0` if the viewport is a rectangle and no UI features are occupying viewport space ; otherwise a px value greater than `0`. They REQUIRE `viewport-fit=cover` in the viewport meta on iOS Safari.

### Keyboard-inset variables (Limited Availability)

| Variable | Meaning |
|----------|---------|
| `keyboard-inset-top` | Top of the on-screen keyboard. |
| `keyboard-inset-right` | Right edge. |
| `keyboard-inset-bottom` | Bottom of the keyboard area. |
| `keyboard-inset-left` | Left edge. |
| `keyboard-inset-width` | Keyboard width. |
| `keyboard-inset-height` | Keyboard height. |

Chromium-only ; requires `navigator.virtualKeyboard.overlaysContent = true` from JS.

### Viewport-segment variables (Limited Availability)

For foldable / dual-screen devices :

```css
.left-pane  { width: env(viewport-segment-width  0 0); }
.right-pane { width: env(viewport-segment-width  1 0); }
.left-pane  { left:  env(viewport-segment-left   0 0); }
.right-pane { left:  env(viewport-segment-left   1 0); }
```

The two integers select column and row in the segment grid (0-based).

## `<meta name="viewport">` attribute matrix

Source : [MDN : `<meta name="viewport">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport) (verified 2026-05-19).

### Canonical declaration

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### `viewport-fit` values

| Value | Behavior |
|-------|----------|
| `auto` | Default. iOS Safari insets content from cutout automatically ; safe-area-inset values resolve to 0. |
| `contain` | Viewport scaled to fit the largest rectangle inscribed within the display. |
| `cover` | Viewport scaled to fill the device display. SAFE-AREA-INSET variables become non-zero. Pair with `env()` padding to avoid occlusion. |

### Other tokens

| Token | Default | Notes |
|-------|---------|-------|
| `width=device-width` | none | Required for responsive layout. |
| `initial-scale=1` | 1 | Initial zoom level. |
| `minimum-scale=N` | 0.1 | Minimum allowed zoom. |
| `maximum-scale=N` | 10 | Maximum allowed zoom. AVOID setting below user-set default (blocks zoom). |
| `user-scalable=yes\|no` | yes | NEVER set to `no` ; blocks accessibility zoom. |
| `interactive-widget=resizes-content\|resizes-visual\|overlays-content` | resizes-visual | Controls how the visual viewport reacts to the virtual keyboard. |

## `devicePixelRatio` and HiDPI

Source : [MDN : Window.devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) (verified 2026-05-19).

Definition : "The ratio of the resolution in physical pixels to the resolution in CSS pixels for the current display device."

| DPR | Display |
|-----|---------|
| 1.0 | Classic 96-DPI |
| 1.25, 1.5 | Some Windows scaling settings |
| 2.0 | Retina MacBook, iPhone, high-end Android |
| 2.5 | Galaxy S series mid-tier |
| 3.0 | iPhone Plus / Pro Max, Pixel Pro |
| 4.0 | Some 4K Android tablets |

### Canvas backing-store pattern

```js
function setupCanvas(canvas, sizeCss) {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width  = `${sizeCss}px`;
  canvas.style.height = `${sizeCss}px`;
  canvas.width  = Math.floor(sizeCss * dpr);
  canvas.height = Math.floor(sizeCss * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return ctx;
}
```

Without the scale call, every drawing call uses backing-store coordinates and the result appears at half-size on DPR 2.

### Raster image strategy

```html
<img
  src="img.jpg"
  srcset="img.jpg 1x, img-2x.jpg 2x, img-3x.jpg 3x"
  width="800"
  height="450"
  alt="..."
/>
```

The browser picks the highest-density asset that matches the display.

### Listening for DPR changes

```js
const mq = window.matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
mq.addEventListener("change", () => {
  console.log("DPR changed", window.devicePixelRatio);
});
```

DPR changes when the user moves the window between monitors of different density, or changes the OS zoom level.

## Subpixel rendering rules

Source : [MDN : devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) (verified 2026-05-19).

| Border | Renders at |
|--------|-----------|
| `border: 1px` on DPR 1 | 1 device pixel |
| `border: 1px` on DPR 2 | 2 device pixels |
| `border: 0.5px` on DPR 1 | 0 or 1 device pixel (rounds inconsistently) |
| `border: 0.5px` on DPR 2 | 1 device pixel (true hairline) |
| `border: 0.5px` on DPR 3 | 1 or 2 device pixels (rounds inconsistently) |

Robust hairline alternatives :

1. Accept `1px` and live with it. Best for cross-DPR consistency.
2. SVG line with `stroke-width="1"` and SVG viewBox sized to match.
3. `border: 1px solid` + `transform: scale(0.5)` on a wrapper. Visual halving without subpixel uncertainty.

DPR-branching :

```css
.hairline { border: 1px solid; }

@media (min-resolution: 2dppx) {
  .hairline { border: 0.5px solid; }
}
```

## `scrollbar-gutter`

Source : [MDN : scrollbar-gutter](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter) (verified 2026-05-19, Baseline Widely Available).

| Value | Behavior |
|-------|----------|
| `auto` (default) | Gutter present only when content overflows. |
| `stable` | Gutter always reserved on the inline-end side. Recommended for app layouts to prevent jumps. |
| `stable both-edges` | Gutter reserved on both edges for symmetric layouts. |

```css
:root {
  scrollbar-gutter: stable;
}
```

Combine with `100%` instead of `100vw` for full-bleed sections to avoid the scrollbar-overflow trap.
