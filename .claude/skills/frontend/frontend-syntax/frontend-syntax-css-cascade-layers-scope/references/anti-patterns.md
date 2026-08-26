# Anti-patterns : Cascade Layers and `@scope`

Each entry follows the structure : Symptom : Root cause : Fix.

## 1. Mixing unlayered author CSS with layered author CSS

Symptom : A handful of "stragglers" in the stylesheet keep winning the cascade over carefully-ordered layered rules. Developers reach for `!important` to push the layered rule above; doing so introduces a second bug (see anti-pattern 3).

Root cause : Per [W3C TR : CSS Cascade 5 §6.4](https://www.w3.org/TR/css-cascade-5/) (verified 2026-05-19), unlayered author rules are placed at the END of the layer cascade for normal declarations. They ALWAYS beat layered normal rules. This is by design : it lets authors author one-off overrides after they have committed to a layered architecture.

Fix : Move EVERY author rule into a named layer. Establish the rule "no naked rule blocks" via lint (e.g. stylelint plugin `stylelint-cascade-layers`). Treat ungated unlayered rules in code review as an error.

## 2. `!important` chain instead of layer discipline

Symptom : `grep -c '!important' src/styles | sort -nr` shows the chain grew from 3 to 27 across the last quarter. New `!important` rules are added in response to older `!important` rules; the cascade is now a stack of overrides instead of an ordered cascade.

Root cause : Missing layer discipline. Without `@layer`, the only escape hatch from specificity is `!important`; once one rule uses it, every later override needs to match.

Fix : Declare `@layer reset, base, theme, components, utilities;` at the top of the entry stylesheet. Move all rules into these layers. Delete every `!important` that exists only to win a layered cascade. Keep `!important` only for genuinely urgent overrides (e.g. third-party widget's inline styles, accessibility-critical print rules).

## 3. Assuming `!important` follows the same layer order as normal declarations

Symptom : Authored `@layer utilities { ... !important }` rules are being beaten by `@layer base { ... !important }` rules; commit-author cannot understand why.

Root cause : For `!important` declarations, the cascade layer order REVERSES. First-declared layer wins. Per [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19) : "for `!important` rules the declaration whose cascade layer is first wins". The reversal mirrors the per-origin reversal of importance (user-important beats author-important) and applies the same logic to layers.

Fix : Document the reversal in a top-of-file comment :

```css
/* @layer normal order : reset < base < theme < components < utilities (later wins).
   @layer !important order : REVERSED : reset > base > theme > components > utilities (earlier wins). */
@layer reset, base, theme, components, utilities;
```

Avoid using `!important` inside layers unless absolutely required. If multiple layers must declare important rules, place them in the layer whose REVERSED order matches intent.

## 4. Shipping `@scope` without an `@supports` gate

Symptom : Styles inside `@scope (...)` blocks are silently ignored on browsers that have not yet shipped `@scope`. Page looks broken; QA shows different rendering on browser versions less than 6 months old.

Root cause : `@scope` is Baseline Newly Available since December 2025. Browsers that do not recognize the at-rule discard the entire `@scope { ... }` block. There is no error and no fallback.

Fix : Per [[frontend-core-web-standards-baseline]], gate every `@scope` block with `@supports at-rule(@scope)` (positive branch) AND provide a fallback inside `@supports not at-rule(@scope)`. The fallback uses higher-specificity descendant selectors. Remove the gate when `@scope` reaches Widely Available (around mid-2028).

## 5. Using `:scope` where a bare selector was intended

Symptom : A bare selector inside `@scope` has unexpected specificity, and it beats other rules the author thought were equal-specificity.

Root cause : `:scope` is a pseudo-class with class-level specificity (0,1,0). Inside `@scope`, bare selectors implicitly have `:where(:scope)` prepended, which contributes zero. Adding explicit `:scope` adds (0,1,0). Authors who memorized "you can use `:scope` inside `@scope`" do not always realize the cost.

Fix : Use bare selectors and `&` for zero-specificity scoping. Reach for explicit `:scope` ONLY when targeting the scope-root element itself (e.g. `:scope { background: ... }`) or when class-level specificity is genuinely required.

## 6. Declaring `@layer` inside `@media` expecting the order to persist

Symptom : Layer order behaves inconsistently across breakpoints; rules placed inside `@layer extras { ... }` inside an `@media` block do not appear in the expected cascade position.

Root cause : `@layer` registration (the statement form that fixes order) MUST occur at the top level of the stylesheet or `@import`. At-rule nesting does NOT propagate layer ordering. A `@layer extras { ... }` block inside `@media` ADDS rules to a layer named `extras`, but if `extras` was never registered at the top level, its order is determined by the FIRST `@media` block in which it appeared, which is fragile.

Fix : Declare ALL layer names in a single top-level statement : `@layer reset, base, theme, components, utilities, extras;`. Inside `@media`, only use the block form `@layer extras { ... }` to add rules.

## 7. Forgetting that `@scope` does NOT isolate inheritance

Symptom : A `@scope` block sets `color: red` on the root, expecting the property NOT to leak past the donut limit. Descendants past the limit still show red text.

Root cause : `@scope` limits MATCHING. It does NOT participate in inheritance. Inherited properties (`color`, `font-family`, `line-height`, custom properties) flow through the DOM normally; whatever was applied to an in-scope element continues to inherit to descendants even outside the scope.

Fix : For genuinely scoped inheritance, set the property explicitly on the elements outside the scope to break the inheritance chain. Alternatively, set non-inheriting properties (`background`, `border`, `padding`) inside the scope and avoid scoping inherited properties at all.

## 8. Overscoping : omitting the donut limit when nesting is possible

Symptom : A `@scope (.card)` block styles a nested `.card` inside another `.card` exactly like the outer one, producing visual duplication. The nested card needed its own distinct treatment.

Root cause : Without a `to (<limit>)` clause, `@scope` matches the root AND every descendant indefinitely, including nested instances of the same component.

Fix : ALWAYS use `to (.component-root .component-root)` when the component MAY appear nested inside itself. Example : `@scope (.card) to (.card .card) { ... }` stops the cascade at any nested card; the nested card gets its own `@scope` activation with its own scope-root.
