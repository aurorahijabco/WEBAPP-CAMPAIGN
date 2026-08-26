# References : Layout Pitfalls Examples

Before / after snippets for the canonical bugs. Each example pairs the broken code with the corrected version, plus the DevTools signal that reveals the bug.

## 1. Flex Child Overflow : `min-width: 0` fix

### Before : long text pushes container wider

```css
.row { display: flex; gap: 1rem; padding: 1rem; }
.col {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

```html
<div class="row">
  <div class="col">Short</div>
  <div class="col">A very long string that should be truncated with ellipsis but instead expands</div>
</div>
```

Symptom : the long-string column expands past its share; the row scrolls horizontally; `text-overflow: ellipsis` never fires because `overflow: hidden` is on a container that is wider than its parent. DevTools : Computed shows `min-width: 0` is actually `min-content`.

### After : add `min-inline-size: 0` on the child

```css
.col {
  flex: 1;
  min-inline-size: 0;       /* THE FIX */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

The override lifts the `min-content` floor, allowing the column to shrink below the longest word; `overflow: hidden` then clips and `text-overflow: ellipsis` shows.

## 2. Grid `1fr` Not Equal : `minmax(0, 1fr)` fix

### Before

```css
.row-bad { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
.row-bad > * { padding: 1rem; border: 1px solid; overflow: hidden; }
```

```html
<div class="row-bad">
  <div>A</div>
  <div>Bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb</div>
  <div>C</div>
</div>
```

Symptom : middle column is wider than the other two even though all three should be equal. Hovering each column in DevTools : the middle's grid-track shows a higher computed width.

### After

```css
.row-good {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}
```

All three tracks share leftover space exactly equally. The long-word column truncates inside its track.

## 3. `position: sticky` Not Sticking

### Before : sticky inside an `overflow: hidden` ancestor

```css
.app { overflow: hidden; }       /* PROBLEM : breaks sticky descendants */
.app .panel { padding: 1rem; }
.panel .nav { position: sticky; top: 0; }
```

```html
<div class="app">
  <div class="panel">
    <nav class="nav">Sticky nav (does nothing)</nav>
    <article>... long content scrolling ...</article>
  </div>
</div>
```

Symptom : `.nav` never sticks. Scrolling the page moves it with the content. DevTools Computed : `position: sticky` resolved, `top: 0` resolved, but no behavior.

### After : remove the ancestor `overflow` (or move sticky to the scroll root)

```css
.app { /* no overflow: hidden */ }
.panel .nav {
  position: sticky;
  inset-block-start: 0;
  background: var(--surface);
  z-index: 10;
}
```

For the sticky element to stick, NO ancestor between it and the actual scroll root may have `overflow: hidden | auto | scroll | clip` unless that ancestor IS the scrolling container with a defined height.

### Alternative : make the panel the scrolling container

```css
.panel { overflow-y: auto; block-size: 100vh; }
.panel .nav { position: sticky; inset-block-start: 0; }
```

Now the `.panel` is itself scrollable; `.nav` sticks to the top of `.panel`'s scroll area.

## 4. Mobile Viewport : `100vh` -> `100dvh`

### Before

```css
.hero {
  block-size: 100vh;
  background: url(hero.webp) center / cover;
}
```

Symptom on iOS Safari : the hero extends below the visible viewport by the height of the bottom toolbar. User must scroll to see the full image.

### After

```css
.hero {
  block-size: 100dvh;        /* dynamic : tracks the visible viewport */
  background: url(hero.webp) center / cover;
}

/* Or, for cases where the visible-when-toolbar-shown size matters : */
.modal-fullscreen { block-size: 100svh; }
```

`100dvh` updates as the chrome shows / hides. `100svh` is the static guarantee for "always fits with chrome visible." `100lvh` is the maximum (chrome hidden).

## 5. Z-Index Trapped in a Stacking Context

### Before

```css
.parent { transform: translateZ(0); }   /* creates stacking context */
.parent .child { z-index: 9999; }
.sibling-of-parent { z-index: 1; }
```

Symptom : `.child` cannot overlap `.sibling-of-parent` even with `z-index: 9999`. The child is trapped inside the parent's stacking context.

### After (Option A) : raise the parent's z-index

```css
.parent { transform: translateZ(0); z-index: 10; position: relative; }
.parent .child { z-index: 9999; }
.sibling-of-parent { z-index: 1; }
```

### After (Option B) : remove the unnecessary `transform`

If `transform` is not actually needed, removing it removes the stacking context and the child's z-index works freely.

### After (Option C) : isolate intentionally

```css
.layer-root { isolation: isolate; }
```

Explicitly scope z-index inside `.layer-root` without side effects on layout, paint, or rendering.

## 6. Long URL Breaks the Card

### Before

```css
.card { padding: 1rem; border-radius: 12px; max-inline-size: 24rem; }
```

```html
<div class="card">
  https://example.com/long-but-real-url-that-keeps-going-without-spaces-and-blows-the-card
</div>
```

Symptom : the card expands wider than `max-inline-size: 24rem` because the unbreakable URL overflows. On mobile, the entire viewport scrolls horizontally.

### After

```css
.card {
  padding: 1rem;
  border-radius: 12px;
  max-inline-size: 24rem;
  overflow-wrap: anywhere;    /* THE FIX */
}
```

`overflow-wrap: anywhere` lets the browser break inside the URL at any character. The card stays at its max-inline-size; the URL wraps to multiple lines.

## 7. Margin Collapse Surprise

### Before

```css
section { background: lavender; margin-block: 0; }
section > h2 { margin-block-start: 2rem; }
```

Symptom : the `<h2>`'s top margin appears OUTSIDE the section (the lavender background does not include the gap above the heading). This is correct CSS but often surprising.

### After (intent : keep the margin inside the section)

```css
section {
  background: lavender;
  margin-block: 0;
  padding-block-start: 1px;          /* OR */
  /* display: flow-root; */          /* preferred modern */
  /* display: flex; flex-direction: column; */
}
```

`display: flow-root` is the modern, side-effect-free way to create a Block Formatting Context that prevents margin collapse between parent and first child.

## 8. Subgrid Implicit-Row Limitation

### Symptom

```css
.outer {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.inner {
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;       /* PROBLEM if you need implicit rows */
  grid-column: span 3;
}
```

When `.inner` has more rows than the parent declared, subgrid CANNOT generate implicit rows. Items overflow into unaligned cells.

### Fix : column-only subgrid

```css
.inner {
  display: grid;
  grid-template-columns: subgrid;    /* subgrid only on the column axis */
  grid-column: span 3;
  /* implicit rows generated as needed */
}
```

Use subgrid for column alignment with the outer; let row sizing be implicit.

## 9. Combined : the canonical reset block

```css
/* Drop this at the top of every modern stylesheet. */

*, *::before, *::after { box-sizing: border-box; }

html, body { margin: 0; }

body {
  min-block-size: 100dvh;          /* mobile-safe full height */
  font-family: system-ui, sans-serif;
  overflow-wrap: break-word;       /* card-safe text */
}

img, picture, video, canvas, svg {
  display: block;
  max-inline-size: 100%;
}

input, button, textarea, select { font: inherit; }

:where(p, h1, h2, h3, h4, h5, h6) { overflow-wrap: anywhere; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Most layout pitfalls disappear with the right reset block and disciplined use of `minmax(0, 1fr)` + `min-inline-size: 0` + `100dvh` + `overflow-wrap: anywhere`.
