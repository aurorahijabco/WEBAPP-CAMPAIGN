---
name: frontend-a11y-focus-keyboard-inert
description: >
  Use when authoring any focusable UI surface : modals, popovers, drawers,
  tabs, menus, listboxes, comboboxes, toolbars, grids, trees, or any
  custom widget that responds to keyboard input. Use when implementing
  focus styles (`:focus-visible`, `:focus-within`), choosing a tabindex
  value, designing arrow-key navigation, deciding between roving
  tabindex and `aria-activedescendant`, isolating background content
  behind an overlay, capturing-and-restoring focus around a dialog, or
  enforcing Escape semantics. Use when reviewing CSS for the classic
  `outline: none` deletion or the `aria-hidden` on background anti-
  pattern.
  Prevents the six dominant focus failures of 2010s authoring : invisible
  keyboard focus (`outline: none` without `:focus-visible` replacement),
  positive `tabindex` shattering DOM-order navigation, `aria-hidden` on
  the background of a modal instead of `inert` (keyboard still tabs in,
  screen reader still says nothing useful), focus traps that swallow
  Escape, programmatic `focus()` calls on non-focusable elements (silent
  no-ops), and forgetting to restore focus to the trigger element on
  dialog close.
  Covers the `inert` global attribute (six effects : no click, no focus,
  no find-in-page, no selection, no edit, AT-hidden), the automatic
  inertness applied by `<dialog>.showModal()` to the rest of the page,
  the `:focus-visible` UA-heuristic vs the always-on `:focus` selector,
  the `:focus-within` ancestor matcher, tabindex semantics (0, -1, and
  why positive values are an anti-pattern), the roving-tabindex pattern
  for composite widgets vs `aria-activedescendant` for combobox-style
  widgets, 1D and 2D arrow-key navigation per the W3C WAI APG keyboard
  interface, Home / End / PageUp / PageDown bindings, automatic vs
  manual activation, the Escape key plus the `closedby` attribute on
  `<dialog>`, and the manual focus-restoration pattern that `<dialog>`
  requires (unlike the Popover API, which restores focus to the invoker
  on Esc-close automatically).
  Keywords: inert, :focus-visible, :focus-within, tabindex, tabindex 0,
  tabindex -1, positive tabindex, roving tabindex, aria-activedescendant,
  focus management, focus restoration, focus trap, focus indicator,
  WCAG 2.4.7, WCAG 1.4.11, document.activeElement, HTMLElement.focus,
  preventScroll, focusVisible option, top-layer, dialog.showModal,
  closedby attribute, autofocus dialog, Escape key dialog,
  arrow-key navigation, Home End PageUp PageDown, APG keyboard interface,
  focus stuck, tab order broken, focus invisible,
  modal background interactive, focus jumps to top, focus on hidden
  element, keyboard user lost, focus escaped modal,
  how to manage focus, what is inert, how to make modal accessible,
  how do I make focus visible only for keyboard, how to trap focus in
  a modal, how to restore focus after dialog close, accessible focus
  styles, why is my outline missing, how to remove tab from background.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Accessibility : Focus, Keyboard Navigation, and Inert

Authoritative reference for keyboard-first interaction primitives. Modern foundation : `inert` (Baseline Widely Available since April 2023) and `<dialog>.showModal()` replace the brittle hand-rolled focus-trap + `aria-hidden` + `tabindex="-1"`-on-all-things patterns of the 2015 to 2022 era.

## Quick Reference

### Baseline status

| Feature | Baseline | Source |
|---|---|---|
| `inert` attribute | Widely Available since April 2023 | [MDN : inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) (verified 2026-05-19) |
| `:focus-visible` | Widely Available since March 2022 | [MDN : :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) (verified 2026-05-19) |
| `:focus-within` | Widely Available since January 2020 | [MDN : :focus-within](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within) (verified 2026-05-19) |
| `<dialog>` + `showModal()` | Widely Available | [MDN : dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) (verified 2026-05-19) |
| `closedby` attribute on `<dialog>` | Modern (gate where legacy support matters) | [MDN : dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) (verified 2026-05-19) |

### The four primitives

```css
/* 1. Focus indicator : :focus-visible, NOT :focus, NOT outline:none */
:focus-visible {
  outline: 2px solid var(--focus); /* MUST meet WCAG 1.4.11 : 3:1 vs adjacent */
  outline-offset: 2px;
}

/* 2. Ancestor matcher : :focus-within for parent state */
.field:focus-within { border-color: var(--accent); }
```

```html
<!-- 3. Inert : declarative subtree disablement (six effects) -->
<main inert>...background while dialog is open...</main>

<!-- 4. tabindex : 0 or -1 only -->
<div role="tab" tabindex="0">Active tab</div>
<div role="tab" tabindex="-1">Other tab</div>
```

### inert : six effects (all simultaneous)

Per [MDN : inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) (verified 2026-05-19), descendants of an inert element :

1. Do not fire click events.
2. Cannot receive focus; focus events do not fire.
3. Are excluded from browser find-in-page.
4. Cannot be text-selected (`user-select: none` semantics).
5. Cannot be edited (input fields, `contenteditable`).
6. Are hidden from assistive technologies (excluded from accessibility tree).

