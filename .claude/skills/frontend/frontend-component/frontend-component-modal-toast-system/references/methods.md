# References : Modal + Toast API surface

Complete surface for `frontend-component-modal-toast-system`. All citations verified 2026-05-19.

## `HTMLDialogElement` interface

Source : [MDN : `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19). Baseline Widely Available.

### Methods

| Method | Effect |
|--------|--------|
| `showModal()` | Opens as a modal. Adds the dialog to the top layer, inerts the rest of the document, enables Escape-to-close, supports `::backdrop`. |
| `show()` | Opens as a non-modal. Stays in normal flow. No focus trap, no backdrop, no auto-inert. |
| `close(returnValue?: string)` | Closes the dialog. Sets `dialog.returnValue` to the passed string. Fires the `close` event. |

### Properties

| Property | Type | Meaning |
|----------|------|---------|
| `open` | boolean | True when the dialog is currently open. |
| `returnValue` | string | The value passed to `close(...)` OR the `value` of the form submitter when closed via `<form method="dialog">`. |
| `closedBy` | string | Reflects the `closedby` attribute (`"any"`, `"closerequest"`, `"none"`). |

### Events

| Event | Fires when |
|-------|-----------|
| `close` | After the dialog closes (via `close()`, Escape, form submit, or light-dismiss). |
| `cancel` | When the user attempts to dismiss (Escape) ; cancelable. |
| `beforetoggle` | Before the dialog transitions between open and closed. |
| `toggle` | After the dialog transitions ; `event.newState` is `"open"` or `"closed"`. |

### `closedby` attribute

Declarative light-dismiss control.

| Value | Behavior |
|-------|----------|
| `any` | Closes on backdrop click OR Escape. |
| `closerequest` | Closes on Escape only (default for modal `<dialog>`). |
| `none` | Programmatic close only. |

### Rules and forbidden uses

- `tabindex` is FORBIDDEN on `<dialog>` per MDN. The dialog manages its own tabindex.
- Initial focus : the first focusable descendant unless `autofocus` is set on a specific element.
- `aria-modal="true"` is REDUNDANT when using `showModal()` ; the browser sets the modal flag in the accessibility tree automatically. Setting it explicitly is harmless.

### `<form method="dialog">` pattern

```html
<dialog id="confirm">
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="confirm" autofocus>OK</button>
  </form>
</dialog>
```

Submitting the form closes the dialog and sets `dialog.returnValue` to the submitter's `value` attribute. No JS submit handler needed.

## Popover API

Source : [MDN : Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (verified 2026-05-19). Baseline 2025 (Newly Available since January 2025).

### `popover` attribute

| Value | Behavior |
|-------|----------|
| `auto` (default when attribute present without value) | Light-dismiss on outside click and Escape. Mutually exclusive in the top-layer stack : opening one auto popover closes any other. |
| `manual` | Closed only via script (`element.hidePopover()`) or `popovertargetaction="hide"`. No light-dismiss. Multiple manual popovers can coexist. |
| `hint` | Lower priority than `auto` ; coexists with auto popovers. Use for tooltips. |

### Methods on any popover element

| Method | Effect |
|--------|--------|
| `showPopover()` | Opens the popover, places on top layer. |
| `hidePopover()` | Closes the popover. |
| `togglePopover(force?: boolean)` | Toggles open / closed ; optional `force` overrides direction. |

### Events

| Event | Fires when |
|-------|-----------|
| `beforetoggle` | Before the popover transitions ; cancelable when `event.newState === "open"`. |
| `toggle` | After the popover transitions ; `event.newState` is `"open"` or `"closed"`. |

### Trigger attributes (on `<button>` and `<input type="button">`)

| Attribute | Value | Effect |
|-----------|-------|--------|
| `popovertarget` | id of popover element | Wires this button to that popover. |
| `popovertargetaction` | `show`, `hide`, or `toggle` | Direction of the trigger. Default : `toggle`. |

### Rules

- Popovers are ALWAYS non-modal. For modal behavior use `<dialog>` with `showModal()`.
- A popover element MUST have either `popover="auto"`, `popover="manual"`, or `popover="hint"` ; the attribute must be present.

## `aria-live` region semantics

Source : [MDN : ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/aria-live_region_role) (verified 2026-05-19), [W3C WAI APG : Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) (verified 2026-05-19).

### `aria-live` attribute

| Value | Announcement timing |
|-------|---------------------|
| `off` | Default. No announcement on mutation. |
| `polite` | Announce at the next graceful pause (end of current utterance or pause point). Use for status, success, info. |
| `assertive` | Interrupt the current speech to announce. Use sparingly ; only for time-critical errors. |

### Implicit live-region roles

| Role | Implies |
|------|---------|
| `status` | `aria-live="polite"` + `aria-atomic="true"` |
| `alert` | `aria-live="assertive"` + `aria-atomic="true"` |
| `log` | `aria-live="polite"` + `aria-relevant="additions"` |
| `marquee` | `aria-live="off"` (despite the name) |
| `timer` | `aria-live="off"` |

### Supporting attributes

| Attribute | Values | Effect |
|-----------|--------|--------|
| `aria-atomic` | `true` / `false` | When `true`, the screen reader reads the ENTIRE region on any mutation. When `false`, only changed nodes are announced. |
| `aria-relevant` | space-separated subset of `additions`, `removals`, `text`, `all` | Which kinds of mutations trigger announcement. Default : `additions text`. |
| `aria-busy` | `true` / `false` | Suspends announcement while a batch update is in progress ; flush on `false`. |

### Critical rule : pre-existing region

The live region MUST exist in the DOM BEFORE the message is inserted. Screen readers observe mutations on a live region they have already registered. Creating the region and inserting content in the same DOM mutation produces NO announcement.

```js
// WRONG : region and message together
const wrapper = document.createElement("div");
wrapper.setAttribute("aria-live", "polite");
wrapper.textContent = "Saved";
document.body.append(wrapper);  // screen reader does not announce

// RIGHT : pre-existing region, then mutate
const region = document.querySelector('[aria-live]');  // already in HTML
region.textContent = "Saved";  // announced
```

## `@starting-style` + `transition-behavior: allow-discrete`

Source : [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19), [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (verified 2026-05-19).

### Why both are needed for dialog / popover animation

The browser transitions `display: none` to `display: block` (and `overlay: none` to `overlay: auto`) as DISCRETE swaps by default. Even with a `transition: opacity 200ms` rule, the element is already at full opacity when it appears because no entry baseline exists.

The two pieces :

1. `transition-behavior: allow-discrete` (or the `allow-discrete` keyword inside the `transition` shorthand) lets discrete properties like `display` and `overlay` participate in the transition timeline.
2. `@starting-style` defines the value the element holds at the FIRST style update after being added to the tree, providing the entry baseline.

```css
dialog {
  opacity: 1;
  transition: opacity 200ms, display 200ms allow-discrete, overlay 200ms allow-discrete;
}

dialog:not([open]) { opacity: 0; }

@starting-style {
  dialog[open] { opacity: 0; }
}
```

The opacity transitions from `0` (starting-style) to `1` (open state), and the `display` swap is held until the transition completes.

## Modal pattern (W3C WAI APG)

Source : [W3C WAI APG : Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (verified 2026-05-19).

### Required ARIA

| Attribute | Value | Notes |
|-----------|-------|-------|
| `role="dialog"` | Implicit on `<dialog>` | Set explicitly only when using a non-`<dialog>` element. |
| `aria-modal="true"` | Implicit on `<dialog>.showModal()` | Set explicitly only when using a non-`<dialog>` element. |
| `aria-labelledby` | id of the title element | Required when a visible title exists. |
| `aria-label` | string | Alternative when no visible title. |
| `aria-describedby` | id of the body element | Optional ; for additional context. |

### Keyboard interaction

| Key | Effect |
|-----|--------|
| Tab | Move to next focusable element within the dialog. Wraps from the last to the first. |
| Shift + Tab | Move to previous focusable element. Wraps from the first to the last. |
| Escape | Close the dialog (when `closedby` allows). |
| Enter (on submit button) | Submit the form ; close via `<form method="dialog">`. |

### Initial focus rules

1. If an element inside the dialog has `autofocus`, focus moves there.
2. Otherwise, focus moves to the first focusable descendant.
3. If no focusable descendants exist, focus moves to the dialog element itself.

## Alert pattern (W3C WAI APG)

Source : [W3C WAI APG : Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) (verified 2026-05-19).

### Use cases

- Important time-sensitive information that cannot wait.
- Error states that block continuation.
- Security warnings.

### NOT use cases

- Regular form-save confirmations.
- Periodic background updates.
- Hover / focus tooltips.

### Implementation

Either :

```html
<div role="alert">Connection lost.</div>
```

OR :

```html
<div aria-live="assertive" aria-atomic="true">Connection lost.</div>
```

`role="alert"` is the semantic shortcut. The region MUST exist before the message is inserted (same rule as all live regions).

## Toast queue model

A toast system is built from three pieces :

1. **A pre-existing `aria-live` region wrapper** (one for polite messages, optionally one for assertive). Lives in the DOM at startup.
2. **A popover-element-per-toast** with `popover="manual"` so multiple coexist in the top layer.
3. **A queue manager** with a max-visible cap, auto-dismiss timer, pause-on-hover and pause-on-focus handlers, and explicit close action.

### Auto-dismiss timer rules

| Event | Timer action |
|-------|--------------|
| Toast `showPopover()` | Start timer. |
| `pointerenter` on toast | Clear timer. |
| `focusin` on toast | Clear timer. |
| `pointerleave` on toast | Restart timer with full duration. |
| `focusout` on toast | Restart timer with full duration. |
| Action button click | Clear timer and `hidePopover()`. |
| Close button click | Clear timer and `hidePopover()`. |

### Recommended duration

| Toast content | Duration |
|---------------|----------|
| Short status ("Saved", "Copied") | 4 seconds |
| Standard message | 5 to 6 seconds |
| Message with action button | 7 to 12 seconds |
| Critical (consider modal instead) | n/a, do not auto-dismiss |

### Stacking

`popover="manual"` allows multiple to coexist. Cap visible count to 3 or 4 to avoid overwhelming the user ; queue additional toasts by removing the oldest visible when a new one arrives.
