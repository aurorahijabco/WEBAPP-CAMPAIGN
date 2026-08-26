---
name: frontend-perf-core-web-vitals-inp
description: >
  Use when measuring or improving Core Web Vitals (LCP, INP, CLS) at the
  75th-percentile field-data bar, diagnosing why an interaction misses the
  200 ms INP budget, picking a yielding strategy to break up a long task,
  prioritising the hero image with fetchpriority and preload, preventing
  cumulative layout shift on late-loading images, embeds, ads, or webfont
  swap, attributing a frame to a specific event handler via the
  LongAnimationFrame API, or wiring up Speculation Rules prefetch / prerender
  while protecting destructive URLs like sign-out and add-to-cart.
  Prevents the most common 2026 performance regressions : an LCP image
  marked loading lazy that defers past first paint, an image without explicit
  width and height that reflows content as it loads, a 350 ms synchronous
  loop inside a click handler that misses the INP budget,
  requestAnimationFrame mis-used as a generic yield that keeps the frame busy
  through paint, font-display block that produces a three-second invisible
  text period, content-visibility auto without contain-intrinsic-size that
  collapses off-screen rows to zero height and jitters the scrollbar, naive
  Speculation Rules that prerender /logout or ?add-to-cart and silently
  trigger side effects, eagerness left at the default conservative on a where
  rule when the author expected moderate hover-trigger, and the assumption
  that scheduler yield is Baseline when Firefox and Safari still lack it.
  Covers the binding 2026 thresholds (LCP 2 5 s good, 4 0 s poor ; INP 200 ms
  good, 500 ms poor and replacing FID since March 2024 ; CLS 0 1 good, 0 25
  poor), the three INP phases (input delay, processing duration, presentation
  delay), the yield ladder (scheduler yield > scheduler postTask >
  setTimeout 0 > requestIdleCallback > requestAnimationFrame for INP work),
  the LongAnimationFrame API with PerformanceScriptTiming attribution, the
  full PerformanceObserver entry-type surface (event, long-animation-frame,
  largest-contentful-paint, layout-shift, longtask, first-input), LCP tactics
  (fetchpriority high on hero, preload with imagesrcset, font-display swap
  with size-adjust ascent-override descent-override, defer non-critical JS,
  103 Early Hints), CLS prevention (width and height attrs, aspect-ratio
  CSS, reserved min-height for ads and embeds, matched fallback fonts), the
  Speculation Rules API JSON shape, the four eagerness values (immediate,
  eager, moderate, conservative) with their triggers and defaults, the
  destructive-URL exclusion pattern, and the rule that all three core vitals
  must pass at the 75th percentile across mobile and desktop.
  Keywords: Core Web Vitals, LCP, INP, CLS, fetchpriority, preload,
  loading lazy, content-visibility, contain-intrinsic-size, aspect-ratio,
  scheduler yield, scheduler postTask, setTimeout, requestIdleCallback,
  requestAnimationFrame, LongAnimationFrame, PerformanceObserver,
  PerformanceScriptTiming, LargestContentfulPaint, LayoutShift,
  Speculation Rules, prerender, prefetch, eagerness, immediate, moderate,
  conservative, isInputPending, font-display, size-adjust, ascent-override,
  descent-override, 103 Early Hints, Save-Data, slow LCP, layout shift, INP
  regression, slow tap response, page jank, hero image renders late,
  webfont flash, click lag, scrollbar jitter, off-screen list jank, how to
  improve LCP, what is INP, how to fix layout shift, why is my site slow,
  speed up first contentful paint, how to lazy load images, how to prerender
  next page, what eagerness should I pick
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Perf : Core Web Vitals + INP

This skill is the operational reference for measuring and improving the 2026 Core Web Vitals (LCP, INP, CLS), with deep coverage of INP since it replaced FID as a Core Web Vital in March 2024. It covers the binding 75th-percentile thresholds, the three INP phases, the yielding ladder, LCP and CLS tactics, the LongAnimationFrame attribution surface, and the Speculation Rules API folded in per D-R10 because it is Chromium-only Limited Availability. The skill does NOT cover animation-specific performance (see `[[frontend-perf-animation-gpu-containment]]`), CSS containment for layout / paint / size isolation, or RUM tool integration (Datadog, Cloudflare, Vercel).

## Quick Reference

### Floor rules

