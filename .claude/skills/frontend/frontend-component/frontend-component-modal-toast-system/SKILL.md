---
name: frontend-component-modal-toast-system
description: >
  Use when building a confirm modal, alert dialog, or settings overlay with the
  HTML `<dialog>` element, building a toast notification system with the
  Popover API plus an `aria-live` region, wiring focus restoration after a
  modal closes, choosing between `aria-live="polite"` and `aria-live="assertive"`
  for a toast announcement, managing a queue of stacked toasts with
  auto-dismiss and pause-on-hover, animating dialog or popover open / close
  with `@starting-style`, or migrating off a custom focus-trap library to
  native `showModal()`.
  Prevents the most common modal and toast regressions in 2026 : modal that
  does not trap focus because the team rolled their own JS instead of using
  `<dialog>.showModal()`, modal whose background page keeps scrolling because
  the team added `body { overflow: hidden }` instead of relying on
  `showModal()` auto-inert, modal that loses focus to the body after closing
  because the trigger reference was not captured, toast that interrupts the
  screen reader mid-sentence because `aria-live="assertive"` was used for a
  non-urgent success message, second toast that silently replaces the first
  because the developer used `popover="auto"` (mutually exclusive in
  top-layer stack) instead of `popover="manual"`, `aria-live` region created
  AFTER the message was inserted so no announcement fires, and `role="alert"`
  used for a periodic-status poll where a polite live region is the correct
  primitive.
  Covers the modal pattern (`<dialog>` with `showModal()` for auto-inert,
  native focus trap, Escape-close, top-layer placement, and `::backdrop`
  styling), the dialog return-value pattern (`close(value)` and
  `dialog.returnValue`), the `closedby` attribute (`any`, `closerequest`,
  `none`) for declarative light-dismiss, the toast pattern (popover with
  `popover="manual"` + a paired `aria-live` region), the urgency-to-live
  mapping (polite for status and success, assertive plus `role="alert"`
  for errors and warnings), the toast queue (max-N visible, auto-dismiss
  timer, pause on hover and focus, restart on leave, light-dismiss button),
  focus restoration on close (capture trigger before opening, restore in
  `close` event), the `@starting-style` plus `transition-behavior:
  allow-discrete` animation pattern for entry / exit, and the rule that
  `tabindex` is FORBIDDEN on `<dialog>`.
  Keywords: dialog, HTMLDialogElement, showModal, show, close, returnValue,
  closedby, aria-modal, aria-labelledby, aria-describedby, autofocus, role
  dialog, role alertdialog, role status, role alert, aria-live, polite,
  assertive, atomic, relevant, popover, popovertarget, popovertargetaction,
  popover manual, popover auto, popover hint, top-layer, backdrop,
  focus-trap, scroll-lock, focus restoration, toast queue, auto-dismiss,
  pause on hover, light-dismiss, starting-style, transition-behavior
  allow-discrete, modal does not trap focus, body scrolls behind modal,
  toast not announced, focus lost after close, multiple toasts overlap,
  modal animation snaps, how do I make an accessible modal, toast
  notification HTML, confirm dialog pattern, accessible alert, scroll lock
  modal, how to announce to screen reader, how to queue toasts, how to
  restore focus after modal
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Component : Modal + Toast System

This skill is the operational reference for building accessible modals and toast notifications using native browser primitives only : the `<dialog>` element with `showModal()` for modals, and the Popover API plus an `aria-live` region for toasts. It covers focus restoration, scroll lock, the live-region urgency mapping, toast queue management, and the `@starting-style` animation pattern. The skill does NOT cover the popover / dialog API mechanics deep-dive (see `[[frontend-impl-popover-dialog-anchor]]`), the ARIA roles deep-dive (see `[[frontend-a11y-aria-patterns]]`), or custom focus-trap libraries (use `showModal()` instead).

## Quick Reference

### Floor rules

- ALWAYS use `<dialog>` with `dialog.showModal()` for modals. NEVER roll a custom focus-trap JS ; `showModal()` traps focus, inerts the rest of the document, enables Escape-close, and places the dialog on the top layer for free.
- ALWAYS capture the triggering element before opening a modal AND restore focus to it on the `close` event. The browser does NOT restore focus automatically.
- ALWAYS use `aria-live="polite"` for status, success, and informational toasts. NEVER use `aria-live="assertive"` for non-urgent updates ; it interrupts the screen reader mid-sentence.
- ALWAYS use `popover="manual"` for stacked toasts. NEVER use `popover="auto"` ; auto popovers are mutually exclusive in the top-layer stack so a second toast silently replaces the first.
- ALWAYS create the `aria-live` region in the DOM BEFORE inserting the message. NEVER create the region and the message in the same DOM mutation ; the screen reader observes mutations on a pre-existing region.
- ALWAYS pair `<dialog>` with `aria-labelledby` (pointing to the title) OR `aria-label`. NEVER ship a modal without an accessible name.
- ALWAYS use `dialog.close(value)` and `dialog.returnValue` for confirm-style dialogs. NEVER hand-roll a Promise wrapper unless you also need to bridge to async / await.
- NEVER set `tabindex` on a `<dialog>` element. MDN forbids it ; the dialog manages its own tabindex.

