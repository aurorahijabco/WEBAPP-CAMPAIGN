# References : Anti-patterns

Nine anti-patterns observed in real modal and toast implementations, with symptom, root cause, and fix. All verified 2026-05-19.

## 1. Custom JS focus trap for a modal

**Symptom** : Tab key can escape the modal to background content. Pressing Tab on the last focusable element jumps to the URL bar or a behind-modal link. Maintenance burden of a hand-rolled focus-trap library grows over time.

**Root cause** : a custom JS focus trap was implemented before `<dialog>.showModal()` was Baseline. The library may handle Tab cycling but miss edge cases (iframes, custom elements, shadow DOM, dynamically-inserted focusable elements).

**Fix** : use `<dialog>` with `showModal()`. The browser provides focus trap, Escape-close, auto-inert of background, and top-layer placement for free.

```html
<dialog id="modal" aria-labelledby="t">
  <h2 id="t">Title</h2>
  <button autofocus>OK</button>
</dialog>

<script>
  document.querySelector("#modal").showModal();
</script>
```

Source : [MDN : `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19).

## 2. `body { overflow: hidden }` for modal scroll lock

**Symptom** : when a custom modal opens, the page reflows because `body { overflow: hidden }` was added. Scroll position jumps. The page is sometimes still scrollable on iOS because Safari does not respect body overflow lock.

**Root cause** : the team built a custom modal (a positioned overlay div) and tried to prevent background scroll with a JS toggle on `body`. `<dialog>.showModal()` was not used, so the auto-inert behavior is missing.

**Fix** : use `<dialog>.showModal()`. The browser automatically applies `inert` to the rest of the document so background content is non-interactive AND background scroll is blocked, with no JS body-class toggling.

```js
// Wrong
function openModal() {
  document.body.style.overflow = "hidden";
  customOverlay.style.display = "block";
}

// Right
function openModal() {
  document.querySelector("dialog").showModal();
}
```

## 3. Missing focus restoration on modal close

**Symptom** : after closing a modal, keyboard focus moves to the start of the page or the body element. The user loses their place in the page and must Tab through everything to return.

**Root cause** : the `<dialog>` element does NOT automatically restore focus to the trigger on close. The browser only restores focus when popovers close (and even then only for keyboard-driven dismissal).

**Fix** : capture the triggering element BEFORE opening, restore focus on the `close` event.

```js
let trigger = null;

document.querySelector("[data-open]").addEventListener("click", (e) => {
  trigger = e.currentTarget;
  document.querySelector("#modal").showModal();
});

document.querySelector("#modal").addEventListener("close", () => {
  trigger?.focus();
  trigger = null;
});
```

## 4. `role="alert"` for periodic background updates

**Symptom** : screen-reader users report being repeatedly interrupted by "Inbox refreshed", "Stock price updated", "Weather refreshed" announcements. They cannot focus on reading the page.

**Root cause** : `role="alert"` is for time-critical errors and warnings, not periodic status. The role implies `aria-live="assertive"` which interrupts the current utterance.

**Fix** : use `aria-live="polite"` (or `role="status"`) for periodic updates. The screen reader announces at the next pause without interrupting.

```html
<!-- Wrong -->
<div role="alert">Inbox refreshed.</div>

<!-- Right -->
<div role="status">Inbox refreshed.</div>
<!-- or -->
<div aria-live="polite">Inbox refreshed.</div>
```

Source : [W3C WAI APG : Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) (verified 2026-05-19).

## 5. `popover="auto"` for stacked toasts

**Symptom** : showing a second toast hides the first. The toast stack never grows past one visible item even when three were enqueued in the same tick.

**Root cause** : `popover="auto"` enforces top-layer mutual exclusivity. Opening one auto popover closes any other auto popover. Toasts must coexist, so `auto` is wrong.

**Fix** : use `popover="manual"` for toasts. Manual popovers can coexist in the top layer. The trade-off : no automatic light-dismiss, so the implementation owns the close logic.

```js
// Wrong
toast.setAttribute("popover", "auto");
toast.showPopover();
// Next toast silently closes this one

// Right
toast.setAttribute("popover", "manual");
toast.showPopover();
// Multiple manual popovers coexist
```

Source : [MDN : Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) (verified 2026-05-19).

## 6. `aria-live` region created together with the message

**Symptom** : screen readers do not announce the first toast. Subsequent toasts announce normally if the region is reused.

**Root cause** : screen readers must observe mutations on a live region they have ALREADY registered. Inserting both the region wrapper and its contents in the same DOM mutation does not register the region in time.

**Fix** : create the live region wrapper at page startup with empty content ; insert messages by mutating the existing region.

```html
<!-- Right : wrapper exists at page load -->
<div id="toast-region" aria-live="polite"></div>
```

```js
// Right : mutate the existing wrapper
document.querySelector("#toast-region").append(toastEl);

// Wrong : create wrapper + content in one shot
const wrapper = document.createElement("div");
wrapper.setAttribute("aria-live", "polite");
wrapper.append(toastEl);
document.body.append(wrapper);  // screen reader missed it
```

Source : [MDN : ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/aria-live_region_role) (verified 2026-05-19).

## 7. Stacking toasts with `z-index` instead of the top layer

**Symptom** : a toast is hidden by a `position: fixed` header. Adjusting z-index fixes one case but breaks another. The toast container needs a higher z-index than every other floating element on the page, requiring constant tuning.

**Root cause** : the toast was implemented as a regular `position: fixed` div with a hand-picked z-index. The top layer (used by `<dialog>.showModal()` and the Popover API) sits ABOVE all author z-index values automatically.

**Fix** : promote toasts into the top layer via `popover="manual"` + `showPopover()`. No more z-index arms race.

```html
<!-- Right : top layer, no z-index needed -->
<div class="toast" popover="manual">Saved.</div>

<script>
  document.querySelector(".toast").showPopover();
</script>
```

## 8. `aria-live="assertive"` for a routine success message

**Symptom** : "Saved" interrupts the user's current screen-reader sentence mid-word every time they save. Power users disable the live region or stop using the feature.

**Root cause** : assertive priority is for time-critical updates only. A confirmation that the user expected ("they pressed Save and the system saved") does not warrant interrupting speech.

**Fix** : use `aria-live="polite"` or `role="status"` for success / status. Reserve `aria-live="assertive"` and `role="alert"` for errors and security warnings.

```html
<!-- Wrong -->
<div aria-live="assertive">Saved.</div>

<!-- Right -->
<div role="status">Saved.</div>
```

## 9. `tabindex` on `<dialog>`

**Symptom** : focus behavior inside the dialog is unpredictable. Tab order skips elements or focuses the dialog wrapper itself.

**Root cause** : MDN explicitly forbids setting `tabindex` on `<dialog>`. The dialog element manages its own tabindex and accessibility-tree position based on the `open` state and the `showModal()` call.

**Fix** : remove the `tabindex` attribute. Use `autofocus` on the desired initial-focus child instead.

```html
<!-- Wrong -->
<dialog tabindex="-1">
  <button>OK</button>
</dialog>

<!-- Right -->
<dialog>
  <button autofocus>OK</button>
</dialog>
```

Source : [MDN : `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19).
