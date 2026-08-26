# References : Examples

Renderable HTML fragment plus standalone snippets for `frontend-a11y-motion-contrast-wcag22`. The canonical example is a single-file HTML page that demonstrates motion respecting `prefers-reduced-motion`, contrast-meeting text examples using `light-dark()`, and minimum-target-size icon buttons that satisfy WCAG 2 2 SC 2 5 8. Save the fragment below as `index.html` and open in any evergreen-2026 browser to verify.

## Renderable HTML fragment (save as `index.html`)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WCAG 2 2 demo : motion, contrast, target size</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: light-dark(oklch(0.99 0 0), oklch(0.18 0.01 250));
      --text: light-dark(oklch(0.22 0.01 250), oklch(0.96 0 0));
      --muted: light-dark(oklch(0.45 0.02 250), oklch(0.75 0.02 250));
      --accent: light-dark(oklch(0.50 0.18 250), oklch(0.80 0.14 250));
      --accent-text: light-dark(white, black);
      --border: light-dark(oklch(0.82 0.01 250), oklch(0.42 0.01 250));
      --header-h: 64px;
    }

    @media (prefers-contrast: more) {
      :root {
        --bg: Canvas;
        --text: CanvasText;
        --muted: CanvasText;
        --accent: Highlight;
        --accent-text: HighlightText;
        --border: CanvasText;
      }
    }

    html { scroll-padding-top: var(--header-h); }

    body {
      margin: 0;
      font: 16px/1.5 system-ui, sans-serif;
      color: var(--text);
      background: var(--bg);
    }

    header {
      position: sticky;
      top: 0;
      height: var(--header-h);
      display: flex;
      align-items: center;
      padding: 0 1rem;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      z-index: 10;
    }

    main { padding: 2rem 1rem; max-width: 56rem; margin: auto; }
    section { margin-block: 2.5rem; }
    h1, h2 { color: var(--text); }
    h2 { font-size: 1.25rem; margin-block: 1.5rem 0.75rem; }
    p  { color: var(--text); }
    .muted { color: var(--muted); }

    .icon-btn {
      display: inline-grid;
      place-items: center;
      width: 24px;
      height: 24px;
      padding: 0;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text);
      cursor: pointer;
    }

    .icon-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      scroll-margin-top: var(--header-h);
    }

    .toolbar { display: flex; gap: 24px; }

    .btn-primary {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      min-height: 44px;
      background: var(--accent);
      color: var(--accent-text);
      border: 1px solid transparent;
      border-radius: 6px;
      font: inherit;
      cursor: pointer;
    }

    .btn-primary:focus-visible {
      outline: 2px solid var(--text);
      outline-offset: 2px;
    }

    @media (forced-colors: active) {
      .btn-primary { border-color: ButtonText; }
      .icon-btn   { border-color: ButtonText; }
    }

    .card { padding: 1rem; border: 1px solid var(--border); border-radius: 8px; }

    @media (prefers-reduced-motion: no-preference) {
      .card {
        animation: slide-in 500ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }
    }

    @keyframes slide-in {
      from { transform: translateY(16px); opacity: 0; }
      to   { transform: none;             opacity: 1; }
    }

    .toast {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      animation: slide-up 250ms ease-out;
    }

    @media (prefers-reduced-motion: reduce) {
      .toast { animation: cross-fade 150ms linear; }
    }

    @keyframes slide-up   { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes cross-fade { from { opacity: 0; } to { opacity: 1; } }

    .nav-blur { background: oklch(from var(--bg) l c h / 0.7); backdrop-filter: blur(12px); }

    @media (prefers-reduced-transparency: reduce) {
      .nav-blur { background: var(--bg); backdrop-filter: none; }
    }
  </style>
</head>
<body>
  <header class="nav-blur">
    <strong>WCAG 2 2 demo</strong>
  </header>

  <main>
    <section>
      <h1>Contrast (AA)</h1>
      <p>This paragraph uses <code>--text</code> on <code>--bg</code>. The OKLCH lightness pair was chosen so the rendered ratio exceeds 7 to 1 in light mode and 4 5 to 1 in dark mode. Verify with the browser DevTools accessibility pane.</p>
      <p class="muted">Muted text uses <code>--muted</code>. Confirm the ratio stays above 4 5 to 1 against the surface ; the muted token must not slip into a 4 4 to 1 audit fail.</p>
    </section>

    <section>
      <h2>Target Size (2 5 8 AA)</h2>
      <p>Icon buttons are exactly 24 by 24 CSS pixels with 24-pixel gaps so either the size rule or the spacing exception is satisfied.</p>
      <div class="toolbar">
        <button class="icon-btn" aria-label="Edit">E</button>
        <button class="icon-btn" aria-label="Delete">D</button>
        <button class="icon-btn" aria-label="Share">S</button>
      </div>
      <p><button class="btn-primary">Primary action</button> meets 24 by 24 with comfortable headroom.</p>
    </section>

    <section>
      <h2>Motion</h2>
      <p>The card below animates in only when the user has not requested reduced motion :</p>
      <div class="card">
        <strong>This card uses <code>@media (prefers-reduced-motion: no-preference)</code> as the gate.</strong>
        <p>Set your OS to reduce motion and reload : the slide animation disappears entirely.</p>
      </div>
      <p>The toast below crossfades when motion is reduced :</p>
      <div class="toast" role="status">Saved.</div>
    </section>

    <section>
      <h2>Forced colors</h2>
      <p>Enable Windows High Contrast Mode (Settings &gt; Accessibility &gt; Contrast themes) and observe : the primary button keeps its <code>ButtonText</code> border, the icon buttons keep theirs, and <code>box-shadow</code> is forced to <code>none</code> with no loss of definition.</p>
    </section>
  </main>

  <script>
    // Live OS-setting changes : update the demo without reload.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", () => location.reload());
  </script>
</body>
</html>
```

This file is intentionally self-contained : no external CSS, no JS framework, no fonts. Saving and opening it exercises every pattern the skill covers.

## Standalone examples

### Opt-in motion gate

```css
.card { opacity: 1; transform: none; }

@media (prefers-reduced-motion: no-preference) {
  .card {
    animation: slide-in 400ms ease-out;
  }
}

@keyframes slide-in {
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: none;             opacity: 1; }
}
```

### Reduce branch (crossfade replacement)

```css
.toast { animation: slide-up 250ms ease-out; }

