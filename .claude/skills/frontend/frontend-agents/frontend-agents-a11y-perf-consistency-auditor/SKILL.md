---
name: frontend-agents-a11y-perf-consistency-auditor
description: >
  Use when auditing a UI component, page, or feature for the three combined
  failure modes a frontend product can ship : WCAG 2 2 accessibility
  violations, Core Web Vitals (LCP / INP / CLS) regressions, and cross-skill
  consistency drift (naming, structure, token usage, file shape). Spawn this
  agent skill when reviewing a pull request, before merging a feature branch,
  during a quarterly compliance audit, when triaging a Lighthouse score
  regression, or when validating a newly-authored skill file against the
  package quality rules.
  Prevents the most common audit gaps in 2026 : skipping the accessibility
  pass because the page "looks fine" while still failing WCAG 2 5 8 Target
  Size or 2 4 11 Focus Not Obscured, trusting a green Lighthouse score
  without checking semantic correctness, fixing performance by intuition
  before measuring against the binding p75 thresholds, naming-convention
  drift across components (`--my-bg` vs `--color-bg-surface`), magic
  numbers in component CSS despite a token system existing, `<div
  role="button">` shipped after the accessibility team approved an earlier
  version using `<button>`, and skill files that diverge from the YAML
  frontmatter shape required by the package validators.
  Covers the codified A11Y checklist (9 deterministic rules anchored to
  WCAG 2 2 and ARIA APG : accessible name on every interactive, native HTML
  over ARIA, focus-visible matching pair, modal `<dialog>` with
  `showModal()` + `aria-labelledby`, pre-existing live regions, 24-by-24 px
  target size with five-exception fallback, 4 5 to 1 / 3 to 1 contrast
  ratios, `prefers-reduced-motion: reduce` branch on every animation, no
  positive `tabindex`, no `tabindex` on `<dialog>`), the PERF checklist (7
  rules anchored to Core Web Vitals : explicit image dimensions or
  `aspect-ratio`, `fetchpriority="high"` on LCP image, `loading="lazy"`
  below the fold, compositor-only animation properties, `will-change`
  applied transiently not permanently, webfont budget under 100 KB woff2
  per face, critical CSS inlined or preloaded), the CONSISTENCY checklist
  (6 rules anchored to the package quality contract : YAML frontmatter
  shape, four-file structure, line-count limit, English-only, colon
  headings, `[[skill-name]]` cross-reference format), severity grading
  (ERROR for WCAG AA fail or CWV miss, WARNING for missed best practice,
  INFO for style inconsistency), and the prioritized audit-report output
  shape (JSON for parent-agent consumption plus Markdown for human review).
  Keywords: a11y audit, accessibility audit, ARIA audit, WCAG audit, WCAG 2 2,
  Core Web Vitals, CWV, LCP, INP, CLS, focus-visible, prefers-reduced-motion,
  aria-label, aria-labelledby, accessible name, target size, contrast ratio,
  forced-colors, fetchpriority, loading lazy, aspect-ratio, will-change,
  scheduler yield, GPU animations, design tokens consistency, kebab-case,
  cross-skill audit, validator, lint, skill-package quality, missing alt
  text, focus invisible, animation does not respect setting, image without
  dimensions, custom button not keyboard accessible, slow page, skill format
  inconsistent, design system drift, inconsistent components, how do I
  audit my site for accessibility, performance audit, WCAG checker, find
  missing alt text, validate skill format, cross-skill consistency check,
  how to review accessibility, how to check performance, how to audit UI
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Agents : A11y + Perf + Consistency Auditor

This skill is an AGENT skill : it codifies a three-axis static-analysis checklist (Accessibility, Performance, Consistency) and the audit-report shape that parent agents consume. Spawn this skill when auditing a UI component, a pull request, a feature branch, or a newly-authored skill file. The skill does NOT cover general accessibility theory (see `[[frontend-a11y-aria-patterns]]`), Core Web Vitals theory (see `[[frontend-perf-core-web-vitals-inp]]`), design-token enforcement (see `[[frontend-agents-design-system-validator]]`), automated visual regression testing, or browser-rendered audits. This is STATIC ANALYSIS only.

## Quick Reference

### Audit workflow

1. **Identify scope** : single component, single page, full feature, single skill file. The checklist applies recursively to any of these targets.
2. **Read source materially** : load every `*.html`, `*.css`, `*.js`, `*.ts`, `*.md` file in scope. Do not infer ; quote line numbers.
3. **Apply the three checklists in order** : A11Y -> PERF -> CONSISTENCY. Each rule produces zero or more findings.
4. **Grade severity** : ERROR (WCAG AA fail or CWV threshold miss), WARNING (missed best practice), INFO (style inconsistency).
5. **Emit the report** : JSON for parent-agent consumption, Markdown for human review. See `references/examples.md` for the canonical shape.
6. **Suggest fixes** : every finding includes a fix snippet citing the relevant skill (e.g. `[[frontend-a11y-motion-contrast-wcag22]]` SC reference).

### Decision tree 1 : Which checklist first ?

