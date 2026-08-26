# References : Diagnostic Methods and Signatures

Verified against [MDN : requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) (2026-05-19), [MDN : ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) (2026-05-19), [MDN : contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (2026-05-19), [web.dev : Animations Guide](https://web.dev/articles/animations-guide) (2026-05-19), [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (2026-05-19).

## 1. requestAnimationFrame

### 1.1 Signature

```js
const id = requestAnimationFrame(callback);
cancelAnimationFrame(id);
```

| Aspect | Value |
|---|---|
| Callback argument | `DOMHighResTimeStamp` (ms, ~= `document.timeline.currentTime`) |
| Return value | `unsigned long` request id |
| Callback timing | Fires before next repaint (synchronously, before layout + paint) |
| Pacing | Matches display refresh rate (60 / 90 / 120 / 144 Hz) |
| Background tabs | Paused for battery / CPU savings |
| Multiple callbacks per frame | All receive same timestamp |

### 1.2 Recursion pattern (required for continuous animation)

```js
function step(timestamp) {
  if (start === undefined) start = timestamp;
  const elapsed = timestamp - start;
  // update state using elapsed, NOT a fixed delta
  if (notDone) requestAnimationFrame(step);
}
requestAnimationFrame(step);
```

Use the `timestamp` argument for elapsed-time math. Per MDN : "otherwise, the animation will run faster on high refresh-rate screens."

### 1.3 rAF + setTimeout for INP

```js
function onClick() {
  applyVisibleUpdate();
  requestAnimationFrame(() => setTimeout(doExpensiveWork, 0));
}
```

The rAF callback fires before paint; the inner setTimeout defers expensive work until after the paint is committed.

## 2. ResizeObserver

### 2.1 Signatures

```js
const ro = new ResizeObserver(callback);
ro.observe(target, { box: 'content-box' | 'border-box' | 'device-pixel-content-box' });
ro.unobserve(target);
ro.disconnect();
```

### 2.2 Entry fields

| Field | Type | Description |
|---|---|---|
| `contentRect` | `DOMRectReadOnly` | Content-box rect (legacy) |
| `contentBoxSize` | `ReadonlyArray<ResizeObserverSize>` | Content-box dimensions, multi-fragment aware |
| `borderBoxSize` | `ReadonlyArray<ResizeObserverSize>` | Border-box dimensions |
| `devicePixelContentBoxSize` | `ReadonlyArray<ResizeObserverSize>` | Device-pixel dimensions |
| `target` | `Element` or `SVGElement` | Observed element |

### 2.3 Loop warning

Exact warning text per MDN : "ResizeObserver loop completed with undelivered notifications."

Trigger condition (quoted from spec) : "Infinite loops from cyclic dependencies are addressed by only processing elements deeper in the DOM during each iteration. Resize events that don't meet that condition are deferred to the next paint, and an error event is fired on the Window object."

### 2.4 Defer pattern

```js
const expected = new WeakMap();
const ro = new ResizeObserver((entries) => {
  // Option A : rAF defer (simple, works for most cases)
  requestAnimationFrame(() => apply(entries));

  // Option B : expected-size diff (avoids redundant work)
  for (const entry of entries) {
    const e = expected.get(entry.target);
    if (e && e.width === entry.contentRect.width && e.height === entry.contentRect.height) continue;
    apply(entry);
    expected.set(entry.target, { width: entry.contentRect.width, height: entry.contentRect.height });
  }
});
```

## 3. CSS `contain`

### 3.1 Values

Per [MDN : contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19) :

| Value | Effect |
|---|---|
| `none` | No containment (default) |
| `strict` | Equivalent to `size layout paint style`; requires explicit dimensions |
| `content` | Equivalent to `layout paint style`; safe default |
| `size` | Treats element as if no descendants when sizing |
| `inline-size` | Like `size` but only on the inline axis |
| `layout` | Internal layout cannot affect outside |
| `style` | Counters / quotes scope to element |
| `paint` | Descendants do not paint outside the element |

### 3.2 Side effects of any containment value

- Creates a containing block for absolutely-positioned descendants.
- Creates a new stacking context.
- Creates a new block formatting context.

Use `contain: content` as the safe default for components that render many independent subtrees (cards, list items).

## 4. Layout-triggering JavaScript reads

Reading any of these after a write forces synchronous layout (a.k.a. "forced reflow" / "layout thrash") :

| API | Returns |
|---|---|
| `element.offsetWidth` / `offsetHeight` | rounded pixel size |
| `element.offsetTop` / `offsetLeft` | offset from offsetParent |
| `element.clientWidth` / `clientHeight` | content + padding |
| `element.scrollTop` / `scrollLeft` / `scrollWidth` / `scrollHeight` | scroll geometry |
| `element.getBoundingClientRect()` | full DOMRect including transforms |
| `element.getClientRects()` | per-fragment rects |
| `window.getComputedStyle(element)` | computed style (forces layout for layout-affecting properties) |
| `range.getBoundingClientRect()` | range geometry |
| `window.scrollY` / `scrollX` (after a DOM write) | scroll position |

Rule : do all reads BEFORE any writes in a synchronous block.

## 5. Passive event listeners

```js
target.addEventListener('touchstart', fn, { passive: true });
target.addEventListener('touchmove',  fn, { passive: true });
target.addEventListener('wheel',      fn, { passive: true });
target.addEventListener('scroll',     fn, { passive: true });
```

Default (no option / `{ passive: false }`) forces the browser to wait for the handler to run before scrolling, because the handler might call `e.preventDefault()`. Passive `true` opts out of `preventDefault` and lets the compositor scroll immediately.

Use cases where passive is INCORRECT : pull-to-refresh interception, custom drag-to-dismiss that must cancel native scroll. These need `{ passive: false }`.

## 6. DevTools : Performance panel field guide

### 6.1 Main lane color legend

| Color | Activity |
|---|---|
| Yellow | Scripting (JS execution) |
| Purple | Rendering : style calc + layout |
| Green | Painting : pixel rasterization |
| Aqua / teal | Compositing (cheapest) |
| Gray | Idle |

### 6.2 Frames lane

- Red bar = dropped frame.
- Yellow bar = frame took longer than budget but did not drop.
- Hovering shows duration in ms.

### 6.3 Tabs at bottom of Performance recording

| Tab | Use |
|---|---|
| Summary | High-level breakdown (scripting / rendering / painting / idle) |
| Bottom-Up | Functions sorted by self/total time (most useful for "what is slow") |
| Call Tree | Inverted call graph from root |
| Event Log | Chronological list of events |
| Insights | DevTools auto-detected issues (forced reflow, long task, large layout shift) |

### 6.4 Rendering tab toggles (3-dots menu > More tools > Rendering)

| Toggle | Effect |
|---|---|
| Paint flashing | Green overlay on painted areas |
| Layout Shift Regions | Blue overlay on shifting regions |
| Layer borders | Yellow / orange borders on compositor layers |
| Frame Rendering Stats | Real-time FPS + GPU memory + dropped frames |
| CSS overlay (Core Web Vitals) | Live LCP / INP / CLS overlay |
| Emulate CSS media `prefers-reduced-motion` | Test reduced-motion variants |

### 6.5 Layers panel

- Each compositor layer shown with memory cost.
- Healthy : few isolated layers for animated elements.
- Unhealthy : hundreds of small layers (`will-change` overuse) or one giant root layer (no isolation).

## 7. INP decomposition

Per [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19) :

| Component | What it measures | Reduce by |
|---|---|---|
| Input delay | Time from user input event to first handler invocation | Reduce blocking main-thread work; break long tasks |
| Processing duration | Time spent in event handler callbacks | Yield with `scheduler.yield()` or `setTimeout(fn, 0)`; defer non-render work |
| Presentation delay | Time from handler completion to next paint | Apply visual updates first; use rAF + setTimeout for deferred work |

### 7.1 Yield-to-main-thread

```js
async function handle() {
  doFirstChunk();
  if ('scheduler' in window && 'yield' in scheduler) {
    await scheduler.yield();
  } else {
    await new Promise(r => setTimeout(r, 0));
  }
  doSecondChunk();
}
```

## 8. will-change : cost and rule

Per [web.dev : Animations Guide](https://web.dev/articles/animations-guide) (verified 2026-05-19) :

| Aspect | Value |
|---|---|
| Effect | Promotes element to its own compositor layer |
| Cost | GPU memory per layer; on mobile can cause crash if abused |
| Rule | Apply on interaction-start; remove (`will-change: auto`) on interaction-end |
| Static-CSS use | Acceptable for elements that are "always about to change" (a frequently-toggled sidebar) |

## 9. Cross-References

- `[[frontend-perf-animation-gpu-containment]]` : compositor-only rules, `contain` and `content-visibility` patterns
- `[[frontend-perf-core-web-vitals-inp]]` : Core Web Vitals model and field-data measurement
- `[[frontend-visual-micro-interactions]]` : timing and easing curves
- `[[frontend-impl-view-transitions-scroll-animations]]` : scroll-driven animations and view transitions
