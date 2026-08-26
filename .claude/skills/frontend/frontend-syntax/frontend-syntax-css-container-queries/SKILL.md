---
name: frontend-syntax-css-container-queries
description: >
  Use when a component's layout has to react to the width or aspect of its own parent rather than the viewport, when card or panel content collapses or stretches at the wrong breakpoint, when reusable components need to behave differently in a narrow sidebar versus a wide main column, or when a theme switch driven by a custom property should style its descendants without descendant-explosion selectors.
  Prevents the classic "media-query at the component" mistake, container query units (`cqi`, `cqw`) falling back silently to viewport units, layout collapse from setting `container-type: size` without an explicit height, descendant containers shadowing ancestor containers in unexpected ways, and shipping a Baseline 2025 style container query without a feature gate.
  Covers the full `container-type` value set (`size`, `inline-size`, `normal`), the `container-name` opt-in plus the `container` shorthand, anonymous and named `@container (width > X)` queries, the six container query length units (`cqw`, `cqh`, `cqi`, `cqb`, `cqmin`, `cqmax`) with their viewport fallback rule, style container queries (`@container style(--theme: dark)`), and the deterministic rule for picking a container query over a media query.
  Keywords: container query, container queries, @container, container-type, container-name, container shorthand, cqw, cqh, cqi, cqb, cqmin, cqmax, container query unit, style query, style container query, named container, inline-size containment, size containment, component responsive, responsive component, layout breaks at component level, component layout breaks at certain sizes, cannot query parent width, layout depends on viewport when it should depend on parent, sidebar narrow card wide, card layout switches at wrong width, cqi unit too large, how do I make a component responsive to its container, how to make responsive component, why media query does not work for component, container vs media query, what is container-type, what are container queries.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Syntax CSS Container Queries

This skill defines the CSS container query surface and the rule for picking a container query over a media query. Container queries are Baseline Widely Available since 2023; the style-query form is Baseline 2025 and MUST be gated. The skill builds on `[[frontend-core-architecture]]` (style layer) and `[[frontend-core-web-standards-baseline]]` (Baseline gating).

Source: [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19).

## Quick Reference

### `container-type` value matrix

| Value | What is queryable | Cost | When to use |
|-------|-------------------|------|-------------|
| `inline-size` | inline-axis (width in default writing mode) | low; creates an inline-size containment context | DEFAULT for components. Cards, panels, callouts, list items. |
| `size` | both axes (width and height) | higher; creates full size containment; child needs intrinsic size | ONLY when height queries are actually required (square cards, aspect-locked tiles). Requires the element to have an explicit or intrinsic height. |
| `normal` | none for size; style queries still work | lowest | Style-only queries (`@container style(...)`). |

A descendant of an element with `container-type` becomes part of that containment context. Setting `container-type` on the queried element itself causes a self-reference loop and the query NEVER matches. ALWAYS set `container-type` on a PARENT of the elements you want to style.

### `@container` syntax forms

```css
/* Anonymous (matches the nearest ancestor container) */
@container (width > 600px) { ... }

/* Named (matches the nearest ancestor container with name="sidebar") */
@container sidebar (width > 600px) { ... }

/* Style query (no size query needed; works on container-type: normal) */
@container style(--theme: dark) { ... }
```

### Container query length units

| Unit | Resolves to |
|------|-------------|
| `cqw` | 1% of the query container's WIDTH |
| `cqh` | 1% of the query container's HEIGHT (requires `container-type: size`) |
| `cqi` | 1% of the query container's INLINE size (logical, the safe default) |
| `cqb` | 1% of the query container's BLOCK size (requires `container-type: size`) |
| `cqmin` | the smaller of `cqi` and `cqb` |
| `cqmax` | the larger of `cqi` and `cqb` |

When no ancestor container exists for a `cq*` unit, the unit falls back to the equivalent small-viewport unit (`cqi` falls back to `svi`, `cqw` falls back to `svw`, etc.). A value that looks "too large" almost always means no containment ancestor exists; ALWAYS pair a component using `cq*` units with a `container-type` ancestor.

### Container shorthand

```css
.container { container: card / inline-size; }
/* equivalent to */
.container { container-name: card; container-type: inline-size; }
```

