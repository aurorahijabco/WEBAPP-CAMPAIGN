# Anti-patterns : modern CSS color

Anti-patterns documented per role-builder spec. Each entry : symptom + root cause + fix.

## AP-1 : Using `hsl()` for systematic palette generation

- **Symptom** : palette levels look perceptually uneven (some swatches feel much darker / lighter than the lightness number suggests). Brand teams complain "the blue and the yellow at the same lightness look wrong."
- **Root cause** : `hsl()` lightness is computed in sRGB, which is not perceptually uniform. Equal numerical L values across different hues produce visually inconsistent results because human vision weights green much more than blue.
- **Fix** : use `oklch()` for systematic palettes. The L axis in OKLCH is perceptual lightness, so `oklch(70% 0.15 30)` and `oklch(70% 0.15 240)` appear at the same visual lightness. Verify with [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19).

## AP-2 : `color-mix(in srgb, ...)` when perceptual mixing is needed

- **Symptom** : intermediate stops in a generated gradient or hover-state mix look muddy / grey, especially at the midpoint between two saturated colors.
- **Root cause** : sRGB color space mixes linearly in gamma-encoded space, which compresses midtones and produces dull intermediates.
- **Fix** : use `color-mix(in oklab, <c1> 50%, <c2> 50%)` or `color-mix(in oklch, ...)`. Perceptual color spaces preserve vibrance through the mix. See [MDN : color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19).

## AP-3 : `light-dark()` without setting `color-scheme`

- **Symptom** : `light-dark(white, black)` always returns the first value regardless of user preference. Dark mode appears broken.
- **Root cause** : `light-dark()` resolves against the element's computed `color-scheme` property. Without an explicit `color-scheme: light dark` declaration, the browser does not know the element opts into both schemes and falls back to the light value.
- **Fix** : declare `:root { color-scheme: light dark; }` (or per-element when scoped). Verify via [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (verified 2026-05-19).

## AP-4 : Wide-gamut color without sRGB fallback

- **Symptom** : on non-P3 displays, branded color appears as black, white, or transparent because the color value is unparseable.
- **Root cause** : `color(display-p3 1 0 0)` shipped without a paired fallback. Browsers that do not support display-p3 (rare in 2026 but legacy hardware exists) cannot resolve it. The browser silently drops the declaration.
- **Fix** : always pair wide-gamut with sRGB fallback in cascade order. Example :
  ```css
  .brand { background: #ff3344; /* sRGB fallback */ }
  .brand { background: color(display-p3 1 0.2 0.27); /* P3 enhancement */ }
  ```
  Or use `@supports (color: color(display-p3 0 0 0))` to gate. Cross-reference [W3C : CSS Color 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19).

## AP-5 : Relative-color syntax producing out-of-gamut chroma

- **Symptom** : `oklch(from var(--brand) calc(l + 0.2) c h)` produces an unexpected muted color on bright brand hues. Browsers clamp the chroma silently.
- **Root cause** : at high lightness levels, the OKLCH gamut shrinks. Pushing chroma constant while raising lightness can exceed the displayable gamut for that hue. Browsers clip to the nearest in-gamut color, which can lose saturation.
- **Fix** : compute chroma as a function of lightness, not constant. Use `calc(c * (1 - (l - 0.5) * 0.4))` style scaling, or test each step against [CSS Color 4 gamut clipping rules](https://www.w3.org/TR/css-color-4/#binsearch). Validate visually : never assume relative-color output without inspecting.

## AP-6 : Mixing colors without specifying an interpolation method on polar spaces

- **Symptom** : a gradient between two hues takes the long way around the color wheel (red to green via brown instead of via yellow), producing an unexpected midpoint.
- **Root cause** : polar color spaces (`hsl`, `hwb`, `lch`, `oklch`) interpolate hue along a circle. The default is `shorter hue`, but author expectation often differs when the two hues are nearly opposite.
- **Fix** : be explicit. `color-mix(in oklch longer hue, red, green)` vs `color-mix(in oklch shorter hue, red, green)` produce visually different intermediates. Document the choice in design tokens. See [W3C : CSS Color 5](https://www.w3.org/TR/css-color-5/) (verified 2026-05-19) for the hue-interpolation specification.
