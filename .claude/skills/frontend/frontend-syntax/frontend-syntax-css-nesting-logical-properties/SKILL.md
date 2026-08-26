---
name: frontend-syntax-css-nesting-logical-properties
description: >
  Use when authoring modern CSS without a preprocessor and you need either
  native nesting (`&` selector, nested `@media` / `@container` inside a
  rule) or logical properties (`margin-inline`, `padding-block`,
  `inset-inline-start`, `block-size`, `inline-size`) for international,
  RTL, or vertical-writing-mode layouts. Also use when deciding between
  physical and flow-relative properties, when a layout breaks in Arabic
  or Hebrew, when a vertical-writing-mode component leaks margins on the
  wrong side, or when reaching reflexively for Sass / PostCSS-nesting
  syntax that no longer applies in evergreen-2026.
  Prevents the four canonical failures : expecting the Sass `&__icon`
  string-concat BEM trick to work in native nesting (it does NOT), mixing
  physical (`margin-left`) and logical (`margin-inline-start`) properties
  in the same component (cascade conflict), assuming `inline-size` always
  equals `width` (it maps to height under vertical writing modes), and
  dropping the `&` for a pseudo-class nest (`:hover { ... }` inside a
  parent silently becomes an invalid bare type selector rather than
  parent:hover).
  Covers the `&` nesting selector, the relaxed-nesting rule that lets
  bare class / id / attribute selectors nest as descendants, nesting
  at-rules (`@media`, `@container`, `@supports`) inside style rules,
  specificity behavior, the full logical-property catalog
  (size, margin, padding, border, border-radius, inset), the physical-
  to-logical mapping table, how `writing-mode` and `direction` (or `dir`
  HTML attribute) rotate the block / inline axes, the `:dir(ltr|rtl)`
  pseudo-class, and Baseline status for both feature areas.
  Keywords: CSS nesting, & nesting selector, native nesting, relaxed
  nesting, nested @media, nested @container, specificity nesting,
  logical properties, flow-relative properties, margin-block,
  margin-inline, padding-block, padding-inline, inset-block,
  inset-inline, block-size, inline-size, border-block, border-inline,
  border-start-start-radius, writing-mode, vertical-rl, vertical-lr,
  direction ltr, direction rtl, :dir, dir attribute, RTL layout broken,
  padding on wrong side, vertical writing breaks margins,
  & not working in CSS, no parent selector trick like Sass __icon,
  how do I nest CSS without Sass, what is the & selector,
  how to make CSS work in RTL, what are CSS logical properties,
  can I nest CSS natively, Arabic layout broken, Hebrew RTL CSS.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Syntax : CSS Nesting and Logical Properties

Authoritative reference for two foundational evergreen-2026 CSS authoring features that share one design intent : removing the need for build tools (nesting replaces Sass, logical properties replace direction-aware CSS-in-JS). Both are Baseline Widely Available.

## Quick Reference

### Baseline status

| Feature | Baseline tier | Source |
|---|---|---|
| Native CSS nesting (`&`, bare nesting, nested at-rules) | Widely Available since 2023 | [MDN : CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) (verified 2026-05-19) |
| Logical properties (size, margin, padding, border, inset) | Widely Available | [MDN : CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19) |
| `:dir(ltr|rtl)` pseudo-class | Widely Available since 2023 | [MDN : CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19) |

Per `evergreen-2026`, neither feature requires a `@supports` gate in production code.

### One-screen nesting cheatsheet

```css
.card {
  /* declarations apply to .card */
  color: var(--fg);

  /* bare nested selector : equivalent to ".card .title" */
  .title { font-weight: 600; }

  /* "&" required for pseudo-class and pseudo-element */
  &:hover { background: var(--hover); }
  &::before { content: ""; }

  /* "&" required for combinator-prefixed selectors */
  & > .icon { inline-size: 1rem; }
  & + .card { margin-block-start: 1rem; }

  /* nested at-rules : equivalent to wrapping ".card { ... }" in @media */
  @media (min-width: 60em) {
    padding-inline: 2rem;
  }

  @container (inline-size > 30rem) {
    grid-template-columns: 1fr 2fr;
  }
}
```

### One-screen logical-property cheatsheet

