# References : Design System Validator Rule Catalog

Verified against [Design Tokens Format Module (W3C DTCG)](https://designtokens.org/tr/drafts/format/), [MDN : @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property), [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), [MDN : CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*), [W3C WCAG 2.2 : 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19), [W3C WCAG 2.2 : 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast).

## 1. Rule Catalog

### DS-01 : Hardcoded value in non-token layer

| Field | Value |
|---|---|
| Severity | ERROR |
| Detect | Raw color (`#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()`), raw length (px / rem / em / ch / % when not a token), raw font-size, raw radius, raw shadow, OUTSIDE the `@layer tokens` block |
| Fix | Replace with `var(--<namespace>-<name>)`. If no matching token exists, propose one in `@layer tokens`. |
| Reference | `[[frontend-impl-design-tokens]]` |

### DS-02 : Component uses primitive token directly

| Field | Value |
|---|---|
| Severity | WARNING |
| Detect | A rule inside `@layer components` references a primitive token (`var(--brand-blue-500)`, `var(--gray-50)`) instead of a semantic token. |
| Fix | Introduce a semantic token in `@layer theme` (e.g., `--color-button-accent: var(--brand-blue-500);`) and reference it from the component. |
| Reference | `[[frontend-impl-design-tokens]]`, `[[frontend-theming-color-palette-oklch]]` |

### DS-03 : Orphan token

| Field | Value |
|---|---|
| Severity | INFO |
| Detect | Token defined (e.g., `--space-12: 3rem;`) but no `var(--space-12)` reference anywhere in the codebase. |
| Fix | Either remove the definition or document why retained (e.g., reserved for future component). |

### DS-04 : Non-namespaced or non-kebab-case name

| Field | Value |
|---|---|
| Severity | WARNING |
| Detect | Token name does not start with one of the approved namespaces : `--color-`, `--space-`, `--font-size-`, `--font-family-`, `--font-weight-`, `--line-height-`, `--letter-spacing-`, `--radius-`, `--shadow-`, `--border-`, `--motion-`, `--easing-`, `--z-`, `--breakpoint-`. Or uses camelCase / snake_case. |
| Fix | Rename. Add the namespace prefix and use kebab-case. |
| Reference | `[[frontend-impl-design-tokens]]` |

### DS-05 : Missing or wrong `@layer` order

| Field | Value |
|---|---|
| Severity | ERROR |
| Detect | Project root CSS does NOT contain `@layer tokens, theme, base, components, utilities;` (or equivalent declared order) as the first non-comment statement. |
| Fix | Add the layer-order declaration as the first line. |
| Reference | `[[frontend-syntax-css-cascade-layers-scope]]` |

### DS-06 : Animatable token not `@property`-registered

| Field | Value |
|---|---|
| Severity | WARNING |
| Detect | A custom property referenced inside a `transition` or `animation` property has NO corresponding `@property` registration. |
| Fix | Register with `@property --name { syntax: '<color>'; inherits: true; initial-value: <value>; }`. |
| Reference | [MDN : @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) |

### DS-07 : `!important` outside utilities layer

| Field | Value |
|---|---|
| Severity | ERROR |
| Detect | An `!important` declaration appears in `@layer base`, `@layer theme`, `@layer components`, or unlayered code. |
| Fix | Remove `!important` and resolve the underlying cascade conflict via layer ordering, or move the declaration into `@layer utilities` if genuinely needed. |
| Reference | `[[frontend-syntax-css-cascade-layers-scope]]`, `[[frontend-errors-cascade-conflicts]]` |

### DS-08 : Token defined in one mode only

| Field | Value |
|---|---|
| Severity | ERROR |
| Detect | A semantic token has a value in `:root` (light) but NOT in `:root[data-theme="dark"]` AND is NOT defined via `light-dark()`. |
| Fix | Use `light-dark(<light-val>, <dark-val>)` for the token OR add the dark-mode override block. |
| Reference | `[[frontend-theming-dark-light-mode]]` |

### DS-09 : Dangling token reference

| Field | Value |
|---|---|
| Severity | ERROR |
| Detect | A `var(--name)` reference where `--name` is not defined anywhere AND has no fallback inside the `var(name, <fallback>)` second argument. |
| Fix | Define the token OR supply an explicit fallback OR remove the reference. |

### DS-10 : WCAG 1.4.3 contrast fail (text)

| Field | Value |
|---|---|
| Severity | ERROR |
| Detect | Computed contrast ratio between text foreground and surface background `< 4.5:1` for normal text or `< 3:1` for large text (>= 18 pt or >= 14 pt bold). Computed for BOTH light and dark variants. |
| Fix | Adjust the L channel of the OKLCH color until ratio passes. Prefer adjusting the more flexible side of the pair. |
| Reference | `[[frontend-a11y-motion-contrast-wcag22]]` |

### DS-11 : WCAG 1.4.11 non-text contrast fail (UI / graphical)

| Field | Value |
|---|---|
| Severity | ERROR |
| Detect | Contrast between a UI component (button border, focus ring, icon, slider track) and adjacent background `< 3:1`. |
| Fix | Adjust the L channel until ratio passes. Or change the adjacent background. |
| Reference | `[[frontend-a11y-motion-contrast-wcag22]]` |

## 2. Grep Recipes

### 2.1 Find hardcoded colors

```bash
# Hex colors (3, 4, 6, 8 digit) :
grep -rnE '#[0-9a-fA-F]{3,8}\b' src/**/*.{css,ts,tsx,vue,svelte}

# Function-form colors :
grep -rnE 'rgba?\(|hsla?\(|oklch\(|oklab\(|color\(' src/**/*.{css,ts,tsx,vue,svelte}

# Named colors (rare but worth checking) :
grep -rnwE 'red|blue|green|white|black|gray|grey|yellow|orange|purple|pink|cyan|magenta' src/**/*.{css,ts,tsx,vue,svelte}
```

### 2.2 Find hardcoded lengths

```bash
# px / rem / em / ch outside the tokens layer :
grep -rnE '[[:space:]:][0-9]+(\.[0-9]+)?(px|rem|em|ch)\b' src/**/*.{css,ts,tsx,vue,svelte}
```

Discriminate "inside tokens layer" vs "outside" requires a real CSS parser (PostCSS, Stylelint). Use grep as a 90% approximation.

### 2.3 Extract token definitions

```bash
grep -hE '^[[:space:]]*--[a-z][a-z0-9-]*:' src/**/*.css | \
  sed -E 's/^[[:space:]]*//;s/:.*//' | sort -u
```

### 2.4 Extract token references

```bash
grep -rhoE 'var\(--[a-z][a-z0-9-]*' src/**/*.css | \
  sed -E 's/var\(//' | sort -u
```

### 2.5 Find orphans + dangling

```bash
comm -23 .audit/defined.txt .audit/referenced.txt > .audit/orphans.txt
comm -13 .audit/defined.txt .audit/referenced.txt > .audit/dangling.txt
```

### 2.6 Find `!important` outside utilities

```bash
# Crude : everywhere
grep -rnE '!important' src/**/*.css

# Better : exclude utility-layer files (depends on layer naming convention)
grep -rnE '!important' src/**/*.css | grep -v -E '/utilities/'
```

## 3. WCAG Contrast Thresholds

Per [W3C WCAG 2.2 : 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) (verified 2026-05-19) :

| Text size | Threshold | Definition |
|---|---|---|
| Normal | 4.5 : 1 | Smaller than 18 pt (or smaller than 14 pt bold) |
| Large | 3 : 1 | At least 18 pt OR at least 14 pt bold |

Per [W3C WCAG 2.2 : 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast) :

| Element | Threshold |
|---|---|
| UI components (buttons, form controls, focus indicators) | 3 : 1 vs adjacent |
| Graphical objects necessary for content comprehension | 3 : 1 vs adjacent |

Exempt : logos, branding, inactive UI components, decorative graphics.

## 4. Audit Report Schema

### 4.1 Markdown form

```markdown
# Design System Audit Report

Repository : <name>
Date       : <YYYY-MM-DD>
Scanned    : <n> CSS files, <m> component files

## Errors (N)

- `<file>:<line>:<col>` : <RULE-ID> <message>
  - Fix : <code snippet>

## Warnings (N)

- `<file>:<line>:<col>` : <RULE-ID> <message>
  - Fix : <code snippet>

## Info (N)

- `<file>:<line>:<col>` : <RULE-ID> <message>
  - Fix : <code snippet>
```

### 4.2 JSON form (machine-readable)

```json
{
  "repo": "example-app",
  "date": "2026-05-19",
  "scanned": { "css_files": 47, "component_files": 12 },
  "findings": [
    {
      "file": "src/components/button.css",
      "line": 42,
      "col": 14,
      "severity": "error",
      "rule": "DS-01",
      "message": "Hardcoded color \"#3b82f6\"",
      "fix": "background: var(--color-action-primary);"
    }
  ],
  "summary": { "errors": 7, "warnings": 5, "info": 2 }
}
```

## 5. Severity Definitions

| Severity | Meaning | Action |
|---|---|---|
| ERROR | Violates a binding rule; blocks merge | Fix before PR can land |
| WARNING | Indicates drift or weakening of system; should fix | Address before next minor release |
| INFO | Hygiene observation; nice to clean up | Backlog item |

## 6. Cross-References

- `[[frontend-impl-design-tokens]]` : DTCG token format, three-tier model
- `[[frontend-theming-color-palette-oklch]]` : palette generation
- `[[frontend-theming-dark-light-mode]]` : `color-scheme` + `light-dark()` parity
- `[[frontend-syntax-css-cascade-layers-scope]]` : `@layer` ordering
- `[[frontend-syntax-css-color-modern]]` : OKLCH, `color-mix`, `light-dark`
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 1.4.3 + 1.4.11 details
- `[[frontend-agents-a11y-perf-consistency-auditor]]` : sibling a11y / perf agent