`inert` replaces every combination of `aria-hidden` + `tabindex="-1"` + `pointer-events: none` + `user-select: none` previously used to "disable" a subtree.

## Decision Trees

### Tree 1 : inert vs aria-hidden vs pointer-events: none vs disabled

```
Are you disabling an INDIVIDUAL form control?
   YES -> use the `disabled` attribute (works on <button>, <input>, <select>,
          <textarea>, <fieldset>). Provides :disabled CSS, removes from tab
          order, AT announces "disabled".
   NO  -> next question

Are you disabling a CONTAINER (modal background, off-screen carousel slide,
hidden tab panel, side drawer's `<main>`)?
   YES -> use the `inert` attribute. Removes focus + clicks + find-in-page
          + selection + editing + AT exposure simultaneously.
   NO  -> next question

Do you ONLY want to hide from assistive technologies (decorative element
that is still focusable / clickable for keyboard / mouse)?
   YES -> use `aria-hidden="true"`. NEVER on a focusable element.
   NO  -> next question

Do you ONLY want to block pointer events (CSS-level paint filter, keyboard
still works)?
   YES -> use `pointer-events: none`. RARE. Confirm keyboard path is OK.
```

NEVER combine `aria-hidden="true"` with a focusable element. NEVER use `pointer-events: none` as a substitute for `inert`.

### Tree 2 : focus indicator selector

```
Is the element a non-form-control (button, link, custom widget) AND focus
indication is only needed for keyboard users?
   YES -> :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
          DO NOT also set :focus { outline: none; }.

Is the element a text input where the cursor position must always be
visible (`<input>`, `<textarea>`)?
   YES -> :focus + :focus-visible. The UA heuristic already shows :focus-visible
          for text inputs on mouse-click; default styles are fine. Customize
          via :focus-visible only.

Are you reading `:focus { outline: none }` somewhere in the codebase?
   YES -> WCAG 2.4.7 violation unless `:focus-visible` provides a replacement
          meeting WCAG 1.4.11 (3:1 contrast vs adjacent background). FIX or
          REVERT.
```

### Tree 3 : roving tabindex vs aria-activedescendant

```
Does DOM focus need to MOVE between the items as the user navigates?
   YES -> roving tabindex. Active item has `tabindex="0"`, others have
          `tabindex="-1"`. On arrow-key, update both attributes AND call
          `element.focus()` on the new active item.
   NO  -> next question

Is the widget an editable combobox / searchbox where DOM focus MUST stay on
the `<input>` so typing continues?
   YES -> aria-activedescendant on the container. Update the attribute to
          point at the highlighted descendant's id; do NOT call focus() on
          the descendant.
```

| Widget | Strategy |
|---|---|
| Tabs (`role="tablist"`) | Roving tabindex |
| Listbox standalone | Roving tabindex |
| Listbox inside combobox | aria-activedescendant |
| Menubar, toolbar | Roving tabindex |
| Tree, treegrid | Roving tabindex |
| Grid (`role="grid"`) | Roving tabindex |
| Combobox input | aria-activedescendant |

## Patterns

### Pattern A : focus-visible only, never bare :focus

```css
/* CORRECT : keyboard focus visible, mouse-click on buttons not noisy */
:where(button, a, [tabindex]):focus-visible {
  outline: 2px solid var(--focus, #2563eb);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Text inputs : :focus-visible is auto-applied by UA even on mouse-click */
:where(input, textarea):focus-visible {
  outline: 2px solid var(--focus, #2563eb);
  outline-offset: 0;
}
```

The replacement outline MUST meet WCAG 1.4.11 Non-Text Contrast at 3:1 versus the background it sits on. Use `oklch()` and `--focus` token to enforce contrast at theme level.

### Pattern B : tabindex - the only two legal values

```html
<!-- 0 : focusable AND in tab order at DOM position -->
<div role="button" tabindex="0">Custom button</div>

<!-- -1 : focusable programmatically, NOT in tab order -->
<div role="dialog" tabindex="-1">...</div>

<!-- DON'T : positive values (anti-pattern) -->
<button tabindex="2">never do this</button>
```

Per [MDN : tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) (verified 2026-05-19) : "You are recommended to only use 0 and -1 as tabindex values."

### Pattern C : modal dialog with implicit inert + focus restoration

```html
<button id="open-dlg">Open</button>

<dialog id="my-dialog" closedby="closerequest">
  <form method="dialog">
    <h2>Confirm action</h2>
    <p>Are you sure you want to continue?</p>
    <button value="cancel">Cancel</button>
    <button value="ok" autofocus>OK</button>
  </form>
</dialog>

<script>
const dialog = document.getElementById('my-dialog');
const opener = document.getElementById('open-dlg');
let trigger = null;

opener.addEventListener('click', () => {
  trigger = document.activeElement;
  dialog.showModal();          // top layer, rest of page is implicitly inert
});

dialog.addEventListener('close', () => {
  trigger?.focus();            // manual restore (NOT automatic for <dialog>)
  trigger = null;
});
</script>
```

