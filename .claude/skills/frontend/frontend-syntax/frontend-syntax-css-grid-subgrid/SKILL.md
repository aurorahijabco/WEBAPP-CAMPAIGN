---
name: frontend-syntax-css-grid-subgrid
description: >
  Use when laying out a section that is two-dimensional (rows AND columns matter at the same time), when nested grid items need to align to lines defined on an outer grid, when card titles or meta rows in a card list refuse to line up across columns, when a responsive grid must auto-fit or auto-fill an unknown number of items, when negative margins are being considered to "pull" a child into a parent track, or when a layout needs named lines or named areas that survive refactors.
  Prevents the classic "nested grid with hand-tuned margins" anti-pattern, the `auto-fill` versus `auto-fit` confusion that collapses or preserves empty tracks unpredictably, declaring subgrid on both axes when implicit rows are still needed, assuming masonry layout is Baseline (it is not), and using the legacy `grid-gap` property name instead of `gap`.
  Covers `display: grid` and `display: inline-grid`, `grid-template-columns` and `grid-template-rows`, `grid-template-areas` with named areas and dot null cells, named lines with `[name]` brackets, `repeat()` with `auto-fill` and `auto-fit`, `minmax()`, `fit-content()`, the `fr` unit, `gap` and `row-gap` and `column-gap`, implicit tracks with `grid-auto-rows` and `grid-auto-columns`, `grid-auto-flow` with `row` and `column` and `dense`, item placement with `grid-column` and `grid-row` and `grid-area`, alignment with `justify-items` and `align-items` and `place-items` and `justify-self` and `align-self`, and `subgrid` on either or both axes (Baseline Widely since September 2023) with named-line passthrough, gap inheritance, and the no-implicit-tracks hard limitation.
  Keywords: display grid, inline-grid, grid-template-columns, grid-template-rows, grid-template-areas, subgrid, named lines, named-line passthrough, repeat, minmax, fit-content, auto-fill, auto-fit, fr unit, gap, row-gap, column-gap, grid-auto-rows, grid-auto-columns, grid-auto-flow, dense, place-items, justify-self, align-self, grid-area, card layout aligned baselines, layout breaks at sub-component, items misaligned, gap not working, grid tracks do not align across rows, subgrid not working, implicit rows in subgrid not generated, nested items not aligned to outer grid, how to align nested grid items, what is subgrid, when to use grid vs flexbox, how do I make a card layout with aligned baselines, why is grid-gap not working, when to use auto-fill vs auto-fit, how do named lines work.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Syntax CSS Grid + Subgrid

This skill defines the CSS Grid layout surface and the rule for picking Grid versus Flexbox, and for picking subgrid versus a nested grid. CSS Grid is Baseline Widely Available since October 2017; subgrid is Baseline Widely Available since September 2023. The skill builds on `[[frontend-core-architecture]]` (style layer) and `[[frontend-core-web-standards-baseline]]` (Baseline gating).

