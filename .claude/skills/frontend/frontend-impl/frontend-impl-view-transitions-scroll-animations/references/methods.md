# Methods : View Transitions + scroll-driven animations + scroll-snap

Sources : [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) (verified 2026-05-19), [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) (verified 2026-05-19), [MDN: scroll-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-timeline) (verified 2026-05-19), [MDN: view-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline) (verified 2026-05-19), [MDN: CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap) (verified 2026-05-19).

## 1. View Transition API

### 1.1 `document.startViewTransition(callback)`

```
ViewTransition = document.startViewTransition(updateCallback)
ViewTransition = document.startViewTransition({ update: updateCallback, types: ["forward"] })
```

| Aspect | Detail |
|--------|--------|
| `updateCallback` | A function (sync or returning a promise) that mutates the DOM. The browser snapshots BEFORE the call and again AFTER. |
| `types` (optional, in object form) | Array of strings used to tag the transition for `:active-view-transition-type(<name>)`. |
| Return value | `ViewTransition` object. |

### 1.2 `ViewTransition` interface

| Member | Type | Purpose |
|--------|------|---------|
| `ready` | `Promise<void>` | Resolves when the pseudo-element tree is mounted ; rejects if the snapshot fails. |
| `finished` | `Promise<void>` | Resolves when the transition animation completes (or is skipped). |
| `updateCallbackDone` | `Promise<void>` | Resolves after the `updateCallback` finishes. |
| `types` | `ViewTransitionTypeSet` | Set-like collection of transition-type strings. |
| `skipTransition()` | `void` | Cancel the transition animation ; jump to the final state. The `finished` promise resolves regardless. |

### 1.3 Pseudo-element tree

```
::view-transition                              (overlay root over the document)
  ::view-transition-group(<name>)              (one per snapshot group)
    ::view-transition-image-pair(<name>)
      ::view-transition-old(<name>)            (frozen snapshot of pre-update state)
      ::view-transition-new(<name>)            (live snapshot of post-update state)
```

| Pseudo | Default animation |
|--------|-------------------|
| `::view-transition-old(<name>)` | fades out over the transition duration |
| `::view-transition-new(<name>)` | fades in over the transition duration |
| `::view-transition-group(<name>)` | smoothly interpolates position and size between old and new |
| `::view-transition-image-pair(<name>)` | container ; styled to control blending |

Customise per-name with `animation-duration`, `animation-timing-function`, `animation-name`, etc.

### 1.4 `view-transition-name` CSS property

| Aspect | Detail |
|--------|--------|
| Syntax | `view-transition-name: <custom-ident> \| none` |
| Default | `none` |
| Uniqueness | MUST be UNIQUE per snapshot. Repeating across simultaneously-visible siblings drops the entire transition. |
| Auto value | When set to `auto`, the browser generates a unique name. |

`view-transition-class: <custom-ident-list>` lets multiple groups share styling without sharing the name.

### 1.5 Cross-document via `@view-transition`

```css
@view-transition {
  navigation: auto;
  /* navigation: none; to opt out for specific navigations */
}
```

| Aspect | Detail |
|--------|--------|
| Where declared | In BOTH source and destination documents. |
| Effect | Same-origin navigations of the appropriate type animate via the View Transition API. |
| `navigation` values | `auto`, `none`. |

Cross-document events :

| Event | Fires on | Use |
|-------|----------|-----|
| `pageswap` | source document, before unload | Capture state, set `transition.types` for the outgoing page. |
| `pagereveal` | destination document, before first paint | Adjust `transition.types`, customise per-route. |

### 1.6 Pseudo-classes

| Pseudo-class | Matches when |
|--------------|--------------|
| `:active-view-transition` | A view transition is in progress on the document. |
| `:active-view-transition-type(<name>)` | The active transition's types set contains `<name>`. |

## 2. `animation-timeline` property

Per [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) (verified 2026-05-19). Limited Availability in 2026 ; gate with `@supports (animation-timeline: scroll())`.

### 2.1 Value matrix

| Value | Meaning |
|-------|---------|
| `auto` (initial) | `DocumentTimeline` (time-based animation). |
| `none` | No timeline ; the animation does not progress. |
| `<dashed-ident>` | Reference a timeline declared with `scroll-timeline-name` or `view-timeline-name`. |
| `scroll(<axis>? <scroller>?)` | Anonymous SCROLL progress timeline. |
| `view(<axis>? <view-timeline-inset>?)` | Anonymous VIEW progress timeline. |

`scroll(<axis>? <scroller>?)` arguments :

| Arg | Values |
|-----|--------|
| `<axis>` | `block` (default) / `inline` / `x` / `y` |
| `<scroller>` | `nearest` (default ; nearest scrolling ancestor) / `root` (document root) / `self` (the element itself if it is a scroller) |

`view(<axis>? <inset>?)` arguments :

| Arg | Values |
|-----|--------|
| `<axis>` | `block` (default) / `inline` / `x` / `y` |
| `<inset>` | One or two `<length-percentage>` values OR `auto` ; adjusts where the view-progress 0% / 100% lines fall. |

### 2.2 Shorthand interaction

```css
/* WRONG : the animation shorthand RESETS animation-timeline to 'auto' */
.x { animation-timeline: scroll(block root); animation: spin 1ms linear; }

/* RIGHT : declare animation-timeline AFTER the shorthand */
.x { animation: spin 1ms linear; animation-timeline: scroll(block root); }
```

### 2.3 `animation-range`

Controls which portion of the timeline drives the keyframes. Useful with `view()` to bracket the visible reveal :

```css
.x { animation: fadeIn auto linear; animation-timeline: view(); animation-range: entry 20% cover 30%; }
```

