# References : Anti-patterns

Twelve anti-patterns observed in real Core Web Vitals audits, with metric mapping, symptom, root cause, and fix. All verified 2026-05-19.

## 1. `<img>` without `width` and `height`

**Affects** : CLS.

**Symptom** : audit reports `LayoutShift` entries on initial page load with the image elements as `sources`. Content reflows downward as each image loads.

**Root cause** : without `width` and `height` attributes (or an `aspect-ratio` CSS rule), the browser cannot reserve a layout box for the image. The box is zero-sized until the image finishes loading.

**Fix** :

```html
<!-- Wrong -->
<img src="thumb.avif" alt="..." />

<!-- Right -->
<img src="thumb.avif" width="320" height="180" alt="..." />

<!-- Or, for fluid layouts -->
<img src="thumb.avif" style="aspect-ratio: 16 / 9; width: 100%; height: auto;" alt="..." />
```

Source : [web.dev : CLS](https://web.dev/articles/cls) (verified 2026-05-19).

## 2. `loading="lazy"` on the LCP image

**Affects** : LCP.

**Symptom** : LCP regresses after a "lazy load all images" change. The hero image waits for a viewport-intersect callback before fetching.

**Root cause** : `loading="lazy"` defers image fetching until the image is near the viewport. For an above-the-fold LCP image, this adds an unnecessary round-trip delay because intersection detection runs only after layout.

**Fix** :

```html
<!-- Wrong : LCP image marked lazy -->
<img src="hero.avif" loading="lazy" fetchpriority="high" alt="..." />

<!-- Right : eager on LCP, lazy only below the fold -->
<img src="hero.avif" loading="eager" fetchpriority="high" width="..." height="..." alt="..." />
<img src="below-fold.avif" loading="lazy" alt="..." />
```

Source : [MDN : fetchpriority](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority) (verified 2026-05-19).

## 3. Synchronous long task in click handler

**Affects** : INP processing duration.

**Symptom** : INP misses the 200 ms budget. Field RUM reports interactions in the 300 to 800 ms range. Lighthouse Total Blocking Time spikes.

**Root cause** : the handler runs a 350 ms loop synchronously on the main thread, blocking the next frame.

**Fix** : yield BETWEEN sub-tasks. One yield at the top of the handler does not split work ; the remaining synchronous code is still one long task.

```js
// Wrong
button.addEventListener("click", () => {
  for (const item of items) work(item);
});

// Right
async function yieldToMain() {
  if (globalThis.scheduler?.yield) return globalThis.scheduler.yield();
  if (globalThis.scheduler?.postTask) return globalThis.scheduler.postTask(() => {}, { priority: "user-visible" });
  return new Promise((r) => setTimeout(r, 0));
}

button.addEventListener("click", async () => {
  for (const item of items) {
    work(item);
    if (navigator.scheduling?.isInputPending?.()) {
      await yieldToMain();
    }
  }
});
```

Source : [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19).

## 4. `font-display: block`

**Affects** : LCP.

**Symptom** : Lighthouse flags "Ensure text remains visible during webfont load." LCP candidate is delayed by up to three seconds while text is invisible.

**Root cause** : `font-display: block` produces a long invisible-text period (browser default ~3 seconds) before swap. If the LCP element contains text, the LCP timer waits for the swap.

**Fix** : use `font-display: swap` with a matched fallback so the swap delta falls below the CLS threshold.

```css
/* Wrong */
@font-face {
  font-family: "Brand";
  src: url("brand.woff2") format("woff2");
  font-display: block;
}

/* Right */
@font-face {
  font-family: "Brand";
  src: url("brand.woff2") format("woff2");
  font-display: swap;
}

@font-face {
  font-family: "Brand Fallback";
  src: local("Arial");
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
}
```

Source : [MDN : @font-face / font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) (verified prior round, on SOURCES.md).

## 5. Speculation Rules prerendering `/logout`

**Affects** : application correctness (security, data integrity).

**Symptom** : users report being silently signed out by hovering a link, or finding items in their cart they did not add.

**Root cause** : `prerender` fully executes the destination page's JavaScript. A hover-triggered `/logout` link, `?add-to-cart=*` URL, or sign-in flow runs its side effects during speculation, before the user clicks.

**Fix** : exclude destructive URLs explicitly.

```html
<script type="speculationrules">
{
  "prerender": [{
    "source": "document",
    "where": {
      "and": [
        { "href_matches": "/*" },
        { "not": { "href_matches": "/logout" } },
        { "not": { "href_matches": "/sign-in/*" } },
        { "not": { "href_matches": "/*\\?*(^|&)add-to-cart=*" } },
        { "not": { "selector_matches": "[rel~=nofollow]" } },
        { "not": { "selector_matches": ".no-prerender" } }
      ]
    },
    "eagerness": "moderate"
  }]
}
</script>
```

Server-side : honor `Sec-Purpose: prefetch` and defer side effects. Client-side : gate on `document.prerendering` and the `prerenderingchange` event. Source : [MDN : Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) (verified 2026-05-19).

## 6. `content-visibility: auto` without `contain-intrinsic-size`

**Affects** : CLS, scrollbar stability.

**Symptom** : the scrollbar jitters as the user scrolls. Off-screen sections collapse to zero height then expand on viewport approach, causing visible reflow and CLS contribution.

**Root cause** : `content-visibility: auto` lets the browser skip rendering for off-screen elements, but without a size estimate the element collapses to 0 by 0. As the user scrolls, each off-screen row in turn pops to its real size.

**Fix** : ALWAYS pair with `contain-intrinsic-size`.

```css
/* Wrong */
.row { content-visibility: auto; }

/* Right */
.row {
  content-visibility: auto;
  contain-intrinsic-size: auto 56px;
}
```

The `auto Npx` form means "fall back to N pixels until the real size is known". The browser remembers the rendered size after first paint.

## 7. `requestAnimationFrame` to defer post-handler work

**Affects** : INP presentation delay.

**Symptom** : INP misses the budget even though the click handler itself returns quickly. The delay is in the gap between the last callback and the next paint.

**Root cause** : `requestAnimationFrame` runs BEFORE the next paint, not after. Heavy compute inside `rAF` inflates presentation delay because the browser cannot commit the paint until the `rAF` callback returns.

**Fix** : if work must run after paint, chain `requestAnimationFrame(() => setTimeout(work, 0))` so the work is pushed past the paint commit.

```js
// Wrong : work runs in the same frame as paint commit
button.addEventListener("click", () => {
  showSpinner();
  requestAnimationFrame(() => {
    heavyWork(); // blocks paint
  });
});

// Right : work runs in the frame AFTER paint
button.addEventListener("click", () => {
  showSpinner();
  requestAnimationFrame(() => setTimeout(heavyWork, 0));
});
```

Source : [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19).

## 8. Single `await yieldToMain()` at top of a long task

**Affects** : INP processing duration.

**Symptom** : INP regression persists even after adding a yield to the handler.

**Root cause** : one yield at the top splits work in two ; the remaining synchronous code is still one long task. The yield runs once, then everything after it is back-to-back.

**Fix** : yield BETWEEN sub-tasks in the loop.

```js
// Wrong
async function handler() {
  await yieldToMain();
  for (const item of items) work(item); // still one long task
}

// Right
async function handler() {
  for (const item of items) {
    work(item);
    if (navigator.scheduling?.isInputPending?.()) {
      await yieldToMain();
    }
  }
}
```

Source : [MDN : Scheduler.yield](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield) (verified 2026-05-19).

## 9. Assuming `scheduler.yield()` is Baseline

**Affects** : runtime error in Firefox / Safari.

**Symptom** : `TypeError: scheduler.yield is not a function` in error logs from Firefox and Safari users.

**Root cause** : `scheduler.yield()` is Limited Availability (Chromium-only) as of 2026-05-19. Shipping unguarded calls breaks non-Chromium browsers.

**Fix** : feature-detect and fall back.

```js
// Wrong
await scheduler.yield();

// Right
async function yieldToMain() {
  if (globalThis.scheduler?.yield) return globalThis.scheduler.yield();
  if (globalThis.scheduler?.postTask) return globalThis.scheduler.postTask(() => {}, { priority: "user-visible" });
  return new Promise((r) => setTimeout(r, 0));
}
```

Source : [MDN : Scheduler.yield](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield) (verified 2026-05-19).

## 10. Speculation Rules with default eagerness on `where` rules

**Affects** : missed prerender opportunities.

**Symptom** : authors expecting hover-based prerender see no benefit in the Performance panel. Speculation entries fire only on actual click, which is too late.

**Root cause** : the default eagerness for `where` document rules is `conservative` (pointerdown / touchstart only), not `moderate`. The opposite is true for `urls` lists, where the default is `immediate`. Surprising and undocumented in most articles.

**Fix** : set eagerness explicitly.

```html
<script type="speculationrules">
{
  "prerender": [{
    "source": "document",
    "where": { "href_matches": "/products/*" },
    "eagerness": "moderate"
  }]
}
</script>
```

Source : [developer.chrome.com : speculation-rules-improvements](https://developer.chrome.com/blog/speculation-rules-improvements) (verified 2026-05-19).

## 11. Observing only `longtask` for INP debugging

**Affects** : INP attribution.

**Symptom** : Long Tasks API reports nothing yet INP is still failing. Attribution to a specific handler is impossible.

**Root cause** : the legacy Long Tasks API misses cumulative blocking from many sub-50 ms tasks that together delay a frame, AND it provides no per-script attribution. INP cares about the total frame blocking time, not just single-task duration.

**Fix** : observe `long-animation-frame` and use `entry.scripts[]` for attribution.

```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.blockingDuration > 100) {
      const worst = (entry.scripts ?? []).reduce(
        (a, b) => (a.duration > b.duration ? a : b),
        { duration: 0 },
      );
      console.warn("LoAF", entry.blockingDuration, "ms ; worst", worst.invoker, worst.sourceURL);
    }
  }
}).observe({ type: "long-animation-frame", buffered: true });
```

Source : [developer.chrome.com : long-animation-frames](https://developer.chrome.com/docs/web-platform/long-animation-frames) (verified 2026-05-19).

## 12. Client-side HTML rendering on critical interaction path

**Affects** : INP presentation delay.

**Symptom** : a click-triggered `element.innerHTML = bigHtml` blocks paint until the parse completes. INP entries show very high presentation-delay values.

**Root cause** : the browser cannot yield while parsing rendered HTML. A large `innerHTML` assignment is a single uninterruptible task.

**Fix** :

- Stream HTML server-side and inject incrementally via `DocumentFragment`.
- Or move the parse off-thread via a Worker that returns a serialized DOM-like structure.
- Or render in smaller chunks across multiple yields.

```js
// Wrong
container.innerHTML = bigHtml;

// Right (chunked)
const parser = new DOMParser();
const doc = parser.parseFromString(bigHtml, "text/html");
const nodes = [...doc.body.children];

for (const node of nodes) {
  container.append(node);
  if (navigator.scheduling?.isInputPending?.()) {
    await yieldToMain();
  }
}
```

Source : [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19).
