---
name: frontend-theming-color-palette-oklch
description: >
  Use when generating a full shade ladder (50, 100, 200, ..., 900, 950) from a single brand seed colour, when a design system needs perceptually-even contrast at each step, when an HSL-derived palette looks visually uneven across hues, when a brand colour change needs to ripple through every token without rewriting hex values, when picking which shade pairs satisfy WCAG 1.4.3 (4.5:1 normal text) and 1.4.11 (3:1 UI components) at a glance, when a gradient or shade transition looks muddy or washed out, when wide-gamut display-p3 colours need an sRGB fallback gate, or when a colour custom property must animate or transition smoothly.
  Prevents the classic HSL shade-ladder anti-pattern (perceptually non-uniform; the same `50%` lightness in HSL means different visible brightness across hues), the constant-L-constant-chroma trap where the same numeric chroma is out-of-gamut for some hues and inside gamut for others (yellow vs blue at high chroma), the single-tier token chain (brand colour = button colour) that makes a brand refresh painful, the untyped custom property that snaps instead of transitioning, the unguarded display-p3 colour that clips on sRGB displays, and the assumption that text-on-shade-500 pairs are always AA-compliant without verifying the ratio.
  Covers the OKLCH model (perceptual L axis 0-1, chroma 0-0.4, hue 0-360 with hue 0 = magenta NOT red), the relative-colour-function syntax `oklch(from <seed> calc(l + N) c h)` to derive shades from a single brand seed, the 11-step ladder convention (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950) with L mapped to each step, contrast pair guarantees aligned to WCAG 2.2 SC 1.4.3 (4.5:1 normal, 3:1 large) and 1.4.11 (3:1 UI/graphical), the three-tier brand-to-system token chain (raw brand -> primitive -> semantic -> component), `@property` registration for animatable colour customs, `color-mix(in oklch, ...)` for perceptually-uniform interpolation, wide-gamut handling via `color()` + `display-p3` + `@supports` gating, and emission as CSS custom properties under `@layer tokens, theme, base, components, utilities;`.
  Keywords: oklch, OKLCH palette, OKLCH shade ladder, perceptually uniform palette, relative color, relative-color syntax, color-mix, oklab, brand seed, brand color, brand palette, shade ladder, color scale, 50 100 200 300 400 500 600 700 800 900 950, palette generation, hue rotation, chroma, L axis, gamut, gamut clipping, display-p3, wide-gamut, sRGB fallback, design tokens, primitive token, semantic token, component token, three-tier token chain, action-primary, surface, on-surface, @property typed custom property, animatable color, WCAG contrast, 4.5:1, 3:1, 1.4.3, 1.4.11, palette looks washed, colors do not look balanced, gradient muddy, shade ladder uneven, hardcoded hex everywhere, brand-color change painful, colors inconsistent at same L, contrast fails AA, how to generate palette from brand color, what is OKLCH, how to make accessible palette, oklch shade generator, color tokens for a design system, how to derive colors from one brand color.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Theming Color Palette OKLCH

This skill defines a deterministic rule set for generating a perceptually-even shade ladder from a single brand seed using `oklch()` and the relative-colour function, then emitting the ladder as a three-tier design-token chain. OKLCH (Baseline Widely Available since May 2023) is the perceptually-uniform polar model on top of Oklab; the same numeric L delta produces the same visible brightness change across all hues, unlike HSL where the same `50%` lightness looks different per hue.

This skill builds on `[[frontend-syntax-css-color-modern]]` (oklch / color-mix / light-dark / relative-colour syntax) and `[[frontend-syntax-css-cascade-layers-scope]]` (`@layer` for token layering). Contrast verification details are deferred to `[[frontend-a11y-motion-contrast-wcag22]]`. Dark / light scheme switching is deferred to `[[frontend-theming-dark-light-mode]]`.

