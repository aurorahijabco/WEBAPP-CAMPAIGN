# References : Micro-Interactions Anti-Patterns

Seven common failure modes with symptom, root cause, fix, source.

## Anti-Pattern 1 : Motion always-on without `prefers-reduced-motion` guard

### Symptom
Users with vestibular sensitivity report nausea / dizziness on the site. Lighthouse / axe-core flags missing reduced-motion handling. WCAG audit fails 2.3.3 Animation from Interactions (AAA) and / or 2.2.2 Pause Stop Hide (A).

### Root cause
Author shipped CSS animations and transitions without an `@media (prefers-reduced-motion: reduce)` override. `prefers-reduced-motion` is an OS-level signal the user has opted out of non-essential motion. Ignoring it can cause real physical harm (vestibular motion disorders).

```css
/* WRONG : motion is unconditional */
.card { transition: transform 250ms cubic-bezier(0.2, 0, 0, 1); }
.card:hover { transform: translateY(-2px); }
```

### Fix
Add a `@media (prefers-reduced-motion: reduce)` override that either collapses to opacity / color-only OR removes motion entirely.

```css
/* CORRECT */
.card { transition: transform 250ms cubic-bezier(0.2, 0, 0, 1); }
.card:hover { transform: translateY(-2px); }

@media (prefers-reduced-motion: reduce) {
  .card { transition: box-shadow 100ms linear; }
  .card:hover { transform: none; box-shadow: 0 0 0 2px var(--accent); }
}
```

### Source
[MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19). WCAG 2.3.3, WCAG 2.2.2.

## Anti-Pattern 2 : Bare `ease` keyword

### Symptom
Animations look flat / robotic / "stock". The site feels like a default Bootstrap demo. Designers say "it doesn't feel right" but cannot point to one specific thing.

### Root cause
The CSS `ease` keyword maps to `cubic-bezier(0.25, 0.1, 0.25, 1)`, which is the visually-flat default. It is the single biggest tell that motion was written without intent.

```css
/* WRONG */
.btn { transition: transform 200ms ease; }
```

### Fix
Always specify an explicit `cubic-bezier(...)` (Material standard `cubic-bezier(0.2, 0, 0, 1)` is the safe default), `linear` for fixed-distance motion, or use `@keyframes` for spring-like motion.

```css
/* CORRECT */
.btn { transition: transform 200ms cubic-bezier(0.2, 0, 0, 1); }
```

