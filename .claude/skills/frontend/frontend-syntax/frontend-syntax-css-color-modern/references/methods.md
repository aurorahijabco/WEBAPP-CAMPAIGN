# Methods Reference : frontend-syntax-css-color-modern

Complete API surface for native CSS color in 2026. ALWAYS cite a row below when writing color code ; NEVER fabricate component names from training data.

## 1. `oklch()` and `oklab()` syntax

Per [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19) and [W3C : CSS Color 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19) :

```
oklch( <L> <C> <H> [ / <alpha> ]? )
oklab( <L> <A> <B> [ / <alpha> ]? )
```

| Component | Type | Range | Notes |
|-----------|------|-------|-------|
| `L` (oklch + oklab) | number or percentage | 0..1 or 0%..100% | Perceptual lightness. 0 = black, 1 = white. The percentage form is the same value (50% == 0.5). |
| `C` (oklch only) | number or percentage | 0..approximately 0.4 (100% = 0.4) | Chroma (saturation). 0 = neutral gray; high values clip if out of gamut. |
| `H` (oklch only) | number, angle, or `none` | 0..360 degrees (or `<angle>`) | Hue. `none` treated as 0. |
| `A` (oklab only) | number or percentage | -0.4..0.4 (100% = 0.4) | Green to red. |
| `B` (oklab only) | number or percentage | -0.4..0.4 (100% = 0.4) | Blue to yellow. |
| `alpha` | number or percentage | 0..1 or 0%..100% | Optional, prefixed by `/`. Default 1. |

### Examples

```css
.solid    { color: oklch(60% 0.22 290); }
.subtle   { color: oklch(60% 0.05 290); }
.glass    { background: oklch(60% 0.22 290 / 0.4); }
.with-units { color: oklch(0.6 0.22 290deg); }
.lab      { color: oklab(0.6 0.15 -0.12); }
```

### Baseline status

Both `oklch()` and `oklab()` are Baseline Widely Available since May 2023.

## 2. Relative color syntax

