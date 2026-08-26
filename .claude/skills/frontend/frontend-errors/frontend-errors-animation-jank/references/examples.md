# References : Diagnostic Examples

Real before / after snippets. Each example pairs the broken code with the corrected version and the DevTools signal that reveals the bug.

## 1. Panel Open / Close : `width` -> `transform: scaleX`

### Before : animates `width` (layout + paint each frame)

```css
.panel {
  width: 0;
  overflow: hidden;
  transition: width 250ms ease;
}
.panel.is-open { width: 320px; }
```

Performance recording during open : tall purple Layout bars every frame, green Paint bars covering the entire surrounding region. On a mid-range Android, frames drop from 60 to ~22.

### After : animates `transform: scaleX` (composite only)

```css
.panel {
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 250ms cubic-bezier(0.2, 0, 0, 1);
  width: 320px;            /* full width is the target; transform hides it */
  overflow: hidden;
}
.panel.is-open { transform: scaleX(1); }

/* Content inside the panel can counter-scale if needed to keep text legible */
.panel-content {
  transform: scaleX(1);
  transition: transform 250ms cubic-bezier(0.2, 0, 0, 1);
  /* author counter-scale via the open class if width pre-allocation matters */
}
```

Performance recording during open : no purple Layout bars, no green Paint bars on the parent. Only Composite work. Frames hold at 60.

Trade-off : `scaleX` does not reflow surrounding content. If the surroundings must reflow with the panel, animate a `grid-template-columns` value via `@property`-registered custom property, or accept the reflow as a layout (one-time, not per-frame).

## 2. Forced Sync Layout : read after write

### Before : O(n) layouts

```js
items.forEach((el) => {
  const h = el.offsetHeight;          // read : forces layout flush
  el.style.paddingTop = (h * 0.1) + 'px';  // write : invalidates layout
  // next iteration's offsetHeight read forces layout again
});
```

DevTools Insight banner shows "Forced reflow is likely a performance bottleneck" with a stack pointing into the loop.

### After : batched reads, then batched writes

```js
const heights = items.map((el) => el.offsetHeight);  // all reads first
items.forEach((el, i) => {
  el.style.paddingTop = (heights[i] * 0.1) + 'px';   // all writes after
});
```

Single layout flush at the end of the script's microtask batch.

### Alternative : rAF defer for browser-controlled timing

```js
items.forEach((el) => {
  const h = el.offsetHeight;
  requestAnimationFrame(() => {
    el.style.paddingTop = (h * 0.1) + 'px';
  });
});
```

The reads remain inside the loop, but the writes are deferred to the next frame, after the current layout flush.

## 3. ResizeObserver Loop : rAF defer

### Before : warning fires every resize

```js
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // Synchronously change the observed element's size, which schedules
    // another observation in the same frame, deferring to next paint and
    // emitting the warning.
    const fontSize = Math.max(12, entry.contentRect.width / 30);
    entry.target.style.fontSize = fontSize + 'px';
  }
});
ro.observe(headline);
```

Console : "ResizeObserver loop completed with undelivered notifications."

### After : defer mutations with rAF

```js
const ro = new ResizeObserver((entries) => {
  requestAnimationFrame(() => {
    for (const entry of entries) {
      const fontSize = Math.max(12, entry.contentRect.width / 30);
      entry.target.style.fontSize = fontSize + 'px';
    }
  });
});
ro.observe(headline);
```

Or, diff against expected size and skip no-op work :

```js
const expected = new WeakMap();
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const w = entry.contentRect.width;
    const last = expected.get(entry.target);
    if (last && Math.abs(last - w) < 1) continue;
    expected.set(entry.target, w);
    entry.target.style.fontSize = Math.max(12, w / 30) + 'px';
  }
});
```

## 4. Scroll Handler reads `getBoundingClientRect`

### Before : main-thread blocked on every scroll tick

```js
window.addEventListener('scroll', () => {
  const rect = hero.getBoundingClientRect();   // forces layout
  if (rect.bottom < 0) {
    nav.classList.add('is-stuck');
  } else {
    nav.classList.remove('is-stuck');
  }
});
```

