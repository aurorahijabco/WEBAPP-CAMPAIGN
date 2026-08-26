---
name: frontend-agents-design-system-validator
description: >
  Use when auditing a CSS codebase for design-system compliance,
  reviewing a pull request that touches `.css` / `.scss` / `.ts` /
  `.tsx` / `.vue` / `.svelte` files with style declarations, hunting
  for hardcoded color / spacing / font-size / radius values that
  bypass the design-token layer, validating that components consume
  semantic tokens (not primitive tokens directly), confirming the
  three-tier token chain (primitive -> semantic -> component) is
  intact, verifying the `@layer tokens, theme, base, components,
  utilities;` cascade-layer order is declared at the project root,
  checking that animatable custom properties are `@property`-
  registered for proper interpolation, sweeping for orphaned tokens
  (defined but never referenced) or dangling references
  (`var(--undefined)` with no `@property` default), and confirming
  WCAG 1.4.3 / 1.4.11 contrast ratios hold for every text-on-
  background and UI-component pair in both light and dark variants.
  Use as a checklist agents and reviewers apply BEFORE merging UI
  changes, not as a runtime feature.
  Prevents the six dominant design-system-drift failure modes :
  hardcoded color values (`#3b82f6`, `rgb(...)`, `oklch(...)`)
  outside the `@layer tokens` block where authors slip raw values
  into components, components reaching directly into primitive
  tokens (`var(--brand-blue-500)`) instead of going through a
  semantic layer (`var(--color-action-primary)`) so a brand color
  change propagates to every consumer, non-namespaced custom-
  property names (`--color-1`, `--my-thing`) that drift over time
  because they lack a discoverable convention, animatable tokens
  that are not `@property`-registered so transitions snap instead
  of interpolate, semantic tokens defined for light mode only with
  no dark-mode variant (the design system has a "dark mode" feature
  that breaks the moment a new token is introduced), and `!important`
  declarations leaking out of the `utilities` layer because the
  cascade-layer discipline was abandoned.
  Covers the deterministic validation checklist (token usage, three-
  tier chain, naming convention, `@layer` order, `@property`
  registration, orphan detection, dark / light parity), the canonical
  audit-report shape (path : line : severity : violation : suggested
  fix, with severity = error / warning / info), the grep recipes for
  raw color hunting (`#[0-9a-f]{3,8}`, `rgb\\(`, `rgba\\(`, `hsl\\(`,
  `oklch\\(`, `oklab\\(` outside the token layer), the orphan-token
  detection methodology (extract all `--*:` declarations, extract all
  `var(--*)` references, diff), the WCAG 1.4.3 Contrast (Minimum)
  thresholds (4.5:1 normal, 3:1 large text where large = 18 pt or
  14 pt bold), the WCAG 1.4.11 Non-Text Contrast threshold (3:1 for
  UI components and graphical objects), and the suggested-fix
  pattern for each violation class.
  Keywords: design system, design system validator, design tokens,
  token validator, token audit, audit tokens, design system review,
  design system drift, design system lint, hardcoded color audit,
  primitive token, semantic token, component token, three-tier
  tokens, three-tier chain, var, custom property, css custom property,
  --color-, --space-, --font-size-, --radius-, --shadow-,
  cascade layers, @layer tokens, @property, @property registration,
  WCAG 1.4.3, WCAG 1.4.11, contrast ratio, 4.5:1, 3:1,
  orphan token, dangling reference, theme coherence,
  light dark parity, dark mode parity,
  hex color in component, magic spacing number, magic value,
  hardcoded color sneaking in, brand color override,
  tokens not loaded, palette inconsistent, contrast failing,
  dark mode broken, design system drift,
  how to validate design system, how to audit tokens,
  how to find hardcoded colors in CSS, design system review
  checklist, design token linting, how do I enforce tokens,
  PR design system review.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Agents : Design System Validator

Deterministic checklist that agents and code reviewers apply BEFORE merging UI changes. Validates token usage, three-tier chain, cascade-layer discipline, `@property` registration, dark / light parity, and WCAG contrast. Outputs a findings report.

## Quick Reference

### The seven validation rules (deterministic)

