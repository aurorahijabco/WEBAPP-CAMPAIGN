---
name: frontend-impl-design-tokens
description: >
  Use when structuring a design-token system for a web app or component
  library, authoring the JSON interchange file per the W3C Design Tokens
  Community Group format, emitting tokens as CSS custom properties, deciding
  whether a value belongs at the primitive / semantic / component tier,
  registering an animatable token via `@property`, wiring up runtime theme
  switching via `data-theme` attribute or `color-scheme`, or migrating a
  codebase off hardcoded hex / rgb / oklch literals.
  Prevents the most common token-system regressions in 2026 : hardcoded color
  literals scattered across components so a brand refresh requires a
  twelve-file PR, single-tier flat tokens that map `--color-blue-500`
  directly to a button background and break the moment the brand picks a new
  blue, tokens declared in the default cascade layer that get overridden by
  random component CSS, a transitioned custom property that does not animate
  because it was never registered via `@property`, raw token names like
  `--my-bg` that leak into application styles, JSON files that invent their
  own shape and require rewriting when migrating to a real DTCG-aware tool,
  and shipping the experimental DTCG draft without disclosing its
  not-production-ready status.
  Covers the DTCG Design Tokens Format Module 2025.10 draft (JSON shape,
  required `$value`, required `$type`, optional `$description`, optional
  `$extensions` vendor metadata under reverse-DNS keys), the seven base
  types (`color`, `dimension`, `fontFamily`, `fontWeight`, `duration`,
  `cubicBezier`, `number`) plus the six composite types (`border`, `shadow`,
  `transition`, `strokeStyle`, `gradient`, `typography`), the alias syntax
  `{group.subgroup.token}` that resolves to target `$value`, the
  three-tier chain (raw brand to primitive to semantic to component), the
  CSS emission rules (custom properties under `@layer tokens`, `@property`
  registration for typed and animatable tokens, `light-dark()` for
  theme-aware swaps, `data-theme` attribute for explicit user override), and
  the rule that production today MUST transform DTCG JSON via a build
  pipeline (Style Dictionary, Tokens Studio, or equivalent) because the
  spec is explicitly NOT production-ready.
  Keywords: design tokens, DTCG, design tokens community group, W3C,
  designtokens org, $value, $type, $description, $extensions, alias,
  primitive token, semantic token, component token, three-tier tokens,
  CSS custom properties, custom property, var, @property, color, dimension,
  fontFamily, fontWeight, duration, cubicBezier, number, border, shadow,
  transition, strokeStyle, gradient, typography, light-dark, color-scheme,
  data-theme, @layer tokens, Style Dictionary, Tokens Studio,
  hardcoded hex everywhere, brand change painful, design system fragmented,
  no single source of truth for colors, theme broken at runtime, magic
  numbers everywhere, tokens drift, theme switch flashes, what are design
  tokens, how do I structure design tokens, three-tier token chain, DTCG
  W3C draft, design tokens to CSS, how to organize CSS variables, how to
  theme an app
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Impl : Design Tokens

This skill is the operational reference for designing a token system that follows the W3C Design Tokens Community Group Format Module 2025.10 draft and emits CSS custom properties under cascade layers. It covers the DTCG JSON shape, the seven base types and six composite types, the alias resolution rule, the three-tier brand-to-component chain, the `@property` registration for animatable tokens, and runtime theme switching. The skill does NOT cover OKLCH palette generation (see `[[frontend-theming-color-palette-oklch]]`), dark / light mode implementation details (see `[[frontend-theming-dark-light-mode]]`), or specific tooling deep-dives.

## CRITICAL : DTCG draft status (2025.10)

