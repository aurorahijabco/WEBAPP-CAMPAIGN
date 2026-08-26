---
name: frontend-impl-view-transitions-scroll-animations
description: >
  Use when a single-page-app DOM swap needs a Shared-Element transition (old and new states cross-fade with named elements morphing between them) without rolling a custom FLIP library, when a multi-page-app navigation should animate seamlessly from one document to another via `@view-transition { navigation: auto }`, when a hero element should animate as it enters the viewport (parallax, fade-up, scale-in) without `requestAnimationFrame` or `IntersectionObserver` glue, when a scroll progress indicator at the top of the page must track exactly how far down the user has scrolled, when a horizontal carousel needs `scroll-snap-type: x mandatory` so cards snap into place, when `background-attachment: fixed` parallax is being considered (it is a mobile compositor disaster and must be replaced with scroll-driven animations), or when an animation must respect `prefers-reduced-motion: reduce`.
  Prevents the cross-document `@view-transition` declared on only one side (the transition silently no-ops; MUST be declared on both source and destination documents), repeating `view-transition-name` across siblings on the same snapshot (spec collision; names MUST be unique per snapshot), `startViewTransition` shipped without a `prefers-reduced-motion` check (motion-sensitive users get sudden animations they cannot disable), large `view-transition-name` snapshots painting the whole page (the snapshot pipeline copies the named element's pixels each frame), scroll-driven animations shipped without an `@supports (animation-timeline: scroll())` gate (Limited Availability in 2026; absence of the gate means non-supporting engines see no animation at all), `scroll-snap-type` set on a container without `scroll-snap-align` on the children (nothing snaps), and `scroll-snap-type: mandatory` on long-form content (the user cannot scroll between snap points; use `proximity` instead).
  Covers the same-document View Transition API (`document.startViewTransition(callback)` returning a `ViewTransition` with `.ready` / `.finished` / `.updateCallbackDone` promises and a `.skipTransition()` method), the cross-document opt-in (`@view-transition { navigation: auto }` on BOTH source and destination), the `view-transition-name` CSS property and the four pseudo-elements (`::view-transition`, `::view-transition-group(<name>)`, `::view-transition-image-pair(<name>)`, `::view-transition-old(<name>)` / `::view-transition-new(<name>)`), scroll-driven animations via `animation-timeline: scroll(<axis>? <scroller>?)` (axes `block` / `inline` / `x` / `y`; scrollers `nearest` / `root` / `self`) and `view(<axis>? <inset>?)`, named timelines (`scroll-timeline: --name <axis>;` and `view-timeline: --name <axis> <inset>?;` plus `timeline-scope: --name` for distant ancestors), `scroll-snap-type` (axis + `mandatory` / `proximity`), `scroll-snap-align` (`start` / `center` / `end`), `scroll-snap-stop: always`, scroll-padding / scroll-margin for inset adjustment, the `scrollsnapchange` and `scrollsnapchanging` events, and the universal `@media (prefers-reduced-motion: reduce)` gate that turns animations off or reduces them to opacity-only.
  Keywords: View Transitions API, startViewTransition, ViewTransition object, ViewTransition ready, ViewTransition finished, ViewTransition updateCallbackDone, ViewTransition skipTransition, view-transition-name, view-transition-class, at-view-transition, navigation auto, view-transition pseudo, view-transition-group, view-transition-image-pair, view-transition-old, view-transition-new, active-view-transition pseudo-class, PageRevealEvent, PageSwapEvent, scroll-driven animations, animation-timeline, scroll function timeline, view function timeline, scroll-timeline, scroll-timeline-name, scroll-timeline-axis, view-timeline, view-timeline-name, view-timeline-axis, view-timeline-inset, timeline-scope, animation-range, scroll-snap-type, scroll-snap-align, scroll-snap-stop, scroll-padding, scroll-margin, scrollsnapchange, scrollsnapchanging, prefers-reduced-motion, FLIP animation, SPA route change, MPA navigation, parallax, page transition jank, view transition only some elements, view transition broken, scroll progress not animating, parallax stutter mobile, scroll-snap not snapping, snap doesnt work, cross-document transition silent, how do I animate page transitions, how to make scroll-driven animation, parallax without JavaScript, how to make snapping scroll, scroll snap CSS, view transitions API explained
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Impl View Transitions + Scroll-Driven Animations

This skill defines deterministic rules for shipping View Transitions (single-document and cross-document), CSS scroll-driven animations (`animation-timeline: scroll()` / `view()` and the named-timeline forms), and scroll-snap. All three are part of the modern declarative-animation stack ; they replace large categories of JavaScript glue (FLIP libraries, `IntersectionObserver` reveal-on-scroll, `requestAnimationFrame` scroll-position pollers) with browser-native primitives.

This skill builds on `[[frontend-perf-animation-gpu-containment]]` (the compositor-only rule that scroll-driven animations rely on) and `[[frontend-a11y-motion-contrast-wcag22]]` (the `prefers-reduced-motion` rule that gates every animation in this skill). It is referenced by `[[frontend-visual-micro-interactions]]` (which composes with these primitives) and `[[frontend-impl-popover-dialog-anchor]]` (which uses View Transitions for popover entrance / exit).

Sources : [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) (verified 2026-05-19), [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) (verified 2026-05-19), [MDN: scroll-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-timeline) (verified 2026-05-19), [MDN: view-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline) (verified 2026-05-19), [MDN: CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap) (verified 2026-05-19).

## Quick Reference

### View Transition API : same-document (SPA)

```js
async function navigate(url) {
  if (!document.startViewTransition || prefersReducedMotion()) {
    updateDOM(url);
    return;
  }
  const transition = document.startViewTransition(() => updateDOM(url));
  await transition.finished;
}
```

`document.startViewTransition(callback)` :

| Aspect | Detail |
|--------|--------|
| Callback | Synchronously update the DOM inside. The browser snapshots BEFORE the call and again AFTER. |
| Return value | `ViewTransition` object. |
| `.ready` | Promise resolving when pseudo-elements are mounted and the transition is ready to animate. |
| `.finished` | Promise resolving when the transition completes. |
| `.updateCallbackDone` | Promise resolving when the DOM update callback completes. |
| `.skipTransition()` | Cancel the animation; jump to the final state. |
| Pseudo-element tree | `::view-transition` -> `::view-transition-group(name)` -> `::view-transition-image-pair(name)` -> `::view-transition-old(name)` / `::view-transition-new(name)`. |

### View Transition : cross-document (MPA)

Per [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) (verified 2026-05-19), declare on BOTH source and destination :

```css
@view-transition { navigation: auto; }
```

CRITICAL : if declared only on the source OR only on the destination, the transition silently no-ops.

### `view-transition-name` and pseudo-element animation

```css
.product-card[data-id="42"] .image { view-transition-name: product-42-image; }

::view-transition-old(product-42-image),
::view-transition-new(product-42-image) {
  animation-duration: 300ms;
  animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
```

Rules :

- Each `view-transition-name` MUST be UNIQUE per snapshot. Repeating across simultaneously-visible siblings produces a spec collision and the engine drops the entire transition.
- The name MUST be set on BOTH the old element (source state) and the new element (destination state) to morph between them.
- Default animation : `::view-transition-old(*)` fades out, `::view-transition-new(*)` fades in. Customise per-name with the `animation-*` properties listed above.

### Scroll-driven animations : `animation-timeline` values

Per [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) (verified 2026-05-19). Limited Availability in 2026 ; gate with `@supports`.

| Value | Meaning |
|-------|---------|
| `auto` (default) | Time-based ; standard `DocumentTimeline`. |
| `none` | No animation. |
| `scroll(<axis>? <scroller>?)` | Anonymous SCROLL progress timeline. Axes : `block` (default) / `inline` / `x` / `y`. Scrollers : `nearest` (default) / `root` / `self`. |
| `view(<axis>? <inset>?)` | Anonymous VIEW progress timeline tracking element visibility in its scroll container. |
| `<dashed-ident>` | Reference to a `scroll-timeline-name` or `view-timeline-name` declared elsewhere. |

```css
/* Page-wide scroll progress (a top-of-page progress bar) */
.progress { animation: grow auto linear; animation-timeline: scroll(block root); transform-origin: left; }
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Card fades in as it enters the viewport */
.card { animation: fadeIn auto linear; animation-timeline: view(block); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(2rem); } to { opacity: 1; transform: translateY(0); } }
```

Per [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) (verified 2026-05-19), `animation-timeline` is RESET-ONLY in the `animation` shorthand. Declare `animation-timeline` AFTER `animation: ...`, never inside it.

### Named timelines

```css
.scroller { scroll-timeline: --story block; overflow-y: scroll; }
.indicator { animation: bar auto linear; animation-timeline: --story; }

.hero { view-timeline: --hero block; }
.hero-cta { animation: pop auto linear; animation-timeline: --hero; }
```

`timeline-scope: --hero` on a common ancestor lets distant descendants reference the same timeline.

### `view-timeline` vs `scroll-timeline`

| Property | Tracks | Use for |
|----------|--------|---------|
| `scroll-timeline` | Scroll position of a SCROLLER (its scroll bar moves 0% to 100%). | Whole-document progress bars, parallax tied to total scroll. |
| `view-timeline` | VISIBILITY of a subject element as it crosses the scrollport. | Per-element reveal animations (fade-in, scale-in as the element enters view). |

### Scroll-snap

Per [MDN: CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap) (verified 2026-05-19), Baseline Widely Available since April 2022.

```css
.gallery { display: grid; grid-auto-flow: column; overflow-x: scroll; scroll-snap-type: x mandatory; }
.gallery > .slide { scroll-snap-align: start; scroll-snap-stop: always; }
```

| Property | On | Values |
|----------|-----|--------|
| `scroll-snap-type` | scroll container | `none` / `x mandatory` / `y mandatory` / `both mandatory` / `x proximity` / `y proximity` / `both proximity` |
| `scroll-snap-align` | snap children | `none` / `start` / `center` / `end`, optionally per-axis |
| `scroll-snap-stop` | snap children | `normal` / `always` (forces a stop at this snap target ; no overscroll past it) |
| `scroll-padding` | scroll container | adjusts the optimal viewing region (insets for sticky headers, etc.) |
| `scroll-margin` | snap children | adjusts the visual area of the snap target |

Events :

- `scrollsnapchange` : fires when a new snap target is selected.
- `scrollsnapchanging` : fires when a snap target change is pending.

`mandatory` forces snapping ; the user cannot leave a snap point partially scrolled. `proximity` only snaps near the snap points ; safer for long-form content where free scroll is also valuable.

### Reduced motion gate (universal)

```js
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (transition && reduce) transition.skipTransition();
```

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
    animation: none;
  }
  .card { animation: none; }
  .progress { animation: none; }
  .gallery { scroll-snap-type: none; }
}
```

ALL animations in this skill MUST be gated. The skill assumes the user preference matters every time.

## Decision Trees

### Decision : `startViewTransition` or plain CSS animation?

```
What kind of state change are you animating?

  A DOM swap : list view becomes detail view ; route change ;
  filter applied to a card grid ; sort order changed.
    -> document.startViewTransition(() => updateDOM()).
       Optionally tag morphing elements with
       view-transition-name so they cross-morph instead of
       cross-fading.

  A CSS-only state change : :hover, :focus, transition on a
  property, data-state="open" toggling.
    -> Plain CSS transition / animation. No view transition.

  A page navigation (real <a href> to another document) in an MPA.
    -> @view-transition { navigation: auto; } on BOTH documents.
       NO JavaScript ; the browser orchestrates.

  Same DOM swap but motion-sensitive user.
    -> ALWAYS check prefers-reduced-motion first ; if reduce,
       call updateDOM directly (no transition).
