# Anti-Patterns Reference : frontend-syntax-html5-form

Seven anti-patterns specific to HTML form authoring in 2026. Each follows the symptom / root cause / fix structure. ALWAYS check a form against this list before shipping.

## Anti-pattern 1 : `:invalid` styling visible on first paint

**Symptom.** Every empty `required` field renders with a red border the moment the page loads, before the user has interacted with anything. The form reads as "you have already made mistakes". Users abandon at higher rates.

**Root cause.** The CSS uses bare `:invalid` for error styling. The `:invalid` pseudo-class matches IMMEDIATELY when the value violates a constraint, including the very-common "required field is empty" condition that exists from page load.

**Fix.** ALWAYS use `:user-invalid` (Baseline Widely Available since November 2023 per [MDN : :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) (verified 2026-05-19)) for visible error styling. The complementary `:user-valid` matches once the field becomes valid AFTER interaction.

```css
input:user-invalid {
  border-color: oklch(55% 0.20 25);
}
input:user-valid {
  border-color: oklch(60% 0.15 145);
}
```

`:user-invalid` matches only after the user has typed invalid input, blurred an empty required field, or attempted submit. It produces the UX the user expects : do not yell about empty fields before the user has touched them.

## Anti-pattern 2 : `autocomplete="off"` on password fields

**Symptom.** Password managers cannot save or fill credentials. Users either disable the manager (bad) or pick weaker passwords they can remember (worse). Browsers may also ignore the directive, so the only achieved outcome is degraded UX with no security gain.

**Root cause.** Stale lore from the 2000s that "autocomplete=off makes the field more secure". The opposite is true in modern threat models : encouraging unique strong passwords stored in a manager is more important than blocking autofill. Per [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19) SC 1.3.5, identifying input purpose is a level-AA accessibility requirement for personal-data fields ; setting `autocomplete="off"` on password fields fails that.

**Fix.** ALWAYS use the correct detail token :

```html
<!-- Login form -->
<input type="password" autocomplete="current-password" required>

<!-- Registration or change-password form -->
<input type="password" autocomplete="new-password" minlength="12" required>
```

Per [MDN : autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete) (verified 2026-05-19), `current-password` is what login fields expose to password managers; `new-password` triggers the strong-password generator in modern browsers.

## Anti-pattern 3 : `HTMLFormElement.submit()` to submit programmatically

**Symptom.** The form submits invalid data. The `submit` event listener never fires. A `formdata` listener that injects a CSRF token is silently skipped. Server-side validation rejects the submission and the user gets a generic error with no context.

