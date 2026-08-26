# Examples : View Transitions + scroll-driven animations + scroll-snap

Working snippets. All APIs and CSS verified against [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) (verified 2026-05-19), [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) (verified 2026-05-19), [MDN: scroll-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-timeline) (verified 2026-05-19), [MDN: view-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline) (verified 2026-05-19), [MDN: CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap) (verified 2026-05-19).

## Pattern 1 : renderable demo (progress bar + view-transition + reveal + snap carousel)

Save as `motion.html` and open in a Chromium-based browser. Other engines fall back gracefully.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>View transitions + scroll-driven animation + scroll-snap demo</title>
<style>
  :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
  body { margin: 0; }
  main { padding-block: 2rem; padding-inline: clamp(1rem, 4vw, 4rem); max-inline-size: 80rem; margin-inline: auto; }
  h1, h2 { text-wrap: balance; }

  /* 1. Scroll progress bar (whole-page) */
  .progress {
    position: fixed; inset-block-start: 0; inset-inline: 0; block-size: 4px;
    background: oklch(0.6 0.2 250);
    transform-origin: left; transform: scaleX(0);
    z-index: 10;
  }
  @supports (animation-timeline: scroll()) {
    .progress {
      animation: grow auto linear;
      animation-timeline: scroll(block root);
    }
    @keyframes grow { to { transform: scaleX(1); } }
  }

  /* 2. Reveal-on-scroll using view() timeline */
  .reveal { opacity: 1; }
  @supports (animation-timeline: view()) {
    .reveal {
      opacity: 0;
      transform: translateY(2rem);
      animation: appear auto linear;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
    @keyframes appear {
      to { opacity: 1; transform: translateY(0); }
    }
  }

  /* 3. Card grid */
  .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); }
  .card {
    padding: 1.25rem; border: 1px solid currentColor; border-radius: 0.5rem;
    background: oklch(1 0 0);
  }
  .card h3 { margin-block: 0 0.5rem; text-wrap: balance; }

  /* 4. Horizontal scroll-snap carousel */
  .carousel {
    display: grid; grid-auto-flow: column; gap: 1rem;
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
    padding-inline: 1rem; padding-block: 1rem;
    scroll-padding-inline: 1rem;
  }
  .carousel > .slide {
    inline-size: 80%; aspect-ratio: 16 / 9;
    scroll-snap-align: center;
    scroll-snap-stop: always;
    border-radius: 0.5rem;
    background: linear-gradient(in oklch 135deg, oklch(0.7 0.18 250), oklch(0.78 0.2 320));
    display: grid; place-items: center; color: oklch(1 0 0); font-size: 2rem;
  }

  /* 5. Same-document view transition */
  .card[data-id] .image {
    inline-size: 100%; aspect-ratio: 16 / 9; border-radius: 0.5rem;
    background: linear-gradient(in oklch 135deg, oklch(0.72 0.18 250), oklch(0.78 0.2 320));
  }
  .detail { display: none; }
  .detail.active { display: grid; gap: 1rem; }
  .detail .image {
    inline-size: 100%; aspect-ratio: 16 / 9; border-radius: 0.5rem;
    background: linear-gradient(in oklch 135deg, oklch(0.72 0.18 250), oklch(0.78 0.2 320));
  }
  .grid.hidden { display: none; }

  /* Reduced motion : disable all the above motion */
  @media (prefers-reduced-motion: reduce) {
    .progress { animation: none; transform: none; }
    .reveal { opacity: 1; transform: none; animation: none; }
    .carousel { scroll-snap-type: x proximity; }
    ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none; }
  }
</style>
</head>
<body>
  <div class="progress" aria-hidden="true"></div>
  <main>
    <h1 class="reveal">View transitions + scroll-driven animations + scroll-snap</h1>
    <p class="reveal">Scroll down. The bar at the top reflects scroll progress. Cards fade in as they enter the viewport. The carousel below snaps to the nearest slide.</p>

    <section class="grid" id="cards">
      <article class="card reveal" data-id="1"><div class="image" style="view-transition-name: card-image-1"></div><h3>Card 1</h3><p>Click to expand.</p><button data-target="1">Open</button></article>
      <article class="card reveal" data-id="2"><div class="image" style="view-transition-name: card-image-2"></div><h3>Card 2</h3><p>Click to expand.</p><button data-target="2">Open</button></article>
      <article class="card reveal" data-id="3"><div class="image" style="view-transition-name: card-image-3"></div><h3>Card 3</h3><p>Click to expand.</p><button data-target="3">Open</button></article>
      <article class="card reveal" data-id="4"><div class="image" style="view-transition-name: card-image-4"></div><h3>Card 4</h3><p>Click to expand.</p><button data-target="4">Open</button></article>
    </section>

    <article class="detail" id="detail">
      <div class="image" id="detail-image" aria-hidden="true"></div>
      <h2>Detail view</h2>
      <p>You activated a card. The image morphed from the grid to here via the View Transitions API.</p>
      <button id="back">Back</button>
    </article>

    <h2 class="reveal">Carousel</h2>
    <div class="carousel" aria-label="Featured slides" tabindex="0">
      <div class="slide">1</div>
      <div class="slide">2</div>
      <div class="slide">3</div>
      <div class="slide">4</div>
      <div class="slide">5</div>
    </div>
  </main>

  <script>
    const grid = document.getElementById('cards');
    const detail = document.getElementById('detail');
    const detailImage = document.getElementById('detail-image');
    const back = document.getElementById('back');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

    function reset() {
      detail.classList.remove('active');
      grid.classList.remove('hidden');
      detailImage.style.viewTransitionName = '';
    }

    function open(id) {
      grid.classList.add('hidden');
      detail.classList.add('active');
      detailImage.style.viewTransitionName = `card-image-${id}`;
    }

    grid.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-target]');
      if (!button) return;
      const id = button.dataset.target;
      if (!document.startViewTransition || reduceMotion.matches) {
        open(id);
        return;
      }
      document.startViewTransition(() => open(id));
    });

    back.addEventListener('click', () => {
      if (!document.startViewTransition || reduceMotion.matches) {
        reset();
        return;
      }
      document.startViewTransition(() => reset());
    });
  </script>
