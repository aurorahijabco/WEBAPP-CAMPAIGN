# References : Layout Pitfalls Anti-Patterns

Seven common failure modes with symptom, diagnostic step, root cause, fix.

## Anti-Pattern 1 : `100vh` for full-viewport mobile hero

### Symptom
On iOS Safari and Android Chrome, the hero extends below the visible viewport by the height of the bottom toolbar. Users see only the top portion until they scroll. When the toolbar hides on scroll, layout jumps.

### Diagnostic step
Open the page on a mobile device. The full-viewport element overshoots. DevTools (mobile emulation) does NOT reliably reproduce this; test on a real device.

### Root cause
`100vh` is fixed at the initial viewport height computed at page load. It does NOT track dynamic browser chrome (toolbar showing or hiding). On mobile this means `100vh` is the LARGEST possible viewport, not the currently-visible one.

```css
/* WRONG */
.hero { block-size: 100vh; }
```

### Fix
Use `100dvh` (dynamic, tracks chrome) or `100svh` (static, smallest extent, guaranteed-fit even with chrome shown).

```css
/* CORRECT */
.hero { block-size: 100dvh; }
```

### Source
[MDN : viewport units](https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport-percentage_lengths).

## Anti-Pattern 2 : `flex: 1` child overflowing without `min-width: 0`

### Symptom
A flex container has children with `flex: 1` (or `flex: 1 1 0`). One child contains long text. The whole container expands wider than its parent, breaking the layout. `text-overflow: ellipsis` does not fire even though it is declared.

### Diagnostic step
DevTools : inspect the overflowing child. Computed `min-width` is `auto`, which resolves to `min-content` (the longest unbreakable word). Try setting `min-width: 0` in DevTools live; observe the overflow disappear.

### Root cause
Per the Flexbox spec, `min-width` defaults to `auto` for flex items, which resolves to `min-content`. The child refuses to shrink below the size of its longest unbreakable word, dragging the container open.

```css
/* WRONG */
.col { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
```

### Fix
Add `min-inline-size: 0` (or `min-width: 0`) to the flex child.

