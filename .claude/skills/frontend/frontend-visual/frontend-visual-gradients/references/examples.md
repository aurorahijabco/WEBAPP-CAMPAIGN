# Examples : CSS gradients

Working snippets. All CSS verified against [MDN: linear-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient) (verified 2026-05-19), [MDN: conic-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/conic-gradient) (verified 2026-05-19), [MDN: `<gradient>`](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient) (verified 2026-05-19), [W3C: CSS Images Module Level 4](https://www.w3.org/TR/css-images-4/) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

## Pattern 1 : renderable demo (linear + radial + conic + animated + mesh)

Save as `gradients.html` and open in a browser.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Gradients demo</title>
<style>
  :root { color-scheme: light; }
  html, body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
  body { padding: 2rem; background: #fafafa; color: #111; }
  h1 { font-size: 1.25rem; margin-block: 0 1.5rem; }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 1.5rem;
    max-width: 80rem;
    margin-inline: auto;
  }

  .card {
    border-radius: 1rem;
    overflow: hidden;
    background: white;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  .card .swatch { height: 14rem; }
  .card .meta { padding: 0.75rem 1rem; font-size: 0.875rem; }
  .card .meta strong { display: block; margin-block-end: 0.25rem; }

  /* 1. Linear in oklch */
  .linear-oklch {
    background: linear-gradient(in oklch to right, oklch(0.65 0.18 250), oklch(0.72 0.20 320));
  }

  /* 2. Linear in srgb for comparison (muddy midpoint) */
  .linear-srgb {
    background: linear-gradient(to right, oklch(0.65 0.18 250), oklch(0.72 0.20 320));
  }

  /* 3. Radial */
  .radial {
    background: radial-gradient(circle at 30% 30%, oklch(0.85 0.18 80) 0%, oklch(0.55 0.18 260) 70%);
  }

  /* 4. Conic loading ring */
  .conic {
    background:
      conic-gradient(from 0deg, transparent 0deg, oklch(0.6 0.18 250) 270deg, transparent 270deg),
      oklch(0.97 0.02 240);
    border-radius: 50%;
    width: 12rem; height: 12rem; margin: 1rem auto;
    animation: spin 1.2s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* 5. Repeating stripes */
  .stripes {
    background: repeating-linear-gradient(45deg, oklch(0.9 0.05 250) 0 10px, white 10px 20px);
  }

  /* 6. Mesh emulation (4 radials + base) */
  .mesh {
    background:
      radial-gradient(circle at 20% 25%, oklch(0.78 0.18 320) 0%, transparent 50%),
      radial-gradient(circle at 80% 30%, oklch(0.78 0.18 220) 0%, transparent 55%),
      radial-gradient(circle at 35% 75%, oklch(0.78 0.18 130) 0%, transparent 60%),
      radial-gradient(circle at 80% 80%, oklch(0.78 0.18 30)  0%, transparent 55%),
      oklch(0.95 0.02 240);
  }

  /* 7. Animated rotating gradient via @property */
  @property --grad-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
  .animated {
    background: linear-gradient(var(--grad-angle), oklch(0.65 0.18 250), oklch(0.72 0.20 320), oklch(0.65 0.18 250));
    background-size: 200% 200%;
    animation: rotate-grad 14s linear infinite;
  }
  @keyframes rotate-grad { to { --grad-angle: 360deg; } }

  @media (prefers-reduced-motion: reduce) {
    .conic, .animated { animation: none; }
  }
</style>
</head>
<body>
  <h1>Gradients demo</h1>
  <div class="grid">
    <div class="card"><div class="swatch linear-oklch"></div><div class="meta"><strong>linear-gradient(in oklch ...)</strong>Clean midpoint, no mud.</div></div>
    <div class="card"><div class="swatch linear-srgb"></div><div class="meta"><strong>linear-gradient (default srgb)</strong>Muddy midpoint (compare to above).</div></div>
    <div class="card"><div class="swatch radial"></div><div class="meta"><strong>radial-gradient(circle at ...)</strong>Spotlight effect.</div></div>
    <div class="card"><div class="swatch conic" style="height:auto"></div><div class="meta"><strong>conic-gradient(from 0deg, ...)</strong>Loading ring (transform-animated).</div></div>
    <div class="card"><div class="swatch stripes"></div><div class="meta"><strong>repeating-linear-gradient(45deg, ...)</strong>Diagonal stripes.</div></div>
    <div class="card"><div class="swatch mesh"></div><div class="meta"><strong>Mesh emulation</strong>Four radial blobs + base.</div></div>
    <div class="card"><div class="swatch animated"></div><div class="meta"><strong>Animated angle via @property</strong>Rotating linear gradient. Honors prefers-reduced-motion.</div></div>
  </div>
</body>
</html>
```

Rules demonstrated :

- `in oklch` interpolation removes the muddy midpoint that the default sRGB shows in the side-by-side card.
- The conic loading ring uses `transform: rotate` for the animation (composite-only); the gradient itself is static.
- The mesh card stacks four radial gradients with transparent tails over a solid base.
- The animated card uses a typed custom property (`@property --grad-angle`) so the angle interpolates instead of snapping.
- All animation is gated by `prefers-reduced-motion: reduce`.

## Pattern 2 : informative conic pie chart with a11y

```html
<div role="img" aria-label="Sales breakdown: 40% Q1, 35% Q2, 25% Q3">
  <div class="pie"></div>
</div>
```

```css
.pie {
  width: 14rem; height: 14rem; border-radius: 50%;
  background: conic-gradient(
    oklch(0.65 0.18 250) 0deg 144deg,    /* 40% */
    oklch(0.72 0.20 320) 144deg 270deg,  /* 35% */
    oklch(0.78 0.18 60)  270deg 360deg   /* 25% */
  );
}
```

Decorative gradients need no ARIA; INFORMATIVE gradients (conveying data) MUST be wrapped with `role="img"` and an `aria-label`.

## Pattern 3 : hue arc for rainbow

```css
.rainbow { background: linear-gradient(in oklch longer hue, oklch(0.65 0.2 0), oklch(0.65 0.2 0)); }
```

Same start and end colour, but `longer hue` forces the gradient to traverse the entire colour wheel. The result is a full rainbow strip.

## Pattern 4 : two-tone with midpoint hint

```css
.weighted {
  background: linear-gradient(in oklch 0.25turn, oklch(0.7 0.18 250), 30%, oklch(0.7 0.18 320));
}
```

The bare `30%` between the two colour stops is a colour hint; it shifts the visual midpoint toward the 30% mark.

## Pattern 5 : checkerboard via repeating-conic-gradient

```css
.checker {
  background:
    repeating-conic-gradient(white 0 25%, black 0 50%)
    50% / 40px 40px;
}
```

Each conic gradient cycle is 4 sectors (4 x 25% = 100%); tiled at 40px x 40px creates a checkerboard.

## Pattern 6 : gradient on text

```css
.headline {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
  font-weight: 700;
  background: linear-gradient(in oklch 90deg, oklch(0.6 0.2 250), oklch(0.65 0.22 320));
  background-clip: text;
  color: transparent;
}

@supports not (background-clip: text) {
  .headline { color: oklch(0.6 0.2 250); background: none; }
}
```

Always provide a fallback colour for engines without `background-clip: text`.

## Pattern 7 : layered gradient + image

```css
.cover {
  background:
    linear-gradient(in oklch 180deg, transparent 0%, oklch(0.2 0.05 250 / 0.85) 85%),
    url('cover.jpg') center / cover;
}
```

A dark vignette fades over a cover image. The bottom layer (image) provides the photo; the top layer (linear gradient) tints the lower portion for legible white text.

## Pattern 8 : reduced-motion compliant animated mesh

```css
@property --blob1-x { syntax: '<percentage>'; inherits: false; initial-value: 20%; }
@property --blob2-x { syntax: '<percentage>'; inherits: false; initial-value: 80%; }

.mesh-anim {
  background:
    radial-gradient(circle at var(--blob1-x) 30%, oklch(0.78 0.18 320) 0%, transparent 50%),
    radial-gradient(circle at var(--blob2-x) 70%, oklch(0.78 0.18 220) 0%, transparent 55%),
    oklch(0.95 0.02 240);
  animation: drift 18s ease-in-out infinite alternate;
}
@keyframes drift {
  from { --blob1-x: 20%; --blob2-x: 80%; }
  to   { --blob1-x: 60%; --blob2-x: 30%; }
}
@media (prefers-reduced-motion: reduce) {
  .mesh-anim { animation: none; }
}
```

Position values are typed via `@property` so they interpolate. Note that `background` is repainted per frame ; budget paint cost or accept the trade-off in exchange for the visual richness.
