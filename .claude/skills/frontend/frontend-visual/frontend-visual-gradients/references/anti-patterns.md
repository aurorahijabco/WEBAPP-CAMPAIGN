# Anti-Patterns : CSS gradients

Each entry : symptom (what the user / developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [MDN: linear-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient) (verified 2026-05-19), [MDN: conic-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/conic-gradient) (verified 2026-05-19), [MDN: `<gradient>`](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient) (verified 2026-05-19), [W3C: CSS Images Module Level 4](https://www.w3.org/TR/css-images-4/) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

## Anti-pattern 1 : default sRGB interpolation between complementary colours

```css
/* anti-pattern */
.hero { background: linear-gradient(to right, blue, yellow); }
```

Symptom : the midpoint is a muddy olive-grey instead of a clean transition. The same gradient on a 1920px-wide hero shows visible banding too.

Root cause : default colour interpolation is sRGB, which is neither linear-light nor perceptually uniform. Halfway between complementary RGB values lands at grey. Per [W3C: CSS Images Module Level 4](https://www.w3.org/TR/css-images-4/) (verified 2026-05-19), interpolating in Lab or Oklab produces "more perceptually uniform results."

Fix : add the colour-interpolation hint.

```css
.hero { background: linear-gradient(in oklab to right, blue, yellow); }
```

Or, when also using a polar hue arc :

```css
.hero { background: linear-gradient(in oklch longer hue, red, blue); }
```

## Anti-pattern 2 : transitioning an untyped gradient custom property

```css
/* anti-pattern */
:root { --grad-angle: 0deg; }
.hero {
  background: linear-gradient(var(--grad-angle), red, blue);
  transition: --grad-angle 600ms;
}
.hero:hover { --grad-angle: 180deg; }
```

Symptom : the gradient does not rotate. It snaps from `0deg` to `180deg` at the end of the transition.

Root cause : an unregistered CSS custom property is interpolation-opaque. The browser does not know the property's type so it cannot interpolate intermediate values. Per [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19), Baseline 2024.

Fix : register the property.

```css
@property --grad-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
```

The same rule applies to typed color customs (`syntax: '<color>'`), length customs (`syntax: '<length>'`), etc.

## Anti-pattern 3 : `background-attachment: fixed` for parallax gradient

```css
/* anti-pattern */
.hero {
  background: linear-gradient(in oklch 180deg, #4d4dff, transparent) center / cover fixed;
}
```

Symptom : scroll feels heavy on desktop and is catastrophic on mobile. The whole gradient is re-rasterised relative to the viewport on every scroll frame.

Root cause : `background-attachment: fixed` causes the gradient to repaint at viewport coordinates each frame, defeating compositor optimisations. Especially expensive on mobile devices that use software-rasterised mobile chrome.

Fix : use scroll-driven animations or a transformed overlay :

```css
.hero { background: linear-gradient(in oklch 180deg, #4d4dff, transparent); }

@supports (animation-timeline: scroll()) {
  .hero {
    animation: parallax linear;
    animation-timeline: scroll();
  }
  @keyframes parallax { to { transform: translate3d(0, -25%, 0); } }
}
```

`transform` is composite-only, so parallax via `transform` does not paint per frame.

## Anti-pattern 4 : 30-stop gradient to "smooth out" the look

```css
/* anti-pattern */
.surface {
  background: linear-gradient(
    to right,
    #4d4dff 0%, #5b4dff 3%, #694dff 7%, /* ... 27 more stops ... */, #ff66cc 100%
  );
}
```

Symptom : the gradient still has banding ; the dev added stops thinking it would fix it. The page paint cost rises with each stop.

Root cause : banding in CSS gradients is almost never caused by stop count. It is almost always caused by the default sRGB interpolation producing a non-uniform perceptual curve, plus the 8-bit per-channel rendering pipeline. Adding stops in sRGB does not change either factor.

Fix : use 3-5 well-placed stops and the `in oklch` interpolation hint :

```css
.surface { background: linear-gradient(in oklch to right, oklch(0.65 0.18 250), oklch(0.72 0.20 320)); }
```

`in oklch` removes the perceptual non-uniformity ; modern engines also dither slightly when rendering in non-sRGB spaces, which mitigates the 8-bit banding.

## Anti-pattern 5 : conic-gradient pie chart without `role="img"` and `aria-label`

```html
<!-- anti-pattern -->
<div class="pie" style="background: conic-gradient(red 144deg, green 270deg, blue 360deg);"></div>
```

Symptom : sighted users see a pie chart. Screen-reader users hear nothing ; the chart conveys data but is invisible to assistive technology.

Root cause : background images (gradients included) are not exposed to the accessibility tree per [MDN: conic-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/conic-gradient) (verified 2026-05-19). They are decorative-by-default from a11y's perspective.

Fix : when the gradient conveys information, wrap it with semantic markup that does have a text alternative :

```html
<div role="img" aria-label="Sales breakdown: 40% Q1, 35% Q2, 25% Q3">
  <div class="pie"></div>
</div>
```

For purely decorative gradients (hero backgrounds, soft tints) no ARIA is needed.

## Anti-pattern 6 : animated gradient shipped without `prefers-reduced-motion`

```css
/* anti-pattern */
.hero {
  background: linear-gradient(var(--grad-angle), red, blue);
  animation: spin 10s linear infinite;
}
```

Symptom : motion-sensitive users see the rotating gradient and report dizziness / nausea / migraine triggers. WCAG 2.3.3 ("Animation from Interactions" / "Pause, Stop, Hide") concerns.

Root cause : the animation runs unconditionally regardless of user preference.

Fix : ALWAYS gate with `prefers-reduced-motion` :

```css
@media (prefers-reduced-motion: reduce) {
  .hero { animation: none; }
}
```

For a more graceful alternative, ship a slow, low-contrast version when reduced motion is preferred ; the strict default `animation: none` is the simplest correct floor.

## Anti-pattern 7 : `background-position` animation on a huge surface

```css
/* anti-pattern */
.banner {
  background: linear-gradient(in oklch 90deg, #4d4dff, #ff66cc, #4d4dff);
  background-size: 400% 100%;
  width: 100vw; height: 60vh;
  animation: shift 2s linear infinite;
}
@keyframes shift { to { background-position: 400% 0%; } }
```

Symptom : DevTools Performance shows large Paint events every frame ; on lower-end devices, fps drops.

Root cause : animating `background-position` triggers paint of the entire surface per frame. On a `100vw x 60vh` surface that is a lot of pixels.

Fix : if the visual is a "shimmer" sweeping across the surface, use a transformed overlay element instead :

```css
.banner { position: relative; overflow: hidden; background: linear-gradient(in oklch 90deg, #4d4dff, #ff66cc); }
.banner::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.3) 50%, transparent 100%);
  transform: translateX(-100%);
  animation: shimmer 2s linear infinite;
}
@keyframes shimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) {
  .banner::after { animation: none; }
}
```

`transform` is composite-only ; the surface paints once at page load.

## Anti-pattern 8 : gradient set on `background-color` instead of `background-image`

```css
/* anti-pattern */
.hero { background-color: linear-gradient(in oklch to right, red, blue); }
```

Symptom : the gradient does not appear. The element renders with `background-color` falling back to its initial value (transparent).

Root cause : gradients are `<image>` values per [MDN: `<gradient>`](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient) (verified 2026-05-19). `background-color` only accepts a `<color>`. The declaration is invalid and ignored.

Fix : assign to `background-image` (or the `background` shorthand) :

```css
.hero { background-image: linear-gradient(in oklch to right, red, blue); }
/* or */
.hero { background: linear-gradient(in oklch to right, red, blue); }
```

## Anti-pattern 9 : repeating-* gradient missing the second hard-stop position

```css
/* anti-pattern */
.stripes { background: repeating-linear-gradient(45deg, red, blue 20px); }
```

Symptom : the stripes blend smoothly into each other; the visual reads as a continuous gradient that simply repeats, not as crisp stripes.

Root cause : `red, blue 20px` is two stops with one position ; the gradient ramps red -> blue over 20px, then ramps blue -> red over the next 20px (because the repeat starts again). The repeat is correct but the stops do not produce hard edges.

Fix : use the two-position shorthand to express a stripe :

```css
.stripes { background: repeating-linear-gradient(45deg, red 0 10px, blue 10px 20px); }
```

Each colour now spans an explicit range ; the boundary at `10px` is a hard edge ; the pattern repeats every 20px.
