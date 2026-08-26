---
name: frontend-syntax-css-color-modern
description: >
  Use when choosing a color function in CSS, building a shade ladder from a brand seed,
  blending two colors deterministically, wiring up dark mode without media-query
  duplication, or shipping wide-gamut colors with a sRGB fallback.
  Prevents the most common modern-color regressions in 2026 : muddy `color-mix` results
  from mixing in sRGB, `light-dark()` silently falling back to the light value because
  `color-scheme` was never declared, P3 colors clipping on sRGB displays without a
  fallback, relative-color expressions that overflow the gamut, and `hsl()` shade
  ladders that look "right" in numbers but wrong on screen because HSL is not
  perceptually uniform.
  Covers `oklch(L C H / alpha)` with perceptual lightness / chroma / hue, the
  relative-color syntax `oklch(from <color> l c h / alpha)`, `color-mix(in <space>,
  c1 pct, c2 pct)` across all eleven supported color spaces and the four polar
  hue-interpolation methods, `light-dark(<light>, <dark>)` paired with
  `color-scheme: light dark`, the `color()` function for `display-p3` and `rec2020`,
  the `@media (color-gamut: p3)` query, and gamut-clamping with `color-mix`.
  Keywords: oklch, oklab, color-mix, light-dark, color-scheme, relative color,
  display-p3, rec2020, P3, lab, lch, hwb, color-gamut, perceptual lightness, chroma,
  hue interpolation, shorter hue, longer hue, colors look muddy, dark mode broken,
  gradient banding, color does not interpolate evenly, colors look dull, how to mix
  colors in CSS, what is oklch, do I still need a preprocessor, how to do light and
  dark theme without media queries, what is perceptually uniform color.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Syntax : CSS Modern Color

This skill is the operational reference for native CSS color functions in 2026. It covers `oklch()`, the relative-color syntax, `color-mix()`, `light-dark()`, wide-gamut `color()`, and the `@media (color-gamut: p3)` query. The skill does NOT cover Sass color functions, design-token methodology (see `[[frontend-impl-design-tokens]]`), palette generation (see `[[frontend-theming-color-palette-oklch]]`), or WCAG contrast calculations (see `[[frontend-a11y-motion-contrast-wcag22]]`).

## Quick Reference

### Floor rules

- ALWAYS use `oklch(L C H)` for systematic color decisions (palettes, shade ladders, hover states). NEVER use `hsl()` for the same purpose ; HSL is not perceptually uniform.
- ALWAYS mix in `oklch` or `oklab` when blending colors for gradients or shades. NEVER mix in `srgb` for design-system purposes ; sRGB interpolation goes through gray.
- ALWAYS declare `color-scheme: light dark` on `:root` BEFORE using `light-dark()`. Without it, the function falls back to the light value.
- ALWAYS provide a sRGB fallback when shipping wide-gamut `color(display-p3 ...)` colors. NEVER assume the display can reproduce P3.
- ALWAYS verify that a relative-color expression stays within the target gamut. NEVER ship `oklch(from <color> calc(l + 30%) c h)` without checking the result on a sRGB display.

### Decision tree 1 : Which color function for which task ?

```
Need a single solid color expressed predictably ?
  -> oklch(L C H [/ alpha])
     L is perceptual lightness 0..1 (or 0%..100%)
     C is chroma 0..~0.4 (0% = neutral gray, 100% = 0.4 = vivid)
     H is hue 0..360 (degrees)
     alpha is 0..1 (or 0%..100%), optional

Need to derive a related color from a seed ?
  -> oklch(from <seed> l c h [/ alpha])
     Read seed's L, C, H components by name; modify with `calc()`.
     Example : oklch(from var(--brand) calc(l + 0.1) c h) for a lighter shade.

Need to blend two colors ?
  -> color-mix(in <space> [<hue-interp>], <c1> [pct], <c2> [pct])
     Spaces : srgb, srgb-linear, display-p3, lab, oklab, rec2020, xyz, xyz-d50,
              xyz-d65 (rectangular) ; hsl, hwb, lch, oklch (polar).
     Polar hue methods : shorter hue (default), longer hue, increasing hue,
                        decreasing hue.
     Default to `in oklch` or `in oklab` for design-system blends.

Need a per-theme value (light vs dark) ?
  -> light-dark(<light-value>, <dark-value>)
     REQUIRES color-scheme: light dark on :root (or on the relevant ancestor).
     Works for both color values and image values (e.g. backgrounds).

Need wide-gamut color (P3 / Rec2020) ?
  -> color(display-p3 R G B [/ alpha])  or  color(rec2020 R G B [/ alpha])
     R/G/B are 0..1 floats. Gate with @supports or @media (color-gamut: p3)
     and provide a sRGB fallback.
```