@media (prefers-reduced-motion: reduce) {
  .toast { animation: cross-fade 150ms linear; }
}
```

### View Transitions skip when reduce

```js
function update(stateChange) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !document.startViewTransition) {
    stateChange();
    return;
  }
  document.startViewTransition(stateChange);
}
```

### prefers-contrast palette swap with light-dark

```css
:root {
  color-scheme: light dark;
  --text: light-dark(oklch(0.22 0 0), oklch(0.96 0 0));
  --bg:   light-dark(oklch(0.99 0 0), oklch(0.18 0 0));
}

@media (prefers-contrast: more) {
  :root {
    --text: light-dark(black, white);
    --bg:   light-dark(white, black);
  }
}
```

### forced-colors fallback with system color keywords

```css
.btn {
  background: var(--accent);
  color: white;
  border: 1px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@media (forced-colors: active) {
  .btn {
    border-color: ButtonText;
    /* box-shadow is forced to none ; the border restores definition */
  }
}
```

### Target size : padding to 24 by 24

```css
.icon-btn {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border);
}
```

### Target size : spacing exception

```css
.row .icon-btn {
  width: 16px;
  height: 16px;
}

.row .icon-btn + .icon-btn {
  margin-left: 24px; /* 24-px-diameter circles do not intersect */
}
```

### Focus-not-obscured remediation

```css
:root { --header-h: 64px; }

html { scroll-padding-top: var(--header-h); }

:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  scroll-margin-top: var(--header-h);
}
```

### Accessible authentication

```html
<form action="/sign-in" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="username" required />

  <label for="pw">Password</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" required />

  <button type="submit">Sign in</button>

  <p><a href="/passkey">Or sign in with a passkey</a></p>
</form>
```

NO `onpaste="return false"` handler. NO blocked autofill. Passkey path offered as the cognitive-test-free alternative.

### prefers-reduced-transparency opt-out

```css
.nav {
  background: oklch(from var(--surface) l c h / 0.7);
  backdrop-filter: blur(12px);
}

@media (prefers-reduced-transparency: reduce) {
  .nav {
    background: var(--surface);
    backdrop-filter: none;
  }
}
```

### Conditional font loading via `Save-Data`

```html
<link
  rel="preload"
  href="/fonts/inter-variable.woff2"
  as="font"
  type="font/woff2"
  crossorigin
  fetchpriority="high"
/>

<script>
  if (navigator.connection?.saveData) {
    document.querySelector('link[rel="preload"]')?.remove();
  }
</script>
```

`prefers-reduced-data` is not yet implemented in any browser ; the `Save-Data` HTTP client hint is the production-ready equivalent.

### JS detection : live preference changes

```js
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function applyMotionPolicy() {
  if (motionQuery.matches) {
    cancelImperativeAnimations();
  } else {
    enableImperativeAnimations();
  }
}

applyMotionPolicy();
motionQuery.addEventListener("change", applyMotionPolicy);
```

Critical for SPAs that compose animation imperatively (GSAP, Framer Motion, Motion One). CSS `@media` rules update automatically on OS-setting change ; imperative JS code must subscribe to `change`.
