# References : DTCG and CSS Custom Property Surface

Complete surface for `frontend-impl-design-tokens`. All citations verified 2026-05-19.

## DTCG Format Module draft 2025.10 : production status

The W3C Design Tokens Community Group Format Module is a **draft preview dated 7 May 2026**. The spec preamble states explicitly that the format is NOT production-implementation-ready. Source : [designtokens.org : Format Module draft](https://designtokens.org/tr/drafts/format/) (verified 2026-05-19).

Practical guidance :

- Author tokens in DTCG shape so future migration is mechanical.
- Transform DTCG JSON to CSS custom properties via a build pipeline (Style Dictionary, Tokens Studio export, or a thin custom transformer).
- Pin tooling to the 2025.10 draft revision. Expect breaking changes until Candidate Recommendation.
- Disclose draft status in internal docs that mention DTCG conformance.

## Token leaf structure

Every leaf token is an object with at least `$value`.

```json
{
  "$value": "...",
  "$type": "...",
  "$description": "Optional human prose.",
  "$extensions": { "com.example.tool": { ... } }
}
```

| Member | Required | Meaning |
|--------|----------|---------|
| `$value` | yes | The token's value, matching the declared `$type`. |
| `$type` | yes, explicitly OR inherited from group | One of the seven base types or six composite types. |
| `$description` | no | Free-form human prose. |
| `$extensions` | no | Vendor metadata under reverse-DNS keys (`com.example.tool`). Tools MUST ignore extensions they do not own. |

## Group structure

```json
{
  "color": {
    "$type": "color",
    "brand": {
      "blue-500": { "$value": { "colorSpace": "oklch", "components": [0.60, 0.18, 250] } }
    }
  }
}
```

- Groups organize tokens hierarchically.
- A group itself does NOT have `$value` (it is a container).
- A group MAY declare `$type` which is inherited by every descendant token unless overridden.
- The reserved name `$root` represents a group's own value when needed.

## Alias references

Form : `{path.to.token}`. Resolves to the target's `$value`.

```json
{
  "color": {
    "brand": { "blue-500": { "$value": "#3b82f6", "$type": "color" } },
    "action": { "primary": { "$value": "{color.brand.blue-500}", "$type": "color" } }
  }
}
```

For nested-property access (e.g. one component of a composite typography token), use JSON Pointer :

```json
{
  "$ref": "#/typography/body/$value/fontSize"
}
```

## Base token types

### `color`

Modern form :

```json
{
  "$value": {
    "colorSpace": "oklch",
    "components": [0.60, 0.18, 250],
    "alpha": 1.0
  },
  "$type": "color"
}
```

`colorSpace` accepts `oklch`, `oklab`, `lch`, `lab`, `srgb`, `display-p3`, `rec2020`, `xyz`, plus the alternative `oklch-srgb` form for sRGB-clamped output. `components` length matches the space (3 for color, 1 to 3 for derived). `alpha` is 0 to 1.

Legacy form (hex string, sRGB) :

```json
{ "$value": "#3b82f6", "$type": "color" }
```

### `dimension`

```json
{ "$value": "16px", "$type": "dimension" }
{ "$value": "1rem", "$type": "dimension" }
```

Numeric + unit. Units : `px`, `rem`, `em`, `%`. Reject other units in 2025.10.

### `fontFamily`

```json
{ "$value": "Inter", "$type": "fontFamily" }
{ "$value": ["Inter", "system-ui", "sans-serif"], "$type": "fontFamily" }
```

Single string OR array of fallbacks.

### `fontWeight`

```json
{ "$value": 400, "$type": "fontWeight" }
{ "$value": "bold", "$type": "fontWeight" }
```

Integer 1 to 1000 OR named (`normal`, `bold`, `lighter`, `bolder`, `thin`, `extra-light`, `light`, `regular`, `medium`, `semi-bold`, `extra-bold`, `black`, `heavy`).

### `duration`

```json
{ "$value": "200ms", "$type": "duration" }
{ "$value": "0.6s", "$type": "duration" }
```

`ms` or `s`.

### `cubicBezier`

```json
{ "$value": [0.2, 0, 0, 1], "$type": "cubicBezier" }
```

Four-element numeric array.

### `number`

```json
{ "$value": 1.5, "$type": "number" }
```

Unitless. Used for line-height, opacity, scale factors.

## Composite token types

### `border`

```json
{
  "$value": {
    "color": "{color.border.subtle}",
    "width": "1px",
    "style": "solid"
  },
  "$type": "border"
}
```

### `shadow`

```json
{
  "$value": {
    "offsetX": "0px",
    "offsetY": "2px",
    "blur": "4px",
    "spread": "0px",
    "color": "{color.shadow.umbra}",
    "inset": false
  },
  "$type": "shadow"
}
```

Multi-shadow stacks are arrays of shadow objects.

### `transition`

```json
{
  "$value": {
    "duration": "200ms",
    "delay": "0ms",
    "timingFunction": [0.2, 0, 0, 1]
  },
  "$type": "transition"
}
```

### `strokeStyle`

```json
{ "$value": "solid", "$type": "strokeStyle" }
```

String : `solid`, `dashed`, `dotted`, `double`, `groove`, `ridge`, `outset`, `inset`.

### `gradient`

```json
{
  "$value": [
    { "color": "{color.brand.blue-500}", "position": 0 },
    { "color": "{color.brand.blue-700}", "position": 1 }
  ],
  "$type": "gradient"
}
```

Array of stops with `color` + `position` (0 to 1).

### `typography`

```json
{
  "$value": {
    "fontFamily": "{font.body}",
    "fontSize": "16px",
    "fontWeight": 400,
    "letterSpacing": "0px",
    "lineHeight": 1.5
  },
  "$type": "typography"
}
```

## CSS custom properties

Source : [MDN : Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) (verified 2026-05-19) and [MDN : --* (custom properties)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) (verified 2026-05-19).

### Declaration

```css
:root {
  --color-fg-action: oklch(0.60 0.18 250);
}
```

- Names are case-sensitive ; declare in kebab-case by convention.
- Reserve the `--` prefix for token-style usage ; never collide with implementation-specific helper variables.
- Value can be any valid CSS, including nested `var(...)` references and `calc(...)` expressions.

### Reference

```css
.button {
  background: var(--color-fg-action);
  color: var(--color-bg-on-action, white);
}
```

`var(--name, <fallback>)` provides a fallback that is used when the property is missing or invalid.

### Scope and inheritance

- Custom properties inherit through the DOM by default (just like normal CSS properties).
- Setting on `:root` makes the property available everywhere.
- Overriding on a descendant scopes the new value to that subtree.

## `@property` registration

Source : [MDN : @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) (verified 2026-05-19).

```css
@property --gradient-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
```

### Required descriptors

| Descriptor | Values | Meaning |
|------------|--------|---------|
| `syntax` | quoted string | A `|`-separated list of grammar tokens. Most common single-token forms below. |
| `inherits` | `true` or `false` | Whether the property inherits to descendants. |
| `initial-value` | matches `syntax` | Required for all `syntax` values except the universal `*`. |

### Common `syntax` tokens

| Token | Matches |
|-------|---------|
| `<length>` | `12px`, `1rem`, `calc(...)` |
| `<percentage>` | `50%` |
| `<length-percentage>` | length OR percentage |
| `<number>` | `1`, `1.5`, `-0.5` |
| `<integer>` | `1`, `-3` |
| `<angle>` | `45deg`, `0.5turn`, `1.2rad` |
| `<time>` | `200ms`, `0.3s` |
| `<color>` | any CSS color |
| `<image>` | `url(...)`, gradient functions |
| `<url>` | `url(...)` |
| `<custom-ident>` | identifier |
| `<resolution>` | `96dpi`, `2dppx` |
| `<transform-function>` | one transform function |
| `<transform-list>` | one or more transform functions |
| `*` | any value (no validation) |

### Why registration matters

Without `@property`, a custom property is treated as `<custom-ident>` and only swaps discretely. `transition: --my-var 300ms` does nothing because the browser cannot interpolate between unknown values.

With `@property` and an interpolatable `syntax`, transitions and animations work :

```css
@property --hue { syntax: "<angle>"; inherits: false; initial-value: 0deg; }

.swatch {
  background: oklch(0.60 0.18 var(--hue));
  transition: --hue 600ms ease-out;
}

.swatch:hover { --hue: 90deg; }
```

### JavaScript registration

```js
CSS.registerProperty({
  name: "--gradient-angle",
  syntax: "<angle>",
  inherits: false,
  initialValue: "0deg",
});
```

Useful when tokens are loaded dynamically and the `@property` declaration cannot be authored statically.

## Cascade layer placement

```css
@layer tokens, theme, base, components, utilities;

@layer tokens { :root { /* primitive + semantic + component tokens */ } }
@layer theme { [data-theme="dark"] { /* theme overrides */ } }
@layer base { /* element resets, typography defaults */ }
@layer components { /* per-component CSS that consumes tokens */ }
@layer utilities { /* atomic helpers */ }
```

Layer order : earlier loses to later. Tokens live early so component rules can win specificity without `!important`. Theme overrides live AFTER tokens so they override the defaults. See `[[frontend-syntax-css-cascade-layers-scope]]` for the full layering surface.

## Theme switching strategies

### OS preference only

```css
:root { color-scheme: light dark; }

@layer tokens {
  :root {
    --color-bg-surface: light-dark(oklch(0.99 0 0), oklch(0.18 0 0));
    --color-fg-action:  light-dark(oklch(0.50 0.18 250), oklch(0.80 0.14 250));
  }
}
```

`color-scheme` MUST be declared for `light-dark()` to work ; without it the function silently falls back to the light value.

### User override via `data-theme`

```css
@layer tokens {
  :root {
    --color-bg-surface: oklch(0.99 0 0);
    --color-fg-action:  oklch(0.50 0.18 250);
  }

  [data-theme="dark"] {
    --color-bg-surface: oklch(0.18 0 0);
    --color-fg-action:  oklch(0.80 0.14 250);
  }
}
```

Toggle the attribute from JS :

```js
document.documentElement.dataset.theme = "dark";
```

### Per-region themes

```html
<main data-theme="light">...</main>
<aside data-theme="dark">...</aside>
```

The attribute can live on any element ; tokens cascade down from that element.

## Build pipeline (informational)

Common DTCG-aware tools (mentioned for reference, not endorsed) :

- **Style Dictionary** : open-source CLI that reads DTCG-shaped JSON and emits CSS / Sass / iOS / Android / JS outputs.
- **Tokens Studio** : Figma plugin that exports DTCG-shaped JSON.
- **Custom transformer** : a small Node script that traverses the JSON tree, resolves aliases, and emits CSS custom-property declarations.

Production today : pick one, pin the DTCG draft revision, and treat the emitted CSS as the runtime artifact.