### Decision tree 2 : `oklch()` vs `hsl()` ?

```
Are you building a shade ladder, hover state, focus state, or systematic palette ?
  YES :
    ALWAYS use oklch().
    Reason : oklch() is perceptually uniform per [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
    (verified 2026-05-19). L=0.5 produces equally-bright colors regardless of hue.
    hsl() L=50% produces colors that look visibly different in brightness across
    hues (yellow at L=50% is much brighter than blue at L=50%), so any "darken by
    10%" rule applied uniformly across hsl() hues produces an inconsistent ladder.

  NO (you are matching a legacy palette that was authored in HSL) :
    Use hsl() and document the legacy reason. Plan migration to oklch() because
    every future systematic decision will fight HSL's non-uniformity.

Are you doing a one-off color with no relation to a system ?
  -> Either is fine, but oklch() future-proofs the snowflake for later promotion
     to a token (see decision tree in [[frontend-core-design-philosophy]]).
```

### Decision tree 3 : `light-dark()` vs `@media (prefers-color-scheme)` toggle ?

```
Is the value a SINGLE property switching between two theme-specific values ?
  YES :
    Use light-dark(<light>, <dark>).
    Reason : less duplication, no extra media-query block, declarative.
    Prerequisite : color-scheme: light dark MUST be declared on :root (or on a
    relevant ancestor). Without it, light-dark() silently uses the light value
    in both themes per [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
    (verified 2026-05-19).

Are MULTIPLE properties changing together as a block (background, color, border,
shadow, image asset all change at once) ?
  Either approach works. The media-query block keeps the theme grouped in source.
  light-dark() per property is more verbose but better for component-scoped CSS.

Do you need to switch ONLY one of the two themes (user override : "always light"
or "always dark") ?
  Use a custom property with the user-selected scheme name on a wrapper element :
    [data-theme="light"] { color-scheme: light; }
    [data-theme="dark"]  { color-scheme: dark; }
  Then light-dark() resolves based on the wrapper's color-scheme.

Are you targeting a browser that does NOT support light-dark() (pre-Baseline 2024) ?
  Fall back to @media (prefers-color-scheme: dark). The media-query approach is
  still Baseline Widely Available and is the safe choice for legacy support.
```

## `oklch()` : perceptual lightness, chroma, hue

Per [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19), Baseline Widely Available since May 2023.

```css
.brand        { color: oklch(60% 0.22 290); }
.brand-50     { color: oklch(98% 0.005 290); }
.brand-translucent { background: oklch(60% 0.22 290 / 0.4); }
```

The three components :

- **L (Lightness)** : 0..1 or 0%..100%. Perceptually uniform : L=0.5 is the same perceived brightness regardless of hue.
- **C (Chroma)** : 0..approximately 0.4 (or 0%..100% where 100% = 0.4). 0 is achromatic gray ; chroma above the gamut boundary clamps to the closest in-gamut color.
- **H (Hue)** : 0..360 degrees. 0 ~= red, 90 ~= yellow, 180 ~= green, 270 ~= blue. Hue can be `none` (treated as 0) or omitted via `calc()`.
- **alpha** : optional, 0..1 or 0%..100%, prefixed by `/`.

`oklab(L A B [/ alpha])` is the rectangular sibling. Use `oklab` for blending where the polar discontinuity at hue=0/360 causes issues ; use `oklch` for explicit lightness or chroma adjustments.

## Relative color syntax

