---
name: frontend-core-design-philosophy
description: >
  Use when starting a new frontend project, reviewing a landing page that "looks AI-generated", or
  deciding between a default template pattern and a bespoke alternative.
  Prevents the AI-generic visual fingerprint (rounded-md gray cards in a 3-column grid under a
  centered hero, Inter/Geist at one weight, slate-plus-indigo palette, hover lift on every card)
  by giving deterministic rules for distinctive, system-driven, accessible, performant design.
  Covers what AI-generic looks like, the nine visual fingerprints of distinctive design,
  system-over-snowflake token thinking, accessibility as a design foundation (WCAG 2.2 SC 2.4.11,
  2.4.13, 2.5.7, 2.5.8), and how Core Web Vitals (LCP, INP, CLS) constrain visual decisions.
  Keywords: oklch, design tokens, container queries, view transitions, popover, anchor positioning,
  subgrid, cascade layers, prefers-reduced-motion, WCAG 2.2, LCP, INP, CLS, Baseline, looks
  generic, looks AI-generated, looks like every other site, blends in too much, missing
  personality, boring template, how do I make my site distinctive, why does my UI look AI-made,
  what makes good design, modern web design principles.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Core : Design Philosophy

This skill is the cross-reference index for distinctive frontend design. It defines the philosophy that every other skill in the Frontend Design package operates under. It does not implement components or pick brand colors. It tells the agent ALWAYS to challenge the default template and gives the deterministic rules for doing so.

## Quick Reference

### What this skill decides

- Whether a proposed visual pattern is AI-generic or distinctive
- Whether a UI element should be a one-off (snowflake) or a system token / component
- Whether a visual decision passes WCAG 2.2 at AA
- Whether a design choice fits within the Core Web Vitals budget

### What this skill does NOT decide

- Specific brand colors or logos (out of scope, brand-dependent)
- Framework-specific code (no React, Vue, Solid, Svelte, Angular)
- Concrete color palettes (deferred to `[[frontend-theming-color-palette-oklch]]`)
- Concrete typographic scales (deferred to `[[frontend-impl-typography-system]]`)
- Component implementations (deferred to category-specific skills)

### Core principles (ranked, MUST be applied in order)

