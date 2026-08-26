---
name: frontend-errors-layout-pitfalls
description: >
  Use when diagnosing the canonical layout failures of modern CSS :
  a flex child that overflows its parent (the auto `min-content` floor),
  three `1fr` grid columns that refuse to be equal (the same floor),
  a `position: sticky` element that never sticks (ancestor `overflow`,
  no `inset`, or wrong parent height), a hero section that overshoots
  the mobile viewport by the chrome bar (`100vh` versus `100dvh /
  100svh / 100lvh`), a long URL or unbreakable string that breaks the
  card layout (`overflow-wrap` / `word-break`), a `z-index` that
  refuses to win against an element in a different stacking context
  (`transform`, `opacity < 1`, `filter`, `will-change`, `position:
  fixed | sticky` all create new contexts), a subgrid track that
  cannot generate implicit tracks, container query units (`cqi` /
  `cqb`) falling back to small-viewport units when no container
  ancestor matches, margin-collapse between parent and first / last
  child, and the universal `box-sizing: border-box` reset.
  Prevents the seven dominant layout failure modes : flex items
  overflowing because the implicit `min-width: auto` is `min-content`;
  `grid-template-columns: 1fr 1fr 1fr` not splitting evenly because
  `1fr` is `minmax(auto, 1fr)`; `position: sticky` doing nothing
  because a scrollable ancestor uses `overflow: hidden | auto |
  scroll` or because no `inset` value was set; `100vh` extending past
  the mobile viewport because dynamic browser chrome is excluded;
  long unbreakable strings expanding the parent past its bounds;
  `z-index` not winning when the elements live in different stacking
  contexts; and `box-sizing: content-box` (the default) causing
  total layout = declared width + padding + border surprises.
  Covers the `min-width: 0` / `min-height: 0` reset for flex and grid
  items, `minmax(0, 1fr)` versus `1fr` in grid tracks, intrinsic
  sizing keywords `min-content` / `max-content` / `fit-content(N)`,
  the stacking-context creators (`position` non-`static`, `z-index`
  non-`auto`, `opacity < 1`, `transform`, `filter`, `mix-blend-mode`,
  `clip-path`, `will-change`, `isolation: isolate`, `contain`), the
  three margin-collapse cases (sibling-sibling, parent-first-child,
  parent-last-child) and how to prevent collapse (padding, border,
  `display: flex / grid`, `overflow: auto`, `display: flow-root`),
  the dynamic viewport units (`dvh` / `svh` / `lvh` / `dvi` / `svi`
  / `lvi`), `overflow-wrap: anywhere` versus `word-break:
  break-word`, the subgrid implicit-tracks limitation (subgrid
  cannot generate implicit tracks beyond the spanned area on its
  declared axis), and the canonical universal `box-sizing:
  border-box` reset.
  Keywords: layout pitfalls, flex overflow, grid uneven columns,
  min-width 0, min-height 0, minmax 0 1fr, 1fr not equal,
  min-content, max-content, fit-content, intrinsic sizing,
  overflow-wrap, word-break, box-sizing, border-box, content-box,
  margin collapse, margin collapsing, block formatting context,
  BFC, display flow-root, position sticky not sticking,
  sticky overflow hidden, sticky no inset, dvh, svh, lvh,
  dynamic viewport height, mobile viewport bug, 100vh wrong,
  z-index, stacking context, subgrid implicit tracks,
  cqi fallback, container query unit fallback,
  flex item overflows, grid columns uneven, sticky not sticking,
  layout broken on mobile, long word breaks layout,
  z-index not working, viewport 100vh wrong, scrollbar appears,
  long URL breaks card, items not centering,
  why is my flex broken, why is my grid uneven,
  why is my sticky element not sticking,
  grid 1fr not equal, mobile viewport bug,
  long URL breaks layout, how to fix layout overflow,
  why doesn't z-index work.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Errors : Layout Pitfalls

Diagnostic skill for the canonical layout failures of flex, grid, sticky, viewport units, and stacking contexts. The reader has a broken layout and needs the one-line fix plus the underlying mental model.

## Quick Reference

### The seven essential resets

```css
/* 1. Universal border-box (every modern CSS reset) */
*, *::before, *::after { box-sizing: border-box; }

/* 2. Flex children : reset the min-content floor */
.flex-child { min-inline-size: 0; min-block-size: 0; }

/* 3. Grid track that MUST shrink below content : use minmax(0, 1fr) */
.grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); }

/* 4. Long-word safety on text containers */
.prose { overflow-wrap: anywhere; }

/* 5. Mobile-safe full-viewport hero */
.hero { block-size: 100dvh; }

/* 6. Sticky needs a defined inset AND a non-overflowing ancestor */
.sticky-nav { position: sticky; inset-block-start: 0; }

/* 7. Isolate stacking context when nesting z-index */
.layer-root { isolation: isolate; }
```

### Five most common bugs : one-line diagnosis

