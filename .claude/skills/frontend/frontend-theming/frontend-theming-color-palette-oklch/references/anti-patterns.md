# Anti-Patterns : OKLCH palette generation

Each entry : symptom (what the user / developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19), [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19), [W3C: CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19), [W3C: WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

## Anti-pattern 1 : hardcoded hex throughout the codebase

```css
.button-primary  { background: #3b82f6; }
.link            { color: #3b82f6; }
.brand-icon path { fill: #3b82f6; }
```

Symptom : a brand refresh touches dozens of files; one file is missed and a single rogue blue stays in the rebrand. Designers cannot iterate on the palette without engineering involvement.

Root cause : no tokenisation. Each colour use carries the value directly.

Fix : declare ONE seed and emit the 11-step ladder. Every component references the ladder by name :

```css
:root { --brand-seed: oklch(0.62 0.18 250); /* + ladder */ }
.button-primary  { background: var(--brand-600); }
.link            { color: var(--brand-700); }
.brand-icon path { fill: var(--brand-600); }
```

A brand refresh changes `--brand-seed` only.

## Anti-pattern 2 : HSL-derived shade ladder

```css
/* anti-pattern */
:root {
  --brand-500: hsl(217 91% 60%);
  --brand-400: hsl(217 91% 70%);
  --brand-300: hsl(217 91% 80%);
}
```

Symptom : the ladder looks fine for the brand hue but visually uneven when applied to other hues (yellows look glaringly bright, blues look muddy at the same `lightness`). Hovering between adjacent shades feels jumpy.

Root cause : HSL's `lightness` is a geometric value in cylindrical sRGB; the same numeric lightness produces different PERCEIVED brightness across hues. Per [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19) and [W3C: CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19), OKLCH's L axis is designed for perceptual uniformity.

Fix : rebuild the ladder in OKLCH using a single seed and the L map in [methods.md](methods.md#3-standard-11-step-l-ladder). The same L delta now produces the same visible brightness change for every hue.

## Anti-pattern 3 : single-tier tokens (brand colour = button colour)

```css
/* anti-pattern */
.button-primary { background: var(--brand-blue); }
```

Symptom : the design system needs an emergency "danger" button; the brand colour is the wrong fit but every button references `--brand-blue`. Refactor cost is high because the binding is implicit.

Root cause : tier conflation. The component binds directly to a primitive token instead of a semantic role token.

Fix : insert a tier-2 semantic token.

```css
:root {
  --brand-blue: oklch(0.62 0.18 250);
  --color-action-primary: var(--brand-blue);  /* role binding */
}
.button-primary { background: var(--color-action-primary); }
```

Adding a "danger" variant now means binding `--color-action-danger` to a different shade ladder; the button does not need to know which colour stack drives it.

## Anti-pattern 4 : transitioning an untyped `--color`

```css
/* anti-pattern */
:root { --tint: oklch(0.62 0.18 250); }
.hero { background: var(--tint); transition: --tint 400ms; }
.hero[data-state="alt"] { --tint: oklch(0.45 0.18 250); }
```

Symptom : the background snaps instantly between colours; no fade.

Root cause : an unregistered CSS custom property is interpolation-opaque. The browser does not know the property's type and cannot compute intermediate values.

Fix : register with `@property`.

```css
@property --tint {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(0.62 0.18 250);
}
```

The transition now interpolates colour smoothly.

## Anti-pattern 5 : assuming L = 0.50 is the perceptual middle for every hue

Symptom : a ladder built with L 0.50 at the middle step has yellow looking too bright and blue looking too dark; the "balanced" perception varies per hue.

Root cause : OKLCH's L is perceptually uniform PER-HUE, but the human eye's response curve still has hue dependencies (yellow appears brighter at the same L than blue, because of additional cone-response effects). The perceived "middle" of a hue is not necessarily L 0.50.

Fix : pick step L values from observation. The 11-step map in [methods.md](methods.md#3-standard-11-step-l-ladder) uses L 0.620 as the seed reference (slightly above geometric middle) because that L feels like the "natural" anchor for mid-chroma hues. Tune per project; verify by laying out adjacent hues at the same step and checking visual balance.

## Anti-pattern 6 : constant max chroma across all L

```css
/* anti-pattern */
:root {
  --brand-50:  oklch(0.985 0.18 250); /* chroma 0.18 at L 0.985 = washed neon */
  --brand-950: oklch(0.205 0.18 250); /* chroma 0.18 at L 0.205 = clips for some hues */
}
```

Symptom : the very-light steps look like neon highlighter; the very-dark steps look muddy or render unpredictably (the browser clips out-of-gamut colours).

Root cause : per [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19), the maximum chroma supported at a given (L, hue) pair varies. High chroma at L 0.98 looks neon because the human eye perceives more chroma signal in light regions; high chroma at low L falls outside the sRGB gamut for many hues and clips.

Fix : taper chroma at the extremes. Multiply seed chroma by approximately 0.08 at step 50, 0.16 at 100, 0.35 at 200, 0.55 at 300, 0.80 at 400, full at 500-700, then 0.95 at 700, 0.85 at 800, 0.70 at 900, 0.55 at 950 (see [methods.md](methods.md#3-standard-11-step-l-ladder)).

## Anti-pattern 7 : missing sRGB fallback for display-p3

```css
/* anti-pattern */
:root { --accent: oklch(0.72 0.30 320); } /* outside sRGB for this hue */
```

Symptom : on a P3 monitor the colour is vivid and as designed. On an sRGB monitor the colour clips and renders as a muted, sometimes unrecognisable shade. Designs reviewed on the designer's wide-gamut display ship with the wrong colour on most users' screens.

Root cause : `oklch(0.72 0.30 320)` exceeds the sRGB gamut. Browsers gamut-map to sRGB by clipping; the resulting hex value is hardware-dependent.

Fix : ship the sRGB-safe value as the default and the wide-gamut value behind a `@supports` gate.

```css
:root { --accent: oklch(0.62 0.18 250); }
@supports (color: color(display-p3 1 0 0)) {
  :root { --accent: oklch(0.72 0.30 320); }
}
```

The detector check `color(display-p3 1 0 0)` is the standard sniff for P3 support.

## Anti-pattern 8 : `color-mix(in srgb, ...)` instead of `in oklch`

```css
/* anti-pattern */
.tint { background: color-mix(in srgb, var(--brand-500), white); }
```

Symptom : tinted variants look darker / greyer / more muted than expected; the white blend does not feel like a clean tint.

Root cause : per [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19) : "Avoid `srgb` ... neither linear-light nor perceptually uniform, produces darker/grayish mixes."

Fix : use a perceptual or linear-light space.

```css
.tint { background: color-mix(in oklch, var(--brand-500) 80%, white); }
```

For most palette-construction work, `in oklch` (preserves chroma through the mix) or `in oklab` (perceptually-uniform linear axes) is the right choice.

## Anti-pattern 9 : contrast pairs picked from the ladder without measurement

```css
.notice { background: var(--brand-300); color: var(--brand-600); }
```

Symptom : the design ships and a routine accessibility audit flags the notice element as 2.8:1, below the AA 4.5:1 threshold for normal text.

Root cause : the ladder gives PREDICTABLE contrast (the same step pair behaves similarly across hues), but the exact ratio depends on the seed's chroma and hue. Step pairs that work for one hue may fail by a small margin for another.

Fix : verify every shipped pair with a real measurement tool (DevTools picker, axe, Stark) per [W3C: WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19) :

- Normal text : >= 4.5:1.
- Large text (>= 18pt or >= 14pt bold) : >= 3:1.
- UI components and graphical objects (SC 1.4.11) : >= 3:1.

Treat the contrast pair table in SKILL.md as a hypothesis to verify, not a guarantee.
