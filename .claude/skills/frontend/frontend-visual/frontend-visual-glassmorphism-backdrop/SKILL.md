---
name: frontend-visual-glassmorphism-backdrop
description: >
  Use when building a frosted-glass surface (sticky header, modal overlay, nav
  bar, card-on-image) with the CSS `backdrop-filter` property, debugging a
  `backdrop-filter` that silently does not blur, sizing the blur radius for a
  given content density, verifying that text-on-glass still passes WCAG
  contrast, picking a mobile-friendly fallback when GPU cost is too high, or
  shipping a fallback for browsers below Baseline 2024.
  Prevents the most common glassmorphism regressions : a `backdrop-filter`
  declared on a card whose ancestor has `opacity: 0.95` (the parent silently
  becomes a backdrop-root and clips the filter), white-on-glass body text that
  drops below 4 5 to 1 contrast against the bright photograph behind it (WCAG
  1 4 3 fail), a 20-px blur applied to every card in an infinite scroll feed
  (mobile GPU melts), animating the `backdrop-filter` property itself (paint
  storm), missing `-webkit-backdrop-filter` for legacy Safari contexts, and
  stacking two `backdrop-filter` layers and getting compounded blur instead of
  the intended composition.
  Covers the CSS `backdrop-filter` shorthand and the full filter-function set
  (blur, brightness, contrast, drop-shadow, grayscale, hue-rotate, invert,
  opacity, saturate, sepia, url for SVG filters), the partially-transparent
  background-color requirement, the complete list of properties that
  establish a backdrop-root and break the filter (`opacity` less than 1, any
  `filter`, `mask`, `mask-image`, `mix-blend-mode`, `clip-path`, another
  `backdrop-filter`, `will-change` for any of these, `isolation: isolate`,
  `contain: paint`, `contain: layout`, `contain: strict`, and stacking-context
  triggers like `transform`, `perspective`, `filter`, `position: fixed`), the
  `-webkit-backdrop-filter` prefix status (no longer required as of 2024 but
  harmless), the `@supports (backdrop-filter: blur(1px))` graceful-degradation
  gate, the contrast-preservation rule for text on glass, the mobile-perf
  budget for blur radius, and the `prefers-reduced-transparency` opt-out per
  WCAG.
  Keywords: backdrop-filter, backdrop-root, blur, saturate, brightness,
  contrast, glassmorphism, frosted glass, -webkit-backdrop-filter,
  glassmorphism CSS, filter-effects, stacking context, isolation, contain,
  will-change, opacity, mix-blend-mode, mask, clip-path,
  prefers-reduced-transparency, supports backdrop-filter, WCAG 1 4 3,
  backdrop-filter not working, glass effect not working, text unreadable on
  glass, blurred background not showing, Safari blur missing, mobile slow
  with blur, paint storm, compositor cost, how do I make a glass effect,
  frosted glass CSS, backdrop blur, glassmorphism in CSS, what is
  backdrop-filter, why is my backdrop-filter ignored, why is my blur not
  working, how to make a sticky frosted header
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Visual : Glassmorphism + backdrop-filter

This skill is the operational reference for shipping CSS `backdrop-filter`-based glassmorphism in evergreen-2026 browsers. It covers the property syntax, the partially-transparent background requirement, the full set of backdrop-root triggers (the single most common reason a `backdrop-filter` silently does nothing), contrast preservation against the blurred backdrop, the mobile performance budget, the `@supports` gate for pre-Baseline-2024 browsers, and the `prefers-reduced-transparency` opt-out. The skill does NOT cover gradients (see `[[frontend-visual-gradients]]`), micro-interaction motion (see `[[frontend-visual-micro-interactions]]`), `light-dark()` theming, or React component wrappers.

## Quick Reference

### Floor rules