| Symptom | Diagnosis | Fix |
|---|---|---|
| Flex child stretches container | `min-width` defaulted to `min-content` | `min-inline-size: 0;` on child |
| `1fr 1fr 1fr` columns not equal | `1fr` = `minmax(auto, 1fr)` | `minmax(0, 1fr)` |
| `position: sticky` does nothing | Ancestor `overflow: hidden/auto/scroll` OR missing `inset` | Remove ancestor overflow OR set `top: 0` |
| Hero overflows on mobile | `100vh` excludes dynamic toolbar | `100dvh` (or `100svh` for guaranteed-fit) |
| `z-index: 9999` ignored | Elements in different stacking contexts | Raise parent context OR `isolation: isolate` |

## Decision Trees

### Tree 1 : Flex vs grid for this layout?

```
Is the layout primarily ONE-DIMENSIONAL (a row of buttons, a column
of list items, navigation, a toolbar)?
   YES -> flexbox. flex / flex-direction / gap.

Is the layout TWO-DIMENSIONAL (cards in a grid, dashboard regions,
template layouts with named areas)?
   YES -> CSS Grid. grid-template-columns / grid-template-rows /
          grid-template-areas.

Does the layout need to align items in both axes AND wrap to multiple
rows?
   YES -> Grid with auto-fit / auto-fill. Flex with wrap works but
          loses cross-axis alignment between rows.

Hard call : single row that wraps to multiple rows on small screens?
   YES -> Both work. Flex with wrap = simpler. Grid auto-fit =
          equal-width tracks.
```

### Tree 2 : `fr` or `auto` for grid track?

```
Should the track grow equally with siblings, sharing leftover space?
   YES -> 1fr.   But: 1fr = minmax(auto, 1fr); long content can push
          the track wider than its share. For forceful equal split :
          minmax(0, 1fr).

Should the track size to its content (no growth)?
   YES -> auto. Track shrinks to max-content; expands no further.

Should the track size to its content but capped at a maximum?
   YES -> fit-content(<max>). E.g., fit-content(20rem) = grows to
          content but never exceeds 20rem.

Should the track be a fixed width regardless of content?
   YES -> a length (e.g., 200px, 16rem, 30ch).

Mixing fixed + fr + auto?
   -> first fixed, then auto, then fr for remaining space. Example :
      grid-template-columns: 200px auto minmax(0, 1fr);
```

### Tree 3 : Is `min-width: 0` needed?

```
Is the element a FLEX or GRID item?
   YES -> next question
   NO  -> not needed; reset does not apply

Does the content inside the item have an intrinsic minimum size
(text strings, images with intrinsic width, fixed-width children)?
   YES -> next question
   NO  -> probably not needed

Is the item supposed to SHRINK below the intrinsic minimum (truncate
text, hide overflow, fit narrower container)?
   YES -> add min-inline-size: 0 (and / or min-block-size: 0) on the
          item. Default min-content floor would otherwise prevent
          shrinking.
   NO  -> leave default.
```

## Patterns

### Pattern A : Flex child overflows fix

```css
/* Symptom : long text in flex item pushes container wider */
.row    { display: flex; gap: 1rem; }
.row > .item {
  flex: 1;
  min-inline-size: 0;       /* THE FIX : override min-content floor */
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
```

Per the flex spec, the default `min-width: auto` on flex items resolves to `min-content`, which is the size of the longest unbreakable word. `min-width: 0` (`min-inline-size: 0` for logical) lets the item shrink below this floor.

### Pattern B : Equal-width grid columns

```css
/* WRONG : 1fr columns may not be equal under content pressure */
.row-bad { display: grid; grid-template-columns: 1fr 1fr 1fr; }

/* CORRECT : minmax(0, 1fr) forces equal */
.row-good { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); }
```

`1fr` is shorthand for `minmax(auto, 1fr)`. The `auto` minimum equals `min-content`, so a track with long text refuses to shrink below its longest word. `minmax(0, 1fr)` overrides to force equal split.

### Pattern C : Sticky that actually sticks

```css
.app {
  /* CRITICAL : no ancestor between sticky and its scroll root may have overflow != visible */
  /* That includes the body in many resets. Check the chain. */
}

.sticky-header {
  position: sticky;
  inset-block-start: 0;      /* REQUIRED : without an inset, sticky behaves like static */
  background: var(--surface);
  z-index: 10;
}
```

`position: sticky` requires : (a) a defined `inset-*` value (e.g., `top: 0`), (b) a scrolling ancestor (no `overflow: hidden | auto | scroll` between sticky and its actual scroll root unless that ancestor IS the scrolling container with a defined height), (c) sufficient parent height for the sticky range to be visible.

### Pattern D : Mobile viewport units

```css
/* WRONG : extends past visible viewport on mobile (browser chrome) */
.hero-bad { block-size: 100vh; }

/* CORRECT : dynamic, always fills visible viewport */
.hero-good { block-size: 100dvh; }

/* Conservative : guaranteed to fit even with toolbar visible */
.modal-content { max-block-size: 100svh; }

/* Maximum extent (toolbar hidden) */
.fullscreen { block-size: 100lvh; }
```

| Unit | Meaning |
|---|---|
| `vh` | Static viewport height (initial) |
| `dvh` | Dynamic viewport height (changes with chrome) |
| `svh` | Small viewport height (chrome shown, smallest extent) |
| `lvh` | Large viewport height (chrome hidden, largest extent) |
| `vw` / `dvw` / `svw` / `lvw` | Same family on the inline axis |

