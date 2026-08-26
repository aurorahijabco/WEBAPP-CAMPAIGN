# Examples Reference : frontend-syntax-css-color-modern

Code-only snippets demonstrating each canonical pattern. NO renderable full-page fragment ; consult `[[frontend-theming-color-palette-oklch]]` for a full palette demo.

## Example 1 : Basic `oklch()` color

```css
:root {
  --brand: oklch(60% 0.22 290);
  --danger: oklch(55% 0.20 25);
  --success: oklch(60% 0.15 145);
  --warning: oklch(75% 0.18 75);

  --neutral-50:  oklch(98% 0.005 290);
  --neutral-100: oklch(95% 0.01 290);
  --neutral-200: oklch(90% 0.012 290);
  --neutral-500: oklch(55% 0.02 290);
  --neutral-900: oklch(18% 0.015 290);
}
```

Each color is expressed as `oklch(L C H)`. Lightness is perceptually uniform across hues : `--brand` and `--success` at the same lightness number look equally bright. The neutral ladder uses a constant low chroma against the same hue anchor so it tints subtly toward the brand.

## Example 2 : Relative-color shade ladder

```css
:root {
  --brand: oklch(60% 0.22 290);

  --brand-50:  oklch(from var(--brand) 98% calc(c * 0.04) h);
  --brand-100: oklch(from var(--brand) 95% calc(c * 0.08) h);
  --brand-200: oklch(from var(--brand) 90% calc(c * 0.15) h);
  --brand-300: oklch(from var(--brand) 80% calc(c * 0.30) h);
  --brand-400: oklch(from var(--brand) 70% calc(c * 0.60) h);
  --brand-500: var(--brand);
  --brand-600: oklch(from var(--brand) 50% c h);
  --brand-700: oklch(from var(--brand) 40% c h);
  --brand-800: oklch(from var(--brand) 28% c h);
  --brand-900: oklch(from var(--brand) 18% c h);
}
```

The whole ladder derives from a single seed. Per [W3C : CSS Color 5](https://www.w3.org/TR/css-color-5/) (verified 2026-05-19), the source color is decomposed and exposed as `l`, `c`, `h`, `alpha`. Changing `--brand` regenerates the entire ladder ; this is the foundation of token-driven theming.

## Example 3 : `color-mix()` blends

```css
.tint-30  { background: color-mix(in oklch, var(--brand), white 30%); }
.shade-30 { background: color-mix(in oklch, var(--brand), black 30%); }
.desat    { background: color-mix(in oklab, var(--brand), oklch(60% 0 290) 50%); }
.translucent-bg { background: color-mix(in oklch, var(--brand) 80%, transparent); }

.gradient {
  background: linear-gradient(
    to right,
    color-mix(in oklch shorter hue, oklch(70% 0.18 30), oklch(70% 0.18 240) 50%),
    color-mix(in oklch longer hue,  oklch(70% 0.18 30), oklch(70% 0.18 240) 50%)
  );
}
```

ALWAYS mix in `oklch` or `oklab` for design-system blends. Per [MDN : color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19), the `shorter hue` modifier is the default and takes the shortest arc around the color wheel ; `longer hue` produces rainbow sweeps that traverse the wider arc.

## Example 4 : `light-dark()` with `color-scheme`

```css
:root {
  color-scheme: light dark;
  --bg:   light-dark(oklch(98% 0.005 290), oklch(15% 0.01 290));
  --fg:   light-dark(oklch(15% 0.01 290), oklch(95% 0.005 290));
  --surface-1: light-dark(oklch(100% 0 0), oklch(20% 0.015 290));
  --border: light-dark(oklch(90% 0.012 290), oklch(35% 0.018 290));
}

body {
  background: var(--bg);
  color: var(--fg);
}
```

Per [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (verified 2026-05-19), `light-dark()` requires `color-scheme` on the relevant ancestor. WITHOUT `color-scheme: light dark`, the function silently uses the light value. ALWAYS declare `color-scheme` first ; the cost of forgetting is "dark mode is broken and nobody knows why".

## Example 5 : User-controlled theme override

```css
:root {
  color-scheme: light dark;
}

[data-theme="light"] { color-scheme: light; }
[data-theme="dark"]  { color-scheme: dark; }
```

```html
<html data-theme="dark">
  ...
</html>
```

`light-dark()` inside the document tree resolves based on the effective `color-scheme` on the relevant ancestor. The wrapper attribute is the canonical user-override mechanism : the user selects "always dark" in settings, the app sets `data-theme="dark"`, and every `light-dark()` reference in the stylesheet switches.

## Example 6 : Wide-gamut color with sRGB fallback

```css
.brand-vivid {
  background: oklch(70% 0.2 30);
}

@media (color-gamut: p3) {
  .brand-vivid {
    background: color(display-p3 1 0.4 0.25);
  }
}
```

Per [W3C : CSS Color 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19), the `color(display-p3 R G B)` form accepts component values typically 0..1. The `@media (color-gamut: p3)` query matches displays that reproduce at least the P3 gamut ; sRGB-only displays fall through to the `oklch()` value above.

## Example 7 : `@supports` feature gating

```css
.brand { color: rgb(102 70 230); }

@supports (color: oklch(50% 0.1 0)) {
  .brand { color: oklch(60% 0.22 290); }
}

.theme-switch { background: white; }

@supports (color: light-dark(black, white)) {
  :root { color-scheme: light dark; }
  .theme-switch { background: light-dark(white, oklch(15% 0.01 290)); }
}
```

ALWAYS keep the fallback OUTSIDE the `@supports` block. The cascade picks the modern declaration when the test passes ; pre-Baseline browsers see only the fallback.

## Example 8 : Forcing gamut clamp to sRGB

```css
.safe-vivid {
  color: color-mix(in srgb, oklch(70% 0.4 30), transparent 0%);
}
```

The `color-mix(in srgb, ..., transparent 0%)` idiom forces the result into the sRGB color space. The vivid `oklch(70% 0.4 30)` (chroma 0.4 is outside sRGB at that lightness and hue) is gamut-mapped to its closest in-gamut sRGB color. This is the controlled-clamp alternative to the browser's implicit render-time clip.

## Example 9 : Animatable color via typed `@property`

```css
@property --bg-l {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 60%;
}

.hover-target {
  --bg-l: 60%;
  background: oklch(var(--bg-l) 0.22 290);
  transition: --bg-l 200ms ease-out;
}

.hover-target:hover {
  --bg-l: 50%;
}
```

A registered typed custom property is animatable. The `oklch()` expression reads the property at render time. Without `@property` registration, the `--bg-l` transition would be instantaneous because the browser cannot tween an unknown-type custom property. The deeper pattern lives in `[[frontend-theming-color-palette-oklch]]`.

## Sources (verified 2026-05-19)

- [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [MDN : color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
- [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [W3C : CSS Color 4](https://www.w3.org/TR/css-color-4/)
- [W3C : CSS Color 5](https://www.w3.org/TR/css-color-5/)
