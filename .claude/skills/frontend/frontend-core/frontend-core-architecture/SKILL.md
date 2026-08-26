---
name: frontend-core-architecture
description: >
  Use when starting a frontend project, picking a stack, deciding where a feature belongs in the codebase, or diagnosing why a page is slow, janky, or visually unstable.
  Prevents premature bundling of small zero-build sites, animating non-compositor properties that drop frames, polyfilling features that are already Baseline Widely Available, and treating MDN as authoritative when MDN and the underlying specification disagree.
  Covers the four authoring layers of the web platform (markup, style, behavior, animation-timeline), spec lookup discipline across WHATWG, W3C, MDN, and web.dev, the browser rendering pipeline from DOM construction through compositing, build-step versus runtime trade-offs for evergreen-2026 browsers, and the compositor-only animation rule.
  Keywords: DOM, CSSOM, render tree, style computation, layout, reflow, paint, composite, compositor, will-change, contain, content-visibility, WHATWG, W3C, BCD, ESM, native modules, import maps, transform, opacity, filter, Baseline, evergreen, slow page, scroll stutter, jank, frame drop, dropped frames, layout shift, paint storm, forced sync layout, choppy animation, laggy scroll, blank screen, how do I start a frontend project, what frontend stack should I use, do I need a build step, what is the browser rendering pipeline, why is my animation laggy, where should this code live, which CSS property is fastest, can I ship without bundling.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Core Architecture

This skill defines the platform model every other frontend skill builds on. It splits the web platform into four authoring layers, fixes a deterministic spec lookup order, maps each CSS and DOM operation onto the browser rendering pipeline, and sets the rules for when a build step is required versus harmful.

The skill is framework-agnostic. It targets the evergreen-2026 baseline (Chrome, Firefox, Safari, Edge current stable). Features at Baseline 2024 status MUST work without polyfill. Features at Baseline 2025 status MUST be gated via `@supports` or runtime feature detection.

## Quick Reference

### The four authoring layers

| Layer | Spec home | What lives here | Output of layer |
|-------|-----------|-----------------|-----------------|
| Markup | WHATWG HTML Living Standard | Document structure, semantics, landmarks, native controls | DOM tree |
| Style | W3C CSS Working Group (TR + ED) | Cascade, layout, color, typography, scope, container queries | CSSOM, render tree |
| Behavior | ECMAScript + WHATWG DOM + Web APIs | Event handling, data fetching, observers, custom elements | Mutations to DOM and CSSOM |
| Animation/timeline | CSS animations, View Transitions API, scroll-driven animations | Time-based and scroll-driven choreography | Compositor layers |