- ALWAYS set a partially-transparent `background-color` on the glass element. NEVER omit ; without a translucent surface the filter has nothing to blur and the element appears solid.
- ALWAYS audit the ancestor chain for backdrop-root triggers when a `backdrop-filter` does not blur. NEVER assume the rule is malformed before checking parents : `opacity < 1`, any `filter`, `mask`, `mix-blend-mode`, `clip-path`, another `backdrop-filter`, `isolation: isolate`, or `contain: paint / layout / strict` on any ancestor breaks the effect.
- ALWAYS verify text-on-glass meets WCAG 1 4 3 (4 5 to 1 normal, 3 to 1 large) against the EFFECTIVE backdrop (the blurred + tinted result), not against the declared token. NEVER ship body text on a translucent surface without measuring contrast in the live page.
- ALWAYS gate on `@supports (backdrop-filter: blur(1px))` AND provide a solid-color fallback. NEVER ship a glass surface that becomes transparent on browsers below Baseline 2024.
- ALWAYS provide a `prefers-reduced-transparency: reduce` branch that replaces the glass with a solid surface and drops the blur. NEVER ignore the user signal.
- ALWAYS budget blur radius for mobile : 8 to 16 px max for animated or frequently-painted surfaces. NEVER set `blur(40px)` on a sticky element above a scrolling photograph on mid-range mobile.
- ALWAYS keep `backdrop-filter` on a single layer per stack. NEVER nest two `backdrop-filter` elements ; the inner one establishes a backdrop-root and the outer one only sees the inner's solid surface.
- ALWAYS animate `opacity` or `transform`, never `backdrop-filter` itself. Animating the filter triggers a per-frame backdrop re-sample (paint storm).

### Decision tree 1 : Glass versus solid + opacity ?

```
Need to see content THROUGH the surface (blurred or saturated) ?
  -> Glass. `backdrop-filter: blur(Npx) saturate(180%)` on the element +
     translucent background-color. The filter acts on what is BEHIND the element.

Need to make the element itself semi-transparent (the element AND its descendants
fade together) ?
  -> Solid + opacity. `opacity: 0.7` on the element. NOTE : opacity less than 1
     establishes a stacking context AND a backdrop-root, so any descendant
     `backdrop-filter` will break. Decide which behavior you want.

Need to tint the underlying content without blurring ?
  -> Solid color with low alpha. `background: rgb(0 0 0 / 0.4)`. No filter cost.

Need text-readable surface over arbitrary user content (photo, video, ad) ?
  -> Solid + slight tint. The blurred backdrop is unpredictable ; contrast
     cannot be guaranteed without measurement.
```

### Decision tree 2 : Backdrop-filter not blurring ?

```
Is the element's background-color fully opaque (alpha 1) ?
  -> Reduce alpha. `background: oklch(0.99 0 0 / 0.7)` or `rgb(255 255 255 / 0.6)`.

Does the element have NO background at all ?
  -> Set one. `backdrop-filter` only applies to the area covered by the
     element's painted box ; without a background-color, that area is empty.

Does any ancestor (any parent up to the root) have one of :
  opacity < 1, filter, mask, mask-image, mix-blend-mode, clip-path,
  another backdrop-filter, isolation: isolate, contain: paint / layout / strict,
  will-change for any of the above ?
  -> That ancestor became a backdrop-root. The filter only sees content INSIDE
     that root. Either remove the property or restructure the DOM so the glass
     is a sibling of the content it wants to blur.

Is the browser pre-Baseline-2024 ?
  -> Gate with @supports (backdrop-filter: blur(1px)) and provide a solid fallback.

Is it Safari only and the unprefixed property is silently dropped in some
older nested context ?
  -> Add -webkit-backdrop-filter alongside backdrop-filter. Harmless.
```

### Decision tree 3 : What blur radius for what content ?

