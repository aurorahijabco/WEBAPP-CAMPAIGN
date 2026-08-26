# References : Design System Validator Audit Examples

Concrete audit reports showing the canonical violation classes and their fixes. Each example pairs the offending code, the audit output, and the corrected version.

## 1. Sample : Bad Codebase Snapshot

```css
/* src/styles/tokens.css */
:root {
  --color-1: #2563eb;             /* DS-04 : non-namespaced */
  --space-12: 3rem;               /* DS-03 : orphan (never used) */
  --brand-blue-500: oklch(60% 0.18 250);
  --color-action: var(--brand-blue-500);
}

/* src/components/button.css */
.button {
  background: #3b82f6;                  /* DS-01 : hardcoded color */
  color:      var(--brand-blue-500);    /* DS-02 : primitive in component */
  padding:    16px 24px;                /* DS-01 : hardcoded spacing */
  border-radius: 6px;                   /* DS-01 : hardcoded radius */
  transition: background-color 0.2s;    /* (Animatable; not tokenized) */
}

.button:hover {
  background: #2563eb !important;       /* DS-07 : !important in components */
}

/* src/components/card.css */
.card { color: var(--color-foreground); }   /* DS-09 : --color-foreground undefined */

/* src/styles/main.css */
/* (no @layer declaration anywhere)        DS-05 : missing layer order */
```

## 2. Audit Output (Markdown)

```markdown
# Design System Audit Report

Repository : example-app
Date       : 2026-05-19
Scanned    : 4 CSS files

## Errors (5)

- `src/components/button.css:3:15` : DS-01 hardcoded color `#3b82f6`
  - Fix : `background: var(--color-action-primary);`
- `src/components/button.css:5:15` : DS-01 hardcoded spacing `16px 24px`
  - Fix : `padding: var(--space-4) var(--space-6);`
- `src/components/button.css:6:18` : DS-01 hardcoded radius `6px`
  - Fix : `border-radius: var(--radius-md);`
- `src/components/button.css:11:15` : DS-07 `!important` in components layer
  - Fix : remove `!important`; resolve cascade via `@layer components` ordering
- `src/styles/main.css:1:1` : DS-05 missing `@layer tokens, theme, base, components, utilities;`
  - Fix : add layer-order declaration as first statement

## Warnings (3)

- `src/components/button.css:4:15` : DS-02 component uses primitive `--brand-blue-500`
  - Fix : reference semantic `var(--color-action-primary)` instead
- `src/styles/tokens.css:3:3` : DS-04 token `--color-1` lacks namespace + semantic name
  - Fix : rename to `--color-action-primary` (or appropriate semantic name)
- `src/components/button.css:7:3` : DS-06 animatable token referenced in transition without `@property` registration
  - Fix : register `@property --color-action-primary { syntax: '<color>'; inherits: true; initial-value: oklch(60% 0.18 250); }`

## Info (1)

- `src/styles/tokens.css:4:3` : DS-03 orphan token `--space-12` (defined but never referenced)
  - Suggested : remove if unused; otherwise document why retained
```

## 3. Corrected Codebase

```css
/* src/styles/main.css */
@layer tokens, theme, base, components, utilities;

@import './tokens.css' layer(tokens);
@import './theme.css' layer(theme);
@import './components/button.css' layer(components);
@import './components/card.css' layer(components);

/* src/styles/tokens.css (in layer "tokens") */
:root {
  /* Primitives */
  --brand-blue-500: oklch(60% 0.18 250);
  --brand-blue-600: oklch(54% 0.18 250);
  --gray-50:  oklch(98% 0 0);
  --gray-900: oklch(15% 0 0);

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 12px;
}

/* src/styles/theme.css (in layer "theme") */
:root {
  color-scheme: light dark;

  --color-fg:                light-dark(var(--gray-900), var(--gray-50));
  --color-bg:                light-dark(var(--gray-50),  var(--gray-900));
  --color-action-primary:    light-dark(var(--brand-blue-500), var(--brand-blue-600));
  --color-action-primary-fg: light-dark(var(--gray-50),  var(--gray-900));
}

@property --color-action-primary {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(60% 0.18 250);
}

/* src/components/button.css (in layer "components") */
.button {
  background: var(--color-action-primary);
  color:      var(--color-action-primary-fg);
  padding:    var(--space-4) var(--space-6);
  border-radius: var(--radius-md);
  transition: background-color 0.2s;
}

.button:hover {
  background: color-mix(in oklch, var(--color-action-primary), white 8%);
}

/* src/components/card.css */
.card { color: var(--color-fg); }   /* defined in theme; DS-09 resolved */
```

## 4. Audit Output (Re-run after fixes)

```markdown
# Design System Audit Report

Repository : example-app
Date       : 2026-05-19
Scanned    : 5 CSS files

## Errors (0)

(none)

## Warnings (0)

(none)

## Info (0)

(none)

Audit passed.
```

## 5. JSON Report Example

```json
{
  "repo": "example-app",
  "date": "2026-05-19",
  "scanned": { "css_files": 4, "component_files": 2 },
  "findings": [
    {
      "file": "src/components/button.css",
      "line": 3,
      "col": 15,
      "severity": "error",
      "rule": "DS-01",
      "message": "Hardcoded color \"#3b82f6\"",
      "fix": "background: var(--color-action-primary);"
    },
    {
      "file": "src/components/button.css",
      "line": 4,
      "col": 15,
      "severity": "warning",
      "rule": "DS-02",
      "message": "Component uses primitive token \"--brand-blue-500\"",
      "fix": "Reference semantic token \"--color-action-primary\" instead"
    },
    {
      "file": "src/styles/tokens.css",
      "line": 4,
      "col": 3,
      "severity": "info",
      "rule": "DS-03",
      "message": "Orphan token \"--space-12\" (defined but never referenced)",
      "fix": "Remove or document"
    }
  ],
  "summary": { "errors": 5, "warnings": 3, "info": 1 }
}
```

## 6. Validator-Agent Run (sample)

```text
You: validate the design system in this repo.

[design-system-validator]
Scanning src/**/*.css ...

Found 4 CSS files. Extracted 23 token definitions, 47 references.

Running rules :
- DS-01 (raw values) : 4 violations
- DS-02 (primitive in component) : 1 violation
- DS-03 (orphan tokens) : 1 violation
- DS-04 (naming) : 1 violation
- DS-05 (@layer order) : 1 violation (missing)
- DS-06 (@property for animatable) : 1 violation
- DS-07 (!important outside utilities) : 1 violation
- DS-08 (light/dark parity) : 0 violations
- DS-09 (dangling refs) : 1 violation
- DS-10 (contrast text) : 0 violations
- DS-11 (contrast UI) : 0 violations

Total : 5 errors, 3 warnings, 1 info.

See full report at .audit/2026-05-19.md
```

## 7. Sample Stylelint Integration (Reference Only)

```json
{
  "rules": {
    "declaration-property-value-disallowed-list": {
      "/.*color.*/": ["/^#[0-9a-fA-F]{3,8}$/", "/^rgba?\\(/", "/^hsla?\\(/"]
    },
    "custom-property-pattern": "^--(color|space|font-size|line-height|radius|shadow|motion|easing|z|breakpoint)-[a-z0-9-]+$",
    "declaration-no-important": [true, { "ignore": ["inside-keyframes"] }]
  }
}
```

This is a partial Stylelint config that approximates DS-01, DS-04, DS-07. Full coverage requires a custom plugin that understands `@layer` boundaries.