Verified against [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/) (verified 2026-05-19) and [web.dev: Baseline](https://web.dev/baseline) (verified 2026-05-19).

### The rendering pipeline stages

| Stage | Input | Output | Triggered by changes to |
|-------|-------|--------|-------------------------|
| Parse HTML | bytes | DOM | document mutations, `innerHTML`, parser |
| Parse CSS | bytes | CSSOM | stylesheet load, `CSSStyleSheet`, `@import` |
| Style | DOM + CSSOM | render tree with computed styles | any selector match change, custom property change |
| Layout | render tree | box geometry | `width`, `height`, `margin`, `padding`, `top`/`left`, font metrics, content size |
| Paint | box geometry + styles | raster commands per layer | `color`, `background`, `box-shadow`, `border-radius`, `text-decoration` |
| Composite | painted layers | screen pixels | `transform`, `opacity`, `filter` (when promoted) |

A property that triggers Layout forces re-Paint and re-Composite. A property that triggers only Composite skips Layout and Paint. See `references/methods.md` for the full property-to-stage map.

### Spec lookup order

1. WHATWG Living Standard for HTML and DOM behavior questions.
2. W3C TR drafts for CSS feature definitions and selector syntax.
3. MDN Web Docs as canonical secondary reference with BCD-backed compatibility tables.
4. web.dev for Chrome-team applied guidance (Core Web Vitals, INP optimization, Baseline status).

When MDN and a Living Standard disagree, the Living Standard wins. MDN tracks BCD, not normative spec text, so MDN can lag spec updates by weeks.

## Decision Trees

### Decision: do I need a build step?

```
Is the project authored in TypeScript?
  yes -> build step REQUIRED (tsc or esbuild or swc)
  no  -> continue

Does the project import code from npm packages that are not pre-bundled ESM?
  yes -> build step REQUIRED (Vite, Rollup, esbuild, or Parcel)
  no  -> continue

Does the project ship more than 20 source modules?
  yes -> build step RECOMMENDED for bundling, tree-shaking, and code splitting
  no  -> continue

Does the project use PostCSS plugins for Limited Availability CSS features?
  yes -> build step REQUIRED
  no  -> continue

Default: NO build step.
  Ship raw `.html`, `.css`, and `.js` files.
  Use `<script type="module" src="...">` for native ES module loading.
  Use an import map (`<script type="importmap">`) to map bare specifiers to URLs.
```

A build step is justified ONLY by the four conditions above. Building a vanilla site that imports 4 modules adds a 3-second build cycle for no benefit and adds a source-map deployment surface.

### Decision: which layer does this requirement belong to?

```
Is the requirement about document structure, semantics, landmarks, or native form controls?
  yes -> Markup layer (HTML5). Author in HTML, no CSS or JS solves it correctly.

Is the requirement about visual appearance, layout, color, typography, or stateful styling like hover and focus?
  yes -> Style layer (CSS). Reach for JS ONLY when CSS lacks a selector for the state.

Is the requirement about data fetching, event handling, mutation observation, or running logic in response to user input?
  yes -> Behavior layer (JS + Web APIs). Use the smallest Web API that fits; do not reach for a library.

Is the requirement about choreographing change over time (enter / exit animations, scroll-tied effects, view transitions between routes)?
  yes -> Animation/timeline layer. Prefer declarative CSS (`transition`, `@keyframes`, scroll-driven animations) over JS animation loops.
```

Place each requirement in the lowest possible layer. Promote to a higher layer ONLY when the lower layer cannot express the requirement.

### Decision: is this animation safe for 60 fps?

```
Which CSS properties are being animated?
  transform, opacity, filter -> SAFE. Compositor-only. Promote to its own layer with `will-change`
                                or by writing the animation against these properties.
  
  width, height, margin, padding, top, left, right, bottom -> UNSAFE.
                                Triggers Layout every frame. Replace with `transform: translate()`
                                or `transform: scale()`.
  
  color, background, box-shadow, border-radius -> SLOW but does not jank as easily.
                                Triggers Paint, not Layout. Acceptable for non-continuous transitions;
                                avoid for scroll-tied or per-frame loops.
  
  Mixed (transform + width) -> UNSAFE. The Layout-trigger dominates. Refactor to animate only transform.
```

Compositor-only animations run on the GPU thread independently of the main thread and survive a busy main thread without dropped frames.

## Patterns

### Pattern: the markup layer (HTML5)

The markup layer is the foundation. The DOM tree produced by HTML parsing is the input to the style layer, the behavior layer, and the accessibility tree.

ALWAYS author with semantic landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<article>`, `<section>`, `<search>`) before reaching for `<div role="...">`. Native semantics give correct accessibility tree mapping for free. The `<search>` element is Baseline Widely Available since October 2023 and has implicit ARIA role `search`. NEVER add `role="search"` to `<form>` when `<search>` is available.

ALWAYS prefer native controls (`<dialog>`, `<details>`, `<input type="...">`, `<select>`) over reimplementations. Native controls get correct focus management, keyboard interaction, and platform integration without script. See `[[frontend-syntax-html5-semantic]]` and `[[frontend-syntax-html5-form]]` for the full surface.

NEVER serve raw text outside an element. NEVER nest interactive elements (no `<button>` inside `<a>`, no `<a>` inside `<button>`). NEVER use `<br>` for vertical spacing; that is a style-layer concern.

### Pattern: the style layer (CSS)

The style layer expresses both visual rules and structural decisions (layout, scoping, theming, conditional appearance). In 2026, CSS handles cases that previously required JavaScript:

- `:has()` for parent and sibling selection, replacing `MutationObserver` patterns that added or removed classes based on descendant presence.
- `@container` queries for component-driven responsive design, replacing `ResizeObserver` patterns that toggled classes based on element width.
- `@scope` for low-specificity component-scoped rules, replacing BEM naming conventions.
- `light-dark()` and `color-mix()` for theme synthesis, replacing custom-property runtime computation.

ALWAYS reach for a CSS feature before adding JavaScript for the same effect. See `[[frontend-syntax-css-cascade-layers-scope]]`, `[[frontend-syntax-css-container-queries]]`, `[[frontend-syntax-css-has-selector]]`, and `[[frontend-syntax-css-color-modern]]` for syntactic detail.

### Pattern: the behavior layer (JS + Web APIs)

The behavior layer mutates the DOM and the CSSOM in response to events, data, and time. In 2026 the standard Web API surface covers most cases without a library:

- `fetch()` plus `AbortController` for HTTP.
- `IntersectionObserver`, `ResizeObserver`, `MutationObserver` for declarative observation of layout-relevant state.
- `structuredClone()` for deep cloning, replacing the `JSON.parse(JSON.stringify(...))` anti-pattern.
- `Object.groupBy()` and `Map.groupBy()` for grouping list data before render.
- `Promise.withResolvers()` for deferred-resolution patterns across event handlers.

ALWAYS handle errors at the boundary where the failure is meaningful (fetch error, parse error, validation error). NEVER wrap framework-guaranteed paths in `try/catch` to silence them; that is the no-fallback rule. See `[[frontend-syntax-js-es2024-ts-dom]]` for the surface and patterns.

### Pattern: the animation-timeline layer

Animations and transitions are choreography over time. Three timeline sources exist:

1. Time-driven: CSS `transition` and `@keyframes` with `animation`. The browser interpolates between two states across a duration.
2. View Transitions API: animates between two DOM states across a route change or a same-document mutation. Baseline Newly Available (same-document) since mid-2024.
3. Scroll-driven: CSS `animation-timeline: scroll(...)` or `animation-timeline: view(...)`. Baseline 2025 (selective).

ALWAYS author against the compositor-only properties (`transform`, `opacity`, `filter`) for time-driven and scroll-driven animations. NEVER animate `width`, `height`, `margin`, `padding`, or positional inset properties for continuous motion; those trigger Layout each frame and cause measurable jank.

For enter/exit animations on `display: none` / `display: block` and on Popover or Dialog elements, use `transition-behavior: allow-discrete` together with `@starting-style`. See `[[frontend-impl-popover-api]]` and `[[frontend-impl-view-transitions]]`.

### Pattern: build-step versus runtime trade-offs

A build step transforms author-time source into runtime artifacts. Common transforms:

- TypeScript to JavaScript.
- ES module bundling (concatenate modules, eliminate dead exports via tree-shaking).
- CSS preprocessing (PostCSS plugins, autoprefixer, custom property fallbacks).
- Asset hashing for cache busting.
- Source map generation.

A runtime-only project skips ALL of the above. The browser parses ES modules natively, resolves `import` specifiers through an import map, and serves raw `.css` files that already exploit native nesting and cascade layers.

ALWAYS prefer a runtime-only project for sites under 20 source modules with no TypeScript and no third-party npm-only dependencies. The marginal benefit of bundling under that threshold is negligible against the cost of toolchain maintenance.

ALWAYS introduce a build step the moment any of these conditions is true: TypeScript adopted, tree-shaking saves at least 30% of payload, npm-only dependency with CommonJS modules, PostCSS plugin needed for a Limited Availability feature.

### Pattern: spec lookup discipline

Lookup order is non-negotiable:

1. For HTML / DOM behavior, parse rules, focus order, top-layer interactions: open the WHATWG Living Standard. The Living Standard is the normative document. Browser implementations are required to track it.
2. For CSS feature definitions, selector grammar, cascade rules: open the W3C TR for the relevant module (e.g. CSS Cascading and Inheritance Level 5, CSS Containment Level 3). For features still in Editor's Draft, the ED is the working text.
3. For applied questions ("how do I use feature X"): MDN Web Docs. MDN ships BCD per page and is the canonical secondary source.
4. For Chrome-team applied guidance, Core Web Vitals tactics, INP optimization: web.dev.

If MDN and the underlying spec disagree, the spec wins. Log the discrepancy in the project's LESSONS.md. NEVER cite a tutorial site, blog, or framework documentation for platform semantics.

### Pattern: the rendering pipeline in detail

The browser builds the DOM and CSSOM in parallel from network bytes. Once both are sufficient to render, the rendering pipeline runs:

1. **Style computation**: for each element in the render tree, the cascade resolves which declarations win. This stage costs proportionally to the number of elements times the average selector match cost. `@layer`, `@scope`, and `:where()` keep specificity predictable; `:has()` adds match cost proportional to subtree size.
2. **Layout**: the box model resolves widths, heights, positions, and line breaks. Layout is invalidated when any geometric property changes, when content changes size, or when fonts load. `contain: layout` and `content-visibility: auto` isolate subtrees so a Layout invalidation does not cascade. Verified at [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19) and [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19).
3. **Paint**: each painted region is rasterized into a layer. Painting is invalidated by changes to background, color, shadow, and border-radius. Multiple layers can paint concurrently when the renderer supports layered rasterization.
4. **Composite**: the GPU composes painted layers into the final frame. Composite-only changes (transform, opacity, filter on a promoted layer) bypass Style, Layout, and Paint entirely.

For full property-to-stage mapping see `references/methods.md`. For diagnostic procedures see `[[frontend-perf-animation-gpu-containment]]` and `[[frontend-perf-core-web-vitals-inp]]`.

### Pattern: the compositor-only animation rule

A property animation is compositor-only when ALL of the following hold:

1. The property is `transform`, `opacity`, or `filter`.
2. The element is promoted to its own compositor layer.
3. No simultaneous animation on the same element touches a Layout- or Paint-triggering property.

Layer promotion is automatic for `transform: translateZ(0)`, `will-change: transform`, `will-change: opacity`, `position: fixed`, certain `filter` values, and elements with `transform: 3d-anything`. NEVER apply `will-change` to many elements at once; each promoted layer costs GPU memory.

A compositor-only animation continues at 60 fps even when the main thread is fully blocked by JavaScript or layout work. Any animation that fails ALL three conditions runs on the main thread and is at risk of frame drops under load. See `references/anti-patterns.md` entries 4 and 5 for the typical failure modes.

### Pattern: Baseline gating for newer features

The `evergreen-2026` target accepts Baseline 2024 features without polyfill. Baseline 2025 features MUST be feature-detected:

```css
@supports (animation-timeline: scroll()) {
  /* Baseline 2025 selective scroll-driven animation */
  .reveal { animation-timeline: scroll(); }
}
@supports not (animation-timeline: scroll()) {
  /* graceful static fallback */
  .reveal { opacity: 1; }
}
```

```js
if (CSS.supports("animation-timeline: scroll()")) {
  // enable scroll-driven enhancement
}
```

NEVER polyfill a feature that is already Baseline Widely Available. The polyfill ships dead weight to every visitor. See `references/anti-patterns.md` entry 3.

## Cross-references

- `[[frontend-core-web-standards-baseline]]` for the Baseline taxonomy, the version matrix, and how to verify a feature's status before shipping.
- `[[frontend-core-design-philosophy]]` for the anti-AI-generic aesthetic principles that sit on top of this architecture.
- `[[frontend-syntax-html5-semantic]]` for the full markup-layer surface.
- `[[frontend-syntax-css-cascade-layers-scope]]` for the style-layer cascade primitives.
- `[[frontend-syntax-js-es2024-ts-dom]]` for the behavior-layer surface.
- `[[frontend-perf-animation-gpu-containment]]` for compositor-only animation tactics.
- `[[frontend-perf-core-web-vitals-inp]]` for diagnosing render pipeline cost in production.
- `[[frontend-errors-animation-jank]]` for jank symptom-to-cause patterns.

## Reference Links

Primary specifications and applied guidance:

- [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/) (verified 2026-05-19)
- [MDN Web Docs: CSS contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19)
- [MDN Web Docs: CSS content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19)
- [web.dev: Baseline](https://web.dev/baseline) (verified 2026-05-19)

Reference files local to this skill:

- `references/methods.md`: complete property-to-rendering-stage map, Web API surface tables, spec-to-MDN cross-reference index.
- `references/examples.md`: framework-agnostic code examples for each layer, including a zero-build starter skeleton and an import-map example.
- `references/anti-patterns.md`: six anti-patterns with symptom, root cause, and fix.
