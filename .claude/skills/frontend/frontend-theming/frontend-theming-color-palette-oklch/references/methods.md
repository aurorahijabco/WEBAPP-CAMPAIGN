# Methods : OKLCH palette generation

Sources : [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19), [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19), [W3C: CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19), [W3C: WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

## 1. `oklch()` function

```
oklch(<L> <C> <H> [ / <alpha> ])
oklch(from <color> <L> <C> <H> [ / <alpha> ])
```

| Token | Range | Notes |
|-------|-------|-------|
| `<L>` | `0`-`1` (number) or `0%`-`100%` (`100% = 1`) | Perceptual lightness; `0` = black, `1` = white. |
| `<C>` | `0`-`~0.4` (number) or `0%`-`100%` (`100% = 0.4`) | Chroma. Per-hue gamut limit varies; not every (L, H) pair supports the maximum 0.4. |
| `<H>` | `0`-`360` (deg) or `0`-`1` (number) | Hue angle. `0deg` is magenta. Red is approximately `41deg`. Hue 0 does NOT equal red (this differs from HSL). |
| `<alpha>` | `0`-`1` or `0%`-`100%` | Optional, after `/`. |
| `none` keyword | any channel | Indicates a missing component; used in interpolation. |

Baseline Widely Available since May 2023.

## 2. Relative-colour syntax (`oklch(from ...)`)

```
oklch(from <color> <L-expr> <C-expr> <H-expr> [ / <alpha-expr> ])
```

Inside the function body, the bare identifiers `l`, `c`, `h`, and `alpha` refer to the source colour's components AFTER conversion to OKLCH (the function's own colour space). Any CSS math is allowed : `calc(l + 0.1)`, `calc(c * 0.5)`, `calc(h + 30)`.

Practical pattern : derive every shade from one seed.

```css
:root {
  --brand-seed: oklch(0.62 0.18 250);
  --brand-700: oklch(from var(--brand-seed) calc(l - 0.17) c h);
  --shifted:   oklch(from var(--brand-seed) l c calc(h + 60));
}
```

## 3. Standard 11-step L ladder

| Step | L | Typical role |
|------|---|--------------|
| 50  | `0.985` | Subtle wash |
| 100 | `0.967` | Surface-2 background |
| 200 | `0.918` | Surface-3 background |
| 300 | `0.846` | Disabled fills, dividers |
| 400 | `0.730` | Mid-tones |
| 500 | `0.620` | Seed reference |
| 600 | `0.530` | Primary action default |
| 700 | `0.450` | Primary action hover |
| 800 | `0.380` | Heading on tinted background |
| 900 | `0.295` | Body text on light surface |
| 950 | `0.205` | Highest-contrast text |

Chroma is tapered at the extremes : multiply the seed chroma by approx 0.08 at step 50, 0.16 at 100, 0.35 at 200, 0.55 at 300, 0.80 at 400, keep full at 500-700, then 0.95 at 700, 0.85 at 800, 0.70 at 900, 0.55 at 950. Tapering avoids gamut clip and prevents very-light steps looking neon.

## 4. `color-mix()` function

```
color-mix(in <color-space> [ <hue-interpolation-method> ]?, <color> [ <pct> ]?, <color> [ <pct> ]?)
```

Supported colour spaces :

- Rectangular : `srgb`, `srgb-linear`, `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `lab`, `oklab`, `xyz`, `xyz-d50`, `xyz-d65`.
- Polar : `hsl`, `hwb`, `lch`, `oklch`.

Hue-interpolation methods (polar spaces only) :

| Method | Effect |
|--------|--------|
| `shorter hue` (default) | Interpolate via the shortest arc between hues. |
| `longer hue` | Interpolate via the longer arc; allows full-spectrum rainbows. |
| `increasing hue` | Always go in the direction of increasing hue angle. |
| `decreasing hue` | Always go in the direction of decreasing hue angle. |

Rules of thumb :

- For tints and shades (mix with white / black), prefer `in oklab` or `in oklch`.
- For perceptually-uniform gradients, prefer `in oklch`.
- AVOID `in srgb`. Per [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19) : "Avoid `srgb`: neither linear-light nor perceptually uniform, produces darker/grayish mixes."

Percentages auto-normalise. `color-mix(in oklch, red 40%, blue 40%)` is equivalent to `color-mix(in oklch, red 50%, blue 50%)`.

## 5. `@property` for animatable colour tokens

```css
@property --<name> {
  syntax: '<color>';
  inherits: true | false;
  initial-value: <color>;
}
```

| Requirement | Notes |
|-------------|-------|
| `syntax` | REQUIRED. For colour tokens : `'<color>'`. |
| `inherits` | REQUIRED. `true` for theme-wide tokens, `false` for component-scoped. |
| `initial-value` | REQUIRED when `syntax` is not `'*'`. MUST be computationally independent. |

JavaScript equivalent : `CSS.registerProperty({ name, syntax, inherits, initialValue })`.

Side effect : the property becomes interpolatable. Without registration, transitions on `--color-token: blue` to `--color-token: red` snap.

## 6. Three-tier token chain template

```css
@layer tokens, theme, base, components, utilities;