Sources: [MDN: CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) (verified 2026-05-19), [MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid) (verified 2026-05-19), [MDN: grid-template-areas](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas) (verified 2026-05-19), [W3C: CSS Grid Layout Module Level 2](https://www.w3.org/TR/css-grid-2/) (verified 2026-05-19).

## Quick Reference

### Container properties

| Property | Purpose | Notes |
|----------|---------|-------|
| `display: grid` | Establishes a grid formatting context | Block-level container. |
| `display: inline-grid` | Same, inline-level container | ALWAYS use when the container itself must flow inline. Default `display: grid` is block. |
| `grid-template-columns` | Defines the column tracks of the explicit grid | Accepts lengths, `fr`, `minmax()`, `repeat()`, `fit-content()`, `[name]` line names, `subgrid`. |
| `grid-template-rows` | Defines the row tracks of the explicit grid | Same syntax as columns. |
| `grid-template-areas` | Defines named areas via row-strings | Areas MUST form a rectangle. Use `.` (or `...`) for empty cells. Auto-generates `<name>-start` and `<name>-end` lines on both axes. |
| `gap` | Gutter between tracks (works on grid AND flex) | Shorthand for `row-gap column-gap`. ALWAYS use `gap`. The legacy alias `grid-gap` is deprecated. |
| `grid-auto-rows` / `grid-auto-columns` | Size of implicit tracks | Auto-created when items are placed outside the explicit grid. |
| `grid-auto-flow` | How auto-placed items fill the grid | `row` (default), `column`, `dense`. `dense` may visually reorder items. |
| `justify-items` / `align-items` / `place-items` | Default item alignment along inline / block axis (or both) | Values: `start`, `end`, `center`, `stretch` (default). |

### Item properties

| Property | Purpose |
|----------|---------|
| `grid-column` | Shorthand for `grid-column-start / grid-column-end`. |
| `grid-row` | Shorthand for `grid-row-start / grid-row-end`. |
| `grid-area` | Shorthand for `row-start / col-start / row-end / col-end`, OR a single named area. |
| `justify-self` / `align-self` | Per-item override of container alignment. |

### Track-sizing functions

| Function | Effect |
|----------|--------|
| `repeat(<count>, <track>)` | Expands to `<count>` copies of `<track>`. |
| `repeat(auto-fill, minmax(<min>, 1fr))` | Creates as many tracks as fit; KEEPS empty tracks reserving space. |
| `repeat(auto-fit, minmax(<min>, 1fr))` | Creates as many tracks as fit; COLLAPSES empty tracks so existing items stretch. |
| `minmax(<min>, <max>)` | Track grows between `<min>` and `<max>`. Use `minmax(0, 1fr)` to allow `1fr` to shrink below content width. |
| `fit-content(<max>)` | Track sized to content, capped at `<max>`. |
| `fr` | Distributes leftover free space proportionally. NEVER mix `fr` with content tracks expecting equal columns; use `minmax(0, 1fr)`. |

### Named-line syntax

```css
.grid {
  grid-template-columns:
    [page-start] 1fr
    [content-start] minmax(0, 60ch)
    [content-end] 1fr [page-end];
}
.figure { grid-column: page-start / page-end; }
.prose  { grid-column: content-start / content-end; }
```

Brackets MAY hold multiple names: `[a b]`. A line MAY be unnamed. Authors may add names anywhere; the names follow the line, not the track.

### Subgrid summary (Baseline Widely Sept 2023)

```css
.outer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.card  { display: grid; grid-row: span 3; grid-template-rows: subgrid; }
```

Key rules verified against [MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid) (verified 2026-05-19):

1. `subgrid` is a value for `grid-template-columns` and/or `grid-template-rows`. It can be applied to one axis or both.
2. The subgrid spans EXACTLY the number of tracks its grid area covers on the parent.
3. Line numbering RESTARTS inside the subgrid (line 1 of subgrid is the parent line where the subgrid begins).
4. Parent named lines pass through the subgrid automatically and can be used to position children inside it.
5. The subgrid MAY add extra names after the `subgrid` keyword: `grid-template-columns: subgrid [sub-a] [sub-b]`.
6. Gap (`gap`, `row-gap`, `column-gap`) is INHERITED from the parent on the subgridded axis and MAY be overridden on the subgrid.
7. HARD LIMIT: a subgridded axis CANNOT generate implicit tracks. If both axes are subgrid and there are more items than cells, excess items overflow into the last track. To allow implicit rows, declare subgrid on the column axis ONLY and use `grid-auto-rows` for rows.

## Decision Trees

### Decision: Grid or Flexbox?

```
What does the layout need to express?

  Two-dimensional. Rows AND columns must align at the same time (gallery,
  dashboard, app shell, card list where titles must align across columns).
    -> CSS Grid on the outer container.

  One-dimensional row OR column with intrinsic content sizing
  (toolbar, breadcrumb trail, tag list, single-axis form row).
    -> Flexbox on the container.

  Both, nested. Outer layout is two-dimensional, but each cell is a
  one-dimensional cluster (card with horizontal action row at the bottom).
    -> Grid on the outer container. Flexbox inside the cell.
```

Rule of thumb: if the screenshot would show a clear column rhythm AND a clear row rhythm at the same time, the answer is Grid.

### Decision: subgrid or nested grid?

```
Does the inner element need to align to the OUTER grid's lines?

  No. The inner element has its own internal layout independent of the
  outer track sizes.
    -> Nested independent grid. Use `display: grid` with its own
       grid-template-columns / grid-template-rows.

  Yes, in BOTH axes, and the number of inner items is fixed and equal to
  outer cells (e.g. a known 3x2 mini-grid).
    -> `grid-template-columns: subgrid; grid-template-rows: subgrid;`.

  Yes, in BOTH axes, but inner content has a variable number of rows
  (cards with optional meta rows).
    -> `grid-template-columns: subgrid;` ONLY. Use `grid-auto-rows` for
       inner rows. Subgridding both axes here is the implicit-track trap.

  Yes, in ONE axis only (card titles aligned across columns, free row
  count per card).
    -> Subgrid on the relevant axis only.
```

### Decision: `auto-fill` or `auto-fit`?

```
What should happen when the container is wider than (item count x min track)?

  Reserve space for ghost tracks; existing items DO NOT stretch beyond their
  declared max. Useful when the grid is partially filled and you want a
  predictable column rhythm regardless of item count.
    -> repeat(auto-fill, minmax(<min>, 1fr))

  Collapse empty tracks; existing items stretch to fill the row width.
  Useful when you want the visible row to look "complete" with any item count.
    -> repeat(auto-fit, minmax(<min>, 1fr))
```

If the column count is fixed and known, use `repeat(<N>, 1fr)` and skip the auto-* keyword entirely.

### Decision: named lines or `grid-template-areas`?

```
Is the layout LITERATE in column count and shape?

  The layout is a recognisable named shape (header / sidebar / main / footer,
  hero / aside / content). Authors will edit the layout by adding or moving
  named areas.
    -> grid-template-areas. Areas form rectangles; place items with
       grid-area: <name>.

  The layout is a column rhythm with content that flows by position
  (e.g. 12-column page grid, prose narrow column, figures full-bleed).
    -> Named lines with [name] brackets. Place items with grid-column.

  Both. Areas for the page shell, named lines inside each area.
    -> Combine. Areas auto-generate <name>-start / <name>-end lines that
       inner items can target.
```

## Patterns

### Pattern 1: card list with aligned baselines (subgrid)

Outer is a 3-column track grid; each card is a 3-row subgrid (title, body, meta), so titles across cards align, bodies align, meta rows align.

```css
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1.5rem; }
.cards { grid-template-rows: auto 1fr auto; }
.card  { display: grid; grid-row: span 3; grid-template-rows: subgrid; gap: 0; }
.card > .title { grid-row: 1; }
.card > .body  { grid-row: 2; }
.card > .meta  { grid-row: 3; }
```

Full HTML in [examples.md](references/examples.md#pattern-1-card-list-with-aligned-baselines).

### Pattern 2: 12-column page grid with named lines

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
}
.figure { grid-column: full-start / full-end; }
.aside  { grid-column: wide-start / wide-end; }
.prose  { grid-column: content-start / content-end; }
```

### Pattern 3: app shell with `grid-template-areas`

```css
.shell {
  display: grid;
  grid-template-columns: 16rem 1fr;
  grid-template-rows: 4rem 1fr 2rem;
  grid-template-areas:
    "head head"
    "side main"
    "foot foot";
}
.shell > header { grid-area: head; }
.shell > nav    { grid-area: side; }
.shell > main   { grid-area: main; }
.shell > footer { grid-area: foot; }
```

### Pattern 4: responsive gallery with `auto-fit`

```css
.gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; }
```

Empty tail tracks collapse; items stretch to fill. Switch to `auto-fill` if the visible grid should reserve space for missing items.

### Pattern 5: masonry (NOT Baseline; gate behind `@supports`)

Masonry is still a draft proposal in the CSS Grid Layout specification and is NOT Baseline as of 2026. Verified against [W3C: CSS Grid Layout Module Level 2](https://www.w3.org/TR/css-grid-2/) (verified 2026-05-19): masonry is not part of the published Module Level 2 surface. ALWAYS gate masonry behind `@supports (grid-template-rows: masonry)` and ship a non-masonry fallback as the default rule. NEVER assume `masonry` is usable in evergreen-2026 production.

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md) for the full list. Minimum five patterns covered: subgrid on both axes with implicit-row needs, `auto-fit` versus `auto-fill` confusion, nested grid without subgrid expecting alignment, negative margin to align child to parent track, masonry assumed Baseline, `grid-gap` legacy name, `grid-auto-flow: dense` reordering reading order (accessibility issue), `display: grid` on inline elements without `display: inline-grid`.

## Reference Links

- [Methods and signatures](references/methods.md) : complete property and function table for grid containers, items, and subgrid.
- [Examples](references/examples.md) : working HTML/CSS snippets for the five patterns above plus subgrid edge cases.
- [Anti-patterns](references/anti-patterns.md) : eight cataloged anti-patterns with symptom, root cause, and fix.

## Cross-references

- `[[frontend-syntax-css-container-queries]]` : when "the same component must reflow in different parent widths", combine subgrid with container queries.
- `[[frontend-impl-responsive-layout-fluid]]` : fluid grids using `clamp()` and `minmax()`.
- `[[frontend-core-architecture]]` : where Grid sits in the style layer (W3C CSSWG).
- `[[frontend-core-web-standards-baseline]]` : Baseline gating for subgrid and masonry.
