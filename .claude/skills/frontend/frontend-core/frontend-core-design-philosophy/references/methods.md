# Methods Reference : frontend-core-design-philosophy

This file documents the decision matrix, the performance budget matrix, the WCAG 2.2 success-criterion checklist, and the DTCG token type taxonomy. The SKILL.md links into specific tables here from the Decision Trees and Patterns sections.

## 1. Decision matrix : AI-generic default vs distinctive choice

Every row enumerates one default the AI-generic corpus reaches for, the distinctive alternative, and the spec-anchored rationale. ALWAYS check each property of a proposed design against this table.

| Property | AI-generic default | Distinctive choice | Spec rationale |
|----------|--------------------|--------------------|----------------|
| Hero layout | Centered `max-w-2xl` block plus three feature cards under | Asymmetric two-column with focal type on the left and a single accent shape on the right | [MDN : Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) makes asymmetric components portable across contexts (verified 2026-05-19) |
| Color palette | Slate grays plus one indigo accent | One bold off-axis accent via `oklch(L C H)`, restrained neutral derived with `color-mix(in oklch, ...)` | [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) confirms perceptual uniformity for systematic scales (verified 2026-05-19) |
| Typography | Inter or Geist at one weight, one scale ratio (1.125) | Variable font with weight-axis traversal across hierarchy levels, type scale 1.333 or larger | Variable fonts are Baseline Widely Available ; type-as-design is a fingerprint of bespoke design ([web.dev : Baseline](https://web.dev/baseline) verified 2026-05-19) |
| Corner radius | `rounded-md` uniform across surfaces and controls | Mixed radii by component role : sharp CTAs, soft surfaces, asymmetric accents | Per-corner and per-axis `border-radius` is a CSS 2.1 primitive ; uniformity is a Tailwind reflex, not a design rule |
| Card hover state | `translate3d(0, -2px, 0)` plus `shadow-md` | Single-property choreography : accent-line color shift or border-bottom width animation, no layout move | Animating only `transform` and `opacity` keeps INP under 200 ms ([web.dev : Vitals](https://web.dev/articles/vitals) verified 2026-05-19) |
| Modal / dropdown | JS recreation of light-dismiss, focus trap, escape | Native `<dialog>` for modal, Popover API for dropdown, anchor positioning for placement | [MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using) eliminates JS positioning logic (verified 2026-05-19) |
| Focus indicator | `outline: none` with no replacement | Branded `:focus-visible` ring with at least 3:1 contrast against the unfocused state and a 2 CSS-pixel perimeter | [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) SC 2.4.13 Focus Appearance AAA (verified 2026-05-19) |
| Motion default | Auto-play hero animations, parallax scroll, hover transforms by default | Motion as state-transition marker, opacity dissolve inside `prefers-reduced-motion: reduce` | [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) recommends dissolve-style alternatives (verified 2026-05-19) |
| Stylesheet structure | Unlayered, specificity battles, `!important` escalation | `@layer reset, tokens, base, components, utilities, overrides` declared at top | [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) gives explicit cascade control (verified 2026-05-19) |
| Token strategy | Inline literal values per page | Three-tier tokens : primitive, semantic, component | [Design Tokens Format Module 2025.10](https://designtokens.org/tr/drafts/format/) defines $value / $type / aliasing (verified 2026-05-19) |

## 2. Performance budget matrix : how Core Web Vitals constrain design

The thresholds below come from [web.dev : Vitals](https://web.dev/articles/vitals) (verified 2026-05-19) at the 75th percentile of page loads. ALWAYS check a design decision against the relevant column BEFORE shipping.

| Metric | Good threshold | Needs improvement | Poor | Design decisions that drive it |
|--------|----------------|--------------------|------|--------------------------------|
| LCP | <= 2.5 s | <= 4.0 s | > 4.0 s | hero image size and format, hero webfont preload, `fetchpriority` on the LCP element, `<img loading>` strategy, server / CDN latency, render-blocking CSS |
| INP | <= 200 ms | <= 500 ms | > 500 ms | event-handler synchronous duration, long-task breakup via `await scheduler.yield()`, motion choreography running only on compositor properties, third-party script blocking |
| CLS | <= 0.1 | <= 0.25 | > 0.25 | `aspect-ratio` on images / video, `width` and `height` HTML attributes, webfont metric overrides (`size-adjust`, `ascent-override`, `descent-override`), reserved space for dynamic content (toasts, banners, ads) |

### Implications for visual decisions

- A hero composed of a 2 MB autoplay video MUST be replaced or accompanied by a static LCP-friendly image owning the LCP timing.
- A webfont used in the LCP element MUST be preloaded with `<link rel="preload" as="font" type="font/woff2" crossorigin>`.
- A card hover state animating `top` / `left` / `width` / `height` MUST be redesigned to animate `transform` / `opacity` only.
- A dropdown opening with a 40 ms layout pass on the open event MUST be replaced with the Popover API + anchor positioning, which executes on the compositor.
- A CMS-driven hero headline with variable length MUST commit to a deterministic height via `min-block-size`, OR accept that the headline owns the post-load CLS contribution.

## 3. WCAG 2.2 success-criterion checklist for visual design

These are the SCs that materially constrain visual design decisions in 2026. The list is curated from [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19) and [W3C : Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (verified 2026-05-19).

| SC | Level | Visual-design impact |
|----|-------|----------------------|
| 1.4.3 Contrast (Minimum) | AA | Text below 18px (or 14px bold) MUST meet 4.5:1 against background. Larger text MUST meet 3:1. |
| 1.4.11 Non-text Contrast | AA | UI components (form-field borders, focus rings, icon-only buttons) MUST meet 3:1 against adjacent colors. |
| 1.4.12 Text Spacing | AA | Layout MUST tolerate line-height 1.5x, letter-spacing 0.12em, word-spacing 0.16em, paragraph spacing 2x without loss of content or function. |
| 2.3.3 Animation from Interactions | AAA | Motion triggered by interaction MUST be disable-able. Use `prefers-reduced-motion`. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | The focused element MUST NOT be entirely hidden by author-created content (sticky headers, fixed footers). Use `scroll-margin-top`. |
| 2.4.13 Focus Appearance | AAA | The focus indicator MUST cover a 2 CSS-pixel perimeter and have at least 3:1 contrast between focused and unfocused states. |
| 2.5.7 Dragging Movements | AA | Any drag interaction MUST have a single-pointer alternative (click / tap). |
| 2.5.8 Target Size (Minimum) | AA | Pointer targets MUST be at least 24x24 CSS pixels unless a named exception applies (spacing, equivalent, inline, user-agent, essential). |

### Exceptions to 2.5.8 (named, per the W3C Understanding document)

- **Spacing exception** : an undersized target is acceptable IF the offset between the target's bounding box and any neighbor's bounding box is at least 24 CSS pixels in every direction.
- **Equivalent exception** : an equivalent target is provided elsewhere on the page or on the same screen.
- **Inline exception** : the target is part of a sentence or block of text.
- **User-agent exception** : the target is sized by the user agent (native form controls in default styling).
- **Essential exception** : a particular target size is essential to the meaning of the information being conveyed.

ALWAYS document which exception is claimed if a target falls below 24x24 px. NEVER ship undersized targets without a documented exception.

## 4. DTCG token type taxonomy

Per [Design Tokens Format Module 2025.10](https://designtokens.org/tr/drafts/format/) (verified 2026-05-19), a token has at minimum a name and `$value`. The optional `$type`, `$description`, and `$extensions` fields are recommended for production. The supported `$type` values are :

### Primitive types

| $type | Purpose | Example |
|-------|---------|---------|
| `color` | A single color | `"$value": "oklch(60% 0.22 290)"` |
| `dimension` | A length in `px`, `rem`, `em`, etc. | `"$value": "0.75rem"` |
| `fontFamily` | A font-family stack | `"$value": ["Inter", "system-ui", "sans-serif"]` |
| `fontWeight` | A numeric or named font-weight | `"$value": 500` |
| `duration` | A time interval | `"$value": "200ms"` |
| `cubicBezier` | An easing curve | `"$value": [0.2, 0.0, 0.0, 1.0]` |
| `number` | A unitless number | `"$value": 1.5` |

### Composite types

| $type | Purpose |
|-------|---------|
| `border` | A composite of `color` + `width` + `style` |
| `shadow` | A composite of `offsetX` + `offsetY` + `blur` + `spread` + `color` + optional `inset` |
| `typography` | A composite of `fontFamily` + `fontSize` + `fontWeight` + `letterSpacing` + `lineHeight` |
| `transition` | A composite of `duration` + `delay` + `timingFunction` |
| `gradient` | A list of color-stop composites |
| `strokeStyle` | A border-style descriptor |

### Three-tier mapping (operational pattern)

```
Brand raw                  Primitive token             Semantic token              Component token
oklch(60% 0.22 290) ---->  --brand-violet-500  ---->  --color-action-primary ---->  --button-primary-bg
oklch(98% 0.005 290) --->  --brand-neutral-50  ---->  --surface-1            ---->  --card-bg
oklch(20% 0.02 290) ---->  --brand-neutral-900 ---->  --color-text-strong    ---->  --heading-color
```

ALWAYS consume from the lowest applicable tier in a component file. NEVER hardcode a raw color or dimension inside a component stylesheet. The lowest applicable tier is the component token if one exists, otherwise the semantic token, otherwise the primitive token.

### Aliasing syntax

Token references use the `{group.token}` syntax per the DTCG spec :

```json
{
  "color": {
    "brand": {
      "violet-500": { "$type": "color", "$value": "oklch(60% 0.22 290)" }
    },
    "action": {
      "primary": { "$type": "color", "$value": "{color.brand.violet-500}" }
    }
  }
}
```

The implementation skill `[[frontend-impl-design-tokens]]` ships the build pipeline that emits CSS custom properties from this format.

## 5. Cascade layer ordering (recommended baseline)

```css
@layer reset, tokens, base, components, utilities, overrides;
```

| Layer | Purpose |
|-------|---------|
| `reset` | Modern CSS reset or normalize |
| `tokens` | Emitted custom properties from the DTCG token files |
| `base` | Element-level defaults (typography, link colors, focus rings) |
| `components` | Component class selectors |
| `utilities` | Single-purpose utility classes (when used alongside components) |
| `overrides` | Last-resort per-page or per-context overrides |

Third-party CSS (a vendor widget, a CMS stylesheet) MUST be imported into an isolated layer earlier than `components` so the project styles override cleanly :

```css
@import url("vendor.css") layer(vendor);
@layer vendor, reset, tokens, base, components, utilities, overrides;
```

Per [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19), layered rules cascade by layer order regardless of selector specificity. Unlayered rules win over layered rules of the same origin and importance, except when `!important` is used : with `!important`, layered rules win over unlayered rules, and earlier layers win over later layers.

## 6. Container query primitive reference

Per [MDN : Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19) :

```css
.card-host {
  container-type: inline-size;
  container-name: card;
}

@container card (inline-size > 480px) {
  .card { grid-template-columns: 1fr 2fr; }
}
```

Container-relative units : `cqi` (inline-size), `cqb` (block-size), `cqw` (width), `cqh` (height), `cqmin`, `cqmax`. ALWAYS prefer container queries over media queries when a component is reused at multiple widths.

## 7. View Transitions, anchor positioning, popover (primitive index)

These primitives are the building blocks of distinctive native-first design. The detailed signatures belong in the dedicated implementation skills, but the design-philosophy decision is to ALWAYS reach for them first :

- **View Transitions API** : page-level cross-document transitions and same-document state transitions ; CSS pseudo-elements `::view-transition-old(name)` and `::view-transition-new(name)`
- **Popover API** : HTML `popover` attribute (auto / manual) ; `showPopover()`, `hidePopover()`, `togglePopover()`
- **Anchor positioning** : `anchor-name: --a` on the anchor, `position-anchor: --a` on the floating element, `anchor()` and `inset-area` for placement, `@position-try` for fallback positions
- **`<dialog>`** : `showModal()` for modal, `show()` for non-modal, native focus trap and `::backdrop` styling

## 8. Sources (verified 2026-05-19)

- [web.dev : Vitals](https://web.dev/articles/vitals)
- [web.dev : Baseline](https://web.dev/baseline)
- [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C : Understanding Target Size Minimum 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [MDN : Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using)
- [Design Tokens Format Module 2025.10](https://designtokens.org/tr/drafts/format/)
