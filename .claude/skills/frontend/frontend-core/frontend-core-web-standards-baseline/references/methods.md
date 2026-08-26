# Methods : `@supports`, `CSS.supports()`, web-features API

All signatures verified against [MDN : @supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports) (verified 2026-05-19) and [web-platform-dx/web-features](https://github.com/web-platform-dx/web-features) (verified 2026-05-19).

## CSS `@supports` at-rule

Baseline status : Widely Available since September 2015.

### Forms

| Form | Grammar | Example |
|---|---|---|
| Declaration | `@supports (property: value) { ... }` | `@supports (display: grid) { ... }` |
| Negation | `@supports not (property: value) { ... }` | `@supports not (display: grid) { ... }` |
| Conjunction | `@supports (cond1) and (cond2) { ... }` | `@supports (display: grid) and (gap: 1rem) { ... }` |
| Disjunction | `@supports (cond1) or (cond2) { ... }` | `@supports (display: grid) or (display: flex) { ... }` |
| Selector test | `@supports selector(sel) { ... }` | `@supports selector(:has(*)) { ... }` |
| Font tech | `@supports font-tech(tech) { ... }` | `@supports font-tech(color-COLRv1) { ... }` |
| Font format | `@supports font-format(fmt) { ... }` | `@supports font-format(woff2) { ... }` |

### Operator precedence rule

When combining `and` and `or` in the same condition, explicit parentheses are REQUIRED. The browser does NOT infer precedence.

```css
@supports (display: grid) and (not (display: inline-grid)) { ... }
```

### `font-tech()` accepted tokens

Color : `color-colrv0`, `color-colrv1`, `color-svg`, `color-sbix`, `color-cbdt`.
Features : `features-opentype`, `features-aat`, `features-graphite`.
Other : `variations`, `palettes`, `incremental-patch`, `incremental-range`, `incremental-auto`.

### `font-format()` accepted tokens

`collection`, `embedded-opentype`, `opentype`, `svg`, `truetype`, `woff`, `woff2`.

### `selector()` semantics

Tests whether the browser's CSS parser AND matcher accept the inner selector. A `false` result means the entire selector chain fails to parse; partial-support cases (e.g. `:has()` accepted but slow) still report `true`. Use this for hard parse-level gates only.

## JS `CSS.supports()` static method

Two overloads, both verified against MDN.

```js
CSS.supports(propertyName: string, value: string): boolean
CSS.supports(conditionText: string): boolean
```

### Examples

```js
CSS.supports("display", "grid")                            // true on any modern engine
CSS.supports("(display: grid)")                            // true
CSS.supports("(display: grid) and (gap: 1rem)")            // true
CSS.supports("selector(:has(*))")                          // true since :has() Newly
CSS.supports("not (transform-origin: 10em 10em 10em)")     // depends on engine
```

### CSSOM access

```js
const rule = document.styleSheets[0].cssRules[0];
if (rule instanceof CSSSupportsRule) {
  console.log(rule.conditionText);
}
```

## JS feature-detection idioms (non-`@supports`)

| Goal | Idiom | NEVER |
|---|---|---|
| Global API present | `'ResizeObserver' in window` | `typeof ResizeObserver !== 'undefined'` works but `in` is canonical |
| Instance method on a prototype | `'groupBy' in Object`, `'groupBy' in Array.prototype` | testing the result of a method call |
| Element-prototype method | `'showPopover' in HTMLElement.prototype` | constructing the element to test |
| Event support | `'onpointerdown' in window` | UA sniffing |
| Attribute support | `'inert' in HTMLElement.prototype` | inspecting `document.documentMode` |
| Detect parse-level errors | wrap in `CSS.supports()` (CSS) or `Function('...')` (JS) | bare `try/catch` |

## `web-features` package

Source : `github.com/web-platform-dx/web-features` (verified 2026-05-19).

### Per-feature object shape

| Property | Type | Meaning |
|---|---|---|
| `name` | string | Human-readable label |
| `description` | string | One-line summary |
| `spec` | string \| string[] | Spec URLs |
| `status.baseline` | `'high'` \| `'low'` \| `false` | Widely / Newly / Limited |
| `status.baseline_low_date` | ISO date string \| undefined | Date the feature became Newly Available |
| `status.baseline_high_date` | ISO date string \| undefined | Date the feature became Widely Available (Newly + 30 months) |
| `status.support` | object | Per-engine minimum versions |
| `caniuse` | string | caniuse.com slug if mapped |
| `compat_features` | string[] | BCD feature keys |

### Status-to-taxonomy mapping

| `status.baseline` | Taxonomy label | Action per `evergreen-2026` |
|---|---|---|
| `'high'` | Widely Available | Ship without gate or fallback |
| `'low'` | Newly Available | Gate with `@supports` or `'X' in scope`; provide fallback |
| `false` | Limited Availability | Behind explicit opt-in; document as experimental |

### Usage

```js
import features from 'web-features';
const has = features['has'];
if (has.status.baseline === 'high') { /* safe to ship without gate */ }
```

## Baseline taxonomy reference

Verified against [web.dev : Baseline](https://web.dev/baseline) (verified 2026-05-19).

| Term | Definition |
|---|---|
| Core browsers | Chrome (desktop and Android), Edge, Firefox (desktop and Android), Safari (macOS and iOS) |
| Limited Availability | Feature lacks support in one or more core browsers |
| Newly Available | Feature is supported and interoperable across all four core browsers from a known date |
| Widely Available | 30 months have elapsed since the Newly Available date |
| Baseline YYYY cohort | All features that became Newly Available during calendar year YYYY |

## Spec-family lookup table

| Need | Authoritative URL |
|---|---|
| HTML element / attribute / parser behavior | `https://html.spec.whatwg.org/multipage/` |
| DOM interface / method / event | `https://dom.spec.whatwg.org/` |
| Fetch | `https://fetch.spec.whatwg.org/` |
| URL | `https://url.spec.whatwg.org/` |
| Streams | `https://streams.spec.whatwg.org/` |
| CSS module (any) | `https://www.w3.org/TR/` then pick the module |
| WCAG 2.2 | `https://www.w3.org/TR/WCAG22/` |
| ARIA 1.2 | `https://www.w3.org/TR/wai-aria-1.2/` |
| ARIA Authoring Practices Guide | `https://www.w3.org/WAI/ARIA/apg/` |
| ECMAScript | `https://tc39.es/ecma262/` |
| TC39 proposals | `https://github.com/tc39/proposals` |
| Web API surface (MDN) | `https://developer.mozilla.org/en-US/docs/Web/API` |
| Core Web Vitals | `https://web.dev/articles/vitals` |
