# References : Examples

Renderable HTML fragment plus standalone snippets for `frontend-perf-core-web-vitals-inp`. The canonical example is a single-file HTML page that demonstrates LCP-optimised image preload + fetchpriority, explicit dimensions for CLS, a Speculation Rules block that excludes destructive URLs, and a click handler that yields between sub-tasks to protect INP.

## Renderable HTML fragment (save as `index.html`)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Core Web Vitals demo : LCP, INP, CLS</title>

  <link
    rel="preload"
    as="image"
    href="/img/hero-1280.avif"
    imagesrcset="/img/hero-640.avif 640w, /img/hero-1280.avif 1280w, /img/hero-1920.avif 1920w"
    imagesizes="100vw"
    fetchpriority="high"
  />

  <link
    rel="preload"
    as="font"
    type="font/woff2"
    href="/fonts/inter-variable.woff2"
    crossorigin
  />

  <link rel="preconnect" href="https://cdn.example.com" crossorigin />

  <script type="speculationrules">
  {
    "prerender": [{
      "source": "document",
      "where": {
        "and": [
          { "href_matches": "/*" },
          { "not": { "href_matches": "/logout" } },
          { "not": { "href_matches": "/sign-in/*" } },
          { "not": { "href_matches": "/api/*" } },
          { "not": { "href_matches": "/*\\?*(^|&)add-to-cart=*" } },
          { "not": { "selector_matches": "[rel~=nofollow]" } },
          { "not": { "selector_matches": ".no-prerender" } }
        ]
      },
      "eagerness": "moderate"
    }]
  }
  </script>

  <style>
    :root {
      color-scheme: light dark;
      --surface: light-dark(#fafafa, #18181b);
      --text:    light-dark(#18181b, #fafafa);
      --muted:   light-dark(#52525b, #a1a1aa);
      --accent:  light-dark(#2563eb, #60a5fa);
    }

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

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 16px/1.5 "Inter", "Inter Fallback", system-ui, sans-serif;
      color: var(--text);
      background: var(--surface);
    }

    .hero {
      position: relative;
      aspect-ratio: 16 / 9;
      width: 100%;
      overflow: hidden;
    }

    .hero img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .container { max-width: 64rem; margin: auto; padding: 2rem 1rem; }

    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }

    .card {
      content-visibility: auto;
      contain-intrinsic-size: auto 240px;
      padding: 1rem;
      border: 1px solid color-mix(in oklch, var(--text) 15%, transparent);
      border-radius: 8px;
    }

    button {
      padding: 0.75rem 1.5rem;
      min-height: 44px;
      background: var(--accent);
      color: white;
      border: 1px solid transparent;
      border-radius: 6px;
      font: inherit;
      cursor: pointer;
    }

    button:focus-visible {
      outline: 2px solid var(--text);
      outline-offset: 2px;
    }

    .ad-slot {
      aspect-ratio: 300 / 250;
      min-height: 250px;
      background: color-mix(in oklch, var(--text) 5%, transparent);
      border: 1px dashed color-mix(in oklch, var(--text) 25%, transparent);
      display: grid;
      place-items: center;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <section class="hero">
    <picture>
      <source
        type="image/avif"
        srcset="/img/hero-640.avif 640w, /img/hero-1280.avif 1280w, /img/hero-1920.avif 1920w"
        sizes="100vw"
      />
      <img
        src="/img/hero-1280.jpg"
        srcset="/img/hero-640.jpg 640w, /img/hero-1280.jpg 1280w, /img/hero-1920.jpg 1920w"
        sizes="100vw"
        width="1920"
        height="1080"
        alt="Hero illustration"
        fetchpriority="high"
        loading="eager"
        decoding="async"
      />
    </picture>
  </section>

  <main class="container">
    <h1>Core Web Vitals demo</h1>
    <p>LCP hero above uses <code>fetchpriority="high"</code>, explicit width / height, and an AVIF preload with <code>imagesrcset</code>.</p>

    <p><button id="work">Run heavy work</button></p>
    <p id="status" class="muted">Idle.</p>

    <div class="ad-slot">Ad slot (reserved 300 by 250)</div>

    <div class="grid" id="cards"></div>
  </main>

  <script type="module">
    async function yieldToMain() {
      if (globalThis.scheduler?.yield) {
        return globalThis.scheduler.yield();
      }
      if (globalThis.scheduler?.postTask) {
        return globalThis.scheduler.postTask(() => {}, { priority: "user-visible" });
      }
      return new Promise((r) => setTimeout(r, 0));
    }

    const status = document.querySelector("#status");
    const button = document.querySelector("#work");
    const grid   = document.querySelector("#cards");

    button.addEventListener("click", async () => {
      // Visual update FIRST so the user sees an immediate response.
      button.disabled = true;
      status.textContent = "Working...";

      // Yield so the spinner paint commits before we continue.
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

      let total = 0;
      const items = Array.from({ length: 5000 }, (_, i) => i);
      for (const item of items) {
        total += Math.sqrt(item);
        if (item % 200 === 0 && navigator.scheduling?.isInputPending?.()) {
          await yieldToMain();
        }
      }

      status.textContent = `Done. Total ${total.toFixed(2)}.`;
      button.disabled = false;
    });

    // Off-screen card list ; rows are content-visibility: auto.
    for (let i = 0; i < 300; i++) {
      const card = document.createElement("section");
      card.className = "card";
      card.innerHTML = `<h2>Card ${i + 1}</h2><p>Rendered only when near the viewport.</p>`;
      grid.append(card);
    }

    // LongAnimationFrame attribution ; logs blocking handlers.
    if (typeof PerformanceObserver !== "undefined") {
      const supports = PerformanceObserver.supportedEntryTypes ?? [];
      if (supports.includes("long-animation-frame")) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.blockingDuration > 100) {
              console.warn("LoAF", entry.blockingDuration.toFixed(0), "ms blocking", entry.scripts);
            }
          }
        }).observe({ type: "long-animation-frame", buffered: true });
      }
    }
  </script>
