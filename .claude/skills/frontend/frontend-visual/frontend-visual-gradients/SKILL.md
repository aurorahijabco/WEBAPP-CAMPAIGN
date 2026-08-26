---
name: frontend-visual-gradients
description: >
  Use when a gradient between two complementary or distant colours looks muddy in the middle, when a two-stop linear gradient has visible banding on a large surface, when a "mesh" gradient is needed but CSS lacks a native mesh function, when an animated gradient (rotating hue ring, slowly shifting hero) is required without dropping frames, when a conic gradient is wanted for a pie chart or loading ring, when a repeating pattern (stripes, checkerboard, grid) should be expressed in CSS rather than an image, when a gradient on text needs `background-clip: text`, or when a gradient must respect `prefers-reduced-motion`.
  Prevents the default-sRGB-interpolation muddy-midpoint, the untyped-custom-property gradient that snaps instead of animating, `background-attachment: fixed` parallax (a known compositor disaster on mobile), 30-stop gradients used to "smooth out" what an interpolation-space change would have fixed, conic-gradient pie charts shipped without `role="img"` and an `aria-label`, animated gradients shipped without a `prefers-reduced-motion` gate, and the assumption that mesh gradients are impossible in CSS (they are emulated by stacking radial gradients).
  Covers `linear-gradient()`, `radial-gradient()`, `conic-gradient()`, their `repeating-*` variants, the colour-interpolation-method syntax (`linear-gradient(in oklch to right, ...)` and the polar `in oklch longer hue` form for hue-arc control), multi-stop gradients with explicit positions, hard colour stops for stripes (`red 0 50%, blue 50% 100%`), midpoint hints for asymmetric blends (`red, 30%, blue`), layered gradients on a single element (`background: g1, g2, g3;`) for mesh emulation, animated gradients via `@property --gradient-angle` (or any typed custom), gradient-on-text via `background-clip: text` + `color: transparent`, performance considerations (paint-cost of many stops, compositor-friendly opacity vs background-position animation), accessibility for informative gradients (`role="img"` + `aria-label`), and motion-sensitivity gating with `@media (prefers-reduced-motion: reduce)`.
  Keywords: linear-gradient, radial-gradient, conic-gradient, repeating-linear-gradient, repeating-radial-gradient, repeating-conic-gradient, color-interpolation-method, in oklch, in oklab, in srgb, in lab, in lch, in hsl, in hwb, shorter hue, longer hue, increasing hue, decreasing hue, color hint, midpoint hint, hard color stop, multi-stop, gradient stops, mesh gradient, mesh emulation, layered gradient, stacked radial gradient, gradient angle, gradient animation, animated gradient, @property gradient, background-clip text, gradient on text, repeating gradient, stripes, checkerboard, conic pie chart, loading ring, color wheel, gradient banding, gradient muddy, gradient flat, gradient midpoint gray, animated gradient janky, mesh gradient hard, why does gradient look stripey, why does gradient look muddy, how to make smooth gradient, how to animate gradient, how to make mesh gradient, how to make gradient on text.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Visual Gradients

This skill defines deterministic rules for shipping CSS gradients (`linear-gradient`, `radial-gradient`, `conic-gradient`, their `repeating-*` variants), choosing the right colour-interpolation space to avoid muddy midpoints, animating gradients via typed custom properties, emulating mesh gradients with layered radials, and gating animated gradients for motion sensitivity. CSS gradients have been Baseline Widely Available since July 2015; the `in <colorspace>` interpolation hint (with polar hue arc modifiers) is Baseline 2024.

This skill builds on `[[frontend-syntax-css-color-modern]]` (`oklch`, `color-mix`, relative-colour) and `[[frontend-theming-color-palette-oklch]]` (palette shades to feed into gradients). Animation primitives come from `[[frontend-perf-animation-gpu-containment]]` (compositor-only rule + `@property`).

