# Methods : CSS Grid + Subgrid

Sources : [MDN: CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) (verified 2026-05-19), [MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid) (verified 2026-05-19), [MDN: grid-template-areas](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas) (verified 2026-05-19), [W3C: CSS Grid Layout Module Level 2](https://www.w3.org/TR/css-grid-2/) (verified 2026-05-19).

## 1. Display values

| Value | Effect |
|-------|--------|
| `display: grid` | Block-level grid container. |
| `display: inline-grid` | Inline-level grid container. Use when the container itself flows inline. |

## 2. Container : track definition

| Property | Accepts | Notes |
|----------|---------|-------|
| `grid-template-columns` | `<track-list>` \| `none` \| `subgrid [<line-name-list>]` | Defines explicit columns. |
| `grid-template-rows` | `<track-list>` \| `none` \| `subgrid [<line-name-list>]` | Defines explicit rows. |
| `grid-template-areas` | `none` \| `<string>+` | Each string is a row. Cell tokens within a string are columns. Areas MUST be rectangular. Empty cells use `.` (any length of dots). |
| `grid-template` | shorthand | Resets `grid-template-rows`, `grid-template-columns`, `grid-template-areas`. Does NOT reset implicit-grid properties. |
| `grid` | full shorthand | Resets all six grid-template-* and grid-auto-* properties. Use only when ALL six are intended. |

### `<track-list>` tokens

| Token | Meaning |
|-------|---------|
| `<length>` (e.g. `200px`, `1rem`) | Fixed track size. |
| `<percentage>` | Percentage of the container's inline (columns) or block (rows) size. |
| `auto` | Track sized to its content's max-content (with min-content floor). |
| `min-content` / `max-content` | Sized to the smallest / largest content of items in the track. |
| `<flex>` (the `fr` unit) | Share of the leftover free space. `1fr 2fr 1fr` distributes 1:2:1. |
| `minmax(<min>, <max>)` | Track sized between `<min>` and `<max>`. `<min>` MUST NOT be `<flex>`; `<max>` MAY be `<flex>`. |
| `fit-content(<length>)` | `max-content` capped at `<length>`. |
| `repeat(<count>, <track-list>)` | Expands inline. `<count>` is a positive integer, `auto-fill`, or `auto-fit`. |
| `[<line-name>+]` | Names assigned to the next line. Brackets MAY hold multiple names: `[a b]`. |

## 3. Container : implicit grid

| Property | Default | Effect |
|----------|---------|--------|
| `grid-auto-rows` | `auto` | Size of implicitly created rows (items placed beyond the explicit grid). |
| `grid-auto-columns` | `auto` | Size of implicitly created columns. |
| `grid-auto-flow` | `row` | Auto-placement order. Values: `row`, `column`, `row dense`, `column dense`. `dense` may visually reorder items relative to DOM order. |

## 4. Container : gutters

| Property | Effect |
|----------|--------|
| `gap` | Shorthand for `row-gap column-gap`. Single value sets both. |
| `row-gap` | Gap between rows. |
| `column-gap` | Gap between columns. |

The legacy `grid-gap` / `grid-row-gap` / `grid-column-gap` names are deprecated aliases. ALWAYS use the unprefixed forms; they work on both Grid and Flex containers and are Baseline.

## 5. Container : alignment

| Property | Axis | Default | Values |
|----------|------|---------|--------|
| `justify-items` | inline | `legacy` (typically renders as `stretch` for grid items) | `start`, `end`, `center`, `stretch`, `baseline` |
| `align-items` | block | `stretch` | `start`, `end`, `center`, `stretch`, `baseline` |
| `place-items` | both | `align-items justify-items` | Single value applies to both axes. |
| `justify-content` | inline (track-set as a whole) | `start` | `start`, `end`, `center`, `stretch`, `space-around`, `space-between`, `space-evenly` |
| `align-content` | block (track-set as a whole) | `start` | Same set as `justify-content`. |
| `place-content` | both | shorthand | `align-content justify-content`. |

## 6. Item : placement

| Property | Shorthand for | Notes |
|----------|---------------|-------|
| `grid-column` | `grid-column-start / grid-column-end` | E.g. `1 / 3`, `span 2`, `header-start / header-end`. |
| `grid-row` | `grid-row-start / grid-row-end` | Same forms. |
| `grid-area` | `row-start / col-start / row-end / col-end` OR single named area | When a single identifier is given, it MUST match an area named in `grid-template-areas`. |
| `grid-column-start`, `grid-column-end`, `grid-row-start`, `grid-row-end` | line numbers, line names, `span <integer>`, `span <line-name>`, `auto` | Negative integers count from the explicit grid's end. |

## 7. Item : alignment override

| Property | Axis |
|----------|------|
| `justify-self` | inline |
| `align-self` | block |
| `place-self` | both (shorthand) |

Values match `justify-items` / `align-items`.

## 8. Subgrid

```
grid-template-columns: subgrid [<line-name-list>]?
grid-template-rows:    subgrid [<line-name-list>]?
```

| Behavior | Verified rule |
|----------|---------------|
| Track sizing | Inherited from the parent on the subgridded axis. |
| Span | Subgrid spans exactly the cells covered by its `grid-column` / `grid-row` placement. |
| Line numbering | Restarts at 1 inside the subgrid. Parent line names ALSO pass through. |
| Local names | Allowed after `subgrid` keyword. Assigned one per line of the subgrid's explicit grid, starting at line 1; excess names ignored. |
| Gap | Inherited from parent. May be overridden with `gap`, `row-gap`, `column-gap` on the subgrid. |
| Implicit tracks | NOT created on a subgridded axis. Excess items overflow into the last track. |
| Mixed axes | One axis MAY be subgrid while the other uses a regular `<track-list>` (e.g. `grid-template-columns: subgrid; grid-template-rows: repeat(3, auto);`). |

## 9. Sizing function quick map

| Function | When to use |
|----------|-------------|
| `repeat(<int>, <track>)` | Known column count. |
| `repeat(auto-fill, minmax(<min>, 1fr))` | Unknown count, KEEP space for missing items. |
| `repeat(auto-fit, minmax(<min>, 1fr))` | Unknown count, COLLAPSE empty tails so items stretch. |
| `minmax(<min>, <max>)` | Track grows between bounds. `minmax(0, 1fr)` unlocks `1fr` to shrink below content. |
| `fit-content(<length>)` | Content-driven track with a cap. |

## 10. Named-area auto-lines

A named area `head` in `grid-template-areas` auto-generates four implicit line names:

- `head-start` on the row axis (first row of the area).
- `head-end` on the row axis (last row of the area).
- `head-start` on the column axis (first column of the area).
- `head-end` on the column axis (last column of the area).

This lets a child target an area's bounding lines by name even when the area is occupied by another element.

## 11. Baseline status snapshot

| Feature | Baseline status (verified 2026-05-19) |
|---------|---------------------------------------|
| `display: grid`, `grid-template-*`, `gap`, `repeat`, `minmax`, `fr` | Widely available (since October 2017). |
| `grid-template-areas` | Widely available (since October 2017). |
| `subgrid` (either or both axes) | Widely available (since September 2023). |
| `masonry` layout | NOT Baseline. Draft proposal, gate behind `@supports`. |

## 12. Cross-property interactions

- `grid-template` does NOT reset `grid-auto-*` or `gap`. Use `grid` shorthand only when those are intended to reset too.
- `justify-items: legacy` exists for compat with older `legacy left | right | center` markup. AVOID. Use explicit `start | end | center | stretch | baseline`.
- `grid-auto-flow: dense` MAY change visual order without changing DOM order. This breaks tab-order alignment with reading order. Use only when the reading-order mismatch is acceptable (gallery thumbnails, not interactive forms).
- `display: grid` on an element that was previously `display: inline` resets to block-level. Use `display: inline-grid` to preserve inline flow.
