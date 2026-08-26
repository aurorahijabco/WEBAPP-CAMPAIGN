# References : Anti-patterns

Nine anti-patterns observed in real production code, with symptom, root cause, and fix. All verified 2026-05-19.

## 1. `min-height: 100vh` on a mobile hero

**Symptom** : on mobile, the hero section extends past the visible area. Users land on the page with the URL bar visible and find the call-to-action button hidden below the browser chrome. After the user scrolls and the chrome retracts, the hero stays at its original computed value, leaving empty whitespace at the bottom.

**Root cause** : per [MDN : length](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19), the default `vh` unit currently resolves to `lvh` ("Currently, all default viewport units are equivalent to their large viewport counterparts"). `100vh` measures against the maximum viewport (chrome retracted), so any time the chrome is visible, `100vh` is taller than the visible area.

**Fix** :

```css
.hero {
  min-height: 100svh; /* baseline ; never overflows */
}

@supports (height: 100dvh) {
  .hero {
    min-height: 100dvh; /* adapts as chrome retracts */
  }
}
```

`100svh` is the conservative guarantee ; `100dvh` upgrades to adaptive sizing where supported.

## 2. Nested `font-size: 1.5em`

**Symptom** : a heading deep in the DOM renders at three or four times the expected size. Designer reports "the font keeps growing." Visual regression tests catch some cases but not all.

**Root cause** : `em` resolves against the inherited `font-size`. Each nested rule with `font-size: 1.5em` multiplies the previous value. Three levels deep : `1 × 1.5 × 1.5 × 1.5 = 3.375` times the base.

**Fix** : use `rem` for `font-size`. Each `rem` resolves against `<html>`'s `font-size` regardless of nesting.

```css
/* Wrong */
.heading       { font-size: 1.5em; }
.heading .sub  { font-size: 1.5em; } /* 2.25x */
.heading .sub .nest { font-size: 1.5em; } /* 3.375x */

/* Right */
.heading       { font-size: 1.5rem; }
.heading .sub  { font-size: 1.5rem; }
.heading .sub .nest { font-size: 1.5rem; }
```