```
Auditing a UI component, page, or feature ?
  -> Run A11Y first (semantic-HTML-first rule catches structural issues
     that affect everything else), then PERF, then CONSISTENCY.

Auditing a skill file or documentation ?
  -> Run CONSISTENCY first (file shape, frontmatter, line count), then
     scan code blocks within the docs for A11Y and PERF issues.

Auditing a pull-request diff (incremental change) ?
  -> Run all three on the changed files, plus CONSISTENCY on any newly
     added files. Skip unchanged files unless they reference changed APIs.

Audit triggered by a Lighthouse regression ?
  -> PERF first (the regression is metric-driven), then A11Y on the same
     scope to catch what Lighthouse missed (semantic HTML correctness).
```

### Decision tree 2 : ARIA needed or native enough ?

```
Element behaves like a button (click to perform action) ?
  -> Use <button>. ERROR if `<div role="button">` is found.
     Native button gets focus-trap, keyboard activation (Space, Enter),
     forced-colors mapping (ButtonText), and screen-reader semantics for free.

Element behaves like a link (navigation) ?
  -> Use <a href>. ERROR if `<button>` used for navigation.

Element is a form control ?
  -> Use <input>, <select>, <textarea>, <button>. ERROR if a div + custom
     keyboard handlers reimplements one of these.

Element is a disclosure (expand / collapse panel) ?
  -> Use <details> + <summary>. Native browser handles state + keyboard.

Element is a dialog ?
  -> Use <dialog> + showModal(). ERROR if a custom modal is built.

Element has NO native equivalent (combobox, custom tree, custom slider) ?
  -> ARIA is required. Follow the W3C WAI APG pattern exactly.
     See [[frontend-a11y-aria-patterns]].
```

### Decision tree 3 : Performance regression : CLS, LCP, or INP ?

```
Layout shifted as content loaded ?
  -> CLS. Audit <img>, <video>, <iframe>, ad slots for explicit width / height
     or aspect-ratio. Audit webfont swap for matched fallback metrics.

Hero element rendered late on first paint ?
  -> LCP. Audit for `fetchpriority="high"`, `<link rel="preload">`, and
     verify `loading="lazy"` is NOT on the LCP image.

Click felt laggy ?
  -> INP. Audit event handlers for synchronous long tasks. Verify yielding
     via scheduler.yield with setTimeout fallback. Check for
     requestAnimationFrame misuse as a generic yield.

Animation feels janky ?
  -> Audit animation properties. ERROR if width / height / top / left animated.
     Only transform / opacity / filter are compositor-only.

All metrics look fine but real users complain ?
  -> Field RUM. Lab metrics underestimate INP. Audit for third-party
     scripts blocking the main thread.
```

## A11Y checklist (9 rules)

