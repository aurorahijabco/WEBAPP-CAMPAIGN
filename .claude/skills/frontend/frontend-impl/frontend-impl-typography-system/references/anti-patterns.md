# Anti-Patterns : typography system

Each entry : symptom (what the user / developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [MDN: font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings) (verified 2026-05-19), [MDN: font-variant](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant) (verified 2026-05-19), [MDN: font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings) (verified 2026-05-19), [MDN: @font-face/font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) (verified 2026-05-19), [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) (verified 2026-05-19), [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (verified 2026-05-19), [web.dev: Preload critical assets](https://web.dev/articles/preload-critical-assets) (verified 2026-05-19).

## Anti-pattern 1 : `line-height: 24px` (px, not unitless)

```css
/* anti-pattern */
.body { font-size: clamp(1rem, ... , 1.25rem); line-height: 24px; }
```

Symptom : as `font-size` scales fluidly with viewport, the line-height stays a fixed 24 pixels; at small viewports the line spacing looks tight, at large viewports the spacing looks cramped relative to the bigger letters. Worse, child elements inheriting line-height get a computed 24px value, not a relationship.

Root cause : a px-valued `line-height` is computed once and propagates as a length; a unitless `line-height` propagates as a multiplier and re-resolves against each element's own `font-size`.

Fix : ALWAYS use unitless line-height.

```css
.body { font-size: clamp(1rem, ... , 1.25rem); line-height: 1.5; }
```

`1.5` means "1.5 times the current element's font-size". When the font-size changes (fluid, user-zoom, responsive), the line-height tracks.

## Anti-pattern 2 : `font-display: block` (or default `auto`)

```css
/* anti-pattern */
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.woff2") format("woff2");
  /* font-display defaults to auto, which most browsers treat like block */
}
```

Symptom : on a fresh-cache visit, the text using this font is INVISIBLE for up to 3 seconds (FOIT). LCP regresses badly; users see a blank text region.

Root cause : `font-display: block` (the typical resolution of `auto`) blocks rendering for ~3 seconds waiting for the font to load.

Fix : ALWAYS set `font-display` explicitly.

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.var.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;   /* or 'optional' below-the-fold */
}
```

Pair `swap` with a metric-matched fallback `@font-face` so the FOUT is invisible.

## Anti-pattern 3 : mixing `font-weight` and `font-variation-settings: "wght" N`

```css
/* anti-pattern */
:root { font-variation-settings: "wght" 400; }     /* base layer */
.button { font-weight: 700; }                       /* component layer */
```

Symptom : `.button` renders at weight 400, not 700, despite `font-weight: 700` being specified at a higher cascade layer.

Root cause : per [MDN: font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings) (verified 2026-05-19) : "Font characteristics set using `font-variation-settings` will always override those set using the corresponding basic font properties, e.g., `font-weight`, no matter where they appear in the cascade." The base-layer `font-variation-settings` wins regardless of where in the cascade `font-weight` is set.

Fix : PICK ONE mechanism per project. Always prefer the high-level shorthand for registered axes.

```css
/* registered axes : ALWAYS use the shorthand */
:root { font-weight: 400; font-optical-sizing: auto; }
.button { font-weight: 700; }

/* font-variation-settings ONLY for custom axes (uppercase tags) */
.expressive { font-variation-settings: "GRAD" 80; }
```

## Anti-pattern 4 : `font-feature-settings: "smcp" 1` for small caps

```css
/* anti-pattern */
.byline { font-feature-settings: "smcp" 1; }
```

Symptom : the small-caps render works on most engines, but breaks on some. The MDN reference explicitly warns against this form ; review tooling and linters flag it.

Root cause : per [MDN: font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings) (verified 2026-05-19), `font-feature-settings` is "a low-level feature designed to handle special cases where no other way exists to enable or access an OpenType font feature. In particular, `font-feature-settings` shouldn't be used to enable small caps."

Fix : use the high-level `font-variant-caps` keyword.

```css
.byline { font-variant-caps: small-caps; }
```

Same rule applies to tabular numerals (`font-variant-numeric: tabular-nums`), common ligatures, fractions, slashed-zero, subscript/superscript, and any feature with a `font-variant-*` keyword. Reserve `font-feature-settings` for stylistic sets (`ss01`..`ss20`) and character-variant selectors (`cv01`..`cv99`) that have NO keyword equivalent.

## Anti-pattern 5 : preload missing `crossorigin`

```html
<!-- anti-pattern -->
<link rel="preload" href="/fonts/Inter.var.woff2" as="font" type="font/woff2">
```

Symptom : the browser fetches the font TWICE. Network tab shows two requests for the same URL; bandwidth doubles; LCP improvement from the preload is wiped out.

Root cause : per [web.dev: Preload critical assets](https://web.dev/articles/preload-critical-assets) (verified 2026-05-19) : "Fonts preloaded without the `crossorigin` attribute will be fetched twice." Fonts use anonymous CORS mode regardless of origin ; without `crossorigin` on the preload, the preloaded request and the eventual `@font-face` request do not match and the browser fetches separately.

Fix : ALWAYS add `crossorigin` (even on same-origin fonts).

```html
<link rel="preload" href="/fonts/Inter.var.woff2" as="font" type="font/woff2" crossorigin>
```

## Anti-pattern 6 : `clamp()` `MAX < 2 x MIN` (WCAG 1.4.4)

```css
/* anti-pattern */
body { font-size: clamp(1rem, 2.5vw, 1.2rem); }
```

Symptom : a user with the OS-wide text-zoom set to 200% sees content that does NOT scale to 200% because the `MAX` of 1.2rem caps near the default base size.

Root cause : WCAG 1.4.4 Resize Text requires browsers to scale text to at least 200% without loss of content or function. A `clamp()` whose `MAX < 2 x MIN` artificially caps the scaling.

Fix : ensure `MAX >= 2 x MIN`.

```css
body { font-size: clamp(1rem, 0.875rem + 0.5vw, 2rem); }
```

Tools like Utopia / Modern Fluid Type that compute the slope and baseline from anchor points usually surface this constraint as a warning.

## Anti-pattern 7 : six static webfont files instead of one variable font

```css
/* anti-pattern */
@font-face { font-family: "Inter"; src: url("/fonts/Inter-300.woff2"); font-weight: 300; }
@font-face { font-family: "Inter"; src: url("/fonts/Inter-400.woff2"); font-weight: 400; }
@font-face { font-family: "Inter"; src: url("/fonts/Inter-500.woff2"); font-weight: 500; }
@font-face { font-family: "Inter"; src: url("/fonts/Inter-600.woff2"); font-weight: 600; }
@font-face { font-family: "Inter"; src: url("/fonts/Inter-700.woff2"); font-weight: 700; }
@font-face { font-family: "Inter"; src: url("/fonts/Inter-800.woff2"); font-weight: 800; }
```

Symptom : the design uses 6 weights; the cold-cache cost is roughly 6 x 100 KB = 600 KB just for fonts. LCP suffers and the browser must arbitrate which weight to fetch first.

Root cause : separate static files per weight is the pre-variable-font architecture. Variable fonts pack all weights in a single binary.

Fix : ship one variable font with `font-weight: 100 900;` covering the full range.

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-roman.var.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
```

A typical full-range variable Inter is 80-150 KB versus 600 KB for six static cuts.

## Anti-pattern 8 : pure-vw `font-size` (no `rem` floor)

```css
/* anti-pattern */
h1 { font-size: 4vw; }
```

Symptom : on a 320px viewport the h1 is 12.8px (unreadable). User-controlled root font scaling (e.g. browser zoom for low-vision users) does not propagate because `vw` is independent of root size.

Root cause : pure-`vw` font-size scales only with viewport width. Narrow viewports collapse to tiny sizes; accessibility zoom that scales the root font is bypassed.

Fix : `clamp()` with a `rem` floor.

```css
h1 { font-size: clamp(1.5rem, 1rem + 2vw, 3rem); }
```

The `1rem` baseline plus `2vw` slope ensures the text never collapses below 1.5rem even at very narrow viewports, and propagates root-size changes.

## Anti-pattern 9 : `text-wrap: balance` on long body paragraphs

```css
/* anti-pattern */
p { text-wrap: balance; }
```

Symptom : the rule appears to do nothing on long paragraphs; browser silently falls back to `wrap`. On short paragraphs the visual effect may also be subtle. Some engines show a tiny perf cost.

Root cause : per [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) (verified 2026-05-19), `text-wrap: balance` is capped at 6 lines in Chromium and 10 lines in Firefox. Beyond the cap the browser silently falls back to `wrap`. The cap exists because balanced wrapping is O(n^2)-ish in line count.

Fix : use `balance` for headings, captions, blockquotes (short multi-line text). Use `pretty` for body.

```css
h1, h2, h3, h4, blockquote { text-wrap: balance; }
p, li, dd { text-wrap: pretty; }
```

## Anti-pattern 10 : no metric-matched fallback `@font-face`

```css
/* anti-pattern */
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.var.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
body { font-family: "Inter", system-ui, sans-serif; }
```

Symptom : on first paint, body text renders in `system-ui` (let us say San Francisco on macOS, Segoe UI on Windows, Roboto on Android). When the webfont arrives, the entire page reflows because Inter's ascent / descent / line-gap / advance widths differ from the fallback. CLS spike.

Root cause : the fallback font is sized for its own metrics, not Inter's. When the webfont swaps in, line boxes resize and content shifts.

Fix : declare a metric-matched fallback `@font-face` and insert it IMMEDIATELY after the webfont in the `font-family` chain.

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.var.woff2") format("woff2-variations");
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

The override percentages are computed from the webfont's `OS/2.sTypoAscender`, `sTypoDescender`, `sTypoLineGap`, and `head.unitsPerEm` (or equivalents). Tools : Fontaine, Capsize. `size-adjust` is Baseline since September 2023; the `ascent-override` / `descent-override` / `line-gap-override` descriptors are Limited Availability in 2026 (progressive enhancement).