- ALWAYS set `fetchpriority="high"` on the LCP `<img>` AND give it explicit `width` / `height` attributes. NEVER use `loading="lazy"` on the LCP image.
- ALWAYS reserve space for late-loading content : `width` and `height` on images and iframes, `aspect-ratio` for fluid embeds, `min-height` for ad and embed slots. NEVER let a late asset push existing content downward.
- ALWAYS break long synchronous work in event handlers with `await scheduler.yield()` plus a `setTimeout(_, 0)` fallback. NEVER ship a single >50 ms synchronous task on the main thread on a critical interaction path.
- ALWAYS apply the visual update FIRST in an event handler, then defer compute past the paint via `requestAnimationFrame(() => setTimeout(work, 0))`. NEVER do heavy compute before the DOM update : the user sees a slow tap response.
- ALWAYS feature-detect `scheduler.yield()` and Speculation Rules. NEVER assume Baseline ; both are Limited Availability (Chromium-only) as of 2026-05-19.
- ALWAYS use `font-display: swap` with `size-adjust` / `ascent-override` / `descent-override` on a matched fallback. NEVER use `font-display: block` (three-second invisible text period kills LCP).
- ALWAYS exclude destructive URLs from Speculation Rules (`/logout`, `?add-to-cart=`, `[rel~=nofollow]`, sign-in flows, OTP submission, ad-conversion endpoints). NEVER ship a blanket `where: { href_matches: "/*" }` prerender rule without a `not` clause for side-effecting paths.
- ALWAYS pair `content-visibility: auto` with `contain-intrinsic-size: auto Npx`. NEVER use `content-visibility: auto` alone ; off-screen children collapse to zero and the scrollbar jitters.
- ALWAYS evaluate all three vitals at the 75th percentile of page loads, segmented mobile vs desktop. NEVER claim "passes Core Web Vitals" until that holds at p75.

### Decision tree 1 : What is hurting LCP ?

```
Hero image is the LCP candidate AND it loads from a known URL ?
  -> <img src="..." fetchpriority="high" loading="eager" width="W" height="H" alt="..." />
     Add <link rel="preload" as="image" href="hero.avif" fetchpriority="high"
                imagesrcset="..." imagesizes="..."> to start fetch during HTML parse.

Hero element contains text rendered in a webfont ?
  -> <link rel="preload" as="font" type="font/woff2" href="..." crossorigin>
     @font-face uses font-display: swap with size-adjust + ascent-override
     + descent-override matched to the fallback font metric.

LCP element is rendered late by client-side JavaScript ?
  -> Move to server-rendered HTML, OR preload the resource so the browser
     can fetch in parallel with JS evaluation.

Render-blocking script in <head> with no defer ?
  -> Add defer or async, code-split, ship only above-fold JS in the entry chunk.
```

### Decision tree 2 : Why is INP > 200 ms ?

```
Input delay (gap between gesture and first event callback) too high ?
  -> Reduce script evaluation during load (defer non-critical, code-split).
     Move large hydration steps off the critical path or chunk them.
     Audit third-party scripts ; defer or replace.

Processing duration (handler running too long) too high ?
  -> await scheduler.yield() (or postTask fallback) BETWEEN sub-tasks in a loop.
     Gate yielding on navigator.scheduling.isInputPending() when supported.
     Move CPU-heavy work to a Web Worker.
     Batch DOM reads then writes to avoid layout thrash.

Presentation delay (gap from last callback to next paint) too high ?
  -> Apply visual update FIRST in the handler.
     Defer remaining work via requestAnimationFrame(() => setTimeout(work, 0)).
     Use content-visibility: auto + contain-intrinsic-size for off-screen lists.
     Avoid client-side HTML rendering on critical interaction paths.
```

### Decision tree 3 : Yield API choice

```
scheduler.yield exists on globalThis.scheduler ?
  -> await scheduler.yield()
     Best : boosted task queue, inherits priority from postTask context.

scheduler.postTask exists ?
  -> await scheduler.postTask(() => {}, { priority: "user-visible" })
     Second choice : explicit priority, more verbose.

Neither exists ?
  -> await new Promise((r) => setTimeout(r, 0))
     Fallback ; clamped to >=4 ms after 5 nested calls, no priority awareness.

NEVER use as a generic yield :
  -> requestAnimationFrame : runs BEFORE next paint, keeps frame busy.
  -> requestIdleCallback : may starve indefinitely on a busy thread.
```

### Decision tree 4 : Speculation Rules eagerness selection

