# References : CSS Nesting + Logical Properties Anti-Patterns

Six common failure modes with symptom, root cause, fix, and verifying source.

## Anti-Pattern 1 : Sass `&__icon` BEM concatenation in native CSS

### Symptom
Class `.menu__icon` styles never apply. DevTools "Issues" panel may show "Selector ignored" or the rule silently vanishes from the cascade.

### Root cause
Native CSS nesting has NO string-concatenation semantics. The `&` selector represents the parent compound selector as a SELECTOR, not as a text fragment. `&__icon` parses as the compound selector `<parent>__icon`, which is not a valid CSS selector grammar production, so the entire nested rule is discarded by the parser.

```css
/* WRONG : silently ignored */
.menu {
  &__icon { color: red; }
}
```

### Fix
Write the full class name as a separate top-level rule. If grouping is desired, place the rules adjacent in the source or use cascade layers.

```css
/* CORRECT */
.menu { display: flex; }
.menu__icon { color: red; }
```

Source : [MDN : CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) (verified 2026-05-19). The relaxed-nesting rule allows bare descendant selectors but does NOT introduce Sass-style string-concat.

## Anti-Pattern 2 : Missing `&` before a pseudo-class

### Symptom
Hover / focus styles never apply. The rule appears in source but has no effect at runtime.

### Root cause
Without `&`, `:hover { ... }` inside a nested block is parsed as a bare selector for an element of type `<:hover>`, which is invalid. The nested rule is silently dropped per CSS error recovery.

```css
/* WRONG */
.btn {
  :hover { color: red; }
}
```

### Fix
Always prefix pseudo-classes and pseudo-elements with `&` when nesting them on the parent.

```css
/* CORRECT */
.btn {
  &:hover { color: red; }
}
```

Source : [MDN : CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) (verified 2026-05-19), required-`&` rule for pseudo-class context.

## Anti-Pattern 3 : Physical `margin-left` in an internationalizable component

### Symptom
Component breaks under RTL. Hebrew, Arabic, Farsi, Urdu users see content pushed AWAY from the start edge of the column instead of toward it. Padding accumulates against the wrong side.

### Root cause
Physical properties (`left`, `right`, `top`, `bottom`, `margin-left`, `padding-right`, etc.) are direction-blind. They always refer to the SAME screen direction regardless of `dir` or `writing-mode`.

```css
/* WRONG : breaks under RTL */
.item {
  margin-left: 1rem;
  padding-right: 0.5rem;
  border-left: 4px solid;
}
```

### Fix
Use logical properties. They follow the computed directionality automatically.

```css
/* CORRECT : works under LTR, RTL, vertical-rl, vertical-lr */
.item {
  margin-inline-start: 1rem;
  padding-inline-end: 0.5rem;
  border-inline-start: 4px solid;
}
```

Source : [MDN : CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19). Mapping under RTL : `margin-inline-start` -> `margin-right`.

## Anti-Pattern 4 : Mixing physical and logical in the same component

### Symptom
Cascade audit finds both `margin-left` and `margin-inline-start` on the same element. Source-order wins, the other declaration is dead. RTL behavior is partially broken : some properties flip, others do not. Hard to debug because each rule looks correct in isolation.

### Root cause
Two property names targeting the same physical side compete in the cascade. CSS does NOT merge logical and physical into a single declaration; the later in source order wins entirely.

```css
/* WRONG */
.card {
  margin-left: 1rem;            /* physical */
  margin-inline-start: 0.75rem; /* logical : wins, since later */
}

/* And elsewhere, in a different stylesheet : */
.card-promo {
  margin-left: 2rem;            /* OVERRIDES the logical above on this variant */
}
```

### Fix
Pick ONE system per component (preferably logical) and enforce it via a stylelint rule or a code-review checklist.

```css
/* CORRECT */
.card { margin-inline-start: 0.75rem; }
.card-promo { margin-inline-start: 2rem; }
```

Source : [MDN : CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19), property-mapping note.

## Anti-Pattern 5 : Assuming `inline-size` equals `width`

### Symptom
A component under `writing-mode: vertical-rl` has the wrong dimensions : a value intended as visible-width sets the visible-height instead. Sideways labels collapse or overflow.

### Root cause
`inline-size` describes the flow direction, NOT the screen axis. Under `horizontal-tb` (the default), it happens to equal `width`. Under `vertical-rl` or `vertical-lr`, it maps to height because the inline axis is now vertical.

```css
/* WRONG : the author wanted a 6rem-wide vertical tag */
.vertical-tag {
  writing-mode: vertical-rl;
  inline-size: 6rem;   /* this is 6rem of VERTICAL extent, not width */
}
```

### Fix
Choose the property whose semantic matches the layout intent under the actual writing mode.

```css
/* CORRECT : explicitly state which axis you mean */
.vertical-tag {
  writing-mode: vertical-rl;
  block-size: 6rem;    /* 6rem of horizontal screen extent under vertical-rl */
  inline-size: auto;   /* let content determine vertical extent */
}
```

Source : [MDN : CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19). Writing-mode mapping : under `vertical-rl`, inline axis is vertical.

## Anti-Pattern 6 : Using `[dir="rtl"]` when `:dir(rtl)` is needed

### Symptom
RTL styling applies on the `<html dir="rtl">` element itself but not on a descendant whose directionality is inherited (no literal `dir` attribute). Selecting `.card[dir="rtl"]` finds nothing.

### Root cause
`[dir="rtl"]` is an attribute selector and matches ONLY elements that literally carry the attribute. Directionality, however, inherits down the tree. Most elements inherit `dir` from `<html>` or a wrapper without having their own attribute.

```css
/* WRONG : misses inherited RTL elements */
.card[dir="rtl"] .label { text-align: right; }
```

### Fix
Use the `:dir()` pseudo-class. It matches the COMPUTED directionality and works on inheritance.

```css
/* CORRECT */
:dir(rtl) .card .label { text-align: end; }
/* or, combine with logical text-align value */
.card .label { text-align: end; } /* "end" is direction-aware */
```

Source : [MDN : CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19), `:dir()` pseudo-class.

## Anti-Pattern 7 (bonus) : Nesting more than 3 levels deep

### Symptom
Source becomes unreadable. Specificity calculation requires manual flattening. A small change in the outermost rule affects dozens of nested branches. Code review pushback. Refactor cost grows quadratically with depth.

### Root cause
While native nesting has no hard depth limit, human reading and maintenance complexity grows superlinearly. Beyond 3 levels, the cognitive load to predict which selector each declaration applies to exceeds the savings from grouping.

```css
/* WRONG : 5 levels deep */
.app {
  & .sidebar {
    & .menu {
      & .item {
        & > .icon {
          & svg { fill: currentColor; }
        }
      }
    }
  }
}
```

### Fix
Cap at 3 levels. Refactor deeper trees into smaller components with flatter selectors.

```css
/* CORRECT */
.sidebar-menu-item > .icon { color: var(--icon); }
.sidebar-menu-item > .icon svg { fill: currentColor; }
```

Source : established CSS authoring guidance ; supported indirectly by the CSS Nesting Module spec note that nesting does not inflate specificity beyond the flattened chain, so depth gives no functional benefit beyond a certain point.
