# Anti-Patterns : View Transitions + scroll-driven + scroll-snap

Each entry : symptom (what the user / developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) (verified 2026-05-19), [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) (verified 2026-05-19), [MDN: scroll-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-timeline) (verified 2026-05-19), [MDN: view-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline) (verified 2026-05-19), [MDN: CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap) (verified 2026-05-19).

## Anti-pattern 1 : `background-attachment: fixed` for parallax

```css
/* anti-pattern */
.hero {
  background: url('hero.jpg') center / cover fixed;
}
```

Symptom : scroll feels heavy on desktop. On mobile (iOS Safari, Chrome Android) the parallax effect breaks entirely or causes severe scroll stutter. DevTools Performance shows large Paint events on every scroll frame.

Root cause : `background-attachment: fixed` causes the gradient or image to repaint at viewport coordinates on every scroll frame, defeating compositor optimisations. Mobile browsers often disable the effect because it is too expensive to sustain.

Fix : replace with a scroll-driven animation that transforms the background element. `transform` is composite-only and runs without paint-per-frame.

```css
.bg { position: absolute; inset: 0; background: url('hero.jpg') center / cover no-repeat; z-index: -1; }

@supports (animation-timeline: view()) {
  .bg {
    animation: parallax auto linear;
    animation-timeline: view();
  }
  @keyframes parallax {
    from { transform: translate3d(0, -20%, 0); }
    to   { transform: translate3d(0, 20%, 0); }
  }
}

@media (prefers-reduced-motion: reduce) {
  .bg { animation: none; transform: none; }
}
```

## Anti-pattern 2 : `@view-transition` declared only on source (cross-document)

```css
/* anti-pattern : only declared in /list.html */
@view-transition { navigation: auto; }

/* /detail.html ships without this rule */
```

Symptom : navigating from list to detail produces no animation. No console error ; the transition silently no-ops. Same DOM swap looks instantaneous instead of animated.

Root cause : per [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) (verified 2026-05-19), cross-document view transitions require `@view-transition { navigation: auto }` declared on BOTH source and destination documents. The destination opts in to render the transition ; without it the browser refuses.

Fix : declare the rule on BOTH documents. Typically place in a shared stylesheet so the policy stays consistent.

```css
/* shared.css imported by every document */
@view-transition { navigation: auto; }
```

## Anti-pattern 3 : `startViewTransition` without `prefers-reduced-motion` check

```js
// anti-pattern
function open(id) {
  document.startViewTransition(() => updateDOM(id));
}
```

Symptom : motion-sensitive users report dizziness, nausea, or migraine triggers when navigating the SPA. WCAG 2.3.3 Animation from Interactions / 2.2.2 Pause, Stop, Hide concerns surface in audits.

Root cause : the animation runs unconditionally regardless of user preference.

Fix : check `matchMedia('(prefers-reduced-motion: reduce)').matches` BEFORE calling `startViewTransition`. When reduced, call `updateDOM` directly.

```js
function open(id) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) {
    updateDOM(id);
    return;
  }
  document.startViewTransition(() => updateDOM(id));
}
```

Alternative : call `transition.skipTransition()` inside.

```js
const transition = document.startViewTransition(() => updateDOM(id));
if (matchMedia('(prefers-reduced-motion: reduce)').matches) transition.skipTransition();
```