```
Static site, predictable navigation, small payloads, no destructive URLs in scope ?
  -> "eagerness": "immediate" on a urls list. Prerender on page load.
     Chrome cap : 50 prefetch, 10 prerender URLs at immediate.

Dynamic app, moderate-confidence next-page prediction, mostly-static destinations ?
  -> "eagerness": "moderate" on a where rule. Triggers on 200 ms hover
     OR pointerdown (whichever first). Limited to 2 FIFO slots.

User-intent confirmation critical (auth, payment, account changes) ?
  -> "eagerness": "conservative" on a where rule. Triggers on pointerdown only.
     This is the DEFAULT for where rules ; set it explicitly to document intent.

Forward-compat slot between immediate and moderate ?
  -> "eagerness": "eager" — currently behaves like immediate, reserved for
     future tuning. Use only when documented.
```

## Thresholds (binding 2026)

| Metric | Good (p75) | Needs improvement | Poor |
|--------|------------|--------------------|------|
| LCP | <= 2 5 s | 2 5 s to 4 0 s | > 4 0 s |
| INP | <= 200 ms | 200 ms to 500 ms | > 500 ms |
| CLS | <= 0 1 | 0 1 to 0 25 | > 0 25 |

All three measured at the 75th percentile, segmented mobile vs desktop. INP replaced FID in March 2024. Source : [web.dev : Vitals](https://web.dev/articles/vitals) (verified 2026-05-19).

## Patterns

### Pattern : LCP image with fetchpriority and preload

```html
<head>
  <link
    rel="preload"
    as="image"
    href="/img/hero-1280.avif"
    imagesrcset="/img/hero-640.avif 640w, /img/hero-1280.avif 1280w, /img/hero-1920.avif 1920w"
    imagesizes="100vw"
    fetchpriority="high"
  />
</head>
<body>
  <picture>
    <source type="image/avif" srcset="/img/hero-640.avif 640w, /img/hero-1280.avif 1280w" sizes="100vw" />
    <img
      src="/img/hero-1280.jpg"
      srcset="/img/hero-640.jpg 640w, /img/hero-1280.jpg 1280w"
      sizes="100vw"
      width="1280"
      height="720"
      alt="..."
      fetchpriority="high"
      loading="eager"
      decoding="async"
    />
  </picture>
</body>
```

`fetchpriority="high"` upgrades fetch priority. `loading="eager"` is the default ; set explicitly to document intent on the LCP element. `width` and `height` attributes reserve the layout box.

### Pattern : production-grade yielding

```js
async function yieldToMain() {
  if (globalThis.scheduler?.yield) {
    return globalThis.scheduler.yield();
  }
  if (globalThis.scheduler?.postTask) {
    return globalThis.scheduler.postTask(() => {}, { priority: "user-visible" });
  }
  return new Promise((r) => setTimeout(r, 0));
}

async function processItems(items, work) {
  for (const item of items) {
    work(item);
    if (navigator.scheduling?.isInputPending?.()) {
      await yieldToMain();
    }
  }
}
```

Yield BETWEEN sub-tasks (inside the loop), not once at the top.

### Pattern : visual-first event handler

```js
button.addEventListener("click", async () => {
  showSpinner();                                  // visual update first

  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  // The browser paints the spinner before we continue.

  const result = await runHeavyComputation();
  renderResult(result);
});
```

The `rAF -> setTimeout(0)` chain guarantees that the spinner paint commits before the next script block runs, so the user sees an immediate response even when subsequent work is heavy.

### Pattern : explicit dimensions to prevent CLS

```html
<img src="thumb.avif" width="320" height="180" alt="..." />

<iframe src="..." width="560" height="315" loading="lazy" title="..."></iframe>

<div class="ad-slot" style="aspect-ratio: 300 / 250; min-height: 250px;"></div>
```

For fluid images : `<img style="aspect-ratio: 16 / 9; width: 100%;" ...>` combines a known intrinsic ratio with responsive sizing.

### Pattern : matched fallback font with size-adjust

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-variable.woff2") format("woff2-variations");
  font-display: swap;
  font-weight: 100 900;
}

@font-face {
  font-family: "Inter Fallback";
  src: local("Arial");
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  font-family: "Inter", "Inter Fallback", system-ui, sans-serif;
}
```

When `Inter` swaps in, the metric deltas are sub-pixel and the CLS contribution stays under 0 1.

### Pattern : content-visibility for off-screen lists

```css
.list-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 56px;
}
```

The browser skips layout / paint / style for off-screen rows until they approach the viewport. `contain-intrinsic-size` provides the size estimate so the scrollbar stays stable.

### Pattern : Speculation Rules with destructive-URL exclusion

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

Feature-detect : `HTMLScriptElement.supports?.("speculationrules")`. Server-side : honor the `Sec-Purpose: prefetch` request header and defer side effects on prerender. Client-side : gate work on `document.prerendering` and the `prerenderingchange` event.

### Pattern : LongAnimationFrame observation

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.blockingDuration > 100) {
      const worst = (entry.scripts ?? []).reduce(
        (a, b) => (a.duration > b.duration ? a : b),
        { duration: 0 },
      );
      console.warn("LoAF blocked", entry.blockingDuration, "ms ; worst script", worst.invoker, worst.sourceURL);
    }
  }
});
observer.observe({ type: "long-animation-frame", buffered: true });
```