1. **Accessibility is the floor.** ALWAYS satisfy WCAG 2.2 AA before any visual decision is finalized. A pattern that fails 2.4.13 (Focus Appearance) or 2.5.8 (Target Size Minimum) is not a candidate, regardless of how it looks ([W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19)).
2. **Performance is the budget.** ALWAYS measure visual decisions against LCP under 2.5 s, INP under 200 ms, CLS at or below 0.1 ([web.dev : Vitals](https://web.dev/articles/vitals) (verified 2026-05-19)).
3. **System over snowflake.** ALWAYS prefer a token / component / theme decision that scales, over a one-off bespoke style that does not.
4. **Native platform first.** ALWAYS prefer browser primitives (`<dialog>`, Popover API, anchor positioning, view transitions) over JS-rebuilt equivalents.
5. **Progressive enhancement.** ALWAYS ship a working HTML+CSS layer first, then layer JS for behavior that the platform cannot do.
6. **Distinctive over default.** AFTER the four floors above are met, ALWAYS challenge the AI-generic default and apply the distinctive alternative listed in `references/methods.md`.

### AI-generic fingerprint checklist (any THREE of these means redesign)

- Centered hero with one short bold headline and three rounded-md gray cards in a CSS Grid below it
- Slate-gray neutral palette with one indigo or violet accent used only on buttons
- Inter or Geist body font at a single weight (regular or medium) at scale ratio 1.125 or less
- Uniform corner radius (`rounded-md`, `border-radius: 6px`) across surfaces, controls, and accents
- Card hover state of `translate3d(0, -2px, 0)` plus `shadow-md`
- Three-column link-list footer at the page bottom
- `text-center` applied to every above-the-fold block
- JS-reimplemented dropdown / modal / tooltip instead of the Popover API or `<dialog>`
- No visible focus indicator (or `outline: none` with no replacement)
- Motion that runs without a `prefers-reduced-motion: reduce` fallback

## Decision Trees

### Decision tree 1 : Is this a snowflake or a system element ?

```
Is this visual decision likely to appear more than once across the project ?
├── YES : Treat as a system element
│   │
│   ├── Is there an existing token that already encodes this decision ?
│   │   ├── YES : Use the existing token. NEVER hardcode the literal value.
│   │   └── NO : Define a new token at the appropriate tier :
│   │       ├── Primitive token (raw value, brand-specific) : `--brand-violet-500`
│   │       ├── Semantic token (role-based, brand-agnostic) : `--color-action-primary`
│   │       └── Component token (component-specific) : `--button-primary-bg`
│   │
│   └── Does the decision require a composite of values ?
│       ├── YES : Use a DTCG composite type (typography, shadow, border, transition)
│       │   per [Design Tokens Format Module 2025.10](https://designtokens.org/tr/drafts/format/)
│       │   (verified 2026-05-19).
│       └── NO : Single-value token is sufficient.
│
└── NO : Treat as a snowflake (one-off)
    │
    ├── Is this a marketing page hero, campaign landing, or hero illustration ?
    │   ├── YES : Snowflake is appropriate. Inline literal values are acceptable
    │   │         IF documented with a comment explaining the one-off scope.
    │   └── NO : Reconsider. If a page-specific style is needed only once today,
    │             it is still likely to recur. Promote to a token unless certain.
    │
    └── Does the snowflake violate any system token (e.g. uses a non-palette color) ?
        ├── YES : The snowflake escapes the system. ALWAYS surface this to the
        │          user before shipping ; brand coherence depends on it.
        └── NO : Ship as a snowflake with an inline comment.
```

### Decision tree 2 : Does this visual decision pass WCAG 2.2 ?

```
Is the decision visible content with semantic meaning ?
├── YES : Continue checks below.
└── NO : Decorative only. Confirm `aria-hidden="true"` and skip remaining checks.

CHECK 1 : Text contrast (SC 1.4.3 / SC 1.4.6)
├── Body text ≥ 18px (or ≥ 14px bold) :
│   ├── 3:1 contrast against background ? AA pass.
│   └── 4.5:1 ? AAA pass.
├── Body text smaller than the above :
│   ├── 4.5:1 ? AA pass.
│   └── 7:1 ? AAA pass.
└── If FAIL : Adjust the lightness component in `oklch(L C H)`, NEVER change the
    chroma alone ; chroma adjustments do not reliably raise contrast.

CHECK 2 : Focus appearance (SC 2.4.11 + 2.4.13)
├── Component receives keyboard focus ?
│   ├── YES :
│   │   ├── Is the entire component visible (not hidden by author content) ? AA pass.
│   │   └── Does the focus indicator have ≥ 3:1 contrast against unfocused state and
│   │       cover at least a 2 CSS-pixel perimeter ? AAA pass on 2.4.13.
│   └── NO : Not a focus check (decorative element).
└── If FAIL : Add `scroll-margin-top` for sticky-header overlap (2.4.11) and a
    branded `:focus-visible` ring meeting the perimeter and contrast requirements
    (2.4.13). NEVER ship `outline: none` without replacement.

CHECK 3 : Pointer target size (SC 2.5.8)
├── Interactive target ≥ 24x24 CSS pixels ? AA pass.
├── Target < 24x24 px BUT meets a named exception
│   (spacing, equivalent, inline, user-agent, essential per
│   [W3C : Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
│   (verified 2026-05-19)) ? AA pass.
└── Otherwise FAIL : Enlarge the target or claim the correct named exception.

CHECK 4 : Drag alternative (SC 2.5.7)
├── Functionality uses a dragging movement ?
│   ├── YES :
│   │   ├── Single-pointer (click / tap) alternative exists ? AA pass.
│   │   └── NO alternative : FAIL. Add explicit reorder buttons or a non-drag flow.
│   └── NO : Not applicable.

CHECK 5 : Motion fallback (SC 2.3.3 + reduced motion)
├── Decision introduces animation or motion ?
│   ├── YES :
│   │   ├── `@media (prefers-reduced-motion: reduce)` overrides motion with an
│   │   │   opacity dissolve or removes it entirely ? PASS per
│   │   │   [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
│   │   │   (verified 2026-05-19).
│   │   └── NO fallback : FAIL.
│   └── NO motion : Not applicable.

ALL checks pass : The decision passes WCAG 2.2 at AA. Proceed to the Decision Tree 1
"system vs snowflake" check.
ANY check fails : Redesign the affected property BEFORE shipping. NEVER mark an
accessibility check as deferred ; accessibility is the floor.
```

## Patterns

### Pattern 1 : Replace symmetric three-card grid with intentional asymmetry

The default `grid-template-columns: repeat(3, 1fr)` is the most recognizable AI-generic signal. The distinctive alternative uses container queries to define the breakpoints from the container width rather than the viewport, and an asymmetric track layout :

```css
.feature-grid {
  container-type: inline-size;
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: 1fr;
}

@container (inline-size > 640px) {
  .feature-grid {
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto auto;
  }
  .feature-grid > :first-child { grid-row: span 2; }
}
```

Container queries make the layout reusable in a sidebar or a hero without re-authoring breakpoints ([MDN : Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19)). See `references/examples.md` for the worked HTML.

### Pattern 2 : Substitute native platform primitives for JS-rebuilt UI

ALWAYS reach for the Popover API and CSS anchor positioning before writing click-outside, focus-trap, or position-recompute logic. ALWAYS reach for `<dialog>` and `showModal()` for modal patterns. The native versions ship with focus management, dismissal, escape handling, and stacking-context isolation built in.

Anchor positioning eliminates the JavaScript reflow loop : "the browser can try rendering it in a different suggested position so it is placed onscreen" ([MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using) (verified 2026-05-19)). When a feature is in Baseline, it can be relied on across the four core browsers ([web.dev : Baseline](https://web.dev/baseline) (verified 2026-05-19)).

### Pattern 3 : Color from `oklch()` with one accent

NEVER ship a six-swatch palette as decoration. The distinctive choice is a one-bold-accent palette : one chromatic anchor at high chroma off the safe axis, with grays derived via `color-mix(in oklch, ...)` against the same anchor. Perceptual uniformity makes systematic lightness scales reliable : "L: 0.5 produces equally bright colors regardless of hue, essential for systematic design scales" ([MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19)).

See `references/methods.md` for the property matrix and `[[frontend-theming-color-palette-oklch]]` for the implementation skill.

### Pattern 4 : Type as a primary design element

Variable fonts at large display sizes against tight body type create the rhythm that the AI-generic single-weight, single-scale default cannot reach. Use `font-variation-settings` to traverse the weight axis across hierarchy levels and `clamp()` to scale the headline across viewports. The implementation belongs to `[[frontend-impl-typography-system]]` ; this skill mandates that type be considered a focal element, not utility text.

### Pattern 5 : Cascade layer discipline

ALWAYS declare cascade layers at the top of the entry stylesheet :

```css
@layer reset, tokens, base, components, utilities, overrides;
```

This removes the specificity battle that defines most template stylesheets. Layered rules cascade by layer order ; "you do not have to ensure that a selector will have high enough specificity to override competing rules ; all you need to ensure is that it appears in a later layer" ([MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19)).

### Pattern 6 : Motion as state-transition marker

Motion is opt-in, not opt-out. The base state is still. Animation marks state transitions (open / close, focus, navigation), never decorates. ALWAYS pair motion with a `prefers-reduced-motion: reduce` fallback that replaces transform-based motion with an opacity dissolve. The pattern is recommended at [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19).

### Pattern 7 : Token-driven theming with system surface variables

Design tokens follow the W3C Design Tokens Community Group format module : "a design token is fundamentally information associated with a human readable name, at minimum a name/value pair" ([Design Tokens Format Module 2025.10](https://designtokens.org/tr/drafts/format/) (verified 2026-05-19)). Tokens emit as CSS custom properties scoped under `@layer tokens`. The three tiers (primitive / semantic / component) are non-negotiable ; mixing tiers is what creates "snowflakes" that never theme cleanly.

## How performance constrains design

ALWAYS reserve layout space for above-the-fold images (`aspect-ratio` or `width`/`height`) to prevent CLS. ALWAYS preload the LCP webfont. NEVER auto-play hero video unless the LCP is owned by a separate static element. Hover animations on cards MUST run only on `transform` and `opacity`, NEVER on `top`, `left`, `width`, or `height`. INP under 200 ms requires that no event-handler chain exceed 50 ms of synchronous work ; break long tasks via `await scheduler.yield()` per [web.dev : Vitals](https://web.dev/articles/vitals) (verified 2026-05-19).

The detailed budget matrix is in `references/methods.md`. The implementation skills (`[[frontend-impl-core-web-vitals]]`, `[[frontend-impl-responsive-layout]]`, `[[frontend-a11y-motion-contrast-wcag22]]`) inherit these constraints.

## Approved spec-aligned inspiration sources

ALWAYS look at, and cite, the following when reaching for inspiration :

- web.dev articles and patterns : browser-team-curated example library ([web.dev](https://web.dev) (verified 2026-05-19))
- MDN runnable demos on `:has()`, `@scope`, `oklch()`, anchor positioning, view transitions
- W3C WAI ARIA Authoring Practices Guide (APG) for the accessible interaction model
- Baseline status page : Baseline 2024 and 2025 features are the inspiration backlog ([web.dev : Baseline](https://web.dev/baseline) (verified 2026-05-19))

NEVER look at, or copy from, Dribbble shots, Behance pages, AI-generated screenshot galleries, or Tailwind UI marketing pages for forward direction. These either feed back into the AI-generic corpus or are explicit reference templates.

## Reference Links

- `references/methods.md` : the full decision matrix (AI-generic default vs distinctive choice + spec rationale), the performance budget matrix, the WCAG 2.2 SC checklist
- `references/examples.md` : code snippets demonstrating each pattern (no renderable fragment, since this is a philosophy skill)
- `references/anti-patterns.md` : seven anti-patterns with symptom / root cause / fix structure

## Cross-references to other skills

- `[[frontend-core-architecture]]` : the project structure that this philosophy operates inside
- `[[frontend-core-web-standards-baseline]]` : which web platform features are safe to depend on
- `[[frontend-theming-color-palette-oklch]]` : implements the `oklch()` palette decisions
- `[[frontend-impl-typography-system]]` : implements the typographic scale and variable-font axis decisions
- `[[frontend-impl-responsive-layout]]` : implements container queries, subgrid, and asymmetric layouts
- `[[frontend-impl-core-web-vitals]]` : implements the LCP / INP / CLS budget enforcement
- `[[frontend-a11y-motion-contrast-wcag22]]` : implements the WCAG 2.2 SC compliance
- `[[frontend-impl-design-tokens]]` : implements the DTCG token system

## Primary sources (verified 2026-05-19)

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
