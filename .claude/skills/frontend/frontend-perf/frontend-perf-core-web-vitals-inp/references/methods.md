# References : APIs and Spec Surface

Complete API and spec surface for `frontend-perf-core-web-vitals-inp`. All citations verified 2026-05-19.

## Core Web Vitals : definitions and thresholds

| Metric | Measures | Good (p75) | Poor (p75) | Source |
|--------|----------|------------|------------|--------|
| LCP | Render time of largest image / text / video in viewport | 2 5 s | 4 0 s | [web.dev : LCP](https://web.dev/articles/lcp) |
| INP | 75th-percentile latency of click / tap / keyboard interactions | 200 ms | 500 ms | [web.dev : INP](https://web.dev/articles/inp) |
| CLS | Largest session-window burst of `impact * distance` | 0 1 | 0 25 | [web.dev : CLS](https://web.dev/articles/cls) |

All three measured at the 75th percentile of page loads, segmented mobile vs desktop. A page passes Core Web Vitals only when all three reach Good at p75.

INP replaced FID as a Core Web Vital in March 2024 ([web.dev : Vitals](https://web.dev/articles/vitals) verified 2026-05-19).

**Supporting metrics** :

- TTFB (Time To First Byte) : diagnoses server / network ; no Core Web Vital threshold.
- FCP (First Contentful Paint) : diagnoses load ; no Core Web Vital threshold.
- TBT (Total Blocking Time) : lab proxy for INP (synthetic tests cannot reproduce real-world interactions).

## LCP : qualifying elements

LCP candidate elements per [web.dev : LCP](https://web.dev/articles/lcp) (verified 2026-05-19) :

- `<img>` (first frame for animated content)
- `<image>` inside `<svg>`
- `<video>` poster (or first frame, whichever earlier)
- Block-level elements containing text
- Elements with CSS `background-image: url(...)`

The list is intentionally restricted by the spec to keep the metric stable.

### `LargestContentfulPaint` PerformanceEntry properties

| Property | Type | Meaning |
|----------|------|---------|
| `renderTime` | DOMHighResTimeStamp | Time the element was first rendered (when available cross-origin) |
| `loadTime` | DOMHighResTimeStamp | Resource load completion |
| `size` | number | Intrinsic pixel area of the element |
| `id` | string | Element's `id` attribute, if any |
| `url` | string | Resource URL (for image / video) |
| `element` | Element or null | Reference to the candidate element |
| `paintTime` | DOMHighResTimeStamp | When the paint commit landed |
| `presentationTime` | DOMHighResTimeStamp | When the frame was presented to the user |

Source : [MDN : LargestContentfulPaint](https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint) (verified 2026-05-19, Newly available 2025).

## INP : three phases

| Phase | Definition | Typical cause |
|-------|------------|---------------|
| Input delay | Gesture to first event callback start | Main-thread contention (script eval, third-party libs, hydration) |
| Processing duration | Callbacks themselves running | Layout thrash, big DOM updates, JSON parse, framework reconciliation |
| Presentation delay | Last callback to next paint | Oversized DOM, expensive rAF, layout/style invalidation, client-side HTML render |

Source : [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19).

INP applies a one-outlier-per-50-interactions filter, then reports the 75th percentile across page views.

## CLS : formula and exclusions

CLS = `impact fraction * distance fraction` summed within a session window.

- **Session window** : max 5 s total duration, max 1 s gap between shifts.
- **Reported value** : the LARGEST session burst, not the cumulative total across the visit.
- **User-input exclusion** : shifts within 500 ms of a click / tap / keypress are excluded via `hadRecentInput` on the `layout-shift` entry.

Source : [web.dev : CLS](https://web.dev/articles/cls) (verified 2026-05-19).

### `LayoutShift` PerformanceEntry properties

| Property | Type | Meaning |
|----------|------|---------|
| `value` | number | Shift score for this entry |
| `hadRecentInput` | boolean | True if within 500 ms of user input |
| `lastInputTime` | DOMHighResTimeStamp | Time of last user input |
| `sources` | LayoutShiftAttribution[] | Array of shifted nodes |

### `LayoutShiftAttribution`

| Property | Type | Meaning |
|----------|------|---------|
| `node` | Node | Element that shifted |
| `currentRect` | DOMRectReadOnly | Position after shift |
| `previousRect` | DOMRectReadOnly | Position before shift |

Source : [MDN : LayoutShift](https://developer.mozilla.org/en-US/docs/Web/API/LayoutShift) (verified 2026-05-19, Limited availability per MDN).

## PerformanceObserver entry types

Source : [MDN : PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) (verified 2026-05-19, Baseline Widely Available since January 2020).

| Entry type | Yields | Use for |
|------------|--------|---------|
| `event` | per-interaction latency, target, duration | INP candidates |
| `long-animation-frame` | LoAF entries with script attribution | INP attribution |
| `largest-contentful-paint` | LCP candidates with element reference | LCP measurement |
| `layout-shift` | CLS deltas with `sources` attribution | CLS attribution |
| `longtask` | legacy 50 ms+ task entries | Backwards compat ; prefer LoAF |
| `first-input` | legacy FID measurement | Backwards compat ; INP supersedes |

### Constructor + observation

```ts
new PerformanceObserver(callback: (list: PerformanceObserverEntryList, observer: PerformanceObserver) => void)

observer.observe({
  type?: string,
  entryTypes?: string[],
  buffered?: boolean,
  // Plus per-type options : durationThreshold, etc.
}): void

observer.disconnect(): void
observer.takeRecords(): PerformanceEntry[]

PerformanceObserver.supportedEntryTypes: string[]  // read-only
```

`buffered: true` replays entries that occurred BEFORE the observer was created, critical for above-the-fold LCP detection.

## LongAnimationFrame API

Source : [MDN : LongAnimationFrameTiming](https://developer.mozilla.org/en-US/docs/Web/API/LongAnimationFrameTiming) (verified 2026-05-19, Baseline 2024 in Chromium ; Firefox / Safari lack implementation per [developer.chrome.com : long-animation-frames](https://developer.chrome.com/docs/web-platform/long-animation-frames) verified 2026-05-19).

A Long Animation Frame is any rendering update delayed beyond 50 ms.

### `PerformanceLongAnimationFrameTiming` properties

| Property | Type | Meaning |
|----------|------|---------|
| `duration` | DOMHighResTimeStamp | Total frame duration |
| `startTime` | DOMHighResTimeStamp | Frame start (input event timestamp if available) |
| `renderStart` | DOMHighResTimeStamp | When rendering work started in this frame |
| `styleAndLayoutStart` | DOMHighResTimeStamp | When style + layout phase started |
| `firstUIEventTimestamp` | DOMHighResTimeStamp | First input event that triggered the frame |
| `blockingDuration` | number | Time the frame blocked other work |
| `paintTime` | DOMHighResTimeStamp | When the paint phase ran |
| `presentationTime` | DOMHighResTimeStamp | When the frame was committed to the display |
| `scripts` | PerformanceScriptTiming[] | Per-script attribution |

### `PerformanceScriptTiming` properties

| Property | Type | Meaning |
|----------|------|---------|
| `invoker` | string | What triggered the script (e.g. `"DOMWindow.onclick"`) |
| `invokerType` | string | Category (`"event-listener"`, `"user-callback"`, ...) |
| `sourceURL` | string | Script source URL |
| `sourceFunctionName` | string | Function name when known |
| `sourceCharPosition` | number | Character offset in the source |
| `duration` | DOMHighResTimeStamp | Script execution duration |
| `executionStart` | DOMHighResTimeStamp | When the script started |
| `forcedStyleAndLayoutDuration` | DOMHighResTimeStamp | Sync layout / style triggered by the script |
| `pauseDuration` | DOMHighResTimeStamp | Time paused by browser internals |
| `windowAttribution` | string | Origin context |

Script attribution is same-origin only ; cross-origin iframes, web workers, and service workers report null attribution.

## scheduler.yield + scheduler.postTask

Source : [MDN : Scheduler.yield](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield) (verified 2026-05-19, Limited availability ; Chromium-only).

```ts
globalThis.scheduler.yield(): Promise<undefined>

globalThis.scheduler.postTask(
  callback: () => any,
  options?: {
    priority?: "user-blocking" | "user-visible" | "background";
    signal?: AbortSignal;
    delay?: number;
  }
): Promise<any>
```

**Priority inheritance** : `await scheduler.yield()` inside a `scheduler.postTask(fn, { priority: "background" })` body inherits `"background"`. Outside any `postTask` context, default is `"user-visible"`. Yielded continuations enter a boosted task queue that runs before same-priority `postTask` tasks.

**`isInputPending`** : `navigator.scheduling?.isInputPending?.()` returns `boolean`. Limited availability (Chromium-only). Use to yield ONLY when input is pending, avoiding the yield-cost on every loop iteration.

## Yield ladder (worst to best for INP)

| Rank | API | Behavior | INP suitability |
|------|-----|----------|------------------|
| 1 | `await scheduler.yield()` | yields to high-priority work, resumes via boosted queue | best, where supported |
| 2 | `await scheduler.postTask(fn, { priority })` | new task with explicit priority | second choice, more verbose |
| 3 | `await new Promise(r => setTimeout(r, 0))` | clamped to >= 4 ms after 5 nested calls | fallback ; degrades after deep nesting |
| 4 | `requestIdleCallback(fn)` | only fires when main thread is idle ; may starve | unsuitable for processing-phase work |
| 5 | `requestAnimationFrame(fn)` | fires before next paint, BEFORE yielding to input | WORST for INP : keeps frame busy through paint |

## Speculation Rules API

Source : [MDN : Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) (verified 2026-05-19, Limited availability ; Chromium-only).

```html
<script type="speculationrules">
{
  "prefetch": [ /* rules */ ],
  "prerender": [ /* rules */ ]
}
</script>
```

Each rule is one of :

```jsonc
// urls list
{ "source": "list", "urls": ["/a", "/b"], "eagerness": "immediate" }

// where document rule
{
  "source": "document",
  "where": { /* predicate */ },
  "eagerness": "moderate"
}
```

### Predicate operators

| Operator | Form | Example |
|----------|------|---------|
| `href_matches` | URL pattern | `{ "href_matches": "/products/*" }` |
| `selector_matches` | CSS selector | `{ "selector_matches": "a.product-link" }` |
| `and` | logical AND | `{ "and": [ ... ] }` |
| `or` | logical OR | `{ "or": [ ... ] }` |
| `not` | negation | `{ "not": { ... } }` |

### Eagerness values

| Value | Trigger | Default for |
|-------|---------|-------------|
| `immediate` | As soon as rules observed (page load) | `urls` lists |
| `eager` | Currently behaves like `immediate` ; reserved for future tuning | (none) |
| `moderate` | 200 ms hover OR `pointerdown` (or 500 ms scroll-stop on mobile) | (none) |
| `conservative` | `pointerdown` or `touchstart` only | `where` rules |

Source : [developer.chrome.com : prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages) and [developer.chrome.com : speculation-rules-improvements](https://developer.chrome.com/blog/speculation-rules-improvements) (both verified 2026-05-19).

### Budget caps (Chrome)

- 50 prefetch URLs at `immediate`.
- 10 prerender URLs at `immediate`.
- 2 FIFO slots for user-interaction-triggered (`moderate`, `conservative`).
- Exceeding the cap drops the oldest entry.

### Feature detection

```js
const supportsSpeculationRules =
  HTMLScriptElement.supports?.("speculationrules") ?? false;
```

### Destructive-URL prevention

Prefetch and prerender MUST exclude URLs that cause side effects on GET. Common patterns to exclude :

- `/logout` (and any sign-out endpoint)
- `?add-to-cart=*`
- Language / region switching
- OTP / SMS sign-in endpoints
- Ad-conversion tracking
- Usage-allowance increments

**Server-side mitigation** : honor the `Sec-Purpose: prefetch` request header. Defer side effects until the user actually navigates.

**Client-side mitigation** : gate work on `document.prerendering` and the `prerenderingchange` event.

**Cache invalidation** : `Clear-Site-Data: "prefetchCache" "prerenderCache"` to drop speculated copies after auth state changes.

**Cross-site prerender** : destination server must send `Supports-Loading-Mode: credentialed-prerender`.

## fetchpriority attribute

Source : [MDN : fetchpriority](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority) (verified 2026-05-19, Baseline 2024 since October 2024).

Values : `high` | `low` | `auto` (default).

Applies to : `<img>`, `<link>`, `<script>`.

```html
<img src="hero.avif" fetchpriority="high" loading="eager" width="..." height="..." />
<link rel="preload" as="image" href="hero.avif" fetchpriority="high" />
<script src="critical.js" fetchpriority="high"></script>
<script src="analytics.js" fetchpriority="low" defer></script>
```

Rule : ALWAYS set `high` on the LCP image. ALWAYS set `low` on below-the-fold non-critical images.

## Preload + preconnect

```html
<link rel="preload" as="image" href="hero.avif" imagesrcset="..." imagesizes="..." fetchpriority="high" />
<link rel="preload" as="font" type="font/woff2" href="inter-variable.woff2" crossorigin />
<link rel="preload" as="style" href="critical.css" />

<link rel="preconnect" href="https://cdn.example.com" crossorigin />
<link rel="dns-prefetch" href="https://cdn.example.com" />
```

`crossorigin` is REQUIRED on font preloads even for same-origin URLs.

## font-display + matched-fallback metrics

Source : [MDN : @font-face / font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) (verified prior round, on SOURCES.md), Baseline Widely Available since January 2020.

Values : `auto` (default) | `block` | `swap` | `fallback` | `optional`.

Rule : `swap` for body text. `optional` for nice-to-have display fonts. NEVER `block` on body text (three-second invisible-text period).

```css
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
  line-gap-override: 0%;
}
```

## content-visibility

Source : [MDN : content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified prior round, on SOURCES.md).

Values : `visible` (default) | `auto` | `hidden`.

`content-visibility: auto` lets the browser skip layout / style / paint for off-screen elements until they approach the viewport. ALWAYS pair with `contain-intrinsic-size` so the scrollbar stays stable.

```css
.row {
  content-visibility: auto;
  contain-intrinsic-size: auto 56px;
}
```

`auto Npx` means "fall back to N pixels until the real size is known". The browser updates the intrinsic size after the first paint and remembers it.
