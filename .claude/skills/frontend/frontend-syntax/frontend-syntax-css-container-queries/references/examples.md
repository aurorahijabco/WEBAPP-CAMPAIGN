# Examples : Frontend Syntax CSS Container Queries

Framework-agnostic patterns. Each example is self-contained and verified against [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19).

## Example : card grid that switches layout per card (renderable)

Save the file below as `card-grid.html` and open it in a browser. Resize the window. Each card switches independently from vertical to horizontal layout when ITS OWN width crosses 400 pixels. A card in a narrow column stays vertical; a card in a wide column rearranges horizontally.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Container queries card grid</title>
  <style>
    body {
      margin: 0;
      padding: 1.5rem;
      font-family: system-ui, sans-serif;
      background: #f4f4f5;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
      gap: 1rem;
    }

    .card {
      container-type: inline-size;
      container-name: card;
      background: white;
      border-radius: 0.75rem;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }

    .card-inner {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .card-thumb {
      aspect-ratio: 4 / 3;
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      border-radius: 0.5rem;
    }

    .card-title {
      font-size: clamp(1rem, 4cqi, 1.5rem);
      margin: 0;
    }

    .card-body {
      font-size: clamp(0.875rem, 3cqi, 1rem);
      color: #52525b;
      margin: 0;
    }

    @container card (width > 400px) {
      .card-inner {
        grid-template-columns: 9rem 1fr;
        align-items: center;
      }
      .card-thumb {
        aspect-ratio: 1 / 1;
      }
    }
  </style>
</head>
<body>
  <main class="grid">
    <article class="card">
      <div class="card-inner">
        <div class="card-thumb"></div>
        <h2 class="card-title">First card</h2>
        <p class="card-body">Each card decides its own layout based on its own width.</p>
      </div>
    </article>
    <article class="card">
      <div class="card-inner">
        <div class="card-thumb"></div>
        <h2 class="card-title">Second card</h2>
        <p class="card-body">No media query reads the viewport. The container query reads the card.</p>
      </div>
    </article>
    <article class="card">
      <div class="card-inner">
        <div class="card-thumb"></div>
        <h2 class="card-title">Third card</h2>
        <p class="card-body">Type and gap scale with cqi units, clamped for readability.</p>
      </div>
    </article>
  </main>
</body>
</html>
```

Key parts:

- `.card { container-type: inline-size; container-name: card; }` sets up the containment context per card.
- `@container card (width > 400px) { ... }` switches the inner grid from a single column to a two-column layout once the card is wider than 400 pixels.
- `clamp(1rem, 4cqi, 1.5rem)` scales the title relative to the card width, clamped between 1rem and 1.5rem.

## Example : container shorthand

```css
.layout { container: layout / inline-size; }
.card { container: card / inline-size; }

@container card (width > 400px) {
  .card { display: grid; grid-template-columns: 8rem 1fr; gap: 1rem; }
}
```

The shorthand keeps name and type together. ALWAYS prefer the shorthand when both are set.

## Example : anonymous container query

When only one container ancestor is in play, omit the name:

```css
.panel { container-type: inline-size; }

@container (width > 600px) {
  .panel-title { font-size: 1.5rem; }
}
```

The query matches the nearest ancestor with any `container-type`. If multiple containers nest, the innermost matching one wins; name the container to disambiguate.

## Example : named container, multiple containment levels

```css
.layout { container: layout / inline-size; }
.card { container: card / inline-size; }

/* Style the .card meta row based on the OUTER layout width, not the card width. */
@container layout (width > 900px) {
  .card .meta { display: inline-flex; gap: 0.5rem; }
}

/* Style the .card itself based on its OWN width. */
@container card (width > 400px) {
  .card { display: grid; grid-template-columns: 8rem 1fr; }
}
```

Without names, both queries would match the nearest container only (`.card`), and the layout-level rule would never fire.

## Example : style container query, gated

```css
.surface { container-type: normal; }
.surface[data-theme="dark"] { --theme: dark; }
.surface[data-theme="light"] { --theme: light; }

@supports (container-type: normal) {
  @container style(--theme: dark) {
    .card { background: #18181b; color: #fafafa; }
  }
  @container style(--theme: light) {
    .card { background: #ffffff; color: #18181b; }
  }
}
```

The `@supports (container-type: normal)` gate prevents the style query from being parsed on browsers without Baseline 2025 support. The gate is conservative: most browsers that support `container-type: normal` also support style queries; the few that do not will simply skip the block.

For numeric comparisons (`style(--scale > 1)`), register the property first:

```css
@property --scale {
  syntax: "<number>";
  inherits: true;
  initial-value: 1;
}

@container style(--scale > 1.25) {
  .card { padding: 1.5rem; }
}
```

## Example : container query units in typography

```css
.section {
  container-type: inline-size;
  padding-inline: clamp(1rem, 4cqi, 2rem);
  padding-block: clamp(1rem, 6cqi, 3rem);
}

.section h2 {
  font-size: clamp(1.25rem, 5cqi, 2.5rem);
  line-height: 1.2;
}

.section p {
  font-size: clamp(0.95rem, 3cqi, 1.125rem);
  max-width: 60ch;
}
```

`cqi` lets typography scale with the section's own inline size. The `clamp()` floors and ceilings prevent extreme values at small and large widths.

## Example : container query plus container query unit, fallback diagnosis

The following CSS will silently fall back to viewport units if the parent has no `container-type`. To diagnose, inspect the resolved value in DevTools.

```css
/* BROKEN: no container-type on a parent, so cqi falls back to svi (small viewport). */
.broken h2 {
  font-size: 5cqi; /* resolves to 5svi, often huge */
}

/* FIXED: add container-type on the wrapper. */
.fixed-wrapper { container-type: inline-size; }
.fixed-wrapper h2 {
  font-size: 5cqi; /* now 5% of the wrapper's inline size */
}
```

## Example : combining container queries with `content-visibility`

```css
.feed {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 1rem;
}

.feed-item {
  container-type: inline-size;
  contain: content;
  content-visibility: auto;
  contain-intrinsic-size: 16rem 20rem;
}

@container (width > 360px) {
  .feed-item {
    display: grid;
    grid-template-columns: 8rem 1fr;
    gap: 0.75rem;
  }
}
```

`container-type: inline-size` already creates layout containment; combining with `content-visibility: auto` plus `contain-intrinsic-size` lets the browser skip rendering offscreen items entirely. See `[[frontend-perf-animation-gpu-containment]]`.

## Example : when a media query is the right answer

```css
/* Page-level layout: sidebar collapses to drawer below 64rem viewport. */
@media (width < 64rem) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    display: none;
  }
}
```

The whole page reorganises. Use a media query, NOT a container query, when the viewport itself is the right unit.
