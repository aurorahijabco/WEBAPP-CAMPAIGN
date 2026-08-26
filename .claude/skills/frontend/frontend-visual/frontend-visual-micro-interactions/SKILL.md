---
name: frontend-visual-micro-interactions
description: >
  Use when designing or implementing hover, focus, and press feedback
  on buttons, links, and cards; choreographing entrance / exit
  animations for modals, popovers, dropdowns, list items, or any
  dynamic content; choosing an easing curve (Material standard,
  smooth ease-out, sharp / mechanical, bouncy); building a staggered
  reveal across a list of cards; ensuring motion respects
  `prefers-reduced-motion`; or transitioning between a `display:
  none` and a visible state (which by default does NOT animate).
  Use when reviewing CSS for the classic micro-interaction sins :
  bare `ease` keyword, animating `width` instead of `transform`,
  motion that ignores `prefers-reduced-motion`, hover-only feedback
  with no `:focus-visible` equivalent, or a `display: none`
  transition that silently never fires.
  Prevents the seven dominant micro-interaction failures : motion
  always-on without a `prefers-reduced-motion: reduce` guard
  (vestibular harm, WCAG 2.3.3 violation); bouncy easing on serious
  actions ("Delete" button bouncing); transitions longer than 400 ms
  for utility interactions (feels sluggish); animating colors via
  `rgb()` (banding in dark transitions, use `oklch()` for
  perceptually-uniform interpolation); `animation-delay` without
  `animation-fill-mode: both` causing flicker before the first
  keyframe; transitions on a `display: none` toggle silently not
  firing (the property is discrete and needs `transition-behavior:
  allow-discrete` plus `@starting-style`); and `:hover`-only
  feedback with no `:focus-visible` equivalent leaving keyboard
  users with nothing.
  Covers the canonical timing tokens (100 ms feedback, 150 ms ease-
  out for hover, 200 to 250 ms entrance, 300 ms maximum for a
  large surface), the four canonical easing curves (Material
  `cubic-bezier(0.2, 0, 0, 1)` for standard ease-out, smooth pop
  `cubic-bezier(0.16, 1, 0.3, 1)` for entrances, `linear` for
  fixed-distance mechanical feedback, spring approximations via
  `@keyframes` for bouncy), the `:active` press-state compression
  (`transform: scale(0.97)` for buttons, `0.99` for cards), the
  cross-component choreography pattern via `:has()` (parent
  reactive to descendant hover/focus state), staggered children via
  custom-property index plus `transition-delay`, `@starting-style`
  (Baseline 2024) for entrance animations on first paint or post-
  `display: none`, `transition-behavior: allow-discrete` for
  animating `display`, `content-visibility`, and `overlay`, plus
  the WCAG 2.3.3 and 2.2.2 alignment of `prefers-reduced-motion:
  reduce`.
  Keywords: micro-interactions, hover transition, focus transition,
  press feedback, button press, scale 0.97, transition, animation,
  @keyframes, cubic-bezier, easing, easing function, ease-out,
  ease-in, linear, Material easing, smooth pop, spring easing,
  animation-delay, animation-fill-mode both, transition-delay,
  stagger, choreography, --index custom property,
  prefers-reduced-motion, reduced motion, vestibular,
  WCAG 2.3.3, WCAG 2.2.2, @starting-style, transition-behavior,
  allow-discrete, display transition, popover entrance animation,
  :has parent reactive, :focus-visible hover parity,
  animation jarring, transition not firing, motion makes me sick,
  stagger looks broken, hover feels flat, press has no feedback,
  motion does not respect setting, button does not feel good,
  display none does not animate,
  how to add hover animation, what easing should I use,
  how to respect reduced motion, how do I stagger a list,
  how to animate display none, how to make a button feel good
  to click, how to animate entrance, accessible motion.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Visual : Micro-Interactions

Authoritative reference for hover / focus / press feedback, motion choreography, and modern-CSS entry animations. The four primitives : explicit easing curves, compositor-only properties (`transform`, `opacity`, `filter`), `prefers-reduced-motion` collapse, and `@starting-style` + `transition-behavior: allow-discrete` for discrete-property transitions.

## Quick Reference

### Baseline status

