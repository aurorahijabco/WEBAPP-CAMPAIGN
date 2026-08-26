# References : Focus, Keyboard, and Inert Catalog

Verified against [MDN : inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) (2026-05-19), [MDN : :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) (2026-05-19), [MDN : :focus-within](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within) (2026-05-19), [MDN : tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) (2026-05-19), [MDN : `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) (2026-05-19), [MDN : HTMLElement.focus()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) (2026-05-19), [W3C WAI APG : Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) (2026-05-19), [W3C WAI APG : Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (2026-05-19), [W3C WAI APG : Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (2026-05-19), [W3C WAI APG : Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) (2026-05-19).

## 1. `inert` attribute

### 1.1 Syntax

| Form | Meaning |
|---|---|
| `<main inert>...</main>` | Subtree rooted at `<main>` is fully inert |
| `<aside inert="">...</aside>` | Same (boolean attribute; presence sufficient) |
| `element.inert = true` | JS reflection of the attribute |

### 1.2 Effects on descendants (all six simultaneous)

1. No click events fired.
2. Not focusable; no focus events.
3. Not found by browser find-in-page.
4. Cannot be text-selected.
5. Cannot be edited (inputs, contenteditable).
6. Hidden from accessibility tree (AT does not see them).

### 1.3 Interaction with `<dialog>`

| Method | Background becomes inert? | Tab cycles within? |
|---|---|---|
| `dialog.showModal()` | YES, automatic | YES |
| `dialog.show()` | NO | NO |
| `<dialog open>` attribute (non-modal) | NO | NO |

Modal `<dialog>` "escape inertness" themselves (top layer), but can be re-inerted by explicit `inert` attribute (do NOT do this on an open dialog).

### 1.4 Container vs control

Per MDN : "To make individual controls inert, consider using the disabled attribute, along with CSS `:disabled` styles, instead." Use `inert` on a container (background, off-screen slide), `disabled` on a control.

## 2. `:focus-visible` and `:focus-within`

### 2.1 `:focus-visible`

| Aspect | Value |
|---|---|
| Matches | focused element where UA heuristic says focus SHOULD be visually indicated |
| Typical match | keyboard-driven focus, script-driven focus, text inputs even on mouse click |
| Typical non-match | mouse click on a button |
| Specificity | same as `:focus` (one pseudo-class) |

Style replacement requirement : WCAG 1.4.11 Non-Text Contrast at 3:1 versus adjacent background.

### 2.2 `:focus-within`

| Aspect | Value |
|---|---|
| Matches | element OR any descendant is focused |
| Crosses shadow boundaries | YES (per MDN : "This includes descendants in shadow trees.") |
| Specificity | same as `:focus` |

Combines with `:has()` for cross-tree lift : `.row:has(:focus-within)`.

## 3. `tabindex` semantics

### 3.1 Values

| Value | Focusable | Tabbable | Use |
|---|---|---|---|
| (omitted) | only default-focusable | only default-focusable | Most elements; do not override |
| `0` | YES | YES (at DOM position) | Custom widget item; non-default-focusable container that needs Tab-stop |
| `-1` | YES (programmatic + click) | NO | Roving tabindex inactive items; programmatically-focused containers |
| positive int | YES | YES (numeric-first, then DOM) | ANTI-PATTERN. Never. |

### 3.2 Default-focusable elements (do NOT add tabindex)

`<a href>`, `<area href>`, `<button>`, `<frame>`, `<iframe>`, `<input>` (except `type="hidden"`), `<object>`, `<select>`, `<textarea>`, SVG `<a href>`, `<summary>` inside `<details>`.

### 3.3 Special case : `<dialog>`

Per MDN : "Do not add the tabindex property to the `<dialog>` element as it is not interactive and does not receive focus."

## 4. `HTMLElement.focus(options?)`

### 4.1 Options object

| Option | Type | Behavior |
|---|---|---|
| `preventScroll` | boolean (default false) | If true, do not scroll focused element into view |
| `focusVisible` | boolean (no default) | If true, force visible focus ring; if false, suppress (use sparingly) |

### 4.2 Behavior on non-focusable

`element.focus()` is a silent no-op if the element is not focusable. To make a `<div>` programmatically focusable, give it `tabindex="-1"` first.

## 5. Roving tabindex vs `aria-activedescendant`

| Aspect | Roving tabindex | aria-activedescendant |
|---|---|---|
| DOM focus location | on the active item | on the container |
| Attribute updates per move | two `tabindex` changes | one `aria-activedescendant` change |
| Must also call `.focus()` | YES | NO |
| `:focus` / `:focus-visible` works on item | YES | NO (use attribute selector instead) |
| Browser ScrollIntoView | automatic | manual |
| When to use | tabs, listbox, menu, toolbar, tree, grid, treegrid | combobox input + popup |

## 6. Arrow-key bindings (per W3C WAI APG)

### 6.1 1D horizontal (tabs default, toolbar)

| Key | Action |
|---|---|
| Right Arrow | Next item; wrap to first when at last (conventional) |
| Left Arrow | Previous item; wrap to last when at first |
| Home | First item |
| End | Last item |
| Space / Enter | Activate (if manual activation) |

### 6.2 1D vertical (listbox, vertical menu, vertical tabs, radio group, tree)

When `aria-orientation="vertical"` : Down Arrow acts as Right Arrow, Up Arrow as Left Arrow. Otherwise identical.

### 6.3 2D grid

| Key | Action |
|---|---|
| Right Arrow | One cell right; do NOT wrap row |
| Left Arrow | One cell left; do NOT wrap row |
| Down Arrow | One cell down; do NOT wrap column |
| Up Arrow | One cell up; do NOT wrap column |
| Home | First cell in current row |
| End | Last cell in current row |
| Ctrl + Home | First cell of first row |
| Ctrl + End | Last cell of last row |
| Page Down | Down N rows (author-defined); typically a viewport |
| Page Up | Up N rows |

Treegrid : Right / Left at parent rows expand / collapse, otherwise as above.

### 6.4 Automatic vs manual activation

| Style | Trigger | When |
|---|---|---|
| Automatic | focus = activate | Cheap activation (toggle panel, change view) |
| Manual | Space or Enter | Required when activation has side effects (network, expensive render) |

### 6.5 Landing position when widget re-entered

| Widget | Landing element |
|---|---|
| Grid, treegrid | last focused, else first |
| Radio group, tabs, listbox, tree | selected element, else first |
| Menubar, toolbar | first element |

## 7. Escape, `closedby`, focus restoration

### 7.1 Escape on `<dialog>`

| Open method | Esc closes? |
|---|---|
| `dialog.showModal()` | YES (default, equivalent to `closedby="closerequest"`) |
| `dialog.show()` | NO (default, equivalent to `closedby="none"`) |
| `<dialog open>` (attribute) | NO |

### 7.2 `closedby` attribute (HTMLDialogElement)

| Value | Dismiss mechanisms enabled |
|---|---|
| `any` | Light-dismiss (click outside) + Esc + developer button/form |
| `closerequest` | Esc + developer mechanism |
| `none` | Developer mechanism only |
| (unset) | `closerequest` for showModal(), `none` otherwise |

### 7.3 Focus restoration

| API | Auto-restores on Esc-close? |
|---|---|
| `<dialog>.showModal()` | NO. Author must capture `document.activeElement` before open and restore on `close` event. |
| Popover API (`popover="auto"`) | YES, to the invoker (linked via `popovertarget`). |

Pattern :

```js
let trigger = null;
opener.addEventListener('click', () => {
  trigger = document.activeElement;
  dialog.showModal();
});
dialog.addEventListener('close', () => {
  trigger?.focus();
  trigger = null;
});
```

### 7.4 Initial focus inside dialog

Per MDN : "When using HTMLDialogElement.showModal() to open a `<dialog>`, focus is set on the first nested focusable element. Explicitly indicating the initial focus placement by using the autofocus attribute will help ensure initial focus is set on the element deemed the best initial focus placement."

Use `autofocus` on the primary safe action (Cancel for destructive dialogs, OK for affirm-only dialogs). NEVER `autofocus` a destructive button.

## 8. inert vs aria-hidden vs pointer-events: none vs disabled

| Concern | `inert` | `aria-hidden="true"` | `pointer-events: none` | `disabled` |
|---|---|---|---|---|
| Blocks click | YES | NO | YES | YES |
| Blocks focus | YES | NO | NO | YES |
| Blocks find-in-page | YES | NO | NO | NO |
| Blocks selection | YES | NO | NO | NO |
| Blocks edit | YES | NO | NO | YES |
| Hides from AT | YES | YES | NO | adds "disabled" announcement |
| Applies to any element | YES | YES | YES | NO (form controls + fieldset only) |

## 9. Combined matrix : focus management technique by widget

| Widget / scenario | Tabindex strategy | Focus indicator | Background isolation | Escape | Restore focus |
|---|---|---|---|---|---|
| `<dialog>.showModal()` modal | `autofocus` on primary action | `:focus-visible` 3:1 | Auto (top layer + implicit inert) | Auto (`closerequest`) | Manual on `close` |
| `<dialog>.show()` non-modal | `autofocus` if appropriate | `:focus-visible` | Author sets `inert` on `<main>` | Author adds keydown | Manual |
| Popover `popover="auto"` | DOM focus moves to popover content | `:focus-visible` | None | Auto | Auto (to invoker on Esc) |
| Tabs `role="tablist"` | Roving tabindex | `:focus-visible` on active tab | None | n/a | n/a |
| Listbox standalone | Roving tabindex | `:focus-visible` on highlighted | None | n/a | n/a |
| Combobox + listbox popup | DOM focus on `<input>`; `aria-activedescendant` | `:focus-visible` on input; attribute-selector highlight on option | None | Esc closes popup; second Esc clears input | Focus stays on input |
| Menubar | Roving tabindex | `:focus-visible` | None | Esc closes submenu | Restore to trigger when menu closes |
| Toolbar | Roving tabindex | `:focus-visible` | None | n/a | n/a |
| Tree | Roving tabindex | `:focus-visible` | None | n/a | n/a |
| Grid | Roving tabindex on cells | `:focus-visible` on cell | None | n/a | n/a |
| Off-screen carousel slide | n/a | n/a | `inert` on inactive slides | n/a | Restore to controls on slide change |
| Side drawer / off-canvas nav | Drawer focusable | `:focus-visible` inside | `inert` on `<main>` (and other peers) | Esc closes drawer | Restore to open-button |

## 10. Cross-References

- `[[frontend-a11y-aria-patterns]]` : full APG pattern table with role + state semantics
- `[[frontend-a11y-motion-contrast-wcag22]]` : WCAG 2.2 SCs : 2.4.7 Focus Visible, 1.4.11 Non-Text Contrast, 2.4.11 Focus Not Obscured
- `[[frontend-impl-popover-dialog-anchor]]` : Popover API, `closedby="any"` light-dismiss, anchor positioning
- `[[frontend-syntax-html5-semantic]]` : native interactive elements
