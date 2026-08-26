---
name: frontend-a11y-aria-patterns
description: >
  Use when building a UI widget that has no native HTML equivalent (tabs, combobox with custom rendering, listbox with rich options, menu/menubar, tree, treegrid, carousel, custom modal) and you need to know which ARIA roles, states, and keyboard model the W3C WAI APG mandates, when announcing dynamic updates to screen readers (status, alert, save toast), when deciding between `aria-label` and `aria-labelledby` and `aria-describedby` and `aria-errormessage` for an accessible name and description, when a screen reader is silent on a component that visibly changed, when keyboard focus or screen-reader announcement order does not match the visual order, or when a code review flags `role="..."` and you must verify whether the role is needed at all.
  Prevents the first-rule-of-ARIA violation (slapping a role on a div instead of using the native element), `aria-label` overriding visible text, redundant roles such as `<nav role="navigation">` or `<button role="button">`, live regions inserted at update time (they MUST pre-exist in the DOM), `aria-hidden` on focusable background content while a modal is open (does NOT remove from tab order; use `inert` instead), tabs with every tab `tabindex="0"` instead of roving tabindex, combobox patterns moving DOM focus into the listbox while the user is typing, `role="menu"` on a `<nav>` list of links, `role="alert"` used for periodic non-urgent updates, and `aria-errormessage` declared without the required `aria-invalid="true"`.
  Covers the first rule of ARIA, the WAI-ARIA 1.2 role categories, the implicit-ARIA-semantics mapping from HTML elements, the seven APG patterns Carousel + Disclosure + Listbox + Menu/Menubar + Radio Group + Tree + Treegrid (drilled this batch), plus expanded coverage of Dialog (Modal) + Combobox + Tabs, the live-region attribute set (`aria-live`, `aria-atomic`, `aria-relevant`, `aria-busy`) with the pre-baked `role="status"` and `role="alert"` shortcuts, and the labelling precedence (`aria-labelledby` > `aria-label` > native label > content text > `title`) including `aria-describedby` and the `aria-errormessage` + `aria-invalid` binding.
  Keywords: ARIA, WAI-ARIA, APG, role, aria-label, aria-labelledby, aria-describedby, aria-errormessage, aria-invalid, aria-live, aria-atomic, aria-relevant, aria-busy, aria-expanded, aria-controls, aria-haspopup, aria-activedescendant, aria-selected, aria-checked, aria-modal, aria-multiselectable, aria-orientation, aria-roledescription, aria-level, aria-posinset, aria-setsize, aria-disabled, role dialog, role combobox, role tablist, role tab, role tabpanel, role listbox, role option, role menu, role menubar, role menuitem, role menuitemcheckbox, role menuitemradio, role radiogroup, role radio, role tree, role treeitem, role treegrid, role row, role gridcell, role status, role alert, role region, role group, roving tabindex, first rule of ARIA, implicit ARIA semantics, accessible name, accessible name computation, screen reader silent, screen reader does not announce, role conflict, live region not announcing, missing accessible name, screen reader says two widgets for combobox, keyboard nav broken, focus jumps wrong place, how to make accessible custom widget, when do I need ARIA, what is APG, what role should this have, ARIA combobox pattern, accessible tabs implementation, how to announce a notification to screen readers, how to make a modal accessible.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend A11y ARIA Patterns

This skill defines the W3C WAI-ARIA 1.2 surface and the WAI Authoring Practices Guide (APG) pattern set required to ship accessible custom widgets. ARIA 1.2 is a stable W3C Recommendation; APG patterns are the normative-in-practice author guidance for combining roles, states, and keyboard models. This skill builds on `[[frontend-syntax-html5-semantic]]` (native elements first) and `[[frontend-core-web-standards-baseline]]` (browser AT support).

