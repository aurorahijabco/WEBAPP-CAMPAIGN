---
name: frontend-theming-dark-light-mode
description: >
  Use when adding dark mode to a website or app, choosing between
  system-followed-only and user-toggle modes, eliminating duplicated
  `@media (prefers-color-scheme: dark) { ... }` rules with
  `light-dark()`, fixing a white flash on reload (FOUC), getting
  scrollbars and native form controls (`<input type="checkbox">`,
  `<input type="date">`, `<select>`) to render in dark theme,
  persisting a user theme choice across reloads, or building a
  three-state toggle (system / light / dark). Use when reviewing a
  dark mode that already exists and assessing whether it covers all
  the cases below.
  Prevents the six dominant dark-mode failures : using `light-dark()`
  without declaring `color-scheme: light dark` on `:root` (always
  returns the light value), forgetting `color-scheme` entirely so
  the page background goes dark but scrollbars and checkboxes stay
  light, applying the theme via `useEffect` AFTER first paint
  causing a white flash on every reload, duplicating every rule in
  `@media (prefers-color-scheme: dark)` instead of using
  `light-dark()`, missing `aria-pressed` on the toggle button, and
  forcing dark mode for all users regardless of system preference.
  Covers the `color-scheme` property (values : `normal`, `light`,
  `dark`, `light dark`, `only light`, `only dark` and its purpose :
  it informs the user agent which color schemes the page supports so
  the UA can theme its own UI : scrollbars, form controls,
  spellcheck underlines, canvas surface), the `<meta name=
  "color-scheme">` tag, the `light-dark(<light>, <dark>)` function
  (Baseline 2024, requires `color-scheme` to function), the
  `@media (prefers-color-scheme: dark | light)` media query and its
  default `light` value when the user has no preference, the
  `<picture>` element with `<source media="(prefers-color-scheme:
  dark)">` for theme-specific images, the `data-theme` attribute
  override pattern, localStorage persistence, the head-script
  pattern for FOUC prevention (read storage, set attribute BEFORE
  CSS executes), and the three-state toggle architecture
  (system / light / dark with explicit user choice tracked
  separately from system preference).
  Keywords: color-scheme, light-dark, light-dark function,
  prefers-color-scheme, dark mode, light mode, system theme,
  theme toggle, data-theme, FOUC, flash of unstyled, no flash,
  localStorage theme, meta color-scheme, only light, only dark,
  Auto Dark Theme, picture prefers-color-scheme, theme persistence,
  three-state toggle, system default, manual override,
  matchMedia prefers-color-scheme,
  dark mode broken, scrollbar wrong color, scrollbar still light,
  form controls wrong color, checkbox light in dark mode,
  date picker light in dark mode, theme not persisting,
  white flash on reload, theme flashes on load,
  how to add dark mode, how to do dark mode in CSS,
  why does dark mode flash, how to remember theme choice,
  how to follow system dark mode, how to make dark mode toggle,
  is light-dark CSS supported.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Theming : Dark and Light Mode

Authoritative reference for evergreen-2026 dark / light theming. The four primitives : `color-scheme` (declares what the page supports), `light-dark()` (per-property branch), `@media (prefers-color-scheme: dark | light)` (rules-block branch), and `<picture><source media="(prefers-color-scheme: dark)">` (image branch).

## Quick Reference

### Baseline status