Range keywords : `entry`, `entry-crossing`, `exit-crossing`, `exit`, `cover`, `contain`. Each accepts an optional `<percentage>` offset.

## 3. Named timelines : `scroll-timeline` and `view-timeline`

### 3.1 `scroll-timeline`

Per [MDN: scroll-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-timeline) (verified 2026-05-19). Limited Availability.

```
scroll-timeline: <name> <axis>?
scroll-timeline-name: <dashed-ident> | none
scroll-timeline-axis: block | inline | x | y
```

Applies to scroll containers only. Declared on the SCROLLER ; referenced via `animation-timeline: --name` on a descendant or any element where `timeline-scope` makes the name visible.

### 3.2 `view-timeline`

Per [MDN: view-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline) (verified 2026-05-19). Limited Availability.

```
view-timeline: <name> <axis>? <view-timeline-inset>?
view-timeline-name: <dashed-ident> | none
view-timeline-axis: block | inline | x | y
view-timeline-inset: [ auto | <length-percentage> ]{1,2}
```

Applies to any element. Declared on the SUBJECT element whose visibility drives the timeline. Referenced via `animation-timeline: --name`.

### 3.3 `timeline-scope`

```css
.ancestor { timeline-scope: --hero, --story; }
```

Makes the named timelines visible to descendants that are not direct descendants of the declaring element. Without `timeline-scope` the name is only visible to descendants of the declaring element.

### 3.4 `view-timeline` vs `scroll-timeline`

| Property | Subject | 0% | 100% |
|----------|---------|----|------|
| `scroll-timeline` | a scroll container | scrollTop = 0 | scrollTop = scrollHeight - clientHeight |
| `view-timeline` | any element | element's leading edge meets the scrollport's leading edge | element's trailing edge meets the scrollport's trailing edge |

## 4. Scroll-snap

Per [MDN: CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap) (verified 2026-05-19). Baseline Widely Available since April 2022.

### 4.1 Container properties

| Property | Values |
|----------|--------|
| `scroll-snap-type` | `none` / `<axis> mandatory` / `<axis> proximity` ; `<axis>` is `x`, `y`, or `both` |
| `scroll-padding` | `<length-percentage>` ; per-side variants (`-top`, `-right`, ..., logical `-block`, `-inline`) |

### 4.2 Child properties

| Property | Values |
|----------|--------|
| `scroll-snap-align` | `none` / `start` / `center` / `end` ; one or two values for axes |
| `scroll-snap-stop` | `normal` / `always` (forces stop) |
| `scroll-margin` | `<length>` ; per-side variants |

### 4.3 Events

| Event | Fires on | Bubbles | Cancelable |
|-------|----------|---------|------------|
| `scrollsnapchange` | scroll container | yes | no |
| `scrollsnapchanging` | scroll container | yes | no |

## 5. `prefers-reduced-motion` gate

The standard query :

```css
@media (prefers-reduced-motion: reduce) { ... }
```

```js
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

EVERY animation in this skill MUST gate. Patterns :

| Gate type | Pattern |
|-----------|---------|
| Skip a View Transition | check matchMedia BEFORE startViewTransition ; if reduce, call updateCallback directly. OR call `transition.skipTransition()` inside. |
| Disable scroll-driven animation | `@media (prefers-reduced-motion: reduce) { .x { animation: none; } }` ; element settles in the static end-state. |
| Downgrade scroll-snap | `@media (prefers-reduced-motion: reduce) { .gallery { scroll-snap-type: <axis> proximity; } }` (or `none`). |

## 6. Browser support snapshot (2026-05-19)

| Feature | Status |
|---------|--------|
| `document.startViewTransition` (same-document) | Newly available 2024 |
| `@view-transition` (cross-document) | Newly available 2024 |
| `animation-timeline` and `scroll-timeline` / `view-timeline` | Limited Availability ; Chrome / Edge full, Firefox partial, Safari partial |
| Scroll-snap | Widely Available since April 2022 |

ALWAYS gate scroll-driven animations behind `@supports (animation-timeline: scroll())`. Always provide a no-animation fallback that leaves the element in its end-state.

## 7. Performance considerations

- Snapshot pipeline cost : a `view-transition-name` on a very large element (whole-page hero) causes the engine to capture and animate a large texture. Prefer smaller named regions.
- Scroll-driven animations are compositor-friendly when they animate ONLY `transform` / `opacity` / `filter`. NEVER drive layout-trigger properties from a scroll timeline.
- `view-timeline` keeps an IntersectionObserver-equivalent open for the subject element ; many subjects = many observers. Group with `view-timeline-name` + `animation-timeline: --name` reference rather than per-element anonymous `view()` when many siblings share the same animation.
- `scroll-snap-type: mandatory` forces a snap on every release ; if the page is long, the user CANNOT stop scrolling mid-snap. Prefer `proximity` for content-heavy lists.

## 8. JavaScript-from-CSS interop

The `pageswap` and `pagereveal` events let JS adjust the transition mid-flight :

```js
window.addEventListener('pageswap', (e) => {
  if (e.viewTransition) {
    e.viewTransition.types.add(navigationDirection());
  }
});

window.addEventListener('pagereveal', (e) => {
  if (e.viewTransition) {
    // adjust on the destination
  }
});
```

Use the `:active-view-transition-type(<name>)` pseudo-class to select per-type styling :

```css
::view-transition-old(*) { animation-name: slideOutLeft; }
:active-view-transition-type(forward) ::view-transition-old(*) { animation-name: slideOutLeft; }
:active-view-transition-type(back)    ::view-transition-old(*) { animation-name: slideOutRight; }
```
