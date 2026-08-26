---
name: frontend-perf-animation-gpu-containment
description: >
  Use when a CSS animation or transition feels janky on a real device, when scroll stutters on a long page, when DevTools shows recurring layout or paint work during interaction, when an animation uses `top`, `left`, `width`, `height`, `margin`, `padding`, `font-size`, or `box-shadow`, when an off-screen part of a long document is still costing layout and paint time, when `will-change` has been sprinkled across the stylesheet and GPU memory is exhausted, when a card grid drops frames as cards enter the viewport, or when a custom property needs to be transitioned smoothly.
  Prevents the classic "animate top/left" main-thread jank, the `will-change` always-on memory leak, `contain: strict` collapsing an element to zero size because no explicit dimensions were given, `content-visibility: auto` without `contain-intrinsic-size` causing scrollbar jitter and lost scroll position, animating `box-shadow` or `width`/`height`/`margin` triggering paint storms, the `requestAnimationFrame` infinite-loop animation pattern that the platform already provides through CSS animations, and the trap of trying to transition an unregistered CSS custom property (untyped customs are interpolation-opaque).
  Covers the compositor-only animation rule (animate ONLY `transform`, `opacity`, `filter`), correct `will-change` lifecycle (set on interaction-start, remove on `transitionend` / `animationend` / interaction-end), the full `contain` value matrix (`none`, `strict`, `content`, `size`, `inline-size`, `layout`, `style`, `paint`) with side effects (containing block, stacking context, BFC), the `content-visibility` value set (`visible`, `hidden`, `auto`) and the mandatory `contain-intrinsic-size` pairing for `auto`, `@property` to make a CSS custom property animatable, and the rendering pipeline (Style -> Layout -> Paint -> Composite) used to reason about which stage a given animation hits.
  Keywords: will-change, contain, content-visibility, contain-intrinsic-size, transform, opacity, filter, compositor, compositor layer, GPU layer, GPU memory, paint, paint storm, layout thrash, layout, repaint, recomposite, render pipeline, @property, CSS.registerProperty, registerProperty, animatable custom property, transitionable custom property, FLIP, requestAnimationFrame, rAF, jank, frame drop, scroll stutter, scroll jank, off-screen content slow, animation laggy, animation choppy, GPU memory exhausted, why is my animation choppy, why is my page slow, what is GPU acceleration, how to make CSS faster, how do I make animation smooth, what is GPU-friendly animation, how to use CSS contain, when to use will-change.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Perf Animation GPU Containment

This skill defines the rules for shipping animations and isolation that stay off the main thread and out of layout / paint storms. The rendering pipeline is Style -> Layout -> Paint -> Composite; transitions and animations are cheap when they only hit Composite, expensive when they hit Layout or Paint per frame. This skill builds on `[[frontend-core-architecture]]` (where Performance sits in the platform) and is referenced by `[[frontend-errors-animation-jank]]` (the bug catalog).