Anchored to [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19) and [W3C WAI APG](https://www.w3.org/WAI/ARIA/apg/patterns/) (verified 2026-05-19).

| ID | Rule | Severity | WCAG / APG anchor |
|----|------|----------|--------------------|
| A1 | Every interactive element has an accessible name (visible text, `aria-label`, or `aria-labelledby`). | ERROR | WCAG 4 1 2 Name, Role, Value |
| A2 | `:focus { outline: none }` MUST have a matching `:focus-visible { outline: ... }` with 3 to 1 contrast against the unfocused state. | ERROR | WCAG 2 4 7 Focus Visible + 2 4 13 Focus Appearance |
| A3 | Modal `<dialog>` uses `dialog.showModal()` AND has `aria-labelledby` (or `aria-label`). | ERROR | APG Dialog Modal pattern |
| A4 | Live regions exist in the DOM BEFORE the message is inserted. | ERROR | APG Alert pattern, MDN ARIA Live Regions |
| A5 | Target size meets 24-by-24 CSS pixel test OR matches one of the five exceptions (spacing, equivalent, inline, UA, essential). | ERROR | WCAG 2 5 8 Target Size (Minimum) AA |
| A6 | Text contrast meets 4 5 to 1 (normal text) or 3 to 1 (large text) ; non-text and UI contrast meets 3 to 1. | ERROR | WCAG 1 4 3 + 1 4 11 |
| A7 | Every CSS animation has a `@media (prefers-reduced-motion: reduce)` branch. | ERROR | MDN prefers-reduced-motion |
| A8 | NO positive `tabindex` values (0 and -1 are acceptable). | ERROR | WCAG 2 4 3 Focus Order |
| A9 | Semantic HTML preferred over ARIA roles. `<div role="button">` is an ERROR ; use `<button>`. | ERROR | First rule of ARIA |

## PERF checklist (7 rules)

Anchored to [web.dev : Core Web Vitals](https://web.dev/articles/vitals) (verified 2026-05-19) and [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19).

| ID | Rule | Severity | Metric |
|----|------|----------|--------|
| P1 | `<img>`, `<video>`, `<iframe>` have explicit `width` and `height` attributes OR an `aspect-ratio` CSS rule. | ERROR | CLS |
| P2 | LCP image has `fetchpriority="high"`. Bonus : `<link rel="preload" as="image" imagesrcset=... fetchpriority="high">`. | ERROR | LCP |
| P3 | Below-the-fold images have `loading="lazy"`. The LCP image does NOT have `loading="lazy"`. | ERROR | LCP |
| P4 | Animations use ONLY `transform`, `opacity`, or `filter`. ERROR if `width`, `height`, `top`, `left`, `margin`, or `padding` is animated. | WARNING | INP, animation jank |
| P5 | `will-change` applied transiently (during interaction) and removed after. NEVER permanently. | WARNING | Memory, INP |
| P6 | Webfont files are at most 100 KB woff2 per face. `font-display: swap` declared. | WARNING | LCP, CLS |
| P7 | Critical CSS inlined in `<head>` OR `<link rel="preload" as="style">` for the critical bundle. | WARNING | LCP |

## CONSISTENCY checklist (6 rules)

Anchored to the package validator scripts at `Skill-Package-Workflow-Template/scripts/`.

| ID | Rule | Severity |
|----|------|----------|
| C1 | YAML frontmatter has `name`, `description` (folded scalar `>`, NOT quoted), `license: MIT`, `compatibility`, `metadata` with `author` and `version`. | ERROR |
| C2 | Skill folder contains exactly `SKILL.md` + `references/methods.md` + `references/examples.md` + `references/anti-patterns.md`. NO `README.md` inside skill folders. | ERROR |
| C3 | `SKILL.md` is at most 500 lines. Overflow lives in `references/`. | ERROR |
| C4 | All skill content is English-only. NEVER Dutch or other languages inside skill files. | ERROR |
| C5 | Section headings use `:` as separator (e.g. `## Quick Reference`, `### Pattern : foo`). NEVER em-dash. | ERROR |
| C6 | Cross-references use `[[skill-name]]` Markdown link format. | WARNING |

## Severity grading

| Severity | Definition |
|----------|------------|
| ERROR | Violates WCAG 2 2 AA, misses a Core Web Vital threshold at p75, or breaks the package quality contract. |
| WARNING | Missed best practice that does not block conformance. |
| INFO | Style inconsistency, naming drift, missing optional metadata. |

## Audit-report output shape

The agent emits TWO parallel formats per audit.

### JSON for parent-agent consumption

```json
{
  "scope": "skills/source/frontend-component/frontend-component-modal-toast-system/",
  "summary": {
    "files_audited": 4,
    "findings": { "ERROR": 0, "WARNING": 2, "INFO": 1 }
  },
  "findings": [
    {
      "id": "A2-2026-05-19-001",
      "severity": "WARNING",
      "category": "A11Y",
      "rule": "A2",
      "file": "SKILL.md",
      "line": 142,
      "message": "Example code block uses :focus { outline: none } without :focus-visible override.",
      "fix": "Add :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }",
      "reference": "[[frontend-a11y-motion-contrast-wcag22]] SC 2 4 13"
    }
  ]
}
```

### Markdown for human review

```markdown
# Audit Report

**Scope** : skills/source/frontend-component/frontend-component-modal-toast-system/
**Files audited** : 4
**Findings** : 0 ERROR, 2 WARNING, 1 INFO

## Findings

### WARNING : A2 (Focus visible override missing)
- **File** : SKILL.md
- **Line** : 142
- **Issue** : Example code block uses `:focus { outline: none }` without `:focus-visible` override.
- **Fix** : Add `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }`
- **Reference** : [[frontend-a11y-motion-contrast-wcag22]] SC 2 4 13
```

See [references/examples.md](references/examples.md) for the canonical full report and several worked audits.

## Cross-references

- `[[frontend-a11y-aria-patterns]]` : ARIA role surface, APG patterns (alert, dialog, combobox, tabs).
- `[[frontend-a11y-focus-keyboard-inert]]` : focus management, `:focus-visible`, `inert` attribute.
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 2 2 nine new SCs, motion / contrast preferences, forced-colors.
- `[[frontend-perf-core-web-vitals-inp]]` : LCP / INP / CLS thresholds, yield ladder, Speculation Rules.
- `[[frontend-perf-animation-gpu-containment]]` : compositor-only animations, CSS containment.
- `[[frontend-impl-design-tokens]]` : three-tier token chain, naming conventions (delegated enforcement to `[[frontend-agents-design-system-validator]]`).
- `[[frontend-agents-design-system-validator]]` : token-enforcement-specific auditor.

## Reference Links

- [references/methods.md](references/methods.md) : full rule surface for all 22 checks, file-pattern matching, severity thresholds, JSON Schema for the report.
- [references/examples.md](references/examples.md) : sample audit reports (JSON + Markdown) for three representative targets (a component, a feature branch, a skill file).
- [references/anti-patterns.md](references/anti-patterns.md) : eight anti-patterns the auditor catches with high frequency, with the rule ID, symptom, and fix snippet.

## Authoritative sources

- [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19)
- [W3C WAI : ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) (verified 2026-05-19)
- [W3C WAI APG : Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) (verified 2026-05-19)
- [web.dev : Vitals](https://web.dev/articles/vitals) (verified 2026-05-19)
- [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19)
- [MDN : :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) (verified 2026-05-19)
- [MDN : ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/aria-live_region_role) (verified 2026-05-19)