Per [MDN : inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) (verified 2026-05-19) : `<dialog>.showModal()` makes "the rest of the page inert" automatically. The dialog itself "escapes inertness" by living in the top layer. Tab and Shift+Tab cycle WITHIN the dialog only.

### Pattern D : roving tabindex for tabs

```html
<div role="tablist" aria-label="Sections" id="tabs">
  <button role="tab" tabindex="0"  aria-selected="true"  aria-controls="p1" id="t1">One</button>
  <button role="tab" tabindex="-1" aria-selected="false" aria-controls="p2" id="t2">Two</button>
  <button role="tab" tabindex="-1" aria-selected="false" aria-controls="p3" id="t3">Three</button>
</div>

<script>
const tablist = document.getElementById('tabs');
tablist.addEventListener('keydown', (e) => {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const current = tabs.indexOf(document.activeElement);
  if (current < 0) return;

  let next = current;
  if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
  else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = tabs.length - 1;
  else return;

  e.preventDefault();
  tabs[current].setAttribute('tabindex', '-1');
  tabs[next].setAttribute('tabindex', '0');
  tabs[next].focus(); // CRITICAL : moves DOM focus, not just attribute
});
</script>
```

Per [W3C WAI APG : Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (verified 2026-05-19) : Left/Right arrow keys (or Up/Down when `aria-orientation="vertical"`) cycle; Home / End jump to first / last; Tab exits the tablist.

### Pattern E : background isolation for non-modal overlays

```html
<header>...</header>
<main inert>...</main>          <!-- toggled while drawer open -->
<aside class="drawer">
  <button autofocus>Close</button>
  <!-- drawer content -->
</aside>
```

For non-modal overlays (drawers, side panels, off-canvas navs that use `dialog.show()` or no `<dialog>` at all), the author MUST set `inert` on the rest of the page. `showModal()` does this automatically; `show()` does NOT.

### Pattern F : :focus-within for parent-state styling

```css
.field {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.field:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 30%, transparent);
}
```

Combine with `:has()` for cross-tree lift : `.row:has(:focus-within) { background: var(--hover); }`.

## Out of Scope

- ARIA roles, states, and properties beyond the focus-touching subset (covered in `[[frontend-a11y-aria-patterns]]`).
- WCAG 2.2 success criteria narrative (covered in `[[frontend-a11y-motion-contrast-wcag22]]`).
- Popover API specifics, `closedby="any"` light-dismiss, anchor positioning, top-layer mechanics for popovers (covered in `[[frontend-impl-popover-dialog-anchor]]`).
- Touch-target sizing (`pointer-events`, hit-targets) outside the keyboard model.

## Hard Rules (Binding)

1. NEVER write `:focus { outline: none }` without a `:focus-visible` replacement that meets WCAG 1.4.11 (3:1 contrast).
2. NEVER use positive `tabindex` values. Only `0` and `-1` are legal.
3. NEVER use `aria-hidden="true"` on a subtree that contains focusable elements. Use `inert` instead.
4. NEVER use `pointer-events: none` as a substitute for `inert`. It is a paint filter, not an interaction model.
5. NEVER intercept Escape inside a focus-trap implementation. Escape MUST close the dialog (per APG).
6. ALWAYS capture `document.activeElement` BEFORE opening a `<dialog>` and restore it on the `close` event. `<dialog>` does NOT auto-restore (Popover API does).
7. ALWAYS call `element.focus()` after updating roving-tabindex attributes. Attribute updates alone do not move DOM focus.
8. ALWAYS use the native interactive element (`<button>`, `<a>`, `<input>`) when one exists. `<div role="button" tabindex="0">` is a six-piece reimplementation of `<button>` that always lacks something.

## Reference Links

- `references/methods.md` : full keyboard binding tables (1D, 2D, grid), `focus()` options, `closedby` values, focus / tab / inert semantics matrix
- `references/examples.md` : modal dialog with focus restoration, roving-tabindex tabs, drawer with `inert` background, focus-visible CSS recipe
- `references/anti-patterns.md` : 8 anti-patterns with symptom, root cause, fix
- [MDN : inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) (verified 2026-05-19)
- [MDN : :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) (verified 2026-05-19)
- [MDN : :focus-within](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within) (verified 2026-05-19)
- [MDN : tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) (verified 2026-05-19)
- [MDN : `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) (verified 2026-05-19)
- [W3C WAI APG : Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) (verified 2026-05-19)
- [W3C WAI APG : Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (verified 2026-05-19)

## Cross-References

- `[[frontend-a11y-aria-patterns]]` : roles, states, and properties for combobox, tabs, dialog, menu, listbox, treegrid
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 2.4.7 Focus Visible, 1.4.11 Non-Text Contrast, 2.4.11 Focus Not Obscured success criteria
- `[[frontend-impl-popover-dialog-anchor]]` : Popover API, `<dialog>` top-layer, anchor positioning, `closedby="any"` light dismiss
- `[[frontend-syntax-html5-semantic]]` : when to use `<button>` vs `<a>` vs `<input type="button">`
- `[[frontend-syntax-css-has-selector]]` : `:has(:focus-within)` cross-tree highlighting
