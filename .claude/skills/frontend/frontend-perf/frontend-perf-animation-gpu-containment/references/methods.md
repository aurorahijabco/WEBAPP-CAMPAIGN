# Methods : performance, containment, GPU-friendly animation

Sources : [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19), [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19), [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19), [web.dev: Animations guide](https://web.dev/articles/animations-guide) (verified 2026-05-19).

## 1. Rendering pipeline (text diagram)

```
HTML + CSS  ->  Style  ->  Layout  ->  Paint  ->  Composite  ->  Screen
                  |          |          |           |
                  |          |          |           +-- transform / opacity / filter animations
                  |          |          +-- background-color, box-shadow, border-*
                  |          +-- top/left/width/height/margin/padding/font-size
                  +-- selector matching + computed styles
```

The closer to the right side of the pipeline an animated property lives, the cheaper the animation. Compositor-only animations skip Style, Layout, and Paint each frame.

## 2. `will-change` reference

| Aspect | Detail |
|--------|--------|
| Accepted values | `auto` (default, no hint), `scroll-position`, `contents`, `<custom-ident>` (any CSS property name such as `transform`, `opacity`, `filter`). Multiple properties comma-separated : `will-change: transform, opacity;`. |
| Side effects | Names that themselves create a stacking context (e.g. `opacity`, `transform`) create the stacking context UP FRONT, possibly altering visual layering before any change happens. Allocates compositor layer and GPU memory. |
| Lifecycle | Set just before the change is expected; remove (back to `auto`) on `transitionend` / `animationend` / interaction-end. NEVER static in stylesheet for "might change" elements. |
| Diagnostic rule | If you do not have an identified perf problem, do NOT add `will-change`. Add only as a targeted fix. |

JavaScript lifecycle :

```js
function attachWillChange(el, prop, startEvt, endEvts) {
  el.addEventListener(startEvt, () => { el.style.willChange = prop; });
  endEvts.forEach(evt => el.addEventListener(evt, () => { el.style.willChange = 'auto'; }));
}
attachWillChange(card, 'transform', 'pointerenter', ['pointerleave', 'transitionend']);
```

## 3. `contain` value matrix

Per [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19). Baseline Widely Available since March 2022.

| Value | Layout iso | Paint iso | Style iso | Size iso | Containing block | Stacking ctx | BFC | Notes |
|-------|------------|-----------|-----------|----------|------------------|--------------|-----|-------|
| `none` | no | no | no | no | no | no | no | default |
| `size` | no | no | no | YES (both axes) | no | no | no | element sized as if it had no contents; requires explicit dimensions or it is 0 |
| `inline-size` | no | no | no | YES (inline axis only) | no | no | no | block-axis sizing remains content-driven |
| `layout` | YES | no | no | no | YES | YES | YES | internal layout cannot escape; floats, scroll, positioning isolated |
| `style` | no | no | YES | no | no | no | no | `counter-increment`, `counter-set`, `quotes` scoped to subtree |
| `paint` | no | YES | no | no | no | no | no | descendants clipped to border box, paint stays inside |
| `content` | YES | YES | YES | no | YES | YES | YES | shorthand for `layout paint style`; safe default for components |
| `strict` | YES | YES | YES | YES | YES | YES | YES | shorthand for `size layout paint style`; requires explicit dimensions |

Combinable explicitly : `contain: size paint;`, `contain: layout paint style;`. `size` and `inline-size` cannot be combined.

## 4. `content-visibility` value matrix

Per [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19). Baseline 2024 (September 2024).

| Value | Layout / Paint when off-screen | Render state preserved | Find-in-page | a11y tree | Tab order | Implicit containment |
|-------|--------------------------------|------------------------|--------------|-----------|-----------|----------------------|
| `visible` | always rendered | n/a | yes | yes | yes | none |
| `hidden` | skipped always | YES (faster to resume than `display: none`) | NO | NO | NO | implicit |
| `auto` | skipped while off-screen, rendered when near viewport | yes | yes | yes | yes | `contain: layout style paint` applied implicitly |

`contain-intrinsic-size` pairs with `auto` :

| Form | Behaviour |
|------|-----------|
| `contain-intrinsic-size: <length>` | Fixed placeholder size. |
| `contain-intrinsic-size: auto <length>` | `<length>` placeholder until the element has been laid out once, then the remembered size is used. RECOMMENDED. |
| `contain-intrinsic-width: <length>` / `contain-intrinsic-height: <length>` | Per-axis variants. |

Without `contain-intrinsic-size`, off-screen content is sized 0 and the scrollbar drifts as content materialises.

## 5. `@property` reference

Per [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19). Baseline 2024 (July 2024).

```css
@property --<name> {
  syntax: '<type>';
  inherits: true | false;
  initial-value: <value>;
}
```

Required descriptors :

| Descriptor | Required | Notes |
|------------|----------|-------|
| `syntax` | yes | E.g. `'<color>'`, `'<length>'`, `'<percentage>'`, `'<angle>'`, `'<time>'`, `'<number>'`, `'<integer>'`, `'<image>'`, `'<url>'`. Combinators : `\|` (one or another), `+` (space-list), `#` (comma-list). Universal : `'*'` (any). |
| `inherits` | yes | `true` or `false`. |
| `initial-value` | required when `syntax` is anything other than `'*'` | MUST be computationally independent (no `em`, no `vh`, no inheritance-dependent values). |

JavaScript equivalent :

```js
CSS.registerProperty({
  name: '--<name>',
  syntax: '<type>',
  inherits: true | false,
  initialValue: '<value>',
});
```

`CSS.registerProperty()` takes precedence over `@property` for the same name.

Side effect : registering a property enables it to be transitioned and animated. Untyped customs are interpolation-opaque and snap from start to end.

## 6. Compositor-only properties reference

Per [web.dev: Animations guide](https://web.dev/articles/animations-guide) (verified 2026-05-19).

| Property | Triggers Layout | Triggers Paint | Composite-only |
|----------|-----------------|----------------|----------------|
| `transform` | no | no | YES |
| `opacity` | no | no | YES |
| `filter` | no | no | YES (when the layer is promoted; modern engines treat most filters this way) |
| `top`, `left`, `right`, `bottom`, `inset` | YES | YES | no |
| `width`, `height`, `block-size`, `inline-size` | YES | YES | no |
| `margin`, `padding` | YES | YES | no |
| `font-size`, `letter-spacing`, `line-height` | YES | YES | no |
| `box-shadow` | no | YES | no |
| `background-color`, `color` | no | YES | no |
| `border-radius`, `border-width` | sometimes (depends on box model context) | YES | no |
| `clip-path` (geometry change) | no | YES | partial (depends on engine; profile per case) |

For surfaces that need a "fade colour" effect, layer an overlay with `opacity` instead of animating `background-color`.

## 7. Substitution patterns for layout/paint properties

| Want to animate | Use instead |
|------------------|-------------|
| `top` / `left` (position) | `transform: translate(...)` or `translate3d(...)` |
| `width` / `height` (grow) | `transform: scale(...)`, counter-scale text child if needed |
| `margin` push | `transform: translate(...)` |
| `font-size` zoom | `transform: scale(...)` on the wrapper |
| `box-shadow` appear | `opacity` on a pseudo-element holding the static shadow |
| `background-color` crossfade (large surface) | `opacity` on a layered overlay |
| `border-radius` grow | layered pseudo-element with the target radius and `opacity` |

## 8. DevTools workflow

| Tool | Use |
|------|-----|
| Chrome DevTools Performance panel | Record an interaction, look for the Layout and Paint events per frame. Compositor-only animations show no Layout/Paint during the transition. |
| Chrome DevTools Rendering tab | Paint flashing reveals which DOM regions repaint; frequent flashing on a hover transition is a smell. |
| Chrome DevTools Layers panel | Inspect which elements are on their own compositor layer; check that `will-change` did or did not promote the element you expected. |
| Firefox DevTools Performance | Waterfall view shows expensive style recalculations and reflow events. |
| `?` FPS meter (Chrome rendering) | Shows realtime fps and dropped frames. |

Profile on a representative device class (mid-range Android). Desktop performance hides jank that ships to users.

## 9. Containment side-effect checklist

When applying `contain: layout`, `contain: paint`, `contain: content`, or `contain: strict` to an element, verify :

- Any `position: absolute` or `position: fixed` descendants now use the contained element as their containing block. If a descendant was positioned against the viewport, this breaks.
- A new stacking context is created. z-index of children is local; siblings of the contained element are no longer interleaved with its descendants.
- A new Block Formatting Context is created. Floats inside cannot escape; floats outside cannot intrude.

Run a visual smoke test after applying containment to a previously uncontained section.

## 10. `requestAnimationFrame` vs CSS

| Use rAF when | Use CSS animation / transition when |
|--------------|-------------------------------------|
| Animation is tied to mutable state (cursor position, scroll, sensor input). | Animation runs from declared start to declared end without per-frame state. |
| The animation must coordinate multiple DOM nodes with code each frame. | A single element transitions a single property. |
| You need to short-circuit, reverse, or branch mid-animation based on data. | Linear, ease, or keyframed motion. |

NEVER use rAF in an infinite loop for animation that CSS already expresses (`@keyframes`, `animation`, `transition`). The rAF approach prevents the engine from optimising the animation onto the compositor.
