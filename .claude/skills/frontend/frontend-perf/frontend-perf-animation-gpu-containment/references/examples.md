# Examples : GPU-friendly animation, contain, content-visibility, @property

Working snippets. All CSS properties verified against [MDN: contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) (verified 2026-05-19), [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) (verified 2026-05-19), [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19), [web.dev: Animations guide](https://web.dev/articles/animations-guide) (verified 2026-05-19).

## Pattern 1 : content-visibility feed (100 items)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>content-visibility long feed</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; }
  .feed { max-width: 720px; margin: 0 auto; padding: 1rem; }

  .feed-item {
    content-visibility: auto;
    contain-intrinsic-size: auto 280px;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-block: 1rem;
    background: #fff;
  }

  .feed-item h2 { margin: 0 0 0.5rem; }
  .feed-item img { width: 100%; height: 180px; object-fit: cover; border-radius: 4px; }

  .feed-item {
    animation: fadeIn 200ms ease-out both;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
</head>
<body>
<main class="feed" id="feed"></main>
<script>
  const feed = document.getElementById('feed');
  for (let i = 1; i <= 100; i++) {
    const item = document.createElement('article');
    item.className = 'feed-item';
    item.innerHTML = `
      <h2>Item ${i}</h2>
      <img alt="" src="https://picsum.photos/seed/${i}/720/180" loading="lazy" />
      <p>This is the body of feed item ${i}. The off-screen items skip layout and paint until they approach the viewport.</p>
    `;
    feed.appendChild(item);
  }
</script>
</body>
</html>
```

Rules demonstrated :

- `content-visibility: auto` on each `.feed-item` means the engine skips Layout and Paint for items far from the viewport. As the user scrolls, items materialise.
- `contain-intrinsic-size: auto 280px` is REQUIRED. Without it, each off-screen item is sized 0 and the scrollbar jumps.
- The entrance animation animates `opacity` and `transform: translateY(...)` only. NEVER `top` or `margin-top`.
- `loading="lazy"` on `<img>` defers image network work for below-the-fold thumbnails.

## Pattern 2 : promote on hover, demote on leave

```html
<div class="card-grid">
  <article class="card">Card A</article>
  <article class="card">Card B</article>
  <article class="card">Card C</article>
</div>
```

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}
.card {
  padding: 1.5rem;
  border-radius: 0.75rem;
  background: #fff;
  border: 1px solid #ccc;
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}
```

```js
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointerenter', () => { card.style.willChange = 'transform'; });
  const reset = () => { card.style.willChange = 'auto'; };
  card.addEventListener('pointerleave', reset);
  card.addEventListener('transitionend', reset);
});
```

Rules demonstrated :

- `transform: translateY(-4px)` is compositor-only.
- `box-shadow` is being transitioned here even though Pattern 5 in anti-patterns marks shadow animation as risky. This example uses a SINGLE-STEP transition between two known shadow states for short interactions, not a continuous keyframe. For ambient pulsing shadows, switch to the overlay technique in Pattern 5 below.
- `will-change: transform` is set on `pointerenter` and removed on `pointerleave` AND `transitionend`. The reset on both events covers the case where the user leaves before the transition completes.

## Pattern 3 : size animation via `transform: scale`

```html
<div class="progress" style="--progress: 0.4">
  <div class="bar"></div>
</div>
```

```css
.progress {
  position: relative;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
}
.bar {
  position: absolute; inset: 0;
  transform-origin: left;
  transform: scaleX(var(--progress));
  background: #4d4dff;
  transition: transform 300ms ease;
}
```

```js
progressEl.style.setProperty('--progress', String(0.85));
```

Rules demonstrated :

- The bar grows by transforming `scaleX`, not by transitioning `width`. Composite-only.
- `transform-origin: left` anchors the scale to the left edge so the bar grows rightward.
- Updating `--progress` triggers the transition because the bar's computed transform changes.

## Pattern 4 : animatable gradient angle via `@property`

```css
@property --grad-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.hero {
  min-height: 60vh;
  background: linear-gradient(var(--grad-angle), #4d4dff, #ff66cc, #4d4dff);
  background-size: 200% 200%;
  animation: rotateGradient 12s linear infinite;
}

@keyframes rotateGradient {
  to { --grad-angle: 360deg; }
}
```

Rules demonstrated :

- Without `@property`, the angle would snap from 0deg to 360deg at the end of the keyframe (browsers cannot interpolate untyped customs).
- With `@property` the angle interpolates smoothly through every intermediate value.
- `initial-value` is `0deg` (computationally independent; no `em`, no `vh`).

## Pattern 5 : "appearing shadow" via overlay opacity

When a continuous or per-frame shadow change would otherwise paint each frame, use a static layered shadow element and animate ONLY its opacity.

```html
<div class="card-wrap">
  <div class="card">Body</div>
  <div class="card-shadow" aria-hidden="true"></div>
</div>
```

```css
.card-wrap { position: relative; isolation: isolate; }
.card { position: relative; z-index: 1; background: #fff; border-radius: 0.75rem; padding: 1.5rem; }
.card-shadow {
  position: absolute; inset: 0; z-index: 0;
  border-radius: 0.75rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}
.card-wrap:hover .card-shadow { opacity: 1; }
```

The shadow itself is painted once when the page loads (because the `.card-shadow` element exists with a static `box-shadow`). Only `opacity` changes during interaction; that is composite-only.

## Pattern 6 : component isolation with `contain: content`

```css
.panel {
  contain: content;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
}
```

Rules demonstrated :

- `contain: content` = `layout paint style`. Floats and positioned descendants are isolated to the panel; CSS counters scoped to the panel.
- A `position: fixed` descendant inside `.panel` now uses `.panel` as its containing block, NOT the viewport. Verify positioned descendants behave as intended after applying containment.

## Pattern 7 : strict containment for image grid cells (explicit size)

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
}
.gallery-cell {
  aspect-ratio: 1 / 1;
  contain: strict;
  overflow: hidden;
}
.gallery-cell > img { width: 100%; height: 100%; object-fit: cover; }
```

Rules demonstrated :

- `contain: strict` = `size layout paint style`. The cell is sized by its grid track and `aspect-ratio`; `strict` adds size containment so the cell's intrinsic size does not depend on its image's natural dimensions.
- Without an explicit size source (here `aspect-ratio` and the grid track), `contain: strict` would collapse the cell to 0.

## Pattern 8 : DevTools debugging walkthrough

To verify an animation is composite-only :

1. Open Chrome DevTools.
2. Performance panel : click Record, perform the interaction (hover, click, scroll), stop recording.
3. Inspect the timeline. Filter to the interaction window. Look for "Layout" and "Paint" events DURING the animation.
4. Composite-only : no Layout or Paint events between the start and end of the animation. Only Composite Layers events.
5. Layout-triggering : you will see Layout events per frame. Rewrite the offending property using the substitution table in [methods.md](methods.md#7-substitution-patterns-for-layoutpaint-properties).

To verify a `will-change` change actually promoted an element :

1. Open the Layers panel (More tools > Layers).
2. Hover or interact to fire the `will-change` set.
3. The element should appear as its own layer in the panel.
4. After `transitionend`, the layer should be reclaimed within a few seconds.

To diagnose `content-visibility: auto` jitter :

1. Open the Performance panel, record a scroll session.
2. Look for layout shift events during scroll.
3. If shifts coincide with content materialising, the items lack `contain-intrinsic-size` or the placeholder size is too far from the rendered size; tune the placeholder closer to the median item size.