Per [W3C : CSS Color 5](https://www.w3.org/TR/css-color-5/) (verified 2026-05-19), Baseline Widely Available since May 2023 alongside `oklch()`.

```
oklch( from <color> <L-expr> <C-expr> <H-expr> [ / <alpha-expr> ]? )
oklab( from <color> <L-expr> <A-expr> <B-expr> [ / <alpha-expr> ]? )
```

The source color is decomposed into its components, which become readable by name inside the function. Inside `oklch( from ... )` the available names are `l`, `c`, `h`, `alpha`. Inside `oklab( from ... )` they are `l`, `a`, `b`, `alpha`. Each component slot accepts the name directly, a literal value, or a `calc()` expression.

### Component-expression rules

| Slot | Accepts | Notes |
|------|---------|-------|
| `<L-expr>` | name `l`, number 0..1, percentage 0%..100%, calc() | calc() must produce a number or percentage |
| `<C-expr>` | name `c`, number 0..0.4, percentage 0%..100%, calc() | clipped to gamut |
| `<H-expr>` | name `h`, number 0..360, angle, calc() | calc() result MUST be unitless or angle |
| `<alpha-expr>` | name `alpha`, number 0..1, percentage 0%..100%, calc() | optional |

### Cross-space relative colors

The source color can be in any color space, but the components are read in the OUTER function's space. `oklch(from rgb(123 45 67) l c h)` first converts `rgb(...)` to `oklch`, then exposes the converted L/C/H.

### Animatable relative-color expressions

Static use is universally supported. Animating the result requires registering the underlying custom property as a typed `@property` (see `[[frontend-theming-color-palette-oklch]]` for the full pattern).

## 3. `color-mix()` syntax

Per [MDN : color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (verified 2026-05-19), Baseline Widely Available since May 2023.

```
color-mix( in <colorspace> [ <hue-interpolation> ]?, <color> [<percentage>]?, <color> [<percentage>]? )
```

### Color spaces (eleven)

| Space | Type | Notes |
|-------|------|-------|
| `srgb` | rectangular | Legacy sRGB; goes through gray for opposing hues |
| `srgb-linear` | rectangular | Linear-light sRGB; better for additive blends |
| `display-p3` | rectangular | Wide gamut; preserves vivid colors |
| `lab` | rectangular | CIELAB; perceptually uniform, gamut-independent |
| `oklab` | rectangular | Improved Lab; default rectangular for design systems |
| `rec2020` | rectangular | UHD-TV gamut; widest practical |
| `xyz` | rectangular | XYZ (D65); base color space |
| `xyz-d50` | rectangular | XYZ D50 white point |
| `xyz-d65` | rectangular | XYZ D65 white point |
| `hsl` | polar | Legacy; perceptually non-uniform |
| `hwb` | polar | Legacy; same H as hsl |
| `lch` | polar | CIELCH; polar form of lab |
| `oklch` | polar | Default polar for design systems |

For design-system blends ALWAYS choose `oklch` or `oklab`. `srgb` mixing produces muddy intermediates (white + blue goes through pale violet then gray). `hsl` mixing produces non-uniform-brightness intermediates.

### Hue-interpolation modifiers (polar spaces only)

| Modifier | Behavior |
|----------|----------|
| `shorter hue` (default) | Take the shortest arc around the color wheel |
| `longer hue` | Take the longer arc; produces rainbow sweeps |
| `increasing hue` | Monotonically increase the hue angle |
| `decreasing hue` | Monotonically decrease the hue angle |

### Percentage rules

| Form | Behavior |
|------|----------|
| `color-mix(in oklch, A, B)` | 50% / 50% |
| `color-mix(in oklch, A 70%, B)` | 70% A + 30% B |
| `color-mix(in oklch, A, B 30%)` | 70% A + 30% B (same as above) |
| `color-mix(in oklch, A 40%, B 40%)` | sum < 100% : result has alpha 0.8 |
| `color-mix(in oklch, A 70%, B 70%)` | sum > 100% : normalized to 50% / 50% relative weights |

## 4. `light-dark()` and `color-scheme`

Per [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (verified 2026-05-19), Baseline Newly Available since May 2024.

```
light-dark( <value-when-light>, <value-when-dark> )
```

The function accepts ANY value the property accepts (colors, images, gradients), not only colors. The function resolves to its first argument when the effective color scheme is `light`, to its second argument when `dark`.

### `color-scheme` prerequisite

`light-dark()` requires `color-scheme` to be declared on a relevant ancestor (typically `:root`). The accepted values are :

| Value | Meaning |
|-------|---------|
| `normal` (default) | UA decides; effectively `light` for most pages |
| `light` | Only the light scheme |
| `dark` | Only the dark scheme |
| `light dark` | Both schemes supported; effective scheme follows the user agent |
| `only light` | Force light; system override ignored |
| `only dark` | Force dark; system override ignored |

WITHOUT a non-normal `color-scheme`, `light-dark()` silently uses the LIGHT value. ALWAYS declare `color-scheme: light dark;` on `:root` when using `light-dark()`.

### Switching themes by user override

A wrapper element can override the effective color scheme :

```css
[data-theme="light"] { color-scheme: light; }
[data-theme="dark"]  { color-scheme: dark; }
```

`light-dark()` inside descendants resolves based on the wrapper's effective scheme.

## 5. Wide-gamut color : `color()` function

Per [W3C : CSS Color 4](https://www.w3.org/TR/css-color-4/) (verified 2026-05-19) :

```
color( <colorspace-id> <c1> <c2> <c3> [ / <alpha> ]? )
```

| Color-space id | Description |
|----------------|-------------|
| `srgb` | sRGB; components 0..1 |
| `srgb-linear` | Linear-light sRGB |
| `display-p3` | Apple Display-P3; wider than sRGB |
| `rec2020` | UHD-TV; wider than P3 |
| `a98-rgb` | Adobe RGB 1998 |
| `prophoto-rgb` | ProPhoto RGB |
| `xyz` | CIE XYZ (D65) |
| `xyz-d50` | XYZ D50 |
| `xyz-d65` | XYZ D65 |
| `lab-d50` | CIELAB D50 |

Component values are typically 0..1 floats. Component values can be `none` (treated as 0 in calculations) or percentages.

### `@media (color-gamut)` query

| Value | Matches when |
|-------|--------------|
| `srgb` | Display reproduces at least sRGB (almost all displays) |
| `p3` | Display reproduces at least P3 (modern Apple, many laptops) |
| `rec2020` | Display reproduces at least Rec2020 (high-end HDR displays) |

ALWAYS provide a sRGB-gamut fallback for wide-gamut colors. The browser's gamut-mapping algorithm clips out-of-gamut colors but the clipped result often loses chroma noticeably ; a hand-authored `oklch()` within sRGB looks cleaner than an auto-clipped `display-p3` color on a sRGB display.

## 6. `@supports` patterns for color features

```css
@supports (color: oklch(50% 0.1 0)) {
  /* oklch() is supported */
}

@supports (color: color(display-p3 1 0 0)) {
  /* color() function is supported */
}

@supports (color: light-dark(black, white)) {
  /* light-dark() is supported */
}
```

ALWAYS author fallback rules OUTSIDE the `@supports` block and the modern rules INSIDE. The cascade picks the modern rule when supported and the fallback when not.

## 7. Color-mix gamut clamping

The `color-mix()` function can produce a color that is in-gamut for the chosen color space but out-of-gamut for the destination. The browser handles this by gamut-mapping at render time. To force the result into sRGB ahead of time :

```css
.safe { color: color-mix(in oklch, oklch(70% 0.4 30), white 0%); }
```

The mix-with-white at 0% forces a re-emission through `oklch` ; combined with the browser's gamut-mapping when rendering to sRGB, this clamps the vivid color to its closest in-gamut neighbor. The `color-mix(in srgb, <color>, transparent 0%)` idiom forces conversion to sRGB color space.

## 8. Behavior notes per color space

| Mixing space | Goes-through (for opposing hues) | Use case |
|--------------|------------------------------------|----------|
| `srgb` | gray | NEVER for design system blends |
| `srgb-linear` | brighter gray | Photographic compositing |
| `oklab` | uniform-brightness intermediate | Default for blends |
| `oklch` | uniform-brightness intermediate; rainbow path with `longer hue` | Default for gradient stops |
| `hsl` | medium-brightness intermediate, non-uniform | Legacy palettes |
| `lab` | similar to oklab but D50-anchored | When matching design tools that use Lab |
| `lch` | similar to oklch but D50-anchored | Same |

## Sources (verified 2026-05-19)

- [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [MDN : color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
- [MDN : light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [W3C : CSS Color 4](https://www.w3.org/TR/css-color-4/)
- [W3C : CSS Color 5](https://www.w3.org/TR/css-color-5/)
