# References : Auditor Surface

Full rule surface, file-pattern matching, severity thresholds, and JSON Schema for `frontend-agents-a11y-perf-consistency-auditor`. All citations verified 2026-05-19.

## Audit invocation contract

The auditor is invoked by a parent agent or directly by the user. Inputs :

| Input | Type | Required | Meaning |
|-------|------|----------|---------|
| `scope` | string (path) | yes | Absolute or workspace-relative path : a file, a directory, or a glob pattern. |
| `categories` | array of `"A11Y"`, `"PERF"`, `"CONSISTENCY"` | no | Default : all three. Restrict to subset for incremental audits. |
| `severity_floor` | `"INFO"` / `"WARNING"` / `"ERROR"` | no | Default : `"INFO"`. Reports only findings at or above the floor. |
| `format` | `"json"` / `"markdown"` / `"both"` | no | Default : `"both"`. |

Outputs : a JSON object plus a Markdown render. See the JSON Schema below.

## File-pattern matching

The auditor walks the scope and selects target files by extension :

| Extension | Audit categories applied |
|-----------|--------------------------|
| `.html`, `.htm` | A11Y (DOM, attributes, ARIA), PERF (image / preload / fetchpriority) |
| `.css` | A11Y (`:focus-visible`, `@media (prefers-reduced-motion)`), PERF (animation properties, `will-change`) |
| `.js`, `.ts`, `.jsx`, `.tsx` | A11Y (DOM mutations, ARIA writes), PERF (event handlers, yield patterns) |
| `.md` | CONSISTENCY (SKILL.md shape, line count, headings, cross-refs) ; A11Y / PERF on embedded code blocks |
| `.json` | CONSISTENCY (DTCG shape if applicable) |

Files under `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/`, and any path matched by `.gitignore` are excluded.

## Severity grading rules

| Severity | Criteria | Examples |
|----------|----------|----------|
| `ERROR` | Violates WCAG 2 2 AA, misses a Core Web Vital threshold at p75 in the obvious-cause case, or breaks a package validator. | `<div role="button">`, `:focus { outline: none }` without override, `<img>` missing dimensions, SKILL.md over 500 lines. |
| `WARNING` | Missed best practice that does not block conformance but degrades quality. | `transition: all`, missing `font-display: swap`, missing `[[]]` cross-references. |
| `INFO` | Style inconsistency, optional metadata missing, drift not yet harmful. | Token names not matching `<category>-<role>-<variant>` convention, missing `$description` on DTCG tokens. |

## A11Y rule definitions