Sources : [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19), [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19), [W3C: CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19), [W3C: WCAG 2.2 SC 1.4.3 Contrast Minimum](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

## Quick Reference

### Why OKLCH for palettes (and not HSL)

Per [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19), the L axis represents PERCEIVED brightness. A given numeric L corresponds to the same visible lightness across all hues. HSL's `lightness` is a geometric value in cylindrical sRGB; the same `lightness: 50%` produces a visibly brighter yellow than blue. A shade ladder built in HSL is therefore visually uneven; the same ladder built in OKLCH is even.

| Channel | Range | Notes |
|---------|-------|-------|
| L | `0`-`1` or `0%`-`100%` | `0` black, `1` white; perceptual |
| C | `0`-`~0.4` (numeric) or `0%`-`100%` where `100% = 0.4` | Chroma; cap depends on the hue (yellow caps lower than blue) |
| H | `0`-`360` deg | `0deg` is magenta (NOT red); red is `~41deg`; this differs from HSL |
| alpha | `0`-`1` | Optional, after `/` |

### Standard 11-step L ladder

| Step | L (relative) | Typical role |
|------|--------------|--------------|
| 50  | `0.985` | Page background tint, very subtle wash |
| 100 | `0.967` | Surface-2 background, hairline backgrounds |
| 200 | `0.918` | Surface-3 background, hover states on neutrals |
| 300 | `0.846` | Disabled fills, dividers, faint borders |
| 400 | `0.730` | Mid-tones, decorative fills |
| 500 | `0.620` | The brand seed itself (or closest to it) |
| 600 | `0.530` | Primary action default |
| 700 | `0.450` | Primary action hover / active |
| 800 | `0.380` | Heading text on tinted backgrounds |
| 900 | `0.295` | Body text on light surfaces |
| 950 | `0.205` | Highest-contrast text, focus rings |

These L values are the convention adopted across modern OKLCH-native palettes; tune to taste, but keep the deltas roughly monotonic so the ladder remains predictable.

### Relative-colour shade generator

Given a brand seed in OKLCH (`--brand-seed: oklch(0.62 0.18 250)`) :

```css
:root {
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
}
```

The chroma is scaled down at the extremes (very light / very dark steps) because human eyes perceive less chroma at low lightness AND because some hues hit gamut boundaries at high chroma at extreme L; tapering keeps the ladder in sRGB gamut and prevents the very-light steps from looking neon. The mid-range steps preserve the brand chroma.

### Three-tier token chain

```
Tier 1  Primitive (raw)        : --brand-500, --gray-700, --semantic-red-500
Tier 2  Semantic (role)        : --color-action-primary, --color-surface, --color-text
Tier 3  Component (binding)    : --button-primary-bg, --card-border
```

Tier 1 names a colour by value, tier 2 names a colour by role, tier 3 names a colour by where it is used. Tier 3 references tier 2; tier 2 references tier 1. A brand refresh touches tier 1 only.

### Contrast pair quick-pick table (target seed in the blue range)

| Background | Foreground | Approx ratio | Verdict (normal text) |
|------------|------------|--------------|-----------------------|
| `--brand-50` | `--brand-900` | ~14:1 | AAA |
| `--brand-100` | `--brand-800` | ~9:1 | AAA |
| `--brand-200` | `--brand-800` | ~7:1 | AAA |
| `--brand-200` | `--brand-700` | ~5.5:1 | AA |
| `--brand-500` | `--brand-50` | ~5:1 | AA |
| `--brand-600` | `--brand-50` | ~6.5:1 | AAA |
| `--brand-700` | `--brand-50` | ~9:1 | AAA |
| `--brand-300` | `--brand-700` | ~3.2:1 | AA Large only |

Numbers are typical for a mid-chroma blue seed (`oklch(0.62 0.18 250)`); verify per hue. WCAG 2.2 SC 1.4.3 requires 4.5:1 for normal text, 3:1 for large text (>= 18pt or 14pt bold); SC 1.4.11 requires 3:1 for UI components and graphical objects ([W3C: WCAG 2.2](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19)).

## Decision Trees

### Decision : brand seed -> palette generation

```
What do you have in hand?

  One brand hex (e.g. #3b82f6)
    -> Convert ONCE to oklch (browser DevTools picker or a converter).
       Store as --brand-seed: oklch(L C H).
       Derive every other shade with the relative-colour ladder above.
       Treat the seed as the immutable input; never duplicate hex values.

  Brand has 2-3 primary colours (e.g. brand + accent + danger)
    -> Run the ladder per seed. Each seed produces its own 11-step
       scale (--brand-*, --accent-*, --danger-*). Do NOT mix hues
       inside one ladder.

  Brand specifies an EXACT shade-500 hex
    -> Anchor 500 to the supplied hex; derive 50-400 by raising L,
       600-950 by lowering L. Chroma stays at seed value for
       mid-range steps; taper at extremes.
```

### Decision : which L for which usage?

```
What is the role of the colour token?

  Page or panel background (subtle wash)         -> L 0.97-0.99 (50/100)
  Card background, subtle hover state            -> L 0.91-0.97 (100/200)
  Border, divider, disabled fill                 -> L 0.85-0.92 (200/300)
  Mid-tone decorative                            -> L 0.73 (400)
  Brand reference (logo, hero accents)           -> L ~0.62 (500)
  Primary action background (text on top white)  -> L 0.53 (600) or 0.45 (700)
  Heading or body text on tinted background      -> L 0.29-0.38 (800/900)
  Highest-contrast text / focus rings            -> L 0.20 (950)
```

### Decision : contrast pair check

```
Pick foreground + background candidates and verify against WCAG 2.2.

  Normal text (less than 18pt and less than 14pt bold)
    -> need >= 4.5:1
       Typical safe pairs : background L >= 0.91, text L <= 0.38.

  Large text (>= 18pt or >= 14pt bold)
    -> need >= 3:1
       Typical safe pairs : background L >= 0.85, text L <= 0.45.

  UI component or graphical object (SC 1.4.11)
    -> need >= 3:1 against adjacent colour.
       Typical safe pairs : icon L <= 0.45 on surface L >= 0.85.

  Don't approximate. Run a real contrast check (DevTools Picker,
  axe, or Stark) on every shipped pair. The table above is a
  starting hypothesis; the verifier is the ratio reported on a
  real rendering.
```

### Decision : should this token be `@property`-typed?

```
Will the token be animated, transitioned, or interpolated?

  Yes (color crossfade, gradient angle drift, hover-tint)
    -> Register with @property. Set syntax: '<color>' (or the
       appropriate type) and inherits: true | false.

  No (static lookup only, never animated)
    -> Plain --var is fine. Save the registration overhead.
```

## Patterns

### Pattern 1 : full palette from one seed

See [examples.md](references/examples.md#pattern-1-full-palette-from-one-seed) for a self-contained HTML page that renders all 11 shades with AA/AAA contrast labels.

### Pattern 2 : three-tier token chain in `@layer tokens`

```css
@layer tokens, theme, base, components, utilities;
@layer tokens {
  :root {
    --brand-seed: oklch(0.62 0.18 250);
    --brand-50:  oklch(from var(--brand-seed) 0.985 calc(c * 0.08) h);
    --brand-500: oklch(from var(--brand-seed) 0.620 c h);
    --brand-700: oklch(from var(--brand-seed) 0.450 calc(c * 0.95) h);
    --brand-900: oklch(from var(--brand-seed) 0.295 calc(c * 0.70) h);
  }
}
@layer theme {
  :root {
    --color-action-primary: var(--brand-600);
    --color-action-primary-hover: var(--brand-700);
    --color-surface:        var(--brand-50);
    --color-on-surface:     var(--brand-900);
  }
}
@layer components {
  .button-primary {
    background: var(--color-action-primary);
    color: var(--brand-50);
  }
  .button-primary:hover { background: var(--color-action-primary-hover); }
}
```

A brand colour change touches `--brand-seed` only.

### Pattern 3 : animatable colour token with `@property`

```css
@property --hero-tint { syntax: '<color>'; inherits: true; initial-value: oklch(0.62 0.18 250); }

.hero {
  background: linear-gradient(180deg, var(--hero-tint), var(--brand-50));
  transition: --hero-tint 600ms ease;
}
.hero[data-state="alt"] { --hero-tint: var(--brand-700); }
```

Untyped customs snap; typed customs interpolate.

### Pattern 4 : perceptual mixing with `color-mix(in oklch, ...)`

```css
.tint-button { background: color-mix(in oklch, var(--brand-500) 80%, white); }
```

NEVER use `in srgb` for perceptual mixing; the result is darker / greyer per [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19) ("Avoid `srgb`: neither linear-light nor perceptually uniform").

### Pattern 5 : wide-gamut accent with `@supports` gate

```css
:root { --brand-accent: oklch(0.62 0.18 250); /* sRGB-safe fallback */ }
@supports (color: color(display-p3 1 0 0)) {
  :root { --brand-accent: oklch(0.72 0.30 320); /* outside sRGB, in P3 */ }
}
```

Never ship a display-p3 colour without a gated fallback; on sRGB displays the rendering clips and the resulting colour is unpredictable.

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md). Eight cataloged : hardcoded hex throughout, HSL-derived ladder (uneven), single-tier tokens (brand = button), transitioning untyped `--color`, assuming L=0.50 is perceptual middle without chroma check, constant max chroma across all L (out-of-gamut at extremes), missing sRGB fallback for display-p3, mixing in srgb instead of oklch / oklab.

## Reference Links

- [Methods and signatures](references/methods.md) : `oklch()`, relative-colour syntax, `color-mix()` colour spaces and hue-interpolation methods, `@property` token registration, the standard 11-step L map, the three-tier token chain template.
- [Examples](references/examples.md) : self-contained HTML page generating the full ladder with contrast labels (Pattern 1), three-tier token chain, animatable token, wide-gamut gating, perceptual mixing.
- [Anti-patterns](references/anti-patterns.md) : eight cataloged anti-patterns with symptom, root cause, and fix.

## Cross-references

- `[[frontend-syntax-css-color-modern]]` : `oklch()`, `color-mix()`, `light-dark()`, relative-colour syntax full reference.
- `[[frontend-syntax-css-cascade-layers-scope]]` : `@layer` ordering for token / theme / base / components / utilities.
- `[[frontend-theming-dark-light-mode]]` : flipping shade roles for dark mode (background uses high-L, dark mode uses low-L).
- `[[frontend-impl-design-tokens]]` : DTCG JSON format and build-time emission to CSS custom properties.
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 2.2 SC 1.4.3 and 1.4.11 contrast measurement.
- `[[frontend-perf-animation-gpu-containment]]` : `@property` for animatable customs sits in the same Houdini surface.