## Decision Trees

### Decision: container query or media query?

```
What does this rule depend on?

  Component-internal layout. The component sits in a sidebar (narrow) on one route
  and in the main column (wide) on another route, and its content rearranges.
    -> CONTAINER query. @container (width > X).
       Set container-type: inline-size on the component's outer element.

  Device-level layout. The whole page reorganises (sidebar collapses to drawer on mobile,
  the masthead changes height across breakpoints).
    -> MEDIA query. @media (width > X).
       The viewport is the right unit.

  Style choice driven by a custom property somewhere up the tree (theme, density preset).
    -> STYLE CONTAINER query. @container style(--theme: dark).
       The container-type can stay `normal` if size queries are not needed.

  User preference (reduced motion, color scheme, contrast).
    -> MEDIA query. @media (prefers-reduced-motion: reduce).
       These are environment-level, not container-level.
```

The rule of thumb: if the SAME component should render differently in a sidebar vs a hero, it is a container query. If the WHOLE PAGE changes structure, it is a media query.

### Decision: which `container-type` for this component?

```
Does the component's layout depend on its own height?
  yes -> container-type: size
         AND ensure the element has an intrinsic or explicit height
         (otherwise size containment collapses the layout).
  no  -> continue

Does the component's layout depend on its own width or inline size only?
  yes -> container-type: inline-size  (default for most components)
  no  -> continue

Are only style queries needed (no size queries at all)?
  yes -> container-type: normal
         Cheap; no containment overhead.
```

The default for any new component is `container-type: inline-size`. Pick `size` only when a height query is genuinely needed AND the element has a known height.

### Decision: why are my `cqi` units giant?

```
Is the element actually inside a container-type ancestor?
  no  -> the unit falls back to the small-viewport equivalent (svi).
         Add container-type: inline-size to the component's outer wrapper.
  yes -> continue

Is the cq* unit type compatible with the container-type?
  cqh / cqb / cqmin / cqmax used inside container-type: inline-size
    -> these units require container-type: size. They fall back to viewport units here.
       Either switch the ancestor to container-type: size, or use cqi / cqw only.
```

`cqi` and `cqw` work with `container-type: inline-size`. `cqh`, `cqb`, `cqmin`, `cqmax` require `container-type: size`. NEVER mix the two without checking the ancestor's `container-type`.

## Patterns

### Pattern: turning an element into a container

ALWAYS pair `container-type` on a PARENT with `@container` rules on its descendants.

```css
.card {
  container-type: inline-size;
}

.card-grid > * {
  /* Switch from vertical to horizontal layout when the card is wider than 400px. */
}

@container (width > 400px) {
  .card-grid > * {
    display: grid;
    grid-template-columns: 8rem 1fr;
    gap: 1rem;
  }
}
```

The container is `.card`. The query runs against the nearest ancestor `.card` for each `.card-grid > *` descendant. NEVER write `@container` rules that target the container element itself; the queried element MUST be a DESCENDANT of the element with `container-type`.

### Pattern: naming a container

Anonymous queries match the nearest ancestor with any `container-type`. Naming a container lets a descendant skip past an intermediate containment ancestor:

```css
.layout {
  container-name: layout;
  container-type: inline-size;
}

.card {
  container-name: card;
  container-type: inline-size;
}

/* Query the OUTER layout container, even though .card is a closer container. */
@container layout (width > 900px) {
  .card .meta { display: inline-flex; }
}

/* Query the inner card container. */
@container card (width > 400px) {
  .card { display: grid; grid-template-columns: 8rem 1fr; }
}
```

A descendant can carry multiple container names (`container-name: card, sidebar;`); a query then matches the nearest ancestor with that specific name. NEVER reuse the same name for unrelated container types; the query targets the nearest by name, not by type.

### Pattern: the `container` shorthand

```css
.card { container: card / inline-size; }
/* equivalent to */
.card {
  container-name: card;
  container-type: inline-size;
}
```

ALWAYS use the shorthand when both name and type are set; it keeps the relationship readable.

### Pattern: container query length units

Container query units let a component's typography, gap, and padding scale with its OWN width, not the viewport's:

