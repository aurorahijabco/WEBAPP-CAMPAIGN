# References : Audit Report Samples

Three worked audit reports for `frontend-agents-a11y-perf-consistency-auditor`. Each shows the JSON-for-parent-agent format alongside the Markdown-for-human format. Use these as templates when the auditor emits a report.

## Example 1 : Component audit

**Scope** : `src/components/CardList/`

**Target shape** :

```
src/components/CardList/
├── CardList.tsx
├── CardList.module.css
└── Card.tsx
```

### JSON output

```json
{
  "scope": "src/components/CardList/",
  "summary": {
    "files_audited": 3,
    "findings": { "ERROR": 3, "WARNING": 2, "INFO": 0 }
  },
  "findings": [
    {
      "id": "A1-001",
      "severity": "ERROR",
      "category": "A11Y",
      "rule": "A1",
      "file": "CardList/Card.tsx",
      "line": 14,
      "message": "Icon-only <button> has no accessible name. Visible text content is an SVG with no aria-label.",
      "fix": "Add aria-label=\"Delete card\" to the button OR add an aria-hidden=\"false\" sr-only <span> with text.",
      "reference": "[[frontend-a11y-aria-patterns]] : Name, Role, Value"
    },
    {
      "id": "A2-001",
      "severity": "ERROR",
      "category": "A11Y",
      "rule": "A2",
      "file": "CardList/CardList.module.css",
      "line": 42,
      "message": ".card:focus { outline: none } has no matching :focus-visible override.",
      "fix": "Add `.card:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }`.",
      "reference": "[[frontend-a11y-motion-contrast-wcag22]] SC 2 4 7 + 2 4 13"
    },
    {
      "id": "P1-001",
      "severity": "ERROR",
      "category": "PERF",
      "rule": "P1",
      "file": "CardList/Card.tsx",
      "line": 8,
      "message": "<img> declared without width or height attributes ; layout shift on image load.",
      "fix": "Add width and height attributes matching the intrinsic ratio, e.g. width=\"320\" height=\"180\".",
      "reference": "[[frontend-perf-core-web-vitals-inp]] : CLS prevention"
    },
    {
      "id": "P4-001",
      "severity": "WARNING",
      "category": "PERF",
      "rule": "P4",
      "file": "CardList/CardList.module.css",
      "line": 67,
      "message": ".card { transition: all 300ms } animates layout properties (margin, height) ; jank-prone.",
      "fix": "Replace with `transition: transform 300ms, opacity 300ms`.",
      "reference": "[[frontend-perf-animation-gpu-containment]]"
    },
    {
      "id": "A7-001",
      "severity": "WARNING",
      "category": "A11Y",
      "rule": "A7",
      "file": "CardList/CardList.module.css",
      "line": 67,
      "message": "Card hover animation has no @media (prefers-reduced-motion: reduce) branch.",
      "fix": "Add `@media (prefers-reduced-motion: reduce) { .card { transition: none; } }`.",
      "reference": "[[frontend-a11y-motion-contrast-wcag22]] : prefers-reduced-motion"
    }
  ]
}
```

### Markdown output