Sources : [MDN: linear-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient) (verified 2026-05-19), [MDN: conic-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/conic-gradient) (verified 2026-05-19), [MDN: `<gradient>`](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient) (verified 2026-05-19), [W3C: CSS Images Module Level 4](https://www.w3.org/TR/css-images-4/) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

## Quick Reference

### Gradient functions

| Function | Direction control | Use when |
|----------|-------------------|----------|
| `linear-gradient(<dir>, <stops>)` | `to <side-or-corner>` keyword OR `<angle>` (`0deg` = `to top`, `90deg` = `to right`) | Two-colour across an axis, simple hero backgrounds, accent strips. |
| `radial-gradient(<shape> at <pos>, <stops>)` | `circle` or `ellipse`, optional `<size>` keyword, `at <position>` | Spot highlights, vignettes, soft glows, mesh-emulation building blocks. |
| `conic-gradient([from <angle>] [at <position>], <stops>)` | `from <angle>` (default `0deg` = top); `at <position>` (default `center`) | Pie charts, loading rings, colour wheels, sweep effects. |
| `repeating-linear-gradient(...)` | same as linear | Diagonal stripes, ribbons, ruled paper. |
| `repeating-radial-gradient(...)` | same as radial | Concentric rings. |
| `repeating-conic-gradient(...)` | same as conic | Checkerboards, slice patterns. |

### Stops cheat-sheet

| Form | Example | Meaning |
|------|---------|---------|
| Implicit positions | `linear-gradient(red, blue)` | Stops evenly distributed. |
| Explicit positions | `linear-gradient(red 0%, yellow 50%, blue 100%)` | Authoritative positions. |
| Hard stop (two positions on one stop) | `linear-gradient(red 0 50%, blue 50% 100%)` | Sharp transition at 50% (creates a stripe). |
| Midpoint hint | `linear-gradient(red, 30%, blue)` | Pulls the midpoint between the two colours to the 30% mark. |
| Repeating with hard stops | `repeating-linear-gradient(45deg, #ccc 0 10px, #fff 10px 20px)` | Diagonal stripe pattern, 10px wide. |

### Colour-interpolation hint (Baseline 2024)

```css
/* default = sRGB; OFTEN muddy at midpoints */
linear-gradient(to right, blue, yellow)

/* perceptually-uniform interpolation; cleaner midpoint */
linear-gradient(in oklch to right, blue, yellow)

/* polar space with hue arc selection */
linear-gradient(in oklch longer hue, red, lime)
```

| Form | Use |
|------|-----|
| `in oklab` | Rectangular perceptual; best general-purpose default for tints / shades / two-colour blends. |
| `in oklch` | Polar perceptual; required when you also want a hue-arc modifier. |
| `in srgb` | The legacy default. AVOID unless intentionally targeting the legacy mid-grey effect. |
| `in lab` / `in lch` | Older perceptual spaces; OKLCH/OKLab preferred per [MDN: linear-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient) (verified 2026-05-19). |
| `in hsl` / `in hwb` | Hue-driven legacy spaces; useful for rainbow gradients where the cylindrical model is desired. |

Hue-interpolation modifiers (polar spaces only) :

| Modifier | Effect |
|----------|--------|
| `shorter hue` (default) | Travel via the shortest arc between hues. |
| `longer hue` | Travel via the longer arc (full-spectrum rainbows). |
| `increasing hue` | Always increasing hue angle. |
| `decreasing hue` | Always decreasing hue angle. |

### Animated gradients via `@property`

```css
@property --grad-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.hero {
  background: linear-gradient(var(--grad-angle), #4d4dff, #ff66cc);
  background-size: 200% 200%;
  animation: spin 12s linear infinite;
}
@keyframes spin { to { --grad-angle: 360deg; } }
```

Without `@property` registration the custom property is interpolation-opaque and the angle would snap at the end of each cycle ([MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19), Baseline 2024).

ALWAYS gate animated gradients behind `prefers-reduced-motion` :

```css
@media (prefers-reduced-motion: reduce) {
  .hero { animation: none; }
}
```

### Mesh gradient (emulation)

CSS has no native mesh-gradient function. Stack multiple radial gradients :

```css
.mesh {
  background:
    radial-gradient(circle at 20% 30%, oklch(0.72 0.18 320) 0%, transparent 50%),
    radial-gradient(circle at 80% 40%, oklch(0.72 0.18 220) 0%, transparent 55%),
    radial-gradient(circle at 50% 80%, oklch(0.72 0.18 110) 0%, transparent 60%),
    oklch(0.95 0.02 240);
}
```

Each radial is positioned at a different point, fades to transparent, and stacks over a solid base. The visible result reads as a four-colour mesh blend.

## Decision Trees

### Decision : linear, radial, or conic?

```
What shape does the colour transition follow?

  A line (across, diagonal, top to bottom)
    -> linear-gradient(<dir>, ...)
       Add `in oklch` or `in oklab` for clean midpoints.

  Outward from a point (spotlight, vignette, glow)
    -> radial-gradient([shape] at <pos>, ...)
       `circle` for a perfect circle; `ellipse` (default) follows
       the box's aspect ratio.

  Sweeping around a centre point (pie chart, loading ring, colour wheel)
    -> conic-gradient([from <angle>] [at <pos>], ...)
       Stops expressed in degrees or percentages.

  Multiple radial "blobs" blending together (mesh-style)
    -> Stack multiple radial-gradient layers on the same element
       with transparency fade-outs and an underlying solid base.

  A repeating geometric pattern (stripes, checkerboard, grid)
    -> repeating-linear-gradient / repeating-conic-gradient with
       hard stops.
```

### Decision : why does my gradient look muddy or banded?

```
What does the bad result look like?

  Midpoint is grey, beige, or dull when the endpoints are vivid
  complementary colours (blue -> yellow muddies through olive-grey).
    -> Switch interpolation space to oklab or oklch :
       linear-gradient(in oklab to right, blue, yellow);

  Visible stripes parallel to the gradient direction on a large
  surface (banding).
    -> Two causes : (a) too few colour stops on a long surface;
       (b) sRGB interpolation. Both are mitigated by switching
       to `in oklch`. Adding more stops alone WITHOUT changing
       interpolation rarely fixes it.

  Hue takes the "wrong" path (red to green going via brown instead
  of via the bright spectrum).
    -> Use a polar space + hue arc :
       linear-gradient(in oklch longer hue, red, green);

  Hard-edge appears where the author wanted a smooth blend.
    -> A stop pair sharing the same position creates a hard edge.
       Use distinct positions (red 0%, blue 100%) instead of
       (red 50%, blue 50%).
```

### Decision : static or animated gradient?

```
Does the gradient change over time or in response to interaction?

  No, it is static.
    -> Plain background-image rule. Pick the right interpolation
       space and ship it. Set on background-image; never on
       background-color (gradients are images).

  Yes, the gradient rotates (angle changes).
    -> Register --grad-angle with @property as <angle>; declare
       the gradient with var(--grad-angle); animate the custom
       property. Gate with prefers-reduced-motion.

  Yes, the gradient shifts colour (tint shift, hue drift).
    -> Register the colour custom property with @property as <color>;
       animate the custom property. Gate with prefers-reduced-motion.

  Yes, the gradient "moves" across the surface (animated band).
    -> Use background-size > 100% and animate background-position.
       NOTE : background-position animation triggers paint per frame
       on the entire painted region; budget paint cost OR replace
       with a transformed overlay and animate transform.
```

### Decision : mesh approximation strategy?

```
How complex is the target mesh?

  2-4 blobs, soft edges, no sharp boundaries.
    -> Stack 2-4 radial-gradient layers on one element, each fading
       to transparent over a solid base colour. See Pattern 4 in
       examples.md.

  Many irregular blobs, organic shapes.
    -> SVG <feGaussianBlur> on randomised <circle> elements is the
       right tool; reference the SVG as a CSS background-image
       (url(#mesh-filter)) or render inline. Out of scope for this
       skill; see Cross-references.

  Animated mesh (blobs drift slowly).
    -> Two compositor-friendly options :
        1. Animate transforms on absolutely-positioned blurred divs
           layered over a base (movement is on transform, not paint).
        2. Animate a typed custom property used inside the radial
           gradient (e.g. --blob1-x : <length>). Costs paint per
           frame; budget accordingly.
```

## Patterns

### Pattern 1 : smooth two-colour hero with `in oklch`

```css
.hero { background: linear-gradient(in oklch to right, oklch(0.65 0.18 250), oklch(0.72 0.20 320)); }
```

Vivid endpoints, no muddy midpoint, no banding on a 1920px-wide surface.

### Pattern 2 : conic loading ring

```css
.spinner {
  width: 4rem; height: 4rem; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0deg, var(--brand-600) 270deg, transparent 270deg);
  animation: rotate 1s linear infinite;
}
@keyframes rotate { to { transform: rotate(360deg); } }
```

Animation is on `transform` (composite-only) NOT on the gradient itself; the gradient is static.

### Pattern 3 : repeating diagonal stripes

```css
.stripes { background: repeating-linear-gradient(45deg, #eee 0 10px, #fff 10px 20px); }
```

Two hard-stop pairs make a 10px stripe + 10px gap; the pattern repeats automatically because the gradient is `repeating-linear-gradient`.

### Pattern 4 : mesh emulation with layered radials

```css
.mesh {
  background:
    radial-gradient(circle at 20% 25%, oklch(0.78 0.18 320) 0%, transparent 50%),
    radial-gradient(circle at 80% 30%, oklch(0.78 0.18 220) 0%, transparent 55%),
    radial-gradient(circle at 65% 75%, oklch(0.78 0.18 130) 0%, transparent 60%),
    oklch(0.95 0.02 240);
}
```

See [examples.md](references/examples.md) for a renderable HTML demo.

### Pattern 5 : animated gradient angle with `@property`

```css
@property --grad-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.hero {
  background: linear-gradient(var(--grad-angle), oklch(0.65 0.18 250), oklch(0.72 0.20 320));
  background-size: 200% 200%;
  animation: rotate-grad 14s linear infinite;
}
@keyframes rotate-grad { to { --grad-angle: 360deg; } }
@media (prefers-reduced-motion: reduce) { .hero { animation: none; } }
```

### Pattern 6 : gradient on text

```css
.headline {
  background: linear-gradient(in oklch 90deg, oklch(0.6 0.2 250), oklch(0.65 0.22 320));
  background-clip: text;
  color: transparent;
  /* Safari prefix shim for some older versions; harmless if dropped: */
  -webkit-background-clip: text;
}
```

Provide a fallback `color` via `@supports not (background-clip: text)` if a baseline-compatible look matters on older engines.

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md). Eight cataloged : default sRGB interpolation midpoint mud; untyped gradient custom property snap; `background-attachment: fixed` parallax on mobile; 30-stop "smoothing" gradient; conic pie chart without `role="img"`; animated gradient without `prefers-reduced-motion`; `background-position` animation paint storm; gradient set on `background-color` (does nothing).

## Reference Links

- [Methods and signatures](references/methods.md) : function syntax, interpolation methods, hue arc modifiers, stop forms, gradient layering rules, performance notes.
- [Examples](references/examples.md) : renderable HTML demo with linear, radial, conic, animated, and mesh-emulation gradients side by side.
- [Anti-patterns](references/anti-patterns.md) : eight cataloged anti-patterns with symptom, root cause, and fix.

## Cross-references

- `[[frontend-syntax-css-color-modern]]` : `oklch()`, `color-mix()`, `light-dark()`, full modern colour syntax.
- `[[frontend-theming-color-palette-oklch]]` : palette shades that feed brand-aware gradients.
- `[[frontend-perf-animation-gpu-containment]]` : compositor-only rule and `@property` for animatable customs.
- `[[frontend-visual-glassmorphism-backdrop]]` : `backdrop-filter` layered over a gradient surface.
- `[[frontend-a11y-motion-contrast-wcag22]]` : `prefers-reduced-motion` and contrast requirements for text on gradient surfaces.