**Root cause.** Code reaches for `form.submit()` to submit from JavaScript, unaware that it bypasses constraint validation AND skips the `submit` and `formdata` events. Per [WHATWG HTML : form submission](https://html.spec.whatwg.org/multipage/forms.html) (verified 2026-05-19), `submit()` performs an "internal submission" that omits the form lifecycle entirely.

**Fix.** ALWAYS use `form.requestSubmit(submitter?)` :

```javascript
form.requestSubmit(form.querySelector('button[type="submit"]'));
```

Per WHATWG HTML, `requestSubmit(submitter)` behaves identically to a real user click on the submitter button : it runs validation, fires `submit`, fires `formdata`, and respects the submitter's `formaction` / `formenctype` / `formmethod` / `formnovalidate` / `formtarget` overrides. If validation truly must be skipped (rare, e.g. a saved-draft endpoint), set `novalidate` on the form or `formnovalidate` on the submit button ; NEVER reach for `submit()`.

## Anti-pattern 4 : Missing `autocomplete` on autofillable fields

**Symptom.** Browser autofill is unreliable, fills the wrong field, or skips the form entirely. Mobile users have to type their address by hand. Repeat customers do not see their saved data populated.

**Root cause.** The author omitted `autocomplete` from fields that collect address, contact, payment, or identity data. The browser cannot infer the purpose with confidence and gives up.

**Fix.** ALWAYS set the correct `autocomplete` token on every autofillable field. The complete inventory is in `methods.md`. The common ones :

- `name` / `given-name` / `family-name`
- `email`
- `tel`
- `street-address` / `address-line1` / `address-line2` / `address-level1` / `address-level2` / `country` / `postal-code`
- `cc-name` / `cc-number` / `cc-exp` / `cc-csc`
- `bday`
- `username` / `current-password` / `new-password` / `one-time-code`
- `organization`

Per [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19) SC 1.3.5, this is a level-AA accessibility requirement for personal-data fields, not merely a usability optimization.

## Anti-pattern 5 : Customizable `<select>` without standard fallback

**Symptom.** The dropdown renders correctly in Chromium but silently breaks in Firefox or WebKit : either the styling is missing (mild) or the picker structure breaks the markup (severe). Users on non-Chromium browsers see broken dropdowns or no dropdown at all.

**Root cause.** The author opted into `appearance: base-select` unconditionally, then added `<button>` and `<selectedcontent>` children that the standard `<select>` does not know what to do with. Per [Open UI : Customizable Select](https://open-ui.org/components/customizableselect/) (verified 2026-05-19) and [MDN : appearance](https://developer.mozilla.org/en-US/docs/Web/CSS/appearance) (verified 2026-05-19), `appearance: base-select` is Chromium-only Limited Availability at 2026-05-19 ; Firefox and WebKit ignore the directive.

**Fix.** ALWAYS treat `base-select` as progressive enhancement. Gate the opt-in behind `@supports` AND author the markup so the standard `<select>` works without it. Browsers that do not understand `<selectedcontent>` and `<button>` children of `<select>` will ignore them (per HTML's permissive parsing) and render the `<option>` set with default styling.

```css
@supports (appearance: base-select) {
  select, ::picker(select) { appearance: base-select; }
}
```

ALWAYS write `<selectedcontent>` (not the historical `<selectedoption>`). NEVER ship `appearance: base` without checking it ; the generalized form is specified but NOT yet implemented in any browser at 2026-05-19.

## Anti-pattern 6 : `ElementInternals.setValidity` without `aria-errormessage`

**Symptom.** A form-associated custom element refuses to submit because constraint validation fires correctly, but screen-reader users have no idea why. The native browser bubble shows the message, but assistive tech does not receive it because the host element does not declare `aria-invalid` or reference an error message.

**Root cause.** The author called `internals.setValidity({ valueMissing: true }, "Pick a rating")` and assumed ElementInternals would also handle the ARIA plumbing. It does not. Per [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) (verified 2026-05-19), `setValidity` controls the validity state, focus anchor, and the native bubble message, but does NOT set `aria-invalid` or `aria-errormessage` on the host.

**Fix.** ALWAYS pair `setValidity` calls with manual ARIA bookkeeping :

```javascript
#syncValidity() {
  if (this.hasAttribute("required") && !this.#value) {
    this.#internals.setValidity({ valueMissing: true }, "Pick a rating", this);
    this.setAttribute("aria-invalid", "true");
    if (this.#errorId) this.setAttribute("aria-errormessage", this.#errorId);
  } else {
    this.#internals.setValidity({});
    this.removeAttribute("aria-invalid");
    this.removeAttribute("aria-errormessage");
  }
}
```

The referenced error-message element MUST exist in the DOM and MUST be visible while `aria-invalid="true"`. The combination of `aria-invalid` + `aria-errormessage` is what screen readers announce on focus into an invalid control.

## Anti-pattern 7 : Custom error overlay without `setCustomValidity`

**Symptom.** A custom JS validator paints a red error bubble next to a field. The user fixes the input, the bubble goes away. The user submits the form. The form submits anyway because `validity.valid` is still `true` according to the browser : the custom overlay was decoration only.

**Root cause.** The author built the error UI separately from the Constraint Validation API. The browser's validity state is unaware of the domain rule, so `form.checkValidity()` returns true and `requestSubmit()` proceeds.

**Fix.** ALWAYS reflect domain-specific rules into Constraint Validation via `setCustomValidity(message)` (native) or `internals.setValidity(flags, message)` (form-associated custom element). The browser then knows the field is invalid, the form will not submit until cleared, and assistive tech announces the message via the standard mechanism.

```javascript
function validateUsername() {
  if (input.value.includes(" ")) {
    input.setCustomValidity("Username MUST NOT contain spaces");
  } else {
    input.setCustomValidity("");  // clear when valid
  }
}
input.addEventListener("input", validateUsername);
```

NEVER paint error UI without also updating the validity state. ALWAYS clear the custom message with `setCustomValidity("")` when the value becomes valid ; a stale custom message overrides every other flag.

## Sources (verified 2026-05-19)

- [MDN : `<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)
- [MDN : autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
- [MDN : Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [MDN : :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid)
- [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [MDN : appearance](https://developer.mozilla.org/en-US/docs/Web/CSS/appearance)
- [WHATWG HTML : forms](https://html.spec.whatwg.org/multipage/forms.html)
- [Open UI : Customizable Select](https://open-ui.org/components/customizableselect/)
- [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/)
