# Methods : Frontend Core Architecture

Complete property-to-rendering-stage map, layer surface tables, and spec lookup index.

## Property-to-rendering-stage map

The renderer triggers stages in cascade. A change at any stage forces every subsequent stage.

### Composite-only properties (cheapest)

| Property | Stage |
|----------|-------|
| `transform` (translate, scale, rotate, skew, matrix) | Composite |
| `opacity` | Composite |
| `filter` (when promoted) | Composite |
| `backdrop-filter` (when promoted) | Composite |

Animating only these properties on a promoted layer skips Style, Layout, and Paint. This is the only safe class for high-frequency animation. Source: [MDN: CSS contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19).

### Paint-triggering properties

| Property | Stage |
|----------|-------|
| `color` | Paint |
| `background-color` | Paint |
| `background-image` | Paint |
| `box-shadow` | Paint |
| `border-color` | Paint |
| `border-style` | Paint |
| `border-radius` | Paint |
| `text-decoration-color` | Paint |
| `outline-color` | Paint |
| `visibility` | Paint |

These changes invalidate the painted layer but skip Layout. Acceptable for state transitions (hover, focus). Avoid for continuous per-frame animation.

### Layout-triggering properties

| Property | Stage |
|----------|-------|
| `width`, `height`, `min-width`, `max-width`, `min-height`, `max-height` | Layout |
| `margin`, `margin-block`, `margin-inline` (any side) | Layout |
| `padding`, `padding-block`, `padding-inline` (any side) | Layout |
| `top`, `right`, `bottom`, `left`, `inset` | Layout |
| `border-width`, `border-block-width`, `border-inline-width` | Layout |
| `display` | Layout |
| `position` | Layout |
| `float`, `clear` | Layout |
| `font-size`, `font-family`, `font-weight`, `line-height` | Layout |
| `text-align`, `text-indent` | Layout |
| `vertical-align` | Layout |
| `white-space` | Layout |
| `flex-basis`, `flex-grow`, `flex-shrink`, `flex-direction`, `flex-wrap` | Layout |
| `grid-template-*`, `grid-area`, `grid-row`, `grid-column`, `gap` | Layout |
| `align-items`, `align-content`, `justify-items`, `justify-content` | Layout |
| `writing-mode`, `direction` | Layout |
| `aspect-ratio` | Layout |

These changes invalidate Layout and force re-Paint and re-Composite. NEVER animate these per frame. Replace `width` with `transform: scaleX()`, replace `top`/`left` with `transform: translate()`.

### Style-recompute-only properties

| Property | Stage |
|----------|-------|
| Custom property (`--name`) changes, untyped | Style |
| Custom property changes, typed via `@property` with transition | Composite (when typed and the value type is interpolable on the compositor) |

A custom property change re-runs the cascade for any rule that consumes it. Typed `@property` with `inherits: false` and a numeric or color value type can transition on the compositor. Untyped custom properties NEVER transition (they jump between values).

## Containment primitives

### `contain` values

| Value | Effect |
|-------|--------|
| `none` | No containment. Default. |
| `layout` | The element's layout cannot affect or be affected by outside layout. Forces a new block formatting context. |
| `paint` | Descendants cannot paint outside the element's box. Acts as a stacking context. |
| `size` | The element's size is computed without measuring its contents. Requires explicit size. |
| `style` | Effects of certain CSS properties (counter increments, quotes) do not escape the element. |
| `inline-size` | Like `size` but only for the inline axis. |
| `strict` | Equivalent to `layout paint size`. |
| `content` | Equivalent to `layout paint style`. |

`contain` is Baseline Widely Available. Use `contain: content` for cards, list items, panels. Use `contain: strict` plus explicit dimensions for known-size virtualized rows. Source: [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19).

### `content-visibility` values

| Value | Effect |
|-------|--------|
| `visible` | Default. The element renders normally. |
| `auto` | The browser skips rendering work (style, layout, paint) for the element when it is offscreen. Equivalent to `contain: content` plus skipping render. |
| `hidden` | Stronger skip; preserves rendering state but never paints. Similar to `display: none` but cheaper to flip back. |

`content-visibility: auto` paired with `contain-intrinsic-size` gives near-zero render cost for offscreen content. Source: [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19).

## Markup layer : authored surface

The markup layer is authored as HTML5. The parser produces the DOM tree. Source: [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/) (verified 2026-05-19).

| Element class | Examples | Purpose |
|---------------|----------|---------|
| Document landmarks | `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section>`, `<article>`, `<search>` | Accessibility tree mapping, region navigation |
| Content sectioning | `<h1>`-`<h6>`, `<hgroup>`, `<address>` | Outline, heading hierarchy |
| Text content | `<p>`, `<ol>`, `<ul>`, `<li>`, `<dl>`, `<dt>`, `<dd>`, `<blockquote>`, `<pre>`, `<figure>`, `<figcaption>` | Prose, lists, quoted blocks |
| Inline text | `<a>`, `<em>`, `<strong>`, `<code>`, `<kbd>`, `<samp>`, `<var>`, `<mark>`, `<time>`, `<abbr>`, `<dfn>` | Semantic inline |
| Embedded content | `<img>`, `<picture>`, `<video>`, `<audio>`, `<source>`, `<track>`, `<iframe>` | External media |
| Interactive | `<dialog>`, `<details>`, `<summary>`, native `<input>`/`<select>`/`<textarea>`, `<button>`, `<form>` | User interaction with native semantics |
| Scripting | `<script>`, `<noscript>`, `<template>`, `<slot>` | JavaScript, declarative templates |

The full element surface lives in `[[frontend-syntax-html5-semantic]]` and `[[frontend-syntax-html5-form]]`.

