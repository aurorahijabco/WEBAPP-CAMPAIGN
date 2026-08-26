# References : Dark / Light Theming Catalog

Verified against [MDN : color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) (2026-05-19), [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (2026-05-19), [MDN : prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) (2026-05-19), [W3C : CSS Color Adjustment Module Level 1](https://www.w3.org/TR/css-color-adjust-1/).

## 1. The `color-scheme` property

### 1.1 Syntax

```css
color-scheme: normal;
color-scheme: light;
color-scheme: dark;
color-scheme: light dark;
color-scheme: dark light;
color-scheme: only light;
color-scheme: only dark;
```

| Value | Meaning |
|---|---|
| `normal` | Element rendered using browser default (light unless overridden). |
| `light` | Element supports light scheme only. UA renders its own UI (scrollbars, form controls) in light scheme. |
| `dark` | Element supports dark scheme only. UA renders its own UI in dark scheme. |
| `light dark` | Element supports both; UA picks based on user preference. |
| `dark light` | Same as `light dark` but the preferred default if user has no preference is dark. |
| `only light` | Forbids UA color-scheme overrides (e.g., Chrome Auto Dark Theme). |
| `only dark` | Same, forces dark. |

### 1.2 What `color-scheme` actually controls

Per MDN :

- Color of the canvas surface (page background painted by the browser before CSS arrives).
- Default colors of scrollbars and interaction UI.
- Default colors of form controls (`<input type="checkbox">`, `<input type="radio">`, `<input type="date">`, `<select>`, `<progress>`, etc.).
- Default colors of browser-provided UI (spellcheck underlines, autofill highlights).
- CSS system color values (`Canvas`, `CanvasText`, `LinkText`, etc.).

It does NOT change author-defined colors. Those still need `light-dark()` or media queries.

### 1.3 Meta-tag equivalent

```html
<meta name="color-scheme" content="light dark">
```

Place in `<head>` BEFORE any stylesheet link. The browser uses this to paint the canvas surface in the correct scheme during the brief window before CSS parsing completes. Without it, a dark-themed page can flash white during the initial load.

### 1.4 Per-element scoping

```css
:root   { color-scheme: light dark; }
header  { color-scheme: only light; }   /* forced light header */
footer  { color-scheme: only dark; }    /* forced dark footer */
```

Nested elements inherit unless overridden. Useful for hero sections with locked theming regardless of user preference.

## 2. The `light-dark()` function

### 2.1 Signature

```css
light-dark(<color-or-image>, <color-or-image>)
```

| Parameter | Used when |
|---|---|
| First (light branch) | `color-scheme` resolves to `light`, OR `color-scheme: light dark` AND user / OS preference is light, OR `color-scheme` is not set (fallback) |
| Second (dark branch) | `color-scheme` resolves to `dark`, OR `color-scheme: light dark` AND user / OS preference is dark |

### 2.2 Hard requirement

The `color-scheme` property MUST be declared on the element OR an ancestor. Without it, `light-dark()` ALWAYS returns the first (light) value. This is the most common dark-mode bug.

### 2.3 Accepted types

- `<color>` : any CSS color (hex, `rgb()`, `oklch()`, named, `currentcolor`, `transparent`).
- `<image>` : `url(...)`, `linear-gradient(...)`, etc. (browser support for image-form varies; gate with `@supports`).

Cannot mix : both arguments must be the same kind (both colors, or both images).

### 2.4 Pattern : tokens at `:root`

```css
:root {
  color-scheme: light dark;
  --bg:      light-dark(#ffffff, #0b0d12);
  --fg:      light-dark(#1a1a1a, #f5f5f5);
  --border:  light-dark(#e2e8f0, #1f2937);
  --accent:  light-dark(oklch(60% 0.18 250), oklch(70% 0.16 250));
}
```

Components consume `var(--bg)` etc.; the branch resolves automatically.

### 2.5 `@supports` gate (for image-form or older browsers)

```css
@supports (color: light-dark(red, red)) {
  /* light-dark() is supported */
}

@supports not (color: light-dark(red, red)) {
  /* Fallback : duplicate via @media (prefers-color-scheme: dark) */
}
```

## 3. The `prefers-color-scheme` media query

### 3.1 Values

| Value | Match condition |
|---|---|
| `light` | User prefers light theme OR has expressed no preference (default) |
| `dark` | User prefers dark theme |

Bare `@media (prefers-color-scheme)` is treated as `@media (prefers-color-scheme: dark)` for compatibility.

### 3.2 JavaScript access

```js
const mql = window.matchMedia('(prefers-color-scheme: dark)');
mql.matches;       // boolean : true if OS is in dark mode

function listener(e) {
  e.matches; // current state
}
mql.addEventListener('change', listener);
// ... later
mql.removeEventListener('change', listener);
```

### 3.3 Important : does NOT respond to manual toggles

`prefers-color-scheme` reflects OS / UA settings only. A user toggle implemented via `data-theme` attribute will NOT change `matchMedia('(prefers-color-scheme: dark)').matches`. Authors must track the user choice separately.

## 4. Three-state toggle architecture

| Choice | Persisted value | `data-theme` attribute | Active `color-scheme` | Behavior on OS change |
|---|---|---|---|---|
| System (default) | (storage absent) | (attribute absent) | `light dark` from `:root` | Auto-flips when OS flips |
| Light (forced) | `theme = "light"` | `data-theme="light"` | `light` from `[data-theme="light"]` | Ignores OS |
| Dark (forced) | `theme = "dark"` | `data-theme="dark"` | `dark` from `[data-theme="dark"]` | Ignores OS |

### 4.1 Required CSS overrides

```css
:root { color-scheme: light dark; }
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark;  }
```

### 4.2 Required head-script (FOUC prevention)

```html
<head>
  <meta name="color-scheme" content="light dark">
  <script>
    (function () {
      try {
        var t = localStorage.getItem('theme');
        if (t === 'light' || t === 'dark') {
          document.documentElement.setAttribute('data-theme', t);
        }
      } catch (e) {}
    })();
  </script>
  <link rel="stylesheet" href="theme.css">
</head>
```

The script MUST be inline (no `src=`), synchronous (no `async` / `defer`), and BEFORE the first stylesheet link.

## 5. `<picture>` for theme-specific images

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="hero-dark.webp">
  <img src="hero-light.webp" alt="" width="800" height="400">
</picture>
```

The browser evaluates the `media` attribute at parse time and selects the matching `<source>`. Works without JS, without `color-scheme`.

For manual override, swap the `<img>` src via JS when `data-theme` changes, OR include both as `<picture>` sources and use a `[data-theme="dark"]` attribute selector at the container level.

## 6. Property-value compatibility with `light-dark()`

| Property type | `light-dark()` works? |
|---|---|
| `color` | YES |
| `background-color` | YES |
| `border-color` (and longhand `*-color` variants) | YES |
| `box-shadow` (color component) | NO directly; wrap the whole shadow in `var(--shadow-light)` / `var(--shadow-dark)` and use `light-dark()` at the token level |
| `background-image` (`url(...)`, gradients) | YES (Baseline support varies; `@supports` gate recommended) |
| `mask-image` | YES (same caveat as background-image) |
| `accent-color` (form-control accent) | YES |
| `caret-color` | YES |
| Any non-color, non-image property (length, number, custom property of arbitrary type) | NO. Use media query or custom-property indirection. |

## 7. Cross-References

- `[[frontend-syntax-css-color-modern]]` : `oklch()`, `color-mix()`, `light-dark()` and modern color value model
- `[[frontend-theming-color-palette-oklch]]` : building palettes in perceptually-uniform space
- `[[frontend-impl-design-tokens]]` : DTCG token formats, three-tier model
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG contrast ratios in both modes
