# Methods : `:has()` grammar, combinators, specificity

All signatures verified against [MDN : :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) (verified 2026-05-19) and [W3C TR : Selectors Level 4](https://www.w3.org/TR/selectors-4/) (verified 2026-05-19).

## Grammar

```
<has-selector> = <compound-selector> ':has(' <relative-selector-list> ')'

<relative-selector-list> = <relative-selector> [ , <relative-selector> ]*

<relative-selector> = [ <combinator>? <complex-selector> ]
```

`<combinator>` is one of `>`, `+`, `~`, or omitted (descendant). The implicit anchor of the relative selector is the element being tested.

## Combinator placement inside `:has()`

| Combinator | Inside `:has()` | Meaning | Example |
|---|---|---|---|
| (none) descendant | `:has(.foo)` | Anywhere in the subtree | `.gallery:has(img)` |
| `>` child | `:has(> .foo)` | Direct child only | `.card:has(> .header)` |
| `+` next sibling | `:has(+ .foo)` | Element immediately follows the anchor | `h2:has(+ p)` |
| `~` general sibling | `:has(~ .foo)` | Some later sibling | `.section:has(~ .footer)` |

The descendant combinator (whitespace) traverses the WHOLE subtree, making it the most expensive form to maintain. Prefer `>`, `+`, or `~` when the relationship is direct.

## Logical operations

| Operation | Form | Example |
|---|---|---|
| OR | comma inside `:has(...)` | `article:has(figure, table)` |
| AND | chained `:has(...):has(...)` | `article:has(figure):has(table)` |
| NOT (inner) | `:has(:not(.x))` matches anchor containing something that is not `.x` | `article:has(:not(.draft))` |
| NOT (outer) | `:not(.x):has(.y)` matches anchor not having class `.x` but containing `.y` | `:not(.locked):has(.editable)` |

## Specificity rule

Per [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) (verified 2026-05-19), specificity of `:has(...)` equals the HIGHEST specificity of any selector inside. Same rule as `:is()` and `:not()`. The `:has` notation itself contributes ZERO.

| Selector | Specificity breakdown | Total |
|---|---|---|
| `h1:has(+ h2)` | h1 + h2 | 0,0,2 |
| `article:has(.featured)` | article + .featured (highest) | 0,1,1 |
| `.card:has(#hero)` | .card + #hero (highest) | 1,1,0 |
| `:has(p)` (no anchor compound) | p only | 0,0,1 |

Be careful when the inner list contains an `#id` : the whole selector inherits ID-level specificity even if the anchor was a class.

## Forgiving behavior

The INNER selector list is forgiving : invalid or unrecognized selectors are SKIPPED instead of invalidating the rule. Example :

```css
/* If :unknown-pseudo is unrecognized, only .b is evaluated */
.a:has(:unknown-pseudo, .b) { ... }
```

The OUTER `:has(...)` itself is NOT forgiving. To make a rule survive on browsers without `:has()` support, wrap in `:is()` or `:where()` :

```css
/* Forgiving outer wrapping */
:is(h1:has(+ h2), h1) { color: oklch(0.2 0 0); }
```

## Restrictions (HARD)

| Restriction | Invalid | Reason |
|---|---|---|
| No pseudo-element inside | `div:has(::before)` | Pseudo-elements exist conditionally on ancestor styling; cyclic dependency |
| No pseudo-element anchor | `::before:has(.x)` | Same reason |
| No nested `:has()` | `.a:has(.b:has(.c))` | Quadratic blow-up of reverse-tracking |
| No match against self | `.card:has(.card)` selects OUTER only | The inner relative selector is evaluated EXCLUDING the anchor |

## `@supports` gating

```css
@supports selector(:has(*)) {
  /* :has-using rules */
}
@supports not selector(:has(*)) {
  /* Fallback rules */
}
```

Per `[[frontend-core-web-standards-baseline]]`, projects that still target visitors on browsers older than 6 months MUST gate. For evergreen-2026, no gate is required by default.

## Performance heuristics

| Goal | Rule |
|---|---|
| Minimize re-evaluation cost | Anchor on the SMALLEST possible subtree |
| Avoid full-page invalidation | NEVER anchor on `body`, `html`, `:root`, or `*` |
| Reduce traversal depth | Prefer `:has(> child)` over `:has(child)` |
| Avoid runaway specificity | Avoid `#id` selectors inside `:has()` unless intentional |
| Survive browser legacy | Wrap outer in `:is()` or use `@supports selector(:has(*))` |

## Baseline status

| `web-features` id | `status.baseline` | `baseline_low_date` | Notes |
|---|---|---|---|
| `has` | `low` -> `high` (mid-2026) | 2023-12 | Becomes Widely Available around mid-2026 |