Sources : [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19), [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19), [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19), [web.dev: Animations guide](https://web.dev/articles/animations-guide) (verified 2026-05-19).

## Quick Reference

### The compositor-only rule

ALWAYS animate ONLY the following properties for production interactions :

| Property | Pipeline stage |
|----------|----------------|
| `transform` (translate, scale, rotate, skew, matrix) | Composite only. |
| `opacity` | Composite only. |
| `filter` (e.g. `blur`, `drop-shadow`, `brightness`) | Composite when the layer is already promoted; modern engines treat most filters as compositor-friendly. |

NEVER animate any of the following in a repeated or per-frame transition :

| Property | Why |
|----------|-----|
| `top`, `left`, `right`, `bottom`, `inset` | Triggers Layout. |
| `width`, `height`, `block-size`, `inline-size` | Triggers Layout. |
| `margin`, `padding` | Triggers Layout. |
| `font-size`, `letter-spacing`, `line-height` | Triggers Layout. |
| `box-shadow` | Triggers Paint per frame. |
| `background-color`, `color` (when the surface is large) | Triggers Paint per frame. |
| `border-radius`, `border-*` widths | Triggers Layout or Paint depending on context. |

Per [web.dev: Animations guide](https://web.dev/articles/animations-guide) (verified 2026-05-19), profiling shows roughly 0 ms for Layout and Paint when transform is animated, versus tens of ms per frame when `top`/`left` is animated on the same scene.

### `will-change` lifecycle

`will-change` MUST be applied dynamically and removed when the change is done. NEVER ship it statically in the stylesheet for elements that "might" animate.

```js
el.addEventListener('pointerenter', () => { el.style.willChange = 'transform'; });
el.addEventListener('pointerleave', () => { el.style.willChange = 'auto'; });
el.addEventListener('animationend',   () => { el.style.willChange = 'auto'; });
el.addEventListener('transitionend',  () => { el.style.willChange = 'auto'; });
```

Per [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) (verified 2026-05-19) : "`will-change` is intended to be used as a last resort, in order to try to deal with existing performance problems. It should not be used to anticipate performance problems." Over-using `will-change` allocates compositor layers and GPU memory the browser would have managed automatically; the result is WORSE performance, not better.

Side effects : `will-change` that names a stacking-context-creating property (e.g. `opacity`, `transform`) creates the stacking context UP FRONT, which may shift visual layering before the animation runs. Account for this when promoting elements that float above siblings.

### `contain` values

Per [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19), Baseline Widely Available since March 2022.

| Value | What it isolates | Containing block / stacking ctx / BFC |
|-------|------------------|---------------------------------------|
| `none` | nothing | no |
| `size` | element size (both axes); element sized as if it had no contents | no |
| `inline-size` | inline-axis size only | no |
| `layout` | internal layout (floats, positioning, scroll do not leak out) | YES |
| `style` | CSS counters and `quotes` scoped to subtree | no |
| `paint` | descendants clipped to the border box, paint stays inside | no |
| `content` | shorthand for `layout paint style` | YES |
| `strict` | shorthand for `size layout paint style` | YES; the element MUST have an explicit size (intrinsic or set) or it collapses to 0 |

`contain: content` is the safe default for self-contained components (cards, list items, panels). `contain: strict` is for elements with KNOWN dimensions (image grid cells, virtualised rows) and adds size containment.

### `content-visibility` values

Per [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19), Baseline 2024 (September 2024).

| Value | Layout / Paint of subtree | Find-in-page | a11y tree | Tab/focus |
|-------|---------------------------|--------------|-----------|-----------|
| `visible` (default) | always rendered | yes | yes | yes |
| `hidden` | skipped, render-state PRESERVED (like `display: none` but resumes faster) | NO | NO | NO |
| `auto` | skipped while OFF-SCREEN, rendered when near viewport; implies `contain: layout style paint` | yes | yes | yes |

ALWAYS pair `content-visibility: auto` with `contain-intrinsic-size: auto <length>` or `contain-intrinsic-size: <length>`. Without it, off-screen content is sized to 0; the scrollbar jumps as content materialises and the user's scroll position drifts.

### `@property` for animatable custom properties

Per [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19), Baseline 2024 (July 2024).

```css
@property --gradient-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
```

Untyped custom properties cannot be interpolated; transitions and animations on them snap from start to end. Registering with `@property` (or `CSS.registerProperty()` from JS) makes the property typed and interpolatable. `initial-value` MUST be computationally independent (no `em`, no `vh` units).

## Decision Trees

### Decision : can I animate this property safely?

```
Which property does the transition target?

  transform / opacity / filter
    -> YES. Composite-only. Ship the animation.

  top / left / width / height / margin / padding / font-size /
  box-shadow / background-color (large surface)
    -> NO. Rewrite using transform or opacity.
        - Position move : translate3d(...) / translate()
        - Size grow / shrink : transform: scale(...)
        - Shadow appear : opacity on a pseudo-element holding the shadow
        - Color crossfade on large surface : opacity on a layered overlay,
          NOT background-color transition.

  A CSS custom property (e.g. --gradient-angle, --progress)
    -> Register it with @property to make it typed. Then animate
       per the typed-property rules.

  Anything else
    -> Profile in DevTools Performance. If the property triggers
       Layout or Paint on the timeline, treat it as NO and rewrite.
```

### Decision : should I use `will-change`?

```
What is the trigger for the change?

  User interaction is imminent (pointerenter on a card you will hover-grow,
  keydown on a slide deck about to transition).
    -> Set will-change on the trigger event. Remove on
       transitionend / animationend / interaction-end.

  The change is rare or far-future ("might be hovered eventually").
    -> NEVER. The browser already promotes elements during active
       transitions automatically.

  Already-running CSS transition or animation.
    -> NEVER add will-change after the animation has started; the
       element is already promoted.

  The element is animated all the time (sticky badge, ambient bg).
    -> Profile first. Many "always animating" effects can be
       redesigned to run only when visible or rely on transform
       which the engine promotes during the active transition.
```

### Decision : which `contain` value (or `content-visibility`)?

```
What needs to be isolated?

  Self-contained component (card, panel, list-item) whose internal
  layout, paint, and style counters should not leak.
    -> contain: content;

  Same plus a KNOWN size (you can give an explicit width/height or
  the element has intrinsic dimensions).
    -> contain: strict;
       Set width and height (or aspect-ratio) explicitly; otherwise
       the element collapses to 0.

  Only CSS counters/quotes need scoping.
    -> contain: style;

  Long list / very tall page where off-screen items should not
  cost layout/paint.
    -> content-visibility: auto;
       PLUS contain-intrinsic-size: auto <length>;
       Each item should be a separate element with its own
       content-visibility rule so the engine can skip each block.

  An element that must be rendered but kept ready to swap in
  faster than display:none allows.
    -> content-visibility: hidden;
       Render state preserved across show / hide; find-in-page
       and the a11y tree do NOT see it.
```

## Patterns

### Pattern 1 : Long virtualised-feel list with `content-visibility: auto`

Render every item normally; the engine skips layout and paint for items that are far from the viewport. Pair with `contain-intrinsic-size` so the scrollbar stays correct.

```css
.feed-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 320px;
}
```

Full HTML in [examples.md](references/examples.md#pattern-1-content-visibility-feed) (100-item demo).

### Pattern 2 : Promote on hover, demote on leave

```css
.card { transition: transform 200ms; }
.card:hover { transform: translateY(-4px); }
```

```js
card.addEventListener('pointerenter', () => card.style.willChange = 'transform');
card.addEventListener('pointerleave', () => card.style.willChange = 'auto');
```

The transition itself is composite-only. `will-change` is added per-interaction so the GPU layer is allocated only while needed.

### Pattern 3 : Size animation via `transform: scale`, NOT `width`

```css
.bar { transform-origin: left; transform: scaleX(var(--progress)); transition: transform 200ms ease; }
```

`scaleX` is a transform; pixel-perfect text inside the bar is achievable by counter-scaling the text child (`transform: scaleX(calc(1 / var(--progress)))`) when needed.

### Pattern 4 : Animatable gradient angle with `@property`

```css
@property --grad-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.hero {
  background: linear-gradient(var(--grad-angle), #4d4dff, #ff66cc);
  animation: spin 12s linear infinite;
}
@keyframes spin { to { --grad-angle: 360deg; } }
```

Without `@property`, the transition would snap at 0deg / 360deg rather than rotating smoothly.

### Pattern 5 : Component isolation with `contain: content`

```css
.card { contain: content; }
```

Internal floats, positioned descendants, and counter usage do not leak to the page. The card establishes a containing block, stacking context, and BFC; ALWAYS verify positioned descendants still target the intended ancestor (a `position: fixed` child now positions against the viewport BUT also lives inside a containing block; see the `contain` MDN reference for details).

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md). Eight cataloged : animating `top`/`left`/`width`/`height`/`margin` (jank); `will-change` always-on (GPU memory drain); `will-change` never removed; `content-visibility: auto` without `contain-intrinsic-size` (scroll jitter); animating `box-shadow` (paint storm); `contain: strict` on an element with no explicit size (collapses to 0); `requestAnimationFrame` infinite loop for state-independent animation (CSS would be cheaper); animating an unregistered custom property (snaps).

## Reference Links

- [Methods and signatures](references/methods.md) : full `contain` matrix, `content-visibility` matrix, `will-change` JS lifecycle, `@property` syntax, rendering-pipeline diagram in text, DevTools panels to inspect each stage.
- [Examples](references/examples.md) : working snippets for the five patterns above plus DevTools-driven debugging walkthrough.
- [Anti-patterns](references/anti-patterns.md) : eight cataloged anti-patterns with symptom, root cause, and fix.

## Cross-references

- `[[frontend-perf-core-web-vitals-inp]]` : LCP / INP / CLS metrics and how compositor-only animation feeds into them.
- `[[frontend-visual-micro-interactions]]` : choreography of micro-interactions; uses this skill's compositor rule as a hard constraint.
- `[[frontend-impl-view-transitions-scroll-animations]]` : view-transitions and scroll-driven animations both rely on compositor-only properties.
- `[[frontend-errors-animation-jank]]` : the bug-catalog companion that diagnoses symptoms back to this skill's rules.
- `[[frontend-syntax-css-color-modern]]` : `@property` re-appears for animating colour custom properties.
