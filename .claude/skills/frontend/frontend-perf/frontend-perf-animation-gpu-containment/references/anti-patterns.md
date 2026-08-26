# Anti-Patterns : performance, containment, animation

Each entry : symptom (what the user / developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19), [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19), [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19), [web.dev: Animations guide](https://web.dev/articles/animations-guide) (verified 2026-05-19).

## Anti-pattern 1 : animating `top` / `left` / `width` / `height` / `margin`

Symptom : the animation looks smooth in the browser on a laptop, but on a mid-range Android device it drops to ~20 fps. Chrome DevTools Performance shows Layout events on every frame of the transition.

Root cause : per [web.dev: Animations guide](https://web.dev/articles/animations-guide) (verified 2026-05-19), these properties trigger the Layout stage of the rendering pipeline. The browser must recompute geometry, then paint, then composite, every frame. Even when the visible change is small, the entire layout pass runs.

Fix : substitute compositor-only properties.

| Want | Use |
|------|-----|
| Move horizontally / vertically | `transform: translate(x, y)` or `translate3d(...)` |
| Grow / shrink | `transform: scale(...)` |
| Slide in from edge | `transform: translateX(...)` from off-screen value |
| "Width" of a progress bar | `transform: scaleX(var(--progress))` on a child, with `transform-origin: left` |

Profile the rewritten animation in DevTools Performance; expect 0 ms Layout per frame.

## Anti-pattern 2 : `will-change` applied to every animatable element in the stylesheet

```css
/* anti-pattern */
.card { will-change: transform; }
```

Symptom : after the first interaction, the page feels slow; on memory-constrained devices the tab crashes or the browser falls back to software rendering. DevTools Layers panel shows hundreds of compositor layers.

Root cause : `will-change` allocates a compositor layer and GPU memory PER element. Applied statically to many elements, the cost dwarfs any benefit. Per [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) (verified 2026-05-19) : "Don't apply will-change to too many elements... It causes significant resource consumption and bad performance."

Fix : remove from the stylesheet. Apply via JavaScript on the interaction-start event, remove on the interaction-end event (`pointerleave`, `transitionend`, `animationend`).

```js
card.addEventListener('pointerenter', () => { card.style.willChange = 'transform'; });
card.addEventListener('pointerleave', () => { card.style.willChange = 'auto'; });
card.addEventListener('transitionend', () => { card.style.willChange = 'auto'; });
```

## Anti-pattern 3 : `will-change` set but never removed

Symptom : interactions feel fine the first time, then degrade as the user explores the page. The Layers panel keeps accumulating new layers.

Root cause : the developer set `will-change` on interaction start but did not listen for `transitionend` (and `pointerleave` as a safety) to clear it. The compositor layer is held indefinitely.

Fix : ALWAYS pair the set with at least one of `transitionend`, `animationend`, `pointerleave`. Use `{ once: true }` or remove the listener after firing to avoid double-handling :

```js
card.addEventListener('pointerenter', () => {
  card.style.willChange = 'transform';
  const reset = () => { card.style.willChange = 'auto'; };
  card.addEventListener('transitionend', reset, { once: true });
  card.addEventListener('pointerleave',  reset, { once: true });
});
```

## Anti-pattern 4 : `content-visibility: auto` without `contain-intrinsic-size`

```css
/* anti-pattern */
.feed-item { content-visibility: auto; }
```

Symptom : the page scrolls smoothly until users jump (Page Down, scroll-bar drag, "scroll to bottom" link); they land on the wrong content, the scrollbar jitters, anchors land in the wrong place.

Root cause : per [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19), off-screen content with `content-visibility: auto` is laid out as size 0 until it materialises. Without a placeholder size, the total document height is wrong, so absolute scroll positions are wrong.

Fix : ALWAYS pair with `contain-intrinsic-size` (preferred form `auto <length>`) :

```css
.feed-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 280px;
}
```

The `auto <length>` form uses the placeholder until the item is laid out once, then remembers the actual size for future passes. Choose the length close to the median item size to minimise post-materialisation shifts.

## Anti-pattern 5 : animating `box-shadow`

```css
/* anti-pattern */
.card { transition: box-shadow 200ms; }
.card:hover { box-shadow: 0 16px 40px rgba(0,0,0,0.3); }
```

Symptom : large-area paint storms during the hover transition; DevTools paint flashing highlights the entire card region per frame; scroll feels heavy when several cards are mid-transition.

Root cause : `box-shadow` triggers Paint. A shadow that grows or moves repaints the surrounding area each frame.

Fix : use a layered pseudo-element or child div with the FINAL shadow value and animate ONLY its `opacity`.

```html
<div class="card-wrap">
  <div class="card">content</div>
  <div class="card-shadow" aria-hidden="true"></div>
</div>
```

```css
.card-wrap { position: relative; isolation: isolate; }
.card { position: relative; z-index: 1; }
.card-shadow {
  position: absolute; inset: 0; z-index: 0;
  border-radius: inherit;
  box-shadow: 0 16px 40px rgba(0,0,0,0.3);
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}
.card-wrap:hover .card-shadow { opacity: 1; }
```

The shadow paints once at page load; only opacity changes during interaction.

## Anti-pattern 6 : `contain: strict` on an element with no explicit size

```css
/* anti-pattern */
.card { contain: strict; }
```

Symptom : the card collapses to a 0-pixel-tall sliver; surrounding layout breaks; nothing inside the card is visible.

Root cause : `contain: strict` = `size layout paint style`. Size containment means the element is laid out as if it had no contents. Without an explicit size source (`width`, `height`, `aspect-ratio`, grid-track sizing, flex-basis with `flex-grow: 0`), the element has zero intrinsic size.

Fix : either provide an explicit size :

```css
.card { contain: strict; aspect-ratio: 4 / 3; }
```

or drop to `contain: content` (no size containment) :

```css
.card { contain: content; }
```

`contain: content` gives Layout + Paint + Style isolation without the explicit-size requirement.

## Anti-pattern 7 : `requestAnimationFrame` infinite loop for state-independent animation

```js
/* anti-pattern */
function spin() {
  el.style.transform = `rotate(${(Date.now() / 10) % 360}deg)`;
  requestAnimationFrame(spin);
}
requestAnimationFrame(spin);
```

Symptom : the animation cannot be promoted to the compositor as efficiently as a CSS animation; main-thread cost per frame; the animation continues even when the tab is backgrounded or the user has set `prefers-reduced-motion`.

Root cause : the animation is purely time-based, but it runs through JS each frame instead of using the browser's animation engine. The engine cannot batch, cache, or compositor-optimise an animation it does not see declared.

Fix : declare it in CSS. The engine handles main-thread cost, throttling on hidden tabs, and `prefers-reduced-motion` (when the author opts in).

```css
@keyframes spin { to { transform: rotate(360deg); } }
.spinner { animation: spin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }
}
```

`requestAnimationFrame` remains the right tool when the animation is tied to mutable state (cursor position, sensor input, ongoing physics), not when the same motion can be expressed declaratively.

## Anti-pattern 8 : animating an unregistered CSS custom property

```css
/* anti-pattern */
.hero { --grad-angle: 0deg; background: linear-gradient(var(--grad-angle), red, blue); animation: spin 4s linear infinite; }
@keyframes spin { to { --grad-angle: 360deg; } }
```

Symptom : the gradient does NOT rotate smoothly. It snaps from the start value to the end value at the end of each animation cycle.

Root cause : an unregistered (untyped) CSS custom property is interpolation-opaque. Per [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19), the browser does not know the property's type, so it cannot interpolate intermediate values.

Fix : register the property with `@property` (or `CSS.registerProperty()` from JS).

```css
@property --grad-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
```

The property is now typed `<angle>` and the engine interpolates angles smoothly through the animation. Baseline 2024 (July 2024).

## Anti-pattern 9 (bonus) : transitioning `display`, `visibility`, `height: auto`

Symptom : authors try `transition: height 300ms` from `height: 0` to `height: auto` and the transition does not run; or `transition: display 200ms` and nothing animates.

Root cause : these properties are discrete (`display`, `visibility` historically; `height: auto` is an intrinsic value that cannot interpolate against a length).

Fix : for show/hide, use `opacity` and `transform: scaleY(...)` (with `transform-origin: top`) on a wrapper that has explicit height or is a flex / grid item with `flex` or `grid-template-rows: 0fr -> 1fr` interpolation (the latter is a more advanced grid-row technique that DOES interpolate per CSS Grid Level 2). For genuine height collapse use a JS-measured pixel height transition (read scrollHeight, set explicit pixel height, transition to 0).
