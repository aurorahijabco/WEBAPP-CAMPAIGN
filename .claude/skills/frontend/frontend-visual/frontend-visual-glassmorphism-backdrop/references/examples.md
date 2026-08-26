# References : Examples

Renderable HTML fragment plus standalone snippets for `frontend-visual-glassmorphism-backdrop`. The canonical example is a single-file HTML page that demonstrates a sticky frosted header over scrolling content AND a side-by-side broken-versus-fixed backdrop-root pitfall. Save the fragment below as `index.html` and open in any evergreen-2026 browser.

## Renderable HTML fragment (save as `index.html`)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>backdrop-filter demo : header + backdrop-root pitfall</title>
  <style>
    :root {
      color-scheme: light dark;
      --tile-a: oklch(0.70 0.18 30);
      --tile-b: oklch(0.65 0.18 200);
      --tile-c: oklch(0.75 0.18 130);
      --tile-d: oklch(0.55 0.18 280);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 200vh;
      font: 16px/1.5 system-ui, sans-serif;
      color: oklch(0.18 0 0);
      background:
        conic-gradient(from 0deg at 25% 25%, var(--tile-a), var(--tile-b), var(--tile-c), var(--tile-d), var(--tile-a));
    }

    /* Sticky frosted header ----------------------------------- */

    .header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      height: 64px;
      background: oklch(0.99 0 0 / 0.6);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border-bottom: 1px solid oklch(0.85 0 0 / 0.4);
      color: oklch(0.18 0 0);
    }

    @supports not (backdrop-filter: blur(1px)) {
      .header { background: oklch(0.99 0 0 / 0.95); }
    }

    @media (prefers-reduced-transparency: reduce) {
      .header {
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        background: oklch(0.99 0 0);
      }
    }

    @media (forced-colors: active) {
      .header {
        backdrop-filter: none;
        background: Canvas;
        border-color: ButtonText;
        color: CanvasText;
      }
    }

    main { padding: 2rem 1.5rem; max-width: 64rem; margin: auto; }
    section { margin-block: 2rem; }
    h2 { margin-block: 1rem 0.5rem; }

    /* Backdrop-root pitfall demo ------------------------------ */

    .demo-row {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 720px) {
      .demo-row { grid-template-columns: 1fr; }
    }

    .demo-cell {
      position: relative;
      padding: 2rem;
      min-height: 220px;
      border-radius: 12px;
      overflow: hidden;
      background:
        radial-gradient(circle at 20% 30%, var(--tile-b), transparent 60%),
        radial-gradient(circle at 80% 70%, var(--tile-a), transparent 60%),
        oklch(0.40 0.10 250);
      color: white;
    }

    .demo-cell h3 { margin: 0 0 0.5rem; }

    /* The "BROKEN" wrapper has opacity < 1, which establishes a backdrop-root */
    .broken-wrapper { opacity: 0.95; }

    /* The "FIXED" wrapper uses a translucent background-color instead */
    .fixed-wrapper { background: oklch(0.99 0 0 / 0.05); }

    .glass {
      margin-top: 1rem;
      padding: 1rem;
      background: oklch(0.99 0 0 / 0.6);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border: 1px solid oklch(0.99 0 0 / 0.4);
      border-radius: 8px;
      color: oklch(0.18 0 0);
      text-shadow: 0 0 6px oklch(0.99 0 0 / 0.6);
    }

    /* Glass card OVER scrolling content ----------------------- */

    .scroll-zone {
      position: relative;
      height: 300px;
      overflow: auto;
      border-radius: 12px;
      background:
        repeating-linear-gradient(45deg, var(--tile-a) 0 24px, var(--tile-b) 24px 48px);
    }

    .scroll-zone .glass {
      position: sticky;
      top: 0;
      margin: 0;
    }

    .scroll-zone .scroll-content {
      padding-top: 220px;
      padding-inline: 1rem;
      padding-bottom: 1rem;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
    }
  </style>
</head>
<body>
  <header class="header">
    <strong>backdrop-filter demo</strong>
  </header>

  <main>
    <section>
      <h2>Sticky frosted header</h2>
      <p>Scroll. The header above stays at the top and blurs the gradient background.</p>
      <p>The page intentionally has a colorful conic gradient so the blur effect is visible.</p>
    </section>

    <section>
      <h2>Backdrop-root pitfall : broken vs fixed</h2>
      <div class="demo-row">
        <div class="demo-cell">
          <h3>BROKEN</h3>
          <p>Wrapper has <code>opacity: 0.95</code>, which establishes a backdrop-root. The glass child below cannot see past the wrapper.</p>
          <div class="broken-wrapper">
            <div class="glass">backdrop-filter is silently dropped here</div>
          </div>
        </div>

        <div class="demo-cell">
          <h3>FIXED</h3>
          <p>Wrapper uses a translucent <code>background-color</code> instead of <code>opacity</code>. The glass child blurs the underlying gradient.</p>
          <div class="fixed-wrapper">
            <div class="glass">backdrop-filter now works</div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2>Glass card over scrolling content</h2>
      <div class="scroll-zone">
        <div class="glass">Sticky glass card. Scroll the striped zone underneath.</div>
        <div class="scroll-content">
          <p>Stripes scroll under the glass card. The blur shows the moving pattern.</p>
          <p>Sample lines of content to make this zone scroll.</p>
          <p>Sample lines of content to make this zone scroll.</p>
          <p>Sample lines of content to make this zone scroll.</p>
          <p>Sample lines of content to make this zone scroll.</p>
          <p>Sample lines of content to make this zone scroll.</p>
          <p>Sample lines of content to make this zone scroll.</p>
        </div>
      </div>
    </section>

    <section style="height: 80vh;">
      <h2>Extra space to scroll the page</h2>
      <p>Watch the sticky header blur as the page scrolls.</p>
    </section>
  </main>