### Pattern E : Long-word overflow safety

```css
/* Long URLs, long unbreakable strings, code snippets in prose */
.prose {
  overflow-wrap: anywhere;
  /* anywhere : break inside any character. Older alternative : break-word. */
}

/* Stronger : break inside CJK / non-Latin too */
.code-inline {
  word-break: break-word;
}
```

`overflow-wrap: anywhere` is the modern recommendation. `word-break: break-word` is the older alias. Both prevent a long URL from blowing out a card.

### Pattern F : Stacking context isolation

```css
/* Symptom : z-index: 9999 ignored. */
/* Cause : a parent element creates a stacking context, trapping the child. */

/* Common stacking-context creators : */
.transformed { transform: translateZ(0); }   /* creates context */
.translucent { opacity: 0.99; }              /* creates context */
.filtered    { filter: blur(0); }            /* creates context */
.fixed       { position: fixed; }            /* creates context */
.sticky      { position: sticky; }           /* creates context */
.contained   { contain: layout; }            /* creates context */
.willing     { will-change: transform; }     /* creates context */
.isolated    { isolation: isolate; }         /* explicit context */

/* The fix : raise the parent's z-index OR explicitly isolate to scope z-index inside */
.layer-root  { isolation: isolate; }         /* all child z-index now scoped here */
```

`z-index` only orders elements WITHIN the same stacking context. A child inside a transformed parent cannot escape to overlap a sibling of that parent, no matter how large its z-index.

### Pattern G : Margin collapse (when wanted and when not)

```css
/* Margins collapse between adjacent siblings : */
.p + .p { /* effective gap = max(prev margin-bottom, next margin-top) */ }

/* Margins collapse parent <-> first child unless parent has padding / border / overflow / BFC */
.parent-wants-children-margin {
  /* nothing : child margin-top "escapes" up to the parent */
}

.parent-blocks-child-margin {
  padding-block-start: 1px;     /* or border, or display: flex/grid, or overflow: auto, or display: flow-root */
}
```

Margins do NOT collapse for : flex items, grid items, floats, absolutely positioned elements, inline-blocks, elements inside a Block Formatting Context. Prefer `display: flex / grid` + `gap` for predictable spacing.

## Out of Scope

- Flexbox / grid syntax tutorials (covered in `[[frontend-syntax-css-grid-subgrid]]` and elsewhere).
- Container query syntax (covered in `[[frontend-syntax-css-container-queries]]`).
- Fluid responsive sizing (covered in `[[frontend-impl-responsive-layout-fluid]]`).
- Animation performance / jank (covered in `[[frontend-errors-animation-jank]]`).
- Viewport-unit deep dive (covered in `[[frontend-errors-units-rendering-viewport]]`).

## Hard Rules (Binding)

1. NEVER assume `box-sizing: content-box` is acceptable. Apply the universal `border-box` reset at the top of every stylesheet.
2. NEVER use `1fr` alone when equal split is required. Always `minmax(0, 1fr)`.
3. NEVER set a flex / grid child width without considering whether `min-inline-size: 0` is needed. Default `min-content` floor breaks shrinking.
4. NEVER use `100vh` for full-viewport mobile layouts. Use `100dvh` (or `svh` / `lvh` per intent).
5. NEVER use `overflow: hidden` on an ancestor of a `position: sticky` element unless the ancestor is explicitly the scrolling container.
6. NEVER rely on `z-index` to escape a stacking context. Raise the parent's context OR add `isolation: isolate` to scope.
7. NEVER ship user-supplied text into a card without `overflow-wrap: anywhere`. A single long URL breaks the layout.
8. NEVER use `grid-auto-flow: dense` for content that has reading-order significance. Visual order will diverge from DOM order, breaking screen-reader and keyboard navigation.

## Reference Links

- `references/methods.md` : full intrinsic-sizing keywords, stacking-context creator list, viewport-unit table, margin-collapse rules
- `references/examples.md` : before / after debugging snippets for flex overflow, sticky inside overflow, viewport-unit mobile demo, grid 1fr fix
- `references/anti-patterns.md` : 7 anti-patterns with symptom, diagnostic step, root cause, fix
- [MDN : Mastering margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing) (verified 2026-05-19)
- [MDN : box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing) (verified 2026-05-19)
- [MDN : CSS flexible box layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout)
- [MDN : CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [MDN : position](https://developer.mozilla.org/en-US/docs/Web/CSS/position)

## Cross-References

- `[[frontend-syntax-css-grid-subgrid]]` : subgrid syntax + implicit-tracks rule
- `[[frontend-syntax-css-container-queries]]` : container query unit fallback details
- `[[frontend-impl-responsive-layout-fluid]]` : fluid sizing, intrinsic typography
- `[[frontend-errors-units-rendering-viewport]]` : viewport-unit deep dive
- `[[frontend-errors-animation-jank]]` : performance issues separate from layout pitfalls
- `[[frontend-syntax-css-nesting-logical-properties]]` : logical sizing variants