Also gate the pseudo-element CSS :

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
    animation: none;
  }
}
```

## Anti-pattern 4 : repeated `view-transition-name` across siblings

```css
/* anti-pattern : every card uses the same name */
.card .image { view-transition-name: card-image; }
```

Symptom : the View Transition API drops the entire transition. Console may show a "Duplicate view-transition-name" warning. No animation runs.

Root cause : per [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) (verified 2026-05-19), every `view-transition-name` MUST be UNIQUE per snapshot (in either the old or new state). Repeating across simultaneously-visible siblings collides.

Fix : derive a unique name per instance (e.g. from a data-id).

```css
.card[data-id="1"] .image { view-transition-name: card-image-1; }
.card[data-id="2"] .image { view-transition-name: card-image-2; }
/* or via inline style set from JS for arbitrary lists */
```

```js
card.querySelector('.image').style.viewTransitionName = `card-image-${card.dataset.id}`;
```

For "ALL cards have a name" without per-element bookkeeping, use the `auto` value :

```css
.card .image { view-transition-name: auto; }
```

`auto` generates a unique name per element automatically (when supported).

## Anti-pattern 5 : `scroll-snap-type` on container without `scroll-snap-align` on children

```css
/* anti-pattern */
.gallery { display: grid; grid-auto-flow: column; overflow-x: scroll; scroll-snap-type: x mandatory; }
.gallery > .slide { width: 80%; }   /* no scroll-snap-align */
```

Symptom : the container scrolls horizontally, but nothing snaps. The `mandatory` rule does not enforce anything because there are no snap targets.

Root cause : per [MDN: CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap) (verified 2026-05-19), `scroll-snap-type` declares the SCROLLER's snap mode. Children must opt in as snap targets via `scroll-snap-align`. Without that, the scroller has no snap points.

Fix : add `scroll-snap-align` (and optionally `scroll-snap-stop`) on each snap target.

```css
.gallery > .slide { width: 80%; scroll-snap-align: center; scroll-snap-stop: always; }
```

## Anti-pattern 6 : scroll-driven animation without `@supports` gate

```css
/* anti-pattern */
.card {
  opacity: 0;
  transform: translateY(2rem);
  animation: reveal auto linear;
  animation-timeline: view();
}
@keyframes reveal { to { opacity: 1; transform: translateY(0); } }
```

Symptom : on engines without `animation-timeline` support (Firefox / Safari, partial in 2026), the cards remain at `opacity: 0` and never appear. The page looks broken.

Root cause : the animation declaration sets the starting state (`opacity: 0`) but the unsupported `animation-timeline: view()` value means the animation never progresses. The `to` state is never reached.

Fix : gate behind `@supports (animation-timeline: view())`. Default to the FINAL state, override inside the support block.

```css
.card { opacity: 1; }  /* default end-state for non-supporting engines */

@supports (animation-timeline: view()) {
  .card {
    opacity: 0;
    transform: translateY(2rem);
    animation: reveal auto linear;
    animation-timeline: view();
  }
  @keyframes reveal { to { opacity: 1; transform: translateY(0); } }
}
```

Non-supporting engines see the cards already revealed ; supporting engines animate.

## Anti-pattern 7 : `scroll-snap-type: mandatory` on long-form content

```css
/* anti-pattern */
.doc { block-size: 100vh; overflow-y: scroll; scroll-snap-type: y mandatory; }
.doc > section { scroll-snap-align: start; min-block-size: 200vh; }
```

Symptom : users cannot scroll WITHIN a section. Any release of the scroll wheel or finger immediately snaps to the start of the nearest section. Sections longer than the viewport are functionally unreadable because mid-section content cannot be held in view.

Root cause : `mandatory` forces snapping on every release ; if sections are taller than the viewport, the user cannot stop mid-section. The user experiences "page jumping" instead of reading.

Fix : use `proximity` for documentation and long-form content. `mandatory` is for discrete-page experiences (photo carousel, paged scroller, slide deck).

```css
.doc { ...; scroll-snap-type: y proximity; }
```

`proximity` snaps only when the user releases near a snap point ; mid-section scrolling works as expected.

## Anti-pattern 8 : `view-transition-name` on a very large element

```css
/* anti-pattern */
body, main, .page { view-transition-name: page; }
```

Symptom : transitions feel sluggish, especially on lower-end devices. Memory pressure spikes during transitions on Chromium. Mobile devices may visibly stutter.

Root cause : the View Transition pipeline captures the named element as a texture. A whole-page-sized texture is expensive ; the engine must copy and composite the entire page rectangle.

Fix : tag SPECIFIC small elements that morph between states (a hero image, a header, a card image). Let the root snapshot cross-fade as the default.

```css
.hero-image { view-transition-name: hero; }
.product-image { view-transition-name: product-42; }
```

The default `::view-transition-old(root)` / `::view-transition-new(root)` cross-fade handles the rest of the page change without per-element snapshot cost.

## Anti-pattern 9 (bonus) : `animation-timeline` inside the `animation` shorthand

```css
/* anti-pattern */
.x { animation: spin 1ms linear; animation-timeline: scroll(block root); }
/* OR worse */
.x { animation-timeline: scroll(); animation: spin 1ms linear; }
```

Symptom : the animation runs time-based instead of scroll-driven. No console error.

Root cause : per [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) (verified 2026-05-19), `animation-timeline` is RESET-ONLY in the `animation` shorthand. Declaring `animation-timeline` BEFORE the shorthand has it reset to `auto`. Declaring `animation` AFTER `animation-timeline` wipes the timeline.

Fix : ALWAYS declare `animation-timeline` AFTER `animation: ...`.

```css
.x {
  animation: spin 1ms linear;
  animation-timeline: scroll(block root);   /* declared AFTER the shorthand */
}
```
