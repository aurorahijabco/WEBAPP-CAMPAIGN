# Methods : responsive layout + fluid sizing

Sources : [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (verified 2026-05-19), [MDN: viewport-percentage lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19), [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19), [MDN: aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) (verified 2026-05-19), [MDN: CSS Logical Properties and Values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19).

## 1. `clamp(min, preferred, max)`

```
clamp( <calculation>, <calculation>, <calculation> )
```

Resolves as `max(MIN, min(VAL, MAX))`. Baseline Widely Available since July 2020.

| Aspect | Detail |
|--------|--------|
| Accepted value types | `<length>`, `<percentage>`, `<number>`, `<integer>`, `<angle>`, `<time>`, `<frequency>`. Math expressions via `calc()`, `min()`, `max()` allowed. |
| Pitfall | If `preferred` resolves outside `[min, max]`, the property silently behaves like a constant (the bound it hits). Verify edge viewports. |
| Accessibility | For text sizing, ensure `MAX >= 2 x MIN` (WCAG 1.4.4 Resize Text requires 200% zoom without loss of function). |

### Fluid typography slope formula

```
font-size: clamp(MIN, BASELINE_REM + SLOPE_VW, MAX);

Slope solved for two anchor points (MIN at viewport WMIN, MAX at viewport WMAX):
  SLOPE_VW = ((MAX - MIN) / (WMAX - WMIN)) * 100   /* vw value */
  BASELINE_REM = MIN - SLOPE_VW * WMIN / 100

Convert px to rem (assuming 16px root) by dividing by 16.
```

In practice, write the values by hand for the standard step sizes and verify visually. The web has many online generators; verify the output against `MAX >= 2 x MIN` before shipping.

## 2. Viewport-percentage units

Per [MDN: viewport-percentage lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19).

| Unit family | Members | Behaviour |
|-------------|---------|-----------|
| Default | `vw`, `vh`, `vi`, `vb`, `vmin`, `vmax` | Currently equivalent to the `lv*` family in modern engines. Implementation-defined; may change. |
| Small | `svw`, `svh`, `svi`, `svb`, `svmin`, `svmax` | Sized for the SMALLEST possible viewport (mobile URL bar visible). Stable. |
| Large | `lvw`, `lvh`, `lvi`, `lvb`, `lvmin`, `lvmax` | Sized for the LARGEST possible viewport (mobile URL bar hidden). Stable. |
| Dynamic | `dvw`, `dvh`, `dvi`, `dvb`, `dvmin`, `dvmax` | Resizes as the mobile chrome shows / hides. NOT stable; can cause layout shift while scrolling. |

`vi` and `vb` are LOGICAL : `vi` is the inline axis of the root element's writing mode (horizontal in default LTR/TB), `vb` is the block axis (vertical). Prefer `vi` / `vb` when the writing mode varies.

`vmin` is the smaller of `vw` / `vh`; `vmax` is the larger. Useful for elements whose size should track whichever axis is smaller (square play buttons centred on rotation-capable devices).

## 3. Container queries

Per [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19). Baseline Widely Available 2023.

### `container-type`

| Value | Queryable | Cost |
|-------|-----------|------|
| `normal` | nothing for size; style queries still work | lowest |
| `inline-size` | inline-axis only | low; creates an inline-size containment context |
| `size` | both axes | higher; creates full size containment; requires intrinsic or explicit size |

ALWAYS set `container-type` on a PARENT of the elements you want to style; setting it on the queried element itself causes a self-reference loop and the query NEVER matches.

### `@container` forms

```css
@container (width > 600px) { ... }                  /* anonymous */
@container sidebar (width > 600px) { ... }          /* named */
@container style(--theme: dark) { ... }             /* style query */
```

### Container query length units

| Unit | Resolves to |
|------|-------------|
| `cqw` | 1% of the container's WIDTH |
| `cqh` | 1% of the container's HEIGHT (requires `container-type: size`) |
| `cqi` | 1% of the container's INLINE size (logical, safe default) |
| `cqb` | 1% of the container's BLOCK size (requires `container-type: size`) |
| `cqmin` | smaller of `cqi` / `cqb` |
| `cqmax` | larger of `cqi` / `cqb` |

When no ancestor container exists for a `cq*` unit, the unit falls back to the equivalent small-viewport unit (`cqi` -> `svi`, `cqw` -> `svw`).

## 4. `aspect-ratio`

Per [MDN: aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) (verified 2026-05-19). Baseline Widely Available since September 2021.

```
aspect-ratio: auto;
aspect-ratio: 1 / 1;
aspect-ratio: 16 / 9;
aspect-ratio: 0.5;          /* height defaults to 1; same as 0.5 / 1 */
aspect-ratio: auto 3 / 4;   /* fallback to 'auto' for replaced elements with intrinsic ratio */
```

| Rule | Detail |
|------|--------|
| Effect | The element's missing dimension is computed from the present one and the ratio. |
| Requirement | At least one of `width` / `height` MUST be `auto` (or absent); both explicit overrides the ratio. |
| Replaced elements (`<img>`, `<video>`) | The `auto` keyword preserves the intrinsic ratio; `auto <ratio>` provides a fallback while loading. |

Use case : prevent CLS by reserving proportional space before media loads.

## 5. Intrinsic sizing keywords

| Keyword | Value |
|---------|-------|
| `min-content` | Smallest content can occupy without overflow (longest unbreakable token). |
| `max-content` | Width / height the content wants on a single line. |
| `fit-content(<length>)` | `max-content` capped at `<length>`. Without the argument (`fit-content`), capped at the available space. |
| `auto` (on a flex child's `min-width`) | Resolves to `min-content`. THIS is the cause of "flex children blow out the container" when content has long tokens. Reset to `min-width: 0`. |

## 6. Logical properties cheat-sheet

Per [MDN: CSS Logical Properties and Values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19).

| Physical | Logical |
|----------|---------|
| `width` | `inline-size` |
| `height` | `block-size` |
| `min-width` / `max-width` | `min-inline-size` / `max-inline-size` |
| `min-height` / `max-height` | `min-block-size` / `max-block-size` |
| `margin-top` / `margin-bottom` / `margin-left` / `margin-right` | `margin-block-start` / `margin-block-end` / `margin-inline-start` / `margin-inline-end` (or `margin-block`, `margin-inline` shorthand) |
| `padding-*` | `padding-block-*` / `padding-inline-*` (and the shorthands) |
| `border-*` | `border-block-*` / `border-inline-*` |
| `top` / `bottom` / `left` / `right` | `inset-block-start` / `inset-block-end` / `inset-inline-start` / `inset-inline-end` (or `inset-block`, `inset-inline` shorthand) |
| `border-radius` corners | `border-start-start-radius`, `border-start-end-radius`, `border-end-start-radius`, `border-end-end-radius` |

Float `inline-start` / `inline-end` replace `left` / `right` for the `float` property.

Logical units : `vi` / `vb` / `cqi` / `cqb` (covered above) and the percentage unit on an element with `writing-mode: vertical-*` correctly references the block-axis dimension.

## 7. Mobile-first authoring pattern

```css
/* Base : smallest viewport */
.layout { display: block; padding: 1rem; }

/* Tablet and up */
@media (min-width: 768px) {
  .layout {
    display: grid;
    grid-template-columns: 16rem 1fr;
    padding: 2rem;
  }
}

/* Desktop and up */
@media (min-width: 1280px) {
  .layout { grid-template-columns: 16rem minmax(0, 72rem) 1fr; }
}
```

Rules :

- NEVER use `max-width` queries as the authoring direction; they invert the cascade.
- Limit topology breakpoints to 2-3 in a typical page; rely on `clamp()` and container queries for the rest.
- Avoid hardware-class names (`@media phone`, `@media desktop`); query the property (`min-width`) directly.

## 8. Card grid recipes

```css
/* Auto-fill : reserve space for "missing" cards */
.grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); }

/* Auto-fit : remaining cards stretch to fill */
.grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }

/* Container-queried per-card layout */
.slot { container-type: inline-size; }
.card { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@container (min-width: 28rem) { .card { grid-template-columns: 12rem 1fr; } }
```

The outer grid handles column count; the inner container query handles per-card layout. Mix or use independently.

## 9. WCAG 1.4.4 Resize Text constraint

Browsers must be able to scale text to at least 200% without loss of content or function. For `clamp()`-based fluid type :

- The `MAX` MUST be at least 2 x the `MIN`.
- `font-size` SHOULD be expressed in `rem` (relative to root font size) so user-controlled root scaling works.
- NEVER use `font-size` in `px`; this disables some user-zoom strategies on some platforms.

## 10. CSS pixel vs hardware pixel

A CSS pixel is independent of physical pixel density (devicePixelRatio). Media queries and viewport units use CSS pixels. Authors do not need to multiply by devicePixelRatio for layout work; the engine handles it.