### Decision tree 1 : `<dialog>` `showModal` versus popover ?

```
The UI must INTERRUPT and demand a response (confirm destructive action,
sign-in flow, settings overlay) ?
  -> <dialog> with dialog.showModal(). Modal : blocks the rest of the page,
     traps focus, Escape closes, ::backdrop styles the dim overlay.

The UI is a NON-BLOCKING surface (menu, tooltip, autocomplete listbox,
date picker, share sheet) ?
  -> Popover. Use popover="auto" for mutually-exclusive UI (one menu at a time)
     OR popover="manual" for independent surfaces (toast queue).

The UI is a TOAST notification (transient status feedback) ?
  -> Popover with popover="manual" + aria-live region paired with the message
     element. The popover provides top-layer positioning ; the aria-live
     region provides the announcement.

You need a hover-revealed surface (tooltip) ?
  -> Popover with popover="hint". Lower-priority than auto, can coexist with
     other auto popovers.
```

### Decision tree 2 : Toast urgency : polite or assertive ?

```
The toast reports a STATUS or SUCCESS that the user expected
("Saved", "Copied to clipboard", "Sent") ?
  -> aria-live="polite". The screen reader announces when it reaches a
     natural pause. Does not interrupt.

The toast reports an ERROR or WARNING that the user did not initiate
("Connection lost", "File failed to upload", "Session expired") ?
  -> aria-live="assertive" OR role="alert" (which implies
     aria-live="assertive" + aria-atomic="true"). The screen reader
     interrupts to announce.

The toast announces a periodic background poll
("Weather updated", "Inbox refreshed every 30 s") ?
  -> aria-live="polite". Periodic noise is exactly what polite is for.
     NEVER use role="alert" for periodic updates ; it spams the user.

The toast contains both a heading and a body ?
  -> aria-atomic="true" on the live region so the announcer reads the
     full toast as one unit instead of just the changed nodes.
```

### Decision tree 3 : Persistent or transient dismissal ?

```
Auto-dismiss after N seconds, pause on hover or focus ?
  -> setTimeout-based timer. Clear timer on `pointerenter` and `focusin`;
     restart on `pointerleave` and `focusout`. Recommended duration :
     4 to 7 seconds for short messages ; 7 to 12 seconds when there is an
     action button (so the user has time to read AND click).

Manual dismiss only (the toast carries an action the user must take) ?
  -> popover="manual" + an explicit close button (popovertargetaction="hide")
     and / or an action button. No timer.

Toast is a confirmation requiring an undo within a time budget ?
  -> Auto-dismiss with progress indicator. The progress bar gives the user
     visual feedback on how much time remains. Pause on hover.

Toast is critical and must NOT auto-dismiss (security warning) ?
  -> Use a modal `<dialog>` instead. Toast is the wrong primitive for
     critical, must-acknowledge messages.
```

## Patterns

### Pattern : Confirm modal with `<dialog>` + return value

```html
<button type="button" data-open="confirm">Delete account</button>

<dialog id="confirm" aria-labelledby="confirm-title" aria-describedby="confirm-body">
  <h2 id="confirm-title">Delete account ?</h2>
  <p id="confirm-body">This permanently removes all your data.</p>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="confirm" autofocus>Delete</button>
  </form>
</dialog>
```

```js
const dialog = document.querySelector("#confirm");
const opener = document.querySelector('[data-open="confirm"]');
let trigger = null;

opener.addEventListener("click", () => {
  trigger = opener;
  dialog.showModal();
});

dialog.addEventListener("close", () => {
  if (dialog.returnValue === "confirm") deleteAccount();
  trigger?.focus();
  trigger = null;
});
```

`<form method="dialog">` is the platform-native way to close on submit and pass the submitter's `value` to `dialog.returnValue`. No JS submit handler needed.

### Pattern : Modal with animated open / close

```css
dialog {
  border: 1px solid oklch(0.85 0 0);
  border-radius: 12px;
  padding: 2rem;
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms, transform 200ms, overlay 200ms allow-discrete, display 200ms allow-discrete;
}

dialog:not([open]) {
  opacity: 0;
  transform: translateY(8px);
}

@starting-style {
  dialog[open] {
    opacity: 0;
    transform: translateY(8px);
  }
}

dialog::backdrop {
  background: oklch(0.10 0 0 / 0);
  transition: background 200ms, display 200ms allow-discrete, overlay 200ms allow-discrete;
}

dialog[open]::backdrop {
  background: oklch(0.10 0 0 / 0.4);
}

@starting-style {
  dialog[open]::backdrop {
    background: oklch(0.10 0 0 / 0);
  }
}
```