```markdown
# Audit Report

**Scope** : src/components/CardList/
**Files audited** : 3
**Findings** : 3 ERROR, 2 WARNING, 0 INFO

## ERROR

### A1 : Icon-only button has no accessible name
- **File** : CardList/Card.tsx:14
- **Issue** : Icon-only `<button>` has no accessible name. Visible text content is an SVG with no aria-label.
- **Fix** : Add `aria-label="Delete card"` to the button OR add an `aria-hidden="false"` sr-only `<span>` with text.
- **Reference** : [[frontend-a11y-aria-patterns]] : Name, Role, Value.

### A2 : :focus override missing
- **File** : CardList/CardList.module.css:42
- **Issue** : `.card:focus { outline: none }` has no matching `:focus-visible` override.
- **Fix** : Add `.card:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }`.
- **Reference** : [[frontend-a11y-motion-contrast-wcag22]] SC 2 4 7 + 2 4 13.

### P1 : Image without dimensions
- **File** : CardList/Card.tsx:8
- **Issue** : `<img>` declared without width or height attributes ; layout shift on image load.
- **Fix** : Add `width` and `height` attributes matching the intrinsic ratio, e.g. `width="320" height="180"`.
- **Reference** : [[frontend-perf-core-web-vitals-inp]] : CLS prevention.

## WARNING

### P4 : transition: all on layout properties
- **File** : CardList/CardList.module.css:67
- **Issue** : `.card { transition: all 300ms }` animates layout properties (margin, height) ; jank-prone.
- **Fix** : Replace with `transition: transform 300ms, opacity 300ms`.
- **Reference** : [[frontend-perf-animation-gpu-containment]].

### A7 : prefers-reduced-motion branch missing
- **File** : CardList/CardList.module.css:67
- **Issue** : Card hover animation has no `@media (prefers-reduced-motion: reduce)` branch.
- **Fix** : Add `@media (prefers-reduced-motion: reduce) { .card { transition: none; } }`.
- **Reference** : [[frontend-a11y-motion-contrast-wcag22]] : prefers-reduced-motion.
```

## Example 2 : Feature branch audit

**Scope** : `git diff main...HEAD` (the changed files in the current branch).

**Target shape** : 12 files across UI components, CSS modules, and one new SKILL.md.

### JSON output

```json
{
  "scope": "git diff main...HEAD",
  "summary": {
    "files_audited": 12,
    "findings": { "ERROR": 1, "WARNING": 4, "INFO": 2 }
  },
  "findings": [
    {
      "id": "A9-002",
      "severity": "ERROR",
      "category": "A11Y",
      "rule": "A9",
      "file": "src/components/Tabs/Tabs.tsx",
      "line": 22,
      "message": "<div role=\"button\" tabindex=\"0\" onClick={...}> reimplements a native <button>.",
      "fix": "Replace with `<button type=\"button\" onClick={...}>`. Removes custom key handling, gets native focus + Space/Enter activation, gets ButtonText forced-colors mapping.",
      "reference": "[[frontend-a11y-aria-patterns]] : First Rule of ARIA"
    },
    {
      "id": "P2-002",
      "severity": "WARNING",
      "category": "PERF",
      "rule": "P2",
      "file": "src/pages/Home.tsx",
      "line": 9,
      "message": "LCP hero <img> does not have fetchpriority=\"high\".",
      "fix": "Add `fetchpriority=\"high\"` and consider adding `<link rel=\"preload\" as=\"image\" imagesrcset=...>` in <head>.",
      "reference": "[[frontend-perf-core-web-vitals-inp]]"
    },
    {
      "id": "P5-002",
      "severity": "WARNING",
      "category": "PERF",
      "rule": "P5",
      "file": "src/components/Drawer/Drawer.module.css",
      "line": 14,
      "message": "will-change: transform applied permanently to .drawer.",
      "fix": "Move will-change inside an interaction trigger : `.drawer.opening { will-change: transform; }` and remove after the animation.",
      "reference": "[[frontend-perf-animation-gpu-containment]]"
    },
    {
      "id": "P6-002",
      "severity": "WARNING",
      "category": "PERF",
      "rule": "P6",
      "file": "src/styles/fonts.css",
      "line": 4,
      "message": "@font-face for \"Display\" lacks font-display declaration.",
      "fix": "Add `font-display: swap;` to the @font-face block.",
      "reference": "[[frontend-perf-core-web-vitals-inp]] : font-display strategy"
    },
    {
      "id": "C1-001",
      "severity": "WARNING",
      "category": "CONSISTENCY",
      "rule": "C1",
      "file": "skills/source/foo/foo/SKILL.md",
      "line": 2,
      "message": "description uses quoted string instead of folded scalar `>`.",
      "fix": "Rewrite as `description: >` followed by multi-line content.",
      "reference": "Package validator validate-frontmatter.js"
    },
    {
      "id": "C6-001",
      "severity": "INFO",
      "category": "CONSISTENCY",
      "rule": "C6",
      "file": "skills/source/foo/foo/SKILL.md",
      "line": 89,
      "message": "Reference to frontend-a11y-aria-patterns uses bare text, not [[]] link.",
      "fix": "Replace `frontend-a11y-aria-patterns` with `[[frontend-a11y-aria-patterns]]`.",
      "reference": "Package quality contract"
    },
    {
      "id": "C6-002",
      "severity": "INFO",
      "category": "CONSISTENCY",
      "rule": "C6",
      "file": "src/components/Drawer/Drawer.tsx",
      "line": 4,
      "message": "Code comment references \"see motion skill\" without explicit link.",
      "fix": "Reference `[[frontend-a11y-motion-contrast-wcag22]]` explicitly in the comment.",
      "reference": "Package quality contract"
    }
  ]
}
```

## Example 3 : Skill-file audit

**Scope** : `skills/source/frontend-impl/frontend-impl-design-tokens/`

### JSON output

```json
{
  "scope": "skills/source/frontend-impl/frontend-impl-design-tokens/",
  "summary": {
    "files_audited": 4,
    "findings": { "ERROR": 0, "WARNING": 0, "INFO": 0 }
  },
  "findings": []
}
```

### Markdown output

```markdown
# Audit Report

