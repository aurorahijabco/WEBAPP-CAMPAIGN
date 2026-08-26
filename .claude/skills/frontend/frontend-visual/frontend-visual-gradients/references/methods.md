# Methods : CSS gradients

Sources : [MDN: linear-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient) (verified 2026-05-19), [MDN: conic-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/conic-gradient) (verified 2026-05-19), [MDN: `<gradient>`](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient) (verified 2026-05-19), [W3C: CSS Images Module Level 4](https://www.w3.org/TR/css-images-4/) (verified 2026-05-19), [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

## 1. Gradient family overview

| Function | Direction model | Baseline |
|----------|-----------------|----------|
| `linear-gradient(<direction>, <stops>)` | angle or `to <side-or-corner>` | Widely Available (July 2015) |
| `radial-gradient([<shape>] [<size>] at <position>, <stops>)` | shape + position | Widely Available (July 2015) |
| `conic-gradient([from <angle>] [at <position>], <stops>)` | sweep from angle around position | Widely Available (November 2020) |
| `repeating-linear-gradient(...)` | same args as linear | Widely Available |
| `repeating-radial-gradient(...)` | same args as radial | Widely Available |
| `repeating-conic-gradient(...)` | same args as conic | Widely Available |

All gradients are `<image>` values. They can be used anywhere an image is accepted (`background-image`, `border-image`, `mask-image`, `list-style-image`, etc.). They cannot be set on `background-color`.

## 2. `linear-gradient()` syntax

```
linear-gradient(
  [ <color-interpolation-method> ]?
  [ <direction> ]?,
  <color-stop-list>
)
```

| Token | Detail |
|-------|--------|
| `<color-interpolation-method>` | `in <colorspace>` optionally followed by a hue arc modifier. See §6. |
| `<direction>` | `<angle>` (e.g. `45deg`, `0.25turn`) OR `to <side-or-corner>` (`to top`, `to right top`, `to left bottom`, etc.). `0deg` = `to top`; `90deg` = `to right`; `180deg` = `to bottom`; `270deg` = `to left`. |
| `<color-stop-list>` | One or more colour stops, optionally separated by colour hints. See §5. |

Examples :

```css
linear-gradient(45deg, red, blue);
linear-gradient(to right, red, blue);
linear-gradient(in oklch to right, red, blue);
linear-gradient(0.25turn, #3f87a6, #ebf8e1, #f69d3c);
```

## 3. `radial-gradient()` syntax

```
radial-gradient(
  [ <color-interpolation-method> ]?
  [ <shape> ]? [ <size> ]? [ at <position> ]?,
  <color-stop-list>
)
```

| Token | Detail |
|-------|--------|
| `<shape>` | `circle` or `ellipse` (default). |
| `<size>` | `closest-side`, `farthest-side`, `closest-corner`, `farthest-corner` (default for ellipse), or an explicit `<length>` / `<length> <length>`. |
| `<position>` | `at <bg-position>` syntax; default `center`. |

Examples :

```css
radial-gradient(circle, red, blue);
radial-gradient(circle at 20% 30%, oklch(0.72 0.18 320), transparent 50%);
radial-gradient(ellipse closest-side at 50% 50%, white, black);
```

## 4. `conic-gradient()` syntax

```
conic-gradient(
  [ <color-interpolation-method> ]?
  [ from <angle> ]? [ at <position> ]?,
  <color-stop-list>
)
```

| Token | Detail |
|-------|--------|
| `from <angle>` | Starting angle measured clockwise from the top. Default `0deg`. |
| `at <position>` | Centre point. Default `center`. |
| Stops | Expressed in degrees (or `turn` / `rad` / `grad`) or percentages of the full sweep. |

Examples :

```css
conic-gradient(red, orange, yellow, green, blue, indigo, violet);
conic-gradient(from 45deg, blue, red);
conic-gradient(from 0deg at 50% 50%, red 0deg, orange 36deg 170deg, yellow 170deg);
```

## 5. Colour-stop forms

| Form | Effect |
|------|--------|
| `<color>` | Stop with implicit position (auto-distributed). |
| `<color> <position>` | Stop with explicit position (`0%`, `50%`, `100%`, or length for radial / angle for conic). |
| `<color> <position-1> <position-2>` | Stop spanning two positions (shorthand for two stops with the same colour); creates a hard transition zone. |
| `<color-hint>` (a bare `<percentage>` or `<length>` between two stops) | Shifts the perceived midpoint between the two surrounding stops. E.g. `linear-gradient(red, 30%, blue)` puts the visual midpoint at 30%. |

Hard-stop stripe example :

```css
linear-gradient(45deg, red 0 50%, blue 50% 100%);
```

The `red 0 50%` plus `blue 50% 100%` produces a sharp edge at 50%.

Midpoint hint example :

```css
linear-gradient(0.25turn, red, 10%, blue);
```

The blend feels weighted toward red.

## 6. Colour interpolation methods

Per [W3C: CSS Images Module Level 4](https://www.w3.org/TR/css-images-4/) (verified 2026-05-19) and [MDN: linear-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient) (verified 2026-05-19), Baseline 2024.

```
<color-interpolation-method> = in <colorspace> [ <hue-interpolation-method> ]?
```

### Rectangular colour spaces

| Space | Notes |
|-------|-------|
| `srgb` | Default; legacy; produces dull / grey midpoints between vivid endpoints. |
| `srgb-linear` | Linear-light sRGB; avoids the gamma-related midpoint dimming. |
| `lab` | Perceptual rectangular; older standard. |
| `oklab` | Perceptual rectangular; preferred for tints, shades, and general blends. |
| `display-p3`, `rec2020`, `xyz`, `xyz-d50`, `xyz-d65`, `a98-rgb`, `prophoto-rgb` | Wide-gamut / interchange spaces; specialised uses. |

### Polar colour spaces (support hue arc modifier)

| Space | Notes |
|-------|-------|
| `hsl` | Legacy cylindrical sRGB. Hue 0 = red. |
| `hwb` | Hue + whiteness + blackness. |
| `lch` | Perceptual polar; older standard. |
| `oklch` | Perceptual polar; preferred for hue-driven gradients and palette-aware blends. |

### Hue arc modifiers

| Modifier | Effect |
|----------|--------|
| `shorter hue` (default) | Travel via the shorter arc between endpoint hues. |
| `longer hue` | Travel via the longer arc; produces full-spectrum rainbows when the endpoints are near each other. |
| `increasing hue` | Always increase hue angle. |
| `decreasing hue` | Always decrease hue angle. |

Examples :

```css
linear-gradient(in oklab, blue, yellow);
linear-gradient(in oklch shorter hue, red, blue);
linear-gradient(in oklch longer hue, red, blue);
conic-gradient(in hsl longer hue, hsl(0 100% 50%), hsl(0 100% 50%));
```

The last example is the colour-wheel-around technique : same start and end hue, but the `longer hue` arc forces the gradient to traverse the entire wheel.

## 7. Layered gradients

`background-image` accepts a comma-separated list of images; later items paint under earlier items. The classic mesh emulation :

```css
background:
  radial-gradient(circle at 20% 30%, oklch(0.78 0.18 320) 0%, transparent 50%),
  radial-gradient(circle at 80% 30%, oklch(0.78 0.18 220) 0%, transparent 55%),
  radial-gradient(circle at 50% 80%, oklch(0.78 0.18 130) 0%, transparent 60%),
  oklch(0.95 0.02 240);
```

The trailing solid colour is the BASE; layers above tint it.

## 8. `repeating-*` variants

Replace the closing `100%` stop (which is implicit if omitted) with a finite repeat unit. Anything beyond the last stop tiles.

```css
/* Diagonal stripes, 10px wide */
repeating-linear-gradient(45deg, #eee 0 10px, #fff 10px 20px);

/* Concentric rings, every 20px */
repeating-radial-gradient(circle, #4d4dff 0 20px, #ff66cc 20px 40px);

/* Pie slices, every 30deg */
repeating-conic-gradient(from 0deg, #eee 0 30deg, #fff 30deg 60deg);
```

NEVER use `repeating-conic-gradient` with stops greater than 360deg ; the spec ignores the excess.

## 9. Animating gradients

Two valid approaches.

**A. Typed custom property + `@property`**

```css
@property --grad-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.hero {
  background: linear-gradient(var(--grad-angle), #4d4dff, #ff66cc);
  animation: spin 14s linear infinite;
}
@keyframes spin { to { --grad-angle: 360deg; } }
```

Without `@property` the custom property is interpolation-opaque; the angle snaps at the cycle boundary. Per [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19), Baseline 2024 (July).

**B. `background-position` shift on an oversize gradient**

```css
.banner {
  background: linear-gradient(in oklch 90deg, oklch(0.65 0.18 250), oklch(0.72 0.20 320), oklch(0.65 0.18 250));
  background-size: 200% 100%;
  animation: shift 6s linear infinite;
}
@keyframes shift { from { background-position: 0% 0%; } to { background-position: 200% 0%; } }
```

`background-position` animation triggers paint per frame on the painted area; budget paint cost. Approach A is cheaper for rotation; approach B is appropriate for sweep effects.

ALWAYS gate animated gradients with `@media (prefers-reduced-motion: reduce) { ... animation: none; }`.

## 10. Gradient on text

```css
.headline {
  background: linear-gradient(in oklch 90deg, oklch(0.6 0.2 250), oklch(0.65 0.22 320));
  background-clip: text;
  color: transparent;
}
```

The text glyphs act as a mask over the background. Provide a fallback `color` if older engines without `background-clip: text` matter ; use `@supports not (background-clip: text)` to switch.

## 11. Performance notes

| Concern | Note |
|---------|------|
| Number of stops | A 30-stop gradient does NOT smooth out banding more than a 3-stop gradient with `in oklch`. The colour-interpolation hint is the right tool ; more stops increase paint cost without quality gain. |
| Gradient surface size | Paint cost scales with surface area. A 100vh hero gradient with `background-attachment: fixed` re-paints on every scroll frame on mobile (catastrophic). Avoid `fixed`. |
| Layered gradients | Each layer adds paint work. Mesh-emulation with 4 radial layers is typically fine ; 12 layers is not. |
| Animated `background-position` | Paints per frame across the whole painted area. Prefer a transformed overlay when possible. |
| `will-change: background` | Hint allowed but rarely useful ; `will-change` does not promote gradient painting to the compositor in the same way it promotes `transform`. |

## 12. Accessibility for informative gradients

A gradient that conveys information (pie chart slice values, status colour ramp) is invisible to screen readers. Per [MDN: conic-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/conic-gradient) (verified 2026-05-19) :

```html
<div role="img" aria-label="Sales breakdown: 40% Q1, 35% Q2, 25% Q3">
  <div class="pie"></div>
</div>
```

Decorative gradients (hero backgrounds, soft tints) need no ARIA.
