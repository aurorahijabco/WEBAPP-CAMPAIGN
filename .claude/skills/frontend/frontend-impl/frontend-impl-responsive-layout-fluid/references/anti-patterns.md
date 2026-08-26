# Anti-Patterns : responsive layout + fluid sizing

Each entry : symptom (what the user / developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [MDN: clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (verified 2026-05-19), [MDN: viewport-percentage lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19), [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19), [MDN: aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) (verified 2026-05-19), [MDN: CSS Logical Properties and Values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19).

## Anti-pattern 1 : fixed pixel breakpoints causing content cliffs

```css
/* anti-pattern */
.headline { font-size: 24px; }
@media (max-width: 768px) { .headline { font-size: 18px; } }
@media (max-width: 480px) { .headline { font-size: 16px; } }
```

Symptom : the headline JUMPS between three discrete sizes; in between the jumps the size feels too small or too large for the viewport. Designers add more breakpoints to "smooth out" the steps and the CSS metastasises.

Root cause : the size is a step function of viewport width. There is no continuous relation; every breakpoint is a cliff.

Fix : use `clamp()` for a continuous relation :

```css
.headline { font-size: clamp(1rem, 0.5rem + 2vw, 1.75rem); }
```

The headline now scales smoothly between 1rem at very narrow viewports and 1.75rem at wide viewports, with no cliffs. Reserve media queries for layout topology swaps (sidebar collapse, column reflow), not for type sizes.

## Anti-pattern 2 : `100vh` hero on mobile

```css
/* anti-pattern */
.hero { min-height: 100vh; }
```

Symptom : on iOS Safari and Chrome Android, the hero is taller than the visible viewport when the URL bar is shown; content at the bottom of the hero is hidden behind the URL bar. When the user scrolls and the URL bar retracts, the hero appears to "grow" upward into the newly-revealed space.

Root cause : `100vh` resolves to the LARGE viewport size (URL bar hidden) in modern engines per [MDN: viewport-percentage lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19). When the URL bar is showing, the visible area is smaller; content beyond `100svh` is obscured.

Fix : use `100svh` (small viewport height) for "must-always-be-visible" content :

```css
.hero { min-height: 100svh; }
```

Other variants :

- `100lvh` for "use every pixel including behind chrome" (immersive viewers).
- `100dvh` for "exactly fit the visible viewport in real time" (accept layout shift on scroll).

## Anti-pattern 3 : `clamp()` with `preferred` outside `min`/`max`

```css
/* anti-pattern */
/* At 320px viewport: 0.5rem + 1.5vw = 0.5rem + 0.3rem = 0.8rem */
/* But MIN is 1rem -> font-size locks at 1rem and never moves up */
font-size: clamp(1rem, 0.5rem + 1.5vw, 1.75rem);
```

Symptom : the font size feels stuck at a constant value on small viewports; tweaking the `preferred` expression does nothing.

Root cause : `clamp()` resolves as `max(MIN, min(VAL, MAX))`. If the `preferred` value resolves below `MIN` (or above `MAX`) across the design's target viewport range, the property silently behaves like a constant.

Fix : verify the `preferred` expression at the smallest AND largest target viewport. Adjust the baseline `rem` and the `vw` slope so the value crosses the `MIN` -> `MAX` range gracefully over the design's intended viewport range. Online clamp-builder tools (e.g. utopia.fyi) compute the right baseline and slope from two anchor points.

## Anti-pattern 4 : container query without `container-type` on the parent

```css
/* anti-pattern */
.card { display: grid; grid-template-columns: 1fr; }
@container (min-width: 28rem) { .card { grid-template-columns: 12rem 1fr; } }
```

Symptom : the `@container` rule never fires, even when the card is clearly wider than 28rem.

Root cause : `@container` queries the nearest ancestor with a `container-type`. If no ancestor has one, the query has no target and does not match. Per [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19), `container-type` MUST be on a PARENT of the queried element; setting it on the queried element itself is a self-reference loop.

Fix : wrap or mark the slot :

```css
.card-slot { container-type: inline-size; }
.card { display: grid; grid-template-columns: 1fr; }
@container (min-width: 28rem) { .card { grid-template-columns: 12rem 1fr; } }
```

Or, if the card is already inside a sized container :

```css
.layout-column { container-type: inline-size; }
```

A descendant of `container-type` becomes part of its containment context.

## Anti-pattern 5 : `max-width: 100vw` overflow trap

```css
/* anti-pattern */
.wrapper { max-width: 100vw; }
```

Symptom : on viewports where the scrollbar reserves space (most desktop browsers), `100vw` includes the scrollbar width; setting `max-width: 100vw` produces horizontal overflow equal to the scrollbar width. The page now scrolls horizontally even when content fits.

Root cause : `vw` includes the scrollbar in some browsers; `100%` (of the body / html) does not.

Fix : prefer `100%` for "fit container" and reserve viewport units for "fit viewport" (where the bug is the goal, e.g. a true full-bleed modal) :

```css
.wrapper { max-inline-size: 100%; }
```

For genuinely full-viewport elements, `100dvw` is also fine on mobile because mobile browsers rarely show a vertical scrollbar.

## Anti-pattern 6 : `flex-wrap` without `min-width: 0` on children

```css
/* anti-pattern */
.row { display: flex; gap: 1rem; flex-wrap: wrap; }
.row > .item { flex: 1 1 0; }
```

Symptom : on the row's first render, an item containing a long URL or unbreakable token blows past its `flex: 1 1 0` allocation and overflows the row's bounds. The intended wrap behavior does not save the layout.

Root cause : flex children have a default `min-width: auto` which resolves to `min-content` (the longest unbreakable token). The flex algorithm cannot shrink a child below its `min-content`, so the child enforces its own width.

Fix : reset `min-width` on flex children that contain prose :

```css
.row > .item { flex: 1 1 0; min-inline-size: 0; }
```

Optionally combine with `overflow-wrap: anywhere` on the text so very long unbreakable strings break rather than overflow.

## Anti-pattern 7 : physical margin / padding properties in an RTL-targeted product

```css
/* anti-pattern */
.toolbar > .primary { margin-left: auto; }
.card { padding-left: 1rem; padding-right: 0.5rem; }
```

Symptom : in RTL languages (Arabic, Hebrew), the primary toolbar item now floats LEFT instead of right (or vice versa); the card's content padding is wrong because the inline axis flipped but the physical values did not.

Root cause : `left` / `right` / `margin-left` / `padding-right` etc. are PHYSICAL; they do not flip with writing direction. Logical properties (`margin-inline-start`, `padding-inline`) do.

Fix : use logical properties everywhere except where the design explicitly requires physical layout :

```css
.toolbar > .primary { margin-inline-start: auto; }
.card { padding-inline-start: 1rem; padding-inline-end: 0.5rem; }
/* or the shorthand */
.card { padding-inline: 1rem 0.5rem; }
```

`margin-inline-start` is "the side where reading starts" : left in LTR, right in RTL. The same rule works in both modes.

## Anti-pattern 8 : `clamp()` MAX less than 2 x MIN (WCAG 1.4.4)

```css
/* anti-pattern */
body { font-size: clamp(0.875rem, 0.75rem + 0.5vw, 1rem); }
```

Symptom : a user with the OS-wide text-zoom set to 200% sees content that does NOT scale to 200% because the `MAX` of 1rem is already the upper cap.

Root cause : per WCAG 1.4.4 Resize Text (Level AA), browsers MUST be able to scale text to at least 200% without loss of content or function. A `clamp()` whose `MAX < 2 x MIN` artificially caps the scaling.

Fix : ensure `MAX >= 2 x MIN` for type sizes :

```css
body { font-size: clamp(1rem, 0.875rem + 0.25vw, 1.125rem); /* MIN 1rem, MAX 1.125rem -> too tight; tune */ }
```

Better, allow a wider range :

```css
body { font-size: clamp(1rem, 0.875rem + 0.5vw, 2rem); /* MAX 2rem == 2 x MIN, complies with 1.4.4 */ }
```

For body copy where wide variation is undesirable, narrow the slope but keep `MAX` >= 2 x `MIN` :

```css
body { font-size: clamp(1rem, 0.97rem + 0.15vw, 2rem); }
```

The slope is small (typography is nearly constant), but the `MAX` allows zoom to expand the text without hitting a cap.
