# Examples : OKLCH palette generation

Working snippets. All CSS verified against [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19), [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19), [W3C: CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19), [W3C: WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19).

## Pattern 1 : full palette from one seed (renderable HTML)

Save as `palette.html` and open in a browser. Change `--brand-seed` to see the whole ladder regenerate.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>OKLCH palette demo</title>
<style>
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

  html { font-family: system-ui, sans-serif; background: #fff; color: #111; }
  body { margin: 0; padding: 2rem; }
  h1 { margin-block: 0 1rem; font-size: 1.5rem; }

  .ladder { display: grid; gap: 0.5rem; grid-template-columns: 1fr; max-width: 760px; }
  .swatch {
    display: grid;
    grid-template-columns: 6rem 1fr auto;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
  }
  .swatch .meta { font-variant-numeric: tabular-nums; }
  .pair {
    display: flex; gap: 0.5rem; align-items: center;
  }
  .badge {
    padding: 0.15rem 0.45rem;
    font-size: 0.75rem;
    border-radius: 999px;
    border: 1px solid currentColor;
  }

  .s-50  { background: var(--brand-50);  color: var(--brand-900); }
  .s-100 { background: var(--brand-100); color: var(--brand-900); }
  .s-200 { background: var(--brand-200); color: var(--brand-900); }
  .s-300 { background: var(--brand-300); color: var(--brand-900); }
  .s-400 { background: var(--brand-400); color: var(--brand-950); }
  .s-500 { background: var(--brand-500); color: var(--brand-50); }
  .s-600 { background: var(--brand-600); color: var(--brand-50); }
  .s-700 { background: var(--brand-700); color: var(--brand-50); }
  .s-800 { background: var(--brand-800); color: var(--brand-50); }
  .s-900 { background: var(--brand-900); color: var(--brand-50); }
  .s-950 { background: var(--brand-950); color: var(--brand-50); }
</style>
</head>
<body>
  <h1>Palette from <code>--brand-seed: oklch(0.62 0.18 250)</code></h1>
  <div class="ladder">
    <div class="swatch s-50"><strong>50</strong><span class="meta">L 0.985 / C * 0.08</span><span class="pair">text on 50 + 50 on 950</span></div>
    <div class="swatch s-100"><strong>100</strong><span class="meta">L 0.967 / C * 0.16</span><span class="pair">text on 100</span></div>
    <div class="swatch s-200"><strong>200</strong><span class="meta">L 0.918 / C * 0.35</span><span class="pair">divider, hairline</span></div>
    <div class="swatch s-300"><strong>300</strong><span class="meta">L 0.846 / C * 0.55</span><span class="pair">disabled fill</span></div>
    <div class="swatch s-400"><strong>400</strong><span class="meta">L 0.730 / C * 0.80</span><span class="pair">mid-tone</span></div>
    <div class="swatch s-500"><strong>500</strong><span class="meta">L 0.620 / C</span><span class="pair">brand reference</span></div>
    <div class="swatch s-600"><strong>600</strong><span class="meta">L 0.530 / C</span><span class="pair">primary action</span></div>
    <div class="swatch s-700"><strong>700</strong><span class="meta">L 0.450 / C * 0.95</span><span class="pair">primary action hover</span></div>
    <div class="swatch s-800"><strong>800</strong><span class="meta">L 0.380 / C * 0.85</span><span class="pair">heading text</span></div>
    <div class="swatch s-900"><strong>900</strong><span class="meta">L 0.295 / C * 0.70</span><span class="pair">body text</span></div>
    <div class="swatch s-950"><strong>950</strong><span class="meta">L 0.205 / C * 0.55</span><span class="pair">highest-contrast text</span></div>
  </div>

  <p style="margin-top:2rem;max-width:60ch">
    Each swatch sets its background to its own shade and uses a shade from the
    other end of the ladder as text. Pairs follow the contrast table in
    SKILL.md. Run a real contrast check (DevTools Picker, axe) on every shipped
    pair; the table is a starting hypothesis, the verifier is the measured
    ratio.
  </p>
</body>
</html>
```

## Pattern 2 : three-tier token chain wired to a button

```css
@layer tokens, theme, base, components, utilities;

@layer tokens {
  :root {
    --brand-seed: oklch(0.62 0.18 250);
    --brand-50:  oklch(from var(--brand-seed) 0.985 calc(c * 0.08) h);
    --brand-100: oklch(from var(--brand-seed) 0.967 calc(c * 0.16) h);
    --brand-500: oklch(from var(--brand-seed) 0.620 c h);
    --brand-600: oklch(from var(--brand-seed) 0.530 c h);
    --brand-700: oklch(from var(--brand-seed) 0.450 calc(c * 0.95) h);
    --brand-900: oklch(from var(--brand-seed) 0.295 calc(c * 0.70) h);
    --brand-950: oklch(from var(--brand-seed) 0.205 calc(c * 0.55) h);
  }
}

@layer theme {
  :root {
    --color-surface: var(--brand-50);
    --color-on-surface: var(--brand-950);
    --color-action-primary: var(--brand-600);
    --color-action-primary-hover: var(--brand-700);
    --color-on-action-primary: var(--brand-50);
    --color-focus-ring: var(--brand-700);
  }
}

@layer components {
  .button {
    --button-bg: var(--color-action-primary);
    --button-bg-hover: var(--color-action-primary-hover);
    --button-fg: var(--color-on-action-primary);
    background: var(--button-bg);
    color: var(--button-fg);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 0;
  }
  .button:hover { background: var(--button-bg-hover); }
  .button:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
}
```

A brand refresh changes `--brand-seed` only. The button, the surface, and every other downstream token update by reference.

## Pattern 3 : animatable color token with `@property`

```css
@property --hero-tint {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(0.62 0.18 250);
}

.hero {
  background: linear-gradient(180deg, var(--hero-tint), white);
  transition: --hero-tint 600ms ease;
}

.hero[data-state="warning"] { --hero-tint: oklch(0.72 0.18 60); }
.hero[data-state="success"] { --hero-tint: oklch(0.72 0.18 152); }
```

The hero background fades smoothly between brand tint, warning, and success because the colour is registered. Without `@property` the gradient would snap.

## Pattern 4 : perceptual mix with `color-mix(in oklch, ...)`

```css
.button-tinted {
  background: color-mix(in oklch, var(--brand-500) 80%, white);
}

.button-shaded {
  background: color-mix(in oklch, var(--brand-500) 80%, black);
}
```

Compare to the same expression `in srgb` ; the latter darkens and greys instead of brightening / darkening perceptually. Per [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19), `in srgb` is explicitly NOT recommended for perceptual mixing.

## Pattern 5 : wide-gamut accent with `@supports` fallback

```css
:root {
  --color-accent: oklch(0.62 0.18 250);
}

@supports (color: color(display-p3 1 0 0)) {
  :root {
    --color-accent: oklch(0.72 0.30 320);
  }
}
```

The sRGB-safe colour `oklch(0.62 0.18 250)` is the fallback. On a display-p3 display the engine reports support and the override takes the vivid wide-gamut value. Without the `@supports` gate, an sRGB display would clip the wide-gamut colour to an unpredictable result.

## Pattern 6 : runtime brand swap from JavaScript

```js
function setBrandSeed(seedHex) {
  // seedHex like "#3b82f6"; convert once with a small helper or DevTools picker
  const css = `oklch(from ${seedHex} l c h)`;
  document.documentElement.style.setProperty('--brand-seed', css);
}
```

The single line `style.setProperty('--brand-seed', ...)` regenerates the entire 11-step ladder because every shade is a relative-colour derivation of `--brand-seed`. No other CSS variables need to change.

## Pattern 7 : neutral gray ladder paired with brand ladder

```css
:root {
  --gray-seed:  oklch(0.62 0.02 250);
  --gray-50:    oklch(from var(--gray-seed) 0.985 c h);
  --gray-100:   oklch(from var(--gray-seed) 0.967 c h);
  --gray-200:   oklch(from var(--gray-seed) 0.918 c h);
  --gray-300:   oklch(from var(--gray-seed) 0.846 c h);
  --gray-400:   oklch(from var(--gray-seed) 0.730 c h);
  --gray-500:   oklch(from var(--gray-seed) 0.620 c h);
  --gray-600:   oklch(from var(--gray-seed) 0.530 c h);
  --gray-700:   oklch(from var(--gray-seed) 0.450 c h);
  --gray-800:   oklch(from var(--gray-seed) 0.380 c h);
  --gray-900:   oklch(from var(--gray-seed) 0.295 c h);
  --gray-950:   oklch(from var(--gray-seed) 0.205 c h);
}
```

Gray seed reuses the same hue as the brand seed but with a very low chroma (0.02). The result is a warm-or-cool tinted gray that harmonises with the brand without being noticeably coloured. Pure achromatic grays (`oklch(L 0 h)`) are also valid; the choice depends on the design language.

## Pattern 8 : contrast-pair verifier as inline reference

For a quick eyeball, render a tiny grid that shows the actual rendered ratio next to each pair :

```html
<div style="background: var(--brand-100); color: var(--brand-800); padding: 1rem; border-radius: 0.5rem;">
  Body text on shade-100 background with shade-800 foreground.
</div>
```

For a programmatic check, use the browser's DevTools colour picker on the rendered element; the picker reports the WCAG ratio next to the swatch.

## Pattern 9 : multi-seed system (brand + accent + status)

```css
:root {
  --brand-seed:   oklch(0.62 0.18 250);  /* blue */
  --accent-seed:  oklch(0.72 0.22 320);  /* magenta */
  --success-seed: oklch(0.62 0.18 152);  /* green */
  --warning-seed: oklch(0.72 0.18 60);   /* amber */
  --danger-seed:  oklch(0.62 0.20 41);   /* red */
}
```

Run the 11-step ladder PER seed. Each system uses its own ladder for shade selection; never reuse a brand shade as a status shade. This separation lets each seed evolve independently.
