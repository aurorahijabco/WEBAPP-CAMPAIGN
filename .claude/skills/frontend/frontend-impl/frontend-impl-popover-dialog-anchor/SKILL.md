---
name: frontend-impl-popover-dialog-anchor
description: >
  Use when building any surface that lives in the browser top layer :
  modal confirmations, cookie banners, dropdown menus, command
  palettes, tooltips, date pickers, comboboxes, settings panels,
  off-canvas drawers, side-sheets. Use when deciding between
  `<dialog>` + `showModal()` (interrupts user, modal, has backdrop)
  versus the Popover API (`popover="auto" | "manual" | "hint"`,
  always non-modal, ships light-dismiss). Use when positioning a
  surface relative to a trigger via CSS Anchor Positioning
  (`anchor-name`, `position-anchor`, `anchor()`, `position-area`,
  `position-try-fallbacks`) instead of `getBoundingClientRect`
  scroll/resize math. Use when fixing the "open animation does not
  play" bug or the "exit animation cuts off" bug : both require the
  `@starting-style` + `transition-behavior: allow-discrete` +
  `overlay` recipe.
  Prevents the six dominant top-layer failures : adding `tabindex`
  to `<dialog>` (forbidden by spec, breaks focus model); combining
  `popover` attribute with `dialog.showModal()` on the same element
  (undefined behavior, popovers are non-modal by definition); rolling
  custom click-outside JS for a popover that already ships light-
  dismiss; missing `@starting-style` so the entry animation never
  starts; missing `display ... allow-discrete` (and `overlay ...
  allow-discrete` for top-layer elements) in the transition shorthand
  so the exit animation cuts off the instant `.hidePopover()` or
  `.close()` runs; using anchor positioning without an `@supports
  (anchor-name: --x)` gate on browsers older than 2025-2026.
  Covers `<dialog>` (Baseline since March 2022) with `.showModal()`
  (top-layer + implicit inert + Escape-to-close + `::backdrop`),
  `.show()` (non-modal), `.close(returnValue?)` plus the `closedby`
  attribute (`any | closerequest | none`) and the surprising defaults
  (`showModal` -> `closerequest`, `show` and `<dialog open>` -> `none`),
  the manual focus-restoration pattern (capture `document.activeElement`
  before open, restore on `close` event), Popover API (Baseline 2025)
  with the three popover states, `popovertarget` + `popovertargetaction`
  declarative triggers, `:popover-open` pseudo-class, the popover stack
  / hide-until algorithm, automatic focus restoration on light-dismiss,
  CSS Anchor Positioning (`anchor-name`, `position-anchor`,
  `anchor(<side>)`, `position-area` 3x3 grid, `position-try-fallbacks`
  with `flip-block / flip-inline / flip-start` and named
  `@position-try` options) including the implicit anchor relationship
  between a `popovertarget` button and its popover, and the combined
  enter-and-exit animation recipe (`opacity` + `display allow-discrete`
  + `overlay allow-discrete` + `@starting-style` declared AFTER the
  open-state rule).
  Keywords: dialog, dialog showModal, dialog show, dialog close,
  closedby, closedby any, closedby closerequest, closedby none,
  ::backdrop, autofocus dialog, returnValue, form method dialog,
  Popover API, popover, popover auto, popover manual, popover hint,
  popovertarget, popovertargetaction, showPopover, hidePopover,
  togglePopover, ToggleEvent, beforetoggle, :popover-open,
  CSS anchor positioning, anchor-name, position-anchor, anchor function,
  position-area, position-try-fallbacks, flip-block, flip-inline,
  flip-start, @position-try, position-visibility, anchor-size,
  anchor-center, @starting-style, transition-behavior, allow-discrete,
  overlay, top layer, top-layer stacking, popover stack, light dismiss,
  popover not closing, popover not opening, dialog not animating,
  dialog focus broken, tooltip wrong position, anchor positioning
  broken, anchor positioning not supported, dialog animation snaps,
  popover stays after click outside, popover focus stuck,
  animation cut off, exit animation cut off,
  how to make a modal in HTML, how to make a popover,
  popover API tutorial, anchor positioning CSS,
  animated dialog open close, accessible tooltip,
  how to light dismiss popover, how to position tooltip,
  how to animate dialog entry, how to animate popover.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Impl : Popover, Dialog, Anchor Positioning

