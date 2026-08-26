# References : Anti-patterns

Seven anti-patterns observed in real `backdrop-filter` code, with symptom, root cause, and fix. All verified 2026-05-19.

## 1. Opaque background-color : nothing to blur

**Symptom** : `backdrop-filter: blur(20px)` is set on the element, the property is in the computed-style panel, and the element looks solid. No blur is visible at all.

**Root cause** : the element's `background-color` is fully opaque (alpha 1, or no alpha channel and a solid color). The painted box covers the underlying content entirely, so the blur has nothing to act on. `backdrop-filter` blurs the content that shows THROUGH the element's box.

**Fix** : use a translucent background.

```css
/* Wrong */
.glass {
  background: white;
  backdrop-filter: blur(12px);
}

/* Right */
.glass {
  background: oklch(0.99 0 0 / 0.6); /* alpha 0.6 */
  backdrop-filter: blur(12px) saturate(180%);
}
```

For OKLCH : `oklch(L C H / alpha)`. For RGB : `rgb(255 255 255 / 0.6)` or `rgba(255 255 255 0.6)`. Source : [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19).

## 2. Parent `opacity: 0.95` for fade-in : silent backdrop-root

**Symptom** : a glass element nested inside a wrapper that fades in (or is statically faded for visual depth) does not blur. The same element rendered outside the wrapper blurs correctly.

**Root cause** : `opacity` less than 1 on any ancestor establishes a backdrop-root. The `backdrop-filter` can only see content INSIDE that root, which is just the wrapper's own background (often nothing). This is the single most common reason a `backdrop-filter` silently does nothing in production.

**Fix** : never apply `opacity` to a parent of a glass element. Either fade the glass itself, or use a translucent `background-color` on the parent instead.

```css
/* Wrong : parent opacity breaks the child's backdrop-filter */
.wrapper { opacity: 0.95; }
.wrapper .glass { backdrop-filter: blur(12px); }

/* Right : translucent background instead of opacity */
.wrapper { background: oklch(0.99 0 0 / 0.95); }
.wrapper .glass { backdrop-filter: blur(12px); }

/* Or : fade the glass element directly */
.glass {
  opacity: 0.95;
  backdrop-filter: blur(12px); /* the filter still sees the parent's backdrop */
}
```

The same trap is created by `filter`, `mask`, `mix-blend-mode`, `clip-path`, `isolation: isolate`, `contain: paint`, `contain: layout`, and `contain: strict` on any ancestor. Audit the full chain when a glass element refuses to blur. Source : [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19).

## 3. Glass over user-generated content : WCAG contrast fail

**Symptom** : design review or accessibility audit reports body text on glass falling below 4 5 to 1 contrast against the rendered backdrop. The token-level color passes contrast against the design-system surface but fails against the user-uploaded photograph beneath the glass.

**Root cause** : `backdrop-filter` blurs whatever is behind the element, which for user-generated content (photo, ad, embedded video) is unpredictable. Even a 60-percent-white tint leaves the rendered backdrop dependent on the underlying pixels.

**Fix** : either tint heavily enough to dominate the backdrop, or insert a solid buffer layer between the variable content and the glass.

```css
/* Defensive : tint + brightness lift + halo */
.glass-on-photo {
  background: oklch(0.99 0 0 / 0.7);
  backdrop-filter: blur(20px) saturate(140%) brightness(110%);
  color: oklch(0.18 0 0);
}

.glass-on-photo h2 {
  text-shadow: 0 0 10px oklch(0.99 0 0 / 0.5);
}

/* Even more defensive : buffer layer between photo and glass */
.photo-wrapper {
  position: relative;
}

.photo-wrapper::after {
  content: "";
  position: absolute;
  inset: 0;
  background: oklch(0.99 0 0 / 0.3);
  pointer-events: none;
}
```

Verify the rendered ratio in DevTools accessibility pane with the worst-case background loaded. See `[[frontend-a11y-motion-contrast-wcag22]]` for measurement.

## 4. Heavy blur on every card in an infinite scroll feed

**Symptom** : mobile devices stutter when scrolling a feed of glass cards. INP regresses. Mid-range Android reports thermal throttling. DevTools Performance shows the compositor thread saturated.