```css
.box {
  /* size */
  inline-size: 320px;         /* was width */
  block-size: auto;           /* was height */
  min-inline-size: 240px;     /* was min-width */
  max-block-size: 50vh;       /* was max-height */

  /* margin / padding shorthands take 1 or 2 values */
  margin-block: 1rem;         /* top + bottom */
  margin-inline: auto;        /* left + right (LTR) */
  padding-block: 1rem 2rem;   /* start, end */
  padding-inline-start: 1rem; /* was padding-left in LTR */

  /* positioning */
  position: absolute;
  inset-block-start: 0;       /* was top */
  inset-inline-end: 0;        /* was right in LTR, left in RTL */

  /* border */
  border-block-end: 1px solid var(--border);   /* was border-bottom */
  border-inline-start: 4px solid var(--accent);

  /* border-radius (flow-relative corners) */
  border-start-end-radius: 8px;  /* top-right in LTR, top-left in RTL */
}
```

## Decision Trees

### Tree 1 : Do I need `&` in this nesting context?

```
Is the nested selector a pseudo-class or pseudo-element?
   YES -> & REQUIRED. Example : &:hover, &::before, &:focus-visible
   NO  -> next question

Does the nested selector start with a combinator ( >, +, ~ )?
   YES -> & REQUIRED. Example : & > .child, & + .sibling, & ~ .later
   NO  -> next question

Is it a bare type / class / id / attribute selector?
   YES -> & OPTIONAL. ".card { .title { ... } }" is valid and means
          ".card .title" (descendant). Same as "& .title { ... }".
   NO  -> next question

Is it a selector list with the parent appearing mid-chain?
   YES -> & REQUIRED to position parent : "& > .child &:focus { ... }".
```

### Tree 2 : Logical or physical property for this declaration?

```
Is this a NEW component or a refactor with logical-property intent?
   YES -> ALWAYS logical. margin-inline-start, padding-block, inset-block-end.
   NO  -> next question

Does the surrounding codebase already use physical properties consistently?
   YES -> match local convention. NEVER mix physical and logical in the same
          component (cascade conflicts; one wins per source-order, the other
          is dead).
   NO  -> next question

Will this component ever render under RTL, vertical-rl, or vertical-lr?
   YES -> ALWAYS logical. Physical properties are direction-blind and break
          internationalization.
   NO  -> logical is still preferred for forward-compatibility, but physical
          is acceptable if the entire app is locked to LTR horizontal-tb.
```

### Tree 3 : When does `writing-mode` matter?

```
Is content vertical (traditional CJK, rotated headlines, side labels)?
   YES -> writing-mode: vertical-rl (most CJK) or vertical-lr.
          block-axis becomes HORIZONTAL, inline-axis becomes VERTICAL.
          inline-size now maps to height, block-size to width.
   NO  -> next question

Is content RTL (Arabic, Hebrew, Farsi, Urdu) but still horizontal?
   YES -> writing-mode stays horizontal-tb. Use dir="rtl" on <html> (or
          on the subtree). inline-start swaps to the right side; block-start
          stays top.
   NO  -> default horizontal-tb + ltr. inline-start = left, block-start = top.
```

## Patterns

### Pattern A : Native nesting replacing Sass

Sass that was previously :

```scss
.menu {
  &__item { color: var(--fg); }
  &__item:hover { color: var(--hover); }
  & > & { margin-inline-start: 1rem; }
}
```

Becomes in native CSS (without the BEM `&__` trick) :

```css
.menu {
  & > .menu { margin-inline-start: 1rem; }
}

.menu__item {
  color: var(--fg);

  &:hover { color: var(--hover); }
}
```

The `&__` BEM string-concatenation pattern is a Sass / preprocessor feature only. Native nesting has no string-concat semantics. Authors MUST write the full class name in a separate rule.

### Pattern B : Component card with nested at-rules

```css
.card {
  display: grid;
  gap: 1rem;
  padding-block: 1rem;
  padding-inline: 1.25rem;
  border-radius: 12px;
  background: var(--surface);

  .card-title { font-size: 1.125rem; }
  .card-body  { color: var(--fg-muted); }

  &:hover { background: var(--surface-hover); }
  &:focus-within { outline: 2px solid var(--accent); }

  @container (inline-size > 28rem) {
    grid-template-columns: auto 1fr;
    padding-inline: 2rem;
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: background 120ms ease;
  }
}
```

### Pattern C : RTL-safe layout with logical properties

```css
.toolbar {
  display: flex;
  gap: 0.75rem;
  padding-inline: 1rem;
  padding-block: 0.5rem;
  border-block-end: 1px solid var(--border);
}

.toolbar-search {
  margin-inline-start: auto;   /* pushes to inline-end side automatically */
  inline-size: clamp(12rem, 30vw, 24rem);
}

.toolbar-icon-button {
  inset-inline-end: 0.5rem;    /* tooltip anchor offset, dir-aware */
  border-start-start-radius: 6px;
  border-end-start-radius: 6px;
}
```

