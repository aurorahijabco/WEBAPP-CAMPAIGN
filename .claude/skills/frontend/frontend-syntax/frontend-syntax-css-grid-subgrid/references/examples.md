# Examples : CSS Grid + Subgrid

Working snippets verified against [MDN: CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) (verified 2026-05-19) and [MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid) (verified 2026-05-19).

## Pattern 1 : card list with aligned baselines

Three columns; each card is a subgrid with three rows (title, body, meta). Titles align across cards even when card titles wrap to two lines.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Subgrid card list</title>
<style>
  :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
  body { margin: 2rem; }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    grid-template-rows: auto 1fr auto;
    gap: 1.5rem;
  }

  .card {
    display: grid;
    grid-row: span 3;
    grid-template-rows: subgrid;
    gap: 0.5rem;
    padding: 1rem;
    border: 1px solid currentColor;
    border-radius: 0.5rem;
  }

  .card > .title { grid-row: 1; font-weight: 600; }
  .card > .body  { grid-row: 2; }
  .card > .meta  { grid-row: 3; font-size: 0.875rem; opacity: 0.7; }
</style>
</head>
<body>
  <section class="cards">
    <article class="card">
      <h3 class="title">Short title</h3>
      <p class="body">First card body content.</p>
      <p class="meta">Published 2026-05-19</p>
    </article>
    <article class="card">
      <h3 class="title">A noticeably longer title that wraps to two lines</h3>
      <p class="body">Second card. Notice the title row height applies to all cards.</p>
      <p class="meta">Published 2026-05-19</p>
    </article>
    <article class="card">
      <h3 class="title">Medium title</h3>
      <p class="body">Third card body. The meta row at the bottom stays aligned with the other cards.</p>
      <p class="meta">Published 2026-05-19</p>
    </article>
  </section>
</body>
</html>
```

Why subgrid : without `grid-template-rows: subgrid` on the card, each card is its own grid context and the title heights do NOT align across cards.

## Pattern 2 : 12-track page grid with named lines

```css
.page {
  display: grid;
  grid-template-columns:
    [full-start]
    minmax(1rem, 1fr)
    [wide-start] minmax(0, 1fr) [wide-end]
    [content-start] minmax(0, 60ch) [content-end]
    [wide-2-start] minmax(0, 1fr) [wide-2-end]
    minmax(1rem, 1fr)
    [full-end];
  gap: 1rem;
}

.page > .figure   { grid-column: full-start / full-end; }    /* full-bleed image */
.page > .aside    { grid-column: wide-start / wide-end; }     /* narrow side note */
.page > .prose    { grid-column: content-start / content-end; }
.page > .gallery  { grid-column: wide-start / wide-2-end; }   /* wider than prose, narrower than full */
```

The `minmax(0, 1fr)` on the inner tracks prevents the `1fr` minimum from being raised to the content's intrinsic size, which is what makes long words and embedded media collapse the column rhythm.

## Pattern 3 : app shell with `grid-template-areas`

```html
<div class="shell">
  <header>brand</header>
  <nav>links</nav>
  <main>main content</main>
  <footer>footer</footer>
</div>
```

```css
.shell {
  display: grid;
  grid-template-columns: 16rem 1fr;
  grid-template-rows: 4rem 1fr 2rem;
  grid-template-areas:
    "head head"
    "side main"
    "foot foot";
  min-height: 100vh;
  gap: 0;
}
.shell > header { grid-area: head; }
.shell > nav    { grid-area: side; }
.shell > main   { grid-area: main; }
.shell > footer { grid-area: foot; }
```

Verified rule : named areas auto-generate `<name>-start` and `<name>-end` line names on both axes ([MDN: grid-template-areas](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas) (verified 2026-05-19)). A child of `main` can therefore target `main-start` / `main-end` for further nesting.

## Pattern 4 : responsive gallery (`auto-fit`)

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}
```

`auto-fit` collapses empty tail tracks at large widths; remaining items stretch to fill. Swap to `auto-fill` if the visible row should reserve space for missing items (e.g. a placeholder grid before data arrives).

## Pattern 5 : subgrid on columns only (variable inner row count)

```css
.outer {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.inner {
  grid-column: span 4;
  display: grid;
  grid-template-columns: subgrid;
  grid-auto-rows: minmax(2rem, auto);
  gap: inherit;
}
```

The inner grid inherits the four-column rhythm of the outer grid (and any named lines), but is free to generate as many implicit rows as needed because the row axis is NOT subgridded.

## Pattern 6 : masonry with `@supports` gate

Masonry is NOT Baseline in 2026. Default rule is a CSS Grid with `grid-auto-rows`; the masonry rule activates only where supported.

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  grid-auto-rows: 8rem;
  gap: 1rem;
}

@supports (grid-template-rows: masonry) {
  .gallery {
    grid-template-rows: masonry;
  }
}
```

Verified against [W3C: CSS Grid Layout Module Level 2](https://www.w3.org/TR/css-grid-2/) (verified 2026-05-19) : masonry is not part of the published surface and MUST be gated.

## Pattern 7 : named lines added on a subgrid

Parent line names pass through automatically; the subgrid adds extra local names.

```css
.outer {
  display: grid;
  grid-template-columns: [a] 1fr [b] 1fr [c] 1fr [d];
  gap: 1rem;
}
.inner {
  grid-column: a / d;
  display: grid;
  grid-template-columns: subgrid [m1] [m2] [m3] [m4];
}
.inner > .alpha { grid-column: a / b; }      /* parent name */
.inner > .beta  { grid-column: m2 / m4; }    /* subgrid-local name */
```

## Pattern 8 : `inline-grid` for inline-level grid containers

```css
.chip-set {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: 0.5rem;
  vertical-align: middle;
}
```

`display: inline-grid` keeps the container in the inline flow (so it sits inside running text or alongside other inline-level boxes) while still using the grid layout algorithm for its children.

## Pattern 9 : alignment with `place-items`

```css
.center-all {
  display: grid;
  place-items: center;       /* align-items: center; justify-items: center; */
  min-height: 100vh;
}
```

For per-item overrides, use `place-self` on the child :

```css
.center-all > .pinned-top { place-self: start center; }
```

## Pattern 10 : `dense` flow (use with care)

```css
.feed {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-flow: dense;
  gap: 1rem;
}
.feed > .wide { grid-column: span 2; }
```

`dense` packs items tightly by reordering placement of later items into earlier holes. Visual order then differs from DOM order, which means tab order and screen-reader order also differ from visual order. NEVER use `dense` for interactive item sequences (forms, navigation, lists where order conveys meaning). Acceptable for purely decorative gallery thumbnails.