Reserve `em` for properties that should scale WITH the local font-size : button padding, line-height, inline icon size. Source : [MDN : length / font-relative_lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length#font-relative_lengths) (verified 2026-05-19).

## 3. `width: 100vw` for full-bleed sections

**Symptom** : on desktop, a section sized `width: 100vw` overflows the body by the scrollbar width. Horizontal scrollbar appears at the bottom of the page. Content shifts left or right depending on how the developer compensated.

**Root cause** : per [MDN : length](https://developer.mozilla.org/en-US/docs/Web/CSS/length) (verified 2026-05-19), "None of the viewport units take the size of scrollbars into account." On systems with classic scrollbars, the body width is `100vw - scrollbar-width`, so a child sized `100vw` is wider than the body.

**Fix** :

```css
/* Right : 100% of body, scrollbar excluded automatically */
.full-bleed { width: 100%; }

/* Right (when the section is inside a constrained parent) */
.alt-bleed {
  width: 100dvw;
  margin-inline: calc(50% - 50dvw);
}

/* Combine with scrollbar-gutter to prevent layout jump on overflow */
:root { scrollbar-gutter: stable; }
```

## 4. Missing `viewport-fit=cover`

**Symptom** : on iPhone notch devices, `env(safe-area-inset-bottom)` returns `0`. Sticky bottom nav covers the home indicator. Content sits flush against the notch on the top.

**Root cause** : without `viewport-fit=cover` in the viewport meta, iOS Safari uses `viewport-fit=auto` (the default), which automatically insets content from the cutout. The `env(safe-area-inset-*)` variables only become non-zero when the page opts into edge-to-edge rendering via `cover`.

**Fix** : include the directive in EVERY mobile-targeted document.

```html
<!-- Wrong : env(safe-area-inset-*) returns 0 -->
<meta name="viewport" content="width=device-width, initial-scale=1" />

<!-- Right -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Then pair with `env()` padding on every edge-touching surface :

```css
footer {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}
```

Source : [MDN : `<meta name="viewport">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport) (verified 2026-05-19).

## 5. `border: 0.5px solid` for hairlines

**Symptom** : the border appears full-width (1 device pixel) on Retina displays but renders as 0 (invisible) on some classic DPR 1 displays. QA reports inconsistent visual output across hardware.

**Root cause** : `0.5px` is legal CSS but its rendering depends on the browser's subpixel-rounding policy and the device pixel ratio. On DPR 1, 0.5 CSS pixels = 0.5 device pixels, which rounds to either 0 or 1 inconsistently. On DPR 2, 0.5 CSS pixels = 1 device pixel (true hairline).

**Fix** : use one of three robust alternatives.

```css
/* Option 1 : accept 1px ; consistent across every DPR */
.hairline { border: 1px solid; }

/* Option 2 : SVG line with stroke-width="1" in a viewBox sized to match */
```

```html
<svg viewBox="0 0 100 1" preserveAspectRatio="none" aria-hidden="true">
  <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="currentColor" stroke-width="1" />
</svg>
```

```css
/* Option 3 : 1px border + transform: scale(0.5) on a wrapper */
.hairline-wrapper { transform: scaleY(0.5); transform-origin: top; }
.hairline-wrapper > .hairline { border-top: 1px solid; }
```

`0.5px` only inside a `min-resolution >= 2dppx` media query is acceptable if you accept browser variance below 2dppx.

## 6. Hardcoded `font-size: 14px` on body

**Symptom** : users who set their browser default font size to 20 px see no change. Accessibility audit flags WCAG 1 4 4 Resize Text failure.

**Root cause** : an absolute-pixel `font-size` overrides the user's browser preference. The MDN guidance : "Absolute lengths can cause accessibility problems because they are fixed and do not scale according to user settings."

**Fix** : use `rem` or `%`.

```css
/* Wrong */
body { font-size: 14px; }

/* Right */
:root { font-size: 100%; } /* 16px by default, scales with user preference */
body  { font-size: 0.875rem; } /* 14px-equivalent that respects user preference */
```

Or simpler : set `font-size: 100%` on `:root`, declare component sizes in `rem`, and rely on root scaling.

## 7. Assuming `1in` is a physical inch

**Symptom** : a print stylesheet sized at `width: 8.5in` produces the expected letter-paper layout. The same dimensions in a screen stylesheet produce a "1-inch-wide" button that is 0.5 inches on a 4K monitor and 1.3 inches on a low-DPI laptop.

**Root cause** : per MDN, `1in = 96px` in CSS. This is the CSS REFERENCE inch, anchored to the reference pixel, NOT to the physical inch. Only print media uses the physical inch.

**Fix** : reserve `in`, `cm`, `mm`, `Q` for `@media print`. Use `rem` / `em` / `px` / viewport units for screen.

```css
/* Print stylesheet : physical units appropriate */
@media print {
  .receipt { width: 8.5in; padding: 0.5in; }
}

/* Screen stylesheet : NEVER use in / cm / mm */
.button { padding: 0.75rem 1.5rem; }
```

## 8. `height: 100vh` on a modal overlay

**Symptom** : the modal overlays past the bottom of the visible viewport on mobile. Close button covered by the home indicator. Content scroll-clipped by the chrome.

**Root cause** : same as anti-pattern 1. The `100vh` resolves to `100lvh`, which is taller than the visible area when chrome is expanded.

**Fix** : use `inset: 0` with `position: fixed` (sizes against the visible viewport reliably) OR `height: 100dvh` if absolute height is needed.

```css
/* Wrong */
.modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; }

/* Right */
.modal { position: fixed; inset: 0; } /* sizes to current visible viewport */

/* Or */
.modal {
  position: fixed;
  top: 0; left: 0;
  width: 100dvw;
  height: 100dvh;
}
```

`<dialog>.showModal()` is the better primitive for modals ; see `[[frontend-component-modal-toast-system]]`.

## 9. Animating `dvh`-sized elements

**Symptom** : a hero declared `transition: height 0.3s` to ease from one `dvh`-sized state to another. Mobile users see a step change at the start or end of the chrome animation, not the smooth ease the designer requested.

**Root cause** : per [W3C : css-values-4](https://www.w3.org/TR/css-values-4/#viewport-relative-lengths) (verified 2026-05-19), "The UA is not required to animate the dynamic viewport-percentage units while expanding and retracting any relevant interfaces, and may instead calculate the units as if the relevant interface was fully expanded or retracted during the UI animation." Browsers step `dvh` updates, they do not tween.

**Fix** : transition the CONTENT (via `transform`) rather than the height itself, or accept the step change.

```css
/* Wrong : dvh does not animate smoothly */
.hero {
  height: 100dvh;
  transition: height 0.3s; /* no-op during chrome transitions */
}

/* Right : transition content position with transform */
.hero {
  height: 100dvh;
}
.hero .content {
  transition: transform 0.3s;
  transform: translateY(0);
}
```

If the actual height must change with a smooth animation, animate a CSS custom property registered via `@property` (see `[[frontend-impl-design-tokens]]`) and resolve the height from that, rather than from `dvh` directly.
