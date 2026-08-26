---
name: frontend-core-web-standards-baseline
description: >
  Use when deciding whether a web platform feature is safe to ship, looking up
  authoritative behavior for HTML / CSS / DOM / JS, or choosing between native
  feature, polyfill, and `@supports` gating in evergreen-2026 targets.
  Prevents shipping features that lack interop, polyfilling features that
  already reached Baseline Widely Available, UA-sniffing instead of feature
  detection, and citing stale BCD as if it were Baseline.
  Covers the Baseline taxonomy (Limited / Newly / Widely Available, 30-month
  rule, four core engines), spec-family lookup discipline (WHATWG Living
  Standards for HTML and DOM, W3C TR for CSS modules, W3C WAI for WCAG and
  ARIA, TC39 for ECMAScript), MDN's role as canonical secondary source,
  web.dev for Chrome-team applied guidance, the `web-features` package, and
  feature detection via CSS `@supports` and JS `in` operator.
  Keywords: WHATWG, W3C, TC39, Baseline, Baseline 2024, Baseline 2025, BCD,
  @supports, CSS.supports, feature detection, evergreen, polyfill, caniuse,
  web-features, web.dev, MDN, Living Standard, interop, compat issue, browser
  doesn't support, polyfill needed, fallback required, feature does not work
  in Safari, missing CSS property, JS error in Firefox, does X work in
  browser, how do I check browser support, what is Baseline, when can I use
  CSS feature X, how to feature-detect a CSS property.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Core : Web Standards and Baseline

Authoritative reference for spec-lookup discipline and Baseline-aware shipping decisions. Every other skill in this package depends on the rules defined here.

## Quick Reference

### Baseline taxonomy (verified against [web.dev : Baseline](https://web.dev/baseline) (verified 2026-05-19))

| Status | Definition | Action |
|---|---|---|
| Limited Availability | Not yet supported across all four core engines | Behind explicit opt-in only. Document as experimental. |
| Newly Available | Supported by Chrome (desktop + Android), Edge, Firefox (desktop + Android), and Safari (macOS + iOS) and interoperable | Gate with `@supports` and provide a fallback. |
| Widely Available | 30 months have elapsed since Newly Available date | Safe for most production sites. No fallback required. |

Annual cohorts group features by the year they reached Newly Available : Baseline 2024, Baseline 2025. Cohort labels are convenient targets ("we ship Baseline 2024") but the per-feature taxonomy above is the authoritative gate.

### `evergreen-2026` package target

- Minimum bar : Baseline 2024 features ship without fallback.
- Baseline 2025 features MUST be gated with `@supports` (CSS) or `in`-operator detection (JS) and have a documented fallback.
- Limited Availability features MUST be behind an explicit opt-in (flag, config, or progressive-enhancement layer) and labelled experimental.

### Spec hierarchy (where to look up authoritative behavior)

| Surface | Primary spec | Stable URL prefix | Secondary canonical |
|---|---|---|---|
| HTML, DOM, Fetch, URL, Streams | WHATWG Living Standard | `https://html.spec.whatwg.org/multipage/` | MDN Web Docs |
| CSS modules (Cascade, Grid, `:has()`, `@scope`, `@container`, color) | W3C CSS WG (TR drafts) | `https://www.w3.org/TR/` | MDN Web Docs |
| WCAG, ARIA, APG | W3C WAI | `https://www.w3.org/TR/WCAG22/`, `https://www.w3.org/TR/wai-aria-1.2/` | W3C WAI APG, MDN |
| ECMAScript (JS language) | TC39 | `https://tc39.es/ecma262/` | MDN Web Docs |
| Applied guidance, Core Web Vitals | web.dev (Chrome team) | `https://web.dev/` | n/a |
| Per-version support data | BCD (Browser Compatibility Data) | embedded in MDN pages | n/a |
| Baseline status | `web-features` package + web.dev/baseline | `https://web-platform-dx.github.io/web-features/` | n/a |

ALWAYS cite the LS or TR URL when stating spec-defined behavior. MDN is acceptable as primary citation when the MDN page embeds the relevant spec link and the BCD table is current. NEVER cite a blog post for normative behavior.