## Style layer : feature surface

The style layer is authored as CSS. The CSSOM is the result of parsing all stylesheets. Each CSS module is specified separately by the W3C CSS Working Group; consult W3C TR for normative text.

| CSS module group | Skill that covers it |
|------------------|----------------------|
| Cascade, scope, layers, nesting | `[[frontend-syntax-css-cascade-layers-scope]]`, `[[frontend-syntax-css-nesting-logical-properties]]` |
| Container queries | `[[frontend-syntax-css-container-queries]]` |
| Relational selector `:has()` | `[[frontend-syntax-css-has-selector]]` |
| Color (`oklch`, `color-mix`, `light-dark`, relative color) | `[[frontend-syntax-css-color-modern]]` |
| Grid, subgrid | `[[frontend-syntax-css-grid-subgrid]]` |
| Logical properties | `[[frontend-syntax-css-nesting-logical-properties]]` |
| Containment, content-visibility | `[[frontend-perf-animation-gpu-containment]]` |
| `@property` typed customs | `[[frontend-impl-design-tokens]]` |

## Behavior layer : Web API surface (rendering-relevant)

The behavior layer authors against ECMAScript and Web APIs. Rendering-relevant APIs from MDN Web APIs (verified 2026-05-19 against [MDN: Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)):

| API | Purpose | Pipeline interaction |
|-----|---------|----------------------|
| `requestAnimationFrame(cb)` | Schedule a callback to run before the next frame paint. | Runs synchronously before Style on the main thread. |
| `requestIdleCallback(cb)` | Schedule low-priority work in browser idle periods. | Yields to render budget. |
| `IntersectionObserver` | Notify when a target enters or leaves a viewport or root. | Reads precomputed Layout state, does not force layout. |
| `ResizeObserver` | Notify when an observed element's content or border box changes size. | Reads Layout state, does not force layout. |
| `MutationObserver` | Notify when the DOM tree mutates. | Runs as a microtask after the mutation. |
| `getBoundingClientRect()` | Returns the element's bounding rectangle relative to the viewport. | Forces synchronous Layout if Layout is invalidated. |
| `offsetWidth`, `offsetHeight`, `scrollTop`, `clientHeight` | Read layout-derived geometry. | Forces synchronous Layout if invalidated. |
| `getComputedStyle(el)` | Returns the resolved style of an element. | Forces synchronous Style; can force Layout for layout-dependent computed values. |
| `Element.animate(keyframes, options)` | Web Animations API. | Compositor-only when keyframes target only `transform`, `opacity`, `filter`. |
| `document.startViewTransition(updateCb)` | View Transitions API (same-document). | Snapshots old and new pixels; animates between them on the compositor. |

ALWAYS batch reads then writes when scripting layout. Reading `offsetWidth` after a write forces a synchronous layout (layout thrash). See `[[frontend-errors-animation-jank]]` and `[[frontend-perf-core-web-vitals-inp]]`.

## Animation-timeline layer : timelines

| Timeline source | API | Baseline status |
|-----------------|-----|-----------------|
| Document time | CSS `transition`, CSS `@keyframes` + `animation`, `Element.animate()` | Widely Available |
| Document time, declarative cross-state | View Transitions API (same-document) | Baseline 2024 Newly |
| Cross-document navigation | View Transitions API (cross-document) | Baseline 2025 Newly |
| Scroll progress | CSS `animation-timeline: scroll()` | Baseline 2025 (selective) |
| Element-in-viewport progress | CSS `animation-timeline: view()` | Baseline 2025 (selective) |

Version matrix: see `[[frontend-core-web-standards-baseline]]` for the canonical Baseline matrix and gating rules.

## Spec-to-MDN cross-reference index

When verifying a claim:

| Normative source | MDN entry pattern |
|------------------|-------------------|
| WHATWG HTML LS section | `MDN: <Element name>` or `MDN: <attribute name>` |
| WHATWG DOM LS section | `MDN: Web APIs > <Interface>` |
| W3C CSS Module Level N | `MDN: <property or at-rule>` |
| W3C WAI-ARIA 1.2 | `MDN: ARIA > <role>` or `MDN: ARIA > <state-or-property>` |
| W3C WAI WCAG 2.2 | `MDN: Accessibility > <topic>` or W3C Understanding doc |

When MDN and the underlying normative source disagree, the normative source wins. Log the discrepancy in the project LESSONS.md so peers can verify.

## Glossary

- **DOM**: the tree of nodes produced by parsing HTML. Normative reference: WHATWG DOM Living Standard.
- **CSSOM**: the tree of style sheets, rules, and computed-style entries produced by parsing CSS.
- **Render tree**: the subset of the DOM that has computed styles and is laid out. Pseudo-elements live here, `display: none` elements do not.
- **Layout (reflow)**: the stage that resolves box geometry from the render tree.
- **Paint**: the stage that rasterizes elements into one or more layers.
- **Composite**: the stage that combines layers into the final frame on the GPU.
- **Forced sync layout (layout thrash)**: reading a Layout-dependent property mid-frame after a write, forcing the browser to flush Layout immediately.
- **Baseline**: the web-platform-dx feature-status taxonomy (Limited, Newly Available, Widely Available). Source: [web.dev: Baseline](https://web.dev/baseline) (verified 2026-05-19).
- **Evergreen browser**: a browser that auto-updates to the current stable version (Chrome, Firefox, Safari, Edge today).
- **Promoted layer**: an element that the compositor has placed on its own GPU layer. Created automatically by certain CSS properties (`transform: translateZ(0)`, `will-change`, `position: fixed`, `filter`).
