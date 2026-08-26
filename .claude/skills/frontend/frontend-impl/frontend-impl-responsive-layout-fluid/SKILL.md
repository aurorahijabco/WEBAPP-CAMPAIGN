---
name: frontend-impl-responsive-layout-fluid
description: >
  Use when building a layout that must look correct from 320px phones to 3840px ultrawide monitors without breakpoint cliffs, when fluid typography is needed so headings scale continuously between viewports instead of jumping at media-query breakpoints, when the same card or panel component must reflow inside both a narrow sidebar and a wide main column (a job for container queries, not media queries), when an iOS Safari hero with `100vh` clips behind the URL bar or jumps as the bar shrinks, when a card grid must adapt column count without enumerating pixel breakpoints, when an image or video needs to hold a proportional box before its content loads, or when a flex row's children overflow because each child carries a non-zero `min-width: auto`.
  Prevents the fixed-pixel-breakpoint cliff anti-pattern, viewport-unit traps on mobile (`100vh` clipping behind iOS URL bar), `clamp()` formulas whose `preferred` value resolves outside the `min`/`max` bracket and silently behaves like a constant, container queries that "do not work" because no ancestor has a `container-type`, `max-width: 100vw` overflow when a scrollbar widens the viewport, `flex-wrap` with default `min-width: auto` children blowing out the container, physical margin properties (`margin-left`, `margin-right`) that fail in RTL contexts, and unbounded fluid type that violates WCAG 1.4.4 200% zoom.
  Covers mobile-first authoring (`min-width` media queries only, progressive enhancement), the container-query-versus-media-query rule (component context = container query; viewport / device = media query), fluid typography via `clamp(min, preferred, max)` with the slope formula `clamp(MIN_REM, BASELINE_REM + SLOPE_VW, MAX_REM)`, the modern viewport-unit family (`vh` / `vw` / `vi` / `vb`, the `sv*` / `lv*` / `dv*` variants for mobile dynamic chrome), `aspect-ratio` for proportional sizing without padding-hack, intrinsic sizing keywords (`min-content`, `max-content`, `fit-content()`), CSS logical properties for RTL-safe spacing (`margin-block`, `margin-inline`, `padding-block`, `padding-inline`, `inset-block`, `inset-inline`), and the no-breakpoint-cliff principle (fluid first, breakpoints only where layouts MUST swap topology).
  Keywords: responsive layout, fluid layout, fluid typography, mobile-first, desktop-first, breakpoint, breakpoint cliff, clamp, viewport unit, vw, vh, vi, vb, dvh, dvw, svh, svw, lvh, lvw, dynamic viewport, small viewport, large viewport, container query, container-type, container-name, @container, cqi, cqw, cqh, cqb, cq unit, media query, min-width, max-width, aspect-ratio, intrinsic sizing, min-content, max-content, fit-content, logical properties, margin-block, margin-inline, padding-block, padding-inline, block-size, inline-size, inset-block, inset-inline, card grid, card layout, repeat auto-fill, repeat auto-fit, minmax, subgrid, flex-wrap, min-width 0, RTL, right-to-left, layout breaks on mobile, viewport bug iOS, viewport URL bar, breakpoint cliff, font too small on mobile, container does not adapt, container query not working, card wrapping wrong, how to make responsive layout, what is fluid typography, when to use container query, fluid font size, how do I make a responsive layout, modern responsive design, container queries vs media queries, card grid layout.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Impl Responsive Layout Fluid

This skill defines a deterministic rule set for building a layout that scales fluidly from phone to ultrawide WITHOUT enumerating dozens of breakpoints. The core idea : design the type and space as continuous functions of width, and reserve breakpoints for the rare case where a layout MUST swap topology (sidebar collapses to drawer, multi-column collapses to single-column). The skill builds on `[[frontend-syntax-css-container-queries]]` (the `@container` surface), `[[frontend-syntax-css-grid-subgrid]]` (track sizing and subgrid), and `[[frontend-syntax-css-nesting-logical-properties]]` (RTL-safe spacing).