```
Sharp text or thin graphics behind the glass (UI screenshot, dashboard) ?
  -> 8 to 12 px. Higher radii merge readable details ; the surface still feels
     like glass without obscuring the structural shape.

Photograph behind a sticky header ?
  -> 12 to 20 px combined with saturate(140%) to 180%. The saturation lift
     compensates for blur-induced colour washing.

Animated background (video, gradient mesh) ?
  -> 16 to 24 px on desktop, 8 to 16 px on mobile. Pair with
     `transform: translateZ(0)` to keep the layer composited.

Modal overlay over the entire app ?
  -> 24 to 40 px. The modal is short-lived and full-screen, so the GPU cost
     is paid once. Skip the blur entirely on mobile in
     `prefers-reduced-transparency` or low-power mode.
```

### Decision tree 4 : Mobile fallback strategy ?

```
Target device is high-end (Apple A-series, recent Pixel / Galaxy) ?
  -> Full blur (16 to 24 px) acceptable. Test on real device.

Target includes mid-range Android (older Snapdragon, MediaTek) ?
  -> Cap blur at 8 to 12 px AND avoid blur on animated / scrolled surfaces.
     Consider intersection-toggle : enable blur only when the element is in
     view and not currently scrolling.

User set "Reduce Transparency" at the OS level ?
  -> Inside @media (prefers-reduced-transparency: reduce), set
     backdrop-filter: none and a solid background-color. Honor the signal.

Browser below Baseline 2024 ?
  -> @supports gate. Fall back to a solid background-color with a slight
     tint to suggest layering.
```

## Patterns

### Pattern : Minimal frosted card

```css
.glass {
  background: oklch(0.99 0 0 / 0.6);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%); /* harmless legacy */
  border: 1px solid oklch(0.99 0 0 / 0.3);
  border-radius: 12px;
}

@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background: oklch(0.99 0 0 / 0.95);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass {
    backdrop-filter: none;
    background: oklch(0.99 0 0);
  }
}
```

Three layers : the primary rule, the `@supports` graceful fallback, and the `prefers-reduced-transparency` opt-out. Ship all three.

### Pattern : Sticky frosted header

```css
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 64px;
  background: oklch(0.99 0 0 / 0.7);
  backdrop-filter: blur(16px) saturate(160%);
  border-bottom: 1px solid oklch(0.85 0 0 / 0.3);
}
```

`position: sticky` itself does NOT establish a backdrop-root, but verify the scroll container does not have one of the trigger properties.

### Pattern : Glass card OVER content (correct DOM)

```html
<body>
  <main class="content">...</main>
  <aside class="glass-panel">Content inside is blurred BEHIND this panel.</aside>
</body>
```

```css
.glass-panel {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  background: oklch(0.99 0 0 / 0.6);
  backdrop-filter: blur(20px);
}
```

The glass element must NOT be a descendant of the content it wants to blur. If it is, that content is inside the same stacking context and may be excluded from the backdrop or trigger a backdrop-root.

### Pattern : Backdrop-root pitfall (broken) + fix

```html
<!-- BROKEN -->
<div style="opacity: 0.95">
  <div class="glass">backdrop-filter is silently dropped</div>
</div>

<!-- FIXED -->
<div style="background: oklch(0.99 0 0 / 0.95)">
  <div class="glass">backdrop-filter now works</div>
</div>
```

`opacity: 0.95` on the parent establishes a backdrop-root. Replace with a translucent background-color (which does NOT establish a backdrop-root) when the visual intent was a faded surface.

### Pattern : Contrast-preserving text on glass

```css
.glass {
  background: oklch(0.99 0 0 / 0.6);
  backdrop-filter: blur(14px) saturate(180%) brightness(110%);
}

.glass h2 {
  color: oklch(0.20 0 0); /* near-black ; ratio against the lifted backdrop */
  text-shadow: 0 0 8px oklch(0.99 0 0 / 0.6); /* defensive halo */
}
```

`brightness(110%)` lifts the underlying backdrop so dark text retains contrast. Defensive `text-shadow` is a halo that survives a dark-image background ; verify the rendered ratio meets 4 5 to 1 against the typical case.

### Pattern : Mobile-aware blur