```css
/* CORRECT */
.col {
  flex: 1;
  min-inline-size: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Source
CSS Flexible Box Layout specification; behavior documented at [MDN : CSS flexible box layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout).

## Anti-Pattern 3 : `grid-template-columns: 1fr 1fr 1fr` columns uneven

### Symptom
Three columns declared as `1fr 1fr 1fr` are visibly different widths when one column contains long content. Equal split was the intent; the result is unequal.

### Diagnostic step
DevTools Grid overlay : track sizes show one column wider than the others. Hover the track in the Grid panel to see its computed size.

### Root cause
`1fr` is shorthand for `minmax(auto, 1fr)`. The `auto` minimum equals `min-content`. A track with long unbreakable content refuses to shrink below its longest word, taking more space than its `1fr` share.

```css
/* WRONG */
.row { display: grid; grid-template-columns: 1fr 1fr 1fr; }
```

### Fix
Use `minmax(0, 1fr)` for each track to force equal split regardless of content.

```css
/* CORRECT */
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  /* Or, equivalently, repeat() */
  /* grid-template-columns: repeat(3, minmax(0, 1fr)); */
}
```

### Source
CSS Grid Layout specification; behavior documented at [MDN : CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout).

## Anti-Pattern 4 : `position: sticky` inside `overflow: hidden` ancestor

### Symptom
`position: sticky` element does NOTHING. Scrolling the page moves the element with the content instead of pinning it. DevTools confirms `position: sticky` is computed.

### Diagnostic step
Walk the ancestor chain from the sticky element up to the body. Inspect `overflow` on each. If any ancestor (other than the actual scrolling container) has `overflow: hidden`, `auto`, `scroll`, or `clip`, sticky is broken.

### Root cause
Per the CSS Positioning spec, `position: sticky` finds the nearest scrolling ancestor. If a non-scrolling ancestor has `overflow: hidden | auto | scroll | clip`, that ancestor is treated as the scroll root, but it does not actually scroll (because content fits), so sticky has no scroll context to pin against.

```css
/* WRONG : overflow on app root breaks all sticky descendants */
.app { overflow: hidden; }
.nav { position: sticky; top: 0; }
```

### Fix
Remove the ancestor `overflow: hidden`, OR restructure so the scrolling container is explicit (with defined height + `overflow: auto`), OR move the sticky element out of the overflow-clipped subtree.

```css
/* CORRECT */
.app { /* no overflow */ }
.nav { position: sticky; inset-block-start: 0; }
```

### Source
[MDN : position](https://developer.mozilla.org/en-US/docs/Web/CSS/position).

## Anti-Pattern 5 : `z-index` ignored across stacking contexts

### Symptom
A child element with `z-index: 9999` cannot overlap a sibling of its parent with `z-index: 1`. Raising the child's z-index further has no effect.

### Diagnostic step
DevTools 3D View (Edge / Chrome) or Layers panel : observe that the parent of the high-z-index child has its own stacking context (transform, opacity, filter, position fixed/sticky, etc.). The child is trapped inside that context.

### Root cause
`z-index` only orders elements WITHIN the same stacking context. A child cannot escape its parent's stacking context. The parent creates a context when it has `position` non-static with `z-index` non-auto, `opacity < 1`, `transform`, `filter`, `mix-blend-mode`, `clip-path`, `will-change`, `isolation: isolate`, or `contain: layout | paint | strict | content`.

```css
/* WRONG : transform on parent traps child z-index */
.parent { transform: translateZ(0); }
.parent .child { z-index: 9999; }
.sibling { z-index: 1; }   /* still on top of .child */
```

### Fix
Either remove the unnecessary stacking-context-creating property on the parent, OR raise the parent's own z-index to win at its level, OR explicitly isolate via `isolation: isolate` on a wrapper to scope z-index intentionally.

```css
/* CORRECT */
.parent { transform: translateZ(0); position: relative; z-index: 10; }
.parent .child { z-index: 9999; }
.sibling { z-index: 1; }
```

### Source
CSS 2.1 stacking-context appendix; modern reference at [MDN : CSS positioning - stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context).

## Anti-Pattern 6 : Subgrid on row axis with implicit rows needed

### Symptom
A subgrid component overflows its declared rows. Items beyond the parent's declared rows render in unaligned cells. The subgrid does not generate the implicit tracks that a regular grid would.

### Diagnostic step
DevTools Grid overlay : the subgrid's row tracks stop at the parent's last declared row. Excess items land below in implicit tracks that are NOT aligned with the parent.

### Root cause
Subgrid CANNOT generate implicit tracks beyond the spanned area on its declared axis. Per the CSS Grid Level 2 spec, subgrid is an alignment mechanism, not a track generator. Items beyond the spanned area fall into the parent's auto-row mode, which the subgrid does not control.

```css
/* WRONG : subgrid on row axis cannot extend */
.outer { display: grid; grid-template-rows: auto auto; }
.inner {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 2;
  /* third item overflows into unaligned row */
}
```

### Fix
Use subgrid only on the axis where the parent's tracks are fixed. For implicit-row needs, declare subgrid only on the column axis.

```css
/* CORRECT : subgrid on column axis only */
.inner {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 3;
  /* rows generated implicitly as needed */
}
```

### Source
[MDN : CSS grid layout : Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid).

## Anti-Pattern 7 : `box-sizing: content-box` default causing layout overflow

### Symptom
Four `width: 25%` columns with `padding: 1rem` and `border: 1px solid` do not fit on one line. They overflow because `25% + padding + border` exceeds 25%.

### Diagnostic step
DevTools : inspect computed `box-sizing`. If `content-box` (the default), declared width applies to content only. Total = width + padding + border.

### Root cause
The CSS default `box-sizing: content-box` makes declared width and height apply ONLY to the content box. Padding and border are added outside, so a `width: 25%` column with padding takes MORE than 25%.

```css
/* WRONG */
.col { width: 25%; padding: 1rem; border: 1px solid; }
/* Total > 25%, four columns overflow */
```

### Fix
Apply the universal `border-box` reset at the top of every stylesheet.

```css
/* CORRECT */
*, *::before, *::after { box-sizing: border-box; }

.col { width: 25%; padding: 1rem; border: 1px solid; }
/* Total = 25% exactly */
```

### Source
[MDN : box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing) (verified 2026-05-19) : "the most common best practice in modern CSS to avoid layout surprises."

## Anti-Pattern 8 (bonus) : Long URL breaks card without `overflow-wrap`

### Symptom
A user-generated card contains a long URL or unbreakable string. The card expands past its `max-inline-size`. On mobile, the page scrolls horizontally.

### Diagnostic step
DevTools : the card's computed inline-size exceeds its `max-inline-size`. Removing the long string in DevTools resolves the overflow.

### Root cause
Default `overflow-wrap: normal` only breaks at allowed break points (spaces, hyphens). Unbreakable strings (URLs, hashes, base64 blobs) push the container open.

```css
/* WRONG */
.card { max-inline-size: 24rem; }
```

### Fix
Add `overflow-wrap: anywhere`.

```css
/* CORRECT */
.card { max-inline-size: 24rem; overflow-wrap: anywhere; }
```

### Source
[MDN : overflow-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap).