</body>
</html>
```

Self-contained : no external assets. Two demonstrations on the same page :

1. The sticky `.header` uses `backdrop-filter` over the page's conic gradient.
2. The "BROKEN" cell wraps `.glass` in a `opacity: 0.95` parent so the filter silently does nothing ; the "FIXED" cell wraps it in a translucent-background parent so the filter applies normally.

Verify in DevTools : pause paint, inspect the `.glass` in the BROKEN cell. The `backdrop-filter` is still in the computed-style panel but the visible surface is solid.

## Standalone examples

### Minimal frosted card

```css
.card {
  background: oklch(0.99 0 0 / 0.6);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid oklch(0.99 0 0 / 0.3);
  border-radius: 12px;
  padding: 1rem;
}

@supports not (backdrop-filter: blur(1px)) {
  .card { background: oklch(0.99 0 0 / 0.95); }
}
```

### Dark-mode frosted card with `light-dark()`

```css
:root {
  color-scheme: light dark;
}

.card {
  background: light-dark(
    oklch(0.99 0 0 / 0.6),
    oklch(0.20 0 0 / 0.6)
  );
  backdrop-filter: blur(14px) saturate(160%);
  color: light-dark(oklch(0.18 0 0), oklch(0.96 0 0));
}
```

### Modal overlay with a one-shot expensive blur

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: oklch(0.10 0 0 / 0.4);
  backdrop-filter: blur(24px);
}

.modal {
  position: fixed;
  inset: 10vh 50% auto 50%;
  transform: translateX(-50%);
  background: oklch(0.99 0 0);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 24px 64px oklch(0 0 0 / 0.2);
}
```

The modal itself uses a solid background ; only the full-screen overlay carries the blur. This is cheap to paint once and disappears when the modal closes.

### Glass over user-generated content (defensive)

```css
.glass-on-photo {
  position: relative;
  background: oklch(0.99 0 0 / 0.65);
  backdrop-filter: blur(20px) saturate(140%) brightness(110%);
  color: oklch(0.18 0 0);
}

.glass-on-photo::before {
  content: "";
  position: absolute;
  inset: 0;
  background: oklch(0.99 0 0 / 0.3);
  z-index: -1;
}

.glass-on-photo h2 {
  text-shadow: 0 0 10px oklch(0.99 0 0 / 0.5);
}
```

The pseudo-element acts as a buffer between the user-uploaded photo and the glass, guaranteeing a baseline contrast even on the worst-case background. The text-shadow halo is a final defense.

### Avoid animating backdrop-filter (paint-storm fix)

```css
/* WRONG : per-frame backdrop re-sample */
.glass { transition: backdrop-filter 300ms ease; }
.glass:hover { backdrop-filter: blur(24px); }

/* RIGHT : animate an overlay's opacity instead */
.glass {
  position: relative;
  backdrop-filter: blur(16px);
}

.glass::after {
  content: "";
  position: absolute;
  inset: 0;
  background: oklch(0.99 0 0 / 0);
  transition: background 200ms ease;
  pointer-events: none;
}

.glass:hover::after {
  background: oklch(0.99 0 0 / 0.2);
}
```

### Intersection-toggle for scroll-heavy lists

```js
const glasses = document.querySelectorAll(".glass");

const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.style.backdropFilter = "blur(12px) saturate(160%)";
    } else {
      entry.target.style.backdropFilter = "none";
    }
  }
}, { rootMargin: "200px" });

for (const el of glasses) io.observe(el);
```

Disable the filter while the element is off-screen ; re-enable just before it enters the viewport. Combine with `content-visibility: auto` (see `[[frontend-perf-core-web-vitals-inp]]`) for compounded savings.

### Feature-detect from JavaScript

```js
const supports = CSS.supports("backdrop-filter", "blur(1px)");

if (supports) {
  document.documentElement.classList.add("supports-backdrop-filter");
}
```

Then drive the fallback in CSS via the class instead of `@supports` when finer control is needed.