| # | Rule | Severity if violated |
|---|---|---|
| 1 | Every color / spacing / font-size / radius / shadow value MUST be a `var(--token)` reference. NEVER a raw value outside the `@layer tokens` block. | ERROR |
| 2 | Three-tier chain : component CSS consumes SEMANTIC tokens; semantic tokens reference PRIMITIVE tokens. Components NEVER reference primitives directly. | WARNING |
| 3 | Every defined token MUST be referenced somewhere (no orphans). Every reference MUST resolve (no dangling). | ERROR (dangling) / INFO (orphan) |
| 4 | Naming convention : kebab-case + namespaced prefix (`--color-*`, `--space-*`, `--font-size-*`, `--line-height-*`, `--radius-*`, `--shadow-*`, `--motion-*`, `--easing-*`). | WARNING |
| 5 | `@layer tokens, theme, base, components, utilities;` MUST be declared at the project root CSS entry. | ERROR |
| 6 | Every animatable custom property (used in `transition` / `animation`) MUST be `@property`-registered with `syntax`, `inherits`, `initial-value`. | WARNING |
| 7 | No `!important` outside the `utilities` layer. | ERROR |

### Bonus rules (parity + contrast)

| # | Rule | Severity if violated |
|---|---|---|
| 8 | Every semantic token MUST have a value in BOTH light and dark variants (either via `light-dark()` or both `:root` + `:root[data-theme="dark"]` blocks). | ERROR |
| 9 | Every text-on-background pair MUST meet WCAG 1.4.3 : 4.5:1 normal, 3:1 large (>= 18pt or >= 14pt bold). | ERROR |
| 10 | Every UI component and graphical object MUST meet WCAG 1.4.11 : 3:1 against adjacent colors. | ERROR |

### Audit-report shape

```
<file>:<line>:<col>  [SEVERITY]  <RULE-ID>  <message>
                                              suggested fix : <code>
```

Example :

```
src/components/button.css:42:14   ERROR   DS-01   Hardcoded color "#3b82f6"
                                              suggested fix : background: var(--color-action-primary);
src/components/card.css:8:3       WARNING DS-02   Component uses primitive --brand-blue-500
                                              suggested fix : introduce semantic --color-card-accent
```

## Decision Trees

### Tree 1 : Token or raw value?

```
Is the declaration inside the @layer tokens block AND defining a
primitive token (e.g., --brand-blue-500: #2563eb)?
   YES -> ALLOWED. Raw values are the definition layer; primitives
          are where colors / scales originate.
   NO  -> next question

Is the value a CSS keyword (currentcolor, transparent, inherit,
initial, unset, revert, revert-layer, auto, none, 0)?
   YES -> ALLOWED. Keywords are not tokens.
   NO  -> next question

Is the value a numeric measurement with no unit (e.g., line-height: 1.5,
opacity: 0.6, z-index: 10)?
   YES -> ALLOWED. Unitless numbers do not need tokens unless they
          encode a design decision worth naming.
   NO  -> ERROR. Convert to var(--token). If no token exists, propose
          one in the @layer tokens block.
```

### Tree 2 : Primitive or semantic tier?

```
Is the consumer a NAMED THEME variable (e.g., --color-action-primary)
referencing a brand color?
   YES -> semantic. References primitive : --color-action-primary: var(--brand-blue-500);

Is the consumer a COMPONENT (.button, .card, .input) declaring its
visual appearance?
   YES -> use semantic tokens. background: var(--color-action-primary);
          NEVER background: var(--brand-blue-500);

Is a new component need a color / spacing the semantic layer does not
expose?
   YES -> introduce a new semantic token in @layer theme that wraps
          the primitive. Then consume it from the component.
```

### Tree 3 : Contrast fail : change foreground or background?

```
Is the foreground the brand color (locked by brand guidelines)?
   YES -> change the background. Pick a background that pairs at
          >= 4.5:1 (normal) or >= 3:1 (large).
   NO  -> next question

Is the background a fixed surface (canvas / page background)?
   YES -> darken / lighten the foreground until ratio passes.
   NO  -> next question

Both are flexible?
   -> pick the smaller delta. If foreground is one step too light,
      darken foreground. If background is one step too dark, lighten
      background. Avoid changing both simultaneously.

Tool tip : in OKLCH color, adjusting only the L channel changes
contrast predictably without shifting hue.
```

