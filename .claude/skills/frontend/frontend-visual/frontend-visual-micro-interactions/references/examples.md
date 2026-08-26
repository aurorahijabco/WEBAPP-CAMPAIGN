# References : Micro-Interactions Examples

All snippets WebFetch-verified against MDN and W3C sources on 2026-05-19. The renderable demo below shows three canonical patterns side-by-side : button press feedback, `:has()` card hover, and staggered list entrance. All collapse correctly under `prefers-reduced-motion: reduce`.

## 1. Renderable Self-Contained Demo

Save the following as `demo.html` and open in any evergreen-2026 browser. To verify the reduced-motion variant, toggle the OS reduced-motion setting (macOS : System Settings > Accessibility > Display > Reduce motion; Windows : Settings > Accessibility > Visual effects > Animation effects off; or in DevTools : Rendering tab > Emulate CSS media `prefers-reduced-motion: reduce`).

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <title>Micro-Interactions Demo</title>
  <style>
    :root {
      color-scheme: light dark;

      --bg:      light-dark(#f6f7f9, #0b0d12);
      --surface: light-dark(#ffffff, #14171f);
      --fg:      light-dark(#0a0a0a, #f5f5f5);
      --muted:   light-dark(#52525b, #a1a1aa);
      --border:  light-dark(#e2e8f0, #1f2937);
      --accent:  light-dark(oklch(60% 0.18 250), oklch(70% 0.16 250));
      --accent-fg: light-dark(#ffffff, #0b0d12);

      --motion-instant: 100ms;
      --motion-fast:    150ms;
      --motion-base:    200ms;
      --motion-medium:  250ms;
      --easing-standard: cubic-bezier(0.2, 0, 0, 1);
      --easing-pop:      cubic-bezier(0.16, 1, 0.3, 1);
    }

    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding-block: 2rem;
      padding-inline: 1.5rem;
      font-family: system-ui, sans-serif;
      background: var(--bg);
      color: var(--fg);
    }

    h1 { font-size: 1.5rem; margin-block: 0 1rem; }
    h2 { font-size: 1.125rem; margin-block: 2rem 0.75rem; }

    /* --- Pattern A : Button press feedback --- */
    .btn {
      background: var(--accent);
      color: var(--accent-fg);
      border: 0;
      border-radius: 6px;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      cursor: pointer;
      font: inherit;
      transition:
        transform var(--motion-instant) var(--easing-standard),
        background-color var(--motion-fast) var(--easing-standard),
        box-shadow var(--motion-fast) var(--easing-standard);
    }
    .btn:hover { background: color-mix(in oklch, var(--accent), white 8%); }
    .btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .btn:active { transform: scale(0.97); }

    /* --- Pattern B : Card with :has() parent reactivity --- */
    .card-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
      transition:
        transform var(--motion-base) var(--easing-standard),
        box-shadow var(--motion-base) var(--easing-standard);
    }

    .card-title { margin: 0 0 0.5rem; font-size: 1rem; }
    .card-body  { margin: 0 0 0.75rem; color: var(--muted); font-size: 0.875rem; }

    .card-cta {
      background: transparent;
      color: var(--accent);
      border: 0;
      padding: 0;
      font: inherit;
      cursor: pointer;
    }

    .card-cta:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    .card:has(.card-cta:hover) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgb(0 0 0 / 0.08);
    }

    .card:has(:focus-visible) {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    /* --- Pattern C : Staggered list entrance --- */
    .list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.5rem;
    }

    .list li {
      padding: 0.75rem 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      opacity: 0;
      transform: translateY(8px);
      transition:
        opacity var(--motion-medium) var(--easing-pop),
        transform var(--motion-medium) var(--easing-pop);
      transition-delay: calc(var(--index, 0) * 50ms);
    }

    .list.is-revealed li {
      opacity: 1;
      transform: translateY(0);
    }

    button.reveal-trigger {
      margin-block-end: 1rem;
    }

    /* --- Universal reduced-motion collapse --- */
    @media (prefers-reduced-motion: reduce) {
      .btn,
      .card,
      .list li {
        transition-duration: 100ms;
        transition-timing-function: linear;
        transition-delay: 0ms !important;
      }
      .btn:active { transform: none; }
      .card:has(.card-cta:hover) {
        transform: none;
        box-shadow: 0 0 0 2px var(--accent);
      }
      .list li {
        transform: none;
        transition-property: opacity;
      }
    }
  </style>
</head>

<body>
  <h1>Micro-Interactions Demo</h1>

  <h2>Pattern A : Button press feedback</h2>
  <p>
    <button class="btn" type="button">Click me</button>
    <button class="btn" type="button">Or me</button>
  </p>

  <h2>Pattern B : Card with :has(:hover) parent reactivity</h2>
  <div class="card-grid">
    <article class="card">
      <h3 class="card-title">Native nesting</h3>
      <p class="card-body">Native nesting replaces preprocessor syntax for evergreen browsers.</p>
      <button type="button" class="card-cta">Read more</button>
    </article>
    <article class="card">
      <h3 class="card-title">Logical properties</h3>
      <p class="card-body">margin-inline-start adapts to LTR and RTL automatically.</p>
      <button type="button" class="card-cta">Read more</button>
    </article>
    <article class="card">
      <h3 class="card-title">light-dark()</h3>
      <p class="card-body">Eliminates duplicated media queries when color-scheme is set.</p>
      <button type="button" class="card-cta">Read more</button>
    </article>
  </div>

  <h2>Pattern C : Staggered list entrance</h2>
  <button class="btn reveal-trigger" type="button" id="reveal">Reveal list</button>
  <ul class="list" id="list">
    <li style="--index: 0">First item</li>
    <li style="--index: 1">Second item</li>
    <li style="--index: 2">Third item</li>
    <li style="--index: 3">Fourth item</li>
    <li style="--index: 4">Fifth item</li>
  </ul>

  <script>
    document.getElementById('reveal').addEventListener('click', () => {
      document.getElementById('list').classList.add('is-revealed');
    });
  </script>
</body>
</html>
```

### What this demo proves

1. The button feels "good to click" : 100 ms scale(0.97) press, 150 ms hover background change, both with explicit Material easing.
2. The card lifts when the inner button is hovered, via `:has(.card-cta:hover)`. Cross-component reactivity without JS.
3. The list reveals with 50 ms per-item stagger, peaking around 200 ms after the trigger. Under `prefers-reduced-motion: reduce`, the stagger collapses to a parallel opacity fade.
4. Every focusable element has a `:focus-visible` style equivalent to its hover state.
5. Reduced-motion: the press scale disappears, the card lift is replaced by a focus-ring-style outline, the list stagger collapses to parallel opacity. Information is preserved; motion is removed.

## 2. `@starting-style` + `transition-behavior: allow-discrete` for a tooltip

Animating a tooltip that toggles `display: none` -> `display: block`. Without `allow-discrete` and `@starting-style`, the tooltip pops in instantly.

```html
<button type="button" id="open-tip">Hover me</button>
<div id="tip" class="tooltip">Sample tooltip text</div>
```

```css
.tooltip {
  position: absolute;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;

  /* Hidden default state */
  opacity: 0;
  transform: translateY(4px);
  display: none;

  transition:
    opacity   200ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
    display   200ms allow-discrete;
}

.tooltip.is-open {
  opacity: 1;
  transform: translateY(0);
  display: block;
}

/* MUST be placed AFTER the .is-open rule (same specificity, source order wins) */
@starting-style {
  .tooltip.is-open {
    opacity: 0;
    transform: translateY(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: opacity 100ms linear, display 100ms allow-discrete;
    transform: none;
  }
  @starting-style { .tooltip.is-open { opacity: 0; transform: none; } }
}
```

```js
const btn = document.getElementById('open-tip');
const tip = document.getElementById('tip');
btn.addEventListener('mouseenter', () => tip.classList.add('is-open'));
btn.addEventListener('mouseleave', () => tip.classList.remove('is-open'));
btn.addEventListener('focus',      () => tip.classList.add('is-open'));
btn.addEventListener('blur',       () => tip.classList.remove('is-open'));
```

## 3. Bouncy entrance via `@keyframes` (use sparingly)

```css
@keyframes spring-in {
  0%   { opacity: 0; transform: translateY(8px) scale(0.96); }
  60%  { opacity: 1; transform: translateY(-2px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.toast.is-celebrate {
  animation: spring-in 350ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .toast.is-celebrate {
    animation: none;
    opacity: 1;
  }
}
```

NEVER use this on destructive actions (Delete confirmation, Sign-out toast). The bounce reads as "playful," which mismatches the tone of a serious action.

## 4. Stagger with IntersectionObserver

```html
<ul class="list">
  <li style="--index: 0">A</li>
  <li style="--index: 1">B</li>
  <li style="--index: 2">C</li>
</ul>
```

```js
const list = document.querySelector('.list');
const io = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    list.classList.add('is-revealed');
    io.disconnect();   // run only once
  }
}, { threshold: 0.2 });
io.observe(list);
```

Pair with the CSS from Pattern C above. The list animates in only when it scrolls into view.
