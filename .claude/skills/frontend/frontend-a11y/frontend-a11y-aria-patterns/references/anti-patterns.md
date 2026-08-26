# Anti-Patterns : ARIA + APG

Each entry : symptom (what the user or developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [W3C: WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) (verified 2026-05-19), [W3C: ARIA in HTML](https://www.w3.org/TR/html-aria/) (verified 2026-05-19), [W3C WAI: APG patterns](https://www.w3.org/WAI/ARIA/apg/) (verified 2026-05-19).

## Anti-pattern 1 : `<div role="button" onclick="...">` instead of `<button>`

Symptom : keyboard users cannot activate the control; Tab skips it; pressing Space scrolls the page instead of activating; no default `:focus-visible` outline; the control does not submit forms or behave as type=submit / type=reset.

Root cause : ARIA `role` adds the semantic role for AT only. It does NOT add `tabindex`, does NOT add keyboard activation handlers, does NOT make `disabled` work, does NOT integrate with form submission, does NOT add the `:focus-visible` UA heuristic for keyboard activation. All of those come from the `<button>` element.

Fix : use `<button type="button">` (or `type="submit"` in a form). Style with CSS; the appearance is fully controllable. ARIA fixes never replace native semantics.

## Anti-pattern 2 : `aria-label` on an element that already has visible text

Symptom : screen reader announces text DIFFERENT from what the eye sees. When developers update one and not the other, sighted users and AT users diverge in what they perceive the control says.

Root cause : per [W3C: WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) (verified 2026-05-19) name-computation rules, `aria-label` overrides the element's text content. The visible text becomes invisible to AT.

Fix :

- Visible text exists -> use `aria-labelledby="<id-of-text>"`, NEVER `aria-label`. The accessible name then equals the visible text by reference.
- No visible text (icon-only button) -> use `aria-label`.

This is a WCAG 2.5.3 ("Label in Name") risk : voice-control users must be able to say what they see.

## Anti-pattern 3 : Redundant role (`<nav role="navigation">`, `<button role="button">`)

Symptom : no functional bug, but bloat, lint warnings, and a signal in code review that the author is not yet thinking in implicit roles. Future maintainers may believe the role is load-bearing and resist removing it.

Root cause : copy-paste from outdated tutorials that pre-date HTML5 landmark elements.

Fix : remove the role. Per [W3C: ARIA in HTML](https://www.w3.org/TR/html-aria/) (verified 2026-05-19), the elements `<nav>`, `<button>`, `<main>`, `<header>` (top-level), `<footer>` (top-level), `<aside>`, `<article>`, `<h1>`-`<h6>`, `<dialog>`, `<details>`, `<form>` (with accessible name) carry implicit roles. Adding the same role explicitly is redundant.

## Anti-pattern 4 : Live region inserted into the DOM at the moment of update

Symptom : `<div role="status">Saved</div>` is added to the DOM after the save completes. Most screen readers do NOT announce it.

Root cause : screen readers observe MUTATIONS to existing live regions. A region created with content already inside it is not seen as a mutation.

Fix : render an empty live region at page load. Update its `textContent` to announce.

```html
<div id="save-status" role="status" aria-live="polite" aria-atomic="true"></div>
<script>
  document.getElementById('save-status').textContent = 'Saved.';
</script>
```

## Anti-pattern 5 : `aria-hidden="true"` on background while a custom modal is open

Symptom : screen reader cannot see the background, but Tab still traverses background buttons and links. Users tab into elements they cannot read.

Root cause : `aria-hidden` hides from the accessibility tree but does NOT remove the subtree from sequential focus.

Fix : use the `inert` attribute on the background. `inert` removes focusability AND AT-visibility AND pointer interactivity. Native `<dialog>showModal()` applies the equivalent of `inert` automatically; a custom modal MUST set `inert` on the rest of the page manually.

## Anti-pattern 6 : Tabs with every tab `tabindex="0"`

Symptom : Tab key walks through every tab one at a time, then through every panel control, leading to dozens of tab stops before the first interactive panel control. Screen-reader users perceive a flat list, not a tablist.

Root cause : missing the roving-tabindex pattern.

Fix : per [APG: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (verified 2026-05-19), only the selected tab gets `tabindex="0"`; all others `tabindex="-1"`. Arrow keys move focus between tabs. Tab from a tab moves into the panel.

## Anti-pattern 7 : Combobox listbox popup moving DOM focus into the listbox

Symptom : as the user types and an option highlights, the input loses focus; further typing goes to the body or jumps unpredictably. Screen reader announces "out of input."

Root cause : `<input>` cannot have DOM focus AND a child option simultaneously be the "active" element when DOM focus moves away.

Fix : per [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19), DOM focus stays on the combobox input. The highlight uses `aria-activedescendant="<option-id>"`. This is REQUIRED for listbox / grid / tree popups; only dialog popups move DOM focus.

## Anti-pattern 8 : `role="menu"` on a navigation list of links

Symptom : Tab does not work between items; users must press arrow keys. Screen reader announces "menu" for what is clearly site navigation. Voice-control users say "navigation" and nothing is found.

Root cause : confusing two different patterns. `role="menu"` is for command lists (File, Edit, View in an application). Site or section navigation is `<nav><ul><li><a>`.

Fix : remove `role="menu"`, `role="menuitem"`, and any arrow-key navigation from navigation lists. `<nav>` carries the implicit `navigation` role; the `<a>` elements carry `link`; Tab moves between them by default.

## Anti-pattern 9 : `role="alert"` polled via `setInterval`

Symptom : screen reader interrupts the user every interval (e.g. every 10 seconds), reading the same status, even when nothing has changed. Users disable the screen reader or close the tab.

Root cause : `role="alert"` is implicit `aria-live="assertive"` and is intended for genuinely time-critical updates (session expiring, payment failed). Using it for polling status is hostile.

Fix : use `role="status"` (implicit `aria-live="polite"`) for periodic updates. Only mutate `textContent` when the underlying value has actually changed.

## Anti-pattern 10 : `aria-errormessage` declared without `aria-invalid="true"`

Symptom : the error message is visible on screen, but screen readers do not associate it with the input. Users who tab into the field hear only the label, not the error.

Root cause : per [W3C: WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) (verified 2026-05-19), `aria-errormessage` is announced ONLY when `aria-invalid` is `true` on the same element. Without `aria-invalid`, the errormessage is silently ignored.

Fix : when the field is invalid, set BOTH attributes :

```html
<input id="email" aria-invalid="true" aria-errormessage="email-error" aria-describedby="email-hint" />
<p id="email-hint">We will send your receipt here.</p>
<p id="email-error">Please enter a valid email address.</p>
```

Clear both when the field becomes valid.

## Anti-pattern 11 : Missing focus restore on dialog close

Symptom : the user opens a dialog with a button click, completes the dialog, the dialog closes, and focus jumps to `<body>`. Keyboard and screen-reader users lose their place in the page and must Tab from the top to continue.

Root cause : native `<dialog>showModal()` does NOT automatically restore focus to the trigger on close. Authors often assume it does.

Fix : capture the trigger element before opening, restore on close.

```js
let trigger = null;
openButton.addEventListener('click', () => {
  trigger = document.activeElement;
  dialog.showModal();
});
dialog.addEventListener('close', () => {
  if (trigger && document.contains(trigger)) trigger.focus();
});
```

WCAG 2.4.3 ("Focus Order") is the relevant SC; abrupt focus loss breaks logical order.

## Anti-pattern 12 : Auto-rotating carousel that does not pause on focus

Symptom : keyboard users focus a slide button, then the carousel auto-rotates and the focused button vanishes from the viewport. Focus jumps to body or wherever the rotation puts it. WCAG 2.2.2 ("Pause, Stop, Hide") failure.

Root cause : auto-rotation timer continues regardless of focus state.

Fix : per [APG: Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) (verified 2026-05-19), auto-rotation MUST pause on keyboard focus entering the carousel and MUST pause on pointer hover. After a focus pause, rotation MUST NOT auto-resume; only explicit user action on the Start/Stop button may resume it. The rotation control's accessible name MUST update dynamically between "Stop slide rotation" and "Start slide rotation"; do NOT use `aria-pressed`.
