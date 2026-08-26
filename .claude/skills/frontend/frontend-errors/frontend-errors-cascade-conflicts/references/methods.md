# Methods : cascade conflict diagnosis

Sources : [MDN: Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) (verified 2026-05-19), [MDN: Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) (verified 2026-05-19), [MDN: !important](https://developer.mozilla.org/en-US/docs/Web/CSS/important) (verified 2026-05-19), [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19).

## 1. Cascade algorithm (full)

The cascade picks the winning declaration by applying these steps in order. Each step partitions the candidates ; the first step that narrows to a single winner decides.

| # | Step | Decides if |
|---|------|------------|
| 1 | Relevance | Selector matches AND media context matches. |
| 2 | Origin + Importance | Different origin (UA / user / author / transition / animation) or different importance flag. |
| 3 | Layers | Within the same origin + importance, layer order applies. |
| 4 | Specificity | Within the same layer, higher specificity wins. |
| 5 | Scoping Proximity | `@scope` rules : closest scope root wins, overriding source order. |
| 6 | Source Order | Later declaration wins. |

## 2. Origin + Importance (the 8-step ladder)

Per [MDN: Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) (verified 2026-05-19). Low to high :

| Rank | Origin / kind | Notes |
|------|---------------|-------|
| 1 | user-agent normal | Browser default styles. |
| 2 | user normal | User stylesheet (rare). |
| 3 | author normal | Your CSS, normal declarations. |
| 4 | CSS keyframe animations | Active animations. |
| 5 | author `!important` | Your CSS, `!important` declarations. |
| 6 | user `!important` | User stylesheet `!important`. |
| 7 | user-agent `!important` | Browser `!important` rules (e.g. some accessibility defaults). |
| 8 | CSS transitions | Active transitions override even `!important`. |

KEY INSIGHT : `!important` REVERSES origin order. A user `!important` beats an author `!important`. This is how accessibility user stylesheets (high-contrast, large-text) defeat author code.

## 3. Specificity calculation

Three-column value `A-B-C` :

| Column | Adds 1 per | Examples |
|--------|------------|----------|
| A (ID) | ID selector | `#app` |
| B (CLASS) | class, attribute selector, pseudo-class | `.btn`, `[data-x]`, `[type="radio"]`, `:hover`, `:nth-of-type(3n)`, `:focus-within` |
| C (TYPE) | type selector, pseudo-element | `p`, `h1`, `::before`, `::placeholder`, `::marker` |
| (0-0-0) | universal, `:where(...)` | `*`, `:where(.a, #b)` |

Comparison : LEFT-MOST column with a difference decides. `0-2-0` beats `0-1-99` ; `1-0-0` beats `0-99-99`.

Inline `style` attribute : treated as a tier above all selectors but BELOW any `!important`. Effectively `1-0-0-0` if you imagine a fourth column.

`!important` is NOT part of specificity ; it elevates the declaration to a different importance tier (see ladder above).

## 4. Specificity rules for compound pseudo-classes

| Pseudo | Rule |
|--------|------|
| `:where(<selector-list>)` | Contributes 0-0-0. Arguments do NOT add weight. |
| `:is(<selector-list>)` | Contributes the HIGHEST specificity among its arguments. |
| `:not(<selector-list>)` | Contributes the HIGHEST specificity among its arguments. |
| `:has(<selector-list>)` | Contributes the HIGHEST specificity among its arguments. |
| `:nth-child(n of <selector-list>)` | Adds 0-1-0 for the pseudo PLUS the highest specificity in the optional `of <selector-list>`. |

Examples :

- `:where(.a, #b)` -> 0-0-0
- `:is(.a, #b)` -> 1-0-0 (the `#b` wins)
- `:not(.a, #b)` -> 1-0-0
- `:where(:not(#a))` -> 0-0-0 (outer `:where` zeros everything)

## 5. Layer order rules

Per [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19).

### 5.1 Normal declarations (author origin)

Lowest -> highest precedence :

1. First-declared layer.
2. Second-declared layer.
3. ... (further layers)
4. Last-declared layer.
5. UNLAYERED styles. <- HIGHEST for normal.

So an unlayered author rule defeats any layered author rule for normal declarations regardless of specificity inside the layer.

### 5.2 `!important` declarations (author origin)

REVERSED. Lowest -> highest :

1. UNLAYERED `!important`. <- LOWEST for !important.
2. Last-declared layer `!important`.
3. ... (further layers, reversed)
4. Second-declared layer `!important`.
5. First-declared layer `!important`. <- HIGHEST for !important.

The first layer wins for `!important`. This lets a base reset layer authoritatively `!important` certain properties without being overridden by later-declared component layers.

### 5.3 Nested layers

```css
@layer framework {
  @layer layout {
    /* inner-most layer "framework.layout" */
  }
}

/* Append rules later */
@layer framework.layout {
  /* added to the inner layer */
}
```

Nested layers form a tree ; ordering rules apply at each nesting level. A rule in `framework.layout` is compared first against other `framework.*` layers, then against the order of `framework` itself within the parent context.

## 6. `@scope` proximity

Per the W3C CSS Cascade & Scoping module. When two `@scope` rules match the same element, the rule whose scope ROOT is fewer DOM hops away wins. This step happens BETWEEN specificity (step 4) and source order (step 6) ; proximity overrides source order, NOT specificity or layer.

```css
@scope (.outer)  { .item { color: red; } }
@scope (.outer .inner) { .item { color: blue; } }
```

For an `.item` inside both `.outer` and `.outer .inner`, the BLUE rule wins because `.inner` is closer.

NOTE : proximity does NOT override importance or layer. A higher-layer rule still wins regardless of how deep its scope is.

## 7. Cascade-control keywords

Per [MDN: Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) (verified 2026-05-19) :

| Keyword | Effect |
|---------|--------|
| `inherit` | Use the parent element's computed value of this property. |
| `initial` | Use the property's spec-defined initial value (e.g. `color: initial` is usually black ; `display: initial` is `inline`). |
| `unset` | If the property is inherited, behave as `inherit` ; otherwise behave as `initial`. |
| `revert` | Use the value that would have applied if there were no author rules ; rolls back to user, then user-agent origin. |
| `revert-layer` | Use the value that would have applied without the CURRENT cascade layer ; rolls back to the previous layer's computed value. |
| `all: revert` (shorthand) | Reset every property at once to the user-agent value. |

`revert-layer` is the precise tool for "let the rule below this layer win" within a multi-layer system.

## 8. DevTools workflow (Chrome)

1. Inspect Element on the misbehaving element.
2. Open the Styles panel. Rules are sorted in cascade order ; winning declarations at top.
3. A struck-through declaration lost the cascade ; the rule directly above won.
4. The `:property` badge next to a rule indicates which cascade layer it lives in. Absence of a badge means UNLAYERED.
5. The Computed tab shows the final value and an expandable chain of all candidate rules that contributed.
6. The "Toggle Element State" tool (the `:hov` button) forces pseudo-classes (`:hover`, `:focus`, `:focus-within`, `:focus-visible`, `:active`, `:visited`, `:target`) so you can debug state-specific cascade.
7. The "Cascade Layers" panel (depending on Chrome version) lists all defined layers and their order.
8. Right-click a rule -> "Copy as Sass" / "Copy rule" preserves selector + declarations for moving between files.

## 9. Mental model for cascade debugging

Always answer in this order :

```
Origin?   author > user > user-agent (normal)
          user-agent > user > author (important; reversed)
Layer?    unlayered > later-layer > earlier-layer (normal)
          earlier-layer > later-layer > unlayered (important; reversed)
Specificity?  ID > class+attr+pseudo-class > type ; left-most-different-column wins
Proximity?    @scope only ; closest scope root wins ; overrides source order
Source?       later wins ; tie-break.
```

If multiple rules survive all earlier steps, source order is the final tie-break.

## 10. Inversion summary (the 3 surprises)

| What inverts under `!important` | How |
|---------------------------------|-----|
| Origin order | author normal > user normal > UA normal ; but UA `!important` > user `!important` > author `!important`. |
| Layer order | Later layer > earlier layer (normal) ; earlier layer > later layer (important). |
| Unlayered vs layered | Unlayered > layered (normal) ; layered `!important` > unlayered `!important`. |

These three inversions explain almost every "but my `!important` should win" surprise.
