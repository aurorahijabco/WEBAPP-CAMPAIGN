# References : Dark / Light Theming Examples

All snippets WebFetch-verified against sources cited in `methods.md` on 2026-05-19.

## 1. Complete Renderable Demo : Three-State Toggle with No FOUC

Save the following as `demo.html` and open in any evergreen-2026 browser. Includes : `color-scheme: light dark`, `light-dark()` throughout, inline head script for instant theme application, three-button toggle (system / light / dark), localStorage persistence, accessible `aria-pressed`, and system-change listener (only when user choice = system).

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <title>Dark / Light Demo</title>

  <!-- HEAD SCRIPT : runs BEFORE the stylesheet. Sets data-theme synchronously.
       ZERO flash of unstyled theme on reload. -->
  <script>
    (function () {
      try {
        var t = localStorage.getItem('theme');
        if (t === 'light' || t === 'dark') {
          document.documentElement.setAttribute('data-theme', t);
        }
      } catch (e) { /* localStorage may be disabled */ }
    })();
  </script>

  <style>
    :root {
      color-scheme: light dark;

      --bg:        light-dark(#ffffff, #0b0d12);
      --surface:   light-dark(#f6f7f9, #14171f);
      --fg:        light-dark(#0a0a0a, #f5f5f5);
      --fg-muted:  light-dark(#52525b, #a1a1aa);
      --border:    light-dark(#e2e8f0, #1f2937);
      --accent:    light-dark(#2563eb, #60a5fa);
      --accent-fg: light-dark(#ffffff, #0b0d12);
    }

    /* Forced overrides : ALSO set color-scheme so UA UI matches */
    :root[data-theme="light"] { color-scheme: light; }
    :root[data-theme="dark"]  { color-scheme: dark;  }

    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      padding-block: 2rem;
      padding-inline: 1.5rem;
      font-family: system-ui, sans-serif;
      background: var(--bg);
      color: var(--fg);
      transition: background-color 200ms ease, color 200ms ease;
    }

    @media (prefers-reduced-motion: reduce) {
      body { transition: none; }
    }

    h1 { font-size: 1.5rem; margin-block: 0 1rem; }

    .toggle {
      display: inline-flex;
      gap: 0.25rem;
      padding: 0.25rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    .toggle button {
      padding-block: 0.375rem;
      padding-inline: 0.75rem;
      background: transparent;
      color: var(--fg);
      border: 0;
      border-radius: 6px;
      cursor: pointer;
      font: inherit;
    }

    .toggle button[aria-pressed="true"] {
      background: var(--accent);
      color: var(--accent-fg);
    }

    .toggle button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    .card {
      margin-block-start: 2rem;
      padding: 1.25rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
    }

    .card p { color: var(--fg-muted); margin: 0.5rem 0; }

    /* Native form controls inherit color-scheme automatically */
    input[type="checkbox"], input[type="date"], select, progress {
      accent-color: var(--accent);
    }
  </style>
</head>

<body>
  <h1>Dark / Light Demo</h1>

  <div class="toggle" role="group" aria-label="Theme">
    <button type="button" data-choice="system" aria-pressed="true">System</button>
    <button type="button" data-choice="light"  aria-pressed="false">Light</button>
    <button type="button" data-choice="dark"   aria-pressed="false">Dark</button>
  </div>

  <section class="card">
    <h2>Native controls follow the scheme</h2>
    <p>The scrollbar, checkbox, date picker, and select below render in the active scheme thanks to <code>color-scheme</code>.</p>
    <p>
      <label><input type="checkbox" checked> Accept terms</label>
      <input type="date">
      <select><option>Option A</option><option>Option B</option></select>
      <progress value="0.6"></progress>
    </p>
  </section>

  <script>
    const buttons = document.querySelectorAll('.toggle button');
    const html = document.documentElement;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    function currentChoice() {
      const t = (function () { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
      return (t === 'light' || t === 'dark') ? t : 'system';
    }

    function applyChoice(choice) {
      if (choice === 'system') {
        try { localStorage.removeItem('theme'); } catch (e) {}
        html.removeAttribute('data-theme');
      } else {
        try { localStorage.setItem('theme', choice); } catch (e) {}
        html.setAttribute('data-theme', choice);
      }
      updatePressed();
    }

    function updatePressed() {
      const choice = currentChoice();
      for (const b of buttons) {
        b.setAttribute('aria-pressed', b.dataset.choice === choice ? 'true' : 'false');
      }
    }

    for (const b of buttons) {
      b.addEventListener('click', () => applyChoice(b.dataset.choice));
    }

    // System-change listener : only meaningful when user chose system.
    // light-dark() handles the visual flip; we update aria-pressed in case
    // any UI reflects the resolved scheme.
    mql.addEventListener('change', () => {
      if (currentChoice() === 'system') updatePressed();
    });

    updatePressed();
  </script>
</body>
</html>
```

### What this demo proves

1. ZERO flash on reload : the head-script applies the stored choice synchronously before the stylesheet parses.
2. Both schemes work without media queries : `light-dark()` resolves automatically based on `color-scheme`.
3. Native scrollbars, checkboxes, date pickers, and selects render in the right scheme because `color-scheme` is set.
4. Three-state toggle : System / Light / Dark with `aria-pressed` for screen-reader announcement.
5. Smooth transition on toggle, suppressed under `prefers-reduced-motion: reduce`.
6. localStorage round-trips fail gracefully (try / catch).

## 2. System-Only Variant (No Toggle, No JavaScript)

```html
<!doctype html>
<html lang="en">
<head>
  <meta name="color-scheme" content="light dark">
  <link rel="stylesheet" href="theme.css">
</head>
<body>...</body>
</html>
```

```css
:root {
  color-scheme: light dark;
  --bg: light-dark(#ffffff, #0b0d12);
  --fg: light-dark(#0a0a0a, #f5f5f5);
}
body { background: var(--bg); color: var(--fg); }
```

Five lines of CSS, one `<meta>` tag. The dark mode follows the OS preference automatically. Total code = ~10 lines.

## 3. Theme-Specific Image via `<picture>`

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="hero-dark.webp">
  <img src="hero-light.webp" alt="" width="800" height="400" loading="lazy">
</picture>
```

When user overrides via `data-theme`, `prefers-color-scheme` does NOT update. For full override support, change the `<img>` src via JS OR layer two images with `:has()` / attribute selectors.

## 4. `light-dark()` for `background-image` (with `@supports` gate)

```css
@supports (background-image: light-dark(url(a.png), url(a.png))) {
  .hero {
    background-image: light-dark(url(hero-light.webp), url(hero-dark.webp));
  }
}

@supports not (background-image: light-dark(url(a.png), url(a.png))) {
  .hero { background-image: url(hero-light.webp); }
  @media (prefers-color-scheme: dark) {
    .hero { background-image: url(hero-dark.webp); }
  }
}
```

## 5. Custom Property Indirection for Non-Color Values

`light-dark()` only accepts `<color>` or `<image>`. For other types (lengths, shadows, gradients with discrete arrangements), use custom-property indirection :

```css
:root {
  color-scheme: light dark;
  --shadow-elev-1: 0 1px 2px rgb(0 0 0 / 0.08);
}

@media (prefers-color-scheme: dark) {
  :root { --shadow-elev-1: 0 1px 2px rgb(0 0 0 / 0.4); }
}

:root[data-theme="dark"] {
  --shadow-elev-1: 0 1px 2px rgb(0 0 0 / 0.4);
}

.card { box-shadow: var(--shadow-elev-1); }
```

The token branches via media query AND attribute selector to cover both system-followed and manual-override paths.

## 6. SSR / Server-Side Persistence (Authenticated Users)

```html
<!-- Server emits the data-theme attribute inline. No client storage, no flash. -->
<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta name="color-scheme" content="light dark">
  ...
</head>
```

When the user is authenticated, the server reads their saved preference from the database and writes it directly into the `<html>` tag. Eliminates the localStorage round-trip and works in incognito mode.
