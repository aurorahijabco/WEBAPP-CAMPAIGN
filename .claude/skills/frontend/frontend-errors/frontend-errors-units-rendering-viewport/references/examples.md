# References : Examples

Renderable HTML demo plus standalone snippets for `frontend-errors-units-rendering-viewport`. The canonical example is a single-file HTML page that visualises the `100vh` vs `100dvh` vs `100svh` difference side-by-side, demonstrates safe-area inset padding, and shows the rem-vs-em compounding effect. Save the fragment below as `index.html` and open in any evergreen-2026 browser ; for the full viewport-unit difference, open on a real mobile device (or emulate one in DevTools).

## Renderable HTML fragment (save as `index.html`)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Viewport units + safe-area + em-vs-rem demo</title>
  <style>
    :root {
      color-scheme: light dark;
      font-size: 100%; /* respects user preference */
      --c-bg:      light-dark(oklch(0.98 0 0), oklch(0.18 0 0));
      --c-fg:      light-dark(oklch(0.18 0 0), oklch(0.96 0 0));
      --c-muted:   light-dark(oklch(0.50 0 0), oklch(0.70 0 0));
      --c-vh:      light-dark(oklch(0.55 0.18 25),  oklch(0.75 0.16 25));
      --c-lvh:     light-dark(oklch(0.55 0.18 60),  oklch(0.75 0.16 60));
      --c-svh:     light-dark(oklch(0.55 0.16 140), oklch(0.75 0.14 140));
      --c-dvh:     light-dark(oklch(0.55 0.16 220), oklch(0.75 0.14 220));
      --c-line:    light-dark(oklch(0.85 0 0), oklch(0.42 0 0));
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 1rem/1.5 system-ui, sans-serif;
      color: var(--c-fg);
      background: var(--c-bg);
    }

    main { max-width: 64rem; margin: auto; padding: 1.5rem; }
    h1, h2 { margin-block: 1.5rem 0.5rem; }
    p { color: var(--c-muted); }

    .legend { display: grid; gap: 0.5rem; margin-block: 1rem; }
    .legend div { padding: 0.5rem 0.75rem; border-radius: 6px; color: white; }
    .legend .vh  { background: var(--c-vh); }
    .legend .lvh { background: var(--c-lvh); }
    .legend .svh { background: var(--c-svh); }
    .legend .dvh { background: var(--c-dvh); }

    /* Side-by-side viewport-unit comparison */
    .vp-row { display: grid; gap: 1rem; grid-template-columns: repeat(4, 1fr); }
    @media (max-width: 720px) {
      .vp-row { grid-template-columns: 1fr 1fr; }
    }

    .vp-box {
      border: 1px solid var(--c-line);
      border-radius: 8px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: end;
      padding: 0.5rem;
      color: white;
      font-size: 0.75rem;
    }

    .vp-vh  { min-height: 50vh;  background: var(--c-vh); }
    .vp-lvh { min-height: 50lvh; background: var(--c-lvh); }
    .vp-svh { min-height: 50svh; background: var(--c-svh); }
    .vp-dvh { min-height: 50dvh; background: var(--c-dvh); }

    /* Compounding em demo */
    .em-row { padding: 1rem; border: 1px solid var(--c-line); border-radius: 8px; }
    .em-row .em { font-size: 1.5em; }
    .em-row .em .em { font-size: 1.5em; }
    .em-row .em .em .em { font-size: 1.5em; }

    .rem-row { padding: 1rem; border: 1px solid var(--c-line); border-radius: 8px; }
    .rem-row .rem { font-size: 1.5rem; }
    .rem-row .rem .rem { font-size: 1.5rem; }
    .rem-row .rem .rem .rem { font-size: 1.5rem; }

    /* Safe-area-aware sticky footer */
    footer.safe {
      position: sticky;
      bottom: 0;
      margin-top: 2rem;
      padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
      background: var(--c-bg);
      border-top: 1px solid var(--c-line);
      text-align: center;
      color: var(--c-muted);
    }

    /* Hairline border DPR demo */
    .hairline-1px { border: 1px solid var(--c-line); padding: 0.5rem; }
    .hairline-svg svg { display: block; width: 100%; height: 1px; }

    /* Retina canvas demo */
    canvas {
      display: block;
      width: 200px;
      height: 200px;
      border: 1px solid var(--c-line);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <main>
    <h1>Viewport units : 100vh vs 100dvh vs 100svh vs 100lvh</h1>

    <p>Each box below is sized to 50 percent of the corresponding viewport family. Compare on a mobile device with the browser chrome visible and hidden.</p>

    <div class="legend">
      <div class="vh">50vh : legacy, currently equivalent to 50lvh per MDN</div>
      <div class="lvh">50lvh : assumes chrome retracted (maximum extent)</div>
      <div class="svh">50svh : assumes chrome expanded (guaranteed-to-fit)</div>
      <div class="dvh">50dvh : tracks current chrome state (adapts)</div>
    </div>

    <div class="vp-row">
      <div class="vp-box vp-vh">vh</div>
      <div class="vp-box vp-lvh">lvh</div>
      <div class="vp-box vp-svh">svh</div>
      <div class="vp-box vp-dvh">dvh</div>
    </div>

    <h2>em compounding (anti-pattern)</h2>
    <div class="em-row">
      Base (1rem)
      <div class="em">Nested 1.5em (resolves to 1.5rem at this depth)
        <div class="em">Nested 1.5em (resolves to 2.25rem)
          <div class="em">Nested 1.5em (resolves to 3.375rem)</div>
        </div>
      </div>
    </div>

    <h2>rem (predictable)</h2>
    <div class="rem-row">
      Base (1rem)
      <div class="rem">Nested 1.5rem
        <div class="rem">Nested 1.5rem (still 1.5rem)
          <div class="rem">Nested 1.5rem (still 1.5rem)</div>
        </div>
      </div>
    </div>

    <h2>Hairline border strategies</h2>
    <p>Compare on different DPR displays in DevTools.</p>
    <div class="hairline-1px">1px solid border (reliable on every DPR)</div>
    <div class="hairline-svg" style="margin-top: 0.5rem;">
      <svg viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="currentColor" stroke-width="1" />
      </svg>
      SVG hairline (always one device pixel at this viewbox)
    </div>

    <h2>Retina-sharp canvas</h2>
    <canvas id="canvas" width="200" height="200" aria-label="A circle drawn at devicePixelRatio resolution"></canvas>

    <h2>Safe-area-aware footer</h2>
    <p>Scroll to see the sticky footer respect the safe-area-inset-bottom on iOS notch devices.</p>
  </main>

  <footer class="safe">
    <p>Safe-area aware footer. Padding-bottom = 1rem + env(safe-area-inset-bottom).</p>
  </footer>

  <script>
    function setupCanvas(canvas, sizeCss) {
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width  = `${sizeCss}px`;
      canvas.style.height = `${sizeCss}px`;
      canvas.width  = Math.floor(sizeCss * dpr);
      canvas.height = Math.floor(sizeCss * dpr);
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      return ctx;
    }

    const ctx = setupCanvas(document.querySelector("#canvas"), 200);
    ctx.fillStyle = "oklch(0.60 0.18 250)";
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.font = "16px system-ui";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(`DPR ${window.devicePixelRatio}`, 100, 105);
  </script>
</body>
</html>
```

Self-contained. Open on mobile to see the actual difference between `100vh`, `100dvh`, `100svh`, and `100lvh` as you scroll and the browser chrome retracts. Open DevTools and toggle device emulation (iPhone 14 Pro for notch and Dynamic Island).

## Standalone examples

### Mobile-safe hero with progressive enhancement

```css
.hero {
  min-height: 100svh; /* baseline ; never overflows */
}

@supports (height: 100dvh) {
  .hero {
    min-height: 100dvh; /* upgrade ; adapts as chrome retracts */
  }
}
```

### Legacy `--vh` workaround (do NOT use ; migrate to dvh)

```js
// BAD : pre-2022 community pattern
function setVh() {
  document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
}
setVh();
window.addEventListener("resize", setVh);
```

```css
/* BAD */
.hero { min-height: calc(var(--vh, 1vh) * 100); }
```

The pattern requires JS for a presentational concern, fires the update only AFTER the chrome animation completes (causing visible jumps), and cannot be opted out via `prefers-reduced-motion`. Migrate to `100dvh` with a `100svh` fallback.

### Predictable font scale

```css
:root {
  font-size: 100%; /* user preference */
}

h1 { font-size: 2.5rem;  }
h2 { font-size: 2rem;    }
h3 { font-size: 1.5rem;  }
h4 { font-size: 1.25rem; }
p  { font-size: 1rem;    }
```

All sizes resolve against root. No compounding regardless of nesting depth.

### Scaling button padding

```css
.btn {
  font-size: 1rem;
  padding: 0.5em 1em; /* scales with the button's own font-size */
  border-radius: 0.5em; /* corners scale too */
}

.btn.small { font-size: 0.875rem; } /* padding + radius scale */
.btn.large { font-size: 1.25rem;  }
```

The `em` units re-resolve against each button's own `font-size`, so all proportions stay correct across sizes.

### Safe-area sticky bottom nav

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
nav.bottom {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom));
  background: white;
}
```

### Safe-area edges all around

```css
.app {
  padding-top:    env(safe-area-inset-top);
  padding-right:  env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left:   env(safe-area-inset-left);
}
```

Useful for full-screen PWA shells where every edge could be occluded by a cutout in landscape.

### Foldable / dual-screen layout

```css
@media (min-width: 600px) and (horizontal-viewport-segments: 2) {
  .layout {
    display: grid;
    grid-template-columns: env(viewport-segment-width 0 0) env(viewport-segment-width 1 0);
    gap: env(viewport-segment-left 1 0) - env(viewport-segment-right 0 0);
  }
}
```

Supports Surface Duo and similar dual-screen / foldable form factors.

### Soft-keyboard-aware layout (Chromium)

```js
if ("virtualKeyboard" in navigator) {
  navigator.virtualKeyboard.overlaysContent = true;
}
```

```css
.composer {
  position: fixed;
  bottom: env(keyboard-inset-height, 0px);
  inset-inline: 0;
}
```

The composer rises above the soft keyboard when it appears, with no JS resize handlers required.

### HiDPI canvas drawing

```js
function setupCanvas(canvas, sizeCss) {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width  = `${sizeCss}px`;
  canvas.style.height = `${sizeCss}px`;
  canvas.width  = Math.floor(sizeCss * dpr);
  canvas.height = Math.floor(sizeCss * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return ctx;
}
```

### Responsive image with density descriptors

```html
<img
  src="img.jpg"
  srcset="img.jpg 1x, img-2x.jpg 2x, img-3x.jpg 3x"
  width="800"
  height="450"
  alt="..."
  loading="lazy"
  decoding="async"
/>
```

### Prose container with optimal line-length

```css
.prose {
  max-width: 65ch; /* approximately 45 to 75 characters per line */
  margin-inline: auto;
}
```

### Inline icon aligned with text baseline

```css
.icon-inline {
  height: 1ex;
  width: auto;
  vertical-align: baseline;
}
```

The icon's top aligns with the x-height of surrounding lowercase glyphs.

### Scrollbar-gutter reservation

```css
:root {
  scrollbar-gutter: stable;
}
```

Layouts no longer jump when content overflows and the scrollbar appears.