Setting `<html dir="rtl">` swaps `margin-inline-start: auto` from "push right" (LTR) to "push left" (RTL) without changing the rule.

### Pattern D : Direction-conditional styling with `:dir()`

```css
/* Arrow icon should always point in the reading direction */
.next-button::after {
  content: "\2192"; /* rightwards arrow */
}

:dir(rtl) .next-button::after {
  content: "\2190"; /* leftwards arrow */
}
```

`:dir(ltr)` and `:dir(rtl)` match based on the computed directionality of the element (inherited from the `dir` HTML attribute or `direction` CSS), not on attribute selector matching. Prefer `:dir(rtl)` over `[dir="rtl"]` when an inherited `dir` should still match (the attribute selector requires the attribute on that exact element).

### Pattern E : Vertical writing mode with logical properties

```css
.vertical-headline {
  writing-mode: vertical-rl;
  block-size: 24rem;      /* the visible width in screen pixels */
  inline-size: 4rem;      /* the visible height (CJK column width) */
  padding-block-start: 1rem;  /* visually "right" padding in vertical-rl */
}
```

Under `vertical-rl`, the inline axis is vertical and the block axis is horizontal. `inline-size` controls the screen-vertical extent; `block-size` controls the screen-horizontal extent. This is the central reason the spec uses `inline-size` instead of `width` : the property name describes flow, not screen geometry.

### Pattern F : Specificity stays flat under nesting

```css
.card {                         /* specificity (0,1,0) */
  &:hover { ... }               /* (0,2,0) : .card:hover */
  .title { ... }                /* (0,2,0) : .card .title */
  & > .body & .meta { ... }     /* (0,3,0) : .card > .body .card .meta */
}
```

Native nesting does NOT inflate specificity beyond the final flattened selector. The nesting structure is syntactic only.

## Out of Scope

- Sass / PostCSS-Nesting preprocessor syntax (project is no-build by default per `[[frontend-core-architecture]]`).
- Cascade layers and `@scope` (covered in `[[frontend-syntax-css-cascade-layers-scope]]`).
- Container query mechanics (covered in `[[frontend-syntax-css-container-queries]]`).
- Framework-scoped styles (React CSS Modules, Vue scoped styles).

## Hard Rules (Binding)

1. NEVER write `&__icon` and expect Sass-style BEM concatenation. Native nesting has no string-concat. Write `.parent__icon` as a separate top-level rule.
2. NEVER drop `&` before a pseudo-class inside a nested rule. `.btn { :hover { ... } }` is a bare descendant selector for `<:hover>` element type, which is invalid. ALWAYS `.btn { &:hover { ... } }`.
3. NEVER mix physical (`margin-left`) and logical (`margin-inline-start`) in the same component. The later-source-order wins; the other is dead code AND causes cascade audits to fail.
4. NEVER use `inline-size: 100%` while assuming "width". Under vertical writing-mode it sets height. Use whichever name matches your mental model AND stay consistent within a component.
5. NEVER use `[dir="rtl"]` when `:dir(rtl)` is appropriate. The attribute selector misses cases where `dir` is inherited from an ancestor and not present on the element being styled.
6. NEVER nest more than 3 levels deep. Each level multiplies cognitive load; flatten anything beyond 3.

## Reference Links

- `references/methods.md` : full logical-property catalog with physical mappings, the `:dir()` pseudo-class signature, and the nesting grammar
- `references/examples.md` : renderable self-contained HTML demo (card + RTL toggle + vertical writing mode)
- `references/anti-patterns.md` : 6 anti-patterns with symptom, root cause, fix
- [MDN : CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) (verified 2026-05-19)
- [MDN : CSS Logical Properties and Values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19)
- [W3C : CSS Nesting Module Level 1](https://www.w3.org/TR/css-nesting-1/)
- [W3C : CSS Logical Properties and Values Level 1](https://www.w3.org/TR/css-logical-1/)

## Cross-References

- `[[frontend-syntax-css-cascade-layers-scope]]` : nest cascade-layered rules; resolve specificity inversions
- `[[frontend-syntax-css-has-selector]]` : `:has()` combines naturally with `&` (`& :has(.active)`)
- `[[frontend-syntax-css-container-queries]]` : `@container` is a primary nested at-rule
- `[[frontend-errors-cascade-conflicts]]` : physical / logical mix detection
- `[[frontend-core-architecture]]` : no-build default rationale