`transition-behavior: allow-discrete` (declared via the `allow-discrete` keyword in the `transition` shorthand) lets `display` and `overlay` participate in the transition so the dialog can animate from / to `display: none`. `@starting-style` provides the entry baseline.

### Pattern : Toast queue (popover manual + aria-live)

```html
<div id="toast-queue" class="toast-stack" aria-live="polite" aria-atomic="false"></div>
```

```js
const queue = document.querySelector("#toast-queue");
const MAX_VISIBLE = 4;

function showToast({ text, urgent = false, duration = 5000, action }) {
  if (queue.children.length >= MAX_VISIBLE) {
    queue.firstElementChild.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("popover", "manual");
  if (urgent) toast.setAttribute("role", "alert");
  else toast.setAttribute("role", "status");

  const body = document.createElement("p");
  body.textContent = text;
  toast.append(body);

  if (action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = action.label;
    btn.addEventListener("click", () => { action.run(); toast.hidePopover(); });
    toast.append(btn);
  }

  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss");
  close.textContent = "×";
  close.addEventListener("click", () => toast.hidePopover());
  toast.append(close);

  queue.append(toast);
  toast.showPopover();

  let timer = setTimeout(() => toast.hidePopover(), duration);
  toast.addEventListener("pointerenter", () => clearTimeout(timer));
  toast.addEventListener("focusin", () => clearTimeout(timer));
  toast.addEventListener("pointerleave", () => { timer = setTimeout(() => toast.hidePopover(), duration); });
  toast.addEventListener("focusout", () => { timer = setTimeout(() => toast.hidePopover(), duration); });

  toast.addEventListener("toggle", (e) => {
    if (e.newState === "closed") toast.remove();
  });
}
```

`popover="manual"` is critical : without it the second toast silently hides the first because `popover="auto"` enforces top-layer mutual exclusivity. The live region exists BEFORE the message is inserted, so the screen reader observes the mutation and announces.

### Pattern : Focus restoration

```js
function openModal(dialog, trigger) {
  dialog.dataset.opener = trigger.id || "";
  dialog.showModal();
}

function attachRestore(dialog) {
  dialog.addEventListener("close", () => {
    const id = dialog.dataset.opener;
    if (id) document.getElementById(id)?.focus();
    delete dialog.dataset.opener;
  });
}
```

The browser does NOT restore focus when `<dialog>` closes. Capture the trigger before opening and restore in the `close` event.

### Pattern : Light-dismiss for non-critical modals

```html
<dialog id="settings" closedby="any">
  ...
</dialog>
```

`closedby="any"` allows light-dismiss on backdrop click PLUS Escape. Values : `any`, `closerequest` (Escape only), `none` (programmatic close only). Use `any` for settings / detail overlays, `closerequest` for destructive confirms.

## Live-region behavior summary

| Pattern | Implicit ARIA | Announces when | Use for |
|---------|---------------|----------------|---------|
| `aria-live="polite"` | live region with polite priority | at next pause | status, success, info |
| `aria-live="assertive"` | live region with assertive priority | immediately, interrupts | errors, time-critical |
| `role="status"` | implies `aria-live="polite"` + `aria-atomic="true"` | at next pause, full text | toast wrappers for status |
| `role="alert"` | implies `aria-live="assertive"` + `aria-atomic="true"` | immediately | errors, security warnings |
| `aria-atomic="true"` | n/a | full live region read as one unit | multi-part toasts |

Source : [MDN : ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/aria-live_region_role) (verified 2026-05-19), [W3C WAI APG : Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) (verified 2026-05-19).

## Cross-references

- `[[frontend-impl-popover-dialog-anchor]]` : full `<dialog>` and Popover API mechanics, anchor positioning, `closedby` attribute.
- `[[frontend-a11y-aria-patterns]]` : Dialog Modal pattern, Alert pattern, full ARIA role surface.
- `[[frontend-a11y-focus-keyboard-inert]]` : focus management, `:focus-visible`, `inert` attribute, keyboard interaction.
- `[[frontend-visual-micro-interactions]]` : hover, focus, press transitions for action buttons.
- `[[frontend-a11y-motion-contrast-wcag22]]` : `prefers-reduced-motion` gate for entry / exit animations.

## Reference Links

- [references/methods.md](references/methods.md) : `HTMLDialogElement` interface, Popover API surface, `aria-live` semantics, `@starting-style` and `transition-behavior: allow-discrete`.
- [references/examples.md](references/examples.md) : renderable HTML demo with confirm modal, toast queue, animated entry / exit, all keyboard-navigable.
- [references/anti-patterns.md](references/anti-patterns.md) : nine anti-patterns with symptom, root cause, and fix.

## Authoritative sources

- [MDN : `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19)
- [MDN : Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (verified 2026-05-19)
- [MDN : ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/aria-live_region_role) (verified 2026-05-19)
- [W3C WAI APG : Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (verified 2026-05-19)
- [W3C WAI APG : Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) (verified 2026-05-19)
- [MDN : `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19)
- [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (verified 2026-05-19)
