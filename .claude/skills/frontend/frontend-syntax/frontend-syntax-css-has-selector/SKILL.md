---
name: frontend-syntax-css-has-selector
description: >
  Use when styling an element based on a descendant, sibling, or sibling-state
  condition; building a parent-style-from-child relationship in CSS without
  JavaScript; choreographing form-state styling (`form:has(input:invalid)`);
  or deciding whether `:has()` or a JS class-toggle is the right tool.
  Prevents the four standard performance and validity traps : anchoring on
  `body` or `:root` (re-evaluates on every DOM mutation), placing pseudo-
  elements inside `:has()` (spec-prohibited), nesting `:has()` inside `:has()`
  (also spec-prohibited), and reaching for `:has()` when `:focus-within`
  already solves the problem with cheaper semantics.
  Covers `:has(<relative-selector-list>)` syntax, the forgiving inner list,
  the highest-specificity rule, restrictions, combinator placement
  (`> child`, `+ sibling`, `~ sibling`), OR-via-comma vs AND-via-chained-
  `:has(...)`, anchor-locality performance heuristics, gating via
  `@supports selector(:has(*))`, and Baseline status.
  Keywords: :has, has selector, relational selector, parent selector,
  sibling combinator, forgiving selector list, specificity, anchor element,
  @supports selector, :focus-within, page slow with :has, scroll jank,
  input lag, :has not matching, style based on child, want parent selector,
  how to style parent based on child, how do I style a parent in CSS,
  can I select sibling in CSS, what is the :has selector, why is :has slow.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Syntax : CSS `:has()` Relational Selector

Authoritative reference for the relational pseudo-class. Replaces JS-driven parent-state classes with native CSS while avoiding the well-known performance trap.

## Quick Reference

### Baseline status

| Attribute | Value | Source |
|---|---|---|
| Baseline Newly Available | December 2023 | [MDN : :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) (verified 2026-05-19) |
| Baseline Widely Available | 2026 (30-month rule, around mid-2026) | [[frontend-core-web-standards-baseline]] |

Per `evergreen-2026`, `:has()` no longer requires a gate by default in 2026; legacy code paths that still target Newly-tier browsers SHOULD gate with `@supports selector(:has(*))`.

### Syntax

```css
<anchor-selector>:has(<relative-selector-list>) { ... }
```

The `<relative-selector-list>` is evaluated against the anchor element. Each item is a relative selector; the implicit anchor is the element being tested.

| Form | Example | Meaning |
|---|---|---|
| Descendant | `.gallery:has(img.broken)` | Gallery containing a broken image anywhere inside |
| Direct child | `.gallery:has(> img)` | Gallery whose direct child is an `<img>` |
| Next sibling | `h2:has(+ p)` | `h2` immediately followed by a `<p>` |
| General sibling | `.section:has(~ .footer)` | `.section` followed (later) by `.footer` |
| OR (comma) | `article:has(figure, table)` | Article containing figure OR table |
| AND (chained) | `article:has(figure):has(table)` | Article containing figure AND table |

### Specificity rule

The specificity of `:has(...)` equals the HIGHEST-specificity selector inside, EXCLUDING the `:has(...)` notation itself. Same rule as `:is()` and `:not()`.

| Selector | Specificity |
|---|---|
| `h1:has(+ h2)` | 0,0,2 (two element selectors) |
| `article:has(.featured)` | 0,1,1 (`.featured` is the highest) |
| `.card:has(#hero)` | 1,1,0 (`#hero` is the highest) |

### Forgiving list behavior

The inner list is FORGIVING : unknown selectors are skipped silently rather than invalidating the whole rule. The OUTER `:has(...)` itself is NOT forgiving : if the browser does not implement `:has()` at all, the entire rule is dropped unless wrapped in `:is()` or `:where()` :

```css
/* Whole rule dropped on browsers without :has() */
h1:has(+ h2) { ... }

/* Forgiven : the unsupported branch is ignored, h1 still styled */
:is(h1:has(+ h2), h1) { ... }
```