```

### Decision : `scroll-timeline` or `view-timeline`?

```
What does "progress" mean for this animation?

  Progress is how far down the page (or container) the user has
  scrolled, from 0% (top) to 100% (bottom).
    -> scroll-timeline (anonymous via animation-timeline: scroll(...)
       or named via scroll-timeline: --name).

  Progress is how much of a specific element has entered the
  scrollport (the element being animated reveals as it crosses).
    -> view-timeline (anonymous via animation-timeline: view(...) or
       named via view-timeline: --name).

  Multiple elements share the same timeline (e.g. a stacked-card
  effect choreographed across siblings).
    -> Named timeline. scroll-timeline / view-timeline on the
       declaring element ; timeline-scope: --name on a common
       ancestor ; animation-timeline: --name on the descendants.
```

### Decision : `scroll-snap-type: mandatory` or `proximity`?

```
What kind of content is in the scroll container?

  Discrete pages, cards, or slides that MUST land aligned (a
  photo carousel, a paged scrolling document, a step-by-step
  onboarding scroller).
    -> mandatory. User cannot leave the container between snap
       points.

  Long-form content with anchor points (a documentation page where
  you want sections to snap, but free scroll between paragraphs
  also has value).
    -> proximity. Only snaps when the user releases near a snap
       point.

  Scrolling should be entirely free, but the API helps anchor on
  release.
    -> none (default) plus scrollIntoView({ behavior: 'smooth' })
       for programmatic snaps.
