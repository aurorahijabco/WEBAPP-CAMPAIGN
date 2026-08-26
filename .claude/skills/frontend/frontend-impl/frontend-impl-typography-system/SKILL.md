---
name: frontend-impl-typography-system
description: >
  Use when building a typographic system for a product (modular type scale, fluid scaling across viewports, variable-font axes, web-font loading strategy), when a heading wraps badly with one orphaned word and `text-wrap: balance` is on the table, when `font-feature-settings` and `font-variant-*` both appear in the codebase and a deterministic ordering is needed, when a designer asks "why is my tabular numerals rule not working" (it likely uses the raw OpenType tag instead of `font-variant-numeric: tabular-nums`), when web-font swap causes visible layout shift (CLS) and a metric-matched fallback is required, when the LCP candidate text uses a webfont that needs preloading, or when a `font-weight: 700` declaration is being silently overridden by a `font-variation-settings: "wght" 400` in a base layer.
  Prevents the `line-height: 24px` trap (px line-height stops scaling with `font-size` and breaks fluid type), `font-display: block` (or the default `auto`) FOIT that destroys LCP, mixing `font-weight` and `font-variation-settings: "wght" N` (variation-settings overrides shorthand regardless of cascade order, per MDN; the shorthand silently loses), using `font-feature-settings: "smcp" 1` instead of `font-variant-caps: small-caps` (MDN explicitly forbids feature-settings for small caps), `font-size` in `px` (locks out user-controlled root scaling), pure-vw fluid type with no `rem` floor (collapses to unreadable on narrow viewports), `clamp()` with `MAX < 2 x MIN` (WCAG 1.4.4 200% zoom failure), preloading a webfont WITHOUT `crossorigin` (browser fetches the font twice), shipping six static webfont weights when one variable font would do, `text-wrap: balance` on long body paragraphs (silently falls back beyond the 6-10 line cap), and forgetting the metric-matched fallback `@font-face` (font swap visibly shifts the layout).
  Covers the modular-scale concept (geometric ratios 1.125 / 1.2 / 1.25 / 1.333 / 1.414 / 1.5 / 1.618 with usage rule UI-dense vs editorial), fluid typography via `clamp(MIN_REM, BASE_REM + SLOPE_VW, MAX_REM)` with the WCAG `MAX >= 2 x MIN` constraint, the five registered variable-font axes (`wght` / `wdth` / `slnt` / `ital` / `opsz`) with the high-level CSS shorthand to prefer per axis (`font-weight`, `font-stretch`, `font-style: oblique <angle>` or `italic`, `font-optical-sizing`), the seven `font-variant-*` longhands (`ligatures`, `caps`, `numeric`, `alternates`, `east-asian`, `position`, `emoji`) and their OpenType tag mapping, the rule that `font-feature-settings` is reserved for stylistic sets (`ss01` - `ss20`) and `cv*` selectors only, `font-display` value matrix (`auto` / `block` / `swap` / `fallback` / `optional`) with FOIT/FOUT trade-off and the LCP-aware default, the `<link rel="preload" as="font" type="font/woff2" crossorigin>` recipe and the rule that `crossorigin` is mandatory even for same-origin fonts, the `text-wrap` value set (`wrap` / `nowrap` / `balance` / `pretty` / `stable`) Baseline 2024 with `balance` for headings and `pretty` for body, and the CLS-prevention pattern using `@font-face` with `size-adjust` (Baseline Sept 2023) and `ascent-override` / `descent-override` / `line-gap-override` (the latter three Limited Availability in 2026, progressive enhancement).
  Keywords: typography, type system, type scale, modular scale, geometric ratio, fluid typography, clamp, font-size, line-height, unitless line-height, variable font, font-variation-settings, font-feature-settings, font-variant, font-variant-ligatures, font-variant-caps, font-variant-numeric, font-variant-position, font-variant-east-asian, font-variant-emoji, font-variant-alternates, tabular-nums, lining-nums, oldstyle-nums, slashed-zero, diagonal-fractions, small-caps, all-small-caps, common-ligatures, discretionary-ligatures, font-weight, font-stretch, font-style, font-optical-sizing, wght, wdth, slnt, ital, opsz, font-display, swap, optional, fallback, block, FOIT, FOUT, web font loading, preload font, crossorigin, woff2, text-wrap, balance, pretty, stable, size-adjust, ascent-override, descent-override, line-gap-override, font-size-adjust, ex-height, CLS prevention, font shift, fallback font, system-ui, line-height px not unitless, font shift, fallback wrong, typography uneven, font feature settings not working, font weight not changing, how to load web font, how to use variable font, what is fluid typography, modular scale generator, type scale CSS, font loading strategy, how to prevent font CLS, how to balance heading wrap.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Impl Typography System

