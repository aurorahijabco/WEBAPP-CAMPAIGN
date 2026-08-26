# References : Popover, Dialog, Anchor Anti-Patterns

Seven common failure modes with symptom, root cause, fix, source.

## Anti-Pattern 1 : `tabindex` on `<dialog>`

### Symptom
Focus model breaks. Screen-reader traversal becomes erratic. Author added `tabindex="0"` or `tabindex="-1"` to `<dialog>` to "make focus work" and broke it.

### Root cause
Per [MDN : dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19) : "Do not add the tabindex property to the `<dialog>` element as it is not interactive and does not receive focus. The dialog's contents, including the close button contained in the dialog, can receive focus and be interactive." The dialog is a container; focus belongs on its interactive descendants.

```html
<!-- WRONG -->
<dialog tabindex="-1">...</dialog>
```

### Fix
Remove the `tabindex`. Use `autofocus` on the appropriate descendant for initial focus.

```html
<!-- CORRECT -->
<dialog>
  <form method="dialog">
    <button value="cancel" autofocus>Cancel</button>
    <button value="confirm">Confirm</button>
  </form>
</dialog>
```

### Source
[MDN : dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19), explicit tabindex warning.

## Anti-Pattern 2 : Combining `popover` attribute with `dialog.showModal()`

### Symptom
Cross-API state is undefined. Focus management mixes both contracts. Light dismiss may or may not work. Browser behavior diverges.

### Root cause
Popovers are non-modal by spec. `<dialog>.showModal()` is modal. Combining the two on one element creates contradictory contracts : Popover API expects light dismiss; modal dialog expects backdrop interception and inert background.

```html
<!-- WRONG : undefined behavior -->
<dialog id="thing" popover="auto">...</dialog>
<script>
  document.getElementById('thing').showModal();
</script>
```

### Fix
Pick one model per surface :
- Modal : `<dialog>` + `showModal()`, no `popover` attribute.
- Non-modal : Popover API on a `<div>` or other element, no `showModal()`.

