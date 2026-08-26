# References : Focus, Keyboard, Inert Anti-Patterns

Eight common failure modes with symptom, root cause, fix, WCAG / spec citation.

## Anti-Pattern 1 : `:focus { outline: none }` without `:focus-visible` replacement

### Symptom
Keyboard users see NO visible focus indicator anywhere on the page. Tabbing through reveals nothing about where focus is. Screen-reader users may still hear announcements but cannot orient by mouse.

### Root cause
The author removed `outline` to "clean up" the default browser focus ring on mouse-clicked buttons but did not provide a `:focus-visible` replacement. The UA heuristic that hides the focus ring on mouse click stops working : `:focus` always matches keyboard focus too, and the removed outline applies in all cases.

```css
/* WRONG : invisible focus for keyboard users */
button:focus { outline: none; }
```

### Fix
Use `:focus-visible` for keyboard-only focus indicators. Either delete the `:focus` rule entirely (UA default is fine), or provide an explicit replacement that meets WCAG 1.4.11 Non-Text Contrast at 3:1.

```css
/* CORRECT */
button:focus-visible {
  outline: 2px solid var(--focus, #2563eb);
  outline-offset: 2px;
}
```

### Source
[MDN : :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) (verified 2026-05-19) and WCAG 2.4.7 Focus Visible (Level AA), WCAG 1.4.11 Non-Text Contrast (Level AA).

## Anti-Pattern 2 : positive `tabindex`

### Symptom
Tab order on the page is unpredictable. The audit reports "focus order does not match visual order" (WCAG 2.4.3). When new components are added, tab order shifts unexpectedly across the whole page.

### Root cause
Per [MDN : tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) (verified 2026-05-19) : "positive-integer items tabbed first in numeric order, then default elements in DOM order." A single positive `tabindex` infects every other interactive element on the page : they now tab AFTER the positive-tabindexed elements. Source-order modifications no longer affect tab order in the expected way.

```html
<!-- WRONG : breaks tab order globally -->
<button tabindex="2">Submit</button>
<input tabindex="1" type="text">
```

### Fix
Use only `0` and `-1`. Re-arrange DOM if reading / focus order must change.

```html
<!-- CORRECT : DOM order = tab order -->
<input type="text">
<button>Submit</button>
```

### Source
[MDN : tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) (verified 2026-05-19) : "Avoid using tabindex values greater than 0." WCAG 2.4.3 Focus Order (Level A).

## Anti-Pattern 3 : `aria-hidden="true"` on background instead of `inert`

### Symptom
Screen readers say nothing useful when the user is in a modal, but keyboard Tab still lands on hidden background elements. The keyboard user gets stuck on an element that produces no AT output, with no visual feedback explaining the silence.

### Root cause
`aria-hidden="true"` hides the subtree from assistive technologies but does NOT prevent keyboard focus, click events, find-in-page, or text selection. Per [MDN : inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) (verified 2026-05-19), only `inert` does all six.

```html
<!-- WRONG : keyboard still tabs in -->
<main aria-hidden="true">...background while modal open...</main>
```

### Fix
Use `inert` on the background subtree (or use `<dialog>.showModal()`, which applies inertness automatically). NEVER `aria-hidden` on focusable content.

```html
<!-- CORRECT : six effects engage simultaneously -->
<main inert>...background while overlay open...</main>
```