**Scope** : skills/source/frontend-impl/frontend-impl-design-tokens/
**Files audited** : 4
**Findings** : 0 ERROR, 0 WARNING, 0 INFO

Clean. All 22 checks passed.

Validators run :
- C1 YAML frontmatter shape : OK
- C2 Four-file structure : OK
- C3 SKILL.md line count : 298 / 500 OK
- C4 English-only : OK
- C5 Colon headings : OK
- C6 Cross-references via [[]] : OK
- A1 through A9 : OK (sample code blocks audited)
- P1 through P7 : OK (sample code blocks audited)
```

## Auditor invocation shapes

### Invocation 1 : minimal

```text
Audit skills/source/frontend-component/frontend-component-modal-toast-system/
```

The auditor walks the path, applies all three categories, emits the default both-formats output.

### Invocation 2 : scoped to A11Y

```text
Audit src/components/Form/ for A11Y only, severity floor WARNING.
```

The auditor restricts to A11Y rules and skips INFO findings.

### Invocation 3 : pull-request diff

```text
Audit the diff against main. Output JSON for parent agent consumption.
```

The auditor reads the diff, walks the changed files, emits JSON only.

### Invocation 4 : single rule check

```text
Verify rule A9 (no <div role="button">) across the entire src/.
```

The auditor scans all files for the specific anti-pattern.

## Worked fix snippets per rule

### A1 fix : add aria-label to icon button

```jsx
// Before
<button onClick={handleDelete}>
  <TrashIcon />
</button>

// After
<button onClick={handleDelete} aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>
```

### A2 fix : focus-visible pair

```css
/* Before */
.card:focus { outline: none; }

/* After */
.card:focus { outline: none; }
.card:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
```

### A9 fix : div role button -> button

```jsx
// Before
<div role="button" tabindex="0" onClick={handleClick} onKeyDown={handleKey}>
  Submit
</div>

// After
<button type="button" onClick={handleClick}>Submit</button>
```

### P1 fix : add image dimensions

```html
<!-- Before -->
<img src="thumb.avif" alt="..." />

<!-- After -->
<img src="thumb.avif" width="320" height="180" alt="..." />
```

### P2 fix : LCP image fetchpriority

```html
<!-- Before -->
<img src="hero.avif" alt="..." />

<!-- After -->
<link rel="preload" as="image" href="hero.avif" fetchpriority="high" />
<img src="hero.avif" fetchpriority="high" width="1280" height="720" alt="..." />
```

### P4 fix : transition all -> transform / opacity

```css
/* Before */
.card { transition: all 300ms; }

/* After */
.card { transition: transform 300ms ease, opacity 300ms ease; }
```

### C1 fix : YAML folded scalar

```yaml
# Before
description: "Use when..."

# After
description: >
  Use when...
  Prevents ...
  Covers ...
  Keywords: ...
```
