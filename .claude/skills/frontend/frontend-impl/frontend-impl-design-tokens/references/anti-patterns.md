# References : Anti-patterns

Eight anti-patterns observed in real design-token systems, with symptom, root cause, and fix. All verified 2026-05-19.

## 1. Hardcoded `#3b82f6` everywhere

**Symptom** : a brand-color refresh requires a twelve-file PR. Designers find five subtly-different shades of "the brand blue" in the codebase. Visual regression tests catch some but not all.

**Root cause** : no token layer. Every component writes its own copy of the color literal. There is no single source of truth.

**Fix** : tokenize. Move every brand value into a primitive token and consume it from semantic / component tokens.

```css
/* Wrong */
.button { background: #3b82f6; }
.link   { color: #3b82f6; }
.badge  { background: #3b82f6; }

/* Right */
@layer tokens {
  :root {
    --color-blue-500: oklch(0.60 0.18 250);
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

A brand refresh now touches one line in the primitive tier.

## 2. Single-tier flat tokens

**Symptom** : the brand picks a new accent color. Every primitive token has to be renamed and every component CSS rule has to be updated because component CSS consumes primitives directly.

**Root cause** : the semantic tier was skipped. `--color-blue-500` maps directly to a button's `background`. There is no intent indirection.

**Fix** : introduce the semantic tier. Components consume semantic tokens ; semantic tokens reference primitives.

```css
/* Wrong : component consumes primitive directly */
.button { background: var(--color-blue-500); }

/* Right : component consumes semantic, semantic references primitive */
:root {
  --color-blue-500: oklch(0.60 0.18 250);
  --color-fg-action: var(--color-blue-500);
}
.button { background: var(--color-fg-action); }
```

A brand-color switch from blue to teal now touches only the primitive tier. The semantic-to-component link stays intact.

## 3. Tokens declared in the default layer

**Symptom** : a component rule with `background: #fff` mysteriously wins over a token-based rule. Removing `!important` from the token declaration breaks the override. Specificity arithmetic does not match expectations.

**Root cause** : tokens were declared in the unlayered default layer. Per CSS cascade rules, unlayered styles form an implicit highest-priority layer that beats explicitly-layered styles regardless of specificity.

**Fix** : place all token declarations inside `@layer tokens` and put the cascade-layer order at the top of the stylesheet.

```css
/* Wrong : tokens in default layer */
:root {
  --color-fg-action: oklch(0.60 0.18 250);
}
@layer components {
  .button { background: var(--color-fg-action); }
}

/* Right : explicit layer order, tokens inside layer */
@layer tokens, theme, base, components, utilities;

@layer tokens {
  :root {
    --color-fg-action: oklch(0.60 0.18 250);
  }
}
@layer components {
  .button { background: var(--color-fg-action); }
}
```

See `[[frontend-syntax-css-cascade-layers-scope]]` for the full layering surface.

## 4. Transitioning an unregistered custom property

**Symptom** : a CSS `transition` is declared on a custom property but the property only swaps discretely. Hover state snaps instead of fading.

**Root cause** : a custom property is `<custom-ident>` by default, which the browser cannot interpolate. `transition` does nothing for `<custom-ident>`.

**Fix** : register the property with `@property` and pick the right `syntax`.

```css
/* Wrong : transition does nothing */
:root { --hue: 240deg; }
.swatch {
  background: oklch(0.60 0.18 var(--hue));
  transition: --hue 600ms;
}
.swatch:hover { --hue: 340deg; }

/* Right : @property registration enables interpolation */
@property --hue {
  syntax: "<angle>";
  inherits: false;
  initial-value: 240deg;
}

.swatch {
  background: oklch(0.60 0.18 var(--hue));
  transition: --hue 600ms;
}
.swatch:hover { --hue: 340deg; }
```