Anchored to [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19) and [W3C WAI APG](https://www.w3.org/WAI/ARIA/apg/) (verified 2026-05-19).

### A1 : Accessible name

Matches : any element that is interactive by role (`<a href>`, `<button>`, `<input>`, `<select>`, `<textarea>`, anything with `tabindex="0"` or higher, anything with a role implying interactivity).

Rule : the element MUST have a non-empty accessible name from one of :

1. Visible text content.
2. `aria-label` attribute with a non-empty value.
3. `aria-labelledby` referencing an existing element with text content.
4. `<label for>` (for form controls).
5. `alt` attribute on `<img>` (empty `alt=""` is acceptable only for decorative images).

Severity : ERROR. WCAG 4 1 2.

### A2 : Focus visible override

Matches : any `:focus` selector with `outline: none` (or `outline: 0`).

Rule : the same selector group MUST have a `:focus-visible` rule that sets a visible outline with at least 3 to 1 contrast against the unfocused state.

Severity : ERROR. WCAG 2 4 7 + 2 4 13.

Source : [MDN : :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) (verified 2026-05-19).

### A3 : Modal dialog correctness

Matches : `<dialog>` elements.

Rules :

- Opened via `dialog.showModal()` (not `dialog.show()`) when the visual intent is modal.
- Has `aria-labelledby` (pointing to a title) OR `aria-label`.
- Does NOT have `tabindex` set (MDN explicitly forbids).
- Focus restoration to trigger on `close` event.

Severity : ERROR. APG Dialog Modal pattern.

### A4 : Live region pre-existing

Matches : elements with `aria-live`, `role="status"`, `role="alert"`, `role="log"`.

Rule : the live-region wrapper MUST exist in the DOM (server-rendered or set at startup) BEFORE messages are inserted. Detect by scanning for code patterns that create the wrapper AND insert content in the same DOM mutation.

Severity : ERROR. MDN ARIA Live Regions.

### A5 : Target size 24 by 24

Matches : any interactive element (`<a>`, `<button>`, `<input>`, `<select>`, etc.).

Rule : the rendered bounding box MUST be at least 24 by 24 CSS pixels OR one of the five exceptions (spacing, equivalent, inline, UA-default, essential) MUST apply. Static analysis : inspect declared `width`, `height`, `padding`, `min-height`, `min-width` and warn when the computed bounding box is less than 24 by 24.

Severity : ERROR. WCAG 2 5 8 AA.

### A6 : Contrast ratio

Matches : any element with declared `color` AND `background-color` (or background image with known dominant color).

Rules :

- Normal text : 4 5 to 1 minimum.
- Large text (18 pt or 14 pt bold and above) : 3 to 1 minimum.
- Non-text UI : 3 to 1 minimum.

Static analysis : compute relative luminance for foreground-background pair and emit ERROR if ratio falls below threshold. Cannot detect runtime `backdrop-filter` blur effects ; flag as WARNING when the surface is over `backdrop-filter` for manual review.

Severity : ERROR (text), WARNING (over backdrop-filter). WCAG 1 4 3, 1 4 6, 1 4 11.

### A7 : prefers-reduced-motion branch

Matches : any CSS file containing `@keyframes`, `animation:`, or `transition:` (excluding pure opacity / color transitions).

Rule : the same file MUST contain a `@media (prefers-reduced-motion: reduce)` block that either disables or simplifies the animation.

Severity : ERROR.

### A8 : No positive tabindex

Matches : any element with `tabindex="N"` where N is greater than 0.

Rule : ALWAYS use `tabindex="0"` (focusable, default order) or `tabindex="-1"` (focusable by script only). NEVER use positive values.

Severity : ERROR. WCAG 2 4 3 Focus Order.

### A9 : Semantic HTML preferred

Matches : `<div>`, `<span>` with `role` attribute mapping to a native HTML element.

Rule : ERROR if `role="button"` (use `<button>`), `role="link"` (use `<a href>`), `role="heading"` (use `<h1>` - `<h6>`), `role="textbox"` (use `<input>` or `<textarea>`), `role="checkbox"` (use `<input type="checkbox">`), or similar.

Severity : ERROR. First rule of ARIA.

## PERF rule definitions

Anchored to [web.dev : Core Web Vitals](https://web.dev/articles/vitals) (verified 2026-05-19), [web.dev : Optimize INP](https://web.dev/articles/optimize-inp) (verified 2026-05-19).

### P1 : Image dimensions

Matches : `<img>`, `<video>`, `<iframe>`.

Rule : MUST have explicit `width` AND `height` attributes OR an `aspect-ratio` CSS rule.

Severity : ERROR. CLS prevention.

### P2 : LCP image fetchpriority

Matches : `<img>` elements that are above the fold and qualify as LCP candidates (largest image in the initial viewport).

Rule : MUST have `fetchpriority="high"`. Bonus : a `<link rel="preload" as="image">` with matching `imagesrcset`.

Severity : ERROR. LCP improvement.

### P3 : loading lazy correctness

Matches : `<img>` elements.

Rules :

- Below-the-fold images MUST have `loading="lazy"`.
- The LCP image MUST NOT have `loading="lazy"`.

Severity : ERROR. LCP + bandwidth.

### P4 : Animation property

Matches : `@keyframes` blocks, `transition` declarations.

Rule : ONLY `transform`, `opacity`, `filter`, `backdrop-filter`, and `color` are compositor-friendly. Animating `width`, `height`, `top`, `left`, `right`, `bottom`, `margin`, `padding`, `border-width` triggers layout and is jank-prone.

Severity : WARNING (best practice ; some layout animations are intentional). INP, animation jank.

### P5 : will-change transient

Matches : declarations of `will-change` in CSS.

Rule : `will-change` should be applied on interaction start (`:hover`, `:focus`, before triggering an animation) and removed on interaction end. Permanent `will-change` on many elements drains GPU memory.

Severity : WARNING.

### P6 : Webfont budget

Matches : `@font-face` declarations.

Rule : each woff2 file at most 100 KB. `font-display: swap` declared.

Severity : WARNING.

### P7 : Critical CSS

Matches : `<link rel="stylesheet">` in the HTML `<head>`.

Rule : critical above-the-fold styles inlined in `<style>` OR preloaded via `<link rel="preload" as="style">`. Standard render-blocking `<link rel="stylesheet">` for the critical bundle is a WARNING.

Severity : WARNING.

## CONSISTENCY rule definitions

Anchored to the package validator scripts at `/home/freek/GitHub/Skill-Package-Workflow-Template/scripts/`.

### C1 : YAML frontmatter shape

Matches : `SKILL.md` files.

Rule : the frontmatter MUST contain :

- `name` (kebab-case, max 64 chars, matches folder name)
- `description` (folded scalar `>`, starts with "Use when...", contains "Keywords:" line)
- `license: MIT`
- `compatibility` (string with `"Designed for Claude Code."`)
- `metadata` (object with `author` and `version`)

Severity : ERROR.

### C2 : Four-file structure

Matches : skill folders under `skills/source/<category>/<skill-name>/`.

Rule : the folder contains exactly :

- `SKILL.md`
- `references/methods.md`
- `references/examples.md`
- `references/anti-patterns.md`

NO `README.md` inside skill folders (anti-pattern L-010).

Severity : ERROR.

### C3 : SKILL.md line count

Matches : `SKILL.md` files.

Rule : at most 500 lines. Overflow content lives in `references/`.

Severity : ERROR.

### C4 : English-only content

Matches : all skill files.

Rule : every content sentence in English. Common non-English markers : Dutch (`zijn`, `worden`, `volgens`, `omdat`, `daarom`), German, French, Spanish.

Severity : ERROR.

### C5 : Colon section headings

Matches : section headings in `SKILL.md` and reference files.

Rule : headings use `:` as separator. The em-dash `—` is forbidden in section headings.

Severity : ERROR.

### C6 : Cross-reference format

Matches : references to other skills in skill content.

Rule : use `[[skill-name]]` Markdown link format.

Severity : WARNING.

## JSON Schema for audit report

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["scope", "summary", "findings"],
  "properties": {
    "scope": { "type": "string" },
    "summary": {
      "type": "object",
      "required": ["files_audited", "findings"],
      "properties": {
        "files_audited": { "type": "integer", "minimum": 0 },
        "findings": {
          "type": "object",
          "required": ["ERROR", "WARNING", "INFO"],
          "properties": {
            "ERROR":   { "type": "integer", "minimum": 0 },
            "WARNING": { "type": "integer", "minimum": 0 },
            "INFO":    { "type": "integer", "minimum": 0 }
          }
        }
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "severity", "category", "rule", "file", "line", "message", "fix"],
        "properties": {
          "id":        { "type": "string" },
          "severity":  { "enum": ["ERROR", "WARNING", "INFO"] },
          "category":  { "enum": ["A11Y", "PERF", "CONSISTENCY"] },
          "rule":      { "type": "string" },
          "file":      { "type": "string" },
          "line":      { "type": "integer", "minimum": 1 },
          "message":   { "type": "string" },
          "fix":       { "type": "string" },
          "reference": { "type": "string" }
        }
      }
    }
  }
}
```

## Limitations (static analysis only)

The auditor does NOT :

- Render the audited code in a browser.
- Run Lighthouse or any other dynamic tool.
- Measure actual Core Web Vitals (uses HEURISTICS to flag likely regressions).
- Resolve runtime token values for contrast against `backdrop-filter` surfaces (emits WARNING for manual review).
- Enforce design-token-naming policy (delegated to `[[frontend-agents-design-system-validator]]`).
- Replace human accessibility audits or manual screen-reader testing.

Treat the report as a high-signal triage tool. Issues flagged are either real or worth investigating ; clean reports are not a guarantee of full conformance.