Authoritative reference for the modern top-layer authoring stack. Three APIs share one mental model : promote element to top layer, position relative to anchor, animate enter and exit with discrete-property transitions. Pick `<dialog>` for modal interruption; pick the Popover API for transient non-modal surfaces.

## Quick Reference

### Baseline status

| Feature | Baseline | Source |
|---|---|---|
| `<dialog>` element | Widely Available since March 2022 | [MDN : dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19) |
| Popover API (`popover` attribute) | Newly Available since January 2025 | [MDN : Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (verified 2026-05-19) |
| `@starting-style`, `transition-behavior: allow-discrete` | Newly Available since August 2024 | [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19) |
| Anchor Positioning core (`anchor-name`, `position-anchor`, `anchor()`) | Limited / rolling out 2024 to 2026 | [MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) (verified 2026-05-19) |
| `position-area`, `position-try-fallbacks` | Newly Available since January 2026 | [MDN : position-try-fallbacks](https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks) (verified 2026-05-19) |
| `overlay` property | Limited (Chromium-led) | [MDN : overlay](https://developer.mozilla.org/en-US/docs/Web/CSS/overlay) (verified 2026-05-19) |

### Single most useful default

Modal interrupts user workflow -> `<dialog>` + `showModal()`. Transient surface anchored to a trigger -> `popover="auto"` with implicit anchor.

### `closedby` defaults (memorize)

| Open path | Default `closedby` | Escape closes? | Light dismiss? |
|---|---|---|---|
| `dialog.showModal()` | `closerequest` | YES | NO |
| `dialog.show()` | `none` | NO | NO |
| `<dialog open>` (attribute) | `none` | NO | NO |
| `popover="auto"` | (built-in) | YES | YES |
| `popover="manual"` | (built-in) | NO | NO |
| `popover="hint"` | (built-in) | YES | YES |

## Decision Trees

### Tree 1 : `<dialog>` showModal vs Popover API auto?

```
Does it interrupt user workflow and require explicit action to dismiss?
   YES -> <dialog> + showModal(). Top layer + implicit inert background +
          Escape + ::backdrop. Manual focus restoration on close.
   NO  -> next question

Is it a transient surface anchored to a trigger button (dropdown menu,
tooltip, date picker, command palette, combobox listbox)?
   YES -> popover="auto" + popovertarget on the trigger button. Implicit
          anchor for positioning, built-in light dismiss, automatic focus
          restoration on Esc-close.
   NO  -> next question

Should it stay open while the user interacts elsewhere (tear-off settings
panel, persistent help overlay)?
   YES -> popover="manual". Author closes via popovertargetaction="hide" or
          .hidePopover(). No light dismiss.
   NO  -> next question

Is it a hint surface, low-stakes, ephemeral (hover tooltip, autocomplete
hint)?
   YES -> popover="hint". Light dismiss; closes other hint popovers when
          opened but not auto popovers.
```

### Tree 2 : Anchor positioning vs JS `getBoundingClientRect`?

```
Is the popover triggered by a button with popovertarget?
   YES -> implicit anchor. Write position-area: bottom span-inline-end;
          directly on the popover. No anchor-name needed.

Is anchor positioning required and the target browser audience is 2025+?
   YES -> anchor-name on source + position-anchor + position-area + (often)
          position-try-fallbacks: flip-block, flip-inline;.

Must the pattern work on browsers older than 2025-2026?
   YES -> gate with @supports (anchor-name: --x) { ... } and provide a JS
          fallback (track scroll / resize, set top / left via element.style).

Is the value not a top / left / inset (e.g., sizing relative to anchor)?
   YES -> anchor-size(width) inside inline-size / block-size declarations.
```

### Tree 3 : Combined `@starting-style` + `allow-discrete` recipe selection

```
Animate from display: none -> visible via popover or dialog?
   YES -> REQUIRED LINES in transition shorthand :
          opacity 0.3s,
          transform 0.3s,
          display 0.3s allow-discrete,
          overlay 0.3s allow-discrete;
          PLUS @starting-style { :popover-open / [open] { opacity: 0; ... } }
          declared AFTER the open-state rule.

Animate opacity-only with NO display change (element already visible)?
   YES -> regular transition: opacity works. No @starting-style needed,
          no allow-discrete needed.

Backdrop animation desired too?
   YES -> apply the same recipe to ::backdrop selector. transition includes
          background-color + display + overlay allow-discrete; @starting-style
          declares background-color transparent.
```

## Patterns

### Pattern A : Modal `<dialog>` with focus restoration

```html
<button id="open">Open dialog</button>
<dialog id="dlg" closedby="closerequest">
  <form method="dialog">
    <h2>Confirm</h2>
    <p>Are you sure?</p>
    <button value="cancel" autofocus>Cancel</button>
    <button value="confirm">Confirm</button>
  </form>
</dialog>
```

```js
const dlg = document.getElementById('dlg');
const opener = document.getElementById('open');
let trigger = null;

opener.addEventListener('click', () => {
  trigger = document.activeElement;
  dlg.showModal();
});

dlg.addEventListener('close', () => {
  trigger?.focus();
  trigger = null;
  if (dlg.returnValue === 'confirm') { /* act on result */ }
});
```

`<form method="dialog">` closes the dialog with `returnValue` set to the clicked button's `value`. The `close` event fires for ALL dismissal paths.

### Pattern B : Popover with implicit anchor

```html
<button popovertarget="menu" id="menu-btn">Menu</button>
<div id="menu" popover="auto">
  <button popovertarget="menu" popovertargetaction="hide">Close</button>
  <a href="/profile">Profile</a>
  <a href="/settings">Settings</a>
</div>
```

```css
#menu {
  position-area: bottom span-inline-end;
  margin-block-start: 0.5rem;
  padding: 0.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  inset: unset;             /* clear UA default centering for popovers */
}
```

The popover acquires an implicit anchor (the trigger button) because `popovertarget` references it. `position-area: bottom span-inline-end` places the popover below the button, aligned to its inline-end edge.

### Pattern C : Anchored popover with `@supports` gate and fallback

```css
@supports (anchor-name: --x) {
  #menu-btn  { anchor-name: --menu-anchor; }
  #menu {
    position: absolute;
    position-anchor: --menu-anchor;
    position-area: bottom span-inline-end;
    position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
    margin-block-start: 0.5rem;
  }
}

@supports not (anchor-name: --x) {
  /* JS-positioned fallback */
  #menu {
    position: absolute;
    /* top / left set via element.style by JS on open + scroll + resize */
  }
}
```

`position-try-fallbacks` lists the rescue strategies the browser tries in order when the primary placement would overflow. `flip-block` mirrors top -> bottom; `flip-inline` mirrors left -> right; the third option composes both for diagonal flip.

### Pattern D : Combined enter / exit animation recipe (popover)

```css
[popover] {
  /* Closed state (also exit-animation target) */
  opacity: 0;
  transform: scale(0.95);

  transition:
    opacity   0.2s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    display   0.2s allow-discrete,
    overlay   0.2s allow-discrete;
}

[popover]:popover-open {
  /* Open state (entry-animation target) */
  opacity: 1;
  transform: scale(1);
}

/* @starting-style MUST come AFTER the :popover-open rule */
@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  [popover] { transition: opacity 0.1s linear, display 0.1s allow-discrete, overlay 0.1s allow-discrete; transform: none; }
  @starting-style { [popover]:popover-open { opacity: 0; transform: none; } }
}
```

For a `<dialog>` opened with `showModal()`, replace `:popover-open` with `[open]` (or `dialog:open`) and apply the same shape. Add a `::backdrop` block with the same transitions to animate the dim layer.

### Pattern E : Modal `<dialog>` enter / exit animation (with backdrop)

```css
dialog {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  transition:
    opacity   0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    display   0.25s allow-discrete,
    overlay   0.25s allow-discrete;
}
dialog[open] { opacity: 1; transform: translateY(0) scale(1); }

@starting-style {
  dialog[open] { opacity: 0; transform: translateY(8px) scale(0.98); }
}

dialog::backdrop {
  background: rgb(0 0 0 / 0%);
  transition:
    background-color 0.25s,
    display          0.25s allow-discrete,
    overlay          0.25s allow-discrete;
}
dialog[open]::backdrop { background: rgb(0 0 0 / 0.4); }

@starting-style {
  dialog[open]::backdrop { background: rgb(0 0 0 / 0%); }
}
```

### Pattern F : `closedby="any"` for light-dismiss modal

```html
<dialog id="prefs" closedby="any">
  <h2>Preferences</h2>
  <form method="dialog">
    <button autofocus>Done</button>
  </form>
</dialog>
```

`closedby="any"` opts into outside-click dismissal AND keeps Escape working. Useful for non-destructive modals where users may click away. Listen for the `close` event to handle any dismissal path; restore focus there.

## Out of Scope

- ARIA roles and states deep-dive : `role="dialog"`, `aria-modal`, `aria-labelledby`, combobox / listbox patterns (covered in `[[frontend-a11y-aria-patterns]]`).
- Focus management mechanics : `:focus-visible`, `tabindex`, roving tabindex, `aria-activedescendant`, `inert` algorithm (covered in `[[frontend-a11y-focus-keyboard-inert]]`).
- Modal / toast / drawer component templates (covered in `[[frontend-component-modal-toast-system]]`).
- Scroll-driven animations and View Transitions API (covered in `[[frontend-impl-view-transitions-scroll-animations]]`).

## Hard Rules (Binding)

1. NEVER set `tabindex` on `<dialog>`. The dialog is a container; focus belongs on its descendants. Use `autofocus` for initial focus.
2. NEVER combine `popover` attribute with `dialog.showModal()` on the same element. Popovers are non-modal by spec; mixing yields undefined cross-API state.
3. NEVER write a custom click-outside handler for an `auto` or `hint` popover. The spec provides light-dismiss; rolling your own breaks focus restoration.
4. NEVER use Anchor Positioning without an `@supports (anchor-name: --x)` gate (and a JS fallback for non-supporting browsers) until full cross-engine Baseline lands.
5. NEVER omit `@starting-style` for entry animations on `<dialog>` / popover. Without it, the property switch happens before the transition can start; the element appears instantly.
6. NEVER omit `display ... allow-discrete` (and `overlay ... allow-discrete` for top-layer elements) from the transition shorthand. Exit animations cut off otherwise.
7. NEVER place `@starting-style` BEFORE its target rule. Equal specificity = source order decides; the main rule will win.
8. ALWAYS capture `document.activeElement` BEFORE calling `dialog.showModal()` and restore on `close`. Popover API does this automatically; `<dialog>` does NOT.
9. ALWAYS use `<form method="dialog">` + button `value` attributes to return a result from a dialog declaratively. Sets `dialog.returnValue` without JS submit handlers.

## Reference Links

- `references/methods.md` : full method tables for `<dialog>`, Popover API, anchor positioning, and the combined animation recipe
- `references/examples.md` : three renderable demos (modal with `closedby`, anchored popover with `position-try-fallbacks`, animated popover with full recipe)
- `references/anti-patterns.md` : 7 anti-patterns with symptom, root cause, fix
- [MDN : dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19)
- [MDN : Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (verified 2026-05-19)
- [MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) (verified 2026-05-19)
- [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19)
- [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (verified 2026-05-19)
- [MDN : overlay](https://developer.mozilla.org/en-US/docs/Web/CSS/overlay) (verified 2026-05-19)
- [MDN : position-try-fallbacks](https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks) (verified 2026-05-19)
- [WHATWG HTML : popover](https://html.spec.whatwg.org/multipage/popover.html) (verified 2026-05-19)

## Cross-References

- `[[frontend-syntax-html5-semantic]]` : `<dialog>` semantics, when to use `<dialog>` vs ARIA `role="dialog"`
- `[[frontend-a11y-aria-patterns]]` : ARIA role / state model for dialog, combobox, menu, listbox
- `[[frontend-a11y-focus-keyboard-inert]]` : `:focus-visible`, tabindex, inert, focus-trap mechanics
- `[[frontend-visual-micro-interactions]]` : timing tokens, easing curves, `@starting-style` general use
- `[[frontend-component-modal-toast-system]]` : component-level modal / toast / drawer templates
