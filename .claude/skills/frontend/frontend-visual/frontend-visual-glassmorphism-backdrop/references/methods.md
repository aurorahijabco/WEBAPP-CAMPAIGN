# References : backdrop-filter API surface

Complete spec surface for `frontend-visual-glassmorphism-backdrop`. All citations verified 2026-05-19.

## `backdrop-filter` property

Source : [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19). Baseline 2024 (Newly Available September 2024). Spec : [W3C : Filter Effects Module Level 2](https://www.w3.org/TR/filter-effects-2/) (verified 2026-05-19).

### Syntax

```
backdrop-filter: none | <filter-function-list>
```

`<filter-function-list>` is one or more filter functions separated by spaces. Functions stack in declaration order ; the output of one feeds the next.

```css
backdrop-filter: blur(12px) saturate(180%) brightness(110%);
```

### Inheritance and animation

- Initial value : `none`
- Inherited : no
- Animation type : filter list (interpolates between matched functions ; mismatched function lists fall back to discrete swap)
- Computed value : list of filter functions in canonical form

### Where it applies

`backdrop-filter` applies to all elements except internal table parts (`table-row`, `table-cell`, etc.). It only has a visible effect when the element's painted background-color or background-image leaves part of the box transparent or partially transparent.

## Filter functions

All functions accepted by `backdrop-filter` are the same set accepted by the `filter` property.

| Function | Argument | Range | Effect on backdrop |
|----------|----------|-------|--------------------|
| `blur(<length>)` | px or any length unit | >= 0 ; commonly 4 px to 40 px | Gaussian blur at the given radius |
| `brightness(<number-percentage>)` | 0, 0%, 100%, 200%, ... | 0 % darkest, 100 % unchanged, >100 % brighter | Multiplies linear-light pixel value |
| `contrast(<number-percentage>)` | 0, 0%, 100%, 200%, ... | 0 % flat gray, 100 % unchanged, >100 % more contrast | Pushes pixel values away from / toward mid-gray |
| `drop-shadow(<offset-x> <offset-y> <blur-radius>? <color>?)` | shadow params | n/a | Drop shadow of the shape implied by the backdrop alpha ; unusual on backdrop-filter |
| `grayscale(<number-percentage>)` | 0 to 1 or 0 % to 100 % | 0 unchanged, 1 fully gray | Desaturates |
| `hue-rotate(<angle>)` | deg, rad, turn | any | Rotates hues around the color wheel |
| `invert(<number-percentage>)` | 0 to 1 or 0 % to 100 % | 0 unchanged, 1 inverted | Photographic negative |
| `opacity(<number-percentage>)` | 0 to 1 or 0 % to 100 % | 0 transparent, 1 unchanged | Multiplies alpha |
| `saturate(<number-percentage>)` | 0 to many | 0 % gray, 100 % unchanged, >100 % more saturated | Chroma boost ; pairs well with blur |
| `sepia(<number-percentage>)` | 0 to 1 or 0 % to 100 % | 0 unchanged, 1 full sepia | Sepia tone |
| `url(<svg-filter-id>)` | reference to an SVG `<filter>` element | n/a | Arbitrary SVG filter graph |

Source : [MDN : CSS filter effects](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_filter_effects) (verified 2026-05-19).

### Function composition

Functions compose left-to-right. `blur(8px) saturate(200%)` blurs first, then boosts saturation of the blurred result. `saturate(200%) blur(8px)` boosts saturation first, then blurs the saturated result. The visual difference is usually small but measurable on high-chroma backgrounds.

Common combinations :

- `blur(12px) saturate(180%)` : the canonical "Apple frosted glass" recipe.
- `blur(20px) saturate(140%) brightness(110%)` : useful when text-on-glass must stay legible against a dark image.
- `blur(8px) contrast(95%) brightness(102%)` : subtle frost for dashboards over UI screenshots.

## Required ingredients for visible blur

1. **The element must have a painted box** : a `background-color` (even fully transparent counts) OR a `background-image`. Without either, the element's box is empty and the filter has no area to apply.
2. **The painted box must be partially transparent** : `background: oklch(0.99 0 0 / 0.6)` or `background: rgb(255 255 255 / 0.6)`. A fully opaque background (`alpha 1`) hides the backdrop entirely so the blur is invisible.
3. **No ancestor establishes a backdrop-root** between the element and the content it wants to blur. See the next section for the full trigger list.

## Backdrop-root trigger list (binding)

Any of the following on ANY ancestor of the `backdrop-filter` element establishes a backdrop-root. The filter only sees content INSIDE the nearest such ancestor. Source : [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19) plus vooronderzoek §9.

| Property | Trigger value | Why it triggers |
|----------|---------------|-----------------|
| `opacity` | less than 1 | Group must be composited together |
| `filter` | other than `none` | Filter creates an isolated bitmap |
| `mask`, `mask-image`, `mask-border` | other than `none` | Mask requires isolated alpha |
| `mix-blend-mode` | other than `normal` | Blend needs a discrete source group |
| `clip-path` | other than `none` | Clip requires an isolated layer |
| `backdrop-filter` | other than `none` | Inner glass establishes its own root |
| `isolation` | `isolate` | Explicit isolation request |
| `contain` | `paint`, `layout`, `strict` | Containment forces isolation |
| `will-change` | naming any of the above | Pre-promotes the layer |

The following create a stacking context but do NOT establish a backdrop-root :

- `transform` other than `none`
- `perspective` other than `none`
- `position: fixed`, `position: sticky` (when sticking)
- `z-index` on a positioned element

A stacking context affects paint order but a stacking context alone is NOT enough to break `backdrop-filter`. The combined list of triggers is what to audit.

## `@supports` feature query

```css
@supports (backdrop-filter: blur(1px)) {
  .glass {
    background: oklch(0.99 0 0 / 0.6);
    backdrop-filter: blur(12px);
  }
}

@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background: oklch(0.99 0 0 / 0.95);
  }
}
```

Source : [MDN : @supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports) (verified 2026-05-19, Baseline Widely Available).

## `-webkit-backdrop-filter` prefix

Source : [MDN : backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) (verified 2026-05-19).

Status as of 2026-05-19 : the prefix is no longer required for modern Safari. It is harmless to ship alongside the unprefixed property for legacy WebView contexts (older iOS WebView builds in long-lived native apps). Order matters : declare the prefixed version FIRST.

```css
.glass {
  -webkit-backdrop-filter: blur(12px) saturate(180%);
          backdrop-filter: blur(12px) saturate(180%);
}
```

## `prefers-reduced-transparency` opt-out

Source : [MDN : prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) (verified 2026-05-19). Limited Availability (Experimental). Ship the rule for forward compatibility.

```css
@media (prefers-reduced-transparency: reduce) {
  .glass {
    backdrop-filter: none;
    background: oklch(0.99 0 0);
  }
}
```

## `forced-colors` interaction

Under `@media (forced-colors: active)` (Windows High Contrast Mode), `backdrop-filter` effects are forced to `none` along with `box-shadow`. Add an explicit border for definition :

```css
@media (forced-colors: active) {
  .glass {
    backdrop-filter: none;
    background: Canvas;
    border: 1px solid ButtonText;
  }
}
```

See `[[frontend-a11y-motion-contrast-wcag22]]` for the full forced-colors surface.

## Mobile performance budget

The compositor cost of `backdrop-filter` scales with :

1. **Blur radius** : larger radii require larger sampling kernels. Quadratic in radius for naive implementations ; modern GPUs use multi-pass downsample to bring it closer to linear.
2. **Layer area** : a sticky header (full viewport width by 64 px) is cheap ; a full-screen modal blur is expensive.
3. **Animation frequency** : if the surface re-paints every scroll or every frame (animated background behind it), the cost is per-frame.

Practical caps for mid-range mobile :

| Surface type | Max blur radius | Notes |
|--------------|-----------------|-------|
| Static sticky header | 16 px | Re-paints on scroll, kept small in area |
| Modal overlay | 24 px | One-shot, full-screen |
| Card in scroll feed | 8 px or skip | Skip on `(update: slow)` |
| Animated background | 12 px | Pair with `transform: translateZ(0)` to keep composited |

Pair with intersection-toggle : disable `backdrop-filter` while the element is off-screen via `IntersectionObserver`. The savings stack with `content-visibility: auto` from `[[frontend-perf-core-web-vitals-inp]]`.

## WCAG contrast against an effective backdrop

WCAG 1 4 3 (4 5 to 1 normal, 3 to 1 large) applies to the RENDERED foreground-background pair, not the declared token. When the background is a `backdrop-filter` over arbitrary content, the rendered backdrop color is :

```
rendered = blur(content) * (1 - alpha) + tint * alpha
```

Where `tint` is the declared `background-color`, `alpha` is its alpha channel, and `blur(content)` is whatever the user's content underneath happens to be.

Implication : if the underlying content is variable (a user-uploaded photo, an ad slot), the rendered backdrop is unpredictable. You cannot guarantee 4 5 to 1 text contrast.

Mitigations :

1. **Tint the glass enough** : raise alpha to 0 7 or higher and add a `brightness(110%)` filter so the rendered backdrop trends near-white (for dark text) or near-black (for light text).
2. **Defensive text-shadow halo** : `text-shadow: 0 0 8px oklch(0.99 0 0 / 0.6)` survives a worst-case dark background.
3. **Two-layer composition** : place a semi-opaque solid layer between the variable content and the glass. The solid layer provides predictable contrast ; the glass adds the visual blur on top.

Verify the rendered ratio in DevTools accessibility pane with a representative background loaded.
