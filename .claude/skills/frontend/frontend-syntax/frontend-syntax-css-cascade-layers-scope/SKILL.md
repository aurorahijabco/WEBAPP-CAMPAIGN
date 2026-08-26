---
name: frontend-syntax-css-cascade-layers-scope
description: >
  Use when organizing a stylesheet's cascade with `@layer`, scoping component
  styles with `@scope`, isolating third-party CSS, taming `!important`
  chains, or replacing descendant-selector trees with low-specificity
  scoped rules.
  Prevents the four standard cascade-discipline failures : mixing unlayered
  and layered author rules (unlayered always wins normal), assuming
  `!important` follows the same layer order as normal declarations (it is
  reversed), shipping `@scope` without an `@supports` gate, and using
  `:scope` where a bare selector was intended (silent class-level specificity
  bump).
  Covers `@layer` statement / block / anonymous / nested forms; the
  unlayered-vs-layered normal-vs-important inversion table; canonical author
  order (`reset, base, theme, components, utilities`); third-party CSS
  isolation via `@import ... layer(name)`; `@scope (<root>) to (<limit>)`
  donut syntax; the `:scope` specificity rule; cascade proximity (smallest
  DOM hop wins, ordered AFTER specificity and BEFORE source order);
  Baseline status per feature.
  Keywords: @layer, cascade layers, @scope, :scope, donut scope, layer
  order, unlayered, !important inversion, important-reversal, proximity
  cascade, scope proximity, revert-layer, CSSLayerBlockRule, my CSS does
  not override, !important everywhere, specificity war, layer not winning,
  third-party CSS overrides my styles, descendant selector too broad,
  cascade broken, how do I organize CSS, what is @layer, why does
  !important not work as expected, how to scope styles to a component
  without classes.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Syntax : CSS Cascade Layers and Scope

Cascade-discipline reference. Replaces specificity bidding with predictable order via `@layer` and DOM-proximity-based component scoping via `@scope`.

## Quick Reference

### Baseline status

| Feature | Status | Source |
|---|---|---|
| `@layer` | Widely Available since March 2022 | [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19) |
| `@scope` | Newly Available since December 2025 | [MDN : @scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) (verified 2026-05-19) |
| `revert-layer` | Widely Available | MDN |

Per `[[frontend-core-web-standards-baseline]]`, `@scope` MUST be gated with `@supports at-rule(@scope)` or an equivalent feature detection until it reaches Widely Available (around mid-2028).

### `@layer` syntax forms

| Form | Example | Purpose |
|---|---|---|
| Statement | `@layer reset, base, theme, components, utilities;` | Declare order |
| Block | `@layer components { .card { ... } }` | Add rules to a layer |
| Anonymous | `@layer { p { margin-block: 1rem; } }` | One-off implicit layer |
| Nested | `@layer framework { @layer layout { ... } }` | Sub-layers |
| Import | `@import "vendor.css" layer(reset);` | Import third-party into a layer |

### The cascade-order inversion table

| Declaration kind | Winning layer |
|---|---|
| Normal author, unlayered vs layered | Unlayered ALWAYS wins |
| Normal author, layered vs layered | Last-declared layer wins |
| Important author, unlayered vs layered | Layered ALWAYS wins (reversed) |
| Important author, layered vs layered | First-declared layer wins (reversed) |