Sources : [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (verified 2026-05-19), [MDN: viewport-percentage lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19), [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19), [MDN: aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) (verified 2026-05-19), [MDN: CSS Logical Properties and Values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19).

## Quick Reference

### Mobile-first authoring

ALWAYS author mobile-first with `min-width` media queries. Reasons :

1. The base CSS (no media query) is the smallest, simplest layout; progressively-enhanced rules add complexity only as viewport room allows.
2. `min-width` queries cascade naturally from small to large; the last matching rule wins.
3. Mobile-first CSS ships less code to the smallest devices (where bandwidth and CPU are tightest).

```css
.shell { display: block; }
@media (min-width: 768px)  { .shell { display: grid; grid-template-columns: 16rem 1fr; } }
@media (min-width: 1280px) { .shell { grid-template-columns: 16rem minmax(0, 72rem) 1fr; } }
```

NEVER use `max-width` queries as the default authoring direction; they invert the cascade and require subtracting rules for larger viewports.

### Container query vs media query

| Question | Use |
|----------|-----|
| Does the layout decision depend on the COMPONENT's own slot width (a card in a sidebar versus a card in main)? | Container query. |
| Does the layout decision depend on the VIEWPORT / device class (collapse the global nav on phones, swap the page topology)? | Media query. |
| Does the rule need to query a custom property (theme) rather than size? | Style container query (`@container style(--theme: dark)`). |
| Does the rule depend on a user preference (`prefers-reduced-motion`, `prefers-color-scheme`)? | Media query (the only one that exposes these). |

ALWAYS set `container-type: inline-size` on the PARENT slot of components you want to query; `container-type` on the queried element itself never matches (self-reference loop).

### Fluid typography with `clamp()`

```css
font-size: clamp(MIN, BASELINE_REM + SLOPE_VW, MAX);
```

| Part | Meaning |
|------|---------|
| `MIN` | The smallest allowed size. ALWAYS in `rem` so it scales with the user's root font size. |
| `BASELINE_REM + SLOPE_VW` | The fluid expression. Combine a small rem baseline with a small `vw` slope so the value grows with viewport. Add `cqi` instead of `vw` to make it container-driven. |
| `MAX` | The largest allowed size. MUST be at least 2x `MIN` per WCAG 1.4.4 to allow 200% browser zoom without breaking the design. |

```css
:root { font-size: clamp(1rem, 0.875rem + 0.25vw, 1.125rem); }
h1     { font-size: clamp(1.75rem, 1rem + 3vw, 3rem); }
```

Per [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (verified 2026-05-19), `clamp(MIN, VAL, MAX)` resolves as `max(MIN, min(VAL, MAX))`. Baseline Widely Available since July 2020.

### Modern viewport-unit family

Per [MDN: viewport-percentage lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19) :

| Family | Units | Behaviour on mobile |
|--------|-------|---------------------|
| Default | `vw`, `vh`, `vi`, `vb`, `vmin`, `vmax` | Currently equivalent to the `lv*` (large) variants in modern engines. May change. |
| Small | `svw`, `svh`, `svi`, `svb`, `svmin`, `svmax` | Smallest possible viewport (URL bar VISIBLE). Stable; safe for "always-visible" content. |
| Large | `lvw`, `lvh`, `lvi`, `lvb`, `lvmin`, `lvmax` | Largest possible viewport (URL bar HIDDEN). Stable; uses maximum space but content may be obscured. |
| Dynamic | `dvw`, `dvh`, `dvi`, `dvb`, `dvmin`, `dvmax` | Resizes as the URL bar shows/hides. NOT stable; can cause layout shift while scrolling. |

Rules :

- For a "fill the visible screen" hero where you must NEVER clip behind the URL bar : `min-height: 100svh`.
- For a "use every pixel including under the URL bar" splash : `min-height: 100lvh`.
- For exact viewport-following (modal full-screens, photo viewers) : `100dvh`, accepting the resize-on-scroll behaviour.
- Logical viewport units (`vi`, `vb`) are RTL-safe; use them when the writing mode varies.

### `aspect-ratio` for proportional sizing

```css
.media-card { width: 100%; aspect-ratio: 16 / 9; }
.media-card > img { width: 100%; height: 100%; object-fit: cover; }
```

Per [MDN: aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) (verified 2026-05-19), Baseline Widely Available since September 2021. At least ONE of `width` or `height` MUST be auto-derived for `aspect-ratio` to take effect; if both are set explicitly, the ratio is ignored.

### Logical properties (RTL-safe)

| Physical | Logical |
|----------|---------|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` (or the `margin-inline` shorthand) |
| `padding-top` / `padding-bottom` | `padding-block-start` / `padding-block-end` (or `padding-block`) |
| `width` | `inline-size` |
| `height` | `block-size` |
| `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| `border-left` / `border-right` | `border-inline-start` / `border-inline-end` |

ALWAYS prefer logical properties unless the design explicitly requires physical layout (e.g. a graphic with a hard-coded left arrow).

### Intrinsic sizing keywords

| Keyword | Effect |
|---------|--------|
| `min-content` | The smallest size the content can occupy without overflowing (longest word in a paragraph). |
| `max-content` | The size the content wants when laid out on one line. |
| `fit-content(<length>)` | The smaller of `max-content` and the available space, capped at `<length>`. |

Use `min-width: 0` on flex children that hold prose; the default `min-width: auto` resolves to `min-content` and prevents the child from shrinking smaller than its longest word.

## Decision Trees

### Decision : mobile-first or desktop-first?

```
Are you starting a new layout?
  yes -> MOBILE-FIRST. Author base CSS for the smallest viewport,
         add min-width media queries to enhance for larger.
  no  -> still mobile-first for new rules. When inheriting a
         desktop-first codebase, retro-fit gradually; do not flip
         direction in the middle of a refactor.

When does desktop-first ever make sense?
  Almost never for new work. The only edge case is a desktop-only
  internal tool that explicitly disallows mobile use; even then
  mobile-first costs nothing.
```

### Decision : container query or media query?

```
What does the layout rule depend on?

  The component's own slot width (card narrow in sidebar,
  card wide in main column).
    -> Container query. Set container-type: inline-size on the
       slot parent; query with @container.

  Global viewport size (collapse global nav, swap page topology).
    -> Media query. @media (min-width: 768px) ...

  A user preference (motion, color scheme, contrast).
    -> Media query. @media (prefers-reduced-motion: reduce) ...
       Container queries cannot express these.

  A theme custom property (--theme: dark inside one subtree).
    -> Style container query. @container style(--theme: dark).
```

### Decision : `dvh` versus `vh` versus `svh` for a hero?

```
What is the hero's purpose?

  Marketing splash where content MUST never be hidden behind
  mobile chrome.
    -> min-height: 100svh. Safe; possibly empty space when chrome
       retracts.

  Immersive full-screen viewer where every pixel matters.
    -> min-height: 100lvh. Maximises space; content can be obscured
       by chrome when it shows.

  Exact-fit modal that should track the visible viewport in real
  time.
    -> height: 100dvh. Accept the layout shift on scroll.

  Generic hero, no specific constraint.
    -> min-height: 100svh is the safer default. Reserves space for
       chrome conservatively.
```

### Decision : card grid layout?

```
How does the column count behave?

  Wraps based on a minimum card width; columns are determined by
  available row width.
    -> grid-template-columns: repeat(auto-fill, minmax(<min>, 1fr));
       Empty tracks reserve space. Use auto-fit if you want the
       remaining cards to stretch to fill instead.

  Each card adapts ITS OWN internal layout (vertical at narrow,
  horizontal at wide) regardless of how many columns the grid has.
    -> Container-queried card. Set container-type: inline-size on
       a wrapper around each card; @container inside the card
       responds to its own slot width.

  Both : the grid wraps AND each card adapts internally.
    -> Compose. Outer grid uses repeat(auto-fit, minmax(...));
       wrapper around each card has container-type: inline-size;
       card @container query switches its layout at its own
       threshold.
```

## Patterns

### Pattern 1 : fluid page with mobile-first shell

```css
.shell { display: grid; gap: 1rem; padding: clamp(1rem, 2vw, 2rem); }
@media (min-width: 768px) {
  .shell { grid-template-columns: 16rem 1fr; }
}
@media (min-width: 1280px) {
  .shell { grid-template-columns: 16rem minmax(0, 72rem) 1fr; }
}
```

Only TWO topology breakpoints; everything else is fluid.

### Pattern 2 : fluid typography scale

```css
:root {
  --step-0: clamp(1rem, 0.875rem + 0.25vw, 1.125rem);
  --step-1: clamp(1.125rem, 0.95rem + 0.5vw, 1.375rem);
  --step-2: clamp(1.5rem,  1rem + 1.5vw, 2rem);
  --step-3: clamp(2rem,    1.25rem + 2.5vw, 3rem);
  --step-4: clamp(2.5rem,  1.5rem + 4vw, 4.5rem);
}

p  { font-size: var(--step-0); }
h3 { font-size: var(--step-1); }
h2 { font-size: var(--step-2); }
h1 { font-size: var(--step-3); }
.display { font-size: var(--step-4); }
```

Each step has `MAX >= 2 x MIN` so 200% zoom still works (WCAG 1.4.4).

### Pattern 3 : container-queried card (full demo in examples.md)

```css
.card-slot { container-type: inline-size; }

.card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@container (min-width: 28rem) {
  .card {
    grid-template-columns: 12rem 1fr;
  }
}
```

The card swaps from vertical to horizontal when its slot exceeds 28rem (about 448px), independently of viewport size.

### Pattern 4 : aspect-ratio media card

```css
.media { width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 0.5rem; }
.media > img { width: 100%; height: 100%; object-fit: cover; display: block; }
```

The card reserves its proportional space before the image loads, preventing CLS.

### Pattern 5 : safe iOS-Safari hero

```css
.hero {
  min-height: 100svh;
  padding-block: clamp(2rem, 4vw, 4rem);
  padding-inline: clamp(1rem, 4vw, 4rem);
}
```

`100svh` reserves the smallest possible viewport, so content is never hidden behind the URL bar.

### Pattern 6 : RTL-safe spacing

```css
.toolbar { padding-inline: 1rem; gap: 0.5rem; display: flex; }
.toolbar > .primary { margin-inline-start: auto; }
```

In LTR the primary item floats right; in RTL it floats left automatically.

### Pattern 7 : intrinsic sizing for flex prose

```css
.row { display: flex; gap: 1rem; }
.row > * { min-width: 0; }
.row > .grow { flex: 1; }
```

`min-width: 0` resets the default `min-width: auto` on flex children that resolves to `min-content`; without it, long unbreakable words inflate the child past its `flex` allocation.

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md). Eight cataloged : pixel-breakpoint cliffs; `100vh` on mobile; `clamp()` with `preferred` outside `min`/`max`; container query without `container-type` on parent; `max-width: 100vw` overflow; `flex-wrap` without `min-width: 0`; physical margin in RTL; clamp `MAX < 2 x MIN` violating WCAG 1.4.4.

## Reference Links

- [Methods and signatures](references/methods.md) : `clamp()`, viewport-unit table, `@container` setup, `aspect-ratio`, logical properties, intrinsic sizing.
- [Examples](references/examples.md) : renderable HTML demo with container-queried card grid and fluid type; six additional patterns.
- [Anti-patterns](references/anti-patterns.md) : eight cataloged anti-patterns with symptom, root cause, and fix.

## Cross-references

- `[[frontend-syntax-css-container-queries]]` : full `@container` surface and `container-type` value matrix.
- `[[frontend-syntax-css-grid-subgrid]]` : Grid track sizing, named lines, subgrid for cross-card alignment.
- `[[frontend-syntax-css-nesting-logical-properties]]` : native nesting and logical properties details.
- `[[frontend-impl-typography-system]]` : modular type scale built on the fluid-step variables.
- `[[frontend-perf-animation-gpu-containment]]` : `content-visibility: auto` for long fluid documents.
