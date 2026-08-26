# Anti-Patterns : cascade conflicts

Each entry : symptom (what the user / developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [MDN: Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) (verified 2026-05-19), [MDN: Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) (verified 2026-05-19), [MDN: !important](https://developer.mozilla.org/en-US/docs/Web/CSS/important) (verified 2026-05-19), [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19).

## Anti-pattern 1 : mixing unlayered + layered CSS expecting source order to win

```css
/* anti-pattern */
@layer components {
  .btn { background: red; }
}

.btn { background: green; }   /* unlayered */
```

Symptom : the unlayered `green` rule wins, even though authors expected the layered `red` rule (declared LATER in the source) to win.

Root cause : per [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19), unlayered author CSS always beats layered author CSS for NORMAL declarations. The layer ladder places unlayered ABOVE every named layer for normal declarations.

Fix : put ALL author CSS into named layers. Declare a manifest of layers up front so the order is fixed and reviewable.

```css
@layer reset, vendor, base, theme, components, utilities;

@layer components {
  .btn { background: red; }
}
@layer utilities {
  .btn { background: green; }   /* utilities is last, so this wins */
}
```

Add a CI lint rule that fails the build on any unlayered rule.

## Anti-pattern 2 : `!important` chain to win a specificity war

```css
/* anti-pattern */
.btn { background: red !important; }
.card .btn { background: blue !important; }
#modal .card .btn { background: green !important; }
.danger { background: orange !important !important; }   /* doesn't even parse */
```

Symptom : every rule needs `!important` to land. Adding a new style requires more `!important`. The override hierarchy is unreadable.

Root cause : the codebase mixes high-specificity selectors (IDs, deep nesting) and tries to defeat them with `!important`. Once `!important` is established as a tool, every subsequent author must use it to win.

Fix : `!important` is a SIGN. Stop adding it. Refactor to cascade layers and lower specificity.

```css
@layer base, components, utilities;

@layer components {
  .btn { background: red; }
  .card .btn { background: blue; }
}

@layer utilities {
  .danger { background: orange; }
}
```

The utilities layer wins for normal declarations because it is declared last. No `!important` is needed.

## Anti-pattern 3 : assuming `!important` follows the same layer order as normal

```css
/* anti-pattern : author assumes "utilities is last so utilities wins" */
@layer base, components, utilities;

@layer base { .btn { color: red !important; } }
@layer utilities { .btn { color: blue !important; } }
```

Symptom : `red` wins, not `blue`. The author shipped `!important` in the utilities layer expecting it to override the base layer's normal rules AND any base-layer `!important`. The base layer wins instead.

Root cause : per [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19), the layer order is REVERSED for `!important`. Earlier-declared layers win.

Fix : either (a) move the rule to a later layer for normal declarations, OR (b) recognise that `!important` in the BASE layer is the highest-priority `!important`. Document the inversion in code comments wherever `!important` is used in a layered system.

```css
/* base.css */
@layer base {
  /* !important here wins over !important in components / utilities */
  .reset { all: revert !important; }
}
```

## Anti-pattern 4 : `:where(:not(.exclude)) .selector` surprised by zero specificity

```css
/* anti-pattern : author wants to apply .selector EXCEPT inside .exclude,
   and expects the resulting compound to retain :not()'s specificity */
:where(:not(.exclude)) .selector { color: red; }   /* 0-1-0 (only .selector) */

.different { color: blue; }                          /* 0-1-0 */
```

Symptom : the `.different` rule wins on equal specificity (source order). Author thought the `:not(.exclude)` would push the compound to 0-2-0.

Root cause : `:where()` contributes 0-0-0 AND zeros everything inside it. `:not(.exclude)` would normally add 0-1-0, but inside `:where()` it contributes nothing.

Fix : pick one. Either use `:not()` outside of `:where()` to keep specificity, OR use `:where()` deliberately to flatten specificity.

```css
/* Option A : keep .not specificity */
:not(.exclude) .selector { color: red; }   /* 0-2-0 */

/* Option B : intentionally flatten */
:where(:not(.exclude)) .selector { color: red; }   /* 0-1-0, by design */
```

Document the choice ; reviewer should see WHY.

## Anti-pattern 5 : `:is(.a, #b)` surprise ID-level specificity

```css
/* anti-pattern */
:is(.a, #b) { color: red; }   /* 1-0-0 because of #b */
.a          { color: blue; }   /* 0-1-0 ; LOSES */
```

Symptom : `.a` elements render red, not blue. Authors expected `:is(.a, #b)` to give "the lower of the two" or "the contextual" specificity.

Root cause : `:is()` adopts the HIGHEST specificity among its arguments. The `#b` inside `:is(.a, #b)` raises the compound to 1-0-0 even when matching via `.a`.

Fix : if zero or low specificity is desired, use `:where(...)` instead. If `:is()` was used to group different selector forms, separate them when their specificities differ.

```css
/* If you wanted "the lower" : use :where */
:where(.a, #b) { color: red; }   /* 0-0-0 */
.a             { color: blue; }   /* 0-1-0 wins */

/* If you wanted both to act independently : split */
.a { color: red; }
#b { color: red; }
```

## Anti-pattern 6 : ID-based styling creating untouchable rules

```css
/* anti-pattern */
#sidebar { background: navy; }
#sidebar .menu .item { padding: 0.5rem; }
```

Symptom : design system class utilities (`.bg-white`, `.p-2`) cannot override `#sidebar` rules. Authors escalate to `!important` to win.

Root cause : ID selectors contribute 1-0-0. Class utilities contribute 0-1-0. No combination of classes can beat an ID without another ID OR `!important`.

Fix : convert IDs to attribute selectors or classes. IDs in HTML remain as anchors / form labels / JS hooks, but CSS targets the attribute, not the ID directly.

```html
<aside id="sidebar" data-region="sidebar"></aside>
```

```css
[data-region="sidebar"] { background: navy; }   /* 0-1-0 */
[data-region="sidebar"] .menu .item { padding: 0.5rem; }   /* 0-3-0 */
```

Alternative if you cannot change HTML : wrap the selector in `:where()` to zero its specificity.

```css
:where(#sidebar) { background: navy; }   /* 0-0-0 */
```

## Anti-pattern 7 : `@scope` rule expected to lose to a deeper-DOM normal rule

```css
/* anti-pattern */
@scope (.outer) {
  .item { color: red; }
}

.deep .nested .item { color: blue; }   /* deeper DOM ; author thought this wins */
```

Symptom : for `.item` inside both `.outer` and `.deep .nested`, the `red` rule wins, not `blue`.

Root cause : per [MDN: Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) (verified 2026-05-19), `@scope` proximity is applied BEFORE source order. The rule whose scope root is closer to the matched element wins, overriding source order at equal specificity.

Fix : if the deeper-DOM rule must win, ALSO scope it (with a closer or equally-close scope), OR raise its specificity, OR move it to a later cascade layer.

```css
@scope (.deep .nested) {
  .item { color: blue; }
}
@scope (.outer) {
  .item { color: red; }
}
```

Now `.deep .nested` is closer than `.outer` for matched items inside both ; blue wins.

## Anti-pattern 8 : removing a class hoping the rule "disappears"

```css
.card           { background: white; }   /* 0-1-0 */
.card.bordered  { background: white; }   /* 0-2-0 */
.card.flat      { background: gray; }    /* 0-2-0 */
```

```html
<div class="card bordered flat">...</div>
```

Symptom : the developer removes `.bordered` thinking the white background will hold. The background flips to gray.

Root cause : `.card.bordered` and `.card.flat` both have 0-2-0 specificity. With the same specificity, source order decides ; `.card.flat` is declared LATER and wins. Removing `.bordered` did NOT cause the flip ; the flip was always there but masked because both rules computed to the same value (`white`).

Fix : align the actual decision with the visual decision. If "bordered" should govern the background, make its rule MORE specific than `.flat` :

```css
.card               { background: white; }
.card.flat          { background: gray; }
.card.bordered      { background: white; border: 1px solid #ccc; }   /* declared LATER */
```

Now removing `.bordered` reliably flips to `.flat`'s gray ; the cascade reflects the intent.

More generally : use DevTools to inspect a SPECIFIC element's computed cascade ; never assume class presence dictates style without tracing the rules.

## Anti-pattern 9 (bonus) : inline `style` attribute overriding all selectors

```html
<!-- anti-pattern -->
<div class="card" style="background: hotpink;">...</div>
```

Symptom : the `style` attribute beats every author rule. Refactoring the CSS file has no effect on this element.

Root cause : inline `style` is treated above selectors in the cascade but below `!important`. Authors who add inline styles defeat the design system.

Fix : never ship hand-written inline styles in production. JS frameworks that update inline styles for runtime values are acceptable when the values are dynamic ; static styling MUST live in stylesheets. If an inline style must be defeated from CSS, the only path is `!important` ; that is the symptom, not the cure.