## The Audit Algorithm

### Step 1 : Inventory token definitions

```bash
# Extract every --custom-property: definition
grep -hE '^[[:space:]]*--[a-z][a-z0-9-]*:' src/**/*.css | \
  sed -E 's/^[[:space:]]*//;s/:.*//' | sort -u > .audit/tokens-defined.txt
```

### Step 2 : Inventory token references

```bash
# Extract every var(--name) reference
grep -hoE 'var\(--[a-z][a-z0-9-]*' src/**/*.css | \
  sed -E 's/var\(//' | sort -u > .audit/tokens-referenced.txt
```

### Step 3 : Diff for orphans and dangling

```bash
comm -23 .audit/tokens-defined.txt    .audit/tokens-referenced.txt > .audit/orphans.txt
comm -13 .audit/tokens-defined.txt    .audit/tokens-referenced.txt > .audit/dangling.txt
```

`orphans.txt` = defined-but-unused (INFO). `dangling.txt` = referenced-but-undefined (ERROR unless every reference has an explicit fallback inside `var(--name, <fallback>)`).

### Step 4 : Hunt raw colors outside `@layer tokens`

```bash
# Files NOT containing @layer tokens definition lines : list all color literals
grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|oklab\(' src/**/*.css | \
  grep -v -F -f .audit/tokens-defined-line-numbers.txt > .audit/raw-colors.txt
```

In practice this requires a real CSS parser (PostCSS, Stylelint) to discriminate "inside the tokens layer" from "outside." The grep is a 90% approximation.

### Step 5 : Verify cascade-layer order

```bash
grep -hE '^@layer' src/styles/main.css
# Expected exact line :
# @layer tokens, theme, base, components, utilities;
```

If absent or out of order : ERROR.

### Step 6 : Find animatable tokens not `@property`-registered

```bash
# Tokens referenced inside transition / animation declarations :
grep -rnE 'transition[^;]*var\(--[a-z-]+\)|animation[^;]*var\(--[a-z-]+\)' src/**/*.css

# @property registrations :
grep -rnE '@property\s+--[a-z-]+' src/**/*.css

# Diff to find unregistered animatable tokens.
```

### Step 7 : Dark / light parity

```bash
# Tokens defined in :root :
# Tokens defined in :root[data-theme="dark"] (or via light-dark()) :
# Diff for tokens defined only in one branch.
```

### Step 8 : Contrast (requires color math, not grep)

Use a real contrast checker. Recommended tools : `axe-core` (browser), `pa11y` (CLI), or `colorjs.io` for OKLCH-aware programmatic checks.

For every text-on-surface pair, compute the WCAG contrast ratio. Fail if `< 4.5:1` for normal text or `< 3:1` for large text (>= 18 pt or >= 14 pt bold).

For every UI component (button border, focus ring, icon) versus adjacent background, fail if `< 3:1` (WCAG 1.4.11).

## Patterns

### Pattern A : Proper three-tier chain

```css
@layer tokens {
  :root {
    /* Primitive : raw brand colors. ONLY definitions live here. */
    --brand-blue-500: oklch(60% 0.18 250);
    --brand-blue-600: oklch(54% 0.18 250);
    --gray-50:  oklch(98% 0 0);
    --gray-900: oklch(15% 0 0);

    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
  }
}

@layer theme {
  :root {
    color-scheme: light dark;
    /* Semantic : authors reference these in components. */
    --color-fg:                light-dark(var(--gray-900), var(--gray-50));
    --color-bg:                light-dark(var(--gray-50),  var(--gray-900));
    --color-action-primary:    light-dark(var(--brand-blue-500), var(--brand-blue-600));
    --color-action-primary-fg: light-dark(var(--gray-50),  var(--gray-900));
  }
}

@layer components {
  .button {
    background: var(--color-action-primary);
    color:      var(--color-action-primary-fg);
    padding:    var(--space-2) var(--space-4);
  }
}
```

### Pattern B : Audit report (markdown)

```markdown
# Design System Audit Report

Repository : example-app
Date       : 2026-05-19
Scanned    : 47 .css files, 12 component files

## Errors (7)

- `src/components/button.css:42:14` : DS-01 hardcoded color `#3b82f6`
  - Fix : `background: var(--color-action-primary);`