**Root cause** : `backdrop-filter` is GPU-intensive. The cost scales with blur radius (larger radius means larger sampling kernel) and with surface area. A scroll feed re-composites every glass card every frame as the user scrolls.

**Fix** : cap blur radius, disable the filter while off-screen, and honor `prefers-reduced-transparency` plus `(update: slow)`.

```css
.card {
  background: oklch(0.99 0 0 / 0.7);
  backdrop-filter: blur(12px) saturate(160%);
}

@media (max-width: 768px) {
  .card { backdrop-filter: blur(8px) saturate(140%); }
}

@media (prefers-reduced-transparency: reduce), (update: slow) {
  .card {
    backdrop-filter: none;
    background: oklch(0.99 0 0);
  }
}
```

```js
// Intersection-toggle : disable filter while off-screen
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    entry.target.style.backdropFilter =
      entry.isIntersecting ? "blur(12px) saturate(160%)" : "none";
  }
}, { rootMargin: "200px" });

for (const card of document.querySelectorAll(".card")) io.observe(card);
```

## 5. `-webkit-backdrop-filter` only, no unprefixed property

**Symptom** : works in Safari and old iOS WebView. Broken in modern Firefox and Chrome.

**Root cause** : the unprefixed `backdrop-filter` is Baseline 2024. Modern Firefox and Chrome do NOT recognise the `-webkit-` prefix as a fallback ; if the unprefixed property is missing, the rule produces no effect.

**Fix** : always declare the unprefixed property. Include the prefixed version for legacy WebView contexts if desired.

```css
/* Wrong */
.glass {
  -webkit-backdrop-filter: blur(12px);
}

/* Right */
.glass {
  -webkit-backdrop-filter: blur(12px) saturate(180%);
          backdrop-filter: blur(12px) saturate(180%);
}
```

Order : prefixed FIRST, unprefixed SECOND. Source : [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19).

## 6. Animating `backdrop-filter` : paint storm

**Symptom** : a glass element with `transition: backdrop-filter 300ms` hovers smoothly on desktop but stutters on mobile. Performance traces show the compositor thread maxed out for the duration of the transition.

**Root cause** : transitioning the `backdrop-filter` value forces the browser to re-sample the backdrop on every frame at a different blur radius. Each frame is a full GPU pass. On a moving or scrolling underlying surface, the work compounds.

**Fix** : keep `backdrop-filter` static. Animate an overlay's `opacity` or `background-color` instead.

```css
/* Wrong */
.glass {
  backdrop-filter: blur(12px);
  transition: backdrop-filter 300ms;
}
.glass:hover {
  backdrop-filter: blur(24px);
}

/* Right */
.glass {
  position: relative;
  backdrop-filter: blur(16px);
}

.glass::after {
  content: "";
  position: absolute;
  inset: 0;
  background: oklch(0.99 0 0 / 0);
  transition: background 200ms;
  pointer-events: none;
}

.glass:hover::after {
  background: oklch(0.99 0 0 / 0.2);
}
```

The overlay is composited cheaply because it transitions `opacity` / `background-color`, which are compositor-only properties. The blur radius stays constant.

## 7. Stacking two `backdrop-filter` layers : compounded blur

**Symptom** : a glass card inside a glass header looks weirder than expected. The inner card appears more uniformly tinted than blurred. Stacking the two filter values does not give a "double blur" ; instead the inner card sees only the outer card's solid surface.

**Root cause** : any `backdrop-filter` other than `none` on an ancestor establishes a backdrop-root. The inner element's filter only sees content INSIDE that root, which is the outer glass surface (its translucent tint) rather than the actual page content behind everything.

**Fix** : keep `backdrop-filter` on one layer per stack. Either remove the outer filter, or move the inner glass element OUT of the outer glass element's subtree.

```html
<!-- Wrong : nested glass -->
<header class="glass-header">
  <div class="glass-card">Inner glass tries to blur the page but sees only the header.</div>
</header>

<!-- Right : siblings, not nested -->
<header class="glass-header">Outer glass.</header>
<div class="glass-card">Inner glass blurs the page directly.</div>
```

If the visual design requires a stacked appearance, use a translucent background on the outer element and a `backdrop-filter` only on the inner one. Source : [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19).
