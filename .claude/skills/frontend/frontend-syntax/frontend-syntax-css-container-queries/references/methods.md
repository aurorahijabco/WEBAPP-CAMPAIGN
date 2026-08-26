# Methods : Frontend Syntax CSS Container Queries

Complete property and at-rule surface, length-unit table with fallback rules, style query value-matching semantics, and the cascade interaction model.

## Property surface

### `container-type`

Source: [MDN: container-type](https://developer.mozilla.org/en-US/docs/Web/CSS/container-type) (verified 2026-05-19).

| Value | Containment created | Queryable axis | Notes |
|-------|---------------------|----------------|-------|
| `normal` | none for size | none (size queries do not match); style queries DO match | Default. Use when only style queries are needed. |
| `inline-size` | inline-size + layout + paint + style containment | inline axis (width in horizontal-tb writing mode) | DEFAULT for components. |
| `size` | size + layout + paint + style containment | both axes | Requires explicit or intrinsic height on the element. |

Containment side-effects of `inline-size` and `size`:

- The element becomes a containing block for `position: absolute` and `position: fixed` descendants.
- The element establishes an independent formatting context (similar to a block formatting context).
- Layout invalidations inside the element do NOT cascade outside.

NEVER set `container-type: size` without an explicit height; the size containment collapses the element's intrinsic height to zero and the layout disappears.

### `container-name`

Optional identifier(s) for the container. Multiple names are space-separated:

```css
.layout { container-name: layout sidebar-host; }
```

A descendant `@container layout (width > X)` query targets the nearest ancestor whose `container-name` list contains `layout`.

`container-name` is case-sensitive and follows CSS identifier rules (no quoting, no leading digit).

### `container` shorthand

```css
.el { container: <container-name> / <container-type>; }
```

When `<container-type>` is omitted, it defaults to `normal`. When `<container-name>` is omitted, the container is anonymous.

| Long-hand | Shorthand |
|-----------|-----------|
| `container-name: card; container-type: inline-size;` | `container: card / inline-size;` |
| `container-name: layout, sidebar-host; container-type: size;` | `container: layout sidebar-host / size;` |

## At-rule surface : `@container`

Source: [MDN: @container](https://developer.mozilla.org/en-US/docs/Web/CSS/@container) (verified 2026-05-19) and [W3C CSS Containment Module Level 3](https://www.w3.org/TR/css-contain-3/) (verified 2026-05-19).

### Forms

```css
/* anonymous size query : nearest ancestor with any container-type */
@container (width > 600px) { ... }
@container (min-width: 600px) { ... }                    /* equivalent */
@container (orientation: landscape) { ... }
@container (aspect-ratio > 1) { ... }

/* named size query : nearest ancestor whose container-name matches */
@container card (width > 400px) { ... }

/* style query : runs against the nearest ancestor's computed property values */
@container style(--theme: dark) { ... }
@container style(--density: compact) and (width > 400px) { ... }
```

### Size feature surface

| Feature | Required `container-type` | Notes |
|---------|---------------------------|-------|
| `width`, `min-width`, `max-width` | `inline-size` or `size` | In horizontal-tb writing mode this is the inline axis. |
| `height`, `min-height`, `max-height` | `size` | NEVER matches under `inline-size`. |
| `inline-size`, `block-size` | `inline-size` (inline) or `size` (block requires size) | Logical equivalents. |
| `aspect-ratio` | `size` | Requires both axes to be queryable. |
| `orientation` | `size` | Resolves to `portrait` when block > inline, `landscape` otherwise. |

### Logical operators

```css
@container (width > 400px) and (width < 800px) { ... }
@container (width > 400px) or (orientation: landscape) { ... }
@container not (width > 400px) { ... }
```

`and`, `or`, `not` follow Media Queries Level 4 grammar.

### Style query value-matching semantics

Source: [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19), style queries section.

| Author wrote | Matches when |
|--------------|--------------|
| `style(--theme: dark)` | the computed value of `--theme` is exactly the token `dark` |
| `style(--theme)` | the computed value of `--theme` is anything other than the property's initial value |
| `style(--density: compact)` | exact token match |

Untyped custom property comparison is by serialised value, not by parsed type. To compare numerically (e.g. `style(--scale > 1)`), the custom property MUST be registered via `@property` with `syntax: "<number>"` or similar.

```css
@property --scale {
  syntax: "<number>";
  inherits: true;
  initial-value: 1;
}

@container style(--scale > 1.25) { ... }
```

See `[[frontend-impl-design-tokens]]` for `@property`-typed custom properties.

## Container query length units

Source: [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19).

| Unit | Resolves to | Requires container-type |
|------|-------------|--------------------------|
| `cqw` | 1% of the query container's WIDTH | `inline-size` or `size` |
| `cqh` | 1% of the query container's HEIGHT | `size` |
| `cqi` | 1% of the query container's INLINE size | `inline-size` or `size` |
| `cqb` | 1% of the query container's BLOCK size | `size` |
| `cqmin` | smaller of `cqi` and `cqb` | `size` (since `cqb` is required) |
| `cqmax` | larger of `cqi` and `cqb` | `size` (since `cqb` is required) |

### Fallback rules

When a `cq*` unit is used in a context where no matching ancestor container exists, the renderer falls back as follows:

| Unit | Fallback |
|------|----------|
| `cqw` | `svw` (small-viewport width) |
| `cqh` | `svh` (small-viewport height) |
| `cqi` | `svi` (small-viewport inline size) |
| `cqb` | `svb` (small-viewport block size) |
| `cqmin` | `svmin` |
| `cqmax` | `svmax` |

The fallback is silent. Symptom: a `1cqi` value that resolves to 1% of the viewport instead of 1% of the intended parent. Fix: ensure an ancestor has `container-type: inline-size` (or `size`).

## Cascade interaction

`@container` rules participate in the normal cascade. The rules INSIDE an `@container` block share the specificity of their selectors plus the specificity of the at-rule (zero). The at-rule does NOT inflate specificity.

```css
/* Specificity (0,1,0) */
@container (width > 400px) {
  .card { padding: 2rem; }
}

/* Specificity (0,2,0). Wins on tie. */
.card.is-featured { padding: 3rem; }
```

When multiple `@container` rules match the same element, the standard cascade (origin, importance, specificity, source order) decides. Inside `@layer` blocks, layer order applies first.

## Browser support summary

- Container queries (size queries with `inline-size` and `size`): Baseline Widely Available since 2023.
- Container query length units (`cq*`): Baseline Widely Available since 2023.
- Named containers: Baseline Widely Available since 2023.
- Style container queries: Baseline 2025 (Newly Available). MUST be gated with `@supports` for non-Baseline-2025 evergreen browsers.

Verify current status at the Baseline source: [web.dev: Baseline](https://web.dev/baseline) and the feature page on [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19).

## Diagnostic checklist

When a container query does not match:

1. Verify the element being styled is a DESCENDANT of the element with `container-type` (never the same element).
2. Verify the `container-type` matches the queried axis (`inline-size` for width queries, `size` for height/aspect-ratio queries).
3. For named queries: verify the ancestor's `container-name` actually contains the queried name (case-sensitive).
4. Open DevTools and inspect the resolved value of any `cq*` unit; if it equals the viewport equivalent, the container ancestor is missing.
5. For style queries: verify the custom property's computed value on the container is exactly what the query expects, and confirm the browser supports style queries (Baseline 2025).