### Restrictions (HARD)

1. NEVER place a pseudo-element inside `:has()`. `div:has(::before)` is invalid; `::before` cannot exist independently of its originating element for the purposes of matching.
2. NEVER use a pseudo-element as the anchor. `::before:has(.x)` is invalid.
3. NEVER nest `:has()` inside `:has()`. `.a:has(.b:has(.c))` is invalid.
4. `:has()` does NOT match the anchor itself. `.card:has(.card)` selects an outer `.card` that contains another `.card`, never the inner one against its own descendants.

Verified against [W3C TR : Selectors Level 4](https://www.w3.org/TR/selectors-4/) (verified 2026-05-19) and [MDN : :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) (verified 2026-05-19).

## Decision Trees

### Decision tree : "Is `:has()` the right tool here vs JS?"

```
Need to style a parent based on a child's PRESENCE :
    -> :has(.child)     (CSS-only, no JS)

Need to style a parent based on a child's STATE (:checked, :invalid, :empty) :
    -> :has(input:checked)     (CSS-only, no JS)

Need to style a parent based on a child's :focus :
    -> :focus-within (cheaper, simpler) NOT :has(:focus)

Need to style based on a sibling's existence or state :
    -> :has(+ .sibling) or :has(~ .later-sibling)

Need to react to a JS-managed state that JS already mutates (e.g. open/closed modal) :
    -> Toggle a class via JS. The class is faster and more explicit.

Need to nest :has() inside :has() :
    -> NEVER. Restructure the markup or compose with chained :has(...).

Need pseudo-element inside :has() :
    -> NEVER. Match the originating element instead.
```

### Decision tree : "How tight is my anchor?"

```
Anchor selector = body, html, :root, or *:
    -> NEVER. Every DOM mutation triggers a full re-evaluation.

Anchor selector = unbounded element type (e.g. div:has(...)):
    -> Tighten with a class : .panel:has(...), not div:has(...).

Anchor selector = component-root class with a small subtree:
    -> Good. Constrain the inner with a combinator (> child, + sibling).

Inner selector = bare element type traversing many descendants:
    -> Tighten with > or + or ~ to limit traversal depth.

Inner selector = nested deep paths (.a .b .c .d):
    -> Tighten to direct relationship (> .b > .c > .d) if semantics allow.
```

### Decision tree : "Should I gate with `@supports`?"

```
Project target = evergreen-2026 only:
    -> No gate required (Widely Available reached).

Project target includes pre-2024 visitors:
    -> Gate with @supports selector(:has(*)) and provide fallback.

Selector parser still fails on :has() in some user-agents:
    -> Wrap in :is() or :where() to make the outer rule forgiving.
```

## Mental Model

`:has()` rotates the cascade : instead of "child styled by parent", you can now write "parent styled by child". The selector evaluator first computes which elements match the inner relative selector, then reports the anchor that has at least one such descendant or sibling.

The performance characteristic is the inverse of normal selectors. A normal selector evaluates left-to-right (browser does right-to-left optimization internally, but the cost is bounded by the rightmost compound). `:has()` requires the engine to maintain a reverse-relationship table : for every potential anchor, track what changes to its subtree could change the match. The smaller the subtree per anchor, the cheaper the maintenance. Hence the inviolable rule : ANCHOR ON THE SMALLEST POSSIBLE SUBTREE.

`body:has(...)` is the canonical anti-pattern. It declares that ANY mutation anywhere in the page MAY change the match. Browsers do their best to optimize, but in practice this causes input lag during scroll, drag, and animation. Anchor on a component-root instead (`.gallery:has(...)`, `.form:has(...)`, `.card:has(...)`).

The "killer feature" status of `:has()` comes from two patterns that previously required JS : (1) form-state choreography, e.g. `form:has(input:invalid) [type=submit] { opacity: 0.5; pointer-events: none; }` enables/disables a submit button based on validation state without any JS, and (2) sibling-aware layout, e.g. `h2:has(+ p) { margin-block-end: 0; }` removes the bottom margin of a heading immediately followed by a paragraph.

`:has()` does NOT match the anchor against itself. `article:has(article)` selects an OUTER article that contains an INNER article; the inner one is not selected unless it also contains a third article. This is unlike `:scope` which can reference the matched element.

## Patterns

### Pattern 1 : Style a card when its button is hovered

```css
.card { transition: box-shadow 200ms; }
.card:has(button:hover) {
  box-shadow: 0 4px 16px oklch(0 0 0 / 0.15);
}
```

The shadow rises on the whole card when the button anywhere inside is hovered.

### Pattern 2 : Disable submit while form has invalid inputs

```css
form:has(input:invalid) [type=submit] {
  opacity: 0.5;
  pointer-events: none;
}
```

No JS. The submit visually deactivates as long as any descendant input is in an `:invalid` state.

### Pattern 3 : Collapse heading margin when followed by paragraph

```css
h2:has(+ p) { margin-block-end: 0; }
p:has(+ h2) { margin-block-end: 1.5rem; }
```

Adjacent rhythm without classes.

### Pattern 4 : Light up an item when its checkbox is checked

```css
.todo-row:has(input[type=checkbox]:checked) {
  text-decoration: line-through;
  opacity: 0.6;
}
```

### Pattern 5 : Reverse layout when a `<figure>` is present

```css
.article-grid:has(> figure) {
  grid-template-columns: 1fr 320px;
}
```

### Pattern 6 : Prefer `:focus-within` over `:has(:focus)`

```css
/* WRONG : more expensive, same outcome */
.field:has(:focus) { outline: 2px solid oklch(0.68 0.18 250); }

/* RIGHT : cheaper, established semantics */
.field:focus-within { outline: 2px solid oklch(0.68 0.18 250); }
```

`:focus-within` exists specifically for the parent-focused-descendant case and predates `:has()`.

### Pattern 7 : Gating for legacy targets

```css
.menu-trigger { background: oklch(0.97 0 0); }

@supports selector(:has(*)) {
  .menu-trigger:has(+ .menu[aria-expanded="true"]) {
    background: oklch(0.92 0 0);
  }
}
```

## Anti-patterns (summary)

See `references/anti-patterns.md` for full symptom / root cause / fix.

1. `body:has(...)` global performance killer.
2. Pseudo-element inside `:has()` (spec-prohibited).
3. Nested `:has()` (spec-prohibited).
4. Forgetting `:has()` does not match the anchor against itself.
5. Using `:has(:focus)` where `:focus-within` would do.
6. Relying on the outer `:has()` rule being "forgiven" (wrap in `:is()` for that).
7. Anchoring on an unbounded element selector like `div:has(...)` without class scoping.
8. Ignoring the specificity climb when the inner selector includes an `#id`.

## References

- [MDN : :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) (verified 2026-05-19)
- [W3C TR : Selectors Level 4 #has](https://www.w3.org/TR/selectors-4/) (verified 2026-05-19)
- `references/methods.md` : grammar tables, combinators, specificity matrix
- `references/examples.md` : worked patterns including form-state, sibling-rhythm, container-driven layout
- `references/anti-patterns.md` : 8 anti-patterns with symptom / root cause / fix

Note : the masterplan-listed source `https://web.dev/articles/css-has` returned HTTP 404 during verification on 2026-05-19. MDN and W3C Selectors Level 4 provide the same normative material; no claim in this skill depends on the web.dev page.

## Cross-references

- [[frontend-core-web-standards-baseline]] for `@supports selector(...)` gating discipline
- [[frontend-syntax-css-cascade-layers-scope]] for cascade-layer placement of relational rules
- [[frontend-a11y-focus-keyboard-inert]] for `:focus-within` semantics
- [[frontend-syntax-html5-form]] for form-state choreography patterns
- [[frontend-perf-animation-gpu-containment]] for anchor-locality and containment
