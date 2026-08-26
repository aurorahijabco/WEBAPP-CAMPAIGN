# References : Examples

Renderable HTML demo plus standalone snippets for `frontend-impl-design-tokens`. The canonical example is a single-file HTML page that shows a DTCG JSON snippet alongside its CSS emission, a three-tier token chain, runtime theme switching via `data-theme`, and an `@property`-animated gradient. Save the fragment below as `index.html` and open in any evergreen-2026 browser.

## Renderable HTML fragment (save as `index.html`)

```html
<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Design tokens demo : three-tier + theme switch + @property</title>
  <style>
    @layer tokens, theme, base, components, utilities;

    @property --gradient-angle {
      syntax: "<angle>";
      inherits: false;
      initial-value: 90deg;
    }

    @layer tokens {
      :root {
        color-scheme: light dark;

        /* Primitive tier : raw brand atoms */
        --color-blue-300: oklch(0.80 0.14 250);
        --color-blue-500: oklch(0.60 0.18 250);
        --color-blue-700: oklch(0.40 0.18 250);
        --color-neutral-100: oklch(0.99 0 0);
        --color-neutral-200: oklch(0.95 0 0);
        --color-neutral-800: oklch(0.22 0 0);
        --color-neutral-900: oklch(0.15 0 0);
        --space-1: 4px;
        --space-2: 8px;
        --space-3: 12px;
        --space-4: 16px;
        --space-5: 24px;
        --radius-2: 8px;
        --radius-3: 12px;
        --font-sans: "Inter", system-ui, sans-serif;
        --motion-quick: 150ms;
        --motion-medium: 300ms;

        /* Semantic tier : intent */
        --color-bg-surface: var(--color-neutral-100);
        --color-bg-elevated: var(--color-neutral-100);
        --color-fg-default: var(--color-neutral-900);
        --color-fg-muted: var(--color-neutral-800);
        --color-fg-action: var(--color-blue-500);
        --color-fg-on-action: var(--color-neutral-100);
        --color-fg-action-hover: var(--color-blue-700);
        --space-inline-md: var(--space-3);
        --space-block-md: var(--space-4);
        --radius-control: var(--radius-2);

        /* Component tier */
        --button-primary-bg: var(--color-fg-action);
        --button-primary-bg-hover: var(--color-fg-action-hover);
        --button-primary-fg: var(--color-fg-on-action);
        --button-primary-radius: var(--radius-control);
        --card-bg: var(--color-bg-elevated);
        --card-fg: var(--color-fg-default);
        --card-radius: var(--radius-3);
      }
    }

    @layer theme {
      [data-theme="dark"] {
        --color-bg-surface: var(--color-neutral-900);
        --color-bg-elevated: var(--color-neutral-800);
        --color-fg-default: var(--color-neutral-100);
        --color-fg-muted: var(--color-neutral-200);
        --color-fg-action: var(--color-blue-300);
        --color-fg-on-action: var(--color-neutral-900);
        --color-fg-action-hover: var(--color-blue-500);
      }
    }

    @layer base {
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font: 16px/1.5 var(--font-sans);
        color: var(--color-fg-default);
        background: var(--color-bg-surface);
      }
      main { padding: var(--space-5); max-width: 64rem; margin: auto; }
      h1, h2 { color: var(--color-fg-default); }
      p { color: var(--color-fg-muted); }
      code, pre {
        background: var(--color-bg-elevated);
        padding: 0 0.25rem;
        border-radius: 4px;
      }
      pre { padding: var(--space-3); overflow-x: auto; }
    }

    @layer components {
      .button-primary {
        background: var(--button-primary-bg);
        color: var(--button-primary-fg);
        border: 1px solid transparent;
        border-radius: var(--button-primary-radius);
        padding: var(--space-2) var(--space-4);
        min-height: 44px;
        font: inherit;
        cursor: pointer;
        transition: background var(--motion-quick) ease;
      }
      .button-primary:hover { background: var(--button-primary-bg-hover); }
      .button-primary:focus-visible {
        outline: 2px solid var(--color-fg-default);
        outline-offset: 2px;
      }

      .card {
        background: var(--card-bg);
        color: var(--card-fg);
        border-radius: var(--card-radius);
        padding: var(--space-5);
        margin-block: var(--space-5);
        border: 1px solid color-mix(in oklch, var(--color-fg-default) 12%, transparent);
      }

      .gradient-banner {
        height: 160px;
        border-radius: var(--card-radius);
        background: conic-gradient(
          from var(--gradient-angle),
          var(--color-blue-300),
          var(--color-blue-500),
          var(--color-blue-700),
          var(--color-blue-500),
          var(--color-blue-300)
        );
        transition: --gradient-angle var(--motion-medium) ease;
      }
      .gradient-banner:hover { --gradient-angle: 450deg; }
    }
  </style>
</head>
<body>
  <main>
    <h1>Design tokens demo</h1>

    <p>This page demonstrates the three-tier token chain (primitive, semantic, component), runtime theme switching via the <code>data-theme</code> attribute on <code>html</code>, and an animated custom property via <code>@property</code>.</p>

    <p>
      <button class="button-primary" id="toggle-theme">Toggle theme</button>
    </p>

    <section class="card">
      <h2>Three-tier chain</h2>
      <p>The primary button background is wired as : <code>--button-primary-bg</code> -> <code>--color-fg-action</code> -> <code>--color-blue-500</code>.</p>
      <p>Switching theme changes only the semantic tier ; primitives and component tokens stay intact.</p>
    </section>

    <section class="card">
      <h2>@property animated gradient</h2>
      <p>Hover the banner below. The conic gradient rotates because <code>--gradient-angle</code> is registered with <code>syntax: "&lt;angle&gt;"</code>.</p>
      <div class="gradient-banner" aria-hidden="true"></div>
    </section>

    <section class="card">
      <h2>DTCG JSON source (excerpt)</h2>
      <pre><code>{
  "color": {
    "$type": "color",
    "blue": {
      "500": { "$value": { "colorSpace": "oklch", "components": [0.60, 0.18, 250] } }
    },
    "fg": {
      "action": { "$value": "{color.blue.500}" }
    }
  },
  "button": {
    "primary": {
      "bg": { "$value": "{color.fg.action}", "$type": "color" }
    }
  }
}</code></pre>
    </section>
  </main>

  <script>
    document.querySelector("#toggle-theme").addEventListener("click", () => {
      const html = document.documentElement;
      html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
    });
  </script>
</body>
</html>
```

