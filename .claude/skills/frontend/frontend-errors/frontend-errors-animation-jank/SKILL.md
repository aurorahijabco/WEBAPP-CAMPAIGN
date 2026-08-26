---
name: frontend-errors-animation-jank
description: >
  Use when diagnosing dropped frames, choppy scroll, stuttering CSS
  transitions, slow taps, or a regressing INP (Interaction to Next
  Paint) score. Use when reading a Chrome DevTools Performance trace
  (purple Layout bars, green Paint bars, yellow Scripting), when chasing
  a "ResizeObserver loop completed with undelivered notifications"
  warning, when forced sync layout shows up under Performance
  insights, when a scroll handler reads `getBoundingClientRect` or
  `offsetHeight` and the page tanks, or when an animation works in
  isolation but a different feature appears to slow it down. Use as
  the diagnostic counterpart to `[[frontend-perf-animation-gpu-
  containment]]` (which teaches the GPU rules) and to `[[frontend-
  perf-core-web-vitals-inp]]` (which teaches the metric model).
  Prevents the six dominant jank failure modes : animating layout-
  trigger properties (`width`, `height`, `top`, `left`, `margin`,
  `font-size`, `box-shadow`) instead of `transform` / `opacity` /
  `filter`; forced synchronous layout from interleaved DOM read-write
  cycles in the same frame; `setInterval` animation (off-rhythm versus
  the display refresh and not paused with the tab); `transition: all`
  catching unintended layout-trigger properties; the ResizeObserver
  loop where the callback mutates the observed size in the same frame
  without an rAF defer; and synchronous main-thread touchstart /
  pointerdown handlers that block the compositor from scrolling.
  Covers a structured Performance-panel workflow (record, look at the
  Frames lane for red dropped-frame bars, look at the Bottom-Up tab
  by Activity, look for purple Layout strips and green Paint blocks,
  open Layers panel for compositor-layer audit, enable Paint Flashing
  in Rendering tab to find paint storms), the read-then-write rule for
  the layout phase, the rAF + setTimeout pattern for "paint the visual
  update first, do background work after", the `will-change` cost
  model (GPU memory pressure, apply on interaction start, remove on
  interaction end), passive event listeners (`{ passive: true }`) for
  scroll and touch handlers that do not call `preventDefault`, the
  `ResizeObserver` defer pattern (wrap mutations in
  `requestAnimationFrame` OR diff against a `WeakMap` of expected
  sizes), the INP three-part decomposition (input delay, processing
  duration, presentation delay), and the explicit-properties rule for
  `transition` (never `all`).
  Keywords: animation jank, dropped frames, frame drops, scroll jank,
  janky scroll, choppy scroll, stuttering animation, animation
  performance, INP, INP regression, slow tap, slow interaction,
  mobile lag, ResizeObserver loop, ResizeObserver warning,
  ResizeObserver loop completed with undelivered notifications,
  requestAnimationFrame, rAF, cancelAnimationFrame, forced sync
  layout, layout thrash, layout thrashing, paint storm,
  paint flashing, getBoundingClientRect, offsetTop, offsetHeight,
  will-change, will-change abuse, composite layer, compositor,
  passive event listeners, transition all, transition unintended,
  setInterval animation, animating width, animating height,
  animating top left, animating background-position,
  animating box-shadow, DevTools Performance panel, Layers panel,
  why is my page laggy, why is my animation laggy,
  how to debug slow animation, how to fix scroll jank,
  what is jank, why is my interaction slow,
  how to find what is slow.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Errors : Animation Jank

Diagnostic skill. The reader has a symptom (dropped frames, slow tap, scroll stutter, ResizeObserver warning) and needs to find the root cause and fix it. The companion skill `[[frontend-perf-animation-gpu-containment]]` teaches the prescriptive rules; this skill teaches how to find violations.

## Quick Reference

### Frame budget at 60 Hz / 120 Hz / 144 Hz

Per [MDN : requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) (verified 2026-05-19), browsers call rAF callbacks at the display refresh rate :

| Refresh rate | Frame budget |
|---|---|
| 60 Hz | 16.67 ms |
| 90 Hz | 11.11 ms |
| 120 Hz | 8.33 ms |
| 144 Hz | 6.94 ms |

