# References : Micro-Interactions Catalog

Verified against [MDN : transition](https://developer.mozilla.org/en-US/docs/Web/CSS/transition) (2026-05-19), [MDN : animation](https://developer.mozilla.org/en-US/docs/Web/CSS/animation) (2026-05-19), [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (2026-05-19), [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (2026-05-19), [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (2026-05-19), [W3C : CSS Transitions Level 1](https://www.w3.org/TR/css-transitions-1/).

## 1. Easing-curve Catalog

| Name | Value | When |
|---|---|---|
| Material standard | `cubic-bezier(0.2, 0, 0, 1)` | Default ease-out for hover, focus, color change, opacity fade |
| Smooth pop | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances : popover open, toast appear, list reveal |
| Sharp out | `cubic-bezier(0.4, 0, 1, 1)` | Exits where speed-up is wanted |
| Linear | `linear` | Progress bars, slider drag, fixed-distance mechanical |
| `steps(N, end)` | discrete | Sprite animations, counter ticks |

Bare `ease`, `ease-in`, `ease-out`, `ease-in-out` all map to fixed cubic-bezier values defined by the spec but are visually flat. NEVER use them in production.

## 2. Timing Tokens

| Token | ms | Use |
|---|---|---|
| instant | 100 | Press feedback, snap to position |
| fast | 150 | Hover, focus, small color change |
| base | 200 | Standard UI state transition |
| medium | 250 | Entrance / pop |
| slow | 300 | Large surface (drawer, modal) enter / exit |
| (limit) | 400 | Maximum for utility motion; beyond feels sluggish |

Implement as CSS custom properties on `:root` :

```css
:root {
  --motion-instant: 100ms;
  --motion-fast:    150ms;
  --motion-base:    200ms;
  --motion-medium:  250ms;
  --motion-slow:    300ms;

  --easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --easing-pop:      cubic-bezier(0.16, 1, 0.3, 1);
  --easing-exit:     cubic-bezier(0.4, 0, 1, 1);
}
```

## 3. `transition` Shorthand

```css
/* property | duration | timing-function | delay */
transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1) 0ms;

/* Multiple properties */
transition:
  transform 200ms cubic-bezier(0.2, 0, 0, 1),
  opacity   200ms cubic-bezier(0.2, 0, 0, 1);
```

| Sub-property | Default |
|---|---|
| `transition-property` | `all` (anti-pattern; always set explicit list) |
| `transition-duration` | `0s` (no animation) |
| `transition-timing-function` | `ease` (anti-pattern; always set explicit cubic-bezier) |
| `transition-delay` | `0s` |
| `transition-behavior` | `normal` (anti-pattern for `display` / `overlay` transitions; use `allow-discrete`) |

## 4. `transition-behavior: allow-discrete`

Per [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (verified 2026-05-19) :

| Value | Effect |
|---|---|
| `normal` (default) | Transitions do NOT start for discrete properties |
| `allow-discrete` | Transitions DO start for discrete properties (`display`, `content-visibility`, `overlay`) |

### Timing semantics

| Going TO discrete value | Flip happens |
|---|---|
| To `display: none` or `content-visibility: hidden` | At 100% of duration (element stays visible throughout) |
| From `display: none` or `content-visibility: hidden` | At 0% of duration (element becomes visible immediately, animates rest) |
| Other discrete property changes | At 50% of duration |

### Shorthand sugar

```css
transition: display 200ms allow-discrete;
/* equivalent to */
transition-property: display;
transition-duration: 200ms;
transition-behavior: allow-discrete;
```

## 5. `@starting-style`

Per [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19).

### 5.1 Two forms

```css
/* Standalone */
@starting-style {
  .tooltip.is-open {
    opacity: 0;
    transform: translateY(4px);
  }
}

/* Nested */
.tooltip.is-open {
  opacity: 1;
  @starting-style {
    opacity: 0;
  }
}
```

### 5.2 When it fires

- First style update after element enters the DOM.
- Transition out of `display: none` to a visible value.
- Transition into the top layer (popover open, `<dialog>.showModal()`).

### 5.3 Specificity rule (CRITICAL)

`@starting-style` and the original rule have the SAME specificity. To ensure starting styles apply, the `@starting-style` rule MUST be placed AFTER the original rule in source order. Reverse order = original rule wins, no animation.

### 5.4 NOT needed for `@keyframes` / `animation`

`@starting-style` applies only to `transition`. If implementing entry effects via `animation: ... forwards`, `@starting-style` is unnecessary.

## 6. `@keyframes` for Bouncy / Spring

```css
@keyframes spring-in {
  0%   { opacity: 0; transform: translateY(8px) scale(0.96); }
  60%  { opacity: 1; transform: translateY(-2px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.celebrate {
  animation: spring-in 350ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

The `both` value of `animation-fill-mode` is shorthand for `forwards backwards` : retains start state before play, retains end state after. NEVER set `animation-delay` without `animation-fill-mode: both` (or `forwards`), or the element flickers before the first keyframe applies.

### 6.1 `animation-fill-mode` values

| Value | Pre-animation | Post-animation |
|---|---|---|
| `none` (default) | Computed style | Computed style |
| `forwards` | Computed style | Last keyframe |
| `backwards` | First keyframe | Computed style |
| `both` | First keyframe | Last keyframe |

## 7. Stagger Math

```css
.list li {
  transition-delay: calc(var(--index, 0) * 50ms);
}
```

| Items | Delay step | Total stagger | Verdict |
|---|---|---|---|
| 4 | 50 ms | 150 ms | crisp |
| 8 | 50 ms | 350 ms | sweet spot |
| 12 | 50 ms | 550 ms | feels slow |
| 8 | 30 ms | 210 ms | snappy |
| 4 | 100 ms | 300 ms | playful |

Rule of thumb : cap total stagger at ~400 ms. Beyond, reduce per-item delay or drop the stagger.

## 8. `prefers-reduced-motion` collapse strategies

| Original motion | Reduced variant |
|---|---|
| Hover `transform: translateY(-2px)` | Remove transform, keep color change |
| Entrance `translateY + opacity` | Opacity-only |
| Stagger `transition-delay: calc(var(--i) * 50ms)` | `transition-delay: 0ms`, all animate together |
| Pulse `transform: scale(1) -> scale(1.1)` | `opacity: 1 -> 0.6 -> 1` |
| Pan / zoom / parallax | Static |
| Spin / rotate | Static, OR replace with opacity blink |

### JavaScript access

```js
const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
if (mql.matches) { /* skip the playful entrance */ }
mql.addEventListener('change', refresh);
```

### WCAG alignment

Per [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19) :

- WCAG 2.3.3 Animation from Interactions (AAA) : interaction-triggered motion can be disabled.
- WCAG 2.2.2 Pause, Stop, Hide (A) : auto-starting animation > 5s must be pausable.

## 9. Cross-component choreography via `:has()`

```css
/* Parent reacts to descendant hover */
.card:has(.cta:hover) { transform: translateY(-2px); }

/* Parent reacts to descendant focus */
.card:has(:focus-visible) { outline: 2px solid var(--accent); }

/* Sibling reacts (sibling combinator inside :has() ) */
.tabs:has(:focus-visible) .keyboard-hint { opacity: 1; }
```

Per `[[frontend-syntax-css-has-selector]]`, anchor `:has()` on the smallest possible subtree for performance. NEVER `body:has(...)` for hover-driven choreography.

## 10. Cross-References

- `[[frontend-syntax-css-has-selector]]` : `:has()` performance and patterns
- `[[frontend-syntax-css-color-modern]]` : OKLCH for perceptual color animation
- `[[frontend-perf-animation-gpu-containment]]` : compositor-only properties, `will-change`
- `[[frontend-errors-animation-jank]]` : diagnosing janky transitions
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 2.3.3, 2.2.2 motion criteria
- `[[frontend-impl-view-transitions-scroll-animations]]` : View Transitions, scroll-driven animations