### Source
[MDN : transition-timing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function) (verified via [MDN : transition](https://developer.mozilla.org/en-US/docs/Web/CSS/transition) 2026-05-19).

## Anti-Pattern 3 : Long duration on utility transitions

### Symptom
Hover state takes ~500 ms to settle. The UI feels sluggish, unresponsive. Tap-and-wait phenomenon : the user thinks the button did not register.

### Root cause
Author copied a duration intended for a large surface (drawer slide, modal enter) onto a small utility interaction. Anything over ~300 ms reads as slow for hover, focus, and button feedback.

```css
/* WRONG : sluggish */
.btn { transition: background-color 500ms cubic-bezier(0.2, 0, 0, 1); }
```

### Fix
Use the timing tokens : 100 ms press, 150 ms hover, 200 ms standard, 250 ms entrance. Cap utility motion at 300 ms.

```css
/* CORRECT */
.btn { transition: background-color 150ms cubic-bezier(0.2, 0, 0, 1); }
```

### Source
Empirical UX research; aligns with Material 3 motion guidance and Apple Human Interface Guidelines.

## Anti-Pattern 4 : Animating colors via `rgb()` (banding)

### Symptom
A color fade from a vibrant brand color to a neutral gray passes through a muddy desaturated middle frame. The transition looks "dirty."

### Root cause
CSS color interpolation in `rgb` / `srgb` color space is perceptually non-uniform. Two colors equidistant in numeric RGB can sit far apart in perceived color, and the intermediate steps wash through a desaturated middle.

```css
/* WRONG : muddy mid-transition */
.banner { background: rgb(37, 99, 235); transition: background-color 200ms; }
.banner.is-warn { background: rgb(180, 83, 9); }
```

### Fix
Use `oklch()` as the color value AND ensure the color animation interpolates in OKLCH (modern browsers default to OKLCH interpolation for `oklch` values).

```css
/* CORRECT : perceptually uniform */
.banner { background: oklch(60% 0.18 250); transition: background-color 200ms; }
.banner.is-warn { background: oklch(70% 0.15 60); }
```

### Source
[MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified via the modern-color skill 2026-05-19); cross-reference `[[frontend-syntax-css-color-modern]]`.

## Anti-Pattern 5 : `animation-delay` without `animation-fill-mode`

### Symptom
An entrance animation with delay shows the element in its final state momentarily, then disappears, then animates in. Visible flicker.

### Root cause
By default, `animation-fill-mode: none` means before the animation starts (during the delay), the element shows its COMPUTED style, NOT the first keyframe. If the first keyframe is `opacity: 0`, the delay shows the element at full opacity, then snaps to 0, then animates.

```css
/* WRONG : flickers */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.toast {
  animation: fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: 100ms;
  /* missing animation-fill-mode */
}
```

### Fix
Set `animation-fill-mode: both` (or `backwards`) so the first keyframe applies during the delay.

```css
/* CORRECT */
.toast {
  animation: fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both;
}
```

### Source
[MDN : animation-fill-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode) and [MDN : animation](https://developer.mozilla.org/en-US/docs/Web/CSS/animation) (verified 2026-05-19).

## Anti-Pattern 6 : Transitioning `display: none` without `@starting-style` + `allow-discrete`

### Symptom
A tooltip / dropdown / popover toggled via `display: none` -> `display: block` shows up instantly with no animation, even though `transition: opacity 200ms` is set.

### Root cause
Per [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19) : "CSS transitions are by default not triggered on an element's initial style update, or when its `display` type changes from `none` to another value." Two problems : (1) `display` is a discrete property and needs `transition-behavior: allow-discrete`; (2) there is no "previous state" for the transition to interpolate from on first appearance, so `@starting-style` must define it.

```css
/* WRONG : no animation visible */
.tooltip { opacity: 0; display: none; transition: opacity 200ms; }
.tooltip.is-open { opacity: 1; display: block; }
```

### Fix
Add `transition-behavior: allow-discrete` (or use the `display 200ms allow-discrete` shorthand) and define `@starting-style` AFTER the `.is-open` rule.

```css
/* CORRECT */
.tooltip {
  opacity: 0;
  display: none;
  transition:
    opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
    display 200ms allow-discrete;
}
.tooltip.is-open {
  opacity: 1;
  display: block;
}
@starting-style {
  .tooltip.is-open { opacity: 0; }
}
```

### Source
[MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19), [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (verified 2026-05-19).

## Anti-Pattern 7 : Bouncy easing on destructive actions

### Symptom
Delete confirmation modal bounces in with playful spring easing. Sign-out button pulses with overshoot. Users perceive the product as not taking the action seriously, or as untrustworthy ("why is this fun?").

### Root cause
Easing curves carry tone. Bouncy / spring easing = playful, casual, celebration. Smooth ease-out = neutral, business-as-usual. Applying playful easing to a serious tone surface (destructive, security, finance) breaks the affective contract.

```css
/* WRONG : spring on destructive */
@keyframes spring-in { 0% { transform: scale(0); } 60% { transform: scale(1.1); } 100% { transform: scale(1); } }
.delete-dialog { animation: spring-in 350ms cubic-bezier(0.16, 1, 0.3, 1); }
```

### Fix
Use straight ease-out (Material standard) for destructive / serious surfaces. Reserve spring / bounce for celebrations and playful contexts.

```css
/* CORRECT */
.delete-dialog {
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 200ms cubic-bezier(0.2, 0, 0, 1),
    transform 200ms cubic-bezier(0.2, 0, 0, 1);
}
.delete-dialog.is-open {
  opacity: 1;
  transform: translateY(0);
}
```

### Source
UX motion design canon (Material 3 motion guidelines, Apple HIG motion principles). Aligns with WCAG 2.3.3 spirit : motion must support, not contradict, the surface's purpose.