The relative-color form lets authors read the components of a seed color by name and modify them with `calc()`. Per [W3C : CSS Color 5](https://www.w3.org/TR/css-color-5/) (verified 2026-05-19), Baseline Widely Available since May 2023 alongside `oklch()`.

```css
:root {
  --brand: oklch(60% 0.22 290);

  --brand-lighter: oklch(from var(--brand) calc(l + 0.15) c h);
  --brand-darker:  oklch(from var(--brand) calc(l - 0.15) c h);
  --brand-muted:   oklch(from var(--brand) l calc(c * 0.3) h);
  --brand-translucent: oklch(from var(--brand) l c h / 0.4);
  --brand-complement:  oklch(from var(--brand) l c calc(h + 180));
}
```

The component names are `l`, `c`, `h`, `alpha` inside `oklch()`. Inside `oklab()` they are `l`, `a`, `b`, `alpha`. The function MUST match the source color space's naming. NEVER write `oklch(from var(--brand) calc(l - 10%) c h)` if you intend to animate the result ; transitions over relative-color expressions require typed `@property` registration (see `[[frontend-theming-color-palette-oklch]]`).

## `color-mix()` : the eleven color spaces

Per [MDN : color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19), Baseline Widely Available since May 2023.

```css
.muted { background: color-mix(in oklch, var(--brand), white 60%); }
.gradient-stop { background: color-mix(in oklab, oklch(60% 0.2 250), oklch(60% 0.2 30)); }
.warm { background: color-mix(in oklch longer hue, oklch(70% 0.18 30), oklch(70% 0.18 240) 40%); }
```

The full set of supported color spaces :

- **Rectangular** : `srgb`, `srgb-linear`, `display-p3`, `lab`, `oklab`, `rec2020`, `xyz`, `xyz-d50`, `xyz-d65`
- **Polar** : `hsl`, `hwb`, `lch`, `oklch`

Polar spaces support a hue-interpolation modifier :

- `shorter hue` (default) : take the shortest arc around the hue circle
- `longer hue` : take the longer arc (produces rainbow sweeps)
- `increasing hue` : monotonically increase the hue angle
- `decreasing hue` : monotonically decrease

The percentages are optional ; when omitted, both colors contribute 50%. When one percentage is given, the other is `100% - first`. When both are given and the sum is below 100%, the result is partially transparent ; when above 100%, it normalizes.

## `light-dark()`

Per [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (verified 2026-05-19), Baseline Newly Available since May 2024.

```css
:root {
  color-scheme: light dark;
}

body {
  background: light-dark(oklch(98% 0.005 290), oklch(15% 0.01 290));
  color:      light-dark(oklch(15% 0.01 290), oklch(95% 0.005 290));
}

.hero {
  background-image: light-dark(url("hero-light.avif"), url("hero-dark.avif"));
}
```

The function resolves to its first argument when the effective color scheme is `light`, to its second argument when `dark`. WITHOUT `color-scheme: light dark` (or `color-scheme: dark` / `color-scheme: only dark` / etc.) declared on the relevant ancestor, the function silently falls back to the light value. The function works for any property that accepts a `<color>` OR a `<image>` value.

## Wide-gamut color : `color(display-p3 ...)` and `@media (color-gamut: p3)`

Per [W3C : CSS Color 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19), the `color()` function gives access to color spaces beyond sRGB.

```css
.brand-vivid {
  /* sRGB fallback : closest in-gamut approximation */
  background: oklch(70% 0.2 30);
}

@media (color-gamut: p3) {
  .brand-vivid {
    background: color(display-p3 1 0.4 0.25);
  }
}
```

The `color()` function accepts a color-space identifier (`display-p3`, `rec2020`, `srgb`, `srgb-linear`, `lab-d50`, `xyz`, `xyz-d50`, `xyz-d65`, `prophoto-rgb`, `a98-rgb`) and component values typically in 0..1.

The `@media (color-gamut: ...)` query has three meaningful values : `srgb`, `p3`, `rec2020`. Each value matches when the display can reproduce that gamut OR a wider one (a Rec2020 display also matches `color-gamut: p3` and `color-gamut: srgb`).

ALWAYS provide a sRGB fallback for wide-gamut colors. The browser's gamut-mapping algorithm clips out-of-gamut colors to the closest in-gamut color, but the clipped color often loses chroma and looks washed-out compared to an `oklch()` value authored within sRGB to begin with.

## How to use the references

- `references/methods.md` : the complete `<color>` syntax matrix, the `color-mix` color-space table with rectangular vs polar grouping, the hue-interpolation method reference, the `color-scheme` value taxonomy.
- `references/examples.md` : code-only snippets for each pattern (no renderable full-page fragment).
- `references/anti-patterns.md` : five anti-patterns with symptom / root cause / fix structure.

## Cross-references

- `[[frontend-theming-color-palette-oklch]]` : systematic palette generation from a brand seed via relative color
- `[[frontend-theming-dark-light-mode]]` : the full dark / light theming workflow
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 2.2 contrast calculations
- `[[frontend-impl-design-tokens]]` : DTCG token build pipeline for color tokens
- `[[frontend-core-design-philosophy]]` : when to prefer `oklch()` over `hsl()`

## Primary sources (verified 2026-05-19)

- [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [MDN : color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
- [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [W3C : CSS Color 4](https://www.w3.org/TR/css-color-4/)
- [W3C : CSS Color 5](https://www.w3.org/TR/css-color-5/)