```

### Decision : `prefers-reduced-motion`?

```
ALWAYS. No exceptions. Every animation in this skill MUST gate :

  - View transition : check the media query before startViewTransition,
    OR call transition.skipTransition() inside.
  - Scroll-driven animation : @media (prefers-reduced-motion: reduce)
    { .x { animation: none; } } OR replace transform-based animation
    with opacity-only.
  - Scroll-snap : scroll-snap-type: none on reduce, OR drop to
    proximity from mandatory (less likely to disorient).
```

## Patterns

### Pattern 1 : same-document view transition with named morph

```html
<a href="/products/42" class="product-card" data-id="42">
  <img class="image" src="/img/42.jpg" alt="">
  <h3>Product 42</h3>
</a>
```

```css
.product-card[data-id="42"] .image { view-transition-name: product-42-image; }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*), ::view-transition-new(*) { animation: none; }
}
```

```js
document.querySelectorAll('.product-card').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const url = a.href;
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      location.assign(url);
      return;
    }
    document.startViewTransition(() => loadDetailFor(url));
  });
});
```

The image morphs from list to detail because both contain an `.image` with the same `view-transition-name`.

### Pattern 2 : cross-document MPA transition

In `/list.html` and `/detail.html` (both ship the same CSS) :

```css
@view-transition { navigation: auto; }