This inversion is the single most-misunderstood rule in the cascade. Memorize it. Sources : [W3C TR : CSS Cascade 5 §6.4](https://www.w3.org/TR/css-cascade-5/) (verified 2026-05-19), [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19).

### Canonical author layer order

```css
@layer reset, base, theme, components, utilities;
```

- `reset` : third-party normalize.css or modern CSS reset.
- `base` : element defaults (`html`, `body`, headings, lists, links).
- `theme` : design tokens via custom properties (colors, typography scale).
- `components` : component-scoped rules. ALWAYS use `@scope (...)` here when DOM-proximity is desired.
- `utilities` : single-purpose utility classes (e.g. `.visually-hidden`).

ALL author CSS MUST live in one of these layers. NEVER leave declarations unlayered : unlayered always beats layered for normal declarations, which silently breaks the discipline.

### `@scope` syntax forms

| Form | Grammar | When |
|---|---|---|
| Root only | `@scope (<root>) { ... }` | Apply from `<root>` downward, no donut |
| Root + limit (donut) | `@scope (<root>) to (<limit>) { ... }` | Stop at `<limit>` exclusive |
| Inline | `<style>@scope { ... }</style>` inside parent | Scope to the containing element |
| Inline + limit | `<style>@scope to (<limit>) { ... }</style>` | Inline with donut |

Inclusivity overrides : `to (<limit> > *)` includes `<limit>` itself in the scope; `(<root> > *)` excludes `<root>` itself.

### `@scope` specificity rule

Bare selectors and `&` inside `@scope` carry the specificity of the SELECTOR ONLY (the `:where(:scope)` prefix contributes zero). Explicit `:scope` adds class-level (0,1,0).

```css
@scope (.article-body) {
  img      { /* specificity 0,0,1 */ }
  & img    { /* specificity 0,0,1 */ }
  :scope img { /* specificity 0,1,1 */ }
}
```

### Cascade proximity (the new `@scope` criterion)

Per [W3C TR : CSS Cascade 6](https://www.w3.org/TR/css-cascade-6/) (verified 2026-05-19), proximity is positioned AFTER specificity and BEFORE order of appearance :

```
1. Origin and Importance
2. Context (encapsulation)
3. Style Attribute
4. Cascade Layers
5. Specificity
6. Scope Proximity   <-- new in Level 6
7. Order of Appearance
```

The rule whose scope root is the FEWEST DOM hops from the matched element wins ties of equal specificity. Rules outside any scope are treated as infinite proximity (lose every tie against scoped rules of equal specificity).

Proximity DOES NOT override `!important`, cascade layers, or specificity. It only resolves what was previously a source-order tie.

## Decision Trees

### Decision tree : "Where should this CSS go?"

```
Third-party reset (normalize.css, modern reset):
    -> @import "reset.css" layer(reset);

Element defaults (typography, link colors, body bg):
    -> @layer base { html, body, h1, ... { ... } }

Design tokens (custom properties at :root):
    -> @layer theme { :root { --color-...: ...; } }

Component rules:
    Need predictable order across many components?
        -> @layer components { .card { ... } }
    Need DOM-proximity (closest ancestor wins)?
        -> @layer components { @scope (.card) { ... } }
    Both?
        -> @layer components { @scope (.card) to (.card .card) { ... } }

Single-purpose utility classes (.visually-hidden, .mt-4):
    -> @layer utilities { .visually-hidden { ... } }

ANY author CSS:
    NEVER leave unlayered; unlayered beats layered for normal rules.
```

### Decision tree : "`@layer` or `@scope` for this isolation?"

```
Problem : two component-libraries fight over the same class names.
    -> @layer (one layer per library). Order = predictable winner.

Problem : descendant selector reaches into a nested component.
    Example : .feature .article-body img matches images inside nested cards.
    -> @scope (.article-body) to (.card) { img { ... } }

Problem : the SAME component appears nested inside itself, and the outer
          version should NOT style the inner instance.
    -> @scope (.card) to (.card .card) { ... }
       The donut limit stops the cascade at the nested boundary.

Problem : two themes nest in the same DOM (e.g. light inside dark inside light).
    -> @scope per theme. Proximity ensures closest theme wins.

Problem : ship a Newly Available feature without a fallback.
    -> NEVER. Gate with @supports at-rule(@scope) per
       [[frontend-core-web-standards-baseline]].
```

### Decision tree : "Why is my unlayered rule winning over my layered rule?"

```
Are both rules NORMAL (no !important) ?
    -> Yes : unlayered beats layered. By spec.
       Fix : move the unlayered rule into a named layer.
       NEVER add !important to "fix" this. !important reverses the order
       and creates a second bug.

Are both rules IMPORTANT (!important) ?
    -> The LAYERED rule wins. Unlayered loses for !important.
       This is the second-most-misunderstood inversion.

One normal, one important ?
    -> The IMPORTANT rule wins regardless of layering.
```

## Mental Model

Cascade Layers replace the specificity-bidding war with explicit author intent. You declare the layer order once, near the top of your stylesheet, and every later rule resolves through that order without further `!important` tricks.

The two inversions exist for a deliberate reason. Normal cascade : unlayered rules are usually one-off authoritative declarations the author wrote AFTER seeing a problem; the spec respects that. Important cascade : `!important` is used most often by USERS overriding AUTHORS (the per-origin reversal of importance), and within author CSS, important rules in deep utility layers should not be trumped by random unlayered overrides; the inversion preserves the intent that important + layered = "I really mean it across the whole project".

`@scope` is the DOM-aware sibling of `@layer`. Where `@layer` orders the cascade by AUTHOR DECLARATION ORDER, `@scope` orders ties by DOM PROXIMITY. They compose : the inner block of `@scope` lives inside a `@layer`, and the cascade walks layer first (criterion 4), then specificity (criterion 5), then proximity (criterion 6).

The bare-selector zero-specificity rule inside `@scope` is the feature that finally lets authors write `img { ... }` inside a component without ANY specificity inflation. Compared to the BEM workaround (`.card__image`) or the `:where()` wrapper (`:where(.card) img`), `@scope` is more local AND more readable.

`revert-layer` is the inverse operation : roll back to the cascaded value from the previous layer. Useful in utility layers : `padding: revert-layer;` undoes the component-layer padding and re-exposes the base or theme value.

## Patterns

### Pattern 1 : Canonical layer order with third-party isolation

```css
@layer reset, base, theme, components, utilities;

@import "modern-normalize.css" layer(reset);
@import "vendor-table.css" layer(components);

@layer base {
  html { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; line-height: 1.5; }
}

@layer theme {
  :root {
    --surface: oklch(0.97 0 0);
    --accent: oklch(0.68 0.18 250);
  }
}

@layer components {
  .card { background: var(--surface); border-radius: 0.5rem; }
}

@layer utilities {
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
}
```

### Pattern 2 : Donut scope to stop the cascade at a nested boundary

```css
@layer components {
  @supports at-rule(@scope) {
    @scope (.card) to (.card .card) {
      img { border-radius: 0.5rem; }
      .title { font-weight: 600; }
      .actions { margin-block-start: auto; }
    }
  }

  /* Fallback for pre-2025 browsers : higher specificity, broader reach */
  @supports not at-rule(@scope) {
    .card > img { border-radius: 0.5rem; }
    .card > .title { font-weight: 600; }
    .card > .actions { margin-block-start: auto; }
  }
}
```

### Pattern 3 : Proximity-cascade for theme nesting

```css
@layer components {
  @scope (.light) {
    :scope { background: oklch(0.97 0 0); color: oklch(0.2 0 0); }
  }
  @scope (.dark) {
    :scope { background: oklch(0.2 0 0); color: oklch(0.97 0 0); }
  }
}
```

A `<div class="light"><div class="dark"><div class="light">...</div></div></div>` chain now resolves each innermost block against its CLOSEST theme ancestor without any explicit specificity or source-order tricks.

### Pattern 4 : `revert-layer` to undo a component override

```css
@layer components {
  button { padding: 0.5rem 1rem; }
}
@layer utilities {
  .unstyled { padding: revert-layer; }
}
```

`.unstyled` reverts the padding to whatever the previous layer (or browser default) had set.

## Anti-patterns (summary)

See `references/anti-patterns.md` for full symptom / root cause / fix.

1. Mixing unlayered author CSS with layered author CSS.
2. `!important` chain instead of layer discipline.
3. Assuming `!important` follows the same layer order as normal declarations.
4. Shipping `@scope` without an `@supports` gate.
5. Using `:scope` where a bare selector was intended.
6. Declaring `@layer` inside `@media` expecting the order to persist.
7. Forgetting that `@scope` does NOT isolate inheritance.
8. Overscoping (omitting the donut limit when nesting is possible).

## References

- [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19)
- [MDN : @scope](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) (verified 2026-05-19)
- [W3C TR : CSS Cascade and Inheritance Level 5](https://www.w3.org/TR/css-cascade-5/) (verified 2026-05-19)
- [W3C TR : CSS Cascade and Inheritance Level 6](https://www.w3.org/TR/css-cascade-6/) (verified 2026-05-19)
- `references/methods.md` : full grammar tables and CSSOM interfaces
- `references/examples.md` : worked patterns for common cascade conflicts
- `references/anti-patterns.md` : 8 anti-patterns with symptom / root cause / fix

## Cross-references

- [[frontend-core-web-standards-baseline]] for `@supports` gating discipline
- [[frontend-syntax-css-container-queries]] for container-based responsiveness
- [[frontend-syntax-css-nesting-logical-properties]] for native CSS nesting interaction with `&`
- [[frontend-errors-cascade-conflicts]] for diagnosing layer-related cascade bugs