This skill defines a deterministic rule set for shipping a typographic system : modular scale + fluid `clamp()` type, variable-font axes (preferring high-level shorthand over `font-variation-settings`), OpenType features via `font-variant-*` (with `font-feature-settings` reserved for stylistic sets), CLS-safe web-font loading (`font-display: swap` + metric-matched fallback), and `text-wrap: balance|pretty` (Baseline 2024). The skill builds on `[[frontend-impl-design-tokens]]` (token emission as CSS custom properties) and `[[frontend-perf-core-web-vitals-inp]]` (LCP / CLS budgets).

Sources : [MDN: font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings) (verified 2026-05-19), [MDN: font-variant](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant) (verified 2026-05-19), [MDN: font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings) (verified 2026-05-19), [MDN: @font-face/font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) (verified 2026-05-19), [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) (verified 2026-05-19), [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (verified 2026-05-19), [MDN: @font-face/size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust) (verified 2026-05-19), [MDN: @font-face/ascent-override](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/ascent-override) (verified 2026-05-19), [web.dev: Preload critical assets](https://web.dev/articles/preload-critical-assets) (verified 2026-05-19).

## Quick Reference

### Modular scale ratios

| Ratio | Name | Best for |
|-------|------|----------|
| 1.125 | Minor second | Very dense UI (tables, dashboards). Steps barely distinguishable. |
| 1.2   | Minor third | Compact app UI. |
| 1.25  | Major third | General app UI. The most common default. |
| 1.333 | Perfect fourth | Marketing-leaning products with mixed editorial sections. |
| 1.414 | Augmented fourth (sqrt 2) | Paper-document-feel layouts. |
| 1.5   | Perfect fifth | Editorial / long-form content. |
| 1.618 | Golden ratio | Display / marketing landing pages with strong hierarchy. |

Rule of thumb : ratio is LARGER for editorial, SMALLER for dense UI.

### Fluid `clamp()` recipe

```css
font-size: clamp(MIN_REM, BASE_REM + SLOPE_VW, MAX_REM);
```

| Rule | Detail |
|------|--------|
| MIN, MAX in `rem` | Honour the user's root font size. |
| Mix `rem` + `vw` in the preferred expression | Pure `vw` collapses to unreadable on narrow viewports; pure `rem` is not fluid. |
| `MAX >= 2 x MIN` | WCAG 1.4.4 Resize Text. Allows browser zoom to 200% without hitting the cap. |
| Verify at design min / max viewports | If the preferred resolves outside `[MIN, MAX]`, the value silently behaves like a constant. |

A full step-indexed scale (ratio 1.2) :

```css
:root {
  --step--2: clamp(0.69rem, 0.66rem + 0.18vw, 0.80rem);
  --step--1: clamp(0.83rem, 0.78rem + 0.28vw, 1.00rem);
  --step-0:  clamp(1.00rem, 0.93rem + 0.42vw, 1.25rem);
  --step-1:  clamp(1.20rem, 1.10rem + 0.62vw, 1.56rem);
  --step-2:  clamp(1.44rem, 1.30rem + 0.91vw, 1.95rem);
  --step-3:  clamp(1.73rem, 1.53rem + 1.32vw, 2.44rem);
  --step-4:  clamp(2.07rem, 1.80rem + 1.91vw, 3.05rem);
  --step-5:  clamp(2.49rem, 2.12rem + 2.76vw, 3.81rem);
}
```

### Variable-font registered axes

Per [MDN: font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings) (verified 2026-05-19). ALWAYS use the shorthand for registered axes; reserve `font-variation-settings` for CUSTOM axes only.

| Axis tag | Use this shorthand | Notes |
|----------|--------------------|-------|
| `"wght"` | `font-weight: <number>` | 100..900 plus intermediate values supported by variable fonts. |
| `"wdth"` | `font-stretch: <percentage>` | Condensed (50%) to expanded (200%). |
| `"slnt"` | `font-style: oblique <angle>` | Slant angle in degrees. |
| `"ital"` | `font-style: italic` | Italic toggle (0/1). |
| `"opsz"` | `font-optical-sizing: auto` | Optical sizing matched to `font-size`. |

CRITICAL RULE (per MDN) : "Font characteristics set using `font-variation-settings` will always override those set using the corresponding basic font properties, e.g., `font-weight`, no matter where they appear in the cascade." NEVER mix the two for the same axis ; pick one mechanism per axis project-wide. Prefer the shorthand.

### `font-variant-*` over `font-feature-settings`

Per [MDN: font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings) (verified 2026-05-19) : "Whenever possible, Web authors should instead use the `font-variant` shorthand property or an associated longhand property... `font-feature-settings` shouldn't be used to enable small caps."

| OpenType feature | Use this `font-variant-*` |
|------------------|---------------------------|
| Small caps (`smcp`) | `font-variant-caps: small-caps` |
| All small caps (`c2sc, smcp`) | `font-variant-caps: all-small-caps` |
| Tabular numerals (`tnum`) | `font-variant-numeric: tabular-nums` |
| Lining numerals (`lnum`) | `font-variant-numeric: lining-nums` |
| Old-style numerals (`onum`) | `font-variant-numeric: oldstyle-nums` |
| Slashed zero (`zero`) | `font-variant-numeric: slashed-zero` |
| Diagonal fractions (`frac`) | `font-variant-numeric: diagonal-fractions` |
| Common ligatures (`liga`) | `font-variant-ligatures: common-ligatures` (default on) |
| Discretionary ligatures (`dlig`) | `font-variant-ligatures: discretionary-ligatures` |
| Subscript / Superscript (`subs` / `sups`) | `font-variant-position: sub` / `font-variant-position: super` |

Reserve `font-feature-settings` for :

- Stylistic sets : `font-feature-settings: "ss03" 1;`
- Character-variant selectors : `font-feature-settings: "cv11" 1;`
- Font-specific features that have NO `font-variant-*` keyword.

NEVER mix `font-feature-settings` and `font-variant-*` for the SAME feature ; behaviour is implementation-defined.

### `font-display` value matrix

Per [MDN: @font-face/font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) (verified 2026-05-19), Baseline since January 2020.

| Value | Block period | Swap period | Effect | Use for |
|-------|--------------|-------------|--------|---------|
| `auto` | UA-defined | UA-defined | usually equivalent to `block` | NEVER |
| `block` | ~3 s | infinite | FOIT then FOUT-on-swap | NEVER (kills LCP) |
| `swap` | ~0 ms | infinite | FOUT immediate; webfont swaps in | DEFAULT for hero / heading webfonts (paired with metric-matched fallback) |
| `fallback` | ~100 ms | ~3 s | tiny invisible window, then fallback ; webfont only swaps if it arrives within 3 s | Below-the-fold body when slight FOIT-glimpse is acceptable |
| `optional` | ~100 ms | 0 | tiny invisible window, then fallback ; webfont only used if loaded almost instantly (cached) | Above-the-fold body where stable LCP is the priority |

### Web-font preload (LCP-critical)

```html
<link rel="preload" href="/fonts/Inter-roman.var.woff2" as="font" type="font/woff2" crossorigin>
```

Rules :

1. `crossorigin` is MANDATORY (even for same-origin fonts) ; without it the browser fetches the font twice.
2. `as="font"` is MANDATORY ; an incorrect `as` value triggers wrong priority and wastes the preload.
3. Preload ONLY LCP-critical fonts. Preloading too many resources de-prioritises everything.
4. Use `woff2` only. WOFF1 / TTF / OTF have no place in 2026 evergreen.

### `text-wrap` (Baseline 2024)

Per [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) (verified 2026-05-19).

| Value | Effect | Use for |
|-------|--------|---------|
| `wrap` (default) | Greedy line-breaking. | n/a |
| `nowrap` | No wrap. | Tags, badges, single-line UI. |
| `balance` | Distributes characters equally across lines. Capped at 6 lines (Chromium) / 10 lines (Firefox) ; silently falls back beyond. | Headings (h1-h3), captions, blockquote pull-quotes. |
| `pretty` | Slower algorithm prioritising orphan minimisation and overall layout quality. | Body copy where typography matters. |
| `stable` | Keeps existing line breaks stable while content changes (typing in a contenteditable). | `[contenteditable]`. |

### CLS-safe fallback `@font-face`

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-roman.var.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "Inter-fallback";
  src: local("Arial");
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22.5%;
  line-gap-override: 0%;
}

body { font-family: "Inter", "Inter-fallback", system-ui, sans-serif; }
```

| Descriptor | Baseline | Notes |
|------------|----------|-------|
| `size-adjust` | Baseline Widely Available (September 2023) | Scales all glyph metrics by a percentage. LOAD-BEARING for CLS prevention. |
| `ascent-override` | Limited Availability in 2026 | Sets ascent above baseline. Progressive enhancement. |
| `descent-override` | Limited Availability in 2026 | Sets descent below baseline. |
| `line-gap-override` | Limited Availability in 2026 | Sets line-gap between lines. |

`size-adjust` alone removes most font-swap CLS. The override descriptors close the remaining gap when supported.

## Decision Trees

### Decision : `font-variant-*` or `font-feature-settings`?

```
Does the OpenType feature have a font-variant-* keyword?

  Yes (small caps, tabular nums, common ligatures, fractions,
       slashed zero, subscript / superscript, oldstyle nums, etc.)
    -> ALWAYS font-variant-* (or the font-variant shorthand).
       NEVER raw font-feature-settings even though the OpenType tag
       would technically work.

  No (stylistic set ssNN, character variant cvNN, or any font-specific
      feature without a registered keyword)
    -> font-feature-settings: "ssNN" 1, "cvNN" 1;

Are both forms in the same stylesheet for the same feature?
  -> Pick one. Delete the other. Mixed forms have
     implementation-defined behaviour.
```

### Decision : `font-display: swap` or `optional` (or anything else)?

```
Is this font on the page's LCP candidate text?

  Yes (h1 / hero text / above-the-fold large copy)
    -> font-display: swap.
       Preload with <link rel=preload as=font crossorigin>.
       Pair with metric-matched fallback @font-face to absorb FOUT.

  No, but the font is above-the-fold (nav, byline, body intro)
    -> font-display: optional. Browser uses webfont only if it
       arrives almost instantly (cached); otherwise the fallback
       stays for the whole session. LCP-friendly.

  No, the font is below-the-fold
    -> font-display: fallback. Small invisible window then fallback;
       webfont swaps in if it arrives within 3s.

  NEVER block (3-second FOIT) or auto (browser-dependent).
```

### Decision : `text-wrap: balance` or `pretty`?

```
What kind of text is it?

  Heading (h1, h2, h3, h4) or short caption that is at most 6 lines.
    -> text-wrap: balance.
       Distributes characters equally; produces visually balanced
       multi-line titles instead of an orphan word.

  Body paragraph (p, li, dd) that may be many lines long.
    -> text-wrap: pretty.
       Optimises for orphan minimisation and overall flow.
       Skip if perf-critical on text-heavy pages.

  Editable area where the user is typing.
    -> text-wrap: stable.
       Keeps existing line breaks stable as the user types.

  Nav links, tags, single-line labels.
    -> text-wrap: nowrap (or leave default if wrap is desired).
```

### Decision : variable font or static webfonts?

```
How many weights / styles do you ship?

  3 or more weights, or any custom axis, or you need oblique angles
  intermediate between regular and italic.
    -> Variable font (woff2-variations). One file covers all weights;
       use font-weight, font-stretch, font-style, font-optical-sizing
       for the registered axes; font-variation-settings ONLY for
       custom axes.

  1 or 2 weights, no custom axes.
    -> Static webfonts MAY be acceptable. But a typical variable
       font is 80-150 KB; six static fonts at 100 KB each is 600 KB.
       Variable usually wins.

How do you set the weight?
  Variable font -> font-weight: <number> shorthand.
  NEVER font-variation-settings: "wght" N (overrides shorthand
  silently regardless of cascade order).
```

## Patterns

### Pattern 1 : full type system with tokens

```css
:root {
  --step--2: clamp(0.69rem, 0.66rem + 0.18vw, 0.80rem);
  --step--1: clamp(0.83rem, 0.78rem + 0.28vw, 1.00rem);
  --step-0:  clamp(1.00rem, 0.93rem + 0.42vw, 1.25rem);
  --step-1:  clamp(1.20rem, 1.10rem + 0.62vw, 1.56rem);
  --step-2:  clamp(1.44rem, 1.30rem + 0.91vw, 1.95rem);
  --step-3:  clamp(1.73rem, 1.53rem + 1.32vw, 2.44rem);
  --step-4:  clamp(2.07rem, 1.80rem + 1.91vw, 3.05rem);
  --line-tight: 1.2;
  --line-normal: 1.5;
  --line-loose: 1.75;
}

body { font-size: var(--step-0); line-height: var(--line-normal); font-optical-sizing: auto; }
h1   { font-size: var(--step-4); line-height: var(--line-tight); text-wrap: balance; }
h2   { font-size: var(--step-3); line-height: var(--line-tight); text-wrap: balance; }
h3   { font-size: var(--step-2); line-height: var(--line-tight); text-wrap: balance; }
p    { text-wrap: pretty; max-inline-size: 65ch; }
table { font-variant-numeric: tabular-nums; }
```

### Pattern 2 : variable font with metric-matched fallback (no CLS)

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-roman.var.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "Inter-fallback";
  src: local("Arial");
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22.5%;
  line-gap-override: 0%;
}

:root { font-family: "Inter", "Inter-fallback", system-ui, sans-serif; }
```

Preload in `<head>` :

```html
<link rel="preload" href="/fonts/Inter-roman.var.woff2" as="font" type="font/woff2" crossorigin>
```

### Pattern 3 : variable-font custom axis

```css
.expressive {
  font-weight: 600;
  font-optical-sizing: auto;
  font-variation-settings: "GRAD" 80, "YOPQ" 90;
}
```

Custom axes (uppercase 4-character tags) MAY use `font-variation-settings` ; registered axes (lowercase) MUST use their shorthand.

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md). Ten cataloged : `line-height: 24px` not unitless; `font-display: block` or `auto`; mixing `font-weight` with `font-variation-settings: "wght" N`; `font-feature-settings: "smcp" 1` instead of `font-variant-caps: small-caps`; preload missing `crossorigin`; `clamp()` `MAX < 2 x MIN`; 6 static webfonts vs one variable; pure-vw `font-size`; `text-wrap: balance` on body paragraphs; no matched-fallback `@font-face`.

## Reference Links

- [Methods and signatures](references/methods.md) : full property surface, OpenType tag map, axis table, font-display matrix, preload recipe, CLS metric-override descriptors.
- [Examples](references/examples.md) : renderable HTML demo with fluid scale + variable-font axis + font-variant-numeric live toggles ; nine additional patterns.
- [Anti-patterns](references/anti-patterns.md) : ten cataloged anti-patterns with symptom, root cause, and fix.

## Cross-references

- `[[frontend-impl-design-tokens]]` : token emission as CSS custom properties.
- `[[frontend-impl-responsive-layout-fluid]]` : `clamp()` + viewport units that drive the fluid scale.
- `[[frontend-perf-core-web-vitals-inp]]` : LCP and CLS budgets that constrain font loading choices.
- `[[frontend-syntax-css-color-modern]]` : `@property` and modern CSS surface.
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 1.4.4 Resize Text and minimum contrast.
