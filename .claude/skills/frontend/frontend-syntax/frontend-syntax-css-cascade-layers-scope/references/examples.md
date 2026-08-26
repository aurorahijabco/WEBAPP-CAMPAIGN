# Examples : `@layer` and `@scope`

All snippets verified against MDN and W3C TR sources cited in SKILL.md.

## Example 1 : Statement layer declares order

```css
@layer reset, base, theme, components, utilities;
```

First appearance fixes the order. Later blocks may add rules without re-declaring order.

```css
@layer utilities { .visually-hidden { ... } }
@layer base { html { color-scheme: light dark; } }
@layer reset { /* normalize rules */ }
```

The cascade still respects the statement-declared order even though the blocks appear out of sequence in the source.

## Example 2 : Third-party CSS isolated into a layer

```css
@layer reset, base, components, utilities;

@import "modern-normalize.css" layer(reset);
@import "vendor-grid.css" layer(components);
```

The vendor stylesheets cannot override `.btn` rules in the `utilities` layer because `utilities` is declared later.

## Example 3 : `!important` order is reversed

```css
@layer base, theme, utilities;

@layer base {
  .btn { background: red !important; }
}
@layer utilities {
  .btn { background: blue !important; }
}
```

The button is RED. For `!important`, the FIRST-declared layer wins. Add an explanatory code-comment when this pattern is intentional :

```css
/* @layer order REVERSES for !important : first-declared wins. */
```

## Example 4 : Unlayered always wins normal

```css
@layer components { .btn { background: blue; } }

.btn { background: red; }
```

The button is RED. Unlayered author rules beat all layered author rules for normal declarations. Move the unlayered rule into a layer to restore predictable order.

## Example 5 : Donut scope with bare-selector zero specificity

```css
@scope (.article-body) to (figure) {
  img { border-radius: 0.5rem; max-inline-size: 100%; }
  p   { line-height: 1.6; }
}
```

`img` matches every image inside `.article-body` EXCEPT images nested inside any `<figure>`. Specificity of `img` is 0,0,1 (the implicit `:where(:scope)` adds zero).

## Example 6 : Nested same-component donut

```css
@scope (.card) to (.card .card) {
  .title { font-size: 1.25rem; }
  .actions { display: flex; gap: 0.5rem; }
}
```

Outer `.card` styles its OWN `.title` and `.actions` but NOT a nested `.card`'s descendants. The nested card gets its own `@scope` activation, with its own scope-root.

## Example 7 : Proximity-cascade for nested themes

```css
@scope (.theme-light) {
  :scope { background: oklch(0.97 0 0); color: oklch(0.2 0 0); }
}
@scope (.theme-dark) {
  :scope { background: oklch(0.2 0 0); color: oklch(0.97 0 0); }
}
```

For DOM `<div class="theme-light"><div class="theme-dark"><div class="theme-light">X</div></div></div>` the innermost X gets light styling because its CLOSEST theme ancestor is `.theme-light` (1 hop) vs `.theme-dark` (2 hops).

## Example 8 : `:scope` adds class-specificity

```css
@scope (.card) {
  /* 0,0,1 */
  img { border-radius: 0.5rem; }

  /* 0,1,1  : explicit :scope adds (0,1,0) */
  :scope img { border-radius: 1rem; }
}
```

Use `:scope` ONLY when you intentionally want the higher specificity. For zero-specificity local styles, write bare selectors.

## Example 9 : `revert-layer` to undo a component rule

```css
@layer components {
  button { padding: 0.5rem 1rem; background: var(--accent); color: white; }
}

@layer utilities {
  .unstyled {
    padding: revert-layer;
    background: revert-layer;
    color: revert-layer;
  }
}
```

`.unstyled` rolls back to whatever the previous layer (or browser default) had for `padding`, `background`, `color`.

## Example 10 : Compose `@layer` and `@scope` together

```css
@layer components {
  @supports at-rule(@scope) {
    @scope (.card) to (.card .card) {
      :scope { padding: 1rem; border: 1px solid oklch(0.85 0 0); }
      .title { font-weight: 600; }
    }
  }
  @supports not at-rule(@scope) {
    .card > .title { font-weight: 600; }
    .card { padding: 1rem; border: 1px solid oklch(0.85 0 0); }
  }
}
```

The component lives inside the `components` layer for cascade-layer ordering, AND uses `@scope` inside for proximity-based donut isolation. Gate per [[frontend-core-web-standards-baseline]].

## Example 11 : Nested `@layer` with dotted-name addition

```css
@layer framework {
  @layer layout, components;
}

@layer framework.layout {
  .grid { display: grid; gap: 1rem; }
}

@layer framework.components {
  .card { padding: 1rem; }
}
```

The dotted name `framework.layout` references the nested layer.

## Example 12 : `@import` with anonymous layer (one-off isolation)

```css
@import "third-party-vendor.css" layer;
```

The imported stylesheet ends up in a unique anonymous layer that cannot be re-opened. Useful for COMPLETE isolation of a third-party CSS blob whose rules MUST NOT escape into your authored layers.

## Example 13 : NEVER : `@layer` inside `@media`

```css
/* WRONG : layer registration happens, but layer order does not propagate */
@media (min-width: 768px) {
  @layer extras {
    .x { ... }
  }
}
```

`@layer` MUST be declared at the top level of the stylesheet (or top level of an `@import`). Nested-in-media-query layer-name registration leads to surprising ordering. Move `@layer extras;` to the top-level statement and write the rules inside the layer block at the top level too :

```css
/* RIGHT */
@layer base, extras;

@layer extras {
  @media (min-width: 768px) {
    .x { ... }
  }
}
```

## Example 14 : `@scope` does NOT block inherited custom properties

```css
:root { --accent: oklch(0.68 0.18 250); }

@scope (.card) to (.card .actions) {
  /* .title inside .card uses --accent inherited from :root, NOT scoped */
  .title { color: var(--accent); }
}
```

If you need to block inheritance across the scope limit, set the property explicitly inside the scope :

```css
@scope (.card) {
  :scope { --accent: oklch(0.5 0.2 30); }
}
```

The inner `--accent` shadows the outer one only within the scope-root subtree, not the donut donut-hole.
