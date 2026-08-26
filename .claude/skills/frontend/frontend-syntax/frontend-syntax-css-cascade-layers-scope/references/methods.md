# Methods : `@layer`, `@scope`, CSSOM interfaces

All signatures verified against MDN and W3C TR sources cited in SKILL.md.

## `@layer` grammar

### Forms

| Form | Grammar | Effect |
|---|---|---|
| Statement | `@layer <ident-list>;` | Reserves names and fixes order |
| Block | `@layer <ident> { <rules> }` | Adds rules to layer `<ident>` |
| Block (anonymous) | `@layer { <rules> }` | Adds rules to a fresh anonymous layer (no name = no later addition) |
| Nested | `@layer <ident> { @layer <child> { <rules> } }` | Defines a sub-layer; the dotted name `<ident>.<child>` is the canonical reference |
| Dotted-name addition | `@layer <ident>.<child> { <rules> }` | Adds rules to the existing sub-layer |
| Import-form | `@import url(...) layer(<ident>);` | Imports a stylesheet into the named layer |
| Import (anonymous) | `@import url(...) layer;` | Imports into an anonymous layer |

### Ordering rules

1. Layer order is fixed by FIRST APPEARANCE of the name.
2. For NORMAL declarations : last-declared layer wins between layered rules; UNLAYERED beats ALL layered rules.
3. For `!important` declarations : first-declared layer wins between layered rules; LAYERED beats UNLAYERED (reversal).
4. Anonymous layers occupy a slot at the point of declaration. They CANNOT be re-opened.
5. Nested layers form an independent ordering inside their parent.

### `revert-layer` keyword

| Context | Effect |
|---|---|
| Property value (`padding: revert-layer;`) | Roll the cascaded value back to the value from the previous layer (or the layer below, or unlayered, or user-origin if nothing matches) |
| Inside a layer | Reverts to what would have been cascaded had this layer's rule not existed |

### CSSOM interfaces

| Interface | Where | Notable members |
|---|---|---|
| `CSSLayerStatementRule` | `document.styleSheets[i].cssRules[j]` | `.nameList` (array of layer names) |
| `CSSLayerBlockRule` | same | `.name`, `.cssRules` |

No direct `CSS.layer()` constructor. Inspection-only via CSSOM.

## `@scope` grammar

### Forms

| Form | Grammar | Notes |
|---|---|---|
| Root only | `@scope (<scope-start>) { <rules> }` | Apply from `<scope-start>` downward |
| Root + limit | `@scope (<scope-start>) to (<scope-end>) { <rules> }` | Donut : root inclusive, limit exclusive |
| Prelude-less inline | `<style>@scope { <rules> }</style>` inside a host element | Scope root = host of the `<style>` element |
| Inline + limit | `<style>@scope to (<scope-end>) { <rules> }</style>` | Inline form with donut |

### Boundary inclusivity overrides

| Pattern | Root inclusivity | Limit inclusivity |
|---|---|---|
| `@scope (.r) to (.l)` | inclusive (default) | exclusive (default) |
| `@scope (.r) to (.l > *)` | inclusive | inclusive |
| `@scope (.r > *) to (.l)` | exclusive | exclusive |
| `@scope (.r > *) to (.l > *)` | exclusive | inclusive |

### Specificity rules

| Selector position | Effective specificity |
|---|---|
| `img` (bare) inside `@scope (.x)` | spec of `img` only = 0,0,1 |
| `& img` inside `@scope (.x)` | same = 0,0,1 |
| `:scope img` inside `@scope (.x)` | spec of `img` PLUS `:scope` = 0,1,1 |
| `:scope` alone | 0,1,0 |

The implicit `:where(:scope)` prefix contributes ZERO specificity. Adding explicit `:scope` adds (0,1,0).

### Cascade position of scope proximity

Per [W3C TR : CSS Cascade 6](https://www.w3.org/TR/css-cascade-6/) (verified 2026-05-19) :

| Step | Criterion |
|---|---|
| 1 | Origin and Importance |
| 2 | Context (encapsulation) |
| 3 | Style Attribute |
| 4 | Cascade Layers |
| 5 | Specificity |
| 6 | Scope Proximity |
| 7 | Order of Appearance |

Proximity is the DOM-hop count from the scope root to the matched element. Smaller wins. Unscoped rules have infinite proximity.

### Inheritance is NOT scoped

`@scope` limits MATCHING. Inherited properties (`color`, `font-family`, `line-height`, custom properties) still flow through the DOM tree across the scope limit. ALWAYS set non-inheriting overrides (`background`, `border`, `padding`) inside the scope; reach for `all: revert-layer` if you need to break inheritance at a boundary.

## `@supports` gating

Verified against [MDN : @supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports) (verified 2026-05-19).

```css
@supports at-rule(@scope) {
  /* @scope-using rules */
}
@supports not at-rule(@scope) {
  /* Fallback rules */
}
```

The `at-rule()` function inside `@supports` reports whether the browser recognizes the at-rule's name. Gating discipline per [[frontend-core-web-standards-baseline]].

## Baseline status

| Feature | `web-features` id | `status.baseline` | `baseline_low_date` |
|---|---|---|---|
| `@layer` | `cascade-layers` | `high` (Widely) | 2022-03 |
| `@scope` | `at-scope` | `low` (Newly) | 2025-12 |
| `revert-layer` | `revert-layer` | `high` | 2022 |

Read at runtime via the `web-features` npm package.