Source : [MDN : @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

## 5. `@property` with `inherits` mismatch

**Symptom** : the registered custom property does not propagate to descendants as expected, or it propagates when it should not. Visual debugging is confusing because the value is correct on the parent but wrong on the child.

**Root cause** : `inherits: true` vs `inherits: false` was set without thinking about the consumption pattern. Tokens typically inherit ; per-element animated values typically do not.

**Fix** : pick `inherits` deliberately.

- `inherits: true` for tokens consumed by descendants (font-scale, color tokens that cascade down a region).
- `inherits: false` for per-element animation values (gradient angle, hover-driven hue rotation, scroll-progress fraction).

```css
/* Token : inherits true */
@property --color-fg-action {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(0.60 0.18 250);
}

/* Per-element animation : inherits false */
@property --gradient-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
```

## 6. Toggling a body class to change theme without batching

**Symptom** : runtime theme switch flashes white briefly before settling. Lighthouse warns about layout shifts during the toggle. Some elements lag behind others.

**Root cause** : the theme-switch handler writes a class to `body`, which triggers an immediate style recalculation. If the toggle happens during a render frame, partial paints make the transition look broken.

**Fix** :

1. Toggle the attribute on the root element (`document.documentElement`) so the new tokens cascade down in a single recalculation.
2. Set the attribute server-side based on a cookie or header so the first paint is already correct (eliminates flash on initial load).
3. Wrap the toggle in `requestAnimationFrame` only if you need to coordinate with an in-progress animation ; otherwise the browser batches synchronous writes naturally.

```html
<!-- Server-rendered initial state -->
<html data-theme="{{ user_theme_from_cookie }}">
```

```js
// Client-side toggle
function toggleTheme() {
  const html = document.documentElement;
  const next = html.dataset.theme === "dark" ? "light" : "dark";
  html.dataset.theme = next;
  document.cookie = `theme=${next}; path=/; max-age=31536000`;
}
```

## 7. Leak-prone token names like `--my-bg`

**Symptom** : two team members independently declare `--bg`, `--my-bg`, or `--color`. Cross-component drift creeps in. Find-and-replace operations match too much or too little.

**Root cause** : no namespace convention. Generic names collide silently because CSS custom properties share a flat global namespace.

**Fix** : adopt a kebab-case namespace : `--<category>-<role>-<variant>`.

```css
/* Wrong */
:root {
  --bg: white;
  --color: #3b82f6;
  --radius: 8px;
}

/* Right */
:root {
  --color-bg-surface: oklch(0.99 0 0);
  --color-fg-action:  oklch(0.60 0.18 250);
  --radius-control:   8px;
}
```

Categories used by this skill : `color`, `space`, `radius`, `font`, `motion`, `shadow`, `border`. Roles describe intent : `fg`, `bg`, `border`, `action`, `surface`, `elevated`, `inline-md`, `block-lg`.

## 8. Inventing a custom JSON shape instead of DTCG

**Symptom** : six months in, the team adopts a token tool that expects DTCG-shape JSON. Migration requires hand-rewriting every token file because the original schema used `value` / `kind` / `notes` instead of `$value` / `$type` / `$description`.

**Root cause** : DTCG was dismissed as "draft" without checking whether the rough shape was stable enough to adopt. The custom shape diverged just enough to require a non-trivial transform.

**Fix** : use DTCG-shape JSON from day one. The 2025.10 draft is NOT production-ready as a tooling target but the field names (`$value`, `$type`, `$description`, `$extensions`) and alias syntax (`{group.token}`) are stable enough to author against.

```json
{
  "color": {
    "$type": "color",
    "blue-500": {
      "$value": { "colorSpace": "oklch", "components": [0.60, 0.18, 250] },
      "$description": "Brand primary blue."
    }
  }
}
```

Pin the draft revision in tooling, transform via Style Dictionary or a thin custom transformer at build time, and treat the emitted CSS as the runtime artifact. Source : [designtokens.org : Format Module draft](https://designtokens.org/tr/drafts/format/) (verified 2026-05-19).