- `src/styles/main.css:1:1` : DS-05 missing `@layer tokens, theme, base, components, utilities;`
  - Fix : add the layer-order declaration as the first line
- `src/components/card.css:18:3` : DS-08 token `--color-card-bg` defined for light only
  - Fix : add dark variant via `light-dark()` OR `[data-theme="dark"]` block

## Warnings (5)

- `src/components/badge.css:5:3` : DS-02 component uses primitive `var(--brand-blue-500)`
  - Fix : introduce semantic `--color-badge-accent`
- `src/styles/tokens.css:7:3` : DS-04 token `--color-1` lacks namespace
  - Fix : rename to `--color-bg-surface`

## Info (2)

- `src/styles/tokens.css:42:3` : DS-03 orphan token `--space-12` (defined but never referenced)
  - Suggested : remove if unused, or document why retained
```

### Pattern C : Validator agent prompt

```
You are the design-system-validator agent. Read the CSS files in
src/components/ and src/styles/. Apply the seven validation rules
from frontend-agents-design-system-validator/SKILL.md.

For each violation :
  1. Report file:line:col
  2. Cite the rule ID
  3. Explain in one sentence
  4. Propose a fix as a code snippet

Output : single markdown audit report grouped by severity. Sort
within each severity by file then line. Cross-reference the
relevant frontend skill for each rule (e.g., DS-01 -> [[frontend-impl-design-tokens]]).
```

## Out of Scope

- Accessibility / performance / consistency audits beyond the contrast checks (covered in `[[frontend-agents-a11y-perf-consistency-auditor]]`).
- Color-palette generation in OKLCH (covered in `[[frontend-theming-color-palette-oklch]]`).
- Design-token format specification (covered in `[[frontend-impl-design-tokens]]`).
- Framework-specific token integration (Tailwind / shadcn / Material).
- Stylelint / PostCSS plugin configuration.

## Hard Rules (Binding)

1. NEVER allow raw color / spacing / font-size / radius values OUTSIDE the `@layer tokens` block. Components MUST reference tokens.
2. NEVER allow a component to reference a primitive token directly (`var(--brand-blue-500)`). Components reference semantic tokens; semantic tokens reference primitives.
3. NEVER allow `!important` OUTSIDE the `utilities` layer. Indicates missing layer discipline.
4. NEVER allow a semantic token to exist in one mode only. Both light and dark variants MUST be defined (via `light-dark()` or paired blocks).
5. NEVER allow a `var(--undefined-token)` reference without an explicit fallback. Either define the token or remove the reference.
6. NEVER allow text-on-background contrast below WCAG 1.4.3 (4.5:1 normal, 3:1 large).
7. NEVER allow UI-component / graphical-object contrast below WCAG 1.4.11 (3:1 against adjacent).
8. ALWAYS produce a structured audit report : file : line : severity : rule : violation : suggested-fix.

## Reference Links

- `references/methods.md` : full rule catalog with IDs, severity, grep recipes, and remediation patterns
- `references/examples.md` : sample audit reports (passing + failing), example violations from a deliberately bad codebase
- `references/anti-patterns.md` : 7 anti-patterns with symptom, root cause, fix
- [Design Tokens Format Module (W3C DTCG)](https://designtokens.org/tr/drafts/format/)
- [MDN : @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)
- [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [MDN : CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [W3C WCAG 2.2 : 1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19)
- [W3C WCAG 2.2 : 1.4.11 Non-Text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast)

## Cross-References

- `[[frontend-impl-design-tokens]]` : DTCG format, three-tier model, token authoring
- `[[frontend-theming-color-palette-oklch]]` : palette generation from brand seed
- `[[frontend-theming-dark-light-mode]]` : `color-scheme` + `light-dark()` for parity
- `[[frontend-syntax-css-cascade-layers-scope]]` : `@layer` ordering
- `[[frontend-syntax-css-color-modern]]` : OKLCH, `color-mix`, `light-dark`
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG contrast criteria
- `[[frontend-agents-a11y-perf-consistency-auditor]]` : sibling audit agent for a11y / perf