.hero-image { view-transition-name: hero; }
```

Clicking a link to the detail page triggers a cross-document transition because both documents declare `@view-transition` and both name the same element `hero`.

### Pattern 3 : scroll progress bar

```css
.progress {
  position: fixed; inset-block-start: 0; inset-inline: 0; block-size: 4px;
  background: oklch(0.6 0.2 250);
  transform-origin: left; transform: scaleX(0);
  animation: grow auto linear;
  animation-timeline: scroll(block root);
}
@keyframes grow { to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) {
  .progress { animation: none; transform: none; }
}
```

A pure-CSS scroll progress indicator that costs no JavaScript.

### Pattern 4 : reveal-on-scroll using `view()`

```css
.card {
  opacity: 0;
  transform: translateY(2rem);
  animation: reveal auto linear;
  animation-timeline: view();
  animation-range: entry 20% cover 30%;
}
@keyframes reveal {
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .card { opacity: 1; transform: none; animation: none; }
}
```

`animation-range: entry 20% cover 30%` controls when in the element's view-progress the animation runs.

### Pattern 5 : horizontal scroll-snap carousel

```css
.carousel { display: grid; grid-auto-flow: column; gap: 1rem; overflow-x: scroll; scroll-snap-type: x mandatory; padding-inline: 2rem; }
.carousel > .slide { scroll-snap-align: center; scroll-snap-stop: always; inline-size: 80%; aspect-ratio: 16 / 9; }
@media (prefers-reduced-motion: reduce) { .carousel { scroll-snap-type: x proximity; } }
```

`mandatory` ensures slides snap into place ; on reduced-motion the rule downgrades to `proximity` so the user has finer control.

### Pattern 6 : `@supports` gate for Limited Availability

```css
.fade-in { opacity: 1; }   /* default : no animation */

@supports (animation-timeline: scroll()) {
  .fade-in {
    opacity: 0;
    animation: reveal auto linear;
    animation-timeline: view();
  }
  @keyframes reveal { to { opacity: 1; } }
}
```

Engines without `animation-timeline` show the static, fully-opaque state ; engines with support animate.

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md). Eight cataloged : `background-attachment: fixed` parallax ; `@view-transition` declared only on source ; `startViewTransition` without `prefers-reduced-motion` ; repeated `view-transition-name` across siblings ; `scroll-snap-type` without `scroll-snap-align` on children ; scroll-driven without `@supports` gate ; `scroll-snap-type: mandatory` on long-form content ; `view-transition-name` on a giant element (whole-page snapshot performance trap).

## Reference Links

- [Methods and signatures](references/methods.md) : full API surface, pseudo-element tree, `animation-timeline` value matrix, named-timeline mechanics, scroll-snap properties.
- [Examples](references/examples.md) : renderable HTML demo combining a scroll progress bar, a fade-in card gallery, and a scroll-snap carousel; six additional patterns including cross-document MPA and named-timeline choreography.
- [Anti-patterns](references/anti-patterns.md) : eight cataloged anti-patterns with symptom, root cause, and fix.

## Cross-references

- `[[frontend-perf-animation-gpu-containment]]` : compositor-only animation rule and `@property` for animatable customs ; all scroll-driven animations should use `transform` and `opacity` only.
- `[[frontend-visual-micro-interactions]]` : combines these primitives with easing curves for hover / press / focus choreography.
- `[[frontend-a11y-motion-contrast-wcag22]]` : `prefers-reduced-motion` and WCAG 2.2 motion criteria.
- `[[frontend-impl-popover-dialog-anchor]]` : popover and dialog entrance / exit using View Transitions.
- `[[frontend-impl-responsive-layout-fluid]]` : fluid `clamp()` paired with these animations for responsive choreography.