| Feature | Baseline | Source |
|---|---|---|
| `transition`, `@keyframes`, `animation` | Widely Available | [MDN : transition](https://developer.mozilla.org/en-US/docs/Web/CSS/transition) (verified 2026-05-19) |
| `prefers-reduced-motion` | Widely Available since January 2020 | [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19) |
| `@starting-style` | Newly Available since August 2024 | [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19) |
| `transition-behavior: allow-discrete` | Newly Available since August 2024 | [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (verified 2026-05-19) |

### Timing tokens (memorize these)

| Token | Duration | Use |
|---|---|---|
| `--motion-instant` | 100 ms | press feedback, snap |
| `--motion-fast` | 150 ms | hover, focus on small UI |
| `--motion-base` | 200 ms | standard UI transition |
| `--motion-medium` | 250 ms | entrance / pop |
| `--motion-slow` | 300 ms | large surface enter / drawer slide |
| (avoid > 400 ms) | | feels sluggish for utility motion |

### Easing curves (memorize these)

| Curve | Value | Use |
|---|---|---|
| Material standard | `cubic-bezier(0.2, 0, 0, 1)` | default ease-out for hover, focus, state change |
| Smooth pop | `cubic-bezier(0.16, 1, 0.3, 1)` | entrances, list-item reveal |
| Linear | `linear` | fixed-distance mechanical feedback, progress bars |
| Spring (approximation) | via `@keyframes` with overshoot | playful entrance, NEVER on destructive actions |

NEVER write the bare `ease` keyword. The default `cubic-bezier(0.25, 0.1, 0.25, 1)` is visually flat and is the single biggest UX tell for "AI-generated CSS."

## Decision Trees

### Tree 1 : Which easing for this interaction?

```
Is it standard UI feedback (hover, focus, color change, opacity fade)?
   -> Material standard. cubic-bezier(0.2, 0, 0, 1), 150 to 200 ms.

Is it an entrance (popover open, toast appear, card slide-in)?
   -> Smooth pop. cubic-bezier(0.16, 1, 0.3, 1), 200 to 250 ms.

Is it mechanical / fixed-distance (progress bar fill, slider drag)?
   -> linear, 100 to 150 ms.

Should it feel playful (illustration reveal, success celebration)?
   -> @keyframes with overshoot. NEVER for destructive actions
      (delete, sign-out, lock). NEVER for serious-tone surfaces.

Default fallback when unsure?
   -> Material standard, 200 ms. Safe everywhere except spring contexts.
```

### Tree 2 : Stagger or parallel?

```
N items entering together at once (list reveal, card grid populate)?
   -> Stagger. transition-delay: calc(var(--index) * 50ms);
      Cap total stagger at ~400 ms (8 items at 50 ms). Beyond that, animation feels slow.

N items reacting to the same parent state (form validation, table row highlight)?
   -> Parallel. No delay. They all share the trigger so they should resolve together.

One element animating multiple properties (transform AND opacity)?
   -> Parallel within the element. Same duration, same easing.
      transition: transform 200ms ease-out, opacity 200ms ease-out;
```

### Tree 3 : `prefers-reduced-motion` collapse

```
Is the motion essential to convey information (a loading spinner, a progress bar)?
   YES -> keep, but reduce amplitude (slow pulse instead of spinning, opacity
          fade instead of scale).
   NO  -> next

Is the motion decorative or feedback (hover scale, entrance slide, micro-bounce)?
   YES -> inside @media (prefers-reduced-motion: reduce), collapse to
          opacity-only or remove entirely.
   NO  -> next

Is the motion vestibular-risk (parallax, large pan, zoom, multi-axis spin)?
   YES -> inside reduce, REMOVE entirely. Replace with static.

How to detect in JS?
   -> window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

## Patterns

### Pattern A : Button press feedback (canonical)

```css
.btn {
  background: var(--accent);
  color: var(--accent-fg);
  border: 0;
  border-radius: 6px;
  padding-block: 0.5rem;
  padding-inline: 1rem;
  cursor: pointer;
  transition:
    transform 100ms cubic-bezier(0.2, 0, 0, 1),
    background-color 150ms cubic-bezier(0.2, 0, 0, 1),
    box-shadow 150ms cubic-bezier(0.2, 0, 0, 1);
}

.btn:hover { background: color-mix(in oklch, var(--accent), white 8%); }

.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn:active { transform: scale(0.97); }

@media (prefers-reduced-motion: reduce) {
  .btn { transition: background-color 100ms linear; }
  .btn:active { transform: none; }
}
```

The press compression (`scale(0.97)`) is the haptic-like cue that makes a button feel "good to click." For card-sized surfaces, use `scale(0.99)`; for icon-only buttons, `scale(0.95)`.

### Pattern B : Card hover with `:has()` parent reactivity

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  transition:
    transform 200ms cubic-bezier(0.2, 0, 0, 1),
    box-shadow 200ms cubic-bezier(0.2, 0, 0, 1);
}

/* Parent reacts to any descendant button hover */
.card:has(.card-cta:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgb(0 0 0 / 0.08);
}

.card:has(:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .card:has(.card-cta:hover) { transform: none; box-shadow: 0 0 0 2px var(--accent); }
}
```

### Pattern C : Staggered list entrance via `--index`

```html
<ul class="list">
  <li style="--index: 0">First</li>
  <li style="--index: 1">Second</li>
  <li style="--index: 2">Third</li>
  <li style="--index: 3">Fourth</li>
</ul>
```

```css
.list li {
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 250ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: calc(var(--index, 0) * 50ms);
}

.list.is-revealed li {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .list li {
    transition: opacity 150ms linear;
    transform: none;
    transition-delay: 0ms;
  }
}
```

Trigger the entrance by adding `.is-revealed` (e.g., via `IntersectionObserver`). Stagger total = N * 50 ms; cap below 400 ms.

### Pattern D : Animate `display: none` -> visible via `@starting-style` + `allow-discrete`

```css
.tooltip {
  /* Default (closed / hidden) state */
  opacity: 0;
  transform: translateY(4px);
  display: none;

  transition:
    opacity   200ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
    display   200ms allow-discrete;
}

.tooltip.is-open {
  opacity: 1;
  transform: translateY(0);
  display: block;
}

/* Entrance starting values : applied for first transition only */
@starting-style {
  .tooltip.is-open {
    opacity: 0;
    transform: translateY(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: opacity 100ms linear, display 100ms allow-discrete;
    transform: none;
  }
  @starting-style { .tooltip.is-open { opacity: 0; transform: none; } }
}
```

Critical : `@starting-style` MUST come AFTER the `.tooltip.is-open` rule in source order (same specificity, source order decides). The `transition-behavior: allow-discrete` shorthand built into the `display 200ms allow-discrete` syntax tells the browser to flip `display` at the right point during the transition (immediately on enter, after exit duration).

### Pattern E : Keyboard parity for every hover style

```css
.link {
  color: var(--fg-muted);
  transition: color 150ms cubic-bezier(0.2, 0, 0, 1);
}

.link:hover,
.link:focus-visible {
  color: var(--accent);
}
```

Always pair `:hover` with `:focus-visible`. Selector list (`:hover, :focus-visible`) keeps the rules in one place and prevents drift.

### Pattern F : Color animation in OKLCH for perceptual uniformity

```css
.banner {
  background: oklch(60% 0.18 250);
  transition: background-color 200ms cubic-bezier(0.2, 0, 0, 1);
}

.banner.is-warning {
  background: oklch(70% 0.15 60);
}
```

Per [[frontend-syntax-css-color-modern]], color interpolation in OKLCH avoids the muddy gray transitions of `rgb()` because OKLCH is perceptually uniform.

## Out of Scope

- Scroll-driven animations and View Transitions API (covered in `[[frontend-impl-view-transitions-scroll-animations]]`).
- Compositor-only / GPU-friendly animation rules (covered in `[[frontend-perf-animation-gpu-containment]]`).
- Web Animations API JavaScript (`Element.animate()`); this skill is CSS-first.
- Framework animation libraries (Framer Motion, GSAP, Anime.js). This package is framework-agnostic.

## Hard Rules (Binding)

1. NEVER use the bare `ease` keyword. Always specify a `cubic-bezier(...)` or use `linear` for fixed-distance motion.
2. NEVER write `transition: all`. List explicit composite-safe properties (`transform`, `opacity`, color-only properties).
3. NEVER animate layout-trigger properties (`width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`, `box-shadow`) for hover / focus / press feedback. Use `transform` and `opacity`.
4. NEVER ship motion without a `@media (prefers-reduced-motion: reduce) { ... }` override. WCAG 2.3.3 Animation from Interactions applies.
5. NEVER style `:hover` without an equivalent `:focus-visible` rule. Keyboard users need the same feedback.
6. NEVER set bouncy / spring easing on destructive actions (Delete, Sign-out, Lock). The tone mismatch reads as untrustworthy.
7. NEVER exceed 400 ms for utility transitions. Beyond that, the UI feels sluggish. Reserve longer durations for large-surface entrances and only inside the `prefers-reduced-motion: no-preference` branch.
8. NEVER place `@starting-style` BEFORE its target rule. Same specificity = source order decides; the starting style must come after.

## Reference Links

- `references/methods.md` : easing-curve catalog, timing tokens, `@starting-style` + `allow-discrete` mechanics, stagger math
- `references/examples.md` : renderable HTML demo with button press, card `:has()` hover, staggered list (with reduced-motion variant)
- `references/anti-patterns.md` : 7 anti-patterns with symptom, root cause, fix
- [MDN : transition](https://developer.mozilla.org/en-US/docs/Web/CSS/transition) (verified 2026-05-19)
- [MDN : animation](https://developer.mozilla.org/en-US/docs/Web/CSS/animation) (verified 2026-05-19)
- [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19)
- [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (verified 2026-05-19)
- [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19)

## Cross-References

- `[[frontend-perf-animation-gpu-containment]]` : compositor-only properties, `will-change` cycle
- `[[frontend-errors-animation-jank]]` : diagnosing janky transitions in DevTools
- `[[frontend-syntax-css-has-selector]]` : parent-reactive choreography
- `[[frontend-syntax-css-color-modern]]` : OKLCH for perceptually-uniform color animation
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 2.3.3 and 2.2.2 motion criteria
- `[[frontend-impl-view-transitions-scroll-animations]]` : larger-scope animation primitives
