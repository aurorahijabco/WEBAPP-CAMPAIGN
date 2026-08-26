# Examples : Frontend Core Architecture

Framework-agnostic examples illustrating the four authoring layers, the build-step versus runtime split, and the compositor-only animation rule. All snippets target evergreen-2026 browsers.

## Example : zero-build project skeleton

A vanilla HTML/CSS/JS project that uses native ES modules, native CSS nesting, native cascade layers, and an import map. No bundler, no compiler, no preprocessor.

### File tree

```
project/
  index.html
  styles/
    base.css
    components.css
    layout.css
  modules/
    cart.js
    formatters.js
    main.js
  assets/
    logo.svg
```

### `index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Zero-build starter</title>
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/layout.css">
  <link rel="stylesheet" href="/styles/components.css">
  <script type="importmap">
    {
      "imports": {
        "cart": "/modules/cart.js",
        "formatters": "/modules/formatters.js"
      }
    }
  </script>
  <script type="module" src="/modules/main.js"></script>
</head>
<body>
  <header>
    <nav aria-label="Primary">
      <a href="/">Home</a>
      <a href="/shop">Shop</a>
    </nav>
  </header>
  <main>
    <h1>Zero-build starter</h1>
  </main>
</body>
</html>
```

The browser parses ES modules directly via `<script type="module">`. Bare specifiers (`import { add } from "cart"`) resolve through the import map. No build step runs.

### `styles/base.css` (cascade layers, native nesting)

```css
@layer reset, tokens, base, components, utilities;

@layer tokens {
  :root {
    color-scheme: light dark;
    --brand-hue: 230;
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 1rem;
    --space-4: 1.5rem;
  }
}

@layer base {
  body {
    font-family: system-ui, sans-serif;
    line-height: 1.5;
    margin: 0;

    & > main {
      padding-inline: var(--space-3);
      padding-block: var(--space-4);
    }
  }

  a {
    color: light-dark(oklch(0.40 0.18 var(--brand-hue)), oklch(0.80 0.18 var(--brand-hue)));

    &:hover {
      text-decoration-thickness: 2px;
    }
  }
}
```

Native cascade layers, native nesting with `&`, `light-dark()`, and `oklch()` are all Baseline Widely Available. No PostCSS plugin runs.

### `modules/main.js`

```js
import { format } from "formatters";
import { addItem } from "cart";

const button = document.querySelector("button[data-add-to-cart]");
button?.addEventListener("click", (event) => {
  const sku = event.currentTarget.dataset.sku;
  if (!sku) return;
  addItem(sku);
  console.log(format(addItem.last));
});
```

The behavior layer reaches for the smallest Web API that fits: `querySelector`, `addEventListener`, no library.

## Example : when to introduce a build step

The decision: TypeScript adopted across the codebase. Add `tsc` for type checking and `esbuild` for bundling. The output is still ES modules; the runtime contract does not change.

### `package.json` (illustrative, not authoritative for tooling choice)

```json
{
  "type": "module",
  "scripts": {
    "type-check": "tsc --noEmit",
    "build": "esbuild src/main.ts --bundle --format=esm --outfile=dist/main.js"
  }
}
```

The build runs author-time only. The runtime artifact (`dist/main.js`) is the same shape as the zero-build version: an ES module loaded by `<script type="module">`. No framework-specific runtime is introduced.

## Example : safe compositor-only animation

A button that scales up on hover without dropping a frame, even under main-thread load.

```html
<button class="cta">Add to cart</button>
```

```css
.cta {
  display: inline-flex;
  padding-block: 0.625rem;
  padding-inline: 1.25rem;
  border-radius: 0.5rem;
  background: oklch(0.55 0.18 230);
  color: oklch(0.99 0 0);
  border: none;
  cursor: pointer;
  transition: transform 200ms ease, opacity 200ms ease;
  will-change: transform;
}

.cta:hover {
  transform: scale(1.04);
}

.cta:active {
  transform: scale(0.98);
  opacity: 0.9;
}
```

ALL animated properties (`transform`, `opacity`) are compositor-only. The `will-change: transform` hint promotes the element to its own layer. The transition runs on the GPU thread and does not block on main-thread work.

## Example : unsafe Layout-triggering animation, refactored

### Before (Layout per frame, janks)

```css
.panel {
  width: 0;
  overflow: hidden;
  transition: width 300ms ease;
}

.panel.is-open {
  width: 320px;
}
```

Animating `width` invalidates Layout each frame. The renderer re-flows the entire surrounding context. Sibling content shifts. Scroll position can jump.

### After (Composite-only, smooth)

```css
.panel {
  width: 320px;
  transform: translateX(-100%);
  transition: transform 300ms ease;
}

.panel.is-open {
  transform: translateX(0);
}
```

The element occupies its space at all times; only its visual position changes via `transform`. The compositor handles the animation without re-running Layout.

If the goal truly is reflow (sibling content must reclaim space), accept the Layout cost but isolate it with `contain: layout` on the panel's ancestor so the reflow does not cascade.

## Example : avoiding layout thrash in a scroll handler

### Before (forced synchronous Layout per scroll event)

```js
function onScroll() {
  for (const el of document.querySelectorAll(".reveal")) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add("is-visible");
    }
  }
}
window.addEventListener("scroll", onScroll);
```

Each `getBoundingClientRect()` call after a class write forces a synchronous Layout. With dozens of elements this drops the frame.

### After (IntersectionObserver, zero layout reads)

```js
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }
}, { rootMargin: "0px 0px -10% 0px" });

for (const el of document.querySelectorAll(".reveal")) {
  observer.observe(el);
}
```

`IntersectionObserver` reads layout state off the main thread and dispatches batches asynchronously. No layout-read happens during scroll.

## Example : Baseline gating for a 2025 feature

Scroll-driven animations are Baseline 2025 (selective). Gate the enhancement and provide a static fallback.

```css
.reveal {
  opacity: 1;
}

@supports (animation-timeline: view()) {
  .reveal {
    opacity: 0;
    animation: fade-in linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 30%;
  }
  @keyframes fade-in {
    to { opacity: 1; }
  }
}
```

The enhancement runs only where the browser supports scroll-driven animation. The static fallback ALWAYS renders the element visible, so no browser hides content because of an unsupported feature.

## Example : containment for off-screen cards

A grid of cards where each card's internal layout cost should not invalidate the whole grid.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
}

.card {
  contain: content;
  content-visibility: auto;
  contain-intrinsic-size: 18rem 22rem;
}
```

`contain: content` isolates each card's Layout and Paint. `content-visibility: auto` lets the browser skip rendering for offscreen cards. `contain-intrinsic-size` provides a layout placeholder so scroll position stays stable while offscreen cards are not yet rendered. Verified at [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19) and [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19).

## Example : spec lookup discipline in practice

Question: "What is the correct initial-focus behavior for `<dialog>` opened via `showModal()`?"

1. Open WHATWG HTML LS, section on the `dialog` element. The Living Standard defines the focusing steps for modal dialogs (initial focus goes to the autofocus descendant if any, else the first focusable descendant). Cite from [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/) (verified 2026-05-19).
2. Open MDN for the same element for an applied summary plus the BCD table.
3. If MDN says something the LS contradicts, the LS wins. Log the discrepancy in LESSONS.md.

NEVER answer this question from a tutorial blog or a framework documentation page; the platform spec is the only authoritative source.
