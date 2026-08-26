# References : CSS Nesting + Logical Properties Catalog

All entries traceable to [MDN : CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) (verified 2026-05-19) and [MDN : CSS Logical Properties and Values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19).

## 1. Nesting Grammar

### 1.1 The `&` nesting selector

| Aspect | Value |
|---|---|
| Symbol | `&` |
| Represents | The compound parent selector at the position where it appears |
| Specificity | Equal to the parent compound selector |
| Multiple occurrences | Allowed : `& > & + &` valid, each occurrence is the parent |
| Inside `:is(...)` / `:where(...)` | Allowed and recommended for OR-of-parents patterns |

### 1.2 When `&` is REQUIRED

| Context | Example | Required |
|---|---|---|
| Pseudo-class on parent | `&:hover`, `&:focus-visible`, `&[disabled]` | YES |
| Pseudo-element on parent | `&::before`, `&::placeholder` | YES |
| Attribute selector on parent | `&[aria-expanded="true"]` | YES |
| Combinator-prefixed selector | `& > .child`, `& + .next`, `& ~ .later` | YES |
| Compound selector starting with parent | `&.is-active`, `&#main` | YES |

### 1.3 When `&` is OPTIONAL (relaxed-nesting rule, 2023)

| Context | Without `&` | Equivalent with `&` |
|---|---|---|
| Bare class selector | `.card { .title { ... } }` | `.card { & .title { ... } }` |
| Bare id selector | `.card { #lead { ... } }` | `.card { & #lead { ... } }` |
| Bare type selector | `.card { h2 { ... } }` | `.card { & h2 { ... } }` |
| Bare attribute selector | `form { [required] { ... } }` | `form { & [required] { ... } }` |

All bare forms are descendant selectors (whitespace combinator).

### 1.4 Nested at-rules

Allowed inside a style rule :

| At-rule | Behavior |
|---|---|
| `@media (...)` | Equivalent to wrapping the parent rule in the media query |
| `@container (...)` | Equivalent to wrapping the parent rule in the container query |
| `@supports (...)` | Equivalent to wrapping the parent rule in `@supports` |
| `@layer name` | Allowed inside a style rule; assigns the nested declarations to the named layer |

Not nestable inside a style rule : `@scope`, `@property`, `@font-face`, `@keyframes`, `@import`, `@namespace`.

### 1.5 Specificity rule

Final flattened selector specificity ONLY. Nesting structure does NOT inflate. Example :

```css
.a { &.b { & > .c { ... } } }
/* flattens to ".a.b > .c" with specificity (0,3,0) */
```

## 2. Logical Properties : Full Catalog

### 2.1 Sizing

| Logical | Physical equivalent (LTR + horizontal-tb) | Notes |
|---|---|---|
| `inline-size` | `width` | Becomes `height` under vertical writing-mode |
| `block-size` | `height` | Becomes `width` under vertical writing-mode |
| `min-inline-size` | `min-width` | |
| `min-block-size` | `min-height` | |
| `max-inline-size` | `max-width` | |
| `max-block-size` | `max-height` | |

### 2.2 Margins

| Logical | Physical equivalent (LTR + horizontal-tb) |
|---|---|
| `margin-block-start` | `margin-top` |
| `margin-block-end` | `margin-bottom` |
| `margin-inline-start` | `margin-left` |
| `margin-inline-end` | `margin-right` |
| `margin-block` (shorthand) | `margin-top` + `margin-bottom` |
| `margin-inline` (shorthand) | `margin-left` + `margin-right` |

Shorthand accepts 1 or 2 values : `margin-block: 1rem` (same start + end) or `margin-block: 1rem 2rem` (start, end).

### 2.3 Padding

Identical structure to margin :

| Logical | Physical |
|---|---|
| `padding-block-start` | `padding-top` |
| `padding-block-end` | `padding-bottom` |
| `padding-inline-start` | `padding-left` |
| `padding-inline-end` | `padding-right` |
| `padding-block` | `padding-top` + `padding-bottom` |
| `padding-inline` | `padding-left` + `padding-right` |

### 2.4 Borders