Self-contained. Click the "Toggle theme" button : tokens flip from light to dark by switching the `data-theme` attribute on `<html>`. Hover the gradient banner : the registered `--gradient-angle` interpolates smoothly because of `@property`.

## Standalone examples

### DTCG JSON : three-tier chain

```json
{
  "color": {
    "$type": "color",
    "blue": {
      "500": { "$value": { "colorSpace": "oklch", "components": [0.60, 0.18, 250] } },
      "700": { "$value": { "colorSpace": "oklch", "components": [0.40, 0.18, 250] } }
    },
    "fg": {
      "action": { "$value": "{color.blue.500}" },
      "action-hover": { "$value": "{color.blue.700}" }
    }
  },
  "button": {
    "primary": {
      "bg": { "$value": "{color.fg.action}", "$type": "color" },
      "bg-hover": { "$value": "{color.fg.action-hover}", "$type": "color" }
    }
  }
}
```

### CSS emission for the same chain

```css
@layer tokens {
  :root {
    --color-blue-500: oklch(0.60 0.18 250);
    --color-blue-700: oklch(0.40 0.18 250);

    --color-fg-action: var(--color-blue-500);
    --color-fg-action-hover: var(--color-blue-700);

    --button-primary-bg: var(--color-fg-action);
    --button-primary-bg-hover: var(--color-fg-action-hover);
  }
}
```

### Composite typography token

```json
{
  "typography": {
    "body": {
      "$type": "typography",
      "$value": {
        "fontFamily": ["Inter", "system-ui", "sans-serif"],
        "fontSize": "16px",
        "fontWeight": 400,
        "letterSpacing": "0px",
        "lineHeight": 1.5
      }
    }
  }
}
```

Emit as multiple CSS custom properties :

```css
:root {
  --typography-body-font-family: "Inter", system-ui, sans-serif;
  --typography-body-font-size: 16px;
  --typography-body-font-weight: 400;
  --typography-body-letter-spacing: 0px;
  --typography-body-line-height: 1.5;
}

body {
  font-family: var(--typography-body-font-family);
  font-size: var(--typography-body-font-size);
  font-weight: var(--typography-body-font-weight);
  letter-spacing: var(--typography-body-letter-spacing);
  line-height: var(--typography-body-line-height);
}
```

### Composite shadow token with multi-stack

```json
{
  "shadow": {
    "elevation-2": {
      "$type": "shadow",
      "$value": [
        { "offsetX": "0px", "offsetY": "1px", "blur": "2px", "spread": "0px", "color": "{color.shadow.subtle}", "inset": false },
        { "offsetX": "0px", "offsetY": "4px", "blur": "8px", "spread": "0px", "color": "{color.shadow.umbra}",  "inset": false }
      ]
    }
  }
}
```

Emit :

```css
:root {
  --shadow-elevation-2:
    0px 1px 2px 0px var(--color-shadow-subtle),
    0px 4px 8px 0px var(--color-shadow-umbra);
}
```

### `@property` animated angle

```css
@property --hue {
  syntax: "<angle>";
  inherits: false;
  initial-value: 240deg;
}

.swatch {
  background: oklch(0.60 0.18 var(--hue));
  transition: --hue 600ms ease-out;
}

.swatch:hover { --hue: 340deg; }
```

Without the `@property` declaration, `transition: --hue` does nothing.

### Per-region theme override

```html
<html>
  <main data-theme="light">Light region.</main>
  <aside data-theme="dark">Dark region.</aside>
</html>
```

```css
@layer theme {
  [data-theme="dark"] {
    --color-bg-surface: oklch(0.18 0 0);
    --color-fg-default: oklch(0.96 0 0);
  }
}
```

The attribute lives on any container ; tokens cascade down from there.

### Token migration : from raw hex to tiered

```css
/* BEFORE : magic numbers everywhere */
.button { background: #3b82f6; }
.link   { color: #3b82f6; }
.badge  { background: #3b82f6; }

/* AFTER : tokenized + tiered */
@layer tokens {
  :root {
    --color-blue-500: #3b82f6;
    --color-fg-action: var(--color-blue-500);
    --button-primary-bg: var(--color-fg-action);
    --link-fg: var(--color-fg-action);
    --badge-info-bg: var(--color-fg-action);
  }
}

@layer components {
  .button { background: var(--button-primary-bg); }
  .link   { color: var(--link-fg); }
  .badge  { background: var(--badge-info-bg); }
}
```

Brand-color change now touches one line in the primitive tier.

### Server-render the chosen theme

```html
<html data-theme="{{ user_theme_from_cookie }}">
```

Set the attribute server-side from a cookie or header. The first paint already renders the chosen theme, eliminating flash-of-wrong-theme.

```js
// Client-side hydration of the toggle
const toggle = document.querySelector("#toggle-theme");
toggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  document.cookie = `theme=${next}; path=/; max-age=31536000`;
});
```