### Decision tree : "Can I ship this feature without a fallback?"

```
1. Look up the feature on https://web-platform-dx.github.io/web-features/
   or check web.dev/baseline for the cohort badge.
2. Status = Widely Available
     -> SHIP. No gate, no fallback. No prefix.
3. Status = Newly Available
     -> GATE with `@supports` (CSS) or `'X' in scope` (JS).
        Provide a fallback path that does NOT include the new feature.
4. Status = Limited Availability
     -> DO NOT ship to all users. Put behind opt-in flag, document as
        experimental, and revisit when Baseline status advances.
```

### Decision tree : "How do I feature-detect ... ?"

```
CSS property / value pair:
    @supports (property: value) { ... }
CSS selector:
    @supports selector(:has(.x)) { ... }
CSS font tech:
    @supports font-tech(color-COLRv1) { ... }
CSS font format:
    @supports font-format(woff2) { ... }
Combine:
    @supports (display: grid) and (not (display: inline-grid)) { ... }
JS via static method:
    CSS.supports("display", "flex")
    CSS.supports("(display: flex) or (display: grid)")
JS global API:
    'ResizeObserver' in window
JS instance method:
    'groupBy' in Object
DOM property on an element type:
    'showPopover' in HTMLElement.prototype
NEVER:
    try { new ResizeObserver(() => {}); } catch { ... }
        because try/catch masks unrelated runtime errors.
```

Syntax verified against [MDN : @supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports) (verified 2026-05-19).

### Decision tree : "Where do I look up authoritative behavior?"

```
HTML element / attribute / parser behavior:
    -> WHATWG HTML Living Standard (https://html.spec.whatwg.org/multipage/)
DOM interface / method / event:
    -> WHATWG DOM Living Standard (https://dom.spec.whatwg.org/)
CSS property / at-rule / module:
    -> W3C TR for that module (https://www.w3.org/TR/)
       Example : https://www.w3.org/TR/css-cascade-5/
JS language semantics:
    -> TC39 ECMA-262 (https://tc39.es/ecma262/)
Accessibility (WCAG SC, ARIA role/state):
    -> W3C WAI (WCAG 2.2, ARIA 1.2)
Practical patterns, Core Web Vitals tactics:
    -> web.dev articles authored by Chrome team
Per-browser-version support and history:
    -> MDN BCD table for the feature
Interop status across all four core engines:
    -> web-features package OR web.dev/baseline
```

When MDN and the spec disagree, the SPEC wins. File an MDN content issue rather than copying the wrong description.

## Mental Model

The web platform has ONE authoritative source per concern : WHATWG for HTML/DOM, W3C CSS WG for CSS, W3C WAI for accessibility, TC39 for JS. MDN is a curated secondary source : excellent for examples, BCD tables, and developer-friendly prose, but NOT normative. web.dev provides Chrome-team applied guidance, useful for tactics (especially Core Web Vitals) but NOT spec.

Baseline answers a different question than BCD. BCD tells you which versions of which browsers ship a feature. Baseline tells you whether the feature has reached interoperable adoption across the four core engines AND, separately, whether 30 months have passed since that point. A feature can be in every browser's stable channel (BCD shows green across the board) and still be Newly Available rather than Widely Available because the 30-month clock has not elapsed.

The package target `evergreen-2026` is NOT the same as "Baseline Widely Available". Evergreen means users keep their browser updated, so the lower bound is recent. Baseline status is a separate, additional gate : even on evergreen browsers, a Newly Available feature MAY behave inconsistently in edge cases (older still-supported point releases), so the package mandates `@supports` gating for that tier.

The `web-features` npm package (`web-platform-dx/web-features`) is the machine-readable source for Baseline status. It exposes per-feature objects with a `baseline` field whose values map to the taxonomy (`high` = Widely, `low` = Newly, `false` = Limited). Tooling that needs to gate on Baseline (linters, CI checks, doc generators) reads this package, NOT a copy of caniuse data.

## Patterns

### Pattern 1 : Gating a Newly Available CSS feature

