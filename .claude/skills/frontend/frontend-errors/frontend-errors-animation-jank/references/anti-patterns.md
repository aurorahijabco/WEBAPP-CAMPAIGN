# References : Animation Jank Anti-Patterns

Eight common failure modes. Each entry : symptom, diagnostic step (what to look for in DevTools), root cause, fix.

## Anti-Pattern 1 : Scroll handler reading `getBoundingClientRect`

### Symptom
Scroll feels rubbery / sluggish, especially on mobile. INP regression in real-user data. Frame drops visible during scroll.

### Diagnostic step
Performance panel : record a scroll. Look for yellow Scripting bars at the START of each frame, immediately followed by purple Layout bars. The Insights tab shows "Forced reflow" warnings pointing to the scroll handler.

### Root cause
Each scroll tick fires the handler, which reads a layout-affecting property (`getBoundingClientRect`, `offsetTop`, `scrollHeight`). The read forces a layout flush. On a 60 Hz display, the budget is 16.67 ms; the layout flush plus the rest of frame work routinely exceeds this.

```js
// WRONG
window.addEventListener('scroll', () => {
  const rect = hero.getBoundingClientRect();
  nav.classList.toggle('stuck', rect.bottom < 0);
});
```

### Fix
Use `IntersectionObserver` for visibility-change events. The browser computes intersections off-main-thread and fires the callback only on state change.

```js
// CORRECT
const io = new IntersectionObserver(([entry]) => {
  nav.classList.toggle('stuck', !entry.isIntersecting);
});
io.observe(hero);
```

### Source
[MDN : IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver). [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19) on layout-thrashing INP regressions.

## Anti-Pattern 2 : `setInterval` for animation

### Symptom
Animation runs at a wrong speed on high-refresh displays (looks "slow" at 120 Hz). Animation continues in background tabs draining battery. Drift accumulates over long sessions.

### Diagnostic step
Performance panel : record. The Main lane shows yellow Scripting bars at irregular ~16 ms intervals that drift over time. Open Bottom-Up : `setInterval` callback is the top entry.

### Root cause
`setInterval(fn, 16)` does NOT sync to the display refresh rate. It runs whether the tab is visible or not. The 16 ms delay accumulates drift versus the actual frame boundaries.

```js
// WRONG
setInterval(() => {
  x += 1;
  el.style.transform = `translateX(${x}px)`;
}, 16);
```

### Fix
`requestAnimationFrame` recursion. Synced to refresh rate, paused in background tabs, no drift if elapsed time math is correct.

```js
// CORRECT
function step(timestamp) {
  if (start === undefined) start = timestamp;
  const elapsed = timestamp - start;
  el.style.transform = `translateX(${elapsed * 0.1}px)`;
  requestAnimationFrame(step);
}
requestAnimationFrame(step);
```

### Source
[MDN : requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) (verified 2026-05-19) : "The frequency of calls to the callback function will generally match the display refresh rate" and "Be sure always to use the first argument... otherwise, the animation will run faster on high refresh-rate screens."

## Anti-Pattern 3 : Forced sync layout via interleaved reads and writes

### Symptom
A loop over N elements that should run in microseconds takes hundreds of milliseconds. DevTools Insight banner : "Forced reflow is likely a performance bottleneck."

### Diagnostic step
Performance panel : record the slow interaction. The Main lane shows a yellow Scripting block with embedded purple Layout strips. Each read-after-write triggers a layout flush. Open Insights for the exact stack frame.

### Root cause
Reading any layout-affecting property (`offsetWidth`, `offsetHeight`, `offsetTop`, `getBoundingClientRect`, `getComputedStyle` for layout properties) AFTER a DOM write in the same synchronous block forces the browser to flush pending styles and lay out NOW. In a loop this becomes O(n) layouts.

```js
// WRONG
items.forEach((el) => {
  const h = el.offsetHeight;          // read forces layout
  el.style.padding = (h * 0.1) + 'px'; // write invalidates layout
  // next read forces another layout
});
```

### Fix
Batch all reads first, then all writes.

```js
// CORRECT
const heights = items.map((el) => el.offsetHeight);
items.forEach((el, i) => {
  el.style.padding = (heights[i] * 0.1) + 'px';
});
```

### Source
[web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19) : "Layout thrashing (synchronous style updates followed by immediate property reads)" listed as common INP regression cause.

## Anti-Pattern 4 : ResizeObserver callback mutates observed size

### Symptom
Console warning : "ResizeObserver loop completed with undelivered notifications." Layout sometimes settles in one frame, sometimes shifts visibly during the next paint.

### Diagnostic step
Console : warning text identifies the file and line of the observer's callback. Performance panel : record a resize event; look for the ResizeObserver entry in the Timings lane plus a purple Layout bar immediately after the callback frame, then a second observation deferred.

### Root cause
Per [MDN : ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) (verified 2026-05-19), the spec processes only elements "deeper in the DOM during each iteration." Mutations to the observed element's own size cannot be processed in the same frame; they defer to next paint, and the warning fires.

```js
// WRONG
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    entry.target.style.fontSize = (entry.contentRect.width / 30) + 'px';
  }
});
```

### Fix
Wrap mutations in `requestAnimationFrame` to defer to next frame. Optionally, diff against a `WeakMap` of expected sizes and skip no-op work.