### Source
[MDN : Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (verified 2026-05-19) : popovers are always non-modal.

## Anti-Pattern 3 : Custom click-outside JS for an `auto` popover

### Symptom
Custom `mousedown` / `click` handler intercepts outside-clicks to close the popover. Focus restoration breaks. Multiple-popover stacking breaks. Code duplicates what the browser ships natively.

### Root cause
`popover="auto"` and `popover="hint"` ship light dismiss + Esc + automatic focus restoration. Authors who roll their own usually miss : (a) focus restoration to the previously-focused element; (b) the popover-stack hide-until algorithm for nested popovers; (c) edge cases with iframe / shadow-DOM boundaries.

```js
// WRONG : duplicates built-in light-dismiss
document.addEventListener('mousedown', (e) => {
  if (!menu.contains(e.target)) menu.hidePopover();
});
```

### Fix
Use `popover="auto"`. The built-in light-dismiss handles all paths.

```html
<!-- CORRECT -->
<div id="menu" popover="auto">...</div>
```

### Source
[MDN : Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (verified 2026-05-19), [WHATWG HTML : popover](https://html.spec.whatwg.org/multipage/popover.html) (verified 2026-05-19).

## Anti-Pattern 4 : Anchor positioning without `@supports` gate

### Symptom
Popovers / tooltips appear at the top-left of the viewport on Safari (and Firefox in 2025). The site looks broken on browsers older than 2025-2026.

### Root cause
Per [MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) (verified 2026-05-19), the core (`anchor-name`, `position-anchor`, `anchor()`) shipped in Chromium 2024 and is still rolling out across other engines through 2025/2026. `position-area` and `position-try-fallbacks` are Baseline Newly Available since January 2026.

```css
/* WRONG : silently breaks on non-supporting browsers */
#menu-btn { anchor-name: --menu; }
#menu {
  position-anchor: --menu;
  position-area: bottom span-inline-end;
}
```

### Fix
Gate behind `@supports (anchor-name: --x) { ... }` and provide a JS fallback for non-supporting browsers (or accept the degraded fallback positioning).

```css
/* CORRECT */
@supports (anchor-name: --x) {
  #menu-btn { anchor-name: --menu; }
  #menu {
    position-anchor: --menu;
    position-area: bottom span-inline-end;
  }
}
```

```js
if (!CSS.supports('anchor-name: --x')) {
  // JS fallback using getBoundingClientRect + scroll/resize listeners
}
```

### Source
[MDN : position-try-fallbacks](https://developer.mozilla.org/en-US/docs/Web/CSS/position-try-fallbacks) (verified 2026-05-19), [MDN : position-area](https://developer.mozilla.org/en-US/docs/Web/CSS/position-area) (verified 2026-05-19).

## Anti-Pattern 5 : Missing `@starting-style` for entry animation

### Symptom
Popover or dialog appears instantly at full opacity / final transform. The transition is declared but the entry animation never plays.

### Root cause
Per [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19) : "CSS transitions are by default not triggered on an element's initial style update." Without `@starting-style`, the browser has no "from" state for the first transition on the element : the property switch happens before the transition begins, so the element appears at the open value from frame one.

```css
/* WRONG : no @starting-style. Entry animation never plays. */
[popover] {
  opacity: 0;
  transition: opacity 0.3s, display 0.3s allow-discrete;
}
[popover]:popover-open { opacity: 1; }
```

### Fix
Declare `@starting-style` AFTER the open-state rule with the entry-start values.

```css
/* CORRECT */
[popover] {
  opacity: 0;
  transition: opacity 0.3s, display 0.3s allow-discrete;
}
[popover]:popover-open { opacity: 1; }

@starting-style {
  [popover]:popover-open { opacity: 0; }
}
```

### Source
[MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19).

## Anti-Pattern 6 : Missing `allow-discrete` for `display` (exit cut off)

### Symptom
Open animation plays, but the close animation cuts off. The popover / dialog disappears instantly on `.hidePopover()` or `.close()` instead of fading out.

### Root cause
Per [MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (verified 2026-05-19), `display` is a discrete property. Without `transition-behavior: allow-discrete` (or the `display ... allow-discrete` shorthand), the property flips from `block` to `none` instantly, ending the visible lifetime of the element before the transition completes.

```css
/* WRONG : exit cuts off */
[popover] {
  opacity: 0;
  transition: opacity 0.3s;
}
```

### Fix
Add `display 0.3s allow-discrete` to the transition list. For top-layer elements, also add `overlay 0.3s allow-discrete` to defer top-layer removal.

```css
/* CORRECT */
[popover] {
  opacity: 0;
  transition:
    opacity 0.3s,
    display 0.3s allow-discrete,
    overlay 0.3s allow-discrete;
}
```

### Source
[MDN : transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) (verified 2026-05-19), [MDN : overlay](https://developer.mozilla.org/en-US/docs/Web/CSS/overlay) (verified 2026-05-19).

## Anti-Pattern 7 : `@starting-style` placed BEFORE the open-state rule

### Symptom
Animation declared correctly, transition list correct, `@starting-style` block correct, but entry animation still never plays. Order looks right at a glance.

### Root cause
Per [MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19) : "The `@starting-style` at-rule and the 'original rule' have the same specificity. To ensure starting styles get applied, include the `@starting-style` at-rule AFTER the 'original rule'." Source order decides at equal specificity. If `@starting-style` is declared first, the open-state rule comes later and wins.

```css
/* WRONG : @starting-style before its target */
@starting-style {
  [popover]:popover-open { opacity: 0; }
}

[popover]:popover-open { opacity: 1; }
[popover] { transition: opacity 0.3s, display 0.3s allow-discrete; }
```

### Fix
Move `@starting-style` AFTER the open-state rule, OR nest it inside.

```css
/* CORRECT */
[popover] { transition: opacity 0.3s, display 0.3s allow-discrete; }
[popover]:popover-open { opacity: 1; }

@starting-style {
  [popover]:popover-open { opacity: 0; }
}
```

Or :

```css
[popover]:popover-open {
  opacity: 1;
  @starting-style { opacity: 0; }
}
```

### Source
[MDN : @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) (verified 2026-05-19), specificity / source-order rule.

## Anti-Pattern 8 (bonus) : Manual focus restoration for popovers

### Symptom
Focus bounces twice after closing a popover. Screen reader announces the trigger twice. Subtle test failures in focus-related tests.

### Root cause
The Popover API restores focus automatically on light-dismiss, Esc-close, and explicit `popovertargetaction="hide"`. Authors who copy the manual capture-and-restore pattern from `<dialog>` cause a double-restore : the browser restores focus, then the author's script restores it again.

```js
// WRONG : duplicates spec-mandated focus restoration
let trigger = null;
btn.addEventListener('click', () => { trigger = document.activeElement; });
popover.addEventListener('toggle', (e) => {
  if (e.newState === 'closed') trigger?.focus();
});
```

### Fix
For popovers, do nothing. The spec restores focus automatically. The manual pattern applies only to `<dialog>`.

### Source
[WHATWG HTML : popover](https://html.spec.whatwg.org/multipage/popover.html) (verified 2026-05-19), focus-previousElement step. [MDN : Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (verified 2026-05-19).
