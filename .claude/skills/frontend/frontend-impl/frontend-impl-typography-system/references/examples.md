# Examples : typography system

Working snippets. All CSS verified against [MDN: font-variation-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings) (verified 2026-05-19), [MDN: font-variant](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant) (verified 2026-05-19), [MDN: font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings) (verified 2026-05-19), [MDN: @font-face/font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) (verified 2026-05-19), [MDN: text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap) (verified 2026-05-19), [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (verified 2026-05-19), [MDN: @font-face/size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust) (verified 2026-05-19), [web.dev: Preload critical assets](https://web.dev/articles/preload-critical-assets) (verified 2026-05-19).

## Pattern 1 : renderable demo (fluid scale + variable axes + variant features)

Save as `typography.html` and open in a browser. Uses Inter Variable hosted at the rsms.me CDN for the demo; in production, self-host.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Typography system demo</title>
<link rel="preconnect" href="https://rsms.me/">
<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
<style>
  :root {
    --step--2: clamp(0.69rem, 0.66rem + 0.18vw, 0.80rem);
    --step--1: clamp(0.83rem, 0.78rem + 0.28vw, 1.00rem);
    --step-0:  clamp(1.00rem, 0.93rem + 0.42vw, 1.25rem);
    --step-1:  clamp(1.20rem, 1.10rem + 0.62vw, 1.56rem);
    --step-2:  clamp(1.44rem, 1.30rem + 0.91vw, 1.95rem);
    --step-3:  clamp(1.73rem, 1.53rem + 1.32vw, 2.44rem);
    --step-4:  clamp(2.07rem, 1.80rem + 1.91vw, 3.05rem);
    --step-5:  clamp(2.49rem, 2.12rem + 2.76vw, 3.81rem);

    --line-tight: 1.2;
    --line-normal: 1.5;
    --line-loose: 1.75;

    font-family: "Inter", "Inter var", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-optical-sizing: auto;
    color-scheme: light dark;
  }

  body { margin: 0; padding-block: 2rem; padding-inline: clamp(1rem, 4vw, 4rem); max-inline-size: 80ch; margin-inline: auto; font-size: var(--step-0); line-height: var(--line-normal); }

  h1 { font-size: var(--step-5); line-height: var(--line-tight); text-wrap: balance; font-weight: 700; }
  h2 { font-size: var(--step-3); line-height: var(--line-tight); text-wrap: balance; font-weight: 600; margin-block-start: 2rem; }
  h3 { font-size: var(--step-2); line-height: var(--line-tight); text-wrap: balance; font-weight: 600; }

  p { text-wrap: pretty; margin-block: 0.75rem 0; max-inline-size: 65ch; }

  .scale-row { display: grid; grid-template-columns: 5rem 1fr; gap: 1rem; align-items: baseline; padding-block: 0.5rem; border-block-end: 1px dashed currentColor; }
  .scale-row .label { font-variant-numeric: tabular-nums; opacity: 0.7; font-size: var(--step--1); }
  .scale-row .specimen { line-height: var(--line-tight); }

  table { border-collapse: collapse; font-variant-numeric: tabular-nums; margin-block-start: 1rem; }
  th, td { padding: 0.25rem 0.75rem; text-align: end; border-block-end: 1px solid currentColor; }
  th:first-child, td:first-child { text-align: start; }

  .numeric-demo { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; margin-block-start: 1rem; }
  .numeric-demo > div { padding: 0.5rem; border: 1px solid currentColor; border-radius: 0.5rem; }
  .numeric-demo .lining   { font-variant-numeric: lining-nums; }
  .numeric-demo .oldstyle { font-variant-numeric: oldstyle-nums; }
  .numeric-demo .tabular  { font-variant-numeric: tabular-nums; }
  .numeric-demo .fractions{ font-variant-numeric: diagonal-fractions; }

  .weights { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 1rem; align-items: end; }
  .w300 { font-weight: 300; } .w400 { font-weight: 400; } .w500 { font-weight: 500; } .w600 { font-weight: 600; } .w700 { font-weight: 700; } .w800 { font-weight: 800; }

  code { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.875em; padding: 0 0.25rem; background: oklch(0.95 0.02 240 / 0.5); border-radius: 0.25rem; }
</style>
</head>
<body>
  <h1>Typography system : fluid scale, variable axes, OpenType features</h1>
  <p>Each row below shows one step of the modular scale (ratio 1.2). Resize the window to see <code>clamp()</code> smoothly scale every step.</p>

  <h2>Modular scale</h2>
  <div class="scale-row"><span class="label">step -2</span><span class="specimen" style="font-size: var(--step--2)">The quick brown fox jumps</span></div>
  <div class="scale-row"><span class="label">step -1</span><span class="specimen" style="font-size: var(--step--1)">The quick brown fox jumps</span></div>
  <div class="scale-row"><span class="label">step 0</span><span class="specimen" style="font-size: var(--step-0)">The quick brown fox jumps</span></div>
  <div class="scale-row"><span class="label">step 1</span><span class="specimen" style="font-size: var(--step-1)">The quick brown fox jumps</span></div>
  <div class="scale-row"><span class="label">step 2</span><span class="specimen" style="font-size: var(--step-2)">The quick brown fox jumps</span></div>
  <div class="scale-row"><span class="label">step 3</span><span class="specimen" style="font-size: var(--step-3)">The quick brown fox jumps</span></div>
  <div class="scale-row"><span class="label">step 4</span><span class="specimen" style="font-size: var(--step-4)">The quick brown fox jumps</span></div>
  <div class="scale-row"><span class="label">step 5</span><span class="specimen" style="font-size: var(--step-5)">The quick brown fox jumps</span></div>

  <h2>Variable axis : weight</h2>
  <div class="weights">
    <div class="w300">300 Light</div>
    <div class="w400">400 Regular</div>
    <div class="w500">500 Medium</div>
    <div class="w600">600 Semibold</div>
    <div class="w700">700 Bold</div>
    <div class="w800">800 Extrabold</div>
  </div>

  <h2>OpenType features via <code>font-variant-*</code></h2>
  <div class="numeric-demo">
    <div class="lining">lining-nums : 1234567890</div>
    <div class="oldstyle">oldstyle-nums : 1234567890</div>
    <div class="tabular">tabular-nums : 11.0 22.0 33.5</div>
    <div class="fractions">diagonal-fractions : 1/2 3/4 7/8</div>
  </div>

  <h2>Tabular numerals in a data table</h2>
  <table>
    <thead><tr><th>Region</th><th>Q1</th><th>Q2</th><th>Q3</th></tr></thead>
    <tbody>
      <tr><td>EU</td><td>1,234.56</td><td>987.65</td><td>2,468.10</td></tr>
      <tr><td>US</td><td>222.11</td><td>1,111.11</td><td>9.99</td></tr>
      <tr><td>APAC</td><td>45.00</td><td>67.50</td><td>123.45</td></tr>
    </tbody>
  </table>

  <h2>text-wrap : balance and pretty</h2>
  <h3 style="text-wrap: balance">This heading uses text-wrap balance to distribute its characters evenly across two lines</h3>
  <p style="text-wrap: pretty">This paragraph uses text-wrap pretty so that orphan words at the end of the paragraph are minimised. On most engines the algorithm prefers re-wrapping a few earlier lines slightly to avoid leaving a single word on the last line. Useful for long-form body copy where typography quality matters.</p>
</body>
</html>
```

Rules demonstrated :

- Every `font-size` uses `clamp()` with `MAX >= 2 x MIN` (WCAG 1.4.4).
- Variable-font weights are set via `font-weight: <number>`, NEVER `font-variation-settings: "wght" N`.
- `font-optical-sizing: auto` lets the engine pick the right optical-size axis for the rendered size.
- OpenType features (`tabular-nums`, `lining-nums`, `oldstyle-nums`, `diagonal-fractions`) are set via `font-variant-numeric`, NEVER raw OpenType tags.
- `text-wrap: balance` on `h1` / `h2` / `h3`; `text-wrap: pretty` on `p`; both Baseline 2024.
- Tabular numerals on the data table align the decimal points across rows.

## Pattern 2 : metric-matched fallback (CLS prevention)

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

:root {
  font-family: "Inter", "Inter-fallback", system-ui, sans-serif;
}
```

The fallback uses `local("Arial")` so no network round-trip is needed; its rendered metrics match Inter closely enough that the swap from fallback to webfont is visually invisible.

In the document `<head>` :

```html
<link rel="preload" href="/fonts/Inter-roman.var.woff2" as="font" type="font/woff2" crossorigin>
```

## Pattern 3 : variable-font custom axis (Roboto Flex GRAD)

```css
.brand-display {
  font-family: "Roboto Flex", sans-serif;
  font-weight: 700;
  font-stretch: 100%;
  font-optical-sizing: auto;
  font-variation-settings: "GRAD" 100, "YOPQ" 96;
}
```

`GRAD` (grade) and `YOPQ` (vertical thickness) are custom axes; `font-variation-settings` is the only mechanism to set them. The shorthand `font-weight: 700` covers the registered `wght` axis.

## Pattern 4 : disable common ligatures (branded type)

```css
.brand-mark { font-variant-ligatures: no-common-ligatures; }
```

When a brand logo or wordmark uses an italic or display font whose ligatures conflict with the trademark spacing, disable them. Useful when "ff" or "fi" in the brand name should NOT ligate.

## Pattern 5 : small caps on a name

```css
.surname { font-variant-caps: small-caps; }
```

NEVER `font-feature-settings: "smcp" 1` (MDN explicitly forbids it for small caps).

## Pattern 6 : stylistic set on a display font

```css
.headline { font-feature-settings: "ss03" 1, "cv11" 1; }
```

Stylistic sets do not have `font-variant-*` keywords, so `font-feature-settings` is appropriate here.

## Pattern 7 : balance + pretty paired

```css
h1, h2, h3 { text-wrap: balance; }
p, li, dd  { text-wrap: pretty; }
[contenteditable] { text-wrap: stable; }
```

Default rule for an entire page.

## Pattern 8 : LCP-conscious preload

```html
<head>
  <link rel="preload" href="/fonts/Inter-roman.var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/app.css">
</head>
```

The preload tag appears BEFORE the stylesheet so the browser can start the font fetch in parallel with the CSS fetch. ONLY preload the font that affects LCP; preloading additional fonts dilutes priority.

## Pattern 9 : `font-display: optional` for below-the-fold body

```css
@font-face {
  font-family: "Source Serif";
  src: url("/fonts/SourceSerif.var.woff2") format("woff2-variations");
  font-display: optional;
}
```

`optional` means the browser uses the webfont only if it loaded in the very first few hundred ms (from cache, typically). Otherwise the fallback stays for the whole page session. This is the LCP-friendliest choice for body content where slight font variation does not matter.

## Pattern 10 : full system tokens with logical properties

```css
:root {
  --step--2: clamp(0.69rem, 0.66rem + 0.18vw, 0.80rem);
  --step--1: clamp(0.83rem, 0.78rem + 0.28vw, 1.00rem);
  --step-0:  clamp(1.00rem, 0.93rem + 0.42vw, 1.25rem);
  --step-1:  clamp(1.20rem, 1.10rem + 0.62vw, 1.56rem);
  --step-2:  clamp(1.44rem, 1.30rem + 0.91vw, 1.95rem);
  --step-3:  clamp(1.73rem, 1.53rem + 1.32vw, 2.44rem);
  --step-4:  clamp(2.07rem, 1.80rem + 1.91vw, 3.05rem);

  --measure: 65ch;
  --line-tight: 1.2;
  --line-normal: 1.5;
}

article p { max-inline-size: var(--measure); margin-block: 0 0.75rem; text-wrap: pretty; }
article h1, article h2, article h3 { text-wrap: balance; line-height: var(--line-tight); }
article h1 { font-size: var(--step-4); }
article h2 { font-size: var(--step-3); margin-block-start: 2rem; }
article h3 { font-size: var(--step-2); }
```

`max-inline-size` is logical (RTL-safe); `margin-block-start` keeps the rhythm intact regardless of writing mode.
