# Anti-patterns : `:has()` selector

Each entry follows the structure : Symptom : Root cause : Fix.

## 1. `body:has(...)` global performance killer

Symptom : Input lag during scroll and drag. Animation drops frames. DevTools Performance panel shows "Recalculate Style" spikes on every keystroke or pointer move. The issue worsens as the page grows.

Root cause : The browser maintains a reverse-tracking table for every `:has()` rule : for each potential anchor, what changes in its subtree could change the match. When the anchor is `body`, the ENTIRE document is the relevant subtree. Every DOM mutation, every attribute change, every focus/hover/checked state shift may invalidate the cache. Browser optimizations help but cannot fully eliminate the cost.

Fix : NEVER anchor `:has()` on `body`, `html`, `:root`, or the universal selector `*`. ALWAYS anchor on the smallest reasonable component subtree. If the desired effect is genuinely page-wide (e.g. "any open modal dims the background"), use a dedicated class set by JS on `<html>` instead of `body:has(.modal-open)`. Per [MDN : :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) (verified 2026-05-19), the documented best practice is "Don't anchor to elements with too many children".

## 2. Pseudo-element inside or as anchor of `:has()`

Symptom : The rule does nothing. DevTools shows the rule grayed out, marked invalid. Authors believe `:has()` is broken on the browser.

Root cause : Per spec, pseudo-elements are NOT valid inside `:has()` and CANNOT be used as the anchor. Pseudo-elements exist conditionally based on the styling of their originating element, which would create a cyclic matching dependency.

Fix : Target the originating element directly. Instead of `div:has(::before)`, add a class to the elements you intended to generate a `::before` on, and match `div:has(.has-icon)`. For `::marker`, `::placeholder`, etc., similar restructuring applies.

## 3. Nested `:has()` inside `:has()`

Symptom : Rule does nothing; parser silently drops it (or, in some implementations, the rule itself is invalid).

Root cause : Per spec, `:has(...)` MUST NOT contain another `:has(...)`. The reverse-tracking machinery would become quadratic in the worst case, and the spec authors deliberately closed that door.

Fix : Restructure the markup so the relationship is expressible without nesting; OR compose with chained `:has()` at the same anchor : `.a:has(.b):has(.c)`. The chained form means "anchor `.a` contains a `.b` somewhere AND contains a `.c` somewhere", which is often what was wanted.

## 4. Forgetting that `:has()` does NOT match the anchor against itself

Symptom : `.card:has(.card)` is expected to highlight every card that nests another card AND the inner card. In practice, only the outer card is highlighted.

Root cause : The relative selector list inside `:has()` is evaluated against the anchor's DESCENDANTS / SIBLINGS, not the anchor itself. The anchor is excluded from the match.

Fix : If you need both inner and outer to be styled, write two rules. Or use a wrapper class that you apply to the inner one when it nests. Read [MDN : :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) (verified 2026-05-19) and re-check that your mental model matches the spec.

## 5. Using `:has(:focus)` where `:focus-within` would do

Symptom : Code passes review but is slower than expected on a focus-heavy form. Lighthouse shows extra style recalcs.

Root cause : `:focus-within` exists precisely for the "an element has a focused descendant" pattern and has been Widely Available since 2019. It is implemented with a simpler ancestor-pointer mechanism than the general `:has()` machinery. Using `:has(:focus)` works, but pays the relational-selector cost for a problem the platform already solved.

Fix : Use `:focus-within` for the focused-descendant case. Reserve `:has()` for cases the platform does not already provide a single-purpose pseudo-class for.

## 6. Relying on the outer `:has(...)` rule being "forgiven"

Symptom : Site looks fine in modern browsers but the WHOLE style rule is dropped on older user-agents; layout collapses.

Root cause : The FORGIVING behavior applies only to the INNER selector list of `:has()`. The outer rule containing the `:has(...)` is NOT forgiven : if the browser does not implement `:has()` at all, the entire rule is invalid.

Fix : Wrap the outer in `:is()` or `:where()` for forgiveness : `:is(h1:has(+ h2), h1) { ... }`. OR use `@supports selector(:has(*))` to gate, and provide an unconditional fallback rule outside the gate.

## 7. Anchoring on an unbounded element selector

Symptom : Performance worse than expected; `div:has(...)` rule applied to a page with many `<div>` elements still drags.

Root cause : Even when the inner subtree is bounded, an unbounded ANCHOR selector means the engine has many potential anchors to track. `div:has(.x)` causes every `<div>` to participate in the reverse-tracking table.

Fix : Tighten the anchor with a class : `.panel:has(.x)` instead of `div:has(.x)`. The semantic name also makes the rule more maintainable.

## 8. Specificity climb from `#id` inside `:has()`

Symptom : A `:has()` rule unexpectedly wins over rules written with classes; layered cascade discipline appears broken.

Root cause : `:has()` adopts the specificity of the HIGHEST specificity selector inside. If the inner contains `#hero`, the entire `:has()` rule has ID-level specificity (1, ...) even when the anchor was a simple class.

Fix : Avoid `#id` selectors inside `:has()` unless intentional. If unavoidable, place the rule in an explicit cascade layer per `[[frontend-syntax-css-cascade-layers-scope]]` so layer order, not specificity, settles ties.