@layer tokens {
  :root {
    /* Tier 1 : primitive (raw) */
    --brand-seed: oklch(0.62 0.18 250);
    --brand-50:  oklch(from var(--brand-seed) 0.985 calc(c * 0.08) h);
    --brand-100: oklch(from var(--brand-seed) 0.967 calc(c * 0.16) h);
    --brand-200: oklch(from var(--brand-seed) 0.918 calc(c * 0.35) h);
    --brand-300: oklch(from var(--brand-seed) 0.846 calc(c * 0.55) h);
    --brand-400: oklch(from var(--brand-seed) 0.730 calc(c * 0.80) h);
    --brand-500: oklch(from var(--brand-seed) 0.620 c h);
    --brand-600: oklch(from var(--brand-seed) 0.530 c h);
    --brand-700: oklch(from var(--brand-seed) 0.450 calc(c * 0.95) h);
    --brand-800: oklch(from var(--brand-seed) 0.380 calc(c * 0.85) h);
    --brand-900: oklch(from var(--brand-seed) 0.295 calc(c * 0.70) h);
    --brand-950: oklch(from var(--brand-seed) 0.205 calc(c * 0.55) h);

    --gray-seed: oklch(0.62 0.02 250);
    --gray-50:   oklch(from var(--gray-seed) 0.985 c h);
    --gray-900:  oklch(from var(--gray-seed) 0.295 c h);
  }
}

@layer theme {
  :root {
    /* Tier 2 : semantic (role) */
    --color-surface:           var(--brand-50);
    --color-surface-raised:    var(--brand-100);
    --color-on-surface:        var(--brand-950);
    --color-on-surface-muted:  var(--brand-700);
    --color-border:            var(--brand-200);

    --color-action-primary:        var(--brand-600);
    --color-action-primary-hover:  var(--brand-700);
    --color-on-action-primary:     var(--brand-50);

    --color-focus-ring:        var(--brand-700);
  }
}

@layer components {
  .button-primary {
    /* Tier 3 : component (binding) */
    --button-primary-bg:       var(--color-action-primary);
    --button-primary-bg-hover: var(--color-action-primary-hover);
    --button-primary-fg:       var(--color-on-action-primary);

    background: var(--button-primary-bg);
    color: var(--button-primary-fg);
  }
  .button-primary:hover { background: var(--button-primary-bg-hover); }
}
```

A brand colour change touches `--brand-seed` (and possibly the gray seed) only. All higher tiers update by reference.

## 7. WCAG 2.2 contrast targets

Per [W3C: WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19) :

| SC | Level | Target | Applies to |
|----|-------|--------|------------|
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 | Normal text |
| 1.4.3 Contrast (Minimum) | AA | 3:1 | Large text (>= 18pt or >= 14pt bold) |
| 1.4.6 Contrast (Enhanced) | AAA | 7:1 | Normal text |
| 1.4.6 Contrast (Enhanced) | AAA | 4.5:1 | Large text |
| 1.4.11 Non-Text Contrast | AA | 3:1 | UI components, graphical objects needed to understand the content |

Exceptions exclude inactive components, pure decoration, logos / brand names, and incidental text.

Verification : use the browser DevTools colour picker, `axe`, or `Stark`. NEVER eyeball the ratio.

## 8. Wide-gamut handling

```css
:root { --brand-accent: oklch(0.62 0.18 250); }
@supports (color: color(display-p3 1 0 0)) {
  :root { --brand-accent: oklch(0.72 0.30 320); }
}
```

A colour like `oklch(0.72 0.30 320)` exceeds the sRGB gamut for that hue. On sRGB displays the renderer clips, producing an unpredictable colour. The `@supports` gate keeps the sRGB-safe fallback on non-P3 displays. The detector check `color(display-p3 1 0 0)` is the standard sniff for P3 support.

## 9. Hue conversion table (approximate, useful for converting from HSL/RGB memory)

| Common colour name | OKLCH hue (approx) |
|--------------------|--------------------|
| Magenta / pink | 0 |
| Red | 41 |
| Orange | 67 |
| Yellow | 110 |
| Green | 152 |
| Cyan | 195 |
| Blue | 250 |
| Purple | 308 |

Use a converter for production values; this table is a rough mental anchor only. Browsers' colour pickers in DevTools display the OKLCH hue alongside the legacy HSL hue.

## 10. JavaScript runtime conversion (when needed)

When tokens must be generated outside CSS (e.g. for a server-rendered email template) :

- The browser's `Color()` constructor in CSS Typed OM may be used in newer engines.
- A small library (Culori, Color.js, colorjs.io) handles OKLCH conversion in Node and the browser identically.
- For build-time emission, prefer Style Dictionary or a custom transform that reads a JSON seed and emits the CSS custom properties listed in §6.

Avoid hand-converting OKLCH to hex; precision loss compounds across many shades.