```css
.glass {
  background: oklch(0.99 0 0 / 0.7);
  backdrop-filter: blur(12px) saturate(160%);
}

@media (max-width: 768px) {
  .glass { backdrop-filter: blur(8px) saturate(140%); }
}

@media (prefers-reduced-transparency: reduce), (update: slow) {
  .glass {
    backdrop-filter: none;
    background: oklch(0.99 0 0);
  }
}
```

`(update: slow)` matches low-refresh-rate displays where compositor cost is most visible.

### Pattern : Avoid animating backdrop-filter

```css
/* WRONG : per-frame backdrop re-sample */
.glass { transition: backdrop-filter 300ms; }
.glass:hover { backdrop-filter: blur(24px); }

/* RIGHT : animate an overlay's opacity, keep the filter static */
.glass { backdrop-filter: blur(16px); }
.glass-overlay {
  position: absolute; inset: 0;
  background: oklch(0.99 0 0 / 0);
  transition: background 200ms;
}
.glass:hover .glass-overlay {
  background: oklch(0.99 0 0 / 0.2);
}
```

## Backdrop-root triggers (full list)

Any of the following on ANY ancestor of the `backdrop-filter` element creates a backdrop-root and the filter cannot see beyond it :

- `opacity` less than 1
- Any `filter` value other than `none`
- `mask`, `mask-image`, `mask-border`
- `mix-blend-mode` other than `normal`
- `clip-path` other than `none`
- Another `backdrop-filter` other than `none`
- `isolation: isolate`
- `contain: paint`, `contain: layout`, `contain: strict`
- `will-change` naming any of the above properties

Stacking-context triggers (do NOT establish a backdrop-root but still affect layering) :

- `transform` other than `none`, `perspective` other than `none`
- `position: fixed`, `position: sticky`
- `z-index` on a positioned element

Source : [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19) and vooronderzoek §9 (verified 2026-05-19).

## Baseline status

| Surface | Status | Notes |
|---------|--------|-------|
| `backdrop-filter` | Newly Available September 2024 | Baseline 2024. Treat as production-safe in evergreen-2026 ; gate older browsers via `@supports`. |
| `-webkit-backdrop-filter` | Legacy prefix | No longer required as of 2024 ; harmless to ship for older Safari contexts. |
| `prefers-reduced-transparency` | Limited Availability | Experimental ; ship the rule anyway for forward compatibility. |
| `@supports (backdrop-filter: blur(1px))` | Baseline Widely Available | Use to gate solid-color fallback. |

Source : [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19).

## Cross-references

- `[[frontend-syntax-css-color-modern]]` : `oklch()` for tinted translucent backgrounds, `light-dark()` for theme-aware glass.
- `[[frontend-visual-gradients]]` : layered gradients as a non-blur alternative for "glass over photo" surfaces.
- `[[frontend-visual-micro-interactions]]` : hover and focus transitions for interactive glass elements.
- `[[frontend-a11y-motion-contrast-wcag22]]` : `prefers-reduced-transparency`, WCAG 1 4 3 contrast measurement, `forced-colors: active` behavior (which drops `backdrop-filter` effects).
- `[[frontend-perf-core-web-vitals-inp]]` : compositor cost budget, avoid animating heavy filters on the critical paint path.

## Reference Links

- [references/methods.md](references/methods.md) : full filter-function surface, syntax, ancestor-trigger list, browser support table.
- [references/examples.md](references/examples.md) : renderable HTML fragment with a sticky frosted header AND a broken-versus-fixed backdrop-root demo on the same page.
- [references/anti-patterns.md](references/anti-patterns.md) : seven anti-patterns with symptom, root cause, and fix.

## Authoritative sources

- [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19)
- [MDN : CSS filter effects](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_filter_effects) (verified 2026-05-19)
- [W3C : Filter Effects Module Level 2](https://www.w3.org/TR/filter-effects-2/) (verified 2026-05-19)
- [MDN : @supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports) (verified 2026-05-19)
- [MDN : prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) (verified 2026-05-19)
