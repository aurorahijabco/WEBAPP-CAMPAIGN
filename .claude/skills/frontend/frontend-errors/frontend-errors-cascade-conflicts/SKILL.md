---
name: frontend-errors-cascade-conflicts
description: >
  Use when a CSS rule that should clearly win does not (style not applying despite higher specificity), when `!important` is being escalated as a fix-everything hammer (you are about to lose a specificity war by joining it), when an unlayered author rule mysteriously beats a layered author rule (unlayered ALWAYS wins for normal declarations regardless of specificity), when a layer order seems "inverted" for `!important` declarations (it IS inverted; earlier layers win for important), when an `@scope`-anchored rule beats a deeper-DOM normal rule (scoping proximity overrides source order), when DevTools shows a rule struck through with no obvious reason, when `:where(.a, .b)` "loses" its specificity, when `:is(.a, #b)` "wins" too aggressively, when an ID selector creates a 1-0-0 specificity trap that nothing else can override, or when removing a class makes a different rule appear (cascade order, not the class, was the deciding factor).
  Prevents `!important` chains used to win specificity battles (they only escalate), mixing unlayered and layered CSS expecting source order to decide (unlayered wins for normal regardless), assuming `!important` follows the same layer order as normal (it is REVERSED; earlier layer wins for important), using `:where(:not(.exclude)) .selector` and being surprised by zero specificity on the whole compound (`:where` zeros its argument and everything inside), using `:is(.a, .b#id)` and being surprised the rule wins everywhere (`:is` adopts the HIGHEST specificity of its arguments, the ID in this case), shipping ID-based styling (`#foo { ... }`) and discovering nothing else short of `!important` overrides it, inline-style overrides scattered across components creating untrackable computed-value lookups, expecting an `@scope` rule with deep DOM proximity to lose to a deeper DOM normal rule (scope proximity overrides source order), and removing a class hoping a rule "goes away" when in fact a lower-specificity but later rule was always the deciding factor.
  Covers the full cascade sort order (Relevance, Origin + Importance, Layers, Specificity, Scoping Proximity, Source Order), the specificity calculation (ID column 1-0-0, CLASS/attr/pseudo-class column 0-1-0, TYPE/pseudo-element column 0-0-1; inline acts as a higher tier but is overridden by `!important`), the `:where()` zero-specificity rule and the `:is()` adopt-highest rule, the `:not()` inheritance rule (takes argument specificity), the layer order rules for NORMAL declarations (unlayered > later-declared > earlier-declared) and the REVERSED rules for `!important` (earlier-declared layer > later-declared layer > unlayered), the user-agent / user / author origin order (and its `!important` inversion that lets a user `!important` override author `!important`), the `@scope` proximity rule (closest scope root wins; overrides source order), the four cascade-control keywords `inherit` / `initial` / `unset` / `revert` plus the layer-aware `revert-layer`, and the DevTools workflow for diagnosing cascade conflicts (Styles panel struck-through rules, Computed tab, Cascade Layers indicator).
  Keywords: cascade conflicts, cascade sort order, CSS specificity, specificity calculation, ID specificity, class specificity, type specificity, inline style override, important keyword, important inversion, important reversal, important and layers, layer order, layered vs unlayered, unlayered wins, cascade origin, user-agent origin, user origin, author origin, at-layer, at-scope, scope proximity, scoping proximity, where pseudo-class, is pseudo-class, not pseudo-class, has pseudo-class specificity, source order, declared order, inherit keyword, initial keyword, unset keyword, revert keyword, revert-layer keyword, DevTools Styles panel, DevTools Computed tab, struck-through rule, Cascade Layers indicator, style not applying, my CSS does not override, important not winning, computed wrong color, layer not winning, specificity war, important everywhere, rule not applying, computed style wrong, how do I fix CSS overriding, why is my CSS ignored, when to use important, debug CSS cascade, how to undo important, how to lower specificity, how to debug CSS, how to use layers to control overrides.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Errors Cascade Conflicts

This skill diagnoses and fixes cascade conflicts in CSS : "why is my rule not winning". It assumes familiarity with `@layer` and `@scope` syntax (covered by `[[frontend-syntax-css-cascade-layers-scope]]`) and focuses on the decision tree, the inversions that surprise authors, and the DevTools workflow.

