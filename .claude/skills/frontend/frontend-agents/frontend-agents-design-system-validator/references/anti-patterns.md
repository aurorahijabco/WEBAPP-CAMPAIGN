# References : Design System Validator Anti-Patterns

Seven common drift modes that violate the validator's rules. Each entry : symptom, rule violated, root cause, fix.

## Anti-Pattern 1 : Hardcoded color in component CSS

### Symptom
PR diff shows new component CSS with `background: #3b82f6;` or `color: oklch(60% 0.18 250);`. Brand color is duplicated across N components; future palette change requires touching N files.

### Rule violated
DS-01 : raw values outside `@layer tokens` block.

### Root cause
Author copied a color from the design tool (Figma) directly into CSS without going through the token layer. Often happens under time pressure or because the author does not know which token to use.

```css
/* WRONG */
.toast { background: #3b82f6; }
```

### Fix
Replace with the appropriate semantic token. If no matching semantic token exists, propose one in `@layer theme` first.

```css
/* CORRECT */
.toast { background: var(--color-notification-info-bg); }
```

In `@layer theme` :

```css
:root {
  --color-notification-info-bg: light-dark(var(--brand-blue-500), var(--brand-blue-600));
}
```

## Anti-Pattern 2 : Single-tier token (component references raw value disguised as token)

### Symptom
A token like `--button-bg: #3b82f6;` exists. Brand color is "tokenized" but the token IS the raw value; no semantic layer separates intent from value. Changing the brand color still requires touching this token (which is fine), but the meaning of the token is unclear : is it "the brand color" or "the button background"? Both, conflated.

### Rule violated
DS-02 : missing semantic tier between primitive and component.

### Root cause
Author created a token but skipped the three-tier model. The token is component-specific and value-anchored, lacking the indirection that allows palette and theme changes to propagate.

```css
/* WRONG */
:root { --button-bg: #3b82f6; }
.button { background: var(--button-bg); }
```

### Fix
Introduce the three-tier chain : primitive (brand color) -> semantic (intent) -> component (consumer).

```css
/* CORRECT */
:root {
  /* Primitive */
  --brand-blue-500: #3b82f6;
  /* Semantic */
  --color-action-primary: var(--brand-blue-500);
}
.button { background: var(--color-action-primary); }
```

Now changing `--brand-blue-500` propagates to every semantic referring to it; changing `--color-action-primary` alone re-skins all action surfaces without touching the brand palette.

## Anti-Pattern 3 : Component reaches into primitive directly

### Symptom
Component CSS references `var(--brand-blue-500)` directly. There IS a semantic layer, but the component skips it. A future brand-color refresh that wants to keep "blue" but darken it cannot easily change just `--color-action-primary` without affecting this component.

### Rule violated
DS-02 : component should consume semantic, not primitive.

### Root cause
Author found the primitive in the token catalog and used it because "the color matched." Skipped the indirection step.

```css
/* WRONG */
.cta-button { background: var(--brand-blue-500); }
```

### Fix
Reference the appropriate semantic token. Define one if absent.

```css
/* CORRECT */
.cta-button { background: var(--color-action-primary); }
```

## Anti-Pattern 4 : Non-namespaced or generic token names

### Symptom
Tokens named `--color-1`, `--color-2`, `--my-thing`, `--blue`. Search-and-replace impossible at scale; no documentation of intent; new authors invent overlapping names.

### Rule violated
DS-04 : naming convention (kebab-case + namespaced prefix).

### Root cause
Token system was introduced incrementally without a naming spec. Early names were placeholders that stuck.

```css
/* WRONG */
:root {
  --color-1: #2563eb;
  --color-2: #0a0a0a;
  --my-thing: 1rem;
}
```

### Fix
Rename to namespaced, semantic names. Use `--color-*`, `--space-*`, `--font-size-*`, `--radius-*`, `--shadow-*`, etc.

```css
/* CORRECT */
:root {
  --color-action-primary: #2563eb;
  --color-fg: #0a0a0a;
  --space-4: 1rem;
}
```

## Anti-Pattern 5 : `!important` in components layer

