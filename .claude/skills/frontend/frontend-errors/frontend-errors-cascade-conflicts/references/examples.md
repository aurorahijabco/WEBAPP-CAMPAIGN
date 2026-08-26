# Examples : cascade conflict diagnosis

Sources : [MDN: Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) (verified 2026-05-19), [MDN: Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) (verified 2026-05-19), [MDN: !important](https://developer.mozilla.org/en-US/docs/Web/CSS/important) (verified 2026-05-19), [MDN: @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19).

## Example 1 : unlayered beats layered (normal)

```css
@layer components {
  .btn { background: red; }     /* normal, in 'components' layer */
}

.btn { background: green; }      /* normal, UNLAYERED */
```

Winner : `green`. Per the layer ladder, unlayered author normal beats any layered author normal regardless of declaration order or specificity inside the layer.

To fix : either move the green rule INTO a layer that comes after `components`, or move the red rule out of the layer.

## Example 2 : `!important` inversion : earlier layer wins

```css
@layer reset, components, utilities;

@layer reset      { .btn { background: #ccc !important; } }   /* WINS */
@layer components { .btn { background: red !important; } }
@layer utilities  { .btn { background: blue !important; } }
```

Winner : `#ccc`. Per the layer REVERSAL for `!important`, the FIRST-declared layer wins.

For NORMAL declarations of the same rules, `blue` would win (later layer). The `!important` inverts.

## Example 3 : unlayered `!important` is the LOSER

```css
@layer components { .btn { color: red !important; } }   /* WINS */

.btn { color: blue !important; }                         /* loses, unlayered */
```

Winner : `red`. For `!important`, unlayered is at the BOTTOM of the layer ladder. The layered `!important` beats it.

Counter-intuitive : the unlayered rule wins for NORMAL declarations (Example 1) but LOSES for `!important`.

## Example 4 : specificity tie broken by source order

```css
.btn.primary { color: red; }    /* 0-2-0 */
.btn.primary { color: blue; }   /* 0-2-0 */
```

Winner : `blue`. Equal specificity ; later wins.

## Example 5 : `:is()` adopts highest argument specificity

```css
:is(.a, #b) { color: red; }   /* 1-0-0 because of #b */
.a          { color: blue; }   /* 0-1-0 */
```

Winner for an element matching `.a` : `red`. The `:is(.a, #b)` is computed as 1-0-0 (the `#b` wins), and 1-0-0 beats 0-1-0.

To get the opposite behaviour (zero-specificity grouping), use `:where`.

```css
:where(.a, #b) { color: red; }  /* 0-0-0 */
.a             { color: blue; }  /* 0-1-0 */
```

Winner : `blue`. `:where` contributes 0-0-0, so the `.a` rule wins.

## Example 6 : `:where()` ZEROS its compound

```css
:where(#sidebar) .menu .item { color: red; }   /* 0-2-0 */
#sidebar .menu .item         { color: blue; }   /* 1-2-0 */
```

Winner for `.item` inside `#sidebar .menu` : `blue` (1-2-0 > 0-2-0).

`:where(#sidebar)` zeros the contribution of `#sidebar`, leaving `.menu .item` (0-2-0).

## Example 7 : ID-specificity trap

```css
#hero { color: red; }            /* 1-0-0 */
.hero { color: blue; }           /* 0-1-0 ; loses */
.hero.large { color: green; }    /* 0-2-0 ; still loses */
```

Winner : `red`. No combination of classes can beat an ID without escalating to another ID or `!important`.

To fix : replace `#hero` with `[data-hero]` (0-1-0) or wrap it in `:where(#hero)` (0-0-0).

## Example 8 : DevTools workflow walkthrough

Scenario : `.card .header h3` should be blue but renders red.

1. Inspect Element on the `h3`.
2. Open Styles panel.
3. The top rule is `.card .header h3 { color: blue; }` (your rule). Below it is a struck-through `.card h3 { color: red; }`. ALREADY WINNING. Move on.
4. If the struck-through line is below ANOTHER red rule that is NOT struck through, that other rule is the winner. Read its selector. If it includes an ID, recognise the 1-0-0 trap.
5. Check the layer badge. If your blue rule is in `components` and the red rule is unlayered, the unlayered red wins for normal declarations. Move red into a layer or move blue out.
6. Switch to Computed tab. Click `color`. Inspect the chain of declarations. The bottom-most non-struck declaration is the active value.

## Example 9 : reducing specificity with `:where()` audit

Before :

```css
#app .panel .header h2 { font-size: 1.5rem; }  /* 1-2-1 */
.heading-large         { font-size: 1.5rem; }   /* 0-1-0 */
```

The `.heading-large` utility class cannot override the deep selector. Fix :

```css
:where(#app .panel .header) h2 { font-size: 1.5rem; }  /* 0-0-1 */
.heading-large                 { font-size: 1.5rem; }   /* 0-1-0 */
```

Now `.heading-large` (0-1-0) wins because the deep selector is 0-0-1.

## Example 10 : layer order that resists drift

```css
@layer reset, vendor, base, theme, components, utilities;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
}

@import url("vendor/normalize.css") layer(vendor);

@layer base {
  body { font-family: system-ui; }
}

@layer theme {
  :root { --color-action: oklch(0.62 0.18 250); }
}

@layer components {
  .btn { background: var(--color-action); color: white; }
}

@layer utilities {
  .visually-hidden { position: absolute !important; clip: rect(0 0 0 0); }
}
```

Every author rule lives in a named layer. No rule is unlayered. The cascade is predictable :

- A normal rule in `utilities` beats a normal rule in `components`, which beats normal in `theme`, etc.
- An `!important` rule in `reset` (or `vendor`) beats `!important` in `utilities` (REVERSED).
- A new contributor adding an unlayered rule would silently override everything ; CI lint catches it.

## Example 11 : `@scope` proximity overrides source order

```css
@scope (.outer)        { .item { color: red; } }
@scope (.outer .inner) { .item { color: blue; } }
```

For `.item` inside `.outer .inner`, the closer scope (`.outer .inner`) wins. The BLUE rule wins even though the RED rule was declared first.

## Example 12 : `revert-layer` to escape a vendor override

Use case : vendor CSS in a `vendor` layer sets `.btn { padding: 0.5rem; }`. Your design wants the user-agent button default.

```css
@layer vendor { .btn { padding: 0.5rem; } }
@layer components {
  .btn--bare { padding: revert-layer; }
}
```

A `.btn.btn--bare` rolls back to the value before the `components` layer, which is the `vendor` layer's value (0.5rem). To roll back to the user-agent default, use `revert` (not `revert-layer`).

## Example 13 : refactoring an `!important` chain

Before :

```css
.toolbar .btn { background: blue !important; }
.toolbar .btn.large { background: green !important; }
#modal .toolbar .btn { background: red !important; }
.danger { background: orange !important; }
```

After :

```css
@layer base, components, utilities;

@layer components {
  .toolbar .btn         { background: blue; }
  .toolbar .btn.large   { background: green; }
}

@layer utilities {
  .danger { background: orange; }
}

@layer components {
  #modal .toolbar .btn { background: red; }   /* 1-2-1 */
}
```

Layer order does most of the work. No `!important` is needed. The `.danger` utility wins (later layer) ; the `#modal` rule wins among components (highest specificity).

## Example 14 : the "removing a class" trap

```css
.card           { background: white; }
.card.bordered  { background: white; border: 1px solid #ccc; }
.card.flat      { background: gray; }
```

If a card has both `.bordered` and `.flat` and you remove `.bordered`, you expect the background to stay white. But the `.flat` rule (0-2-0) and the `.card.bordered` rule (0-2-0) tie on specificity ; source order decides.

The cascade truth : declared later wins. The author MUST be aware that toggling classes does NOT toggle the rules' positions in the stylesheet. If `.flat` is declared LATER, removing `.bordered` reveals `.flat`'s gray background.

To diagnose : open DevTools, toggle the `.bordered` class on the element, watch the cascade decision change in the Styles panel.
