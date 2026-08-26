# References : Layout Pitfalls Catalog

Verified against [MDN : Mastering margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing) (2026-05-19), [MDN : box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing) (2026-05-19), [MDN : CSS flexible box layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout), [MDN : CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout), [MDN : position](https://developer.mozilla.org/en-US/docs/Web/CSS/position).

## 1. Box-sizing

| Value | Width / height applies to | Use |
|---|---|---|
| `content-box` (default) | content only ; padding + border added outside | NEVER as default |
| `border-box` | content + padding + border ; margin added outside | ALWAYS via universal reset |

```css
*, *::before, *::after { box-sizing: border-box; }
```

## 2. Flexbox sizing pitfalls

### 2.1 The `min-content` floor

Per the Flexbox spec, `min-width` (and `min-height` on column-direction flex containers) defaults to `auto`, which resolves to `min-content` for flex items. `min-content` is "the size of the longest unbreakable word" : a flex child with long text refuses to shrink below that width.

| Symptom | Fix |
|---|---|
| Flex child overflows parent | `min-inline-size: 0` on child |
| Column-direction flex item overflows vertically | `min-block-size: 0` on child |

### 2.2 `flex-basis` versus `width`

`flex: 1` shorthand sets `flex-grow: 1`, `flex-shrink: 1`, `flex-basis: 0%`. `flex-basis: 0` ignores intrinsic content size; the item starts at zero and grows by `flex-grow`. Using `width: <n>` instead leaves `flex-basis: auto`, which respects content size.

### 2.3 Gap support

`gap` works on `display: flex` (Baseline Widely Available). Legacy WebKit (pre-2021) does not support flex `gap`; if targeting that surface, fall back to `margin` on children.

## 3. Grid sizing pitfalls

### 3.1 `1fr` vs `minmax(0, 1fr)`

`1fr` is shorthand for `minmax(auto, 1fr)`. The `auto` minimum equals `min-content`. Track refuses to shrink below the longest unbreakable word.

| Goal | Track template |
|---|---|
| Forceful equal split | `minmax(0, 1fr)` |
| Equal split respecting content | `1fr` (`minmax(auto, 1fr)`) |
| Content-sized track | `auto` |
| Content-sized with maximum cap | `fit-content(<max>)` |
| Fixed width | length value (`200px`, `16rem`, `30ch`) |
| Repeat with auto-fit | `repeat(auto-fit, minmax(<min>, 1fr))` |

### 3.2 Intrinsic sizing keywords

| Keyword | Definition |
|---|---|
| `min-content` | Size of the longest unbreakable inline content |
| `max-content` | Size if no wrapping were applied |
| `fit-content(<n>)` | `min(max-content, max(min-content, <n>))` |
| `auto` | Implementation-defined; flex/grid contexts vary |

### 3.3 Subgrid implicit-tracks limitation

`grid-template-columns: subgrid` (or `grid-template-rows: subgrid`) inherits the parent's tracks on that axis. The subgrid CANNOT generate implicit tracks beyond the spanned area on the subgrid axis. For implicit-row needs, declare subgrid only on the column axis.

### 3.4 `grid-auto-flow: dense` accessibility caveat

`dense` packs items into earlier slots when possible, which can REORDER items visually. Visual order then diverges from DOM order, breaking screen-reader and Tab navigation. NEVER use `dense` for content with reading-order significance.

## 4. Position : sticky

### 4.1 Requirements (ALL must be met)

1. `inset-*` value defined (e.g., `inset-block-start: 0`).
2. No ancestor between sticky and its scroll root has `overflow: hidden | auto | scroll | clip` UNLESS that ancestor IS the scrolling container with a defined height.
3. The parent has enough height for the sticky range to be visible.

### 4.2 Diagnostic checklist

| Check | Tool |
|---|---|
| Inspect ancestor chain for `overflow` | DevTools : computed styles of every ancestor up to body |
| Verify `inset-*` is set | DevTools : computed styles on sticky element |
| Verify parent height exceeds sticky element height | DevTools : box model on parent |

## 5. Stacking contexts

### 5.1 Properties that create a new stacking context

| Property | Value |
|---|---|
| `position` | `fixed`, `sticky`, OR (`absolute` / `relative`) with `z-index != auto` |
| `z-index` | non-`auto` value on a positioned element |
| `opacity` | `< 1` |
| `transform` | any non-`none` value |
| `filter` | any non-`none` value |
| `backdrop-filter` | any non-`none` value |
| `mix-blend-mode` | any value other than `normal` |
| `clip-path` | any non-`none` value |
| `mask` | any non-`none` value |
| `will-change` | any value that creates a stacking context normally |
| `contain` | `layout`, `paint`, `strict`, `content` |
| `isolation` | `isolate` (explicit) |
| `<dialog>` open + element in top layer | implicit |

### 5.2 `isolation: isolate`

The cleanest way to create a stacking context purely for z-index scoping, without side effects on layout, paint, or rendering.

```css
.layer-root { isolation: isolate; }
```

All descendant z-index values are scoped inside this context.

## 6. Margin collapsing

### 6.1 Three cases of collapse

| Case | Description |
|---|---|
| Adjacent siblings | Top + bottom of consecutive block siblings collapse to max |
| Parent and first child | Parent's top margin collapses with first child's top margin |
| Parent and last child | Parent's bottom margin collapses with last child's bottom margin |
| Empty block | Block with no content / border / padding has top + bottom margins collapse together |

### 6.2 What prevents collapse

| Method | Note |
|---|---|
| Padding on parent | Even `padding-block-start: 1px` |
| Border on parent | `border-block-start: 1px solid transparent` |
| `display: flex` on parent | Children are flex items; margins do not collapse |
| `display: grid` on parent | Children are grid items; margins do not collapse |
| `display: flow-root` on parent | Creates a new BFC |
| `overflow: auto / hidden / scroll` on parent | Creates a new BFC |
| `position: absolute / fixed` on child | Margins never collapse |
| Floating child | Margins never collapse |

### 6.3 What never collapses

| Margins that do not collapse |
|---|
| Horizontal margins (left / right) |
| Flex item margins (in flex container) |
| Grid item margins (in grid container) |
| Absolute / fixed positioned element margins |
| Float margins |
| Inline + inline-block (in inline formatting context) |

## 7. Viewport units

| Unit | Static? | Dynamic? | When chrome shown / hidden |
|---|---|---|---|
| `vh` / `vw` | Static (initial viewport) | NO | Frozen at page load |
| `dvh` / `dvw` | YES | YES | Updates as chrome shows / hides |
| `svh` / `svw` | Static (small viewport) | NO | Smallest extent (chrome shown) |
| `lvh` / `lvw` | Static (large viewport) | NO | Largest extent (chrome hidden) |
| `dvi` / `dvb` | YES | YES | Logical-axis variants |
| `svi` / `svb` | Static (small) | NO | Logical-axis variants |
| `lvi` / `lvb` | Static (large) | NO | Logical-axis variants |

`vh` is preserved for backward compatibility but is the WRONG default for new mobile-aware layouts. `dvh` is the modern default for "always fills the visible viewport."

## 8. Container query units (caveat)

`cqi`, `cqb`, `cqw`, `cqh`, `cqmin`, `cqmax` are sized relative to the nearest containing element with `container-type` set. If NO such ancestor exists, they fall back to small-viewport units (`svi`, `svb`, etc.).

Diagnostic : if a layout that uses `cqi` collapses unexpectedly, check that a `container-type` ancestor exists.

## 9. `overflow-wrap` vs `word-break`

| Property | Effect |
|---|---|
| `overflow-wrap: normal` (default) | Breaks only at allowed break points (spaces, hyphens) |
| `overflow-wrap: anywhere` | Breaks at any character when needed; min-content shrinks to one character |
| `overflow-wrap: break-word` | Same as `anywhere` but does NOT affect min-content sizing |
| `word-break: normal` (default) | Break per usual rules |
| `word-break: break-all` | Break at any character (CJK behavior on Latin too) |
| `word-break: keep-all` | Never break at CJK characters |
| `word-break: break-word` (legacy alias) | Equivalent to `overflow-wrap: anywhere` |

Modern recommendation : `overflow-wrap: anywhere` for prose / cards / user-supplied content.

## 10. Cross-References

- `[[frontend-syntax-css-grid-subgrid]]` : full grid + subgrid syntax
- `[[frontend-syntax-css-container-queries]]` : container queries and units
- `[[frontend-impl-responsive-layout-fluid]]` : fluid responsive sizing
- `[[frontend-errors-units-rendering-viewport]]` : viewport-unit deep dive
- `[[frontend-syntax-css-nesting-logical-properties]]` : `inline-size` / `block-size` logical variants