| Feature | Baseline | Source |
|---|---|---|
| `color-scheme` | Widely Available since January 2022 | [MDN : color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) (verified 2026-05-19) |
| `prefers-color-scheme` | Widely Available since January 2020 | [MDN : prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) (verified 2026-05-19) |
| `light-dark()` | Newly Available since May 2024; becoming Widely Available in 2026 | [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (verified 2026-05-19) |

### Minimum system-followed dark mode (no JS, no toggle)

```html
<meta name="color-scheme" content="light dark">
```

```css
:root {
  color-scheme: light dark;

  --bg:     light-dark(#ffffff, #0b0d12);
  --fg:     light-dark(#1a1a1a, #f5f5f5);
  --accent: light-dark(#2563eb, #60a5fa);
  --border: light-dark(#e2e8f0, #1f2937);
}

body { background: var(--bg); color: var(--fg); }
```

That is the entire system-followed dark mode. The browser flips between the two `light-dark()` branches based on the OS preference. Scrollbars, native form controls, and built-in UI render in the matching scheme.

### Three-state toggle (system / light / dark)

| User choice | `data-theme` on `<html>` | `color-scheme` resolved | Persistence key |
|---|---|---|---|
| System | (attribute absent) | `light dark` (follows OS) | `theme=system` (or storage absent) |
| Light | `data-theme="light"` | `light` (forced) | `theme=light` |
| Dark | `data-theme="dark"` | `dark` (forced) | `theme=dark` |

## Decision Trees

### Tree 1 : System-followed only or user toggle?

```
Does the design call for dark mode following the OS exclusively?
   YES -> color-scheme: light dark on :root + light-dark() everywhere.
          NO JavaScript needed. Done.
   NO  -> add a toggle. Three-state recommended (system / light / dark).
          User choice persisted; system is the default.
```

### Tree 2 : `light-dark()` or `@media (prefers-color-scheme)`?

```
Is the value a single color, length, or image used in ONE property?
   YES -> light-dark(<light>, <dark>). One line.

Are MANY properties branching together (whole rule block)?
   YES -> @media (prefers-color-scheme: dark) { .x { ... } } OR custom
          property pattern + light-dark() inside :root tokens.

Is the branching value NOT a color or image (e.g., `display`, `gap`,
custom property of unknown type)?
   YES -> @media query. light-dark() only accepts <color> or <image>.

Is browser support for light-dark() insufficient for your audience?
   YES -> @media query OR @supports (color: light-dark(red, red)) gate
          before relying on it.
```

### Tree 3 : FOUC (Flash Of Unstyled Theme) prevention

```
Is the theme determined ENTIRELY by OS preference (no user override)?
   YES -> no flash possible. color-scheme + light-dark() resolve at
          parse time before paint. Done.

Does the user have an override stored in localStorage?
   YES -> apply the override BEFORE first paint via an inline <script>
          in <head>, BEFORE the stylesheet link. The script reads
          localStorage and sets the data-theme attribute synchronously.
          NEVER apply via useEffect / DOMContentLoaded (post-paint).

Is the user authenticated, server-side persistence used?
   YES -> server emits <html data-theme="..."> in the response. Zero
          flash, zero localStorage round-trip.
```

## Patterns

### Pattern A : System-only, zero JavaScript

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

  --bg:     light-dark(#ffffff, #0b0d12);
  --fg:     light-dark(#0a0a0a, #f5f5f5);
  --accent: light-dark(#2563eb, #60a5fa);
}
body { background: var(--bg); color: var(--fg); }
```

The `<meta name="color-scheme">` tag MUST be present so the browser knows during initial paint what schemes the page supports. This prevents the browser from rendering its own UI (scrollbars, default form-control colors) in the wrong scheme during the brief window before CSS arrives.

### Pattern B : Three-state toggle with FOUC prevention

```html
<!doctype html>
<html lang="en">
<head>
  <meta name="color-scheme" content="light dark">
  <script>
    // Runs SYNCHRONOUSLY in <head>, BEFORE the stylesheet link below.
    // Sets data-theme on <html> before first paint. ZERO flash.
    (function () {
      try {
        var t = localStorage.getItem('theme');
        if (t === 'light' || t === 'dark') {
          document.documentElement.setAttribute('data-theme', t);
        }
      } catch (e) { /* localStorage may be disabled */ }
    })();
  </script>
  <link rel="stylesheet" href="theme.css">
</head>
```

```css
:root {
  color-scheme: light dark;

  --bg:     light-dark(#ffffff, #0b0d12);
  --fg:     light-dark(#0a0a0a, #f5f5f5);
  --accent: light-dark(#2563eb, #60a5fa);
}

/* Forced overrides : ALSO set color-scheme so UA UI matches */
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark;  }

body { background: var(--bg); color: var(--fg); }
```

```js
// Three-state toggle button handler
function setTheme(choice /* 'system' | 'light' | 'dark' */) {
  if (choice === 'system') {
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
  } else {
    localStorage.setItem('theme', choice);
    document.documentElement.setAttribute('data-theme', choice);
  }
}
```

### Pattern C : Per-image dark variant

```html
<!-- Best : <picture> handles image-source switching -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="hero-dark.webp">
  <img src="hero-light.webp" alt="" loading="lazy" width="800" height="400">
</picture>
```

```css
/* Or, for CSS background-image (when light-dark() image-form is supported) */
@supports (background-image: light-dark(url(a.png), url(b.png))) {
  .hero {
    background-image: light-dark(url(hero-light.webp), url(hero-dark.webp));
  }
}
```

### Pattern D : Listening for system changes (only when override mode = system)

```js
const mql = window.matchMedia('(prefers-color-scheme: dark)');

function onSystemChange(e) {
  // ONLY meaningful if the user is on "system" choice.
  // If user picked light or dark explicitly, ignore.
  const userChoice = localStorage.getItem('theme');
  if (userChoice === 'light' || userChoice === 'dark') return;

  // System change auto-applies via light-dark(); usually no JS work
  // is required. Update aria-pressed state on the toggle UI if you have one.
  updateTogglePressedStates();
}

mql.addEventListener('change', onSystemChange);

// Cleanup on SPA navigation away :
function teardown() {
  mql.removeEventListener('change', onSystemChange);
}
```

### Pattern E : `aria-pressed` on toggle buttons

```html
<div role="group" aria-label="Theme">
  <button type="button" data-choice="system" aria-pressed="true">System</button>
  <button type="button" data-choice="light"  aria-pressed="false">Light</button>
  <button type="button" data-choice="dark"   aria-pressed="false">Dark</button>
</div>
```

Update `aria-pressed` whenever the choice changes. Screen-reader users hear the active state.

### Pattern F : Smoothing the transition between modes (optional)

```css
:root {
  transition:
    background-color 200ms ease,
    color            200ms ease;
}
```

Apply only to top-level color tokens to avoid a cascading transition on every property. Skip entirely if `prefers-reduced-motion: reduce`.

```css
@media (prefers-reduced-motion: reduce) {
  :root { transition: none; }
}
```

## Out of Scope

- Design-token infrastructure, multi-tier semantic tokens, theme generators (covered in `[[frontend-impl-design-tokens]]`).
- OKLCH palette generation, perceptually-uniform color scales (covered in `[[frontend-theming-color-palette-oklch]]`).
- Contrast checks and WCAG 1.4.3 / 1.4.11 compliance (covered in `[[frontend-a11y-motion-contrast-wcag22]]`).
- Per-component theme overrides (covered in `[[frontend-impl-design-tokens]]`).

## Hard Rules (Binding)

1. NEVER call `light-dark(a, b)` without declaring `color-scheme: light dark` (or `light` / `dark`) on the element or an ancestor. Without it, `light-dark()` always returns the light branch.
2. NEVER apply a stored theme in `useEffect` / `DOMContentLoaded` / post-paint code. Use the head-script pattern, executed synchronously BEFORE the first stylesheet, to avoid FOUC.
3. NEVER omit `color-scheme` on a dark-themed page. Without it, scrollbars and native form controls stay in the light UA scheme even though your CSS is dark, creating visible mismatch.
4. NEVER duplicate every rule in `@media (prefers-color-scheme: dark)` when `light-dark()` covers it. Reserve the media query for cases `light-dark()` cannot handle (multiple non-color values, images on older browsers).
5. NEVER force a single theme regardless of the OS preference unless the design explicitly demands a single-theme product. Default to system; offer override as user choice.
6. NEVER omit `aria-pressed` (for toggles) or `aria-checked` (for switch-like groups) on theme controls. Screen-reader users need to perceive the active state.
7. ALWAYS set `color-scheme: light` or `color-scheme: dark` in your forced-mode CSS rule (e.g., `:root[data-theme="dark"]`), not only your color tokens. Otherwise UA-rendered UI fights the page.
8. ALWAYS pair the forced-mode attribute with the same value in `localStorage` and the head-script. The two MUST be the source of truth in sync.

## Reference Links

- `references/methods.md` : full property table, `light-dark()` signature, three-state architecture matrix, FOUC-prevention head-script template
- `references/examples.md` : complete renderable HTML demo (system + manual toggle, no FOUC, no framework)
- `references/anti-patterns.md` : 6 anti-patterns with symptom, root cause, fix
- [MDN : color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) (verified 2026-05-19)
- [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (verified 2026-05-19)
- [MDN : prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) (verified 2026-05-19)
- [W3C : CSS Color Adjustment Module Level 1](https://www.w3.org/TR/css-color-adjust-1/)

## Cross-References

- `[[frontend-syntax-css-color-modern]]` : `oklch()`, `color-mix()`, modern color value model
- `[[frontend-theming-color-palette-oklch]]` : palette generation from a brand seed in perceptual space
- `[[frontend-impl-design-tokens]]` : tier model (primitive -> semantic -> component) for tokens that drive `light-dark()` values
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 1.4.3 Contrast (Minimum) and 1.4.11 Non-Text Contrast applied to both modes
- `[[frontend-syntax-css-cascade-layers-scope]]` : `@layer tokens, theme, base, components, utilities;` placement for theme rules