### Source
[MDN : inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) (verified 2026-05-19). [W3C WAI APG : Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (verified 2026-05-19).

## Anti-Pattern 4 : `pointer-events: none` as substitute for `inert`

### Symptom
Modal background appears "disabled" (no mouse clicks land), but keyboard Tab still cycles through it. Screen reader still announces background elements. Find-in-page still matches inside the background.

### Root cause
`pointer-events: none` is a CSS paint-level filter. It blocks ONLY pointer events (mouse, touch, pen). Keyboard focus, AT exposure, find-in-page, and text selection are unaffected. It is not an interaction model.

```css
/* WRONG : keyboard and AT still see the background */
.dialog-open .background { pointer-events: none; }
```

### Fix
Use `inert` (for containers) or `disabled` (for form controls).

```html
<!-- CORRECT -->
<main inert>...</main>
```

### Source
[MDN : inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert) (verified 2026-05-19), section "inert vs alternative approaches."

## Anti-Pattern 5 : Not restoring focus to trigger on dialog close

### Symptom
After closing a modal, keyboard focus jumps to `<body>` (or the top of the document). Screen reader announces nothing useful. The user loses their place and must re-navigate to where they were.

### Root cause
`<dialog>.showModal()` does NOT auto-restore focus on close. Only the Popover API does this automatically. Authors must capture `document.activeElement` BEFORE opening the dialog and call `triggerElement.focus()` on the `close` event.

```js
// WRONG : focus never restored
dialog.showModal();
dialog.addEventListener('close', () => { /* nothing */ });
```

### Fix
Capture on open, restore on close. Use the `close` event because it fires for ALL dismissal paths (button submit, Esc, light-dismiss, programmatic `close()`).

```js
// CORRECT
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

### Source
[W3C WAI APG : Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (verified 2026-05-19) : "focus returns to the element that invoked the dialog." [MDN : Popover API : Using](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using) (verified 2026-05-19) confirms Popover does it automatically.

## Anti-Pattern 6 : Focus trap that prevents Escape

### Symptom
User cannot close the modal with Esc. The focus-trap implementation intercepts Esc and prevents propagation, or worse, calls `e.preventDefault()` on it.

### Root cause
A custom focus-trap was written before `<dialog>.showModal()` was Baseline. The trap was meant to keep Tab and Shift+Tab inside the modal, but the author also captured Esc and either swallowed it or ignored its semantic.

```js
// WRONG : swallows Esc
dialog.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' || e.key === 'Escape') e.preventDefault();
});
```

### Fix
Per [W3C WAI APG : Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (verified 2026-05-19) : "Escape : Closes the dialog." The trap is for Tab cycling only. Better, use `<dialog>.showModal()` which provides browser-native Tab cycling AND Esc-close.

```js
// CORRECT : handle Tab cycling only; let Esc close
dialog.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return; // do NOT intercept Esc
  // ... Tab cycling logic ...
});
```

### Source
[W3C WAI APG : Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (verified 2026-05-19).

## Anti-Pattern 7 : Roving tabindex without `element.focus()`

### Symptom
User presses an arrow key inside a tablist; the `tabindex="0"` attribute moves to the next tab in the markup, but the focus ring stays on the previous tab. Screen reader does not announce the new active tab.

### Root cause
Moving the `tabindex="0"` attribute does NOT move DOM focus. Focus is a runtime concept; the attribute only controls eligibility. The author must explicitly call `element.focus()` on the new active item after updating attributes.

```js
// WRONG : attribute moves, focus does not
tabs[current].setAttribute('tabindex', '-1');
tabs[next].setAttribute('tabindex', '0');
// missing : tabs[next].focus();
```

### Fix
Always call `.focus()` after updating attributes.

```js
// CORRECT
tabs[current].setAttribute('tabindex', '-1');
tabs[next].setAttribute('tabindex', '0');
tabs[next].focus();
```

### Source
[W3C WAI APG : Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) (verified 2026-05-19) : the roving-tabindex procedure explicitly includes the `focus()` step.

## Anti-Pattern 8 : `<div role="button" tabindex="0">` instead of `<button>`

### Symptom
The element looks like a button, focuses on Tab, but does NOT activate on Space or Enter. Does NOT submit a parent form. Does NOT have `:disabled` styles. Screen readers may announce it inconsistently. The author re-implements click handlers, keyboard handlers, ARIA states, and disabled semantics.

### Root cause
`tabindex="0"` makes a `<div>` focusable but adds NOTHING else. The implicit semantics of `<button>` (Space / Enter activation, form submission via `type="submit"`, disabled state, keyboard accessibility, AT announcements) are missing. Every feature must be re-implemented and tested across screen readers.

```html
<!-- WRONG : 6-piece reimplementation needed -->
<div role="button" tabindex="0" onclick="...">Submit</div>
```

### Fix
Use the native element.

```html
<!-- CORRECT -->
<button type="submit">Submit</button>
```

### Source
[MDN : tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) (verified 2026-05-19) : "Interactive components authored using non-interactive elements are not listed in the accessibility tree... The content should be semantically described using interactive elements (`<a>`, `<button>`, `<details>`, `<input>`, `<select>`, `<textarea>`, etc.) instead."