</body>
</html>
```

Save and open in any evergreen-2026 browser. Replace the `/img/...` paths with real images to see LCP improvements in DevTools. Click the button to exercise the yielding pattern ; observe in the Performance panel that input is not blocked.

## Standalone examples

### Track LCP in real-user monitoring

```js
let lcpEntry;

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    lcpEntry = entry;
  }
}).observe({ type: "largest-contentful-paint", buffered: true });

addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && lcpEntry) {
    navigator.sendBeacon("/rum", JSON.stringify({
      metric: "lcp",
      value: lcpEntry.renderTime || lcpEntry.loadTime,
      element: lcpEntry.element?.tagName,
      url: lcpEntry.url,
    }));
  }
}, { once: true });
```

### Track CLS with attribution

```js
let clsValue = 0;
let clsSources = new Set();

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.hadRecentInput) continue;
    clsValue += entry.value;
    for (const source of entry.sources ?? []) {
      if (source.node) clsSources.add(source.node);
    }
  }
}).observe({ type: "layout-shift", buffered: true });

addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    navigator.sendBeacon("/rum", JSON.stringify({
      metric: "cls",
      value: clsValue,
      sources: [...clsSources].map((n) => n.nodeName),
    }));
  }
}, { once: true });
```

### Track INP candidate events

```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.interactionId && entry.duration > 200) {
      console.warn("Slow interaction", entry.name, entry.duration, "ms on", entry.target);
    }
  }
}).observe({ type: "event", buffered: true, durationThreshold: 16 });
```

`durationThreshold: 16` filters out fast interactions to reduce observer overhead.

### Defer non-critical script

```html
<script src="/js/critical.js"></script>

<script src="/js/analytics.js" defer fetchpriority="low"></script>
<script src="/js/widget.js" async fetchpriority="low"></script>
```

`defer` preserves execution order ; `async` does not.

### Visual-first click handler

```js
button.addEventListener("click", async () => {
  button.disabled = true;
  showSpinner();

  // Commit the paint before continuing.
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

  const result = await runHeavyComputation();
  renderResult(result);

  button.disabled = false;
});
```

### Server-side prerender gating

```js
if (document.prerendering) {
  document.addEventListener("prerenderingchange", run, { once: true });
} else {
  run();
}

function run() {
  // Side-effecting work : analytics ping, log start, mutate user state.
}
```

`document.prerendering` is `true` while the page is being prerendered. `prerenderingchange` fires when the prerender activates (user navigated).

### Speculation Rules urls list (immediate)

```html
<script type="speculationrules">
{
  "prefetch": [{
    "source": "list",
    "urls": ["/products", "/about", "/contact"],
    "eagerness": "immediate"
  }]
}
</script>
```

Best for sites with predictable navigation and a small set of next-page targets. Subject to the 50 URLs cap.

### Image gallery with content-visibility

```css
.gallery-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 320px;
}
```

```html
<section class="gallery-row">
  <img src="..." width="640" height="480" loading="lazy" alt="..." />
  <img src="..." width="640" height="480" loading="lazy" alt="..." />
</section>
```

Below-the-fold rows do not pay layout / paint cost until they approach the viewport.

### Web Worker for heavy computation

```js
const worker = new Worker("/js/compute.js", { type: "module" });

button.addEventListener("click", () => {
  showSpinner();
  worker.postMessage({ command: "run", payload });
});

worker.addEventListener("message", (e) => {
  renderResult(e.data);
});
```

Moving CPU-heavy work to a Worker keeps the main thread free for input and rendering. The worker can read but not write the DOM.
