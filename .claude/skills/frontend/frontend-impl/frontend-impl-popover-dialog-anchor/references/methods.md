# References : Popover, Dialog, Anchor Catalog

Verified against [MDN : dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (2026-05-19), [MDN : Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (2026-05-19), [MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) (2026-05-19), [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (2026-05-19), [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (2026-05-19), [MDN : overlay](https://developer.mozilla.org/en-US/docs/Web/CSS/overlay) (2026-05-19), [MDN : position-try-fallbacks](https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks) (2026-05-19), [WHATWG HTML : popover](https://html.spec.whatwg.org/multipage/popover.html) (2026-05-19).

## 1. `<dialog>` element

### 1.1 Methods

| Method | Modal? | Top layer? | ::backdrop? | Inert background? | Esc closes? |
|---|---|---|---|---|---|
| `dialog.showModal()` | YES | YES | YES | YES (automatic) | YES (default) |
| `dialog.show()` | NO | NO | NO | NO | NO (default) |
| `dialog.close(returnValue?)` | n/a | n/a | n/a | n/a | n/a |

### 1.2 Attributes

| Attribute | Values | Purpose |
|---|---|---|
| `open` | boolean | Reflects open state. Non-modal when used as attribute. NOT recommended for dynamic toggling. |
| `closedby` | `any` / `closerequest` / `none` | Controls dismiss paths |
| `autofocus` | (on a descendant) | Initial focus element |

### 1.3 `closedby` defaults

| Open via | Default `closedby` |
|---|---|
| `showModal()` | `closerequest` (Esc + script close) |
| `show()` | `none` (script close only) |
| `<dialog open>` | `none` |

### 1.4 Events

| Event | Fires when |
|---|---|
| `close` | Dialog closes via any path : `close()`, form submit, Esc, light-dismiss |
| `cancel` | User attempts Esc dismissal; cancelable to prevent close |

### 1.5 `<form method="dialog">`

Submit buttons inside close the dialog with `dialog.returnValue` set to the clicked button's `value`. No JS submit handler needed.

### 1.6 `dialog.returnValue`

String property. Set by `close(value)` argument OR by submit-button `value` attribute. Read in `close` event handler to branch on user's choice.

### 1.7 Forbidden : `tabindex` on `<dialog>`

Per MDN : "Do not add the tabindex property to the `<dialog>` element as it is not interactive and does not receive focus." Use `autofocus` on a descendant instead.

## 2. Popover API

### 2.1 `popover` attribute values

| Value | Light dismiss? | Close other popovers? | Close requests (Esc) | Use |
|---|---|---|---|---|
| `auto` | YES | Closes other auto popovers down to common ancestor | YES | Dropdowns, menus, comboboxes, command palettes |
| `manual` | NO | NO | NO | Settings panels, persistent overlays |
| `hint` | YES | Closes other hint popovers (not auto) | YES | Tooltips, autocomplete hints |

All popovers are non-modal by spec. For modal behavior use `<dialog>` + `showModal()`.

### 2.2 Trigger attributes

| Attribute | On | Purpose |
|---|---|---|
| `popovertarget="<id>"` | `<button>` / `<input type="button">` | References the popover element by id |
| `popovertargetaction` | trigger | `show` / `hide` / `toggle` (default `toggle`) |

### 2.3 Element methods

| Method | Effect |
|---|---|
| `showPopover()` | Open the popover |
| `hidePopover()` | Close the popover |
| `togglePopover(force?)` | Toggle; optional boolean forces state |

### 2.4 Events

| Event | Cancelable? | Fires on |
|---|---|---|
| `beforetoggle` | YES (on show only) | Before state change; `event.oldState`, `event.newState` |
| `toggle` | NO | After state change |

### 2.5 Pseudo-class

| Selector | Matches |
|---|---|
| `:popover-open` | Popover element in showing state |

### 2.6 Focus restoration

The Popover API automatically restores focus to the previously-focused element on light-dismiss, Esc-close, and explicit hide via `popovertargetaction="hide"`. Per WHATWG : "if focusPreviousElement is true and document's focused area is a shadow-including inclusive descendant of element, then run the focusing steps for previouslyFocusedElement."

`<dialog>` does NOT do this automatically. Authors must capture and restore manually.

## 3. CSS Anchor Positioning

### 3.1 Core properties

| Property | Value | Purpose |
|---|---|---|
| `anchor-name` | `<dashed-ident>` or `none` | Mark element as an anchor |
| `position-anchor` | `<dashed-ident>` | Set default anchor for `anchor()` calls on this element |
| `position-area` | grid keywords | High-level placement on the 3x3 grid around the anchor |
| `anchor-scope` | `all` / `none` / `<dashed-ident>+` | Scope anchor name visibility |

### 3.2 `anchor()` function

```css
top:    anchor(bottom);       /* element's top aligned to anchor's bottom */
left:   anchor(center);       /* horizontally centered on anchor */
right:  anchor(right);
inset-inline-start: anchor(end);
```

Accepted anchor-side keywords : `top`, `bottom`, `start`, `end`, `left`, `right`, `center`, `inside`, `outside`, `self-start`, `self-end`, or `<percentage>`.

### 3.3 `position-area` 3x3 grid

```
| top left      | top center      | top right      |
| center left   | center (anchor) | center right   |
| bottom left   | bottom center   | bottom right   |
```

Keywords combine physical (`top`, `right`, `bottom`, `left`), logical (`block-start`, `block-end`, `inline-start`, `inline-end`), coordinate (`x-start`, `x-end`, `y-start`, `y-end`), and `span-*` variants (`span-left`, `span-block-end`, `span-inline-end`, `span-all`).

Examples :
- `position-area: bottom center` : below anchor, horizontally centered.
- `position-area: bottom span-inline-end` : below anchor, spanning from anchor inline-start to inline-end-of-container.
- `position-area: top right` : above and to the right of the anchor.

### 3.4 `position-try-fallbacks`

```css
position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
```

| Tactic | Effect |
|---|---|
| `flip-block` | Mirror placement across inline axis (top -> bottom) |
| `flip-inline` | Mirror placement across block axis (left -> right) |
| `flip-start` | Mirror diagonally, swap start / end |
| (space-separated) | Compose into one transformation |
| (comma-separated) | Try in order until one fits |
| `<dashed-ident>` (named) | Reference an `@position-try --name { ... }` block |

If all fallbacks overflow, browser reverts to the original placement.

### 3.5 Companion properties

| Property | Value | Purpose |
|---|---|---|
| `anchor-size(<axis>)` | function in `inline-size` / `block-size` | Size relative to anchor |
| `position-visibility` | `always` / `anchors-visible` / `no-overflow` | Auto-hide when no placement fits |
| `inset-area` | (alias of position-area) | Legacy name; prefer `position-area` |

### 3.6 Implicit anchor for popovers

When a popover is triggered by `popovertarget` on a button, the popover acquires an implicit anchor to that button. Authors can write `position-area: bottom span-inline-end;` directly in the popover rule without declaring `anchor-name` on the trigger.

### 3.7 `@supports` gate

```css
@supports (anchor-name: --x) {
  /* anchor positioning supported */
}
```

REQUIRED until full cross-engine Baseline.

## 4. `@starting-style`

### 4.1 Two syntactic forms

```css
/* Standalone */
@starting-style {
  [popover]:popover-open { opacity: 0; }
}

/* Nested inside ruleset (declarations only inside) */
[popover]:popover-open {
  opacity: 1;
  @starting-style {
    opacity: 0;
  }
}
```

### 4.2 Specificity rule (CRITICAL)

Same specificity as the original rule. Source order decides : `@starting-style` MUST be declared AFTER the open-state rule (or nested inside it). Reverse order means the open-state rule wins and no entry animation runs.

### 4.3 NOT needed for `@keyframes` / `animation`

`@starting-style` applies only to `transition`. CSS animations declare their own start state in `@keyframes`.

### 4.4 Three lifecycle states

| State | Source |
|---|---|
| Starting (entry begin) | `@starting-style { :popover-open { ... } }` |
| Open (entry end, exit begin) | `:popover-open { ... }` |
| Closed (exit end) | `[popover] { ... }` (the default selector) |

## 5. `transition-behavior`

### 5.1 Values

| Value | Effect |
|---|---|
| `normal` (default) | Discrete properties do NOT transition |
| `allow-discrete` | Discrete properties DO transition (`display`, `content-visibility`, `overlay`) |

### 5.2 Discrete-property flip timing

| Going TO | Flip happens at |
|---|---|
| `display: none` or `content-visibility: hidden` | 100% of duration (visible throughout exit) |
| `display: <visible>` from `none` | 0% of duration (visible throughout entry) |
| Other discrete property changes | 50% of duration |

### 5.3 Required transition list for popover / dialog enter+exit

```css
transition:
  opacity   0.3s,
  transform 0.3s,
  display   0.3s allow-discrete,
  overlay   0.3s allow-discrete;
```

Omitting `display ... allow-discrete` -> entry animation never starts (element jumps to visible). Omitting `overlay ... allow-discrete` -> exit animation cuts off (element drops below z-stack neighbors on hide).

## 6. `overlay` property

| Aspect | Value |
|---|---|
| Values | `auto` / `none` |
| Author writeable? | NO. User agent sets it. |
| Use | List in `transition-property` (or shorthand) to defer top-layer removal until animation completes. |
| Baseline | Limited / Chromium-led; gate accordingly. |

## 7. Combined animation recipe (canonical shape)

```css
[popover] {
  opacity: 0;
  transform: scale(0.95);
  transition:
    opacity   0.2s ease-out,
    transform 0.2s ease-out,
    display   0.2s allow-discrete,
    overlay   0.2s allow-discrete;
}

[popover]:popover-open {
  opacity: 1;
  transform: scale(1);
}

@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

Substitute `[popover]:popover-open` with `dialog[open]` for `<dialog>` patterns. Substitute `::backdrop` selector for backdrop animation.

## 8. Cross-References

- `[[frontend-syntax-html5-semantic]]` : `<dialog>` element semantics
- `[[frontend-a11y-aria-patterns]]` : ARIA roles for dialog, combobox, menu, listbox
- `[[frontend-a11y-focus-keyboard-inert]]` : focus management, `:focus-visible`, tabindex, inert
- `[[frontend-visual-micro-interactions]]` : `@starting-style` general use, easing curves, timing tokens
- `[[frontend-component-modal-toast-system]]` : component-level template (modal / toast / drawer)
