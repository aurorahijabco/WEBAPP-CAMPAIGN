# Examples : responsive layout + fluid sizing

Working snippets. All CSS verified against [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (verified 2026-05-19), [MDN: viewport-percentage lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19), [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19), [MDN: aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) (verified 2026-05-19), [MDN: CSS Logical Properties and Values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19).

## Pattern 1 : renderable demo (fluid hero + responsive grid + container-queried card)

Save as `responsive.html` and resize the browser window AND the cards' grid columns to see fluid behavior.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Fluid responsive demo</title>
<style>
  :root {
    --step-0: clamp(1rem, 0.875rem + 0.25vw, 1.125rem);
    --step-1: clamp(1.125rem, 0.95rem + 0.5vw, 1.375rem);
    --step-2: clamp(1.5rem, 1rem + 1.5vw, 2rem);
    --step-3: clamp(2rem, 1.25rem + 2.5vw, 3rem);
    --step-4: clamp(2.5rem, 1.5rem + 4vw, 4.5rem);

    --pad: clamp(1rem, 2vw, 2rem);
  }

  html { color-scheme: light dark; font-family: system-ui, sans-serif; font-size: var(--step-0); }
  body { margin: 0; }

  .hero {
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding-block: var(--pad);
    padding-inline: var(--pad);
    text-align: center;
    background: linear-gradient(in oklch 180deg, oklch(0.95 0.05 240), oklch(0.88 0.05 280));
  }
  .hero h1 { font-size: var(--step-4); margin-block: 0 0.5rem; }
  .hero p  { font-size: var(--step-1); max-inline-size: 60ch; margin-inline: auto; }

  main { padding-block: 2rem; padding-inline: var(--pad); max-inline-size: 80rem; margin-inline: auto; }
  main h2 { font-size: var(--step-3); margin-block-end: 1rem; }

  .grid { display: grid; gap: var(--pad); grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); }

  .slot { container-type: inline-size; }

  .card {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
    border-radius: 0.75rem;
    background: oklch(1 0 0);
    box-shadow: 0 2px 12px oklch(0 0 0 / 0.06);
  }
  .card-media {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 0.5rem;
    background: linear-gradient(in oklch 135deg, oklch(0.72 0.18 250), oklch(0.78 0.18 320));
  }
  .card-body h3 { font-size: var(--step-2); margin-block: 0 0.5rem; }
  .card-body p  { font-size: var(--step-0); margin-block: 0; color: oklch(0.4 0 0); }

  /* Container-queried card layout : when the SLOT is at least 28rem wide,
     the card switches to a horizontal media+body layout. Independent of viewport. */
  @container (min-width: 28rem) {
    .card { grid-template-columns: 12rem 1fr; align-items: start; }
    .card-media { aspect-ratio: 4 / 3; }
  }

  @media (prefers-reduced-motion: no-preference) {
    .card { transition: transform 200ms ease; }
    .card:hover { transform: translateY(-2px); }
  }
</style>
</head>
<body>
  <section class="hero">
    <div>
      <h1>Fluid by default</h1>
      <p>Type and space scale continuously between viewports. No breakpoint cliffs. Each card decides its own layout based on its slot width.</p>
    </div>
  </section>
  <main>
    <h2>Articles</h2>
    <div class="grid">
      <div class="slot"><article class="card"><div class="card-media"></div><div class="card-body"><h3>Container query example</h3><p>This card flips between vertical and horizontal layout based on the width of its container, not the viewport.</p></div></article></div>
      <div class="slot"><article class="card"><div class="card-media"></div><div class="card-body"><h3>Fluid typography</h3><p>Headings and body text scale with clamp() between min and max bounds.</p></div></article></div>
      <div class="slot"><article class="card"><div class="card-media"></div><div class="card-body"><h3>100svh hero</h3><p>Safe on iOS Safari: never clips behind the URL bar.</p></div></article></div>
      <div class="slot"><article class="card"><div class="card-media"></div><div class="card-body"><h3>Logical properties</h3><p>padding-inline and margin-inline-start work correctly in RTL.</p></div></article></div>
    </div>
  </main>
