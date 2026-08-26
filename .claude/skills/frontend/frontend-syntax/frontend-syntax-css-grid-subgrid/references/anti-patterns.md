# Anti-Patterns : CSS Grid + Subgrid

Each entry : symptom (what the developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [MDN: CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) (verified 2026-05-19), [MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid) (verified 2026-05-19), [W3C: CSS Grid Layout Module Level 2](https://www.w3.org/TR/css-grid-2/) (verified 2026-05-19).

## Anti-pattern 1 : subgrid on BOTH axes when implicit rows are still needed

Symptom : a card grid set up with `grid-template-columns: subgrid; grid-template-rows: subgrid;` shows excess items piling up in the last cell, or the layout silently truncates when content grows.

Root cause : a subgridded axis CANNOT generate implicit tracks. The subgrid spans exactly the cells covered by its `grid-column` / `grid-row` placement on the parent. Once both axes are subgridded, the cell count is fixed.

Fix : subgrid only the axis you need to align. For card-row alignment with variable inner row counts, use :

```css
.card {
  grid-template-columns: subgrid;
  grid-auto-rows: minmax(2rem, auto);
}
```

The row axis remains a regular nested grid and generates implicit tracks as needed.

## Anti-pattern 2 : `auto-fit` and `auto-fill` treated as interchangeable

Symptom : a gallery with three items renders as three stretched columns in one CSS file and as three narrow columns plus blank reserved space in another, depending on which keyword was used.

Root cause : `auto-fill` keeps empty tracks reserving space; `auto-fit` collapses them. With a full grid (many items), the two render identically. The divergence only shows up at under-filled widths, so the bug appears late.

Fix : pick deterministically.

- `repeat(auto-fill, minmax(<min>, 1fr))` when an empty tail should reserve space (placeholder grids, predictable column rhythm regardless of item count).
- `repeat(auto-fit, minmax(<min>, 1fr))` when items should stretch to fill the row width regardless of count.

If the count is fixed, use `repeat(<N>, 1fr)` and skip the auto-* keyword.

## Anti-pattern 3 : nested grid without subgrid, expecting cross-grid alignment

Symptom : a card list uses an outer 3-column grid; each card has its own `display: grid; grid-template-rows: auto 1fr auto;`. Titles wrap differently in each card, so titles, bodies, and meta rows do NOT align across cards.

Root cause : every grid container creates its own track-sizing context. There is no cross-grid alignment. The inner `grid-template-rows: auto 1fr auto` sizes rows independently per card.

Fix : declare the parent's rows once, then use `grid-template-rows: subgrid` on each card and `grid-row: span <N>` so the card spans the rows it needs. Parent track sizing now governs all cards.

```css
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); grid-template-rows: auto 1fr auto; gap: 1rem; }
.card  { grid-row: span 3; display: grid; grid-template-rows: subgrid; }
```

## Anti-pattern 4 : negative margin to pull a child into a parent track

Symptom : a "hero" panel needs to extend into the page's gutter; the author writes `margin-inline: -2rem;` (or similar) and the layout breaks at narrow widths or wraps unexpectedly.

Root cause : the parent grid HAS the right line names or area boundaries; the author chose negative margin because they did not declare the inner element as a grid child of the outer container.

Fix : use named lines or `grid-template-areas` on the outer container and place the inner element with `grid-column`.

```css
.page { grid-template-columns: [full-start] 1fr [content-start] 60ch [content-end] 1fr [full-end]; }
.hero { grid-column: full-start / full-end; }
```

No negative margins. Layout responds correctly to width changes because it is defined in terms of grid lines, not magic numbers.

## Anti-pattern 5 : assuming masonry layout is Baseline

Symptom : a portfolio page uses `grid-template-rows: masonry;` without a fallback. The layout renders correctly in one browser and as a regular grid in another (or vice versa) depending on engine support.

Root cause : masonry is a draft proposal in the CSS Grid Layout specification and is NOT Baseline in 2026. It is not part of the published Module Level 2 surface ([W3C: CSS Grid Layout Module Level 2](https://www.w3.org/TR/css-grid-2/) (verified 2026-05-19)).

Fix : gate masonry behind `@supports` and ship a non-masonry layout as the default rule.

```css
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); grid-auto-rows: 8rem; gap: 1rem; }
@supports (grid-template-rows: masonry) {
  .gallery { grid-template-rows: masonry; }
}
```

## Anti-pattern 6 : using the legacy `grid-gap` name

Symptom : `grid-gap: 1rem;` works in current browsers but linters or codemods flag it; some toolchains strip vendor-prefixed gap rules and the gap disappears.

Root cause : `grid-gap`, `grid-row-gap`, `grid-column-gap` are legacy aliases for `gap`, `row-gap`, `column-gap`. The unprefixed names work on BOTH grid and flex containers and are Baseline.

Fix : ALWAYS use `gap`, `row-gap`, `column-gap`. NEVER use the `grid-`-prefixed forms.

## Anti-pattern 7 : `grid-auto-flow: dense` disrupting reading order

Symptom : a screen reader announces a card list out of visual order, or keyboard tab focus jumps unpredictably between visually adjacent cards.

Root cause : `dense` packs items tightly by reordering later items into earlier holes. Visual order then differs from DOM order. Tab order and screen-reader order follow DOM order, so the two diverge. This is a WCAG-relevant issue when the content order conveys meaning.

Fix : use `dense` ONLY for decorative galleries where item order does not convey meaning. For interactive sequences (forms, navigation, item lists with semantic order), use `grid-auto-flow: row` (the default) and place items explicitly, OR reorder the DOM to match the intended visual order.

## Anti-pattern 8 : `display: grid` on an element that should remain inline

Symptom : an inline chip-set that used to flow next to text now starts on a new line; vertical-align stops working; container width is suddenly 100%.

Root cause : `display: grid` creates a block-level grid container. The element is no longer inline-level.

Fix : use `display: inline-grid` when the container itself must remain inline-level.

```css
.chips { display: inline-grid; grid-auto-flow: column; gap: 0.5rem; }
```

## Anti-pattern 9 : `1fr` columns collapsing too narrow when content has long words

Symptom : `grid-template-columns: 1fr 1fr;` looks balanced until a long URL or long word appears in one column, after which the column rhythm distorts and the other column gets pushed.

Root cause : `1fr` resolves to `minmax(auto, 1fr)`. The `auto` minimum is the item's min-content size (which can be a long unbreakable word). The track cannot shrink below that minimum.

Fix : use `minmax(0, 1fr)` to remove the auto-floor.

```css
.split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
```

For text content, also consider `overflow-wrap: anywhere` to break long words rather than letting them inflate the track.

## Anti-pattern 10 : subgrid placed on the parent instead of the child

Symptom : author writes `grid-template-columns: subgrid;` on the OUTER container expecting cards to inherit something, and the layout breaks immediately because the outer grid has no parent grid to inherit from.

Root cause : `subgrid` is a value for `grid-template-*` on a CHILD grid container. The child must itself be a grid (`display: grid` plus a `grid-column` / `grid-row` placement on its parent grid) for the keyword to mean anything.

Fix : the subgrid keyword goes on the CHILD container that needs to inherit the parent's tracks.

```css
.outer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.child { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; }
```

If the child is not itself a grid container, `subgrid` does nothing.
