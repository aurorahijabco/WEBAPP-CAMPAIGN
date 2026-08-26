# Examples : Feature-detection and gating patterns

All snippets verified against the sources cited in SKILL.md.

## Example 1 : Ship a Widely Available CSS feature without a gate

`oklch()` reached Baseline Widely Available in May 2023. NO `@supports` wrapper needed.

```css
:root {
  --surface: oklch(0.97 0 0);
  --accent: oklch(0.68 0.18 250);
}
.card {
  background-color: var(--surface);
  border: 1px solid var(--accent);
}
```

## Example 2 : Gate a Newly Available CSS feature

Popover API positioned via `anchor()` (Newly Available 2025) needs a `@supports` gate.

```css
.menu {
  position: absolute;
  inset: auto auto 0 0;
}

@supports (position-anchor: --menu-anchor) {
  .menu-trigger { anchor-name: --menu-anchor; }
  .menu {
    position-anchor: --menu-anchor;
    inset: auto;
    top: anchor(--menu-anchor bottom);
    left: anchor(--menu-anchor left);
  }
}
```

The unsupported path uses static positioning; the supported path overrides with anchor-based placement.

## Example 3 : Selector-level gate for `:has()`

```css
ul.menu li:not(:last-child) {
  border-bottom: 1px solid #ccc;
}

@supports selector(:has(*)) {
  ul.menu:has(li[aria-current="page"]) {
    background-color: oklch(0.97 0 0);
  }
}
```

## Example 4 : Combine conditions

```css
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

@supports (display: grid) and (gap: 1rem) {
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }
}
```

## Example 5 : Negation gate

Apply a polyfill style ONLY when the modern feature is missing.

```css
@supports not (aspect-ratio: 16 / 9) {
  .video-frame {
    padding-top: 56.25%;
    position: relative;
  }
  .video-frame > * {
    position: absolute;
    inset: 0;
  }
}
```

## Example 6 : `CSS.supports()` from JS

```js
function applyEnhancement(el) {
  if (CSS.supports("backdrop-filter", "blur(10px)")) {
    el.classList.add("glass");
  } else {
    el.classList.add("solid");
  }
}
```

## Example 7 : Detect a global Web API

```js
if ('ResizeObserver' in window) {
  const ro = new ResizeObserver(entries => {
    for (const e of entries) syncLayout(e.target);
  });
  ro.observe(panel);
} else {
  window.addEventListener('resize', () => syncLayout(panel));
}
```

## Example 8 : Detect an instance method

```js
function groupItems(items, keyFn) {
  if ('groupBy' in Object) {
    return Object.groupBy(items, keyFn);
  }
  return items.reduce((acc, x) => {
    const k = keyFn(x);
    (acc[k] ??= []).push(x);
    return acc;
  }, Object.create(null));
}
```

## Example 9 : Detect an element-prototype method

```js
function openPopover(el) {
  if ('showPopover' in HTMLElement.prototype) {
    el.showPopover();
    return;
  }
  el.hidden = false;
  el.classList.add('open');
}
```

## Example 10 : Reading Baseline status in CI

```js
// scripts/check-features.mjs
import features from 'web-features';

const required = ['has', 'container-queries', 'popover', 'view-transitions'];
const today = new Date();

for (const id of required) {
  const f = features[id];
  if (!f) {
    console.error(`Unknown feature id: ${id}`);
    process.exit(1);
  }
  const status = f.status.baseline;
  if (status === false) {
    console.error(`${id} is Limited Availability. MUST be behind an opt-in.`);
    process.exit(1);
  }
  if (status === 'low') {
    console.warn(`${id} is Newly Available since ${f.status.baseline_low_date}. Ensure @supports gating is present.`);
  }
}
```

## Example 11 : Remove a wrapper when the feature becomes Widely Available

Before (during Newly Available window) :

```css
.card { background-color: #f6f8fa; }
@supports (background-color: oklch(0.97 0 0)) {
  .card { background-color: oklch(0.97 0 0); }
}
```

After (Widely Available reached, 6 months elapsed) :

```css
.card { background-color: oklch(0.97 0 0); }
```

## Example 12 : NEVER use try/catch as feature detection

```js
// WRONG : masks non-detection errors
try {
  new ResizeObserver(() => {});
  window.RO_AVAILABLE = true;
} catch {
  window.RO_AVAILABLE = false;
}

// RIGHT
window.RO_AVAILABLE = 'ResizeObserver' in window;
```

## Example 13 : NEVER UA-sniff

```js
// WRONG : breaks on every browser version change
if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
  applySafariWorkaround();
}

// RIGHT : test the specific capability you care about
if (!CSS.supports('background-clip', 'text')) {
  applyBackgroundClipFallback();
}
```
