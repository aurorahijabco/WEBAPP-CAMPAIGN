# Methods : typography system

Sources : [MDN: font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings) (verified 2026-05-19), [MDN: font-variant](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant) (verified 2026-05-19), [MDN: font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings) (verified 2026-05-19), [MDN: @font-face/font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) (verified 2026-05-19), [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) (verified 2026-05-19), [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (verified 2026-05-19), [MDN: @font-face/size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust) (verified 2026-05-19), [MDN: @font-face/ascent-override](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/ascent-override) (verified 2026-05-19), [web.dev: Preload critical assets](https://web.dev/articles/preload-critical-assets) (verified 2026-05-19).

## 1. Variable-font registered axes

Per [MDN: font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings) (verified 2026-05-19) :

| Axis tag (case-sensitive, lowercase) | Shorthand to prefer | Value range | Notes |
|--------------------------------------|---------------------|-------------|-------|
| `"wght"` | `font-weight: <number>` | 1..1000 (per the font's declared range) | Interpolatable. |
| `"wdth"` | `font-stretch: <percentage>` | usually 50%..200% | "Condensed" 75% to "expanded" 125% are common authoring values. |
| `"slnt"` | `font-style: oblique <angle>` | typically -20deg to 20deg (font-dependent) | Continuous slant. |
| `"ital"` | `font-style: italic` | 0 or 1 (toggle) | Pair with `"slnt"` if both axes exist. |
| `"opsz"` | `font-optical-sizing: auto` | UA-managed against current `font-size` | Selects glyph forms tuned to the rendered size. |

Custom axes use UPPERCASE 4-character tags (e.g. `"GRAD"`, `"YOPQ"` in Roboto Flex). MDN rule, verbatim : "Font characteristics set using `font-variation-settings` will always override those set using the corresponding basic font properties, e.g., `font-weight`, no matter where they appear in the cascade."

Practical ordering rule :

```css
.heading {
  font-weight: 600;                /* "wght" */
  font-stretch: 87.5%;             /* "wdth" */
  font-style: oblique 12deg;       /* "slnt" */
  font-optical-sizing: auto;       /* "opsz" */
}
.heading-expressive {
  font-weight: 600;
  font-variation-settings: "GRAD" 80, "YOPQ" 90;   /* custom axes ONLY */
}
```

## 2. `font-variant-*` longhands and shorthand

Per [MDN: font-variant](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant) (verified 2026-05-19). Seven longhands :

| Longhand | Values |
|----------|--------|
| `font-variant-ligatures` | `normal` / `none` / `common-ligatures` / `no-common-ligatures` / `discretionary-ligatures` / `no-discretionary-ligatures` / `historical-ligatures` / `no-historical-ligatures` / `contextual` / `no-contextual` |
| `font-variant-caps` | `normal` / `small-caps` / `all-small-caps` / `petite-caps` / `all-petite-caps` / `unicase` / `titling-caps` |
| `font-variant-numeric` | `normal` / `lining-nums` / `oldstyle-nums` / `proportional-nums` / `tabular-nums` / `diagonal-fractions` / `stacked-fractions` / `ordinal` / `slashed-zero` |
| `font-variant-alternates` | `normal` / `historical-forms` / `stylistic(<feature-value>)` / `styleset(...)` / `character-variant(...)` / `swash(...)` / `ornaments(...)` / `annotation(...)` |
| `font-variant-east-asian` | `normal` / `ruby` / `jis78` / `jis83` / `jis90` / `jis04` / `simplified` / `traditional` / `full-width` / `proportional-width` |
| `font-variant-position` | `normal` / `sub` / `super` |
| `font-variant-emoji` | `normal` / `text` / `emoji` / `unicode` |

The `font-variant` shorthand can set any combination of the longhands.

## 3. `font-feature-settings` reference

Per [MDN: font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings) (verified 2026-05-19). Baseline Widely since April 2017.

Syntax : `font-feature-settings: "<4-char-tag>" <integer-or-on-or-off> [, ...];`

MDN rule, verbatim : "Whenever possible, Web authors should instead use the `font-variant` shorthand property or an associated longhand property... `font-feature-settings` shouldn't be used to enable small caps."

Use ONLY for features WITHOUT a `font-variant-*` keyword :

| Feature class | Examples |
|---------------|----------|
| Stylistic sets | `"ss01"`, `"ss02"`, ..., `"ss20"` |
| Character variants | `"cv01"`, `"cv02"`, ..., `"cv99"` |
| Font-specific features | `"GRAD"`-like (rare); usually font-vendor-defined |

```css
.body { font-variant-ligatures: common-ligatures; font-variant-numeric: lining-nums; }
.heading { font-feature-settings: "ss03" 1, "cv11" 1; }
```

## 4. Modular scale generator (math)

Given a base size `B` (typically `1rem`) and a ratio `R` (e.g. 1.25), step `n` is :

```
step(n) = B * R^n
```

Negative `n` produces sub-base sizes (caption, fine print) ; positive `n` produces heading sizes. For ratio 1.2 with `B = 1rem` :

```
step(-2) = 0.694rem
step(-1) = 0.833rem
step( 0) = 1.000rem
step( 1) = 1.200rem
step( 2) = 1.440rem
step( 3) = 1.728rem
step( 4) = 2.074rem
step( 5) = 2.488rem
```

Combine with the fluid `clamp()` recipe (next section) to derive the full fluid scale.

## 5. Fluid `clamp()` recipe

```
font-size: clamp(MIN, BASELINE_REM + SLOPE_VW, MAX);

Given anchor points (MIN at viewport WMIN, MAX at viewport WMAX) :
  SLOPE_REM_PER_PX = (MAX - MIN) / (WMAX - WMIN)
  SLOPE_VW = SLOPE_REM_PER_PX * 100  /* convert rem-per-px to vw */
  BASELINE_REM = MIN - SLOPE_VW * WMIN / 100
```

In practice, tooling (Utopia, Modern Fluid Type) computes the values. Manual recipe :

1. Decide `MIN` (e.g. 1rem at 400px viewport) and `MAX` (e.g. 1.25rem at 1200px viewport).
2. Compute the slope (in vw).
3. Combine baseline + slope so the value reads as `BASELINE_REM + SLOPE_VW`.
4. Verify `MAX >= 2 x MIN` for WCAG 1.4.4.

## 6. `font-display` matrix

Per [MDN: @font-face/font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) (verified 2026-05-19). Baseline since January 2020.

| Value | Block (invisible) | Swap | Recommended for |
|-------|--------------------|------|-----------------|
| `auto` | UA-defined | UA-defined | NEVER (typically maps to `block`) |
| `block` | ~3 s | infinite | NEVER (FOIT destroys LCP) |
| `swap` | ~0 ms | infinite | hero / heading webfonts paired with fallback |
| `fallback` | ~100 ms | ~3 s | below-the-fold body |
| `optional` | ~100 ms | 0 (only if loaded immediately) | above-the-fold body where LCP stability outranks fancy webfont |

## 7. Web-font preload recipe

Per [web.dev: Preload critical assets](https://web.dev/articles/preload-critical-assets) (verified 2026-05-19) :

```html
<link rel="preload" href="/fonts/Inter-roman.var.woff2" as="font" type="font/woff2" crossorigin>
```

| Attribute | Required | Why |
|-----------|----------|-----|
| `rel="preload"` | yes | Marks the resource as preload. |
| `href` | yes | Absolute path or origin-relative URL of the font. |
| `as="font"` | yes | Tells the browser this is a font ; wrong `as` value wastes the preload. |
| `type="font/woff2"` | yes | Browser can drop the request if format unsupported (rare on woff2). |
| `crossorigin` | yes (even same-origin) | Without it, the font is fetched twice. |

Preload sparingly : ONLY fonts that contribute to LCP. Preloading too many resources de-prioritises everything.

## 8. CLS-safe fallback `@font-face`

Per [MDN: @font-face/size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust) (verified 2026-05-19), Baseline since September 2023. Per [MDN: @font-face/ascent-override](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/ascent-override) (verified 2026-05-19), Limited Availability in 2026.

| Descriptor | Range | Notes |
|------------|-------|-------|
| `size-adjust` | `<percentage>`, default `100%` | Scales ALL glyph metrics. |
| `ascent-override` | `normal` / `<percentage>` | Override ascent above baseline. |
| `descent-override` | `normal` / `<percentage>` | Override descent below baseline. |
| `line-gap-override` | `normal` / `<percentage>` | Override line-gap. |

Values are computed from the webfont's `OS/2.sTypoAscender`, `sTypoDescender`, `sTypoLineGap`, and `head.unitsPerEm` (or equivalent tables). Tools : Fontaine, Capsize, Modern Font Stacks.

A second mitigation : the CSS property `font-size-adjust: ex-height <number>` (browser-agnostic since Chromium 127 / Firefox 118) scales font-size so lowercase x-height matches a reference. Less complete than the descriptor-based overrides.

## 9. `text-wrap` value matrix

Per [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) (verified 2026-05-19). Baseline 2024.

| Value | Algorithm |
|-------|-----------|
| `wrap` (default) | Greedy line-breaking. |
| `nowrap` | No wrap. |
| `balance` | Distributes characters equally ; capped 6 lines Chromium / 10 lines Firefox ; falls back to `wrap` beyond. |
| `pretty` | Slower algorithm prioritising orphan minimisation. |
| `stable` | Holds existing line breaks stable during content edits. |

## 10. Mapping table : "what do I want" -> "which property"

| Need | Property |
|------|----------|
| Heading scales with viewport | `font-size: clamp(MIN, BASE + SLOPE_VW, MAX)` |
| Switch font weight | `font-weight: <number>` (NEVER `font-variation-settings: "wght" N`) |
| Toggle italic | `font-style: italic` (NEVER `font-variation-settings: "ital" 1`) |
| Apply oblique slant | `font-style: oblique <angle>` (NEVER `font-variation-settings: "slnt" N`) |
| Optical sizing | `font-optical-sizing: auto` |
| Tabular numerals | `font-variant-numeric: tabular-nums` |
| Small caps | `font-variant-caps: small-caps` |
| No common ligatures (branded type) | `font-variant-ligatures: no-common-ligatures` |
| Stylistic set N | `font-feature-settings: "ssNN" 1` |
| Custom axis (GRAD, YOPQ) | `font-variation-settings: "GRAD" 80, "YOPQ" 90` |
| Avoid FOIT | `font-display: swap` |
| Avoid CLS from font swap | metric-matched fallback `@font-face` with `size-adjust` |
| Avoid LCP regression | `<link rel=preload as=font type=font/woff2 crossorigin>` |
| Below-the-fold webfont | `font-display: optional` |
| Balanced multi-line heading | `text-wrap: balance` |
| Orphan-free body | `text-wrap: pretty` |
| Stable contenteditable | `text-wrap: stable` |
| Unitless line height | `line-height: 1.5` (NEVER `line-height: 24px`) |

## 11. Recommended `font-family` stack

```css
:root {
  font-family:
    "Inter",
    "Inter-fallback",
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
}
```

`system-ui` is the OS default; `-apple-system` and the rest fill historical gaps on engines where `system-ui` resolves wrong. ALWAYS put the metric-matched fallback (`"Inter-fallback"` in the example) IMMEDIATELY AFTER the webfont so it absorbs the swap without a visible shift.