Sources : [W3C: WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) (verified 2026-05-19), [W3C: ARIA in HTML](https://www.w3.org/TR/html-aria/) (verified 2026-05-19), [W3C WAI: APG patterns](https://www.w3.org/WAI/ARIA/apg/) (verified 2026-05-19), per-pattern URLs cited in [methods.md](references/methods.md).

## Quick Reference

### First rule of ARIA (verbatim, normative)

[W3C: WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) (verified 2026-05-19) : "WAI-ARIA is intended to be used as a supplement for native language semantics, not a replacement. When the host language provides a feature that provides equivalent accessibility to the WAI-ARIA feature, use the host language feature."

Three operational consequences :

1. NEVER add `role` to an element whose implicit role already satisfies the requirement (`<nav>`, `<button>`, `<main>`, `<dialog>`, `<details>`).
2. NEVER add `role` to an element if doing so contradicts the native role (`<a role="button" href="...">` strips link semantics; `<button role="heading">` is invalid). [W3C: ARIA in HTML](https://www.w3.org/TR/html-aria/) (verified 2026-05-19) : "Authors MUST NOT use the ARIA role and aria-* attributes in a manner that conflicts with the semantics."
3. ALWAYS prefer a composition of native elements over an ARIA pattern when both deliver the same accessibility (`<details><summary>` over a Disclosure pattern; `<dialog>showModal()` over a custom `role="dialog"`).

### When to reach for ARIA (decision tree)

```
What does the widget need to be?

  A single semantic element exists in HTML (button, link, nav, dialog,
  details, input, select, fieldset, table, progress, output).
    -> Ship the native element. Zero ARIA.

  A composition of native elements covers it (<dialog> + <button>
  + popovertarget; <fieldset><legend> + <input type=radio>;
  <nav><ul><a>).
    -> Ship the composition. Minimum ARIA only for the accessible name
       (aria-labelledby or aria-label) when no <label>/<legend>/<summary>
       can carry it.

  No native HTML primitive matches (combobox with custom-rendered options,
  treegrid, carousel, application menu, listbox with multi-select and
  custom rows, treeview).
    -> Layer ARIA on top of the closest neutral element (usually <div>
       or <button>) following the relevant APG pattern.
```

### APG pattern picker (one-line decisions)

| UI concept | Native HTML first | APG pattern if no native fit |
|------------|-------------------|------------------------------|
| Show/hide a section | `<details><summary>` | Disclosure |
| Modal blocking dialog | `<dialog>` + `showModal()` | Dialog (Modal) |
| Tabbed content panels | (no native) | Tabs |
| Dropdown select | `<select>` | Combobox + Listbox |
| Autocomplete / type-ahead | `<input list>` + `<datalist>` | Combobox with listbox popup (`aria-activedescendant`) |
| Single-choice in group | `<input type=radio>` + `<fieldset>` | Radio Group |
| Multi-choice list | `<select multiple>` or checkboxes | Listbox with `aria-multiselectable="true"` |
| Application command menu | (no native) | Menu / Menubar |
| Site navigation | `<nav><ul><a>` | NONE (do NOT use Menu) |
| Notification banner | (no native) | Live region (`role="status"` or `role="alert"`) |
| Image carousel | (no native) | Carousel |
| Hierarchical tree | (no native) | Tree |
| Hierarchical table | `<table>` for flat data | Treegrid (only when hierarchy AND tabular both required) |
| Toggle (on/off) | `<input type=checkbox>` | Switch (`role="switch"`) |
| Progress feedback | `<progress>` or `<output>` | `role="progressbar"` |

### Labelling precedence (accessible name computation)

`aria-labelledby` > `aria-label` > native label (`<label>`, `<legend>`, `<summary>`, `alt`) > element content text > `title`.

Rules of thumb :

- Visible text label exists -> `aria-labelledby` pointing to it. NEVER `aria-label` (it overrides and silently diverges from the visible text).
- No visible text label, icon-only control -> `aria-label`.
- Supplementary description (announced after the name, often suppressible) -> `aria-describedby`.
- Form error -> `aria-errormessage` pointing to the visible error message AND `aria-invalid="true"` on the same field. Without `aria-invalid="true"`, `aria-errormessage` is silently ignored.

### Live regions cheat-sheet

| Attribute | Values | Use |
|-----------|--------|-----|
| `aria-live` | `off` (default), `polite`, `assertive` | Politeness. `polite` for status; `assertive` ONLY for time-critical (session expiry, payment failure). |
| `aria-atomic` | `false` (default), `true` | `true` re-reads the whole region on change. Use for short labelled regions ("Score : 5" -> "Score : 6"). |
| `aria-relevant` | `additions`, `removals`, `text`, `all` (default `additions text`) | Which mutation types announce. Rarely overridden. |
| `aria-busy` | `false` (default), `true` | Suppress announcements during multi-step DOM updates; clear when done. |
| `role="status"` | shortcut | Implicit `aria-live="polite"` + `aria-atomic="true"`. |
| `role="alert"` | shortcut | Implicit `aria-live="assertive"` + `aria-atomic="true"`. Per [APG: Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) (verified 2026-05-19), alerts MUST NOT auto-dismiss and MUST be used sparingly. |

CRITICAL : the live region element MUST exist in the DOM BEFORE the content is inserted. Render an empty `<div role="status" aria-live="polite" aria-atomic="true"></div>` at page load; update its `textContent` to announce.

## Decision Trees

### Decision : native HTML or ARIA?

```
Is there a single HTML element that has the role and behavior you need?
  yes -> ship it. NO role attribute. NO aria-* unless you need a label.
  no  -> next question.

Is there a composition of HTML elements that delivers the role and behavior?
  yes -> ship the composition. Add aria-labelledby / aria-label only if no
         native labelling element (<label>, <legend>, <summary>) can carry
         the name.
  no  -> apply the relevant APG pattern. Use the MINIMUM set of roles and
         states required by that pattern. Do not invent extras.

Did you find yourself adding role="button" / role="link" / role="heading"
to a <div> or <span>?
  yes -> STOP. Use <button> / <a href> / <h1>-<h6>. ARIA does NOT add
         keyboard, focus, type=submit, or default behaviors. Native does.
```

### Decision : which labelling attribute?

```
Is there a visible text label for this control?
  yes, label is a <label> for a form control -> connect via for= /
       id=. No ARIA needed.
  yes, label is some other visible text (heading, span)
       -> aria-labelledby="<id of that text>"
  no, the control is icon-only or text-free
       -> aria-label="<short descriptive name>"

Need extra description beyond the name?
  yes -> aria-describedby="<id of description>". Read after the name.
         Users may suppress descriptions.
  no  -> nothing.

Need to surface a validation error message?
  yes -> aria-errormessage="<id of error>" AND aria-invalid="true" on the
         same control. Both are REQUIRED; aria-invalid alone announces
         "invalid" but no message; aria-errormessage alone is silently
         ignored.
  no  -> nothing.
```

### Decision : which APG pattern for this UI?

See the table in Quick Reference. The full rationale per pattern (variants, keyboard model, focus model, common failures) is in [methods.md](references/methods.md) §3 - §10.

### Decision : Combobox popup type and focus mode?

```
What renders inside the popup?

  Listbox / grid / tree of options. User types in the combobox input
  while options highlight.
    -> DOM focus stays on the combobox input.
       aria-activedescendant references the highlighted option's id.
       NEVER move DOM focus into the listbox; typing breaks otherwise.

  A dialog (e.g. date picker calendar) where the user interacts with
  multiple controls.
    -> DOM focus moves into the dialog on open.
       aria-haspopup="dialog" on the combobox.
       Restore focus to the combobox on close.
```

### Decision : Tabs activation mode (automatic or manual)?

```
Does activating a tab have a cost or side effect (network fetch, expensive
render, analytics event, route change)?
  yes -> manual activation. Arrow keys move focus only;
         Space / Enter activates. aria-selected updates on activation.
  no  -> automatic activation. Arrow keys move focus AND activate;
         aria-selected updates on focus. Default per APG.
```

## Patterns

Detailed per-pattern coverage is in [methods.md](references/methods.md). Brief index :

- **Disclosure** : button + `aria-expanded`. Prefer `<details><summary>` when possible.
- **Dialog (Modal)** : `role="dialog"` + `aria-modal="true"` + `aria-labelledby`, focus trap, Escape, restore focus on close. Native `<dialog>showModal()` gives 3 of 4 for free (still need focus restore).
- **Tabs** : `tablist` / `tab` / `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby` cross-reference, roving tabindex, automatic vs manual.
- **Combobox** : `role="combobox"` + `aria-controls` + `aria-expanded` + `aria-autocomplete` + `aria-haspopup`. Focus depends on popup type.
- **Listbox** : `role="listbox"` + `role="option"`, `aria-multiselectable`, `aria-selected`, roving tabindex OR `aria-activedescendant`.
- **Menu / Menubar** : `role="menu"` / `role="menubar"` + `menuitem` variants, `aria-haspopup` + `aria-expanded`, roving tabindex, NEVER for navigation links.
- **Radio Group** : `role="radiogroup"` + `role="radio"`, `aria-checked`, single tabstop, arrows move focus AND select.
- **Tree** : `role="tree"` + `role="treeitem"`, `aria-expanded` on parents only, roving tabindex, optional `aria-level` / `aria-posinset` / `aria-setsize` when lazy.
- **Treegrid** : `role="treegrid"` + `role="row"` + `role="gridcell"`, cell-focus OR row-focus mode, Left/Right collapse/expand, F2 edit mode.
- **Carousel** : `role="region"` + `aria-roledescription="carousel"`, pause on focus AND hover, dynamic Stop/Start label (NOT `aria-pressed`), slide-picker uses Tabs pattern for the tabbed variant.

Full keyboard models, state matrices, and variant rules in [methods.md](references/methods.md).

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md) for symptom + root cause + fix. Minimum eight cataloged : `<div role="button">` instead of `<button>`, `aria-label` overriding visible text, redundant role (`<nav role="navigation">`), live region inserted at update time, `aria-hidden` on focusable background of a modal (use `inert`), tabs without roving tabindex, combobox moving DOM focus into listbox, `role="menu"` on navigation links, `aria-errormessage` without `aria-invalid="true"`, `role="alert"` used for non-urgent polling, missing focus restore on dialog close.

## Reference Links

- [Methods and signatures](references/methods.md) : full ARIA 1.2 surface used in this skill, plus per-pattern role-state-keyboard tables (Carousel, Disclosure, Listbox, Menu, Radio, Tree, Treegrid, Dialog, Combobox, Tabs).
- [Examples](references/examples.md) : working HTML snippets for accessible Tabs (roving tabindex + manual activation), Combobox with listbox popup (`aria-activedescendant`), Disclosure with native `<details>`, live-region pattern, dialog focus restore.
- [Anti-patterns](references/anti-patterns.md) : eleven cataloged anti-patterns with WCAG references.

## Cross-references

- `[[frontend-a11y-focus-keyboard-inert]]` : `:focus-visible`, roving tabindex mechanics, the `inert` attribute, programmatic focus and focus restore.
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 2.2 Success Criteria for contrast, motion, target size; pairs with ARIA labelling.
- `[[frontend-impl-popover-dialog-anchor]]` : `<dialog>showModal()`, `popover`, anchor positioning details.
- `[[frontend-syntax-html5-semantic]]` : native semantic elements (the "first" in first-rule-of-ARIA).
- `[[frontend-syntax-html5-form]]` : `aria-invalid` + `aria-errormessage` form-error binding, `:user-invalid` styling.
