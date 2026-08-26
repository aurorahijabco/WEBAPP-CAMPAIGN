# References : Dark / Light Theming Anti-Patterns

Seven common failure modes with symptom, root cause, fix, source.

## Anti-Pattern 1 : `light-dark()` without `color-scheme` declared

### Symptom
Every value resolves to the light branch. The dark mode appears to do nothing. Browser DevTools shows the light branch resolved even when the OS is in dark mode.

### Root cause
Per [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (verified 2026-05-19) : "The `color-scheme` property must have a value including the preferred scheme. Without it, `light-dark()` will not function." When `color-scheme` is unset, the function defaults to the first (light) value, always.

```css
/* WRONG : color-scheme missing on :root */
:root {
  --bg: light-dark(#ffffff, #0b0d12);  /* always resolves to #ffffff */
}
body { background: var(--bg); }
```

### Fix
Declare `color-scheme: light dark` on `:root` (or any ancestor of the `light-dark()` call site).

```css
/* CORRECT */
:root {
  color-scheme: light dark;
  --bg: light-dark(#ffffff, #0b0d12);
}
```

### Source
[MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (verified 2026-05-19).

## Anti-Pattern 2 : Theme applied in `useEffect` / post-paint code (FOUC)

### Symptom
Every page reload flashes the default theme (usually white / light) for ~50 to ~300 ms before the saved dark theme appears. Users in dark mode see the most.

### Root cause
React / Vue / SolidJS components mount AFTER first paint. Setting `data-theme` inside a `useEffect` / `onMounted` / `createEffect` callback happens after the browser has already painted the light scheme. The brief delta between paint and effect is the flash.

```jsx
// WRONG : flash on every reload
function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme) document.documentElement.dataset.theme = theme;
  }, []);
  return <div>...</div>;
}
```

### Fix
Apply the theme synchronously in an inline `<script>` in `<head>`, BEFORE the stylesheet link and BEFORE any framework code mounts.

```html
<!-- CORRECT : inline head script applies theme BEFORE first paint -->
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

### Source
[MDN : color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) (verified 2026-05-19), `<meta name="color-scheme">` rationale for flash prevention.

## Anti-Pattern 3 : Duplicating every rule in `@media (prefers-color-scheme: dark)`

### Symptom
Stylesheets bloat to 2x size. Every color declaration is written twice. Changes to a color token require updating two places, leading to drift.

### Root cause
`@media (prefers-color-scheme: dark)` was the only option before `light-dark()` shipped in May 2024. Codebases that predate `light-dark()` keep duplicating because the team has not migrated.

```css
/* WRONG : 2x duplication */
:root { --bg: #ffffff; --fg: #0a0a0a; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #0b0d12; --fg: #f5f5f5; }
}
```

### Fix
Use `light-dark()` for single-property values once `color-scheme` is declared.

```css
/* CORRECT : single declaration, both branches in one call */
:root {
  color-scheme: light dark;
  --bg: light-dark(#ffffff, #0b0d12);
  --fg: light-dark(#0a0a0a, #f5f5f5);
}
```

Keep the media-query form ONLY for values that `light-dark()` cannot express (non-color, non-image types, or pre-Baseline browser support).

### Source
[MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (verified 2026-05-19).

## Anti-Pattern 4 : Forgetting `color-scheme` (scrollbars and form controls stay light)

### Symptom
The page background and text colors are dark, but the scrollbar is light. Native checkboxes, date pickers, dropdown indicators, and spellcheck underlines are rendered in light scheme. The page looks half-dark, half-light.

### Root cause
Author-defined colors flip via `light-dark()` or media queries, but `color-scheme` was never set. The browser UA UI (scrollbars, form controls, system colors) does not know the page is dark and continues rendering its own UI in the default light scheme.

```css
/* WRONG : color-scheme missing */
:root {
  --bg: #0b0d12;
  --fg: #f5f5f5;
}
body { background: var(--bg); color: var(--fg); }
/* scrollbars, checkboxes, date pickers all still light */
```

### Fix
Declare `color-scheme` matching the active scheme. For forced dark, set `color-scheme: dark`. For follow-the-system, `color-scheme: light dark`.

```css
/* CORRECT */
:root { color-scheme: light dark; }
:root[data-theme="dark"] { color-scheme: dark; }
```

### Source
[MDN : color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) (verified 2026-05-19), property purpose includes "default colors of scrollbars and interaction UI" and "default colors of form controls."

## Anti-Pattern 5 : Dark mode toggle without `aria-pressed`

### Symptom
Screen-reader users can press the dark-mode button but receive no announcement that the button is now active. Sighted users see a highlighted state; screen-reader users do not.

### Root cause
Button has no ARIA state attribute indicating active / inactive. Without `aria-pressed` (toggle-button) or `aria-checked` (switch-like), assistive tech treats it as a stateless action button.

```html
<!-- WRONG : no state announcement -->
<button onclick="toggle()">Dark</button>
```

### Fix
For a two-state toggle, use `aria-pressed`. For a three-state radio-style choice, use `aria-pressed` per option (or `role="radio"` if the buttons are siblings inside `role="radiogroup"`).

```html
<!-- CORRECT -->
<div role="group" aria-label="Theme">
  <button type="button" aria-pressed="true">System</button>
  <button type="button" aria-pressed="false">Light</button>
  <button type="button" aria-pressed="false">Dark</button>
</div>
```

Update `aria-pressed` whenever the choice changes.

### Source
[W3C WAI ARIA : aria-pressed](https://www.w3.org/TR/wai-aria-1.2/#aria-pressed). Pairs with `[[frontend-a11y-aria-patterns]]`.

## Anti-Pattern 6 : Forcing dark mode regardless of OS preference

### Symptom
A user who has chosen light mode at the OS level lands on the site and sees dark mode anyway, because the site sets `color-scheme: dark` unconditionally. The user must hunt for an override.

### Root cause
Author overrode the user preference with a forced single-scheme value at top-level CSS. Treats dark as the "modern" or "preferred" mode and disrespects the OS choice.

```css
/* WRONG : forced dark for everyone */
:root { color-scheme: dark; --bg: #0b0d12; --fg: #f5f5f5; }
```

### Fix
Default to `light dark` (system follows OS). Offer a user toggle for explicit override. Document the design intent if a single-scheme product is genuinely required.

```css
/* CORRECT : default follows OS, override via attribute */
:root { color-scheme: light dark; }
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark;  }
```

### Source
[MDN : prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) (verified 2026-05-19) : the media query exists so authors respect user preference. Defaulting to a forced scheme works against this.

## Anti-Pattern 7 : System-change listener never removed (memory leak in SPA)

### Symptom
Single-page-app navigation between routes accumulates `matchMedia` listeners. After many transitions, the OS-change event invokes a long chain of stale callbacks, possibly updating state for unmounted components.

### Root cause
`window.matchMedia(...).addEventListener('change', fn)` registers a global listener that persists across SPA route changes. Without explicit `removeEventListener`, the closure references unmounted components.

```js
// WRONG : never cleaned up
useEffect(() => {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', updateTheme);
  // missing : return cleanup function
}, []);
```

### Fix
Always return a cleanup function. In React : `return () => mql.removeEventListener('change', updateTheme);`. In plain JS, track the listener reference and call `removeEventListener` on teardown / unmount.

```js
// CORRECT
useEffect(() => {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', updateTheme);
  return () => mql.removeEventListener('change', updateTheme);
}, []);
```

### Source
[MDN : EventTarget.removeEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener) memory-leak guidance for long-lived listeners.