For all main-thread work in a single frame (event handlers + style + layout + paint + composite + your JS), you have ONE frame budget. Going over even once means a dropped frame.

### INP target

Per [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19) :

| INP at p75 | Verdict |
|---|---|
| <= 200 ms | Good |
| 200 to 500 ms | Needs improvement |
| > 500 ms | Poor |

INP = input delay + processing duration + presentation delay.

### Property-cost cheatsheet

Per [web.dev : Animations Guide](https://web.dev/articles/animations-guide) (verified 2026-05-19) :

| Property animated | Triggers | Composite-safe? |
|---|---|---|
| `transform` | composite only | YES |
| `opacity` | composite only | YES |
| `filter` (most functions) | composite only | YES |
| `top`, `left`, `right`, `bottom` | layout + paint + composite | NO |
| `width`, `height`, `inline-size`, `block-size` | layout + paint + composite | NO |
| `margin-*`, `padding-*` | layout + paint + composite | NO |
| `font-size` | layout + paint + composite | NO |
| `box-shadow` | paint + composite | NO (paint storm) |
| `background-position` | paint + composite | NO (paint storm) |
| `background-color` | paint + composite | usually no (rarely composited) |
| `color` | paint + composite | NO (paint, but cheap per element) |

ALWAYS rewrite to `transform` / `opacity` / `filter` for production interactions.

## Decision Trees

### Tree 1 : Jank symptom -> which DevTools panel?

```
Animation choppy or scroll stutters?
   -> Performance panel. Record 5 s of the interaction.
   -> Frames lane : red bars = dropped frames.
   -> Main lane : yellow = scripting, purple = layout, green = paint.
   -> Bottom-Up tab : sort by Total Time. Top entry is the culprit.

Whole page flashes when small element changes?
   -> Rendering tab (3-dots menu) -> Paint Flashing. Watch which area
      paints. If everything paints on every change : composite-layer
      audit needed.
   -> Layers panel. Look for one giant root layer (no isolation) or
      hundreds of tiny layers (will-change overuse).

Console warning "ResizeObserver loop completed with undelivered notifications"?
   -> Sources panel : pause on caught-or-uncaught errors? NO. The
      warning is non-throwing. Instead :
   -> Performance panel + ResizeObserver entries timeline. Find the
      callback that mutates the observed element's size.

INP regression in Real User Monitoring?
   -> Performance panel : record the regressing interaction.
   -> Insights tab : "Long INP interaction" insight. Click for the
      input delay + processing + presentation breakdown.
```

### Tree 2 : Layout thrash vs paint storm vs main-thread block

```
Performance recording shows tall purple Layout bars in the main lane?
   -> LAYOUT THRASH. Look for read-then-write-then-read patterns in
      the Scripting (yellow) above. Common culprits :
      el.offsetHeight, getBoundingClientRect, offsetTop, scrollTop in
      a loop or after a write.
   FIX : batch reads first, then all writes. Or rAF-defer the writes.

Performance recording shows tall green Paint bars covering most of
the frame?
   -> PAINT STORM. Open Rendering tab > Paint Flashing : confirm a
      large region paints on each tick.
   FIX : composite-only properties (transform / opacity / filter), or
      isolate the animated element with `will-change: transform`
      / `contain: paint`.

Performance recording shows tall yellow Scripting bars before any
visual update?
   -> MAIN-THREAD BLOCK. Bottom-Up sorted by Total Time identifies
      the hot function. Common : large JSON.parse, sync XHR, heavy
      array filter / sort on a large list.
   FIX : yield to main thread between sub-tasks (await
      scheduler.yield() if available, else await new Promise(r =>
      setTimeout(r, 0))). Apply visible update first via rAF, defer
      background work after.

Performance recording shows touchstart / wheel handler bars before
the scroll begins?
   -> NON-PASSIVE LISTENER. The browser cannot start compositor
      scroll until the handler runs and decides whether to
      preventDefault.
   FIX : addEventListener(name, fn, { passive: true }) for handlers
      that do not preventDefault.
```

### Tree 3 : ResizeObserver loop warning

```
Does the callback mutate the size of the observed element?
   YES -> wrap the mutation in requestAnimationFrame(...) to defer to
          next frame.
   NO  -> next question

Does the callback mutate an ancestor that resizes the observed element?
   YES -> same fix : rAF-defer, OR cache expected size in a WeakMap
          and skip the callback when delta is zero.
   NO  -> next question

Is the callback re-invoking observe() inside itself?
   YES -> remove the redundant observe() call.
   NO  -> the warning may be benign (deeper-element processing
          deferred to next paint per spec); confirm by checking it
          fires only once and the layout stabilizes.
```

## Patterns

### Pattern A : Read-then-write batching (forced sync layout fix)

```js
// WRONG : forced sync layout on each iteration
items.forEach((el) => {
  const w = el.offsetWidth;          // read (forces layout)
  el.style.width = (w + 10) + 'px';  // write (invalidates layout)
});

// CORRECT : batch reads, then batch writes
const widths = items.map((el) => el.offsetWidth);  // all reads first
items.forEach((el, i) => {
  el.style.width = (widths[i] + 10) + 'px';        // all writes after
});
```

The pattern : reading any layout-affecting property (`offsetWidth`, `offsetHeight`, `offsetTop`, `offsetLeft`, `getBoundingClientRect()`, `scrollTop`, `scrollHeight`, `clientWidth`, `clientHeight`, `getComputedStyle()`) after a write forces the browser to flush pending styles and lay out NOW. Doing this in a loop costs O(n) layouts.

### Pattern B : ResizeObserver loop fix (rAF defer)

```js
// WRONG : callback writes to observed size in same frame
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // mutates the observed element's size synchronously :
    entry.target.style.width = (entry.contentRect.width + 8) + 'px';
  }
});

// CORRECT : defer mutations to next frame
const ro = new ResizeObserver((entries) => {
  requestAnimationFrame(() => {
    for (const entry of entries) {
      entry.target.style.width = (entry.contentRect.width + 8) + 'px';
    }
  });
});
```

Per [MDN : ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) (verified 2026-05-19), the warning text is exact : "ResizeObserver loop completed with undelivered notifications." Spec deferral handles the case where deeper-element mutations are processed next paint. The rAF wrap moves the mutation OUT of the observer callback frame entirely.

### Pattern C : rAF + setTimeout deferral for INP

```js
button.addEventListener('click', (event) => {
  // 1. apply the visible update FIRST (small, in this frame)
  updateUiOptimistically(event);

  // 2. defer expensive work : let the browser paint, THEN do work
  requestAnimationFrame(() => {
    setTimeout(() => {
      doExpensiveBackgroundWork();
    }, 0);
  });
});
```

Per [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19) : "Combining `requestAnimationFrame()` with `setTimeout()` to prioritize render-critical updates before background tasks." This reduces the presentation-delay component of INP by ensuring the visual update is in the same frame as the user interaction.

### Pattern D : Passive event listeners

```js
// WRONG : non-passive handler blocks compositor scroll
window.addEventListener('touchstart', onTouchStart);
window.addEventListener('wheel', onWheel);

// CORRECT : opt out of preventDefault so compositor can start scrolling
window.addEventListener('touchstart', onTouchStart, { passive: true });
window.addEventListener('wheel',      onWheel,      { passive: true });
```

Only use `{ passive: false }` (or omit the option, which is non-passive for touch/wheel in modern browsers) if the handler actually calls `e.preventDefault()`.

### Pattern E : will-change on, will-change off

```js
// On interaction start :
draggable.style.willChange = 'transform';

// During interaction :
draggable.style.transform = `translate(${x}px, ${y}px)`;

// On interaction end :
draggable.style.willChange = 'auto';
```

`will-change` promotes the element to its own compositor layer, which costs GPU memory. Per [web.dev : Animations Guide](https://web.dev/articles/animations-guide) (verified 2026-05-19), apply it only when an interaction is about to begin and remove it when the interaction ends. NEVER set `will-change: transform` in static CSS on many elements.

### Pattern F : Replace `transition: all`

```css
/* WRONG : catches unintended layout-trigger properties */
.btn { transition: all 200ms ease; }

/* CORRECT : explicit composite-only properties */
.btn {
  transition:
    transform 150ms cubic-bezier(0.2, 0, 0, 1),
    opacity   150ms cubic-bezier(0.2, 0, 0, 1);
}
```

`transition: all` silently animates any property change. If any layout-trigger property changes (size, position, margin), the animation jank arrives without warning.

## DevTools Workflow (Cheat Sheet)

### Performance panel (record)

1. Open DevTools (F12), Performance tab.
2. Click Record (Ctrl/Cmd+E), perform the interaction, stop.
3. Look at the Frames lane (top of main area) : red bars = dropped frames. Yellow bars = frame took longer than budget but did not drop.
4. Look at the Main lane :
   - Yellow blocks = Scripting (your JS).
   - Purple blocks = Layout (style + reflow).
   - Green blocks = Paint.
   - Aqua = Composite (cheapest).
5. Bottom-Up tab sorted by Total Time = the function consuming the most time.

### Rendering tab (3-dots menu > More tools > Rendering)

- Paint Flashing : green overlay on areas that paint each frame. If the whole viewport flashes : composite-layer fix needed.
- Layout Shift Regions : blue overlay on regions that shift (for CLS, indirectly relevant).
- Frame Rendering Stats : real-time FPS, GPU memory, dropped frames.

### Layers panel (3-dots menu > More tools > Layers)

- See every compositor layer with memory cost (KB).
- One giant root layer + a few isolated layers : good.
- Hundreds of small layers with `will-change` : memory pressure, fix needed.

### Insights / "Forced Reflow" warning

Recent DevTools surfaces "Forced reflow is likely a performance bottleneck" inline in the recording. Click the warning to jump to the offending stack frame.

## Out of Scope

- Core Web Vitals theory and LCP / CLS measurement (covered in `[[frontend-perf-core-web-vitals-inp]]`).
- Compositor-only animation rules and the full `will-change` / `contain` / `content-visibility` decision tree (covered in `[[frontend-perf-animation-gpu-containment]]`).
- Scroll-snap behavior and view-transition syntax (covered in `[[frontend-impl-view-transitions-scroll-animations]]`).

## Hard Rules (Binding)

1. NEVER animate `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`, or `box-shadow` for production interactions. Rewrite to `transform` / `opacity` / `filter`.
2. NEVER write `transition: all`. List explicit composite-safe properties.
3. NEVER read layout-affecting properties (`offsetHeight`, `getBoundingClientRect`, etc.) AFTER a write in the same synchronous block. Batch reads first.
4. NEVER mutate the observed element's size synchronously inside a `ResizeObserver` callback. Wrap mutations in `requestAnimationFrame`.
5. NEVER use `setInterval` for animation. Use `requestAnimationFrame` recursion. `setInterval` does not sync to refresh rate, does not pause with the tab, and accumulates drift.
6. NEVER apply `will-change` to many elements in static CSS. Apply on interaction-start, remove on interaction-end.
7. NEVER register non-passive `touchstart`, `touchmove`, or `wheel` listeners unless `preventDefault()` is actually called.

## Reference Links

- `references/methods.md` : DevTools panel field guide, INP decomposition, rAF / ResizeObserver / passive-listener signatures
- `references/examples.md` : before / after recordings, layout-thrash fix, rAF-defer pattern, panel-animation rewrite (`width` -> `transform: scaleX`)
- `references/anti-patterns.md` : 6 anti-patterns with symptom, diagnostic step, root cause, fix
- [MDN : requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) (verified 2026-05-19)
- [MDN : ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) (verified 2026-05-19)
- [MDN : contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19)
- [web.dev : Animations Guide](https://web.dev/articles/animations-guide) (verified 2026-05-19)
- [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19)

## Cross-References

- `[[frontend-perf-animation-gpu-containment]]` : compositor-only animation rules, full `will-change` and `contain` decision trees
- `[[frontend-perf-core-web-vitals-inp]]` : INP measurement, the three Core Web Vitals
- `[[frontend-visual-micro-interactions]]` : easing and timing for hover / press / focus
- `[[frontend-impl-view-transitions-scroll-animations]]` : scroll-driven animations and view transitions