Sources : [MDN: Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) (verified 2026-05-19), [MDN: Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) (verified 2026-05-19), [MDN: !important](https://developer.mozilla.org/en-US/docs/Web/CSS/important) (verified 2026-05-19), [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19).

## Quick Reference

### Cascade sort order (FULL chain)

Apply these in order; the first DIFFERENCE decides the winner :

1. **Relevance**. Filter to rules whose selector matches AND whose media context matches.
2. **Origin + Importance**. See the 8-step ladder below.
3. **Layers**. Layer order within the same origin + importance.
4. **Specificity**. Higher wins.
5. **Scoping Proximity**. For `@scope` rules, the closest scope root wins.
6. **Order of Appearance**. Later declaration wins.

### Origin + Importance ladder (low to high)

Per [MDN: Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) (verified 2026-05-19) :

| Rank | Origin | Importance |
|------|--------|------------|
| 1 (lowest) | user-agent | normal |
| 2 | user | normal |
| 3 | author | normal |
| 4 | CSS keyframe animations | n/a |
| 5 | author | `!important` |
| 6 | user | `!important` |
| 7 | user-agent | `!important` |
| 8 (highest) | CSS transitions | n/a |

KEY INSIGHT : `!important` REVERSES origin order, so a user `!important` beats an author `!important`. This is how user stylesheets for accessibility (high-contrast, large-text) win against author code.

### Layer order for NORMAL author declarations

Per [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19), within the author origin, normal :

| Rank | Source |
|------|--------|
| 1 (lowest) | First-declared layer |
| 2 | Second-declared layer |
| ... | ... |
| N | Last-declared layer |
| N+1 (highest) | Unlayered styles |

UNLAYERED ALWAYS WINS for normal declarations. Mixing unlayered and layered CSS by accident is the #1 source of "my rule does not override" bugs.

### Layer order for `!important` author declarations (REVERSED)

| Rank | Source |
|------|--------|
| 1 (lowest) | Unlayered `!important` |
| 2 | Last-declared layer `!important` |
| ... | ... |
| N-1 | Second-declared layer `!important` |
| N (highest) | First-declared layer `!important` |

REVERSAL : `!important` in the FIRST layer wins. This lets a base reset layer win the `!important` race even though it loses the NORMAL race.

### Specificity ladder

Per [MDN: Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) (verified 2026-05-19). Three columns ; left-to-right comparison ; first column with a difference wins.

| Column | Counts | Examples |
|--------|--------|----------|
| ID (1-0-0) | ID selectors | `#hero` |
| CLASS (0-1-0) | class, attribute, pseudo-class | `.btn`, `[type="radio"]`, `:hover`, `:nth-of-type(3n)` |
| TYPE (0-0-1) | type, pseudo-element | `p`, `h1`, `::before`, `::placeholder` |
| (0-0-0) | universal, `:where()` | `*`, `:where(...)` |

Inline style attribute acts as a higher tier (overrides all selectors) but is itself overridden by any `!important` from any selector.

### The four pseudo-class rules

| Pseudo | Specificity contribution |
|--------|--------------------------|
| `:where(<list>)` | Always 0-0-0. The arguments DO NOT add weight. |
| `:is(<list>)` | The HIGHEST specificity among the arguments. |
| `:not(<list>)` | The HIGHEST specificity among the arguments. |
| `:has(<list>)` | The HIGHEST specificity among the arguments. |

These rules are the source of two common surprises : `:where(.a #b)` is 0-0-0 (the inner `#b` does NOT contribute) ; `:is(.a, #b)` is 1-0-0 (the `#b` wins).

### Cascade-control keywords

| Keyword | Effect |
|---------|--------|
| `inherit` | Take the parent's computed value. |
| `initial` | Reset to the property's spec-defined initial value (often NOT what you visually expect; e.g. `color: initial` is usually black). |
| `unset` | Act as `inherit` if inherited, otherwise `initial`. |
| `revert` | Roll back to the cascaded value from the previous origin (user-agent, typically). |
| `revert-layer` | Roll back to the cascaded value from the previous layer. |

## Decision Trees

### Decision : "Why is my rule not winning?"

Run through this in order ; STOP at the first difference :

```
1. Does the selector actually match the element in this state?
   -> Open DevTools, inspect the element. If your rule is NOT
      in the Styles panel at all, the selector is wrong.

2. Is a higher-origin or higher-importance rule winning?
   -> A user-agent !important or a user !important beats your
      author rule (rare, but check). DevTools shows origin.

3. Is your rule unlayered while the rule overriding it is unlayered too?
   -> If both unlayered, this step does not decide. Continue.
   -> If yours is layered and the OTHER is unlayered, the OTHER wins
      for normal declarations. Move your rule to unlayered OR move
      the other into a layer above yours.

4. Layers : is the winning rule in a LATER-declared layer (for normal)
   or an EARLIER-declared layer (for !important)?
   -> Reorder the @layer declarations OR move your rule to the
      winning layer.

5. Specificity : higher wins.
   -> Compare the three-column specificity. If yours is lower,
      wrap the conflicting rule in :where() to ZERO its
      specificity OR add a matching higher-specificity selector.

6. Scoping proximity (@scope only) : the closest scope-root wins.
   -> If both are inside @scope, the one whose root is fewer DOM
      hops away wins. This overrides source order.

7. Source order : later declaration wins.
   -> Move your rule to AFTER the conflicting rule, or refactor
      so both are in the same layer at the right order.
```

### Decision : "How do I undo a specificity war?"

```
Symptom : the codebase has !important everywhere AND ID selectors
AND nested-class chains. New rules require !important to win.

Step 1 : Stop adding !important. It is a symptom; adding more
         makes the problem worse.

Step 2 : Wrap the offending selectors in :where(...) to ZERO their
         specificity. For example,
           #sidebar .menu .item { ... }
         becomes
           :where(#sidebar) .menu .item { ... }   /* now 0-1-1 */

Step 3 : Move the high-specificity rules into an EARLIER cascade
         layer. Then any author code in a LATER layer wins for
         normal declarations regardless of specificity inside the
         earlier layer.

Step 4 : Audit and remove ID selectors. Replace with class or
         data-attribute selectors :
           #sidebar   ->  [data-region="sidebar"]   /* 0-1-0 */

Step 5 : Move ALL author CSS into named layers. Unlayered CSS
         beats layered, so any straggler unlayered rule will
         silently win. Layering everything makes the cascade
         predictable.
```

### Decision : "When is `!important` acceptable?"

```
Almost never. The genuinely acceptable cases :

  Utility-class layer in a design system that INTENTIONALLY
  beats component rules. Tailwind-style "u-text-center" classes
  living in a `utilities` layer with !important declarations
  ensure they always override components, no matter what.
    -> Acceptable. Document the contract.

  Print stylesheet overrides that MUST defeat all screen styles.
    -> Acceptable when truly necessary.

  Third-party CSS injected outside your control that you cannot
  refactor.
    -> Last resort. Better: put the third-party in an EARLIER
       cascade layer so your code wins via layer order.

  Everywhere else : NEVER. !important is a sign that layering
  discipline is missing.
```

## Patterns

### Pattern 1 : DevTools workflow for diagnosing a cascade conflict

1. In Chrome DevTools, select the element with Elements -> click.
2. Open the Styles panel.
3. Read top-down ; rules are sorted in cascade order (winning rules at top).
4. A struck-through declaration means it lost the cascade ; the rule on the line ABOVE won.
5. Hover over the rule to see which file and line declared it.
6. Click the small badge "Layer : <name>" next to the rule to see its layer assignment ; an absent badge means unlayered.
7. Switch to the Computed tab to see the final value AND the chain of declarations that produced it (click a property to expand).
8. If the rule is missing entirely, the selector did not match : double-check the element's classes and the selector syntax.

### Pattern 2 : Lower specificity by wrapping in `:where()`

```css
/* Before : 1-2-1 */
#app .panel .header h2 { font-size: 1.5rem; }

/* After : 0-2-1 */
:where(#app) .panel .header h2 { font-size: 1.5rem; }

/* After (stronger) : 0-0-1 */
:where(#app .panel .header) h2 { font-size: 1.5rem; }
```

`:where(...)` contributes 0-0-0 and zeros everything inside. Use it on framework / scaffold selectors that the design system should override.

### Pattern 3 : Layer order that resists author drift

```css
/* Declare ALL layers up front so order is fixed */
@layer reset, vendor, base, theme, components, utilities;

@layer reset { /* CSS reset */ }
@layer vendor { /* Third-party CSS imported into the vendor layer */ }
@layer base { /* design-system base */ }
@layer theme { /* tokens */ }
@layer components { /* component styles */ }
@layer utilities { /* utility classes (intentionally win via !important if needed) */ }
```

Every project rule MUST live in one of these layers ; nothing unlayered. Unlayered author CSS would silently beat everything.

### Pattern 4 : Importing third-party into a layer

```css
@import url("third-party.css") layer(vendor);
```

The third-party CSS now sits in the `vendor` layer. Your `components` / `utilities` layers (declared AFTER vendor) win for normal declarations regardless of the specificity inside `third-party.css`.

### Pattern 5 : Using `revert-layer` to escape a vendor override

```css
@layer vendor {
  .btn { padding: 1rem; border-radius: 8px; }
}
@layer components {
  .btn { padding: revert-layer; }  /* roll back to vendor's padding value... wait, no */
}
```

`revert-layer` rolls back to the cascaded value from the PREVIOUS LAYER. The above example actually keeps the vendor padding. To roll back to user-agent default, use `revert`. Pattern is most useful inside a heavily-layered system where you want to "undo" a specific layer's contribution.

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md). Eight cataloged : mixing unlayered + layered CSS expecting source order; `!important` chain to win specificity; assuming `!important` follows the same layer order as normal; `:where(:not(.x)) .y` surprise zero specificity; `:is(.a, #b)` surprise ID-level specificity; ID-based styling creating untouchable rules; `@scope` rule expected to lose to deeper-DOM normal rule; removing a class hoping a rule disappears.

## Reference Links

- [Methods and signatures](references/methods.md) : full cascade ladder, specificity examples, layer rules including the `!important` inversion, scope proximity rule, cascade-control keywords.
- [Examples](references/examples.md) : DevTools workflow walkthroughs and code examples for each cascade-conflict resolution pattern.
- [Anti-patterns](references/anti-patterns.md) : eight cataloged anti-patterns with symptom, root cause, and fix.

## Cross-references

- `[[frontend-syntax-css-cascade-layers-scope]]` : `@layer` and `@scope` syntax details.
- `[[frontend-syntax-css-nesting-logical-properties]]` : native nesting specificity rules.
- `[[frontend-syntax-css-has-selector]]` : `:has()` specificity and performance considerations.