</body>
</html>
```

Rules demonstrated :

- Scroll progress bar uses `animation-timeline: scroll(block root)` gated by `@supports`.
- Reveal cards use `animation-timeline: view()` with `animation-range: entry 0% cover 30%` gated by `@supports`.
- Carousel uses `scroll-snap-type: x mandatory` + `scroll-snap-align: center` + `scroll-snap-stop: always` on slides.
- Same-document view transition : on button click, `document.startViewTransition(() => open(id))` wraps the DOM swap. The detail image takes the same `view-transition-name` as the clicked card's image so it morphs between positions.
- `prefers-reduced-motion: reduce` disables all animations, downgrades snap to `proximity`, and bypasses `startViewTransition`.
- All `@supports` gates ensure non-supporting engines still see the content (just static, no animation).

## Pattern 2 : cross-document MPA transition

Both `/list.html` and `/detail.html` ship :

```css
@view-transition { navigation: auto; }

.hero-image { view-transition-name: hero; }
```

Linking from list to detail via a plain `<a href>` triggers the cross-document transition with no JavaScript. The `.hero-image` morphs because both documents name the same element.

## Pattern 3 : named scroll-timeline shared across distant elements

```css
.story {
  scroll-timeline: --story-progress block;
  timeline-scope: --story-progress;  /* makes the name visible to descendants */
  overflow-y: scroll;
  block-size: 100vh;
}

.story .indicator {
  position: sticky; inset-block-start: 0;
  animation: grow auto linear;
  animation-timeline: --story-progress;
  transform-origin: left; transform: scaleX(0);
}

@keyframes grow { to { transform: scaleX(1); } }
```

`timeline-scope` lets the indicator (a sticky child) reference the timeline declared on the parent scroller.

## Pattern 4 : named `view-timeline` for choreographed reveals

```css
.hero { view-timeline: --hero block; }
.hero-headline {
  animation: pop auto linear;
  animation-timeline: --hero;
}

@keyframes pop {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}
```

The headline animates as the hero element crosses the scrollport, even though the headline is INSIDE the hero. Multiple descendants could reference `--hero` for choreography.

## Pattern 5 : `pageswap` / `pagereveal` for per-direction transitions

```js
window.addEventListener('pageswap', (e) => {
  if (!e.viewTransition) return;
  const back = isBackNavigation();   // your nav direction detector
  e.viewTransition.types.add(back ? 'back' : 'forward');
});

window.addEventListener('pagereveal', (e) => {
  if (!e.viewTransition) return;
  e.viewTransition.types.add(detectDirectionFromHistory());
});
```

```css
:active-view-transition-type(forward) ::view-transition-old(*) { animation-name: slideOutLeft; }
:active-view-transition-type(back)    ::view-transition-old(*) { animation-name: slideOutRight; }
```

## Pattern 6 : `animation-range` to bracket a reveal

```css
.fade-up {
  animation: appear auto linear;
  animation-timeline: view();
  animation-range: entry 0% cover 20%;  /* runs from element entering scrollport to 20% covered */
}

@keyframes appear {
  from { opacity: 0; transform: translateY(2rem); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Range keywords : `entry`, `entry-crossing`, `cover`, `contain`, `exit-crossing`, `exit`. Each optionally followed by a percentage offset.

## Pattern 7 : reduced-motion-safe parallax

```css
.bg {
  position: absolute; inset: 0;
  background: url('bg.jpg') center / cover no-repeat;
  z-index: -1;
}

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

`transform` is composite-only. NEVER `background-attachment: fixed` for parallax (mobile compositor disaster).

## Pattern 8 : vertical scroll-snap with anchor sections

```css
.doc {
  block-size: 100dvh; overflow-y: scroll;
  scroll-snap-type: y proximity;
  scroll-padding-block: 4rem;
}
.doc > section {
  scroll-snap-align: start;
  scroll-margin-block-start: 4rem;
  min-block-size: 80vh;
}
```

`proximity` (not `mandatory`) lets the user scroll freely within long sections but snaps to section starts when released near them.

## Pattern 9 : `scrollsnapchange` event for UI sync

```js
const carousel = document.querySelector('.carousel');
const dots = document.querySelectorAll('.dot');

carousel.addEventListener('scrollsnapchange', (e) => {
  const target = e.snapTargetInline ?? e.snapTargetBlock;
  if (!target) return;
  const index = [...carousel.children].indexOf(target);
  dots.forEach((d, i) => d.toggleAttribute('data-active', i === index));
});
```

The browser tells you when a snap target changes ; sync any external UI (dots, pagination, current-slide label).

## Pattern 10 : View Transition with custom names per direction

```css
::view-transition-old(*),
::view-transition-new(*) {
  animation-duration: 250ms;
  animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
}

::view-transition-old(root) { animation-name: fade-out; }
::view-transition-new(root) { animation-name: fade-in; }

@keyframes fade-out { to { opacity: 0; } }
@keyframes fade-in  { from { opacity: 0; } }
```

`root` is the implicit name for the unmarked root snapshot. Customising it gives a default page-cross-fade in addition to per-element morphs.