| Logical | Physical |
|---|---|
| `border-block-start` | `border-top` |
| `border-block-end` | `border-bottom` |
| `border-inline-start` | `border-left` |
| `border-inline-end` | `border-right` |
| `border-block` | both block sides |
| `border-inline` | both inline sides |
| `border-block-start-color` | `border-top-color` |
| `border-block-start-style` | `border-top-style` |
| `border-block-start-width` | `border-top-width` |

Same `-color` / `-style` / `-width` split exists for all four sides.

### 2.5 Border radius (flow-relative corners)

| Logical | Physical (LTR + horizontal-tb) |
|---|---|
| `border-start-start-radius` | `border-top-left-radius` |
| `border-start-end-radius` | `border-top-right-radius` |
| `border-end-start-radius` | `border-bottom-left-radius` |
| `border-end-end-radius` | `border-bottom-right-radius` |

Naming convention : `border-<block-side>-<inline-side>-radius`.

### 2.6 Inset (positioning)

| Logical | Physical |
|---|---|
| `inset-block-start` | `top` |
| `inset-block-end` | `bottom` |
| `inset-inline-start` | `left` (LTR) / `right` (RTL) |
| `inset-inline-end` | `right` (LTR) / `left` (RTL) |
| `inset-block` | `top` + `bottom` |
| `inset-inline` | `left` + `right` (or swapped under RTL) |
| `inset` | shorthand for all four |

### 2.7 Overflow and other module-level logical properties

| Logical | Module |
|---|---|
| `overflow-block` | CSS Overflow Module |
| `overflow-inline` | CSS Overflow Module |
| `overscroll-behavior-block` | CSS Overscroll Behavior Module |
| `overscroll-behavior-inline` | CSS Overscroll Behavior Module |
| `contain-intrinsic-block-size` | CSS Containment Module |
| `contain-intrinsic-inline-size` | CSS Containment Module |

## 3. Writing-Mode and Direction

### 3.1 `writing-mode` values

| Value | Block axis (screen) | Inline axis (screen) | Use |
|---|---|---|---|
| `horizontal-tb` (default) | vertical, top to bottom | horizontal, dir-dependent | most Latin / Cyrillic / Arabic / Hebrew |
| `vertical-rl` | horizontal, right to left | vertical, top to bottom | traditional CJK |
| `vertical-lr` | horizontal, left to right | vertical, top to bottom | Mongolian, some CJK |
| `sideways-rl` | horizontal, right to left | vertical (rotated) | rotated labels |
| `sideways-lr` | horizontal, left to right | vertical (rotated) | rotated labels |

### 3.2 `direction` values

| Value | Effect on inline axis (under horizontal-tb) |
|---|---|
| `ltr` (default) | inline-start = left, inline-end = right |
| `rtl` | inline-start = right, inline-end = left |

`direction` is normally set via the HTML `dir` attribute, NOT the CSS property, so the value travels with the markup and JS-driven directionality switches are observable to assistive tech.

### 3.3 The `:dir()` pseudo-class

| Form | Matches |
|---|---|
| `:dir(ltr)` | elements with computed directionality LTR (inherited from `dir` or `direction`) |
| `:dir(rtl)` | elements with computed directionality RTL |

`:dir(rtl)` differs from `[dir="rtl"]` : the attribute selector matches only elements that literally have `dir="rtl"` set on themselves; `:dir(rtl)` matches anything that inherits an RTL computed directionality.

## 4. Browser Recovery Behavior (Important)

If a nested rule is malformed (parser cannot recover), the entire rule is discarded per CSS error-handling. This means `.card { :hover { color: red; } }` (missing `&`) silently drops the `:hover` block instead of misapplying styles. Always validate with browser devtools "Issues" panel.

## 5. Related Skills

- `[[frontend-syntax-css-has-selector]]` : `:has()` works with nested `&` for forgiving parent-state matching
- `[[frontend-syntax-css-container-queries]]` : nesting `@container` inside selectors is the recommended authoring style
- `[[frontend-syntax-css-cascade-layers-scope]]` : combine nested rules with cascade layers for predictable specificity