Recording during scroll : yellow Scripting bar at the start of every frame, purple Layout immediately after. Scroll jank visible on mobile.

### After : IntersectionObserver (off main thread)

```js
const io = new IntersectionObserver(([entry]) => {
  nav.classList.toggle('is-stuck', !entry.isIntersecting);
}, { threshold: 0 });
io.observe(hero);
```

The browser fires the callback only when the intersection state changes, NOT on every scroll tick. No layout reads in script.

### Alternative : `position: sticky` with no JS

```css
.nav { position: sticky; top: 0; }
```

Then style based on `:has()` :

```css
.nav:has(+ * > .hero:not(:is-intersecting)) { /* hypothetical, not supported */ }
```

Practical : use IntersectionObserver. The pure-CSS alternative is limited.

## 5. `setInterval` Animation Replaced by `requestAnimationFrame`

### Before : off-rhythm, keeps running in background tabs

```js
let x = 0;
setInterval(() => {
  x = (x + 1) % 100;
  el.style.transform = `translateX(${x}px)`;
}, 16);
```

Problems : `16 ms` does not align with the actual display refresh; runs in background tabs (battery drain); accumulates drift over time.

### After : refresh-rate-synced, auto-pauses

```js
let rafId;
function step(timestamp) {
  el.style.transform = `translateX(${(timestamp / 10) % 100}px)`;
  rafId = requestAnimationFrame(step);
}
rafId = requestAnimationFrame(step);

// Cancel when the animation should stop :
cancelAnimationFrame(rafId);
```

Synced to display refresh, paused when tab is hidden, time-based math so 60 / 120 / 144 Hz screens all produce the same visible speed.

## 6. INP Regression Fix : visible update first, work after

### Before : entire handler runs synchronously before paint

```js
button.addEventListener('click', (event) => {
  doExpensiveWork();           // 300 ms of JS
  updateUiOptimistically();    // tiny visual change, blocked behind the work
});
```

INP recording : input delay tiny, processing duration ~300 ms, presentation delay tiny. Total ~310 ms = "Needs improvement".

### After : paint first, defer the work

```js
button.addEventListener('click', (event) => {
  updateUiOptimistically();    // small synchronous update
  requestAnimationFrame(() => {
    setTimeout(() => {
      doExpensiveWork();       // runs AFTER the paint
    }, 0);
  });
});
```

Now processing duration is ~5 ms, presentation delay ~10 ms = total ~15 ms = "Good". The expensive work still runs, but it no longer blocks the visible feedback.

If the expensive work itself must stay responsive, break it with `scheduler.yield()` :

```js
async function doExpensiveWork() {
  for (const chunk of chunks) {
    processChunk(chunk);
    if ('scheduler' in window && 'yield' in scheduler) {
      await scheduler.yield();
    } else {
      await new Promise(r => setTimeout(r, 0));
    }
  }
}
```

## 7. `will-change` Cycle for Drag-and-Drop

```js
function onDragStart(handle) {
  handle.style.willChange = 'transform';   // promote to own layer
}

function onDragMove(handle, x, y) {
  handle.style.transform = `translate(${x}px, ${y}px)`;
}

function onDragEnd(handle) {
  handle.style.willChange = 'auto';        // release the layer
}
```

Static CSS alternative (`.draggable { will-change: transform; }`) costs GPU memory for every `.draggable` simultaneously; on a 200-item list this can crash mobile browsers.

## 8. Passive Wheel Listener for a Custom Carousel

### Before : main-thread blocks compositor scroll

```js
carousel.addEventListener('wheel', (e) => {
  trackVisible();   // does not call preventDefault, but the browser does not know that
});
```

Lighthouse warning : "Does not use passive listeners to improve scrolling performance."

### After : declare passive intent

```js
carousel.addEventListener('wheel', (e) => {
  trackVisible();
}, { passive: true });
```

Now the compositor can scroll immediately; the JS runs in parallel without delaying.

If the handler MUST call `preventDefault()` conditionally, use `{ passive: false }` and accept the cost, OR restructure : capture the wheel intent declaratively via `overscroll-behavior: contain` plus a one-time scroll-snap.