`PerformanceScriptTiming` attribution is same-origin only ; cross-origin iframes, web workers, and service workers report null attribution.

## Metric regression to tactic (decision matrix)

| Symptom | Metric | First tactic | Second tactic |
|---------|--------|--------------|---------------|
| Hero image renders late | LCP | `fetchpriority="high"` + width / height | `<link rel="preload" as="image" imagesrcset>` |
| Webfont flash in LCP element | LCP + CLS | preload font + `font-display: swap` | matched fallback with size-adjust |
| Render-blocking JS | LCP | `defer` or `async` | code-split entry |
| Click handler > 100 ms | INP processing | yield via `scheduler.yield()` between sub-tasks | Web Worker |
| Slow tap response | INP presentation | visual update first ; `rAF -> setTimeout(0)` | precompute on hover / idle |
| Typeahead lag | INP input delay | debounce 150 to 300 ms via `AbortController` | `requestIdleCallback` for reindex |
| Off-screen list jank | INP processing | `content-visibility: auto + contain-intrinsic-size` | virtualise with IntersectionObserver |
| Image without dimensions | CLS | `width`/`height` attrs or `aspect-ratio` | wrap in `aspect-ratio` div |
| Ad slot reflow | CLS | reserve fixed `min-height` | aspect-ratio placeholder |
| Banner injected on scroll | CLS | inject BELOW fold | tie to user gesture (auto-excluded 500 ms) |
| Slow next-page navigation | LCP on next page | Speculation Rules `prerender` with `moderate` | fallback to `prefetch` for non-Chromium |

## Cross-references

- `[[frontend-perf-animation-gpu-containment]]` : compositor-only animations (`transform`, `opacity`, `filter`), CSS containment, GPU layer promotion.
- `[[frontend-syntax-js-es2024-ts-dom]]` : `scheduler.yield()` API surface, feature detection, INP-aware patterns.
- `[[frontend-impl-typography-system]]` : webfont loading strategy, fallback metric matching.
- `[[frontend-errors-animation-jank]]` : symptom-to-cause map for jank-class errors.

## Reference Links

- [references/methods.md](references/methods.md) : full PerformanceObserver entry surface, LongAnimationFrame property list, Speculation Rules JSON shape, fetchpriority spec, yield ladder.
- [references/examples.md](references/examples.md) : renderable `index.html` with LCP-optimised image, Speculation Rules block, click handler that yields, plus standalone snippets.
- [references/anti-patterns.md](references/anti-patterns.md) : twelve anti-patterns with metric mapping, symptom, root cause, fix.

## Authoritative sources

- [web.dev : Vitals](https://web.dev/articles/vitals) (verified 2026-05-19)
- [web.dev : LCP](https://web.dev/articles/lcp) (verified 2026-05-19)
- [web.dev : INP](https://web.dev/articles/inp) (verified 2026-05-19)
- [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19)
- [web.dev : CLS](https://web.dev/articles/cls) (verified 2026-05-19)
- [MDN : Scheduler.yield](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield) (verified 2026-05-19)
- [MDN : PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) (verified 2026-05-19)
- [MDN : LongAnimationFrameTiming](https://developer.mozilla.org/en-US/docs/Web/API/LongAnimationFrameTiming) (verified 2026-05-19)
- [MDN : LargestContentfulPaint](https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint) (verified 2026-05-19)
- [MDN : LayoutShift](https://developer.mozilla.org/en-US/docs/Web/API/LayoutShift) (verified 2026-05-19)
- [MDN : Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) (verified 2026-05-19)
- [MDN : fetchpriority](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority) (verified 2026-05-19)
- [developer.chrome.com : prerender-pages](https://developer.chrome.com/docs/web-platform/prerender-pages) (verified 2026-05-19)
- [developer.chrome.com : speculation-rules-improvements](https://developer.chrome.com/blog/speculation-rules-improvements) (verified 2026-05-19)
- [developer.chrome.com : long-animation-frames](https://developer.chrome.com/docs/web-platform/long-animation-frames) (verified 2026-05-19)