ALWAYS pair the gated rule with a fallback that produces a working page if the feature is unsupported.

```css
.card {
  background-color: #f6f8fa;
}
@supports (background-color: oklch(0.97 0 0)) {
  .card {
    background-color: oklch(0.97 0 0);
  }
}
```

If the feature has been Widely Available for 30+ months (e.g. `oklch()` has been Widely Available since May 2023), the `@supports` wrapper is dead weight and MUST be removed. See [[frontend-syntax-css-cascade-layers-scope]] for cascade-layer organization of fallback-vs-modern rules.

### Pattern 2 : Selector-level feature detection

```css
ul.menu li:not(:last-child) {
  border-bottom: 1px solid #ccc;
}
@supports selector(:has(*)) {
  ul.menu:has(li[aria-current]) {
    background-color: oklch(0.97 0 0);
  }
}
```

The `selector()` function is itself Baseline Newly Available since September 2022 across the four engines. Using it to detect `:has()` is appropriate, because `:has()` reached Baseline Newly Available in December 2023 and Widely Available in mid-2026.

### Pattern 3 : JS global API detection

```js
if ('ResizeObserver' in window) {
  const ro = new ResizeObserver(entries => { /* ... */ });
  ro.observe(target);
} else {
  window.addEventListener('resize', fallbackHandler);
}
```

### Pattern 4 : Instance-method detection on a prototype

```js
const groups = Object.groupBy
  ? Object.groupBy(items, x => x.kind)
  : items.reduce((acc, x) => {
      (acc[x.kind] ??= []).push(x);
      return acc;
    }, {});
```

`Object.groupBy` reached Baseline Newly Available in March 2024. Pattern remains a Newly-tier gate until it becomes Widely Available (around late 2026).

### Pattern 5 : Reading Baseline status programmatically

```js
import features from 'web-features';

const feat = features['has'];
// feat.status.baseline === 'high'  -> Widely Available
// feat.status.baseline === 'low'   -> Newly Available
// feat.status.baseline === false   -> Limited Availability
// feat.status.baseline_low_date    -> Newly Available date (ISO)
// feat.status.baseline_high_date   -> Widely Available date (ISO)
```

Use this in CI to fail builds that import a Limited-tier feature without the documented opt-in flag.

## When to remove a fallback

A `@supports` wrapper or polyfill is removable when the feature reached Widely Available (Baseline `high`) at least 6 months ago. ALWAYS run a cleanup pass per release :

1. Query the project for `@supports` blocks.
2. For each block, look up the feature on web-features.
3. If `baseline === 'high'` and `baseline_high_date` is older than 6 months : remove the wrapper, keep only the modern rule.
4. Commit with `chore: remove fallback for X (Widely Available since YYYY-MM)`.

## Anti-patterns (summary)

See `references/anti-patterns.md` for symptom / root cause / fix per item.

1. UA sniffing.
2. Assuming "Baseline" implies Safari support without checking the four-engine rule.
3. Polyfilling a feature already Widely Available.
4. Using `try/catch` as feature detection.
5. Treating BCD per-version data as Baseline interop status.
6. Adding `-webkit-` prefixes to evergreen-era properties.
7. Citing MDN over the spec when they disagree.
8. Treating "evergreen" as "no compatibility work".

## References

- [web.dev : Baseline](https://web.dev/baseline) (verified 2026-05-19)
- [web-features package : github.com/web-platform-dx/web-features](https://github.com/web-platform-dx/web-features) (verified 2026-05-19)
- [MDN : @supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports) (verified 2026-05-19)
- [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/) (verified 2026-05-19)
- [W3C TR index](https://www.w3.org/TR/) (verified 2026-05-19)
- `references/methods.md` : full `@supports` and `CSS.supports()` matrix
- `references/examples.md` : code snippets per gating pattern
- `references/anti-patterns.md` : 8 anti-patterns with symptom / root cause / fix

## Cross-references

- [[frontend-core-architecture]] for the four-layer platform model
- [[frontend-syntax-css-cascade-layers-scope]] for organizing fallback-vs-modern rules in the cascade