The DTCG Format Module is a **W3C Community Group draft preview dated 7 May 2026** and is explicitly NOT production-implementation-ready per the spec preamble. Source : [designtokens.org : Format Module draft](https://designtokens.org/tr/drafts/format/) (verified 2026-05-19).

**Implications for production work today** :

1. ALWAYS author tokens in the DTCG JSON shape so future migrations are mechanical, not destructive.
2. ALWAYS transform DTCG JSON to CSS custom properties via a build pipeline (Style Dictionary, Tokens Studio export, or a thin custom transformer). Do NOT consume the raw JSON at runtime.
3. ALWAYS pin to the 2025.10 draft revision in your tooling. NEVER expect the format to be stable across draft versions until the spec reaches Candidate Recommendation.
4. Disclose the draft status in any internal documentation that mentions DTCG conformance.

## Quick Reference

### Floor rules

- ALWAYS tier every token : primitive (raw brand atoms) -> semantic (intent like "action", "feedback success") -> component (button-specific override). NEVER skip the semantic tier and map primitive directly to component.
- ALWAYS emit tokens as CSS custom properties under `@layer tokens` (or a similar dedicated layer). NEVER declare tokens in the default layer where any component rule can override them.
- ALWAYS register a custom property via `@property` when it is transitioned, animated, or interpolated. NEVER `transition` a plain `--var` ; the property is `<custom-ident>` by default and only swaps discretely.
- ALWAYS namespace token names with category and intent : `--color-fg-action`, `--space-inline-md`, `--radius-control-sm`. NEVER ship raw names like `--my-bg`, `--blue`, `--big-radius`.
- ALWAYS use alias references inside DTCG JSON via `{group.token}`. NEVER copy-paste a primitive `$value` into the semantic tier ; the link breaks at the first brand update.
- ALWAYS transform DTCG JSON to CSS at build time. NEVER consume the JSON at runtime from a non-DTCG-aware loader.
- ALWAYS scope runtime theme overrides to a single cascade layer. NEVER toggle classes on `body` that override component CSS by specificity ; layers keep override math predictable.

### Decision tree 1 : Primitive vs semantic vs component ?

```
Is the value a raw brand atom : an exact hex from the brand book, a brand
typeface, a specific brand radius ?
  -> PRIMITIVE tier. Name by appearance : --color-blue-500, --font-brand-sans,
     --radius-12. These rarely change ; they document what the brand actually is.

Is the value an intent : "the color that means action", "the surface that
holds the page", "the typeface for body copy" ?
  -> SEMANTIC tier. Name by role : --color-fg-action, --color-bg-surface,
     --font-body. Reference a primitive : --color-fg-action: var(--color-blue-500).

Is the value a component-specific override : a button's bg, a tab's underline ?
  -> COMPONENT tier. Name by component-and-role : --button-primary-bg,
     --tab-active-underline. Reference a semantic : --button-primary-bg: var(--color-bg-action).

Are you tempted to skip the semantic tier and map primitive directly to component ?
  -> Stop. The semantic tier exists so a brand-change PR touches one file
     (primitive) and the semantic-to-component links stay intact.
```

### Decision tree 2 : Static var or `@property` registration ?

```
Is the token transitioned, animated, or interpolated (gradient angle,
hue rotation, animated chroma) ?
  -> @property registration is REQUIRED. Without it the property is treated
     as <custom-ident> and only swaps discretely.

Is the token used only as a value passed to other rules (color lookup,
spacing scale, font family) ?
  -> Regular custom property. No @property needed.

Is the token used in calc() or a CSS function that requires a known type ?
  -> @property registration is RECOMMENDED. Type-safe substitution prevents
     silent fallback to invalid-value when an upstream reference is wrong.

Does the token need a guaranteed initial value if a parent never sets it ?
  -> @property with `initial-value`. Without registration the initial value
     is the guaranteed-invalid value.
```

### Decision tree 3 : Runtime theme switching strategy ?

```
Theme follows OS preference only (light / dark) ?
  -> color-scheme: light dark on :root AND token values built with
     light-dark(L, D). No JS required. Auto-respects the OS setting.

User can override the OS preference within the app ?
  -> Toggle a data-theme attribute on :root or a region. Token layer
     contains [data-theme="dark"] { ... } and [data-theme="light"] { ... }
     overrides. Combine with light-dark() inside each override.

Multiple coexisting themes (per-tenant, per-section, per-customer brand) ?
  -> Scope the data-theme attribute to a region container instead of :root.
     Token overrides cascade from that region down. Combine with cascade
     layers so component CSS cannot win specificity wars.

Need to prevent flash-of-wrong-theme on first paint ?
  -> Set the data-theme attribute on the server-rendered HTML based on
     a cookie / header. Render the chosen theme inline before the page
     paints. Then hydrate the toggle in JS.
```

## DTCG JSON shape (binding 2025.10)

Every leaf node :

```json
{
  "$value": "...",
  "$type": "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "cubicBezier" | "number" | "border" | "shadow" | "transition" | "strokeStyle" | "gradient" | "typography",
  "$description": "Optional human prose.",
  "$extensions": { "com.example.tool": { ... } }
}
```

Groups :

- Organize tokens hierarchically without a `$value`.
- May declare `$type` to set the inherited type for descendant tokens.
- Reserved name `$root` represents a group's own value when needed.

Aliases :

- Form : `{group.subgroup.token}` ; resolves to the target's `$value`.
- For nested-property access, JSON Pointer : `{ "$ref": "#/group/token/$value/property" }`.

Source : [designtokens.org : Format Module draft](https://designtokens.org/tr/drafts/format/) (verified 2026-05-19).

### Base token types

| Type | Example `$value` | Notes |
|------|------------------|-------|
| `color` | `{ "colorSpace": "oklch", "components": [0.60, 0.18, 250] }` | Modern form uses `colorSpace` + `components`. Hex string also accepted for sRGB. |
| `dimension` | `"16px"` or `"1rem"` | Numeric + unit. |
| `fontFamily` | `"Inter"` or `["Inter", "system-ui", "sans-serif"]` | Single string OR array of fallbacks. |
| `fontWeight` | `400` or `"bold"` | 1 to 1000 integer OR named (normal, bold, lighter, bolder). |
| `duration` | `"200ms"` | `ms` or `s`. |
| `cubicBezier` | `[0.2, 0, 0, 1]` | Four-element array. |
| `number` | `1.5` | Unitless. |

### Composite token types

| Type | Shape |
|------|-------|
| `border` | `{ "color": <color>, "width": <dimension>, "style": <strokeStyle> }` |
| `shadow` | `{ "offsetX": <dimension>, "offsetY": <dimension>, "blur": <dimension>, "spread": <dimension>, "color": <color>, "inset": <boolean> }` |
| `transition` | `{ "duration": <duration>, "delay": <duration>, "timingFunction": <cubicBezier> }` |
| `strokeStyle` | string : `"solid"`, `"dashed"`, `"dotted"`, etc. |
| `gradient` | array of `{ "color": <color>, "position": <number 0..1> }` |
| `typography` | `{ "fontFamily": <fontFamily>, "fontSize": <dimension>, "fontWeight": <fontWeight>, "letterSpacing": <dimension>, "lineHeight": <number> }` |

## CSS emission rules

```css
@layer tokens, theme, base, components, utilities;

@layer tokens {
  :root {
    /* Primitive tier : raw brand atoms */
    --color-blue-500: oklch(0.60 0.18 250);
    --color-blue-700: oklch(0.40 0.18 250);
    --space-4: 16px;
    --font-sans: "Inter", system-ui, sans-serif;

    /* Semantic tier : intent */
    --color-fg-action: var(--color-blue-500);
    --color-fg-action-hover: var(--color-blue-700);
    --space-inline-md: var(--space-4);

    /* Component tier : component-specific override */
    --button-primary-bg: var(--color-fg-action);
    --button-primary-bg-hover: var(--color-fg-action-hover);
  }
}

@layer theme {
  [data-theme="dark"] {
    --color-fg-action: var(--color-blue-300);
  }
}

@layer components {
  .button-primary {
    background: var(--button-primary-bg);
  }
  .button-primary:hover {
    background: var(--button-primary-bg-hover);
  }
}
```

The cascade-layer order ensures token declarations always lose to theme overrides, theme overrides always lose to component rules that consume them. See `[[frontend-syntax-css-cascade-layers-scope]]` for the layering surface.

## `@property` for animatable tokens

```css
@property --gradient-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.banner {
  background: conic-gradient(from var(--gradient-angle), var(--color-blue-500), var(--color-blue-700));
  transition: --gradient-angle 600ms;
}

.banner:hover { --gradient-angle: 360deg; }
```

Without `@property`, the `transition` does nothing because `--gradient-angle` is treated as a `<custom-ident>` and only swaps discretely.

Common syntaxes : `<color>`, `<length>`, `<percentage>`, `<length-percentage>`, `<number>`, `<angle>`, `<time>`, `<integer>`. Source : [MDN : @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

## Token namespace conventions

Pattern : `--<category>-<role>-<variant>` (kebab-case).

| Category | Examples |
|----------|----------|
| `color` | `--color-fg-action`, `--color-bg-surface`, `--color-border-subtle` |
| `space` | `--space-inline-md`, `--space-block-lg` |
| `radius` | `--radius-control-sm`, `--radius-surface-lg` |
| `font` | `--font-family-sans`, `--font-size-body`, `--font-weight-strong` |
| `motion` | `--motion-duration-quick`, `--motion-easing-emphasized` |
| `shadow` | `--shadow-elevation-1`, `--shadow-elevation-2` |
| `border` | `--border-width-thin`, `--border-style-default` |

Primitive layer keeps the raw appearance name : `--color-blue-500`, `--space-4`. Semantic and component layers use the role-based names above.

## Cross-references

- `[[frontend-theming-color-palette-oklch]]` : OKLCH palette generation, perceptually-uniform shade ladders that supply the primitive tier.
- `[[frontend-theming-dark-light-mode]]` : `light-dark()`, `color-scheme`, full dark-mode implementation patterns.
- `[[frontend-syntax-css-cascade-layers-scope]]` : `@layer` declaration order, scope rules, override math.
- `[[frontend-syntax-css-color-modern]]` : `oklch()`, `color-mix()`, `light-dark()`, `color(display-p3 ...)`.
- `[[frontend-impl-typography-system]]` : type-scale tokens, font-loading strategy.

## Reference Links

- [references/methods.md](references/methods.md) : full DTCG JSON shape, all base + composite types with examples, alias-resolution rules, `@property` syntax surface.
- [references/examples.md](references/examples.md) : renderable HTML demo with DTCG JSON snippet, layered CSS emission, theme switch, and `@property`-animated gradient.
- [references/anti-patterns.md](references/anti-patterns.md) : eight anti-patterns with symptom, root cause, and fix.

## Authoritative sources

- [designtokens.org : Format Module draft](https://designtokens.org/tr/drafts/format/) (verified 2026-05-19, draft 2025.10 dated 7 May 2026, NOT production-ready)
- [W3C : Design Tokens Community Group](https://www.w3.org/community/design-tokens/) (verified 2026-05-19)
- [MDN : Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) (verified 2026-05-19)
- [MDN : --* (custom properties)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) (verified 2026-05-19)
- [MDN : var()](https://developer.mozilla.org/en-US/docs/Web/CSS/var) (verified 2026-05-19)
- [MDN : @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19)