```css
.card {
  container-type: inline-size;
  padding: 1cqi 2cqi;
  gap: 0.75cqi;
}

.card h2 {
  font-size: clamp(1rem, 4cqi, 1.75rem);
}
```

The `clamp()` around `4cqi` keeps the type usable at extreme widths. NEVER use `cqi` for `font-size` without a `clamp()` floor; very narrow containers will produce unreadable text.

If a `cq*` unit appears in a context where no ancestor container exists, the unit falls back to the equivalent small-viewport unit (`cqi` → `svi`). The fallback is silent. Diagnose by inspecting the resolved value in DevTools.

### Pattern: style container queries

Style container queries (Baseline 2025) match against the computed value of a custom property on the container. They do NOT require a `container-type: size` or `container-type: inline-size`; `normal` is sufficient.

```css
/* Mark a region as supporting a theme switch via custom property. */
.themed { container-type: normal; }

.themed[data-theme="dark"] { --theme: dark; }
.themed[data-theme="light"] { --theme: light; }

@supports (container-type: normal) {
  @container style(--theme: dark) {
    .card { background: #111; color: #eee; }
  }
  @container style(--theme: light) {
    .card { background: #fff; color: #111; }
  }
}
```

The custom property MUST be set on the container before the style query can match. Untyped custom properties match exactly: `style(--theme: dark)` matches only when the computed value of `--theme` is the bare token `dark`. For inherited tokens use `@property` to register the type. See `[[frontend-impl-design-tokens]]`.

NEVER ship a style container query without an `@supports` gate or feature detection. Baseline 2025 means older still-evergreen browsers may not support the rule and will silently drop the entire block.

### Pattern: comparing container queries to media queries

| Situation | Use |
|-----------|-----|
| Page-level layout (sidebar collapses, hero changes height across breakpoints) | media query |
| Component-internal layout (a card switches from stacked to horizontal at its own width) | container query |
| User preference (reduced motion, color scheme, contrast) | media query |
| Theme switch driven by a custom property anywhere in the tree | style container query |
| Component reused in narrow and wide slots without code changes | container query |

The same component MAY mix both: a media query for global font-size scaling and a container query for layout direction.

### Pattern: containment cost and `content-visibility`

`container-type: size` and `container-type: inline-size` both create a containment context (equivalent to applying `contain: layout` plus `contain: size` for `size`-type, or `contain: layout` plus `contain: inline-size` for `inline-size`-type). This isolates the subtree from layout invalidations outside it. See `[[frontend-core-architecture]]` Pattern: rendering pipeline in detail, and `[[frontend-perf-animation-gpu-containment]]` for the broader containment story.

For very large lists of containers, ALSO add `content-visibility: auto` plus `contain-intrinsic-size` to skip rendering offscreen items.

## Cross-references

- `[[frontend-core-architecture]]` for the rendering pipeline and the containment primitives.
- `[[frontend-core-web-standards-baseline]]` for Baseline gating of the 2025 style-query form.
- `[[frontend-syntax-css-cascade-layers-scope]]` for cascade interaction; container query rules participate in the cascade normally.
- `[[frontend-syntax-css-grid-subgrid]]` for grid layout primitives often paired with container queries.
- `[[frontend-impl-responsive-layout-fluid]]` for fluid typography with `clamp()` (often combined with `cqi`).
- `[[frontend-impl-design-tokens]]` for typed custom properties used with style container queries.
- `[[frontend-perf-animation-gpu-containment]]` for the containment cost model.

## Reference Links

- [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19)
- [MDN: @container](https://developer.mozilla.org/en-US/docs/Web/CSS/@container) (verified 2026-05-19)
- [MDN: container-type](https://developer.mozilla.org/en-US/docs/Web/CSS/container-type) (verified 2026-05-19)
- [W3C CSS Containment Module Level 3](https://www.w3.org/TR/css-contain-3/) (verified 2026-05-19)

Reference files local to this skill:

- `references/methods.md`: full property and at-rule surface, length-unit table with fallback rules, style query value-matching semantics.
- `references/examples.md`: framework-agnostic patterns including a card-grid example whose cards switch layout at `(width > 400px)`.
- `references/anti-patterns.md`: six anti-patterns with symptom, root cause, and fix.