</body>
</html>
```

Rules demonstrated :

- The hero uses `100svh` so it does NOT clip behind the iOS URL bar.
- Type sizes use `clamp()` with `MAX >= 2 x MIN` (WCAG 1.4.4 safe).
- The grid uses `repeat(auto-fit, minmax(20rem, 1fr))` so column count is fluid.
- Each card sits inside a `container-type: inline-size` slot; the `@container (min-width: 28rem)` rule switches the card to a horizontal layout based on slot width, NOT viewport width. Resize the window to see the slot widths change, and resize past the column-collapse points to see the cards reach 28rem and flip.
- Logical properties (`padding-inline`, `margin-inline-end`, `max-inline-size`) keep the layout RTL-safe.
- Hover transition is gated behind `prefers-reduced-motion: no-preference`.

## Pattern 2 : fluid spacing scale

```css
:root {
  --space-1: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
  --space-2: clamp(0.5rem,  0.4rem + 0.5vw,  1rem);
  --space-3: clamp(1rem,    0.8rem + 1vw,    2rem);
  --space-4: clamp(2rem,    1.6rem + 2vw,    4rem);
}

.stack > * + * { margin-block-start: var(--space-3); }
.section       { padding-block: var(--space-4); }
```

## Pattern 3 : 100svh hero with logical padding

```css
.hero {
  min-block-size: 100svh;
  padding-block: clamp(2rem, 4vw, 4rem);
  padding-inline: clamp(1rem, 4vw, 4rem);
  display: grid;
  place-items: center;
  text-align: start;
}
```

`min-block-size` is the logical version of `min-height`; combined with `100svh` it never clips behind mobile chrome. `place-items: center` centres on both axes via Grid.

## Pattern 4 : aspect-ratio media card

```css
.media { inline-size: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 0.5rem; }
.media > img { inline-size: 100%; block-size: 100%; object-fit: cover; display: block; }
```

## Pattern 5 : auto-fit vs auto-fill side by side

```css
.fill { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); }
.fit  { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit,  minmax(16rem, 1fr)); }
```

`auto-fill` reserves empty tracks for "missing" cards; `auto-fit` collapses empty tracks so existing cards stretch to fill the row width. Pick based on whether empty space should be reserved or absorbed.

## Pattern 6 : flex prose row with `min-width: 0`

```css
.row { display: flex; gap: 1rem; align-items: start; }
.row > * { min-inline-size: 0; }
.row > .grow { flex: 1; }
```

Without `min-inline-size: 0` (or the physical `min-width: 0`), flex children inherit `min-width: auto` which resolves to `min-content`; long URLs and unbreakable tokens then inflate the child past its `flex` allocation and overflow the container.

## Pattern 7 : style container query for theme

```css
.theme-light { --theme: light; container-type: normal; container-name: theme; }
.theme-dark  { --theme: dark;  container-type: normal; container-name: theme; }

@container theme style(--theme: dark) {
  .card { background: oklch(0.2 0.02 240); color: oklch(0.95 0.02 240); }
}
```

Style container queries do not require a size containment; `container-type: normal` is sufficient.

## Pattern 8 : intrinsic typography max for prose

```css
.prose {
  inline-size: min(100% - 2rem, 65ch);
  margin-inline: auto;
}
```

The prose column is at most 65 characters (`ch` unit, the width of the "0" glyph in the current font), but never wider than the viewport minus 2rem of gutter. No media queries needed.

## Pattern 9 : container-queried navigation

```css
nav { container-type: inline-size; }
nav > ul { list-style: none; display: grid; gap: 0.5rem; padding: 0; margin: 0; }

@container (min-width: 40rem) {
  nav > ul { grid-auto-flow: column; grid-auto-columns: max-content; }
}
```

Below 40rem, the nav stacks vertically; above 40rem, it lays out horizontally. The decision is based on the nav's OWN slot width, not the viewport.

## Pattern 10 : RTL-safe toolbar with logical floats

```css
.toolbar {
  display: flex; gap: 0.5rem;
  padding-block: 0.5rem; padding-inline: 1rem;
  border-block-end: 1px solid oklch(0.85 0 0);
}
.toolbar .actions { margin-inline-start: auto; }
```

In LTR the actions cluster floats right; in RTL it floats left. No CSS change needed for RTL.