```js
// CORRECT
const ro = new ResizeObserver((entries) => {
  requestAnimationFrame(() => {
    for (const entry of entries) {
      entry.target.style.fontSize = (entry.contentRect.width / 30) + 'px';
    }
  });
});
```

### Source
[MDN : ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) (verified 2026-05-19).

## Anti-Pattern 5 : Animating `background-position` (paint storm)

### Symptom
Hover or scroll-driven background animation drops frames on most devices. DevTools "Paint Flashing" overlay flashes the entire animated region every frame.

### Diagnostic step
Rendering tab : enable Paint Flashing. Trigger the animation. Green overlay covers the entire animated area continuously = paint storm.

### Root cause
Animating `background-position` (or `background-image`, `background-size`) repaints the element on every frame. Each repaint includes the background fill, gradient calculation, or image decode. For a large element, this saturates the CPU.

```css
/* WRONG : paint storm */
.hero {
  background-image: url(stars.png);
  animation: parallax 10s linear infinite;
}
@keyframes parallax {
  to { background-position: 100% 0; }
}
```

### Fix
Move the animated layer into its own element and animate `transform: translateX(...)` instead. Or use `animation-timeline: scroll()` with `transform`.

```css
/* CORRECT */
.hero { position: relative; overflow: hidden; }
.hero-bg {
  position: absolute; inset: 0;
  background-image: url(stars.png);
  animation: parallax 10s linear infinite;
  will-change: transform;
}
@keyframes parallax {
  to { transform: translateX(-50%); }
}
```

### Source
[web.dev : Animations Guide](https://web.dev/articles/animations-guide) (verified 2026-05-19).

## Anti-Pattern 6 : Animating `box-shadow` instead of swapping for `filter: drop-shadow`

### Symptom
Hover state with a growing / softening shadow drops frames on lower-end devices.

### Diagnostic step
Performance panel : tall green Paint bars during the hover. Paint Flashing overlay shows the bounding region of the shadow + element repainting each frame.

### Root cause
`box-shadow` is computed in the paint stage. Animating its blur radius or spread forces a full repaint of the shadowed region every frame. The repaint is expensive because the shadow is convolved (blurred) each time.

```css
/* WRONG : repaints shadow each frame */
.card { box-shadow: 0 1px 3px rgb(0 0 0 / 0.1); transition: box-shadow 200ms; }
.card:hover { box-shadow: 0 8px 20px rgb(0 0 0 / 0.2); }
```

### Fix : pre-render a fixed shadow, animate `opacity` of an overlay layer

```css
/* CORRECT */
.card { position: relative; }
.card::after {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.2);
  opacity: 0;
  transition: opacity 200ms;
  pointer-events: none;
}
.card:hover::after { opacity: 1; }
```

Or use `filter: drop-shadow(...)` which composites on the GPU for elements that are already composite-promoted.

### Source
[web.dev : Animations Guide](https://web.dev/articles/animations-guide) (verified 2026-05-19) lists shadow / blur animations as paint-trigger anti-patterns.

## Anti-Pattern 7 : `transition: all`

### Symptom
A transition that was supposed to animate `opacity` quietly animates a `width` change introduced months later, causing jank in a different feature.

### Diagnostic step
Performance panel : record the supposed-to-be-cheap transition. Tall purple Layout bars show a layout-trigger property is being animated. Check the source CSS for `transition: all`.

### Root cause
`transition: all` catches every animatable property. Future authors introducing a `width` change on the same element get animation jank as a side effect.

```css
/* WRONG */
.btn { transition: all 200ms ease; }
```

### Fix
List composite-safe properties explicitly.

```css
/* CORRECT */
.btn { transition: transform 150ms cubic-bezier(0.2, 0, 0, 1), opacity 150ms cubic-bezier(0.2, 0, 0, 1); }
```

### Source
[web.dev : Animations Guide](https://web.dev/articles/animations-guide) (verified 2026-05-19), explicit-properties rule.

## Anti-Pattern 8 : Non-passive touch / wheel handlers blocking compositor scroll

### Symptom
On mobile, the initial touchstart-to-scroll feels delayed. Wheel scroll feels rubbery on a custom-scrollable container. Lighthouse warning : "Does not use passive listeners to improve scrolling performance."

### Diagnostic step
Performance panel : record a scroll. Look for a yellow Scripting bar at the start of the touch / wheel event, BEFORE the compositor scroll begins. The Main lane shows the event handler running before any scroll update.

### Root cause
By default, the browser must wait for `touchstart`, `touchmove`, and `wheel` handlers to run before scrolling, because the handler MIGHT call `e.preventDefault()`. If the handler does NOT call preventDefault, the wait is wasted.

```js
// WRONG : compositor blocked
window.addEventListener('touchmove', onTouchMove);
window.addEventListener('wheel',     onWheel);
```

### Fix
Declare passive intent. The compositor starts scrolling immediately; the handler runs in parallel.

```js
// CORRECT
window.addEventListener('touchmove', onTouchMove, { passive: true });
window.addEventListener('wheel',     onWheel,     { passive: true });
```

If the handler must conditionally call `preventDefault()`, restructure the interaction declaratively via `touch-action`, `overscroll-behavior`, or scroll-snap rather than blocking the compositor.

### Source
Chrome DevTools "Passive event listeners" insight; [MDN : EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) options documentation.