### Symptom
Override chain devolves into `!important` warfare. Components layer accumulates `!important` declarations to "force" the right styling against unwanted cascade interactions.

### Rule violated
DS-07 : `!important` only in `utilities` layer.

### Root cause
Cascade layer order is missing or wrong, OR a third-party stylesheet is loaded outside the layer system. Authors paper over the conflict with `!important` instead of fixing the layer architecture.

```css
/* WRONG */
@layer components {
  .modal-title { font-size: 1.5rem !important; }
}
```

### Fix
Add `@layer tokens, theme, base, components, utilities;` at the project root. Move third-party CSS into its own layer (e.g., `@import "third-party.css" layer(vendor);` then place `vendor` before `theme` in the order). Remove `!important` from components.

```css
/* CORRECT */
@layer vendor, tokens, theme, base, components, utilities;

@layer components {
  .modal-title { font-size: var(--font-size-lg); }
}
```

## Anti-Pattern 6 : Token defined for one mode only

### Symptom
Dark mode is "supported" but a recently-added token only has a light-mode value. In dark mode, the component using that token falls back to the inherited value or shows wrong contrast.

### Rule violated
DS-08 : light + dark parity.

### Root cause
Author added the token while developing the light-mode iteration and forgot to add the dark-mode counterpart. Code review missed it.

```css
/* WRONG */
:root {
  --color-card-bg: #ffffff;     /* light only */
  /* no dark override */
}
```

### Fix
Use `light-dark()` for guaranteed parity, OR add the dark override block.

```css
/* CORRECT : light-dark() */
:root {
  color-scheme: light dark;
  --color-card-bg: light-dark(#ffffff, #0b0d12);
}

/* OR : paired blocks */
:root { --color-card-bg: #ffffff; }
:root[data-theme="dark"] { --color-card-bg: #0b0d12; }
```

## Anti-Pattern 7 : Animatable token without `@property` registration

### Symptom
A color transition snaps from start to end instead of interpolating smoothly. The same transition works fine when using a literal color value but not when using a custom property.

### Rule violated
DS-06 : animatable tokens MUST be `@property`-registered.

### Root cause
Untyped custom properties default to `syntax: '*'`, which is treated as a generic string. Browsers cannot interpolate strings, so transitions discrete-flip the value.

```css
/* WRONG : transition snaps */
:root { --bg-color: oklch(60% 0.18 250); }
.banner { background: var(--bg-color); transition: --bg-color 200ms; }
.banner.warn { --bg-color: oklch(70% 0.15 60); }
```

### Fix
Register the token with `@property` so the browser knows its type and can interpolate.

```css
/* CORRECT : interpolates smoothly */
@property --bg-color {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(60% 0.18 250);
}

:root { --bg-color: oklch(60% 0.18 250); }
.banner { background: var(--bg-color); transition: --bg-color 200ms; }
.banner.warn { --bg-color: oklch(70% 0.15 60); }
```

## Anti-Pattern 8 (bonus) : WCAG 1.4.3 contrast fail in dark mode

### Symptom
The text-on-surface contrast passes in light mode (`#1a1a1a` on `#ffffff` = 16.5 : 1) but fails in dark mode. The dark variant was hand-tuned to "look pleasant" and lost the contrast guarantee.

### Rule violated
DS-10 : WCAG 1.4.3 (4.5:1 normal, 3:1 large).

### Root cause
Author balanced dark mode visually without measuring contrast. Often `#444` on `#000` (which fails at 3.94:1).

```css
/* WRONG */
:root[data-theme="dark"] {
  --color-fg: #444;    /* 3.94:1 vs #000 */
  --color-bg: #000;
}
```

### Fix
Use a contrast checker (axe-core, colorjs.io). Adjust the L channel until the pair passes.

```css
/* CORRECT */
:root[data-theme="dark"] {
  --color-fg: #f5f5f5;     /* 14.8:1 vs #0b0d12 */
  --color-bg: #0b0d12;
}
```

OKLCH advantage : adjusting only the L channel changes contrast predictably without shifting hue.

### Source
[W3C WCAG 2.2 : 1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19).
