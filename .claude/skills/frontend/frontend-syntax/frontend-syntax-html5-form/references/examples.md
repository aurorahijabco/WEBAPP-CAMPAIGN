# Examples Reference : frontend-syntax-html5-form

Code-only snippets demonstrating each canonical pattern. NO single renderable full-page fragment ; for a full document example consult `[[frontend-syntax-html5-semantic]]`.

## Example 1 : Accessible labeled input with autocomplete and inputmode

```html
<label for="email">Email</label>
<input
  id="email"
  name="email"
  type="email"
  autocomplete="email"
  inputmode="email"
  required
  aria-describedby="email-hint"
>
<p id="email-hint">We never share your address.</p>
```

ALWAYS use explicit `for`/`id` association. ALWAYS set both `type` and `autocomplete` ; the two are orthogonal. The `inputmode` is a mobile keyboard hint; for `type="email"` it is implicit, but stating it explicitly is harmless.

## Example 2 : Numeric ID with leading-zero preservation

```html
<label for="postal">Postal code</label>
<input
  id="postal"
  name="postal"
  type="text"
  inputmode="numeric"
  pattern="[0-9]{4,6}"
  autocomplete="postal-code"
  required
>
```

NEVER use `type="number"` for postal codes, OTP codes, SKU numbers, or any identifier where leading zeros matter. `type="number"` strips leading zeros, allows `e` exponent notation, and ships a spinner that is wrong on mobile.

## Example 3 : Password fields with correct autocomplete tokens

```html
<!-- Login form -->
<label for="login-password">Password</label>
<input
  id="login-password"
  name="password"
  type="password"
  autocomplete="current-password"
  required
>

<!-- Registration / change-password form -->
<label for="new-password">New password</label>
<input
  id="new-password"
  name="password"
  type="password"
  autocomplete="new-password"
  minlength="12"
  required
>
```

NEVER set `autocomplete="off"` on a password field. The `current-password` and `new-password` tokens are what password managers and browser autofill recognize. Per [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19) SC 1.3.5, this is also a level AA accessibility requirement.

## Example 4 : `:user-invalid` styling

```css
input:user-invalid {
  border-color: oklch(55% 0.20 25);
  outline-color: oklch(55% 0.20 25);
}

input:user-valid {
  border-color: oklch(60% 0.15 145);
}
```

`:user-invalid` (Baseline since November 2023 per [MDN : :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) (verified 2026-05-19)) matches only AFTER the user has interacted with the field or attempted submit. `:invalid` would match on first paint and show red borders on every empty `required` field, which reads as the user's fault before they typed.

## Example 5 : Custom validity with proper clear / set lifecycle

```html
<label for="username">Username</label>
<input id="username" name="username" type="text" required>
<p id="username-error" role="alert" hidden></p>

<script>
  const input = document.getElementById("username");
  const error = document.getElementById("username-error");

  function validate() {
    if (input.value.includes(" ")) {
      input.setCustomValidity("Username MUST NOT contain spaces");
    } else {
      input.setCustomValidity("");
    }
    error.textContent = input.validationMessage;
    error.hidden = input.validity.valid;
    input.setAttribute("aria-invalid", String(!input.validity.valid));
    if (!input.validity.valid) {
      input.setAttribute("aria-errormessage", "username-error");
    } else {
      input.removeAttribute("aria-errormessage");
    }
  }

  input.addEventListener("input", validate);
  input.addEventListener("blur", validate);
</script>
```

ALWAYS clear the custom error with `setCustomValidity("")` when the value becomes valid. NEVER leave a stale custom message; it overrides the default `validationMessage` even when other flags are false. ALWAYS pair `aria-invalid="true"` with `aria-errormessage` so screen readers announce the error message.

## Example 6 : Programmatic submit via `requestSubmit`

```javascript
const form = document.querySelector("form");
const submitButton = form.querySelector('button[type="submit"]');

// Run validation + fire submit + fire formdata
form.requestSubmit(submitButton);

// NEVER do this : skips validation, submit event, formdata event
// form.submit();
```

Per [WHATWG HTML : form submission](https://html.spec.whatwg.org/multipage/forms.html) (verified 2026-05-19), `requestSubmit(submitter)` behaves identically to a real click on the submitter button. `submit()` is an internal-only API that bypasses the form lifecycle and is almost always a bug when called from application code.

## Example 7 : Inject CSRF token via `formdata` listener

```javascript
const form = document.querySelector("form");

form.addEventListener("formdata", (event) => {
  const csrf = document.querySelector('meta[name="csrf-token"]').content;
  event.formData.append("_csrf", csrf);
});
```

The `formdata` event fires AFTER `submit` and ONLY when the form is actually submitted (not on `checkValidity()`). This is the canonical place to add CSRF tokens, computed fields, or to drop sensitive entries from the wire. Per [MDN : FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) (verified 2026-05-19), `event.formData` is a mutable instance.

## Example 8 : `FormData` to JSON for `fetch`

```javascript
async function submitJson(form, submitter) {
  if (!form.reportValidity()) return;

  const fd = new FormData(form, submitter);
  const json = Object.fromEntries(fd);

  await fetch(form.action, {
    method: form.method.toUpperCase(),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
}
```

`Object.fromEntries(formData)` produces a flat object; for multi-value fields (radio sets, checkbox groups, `<select multiple>`) iterate `formData.entries()` and group manually. For binary uploads, send the `FormData` directly as `body` ; the browser uses `multipart/form-data`.

## Example 9 : Customizable `<select>` with progressive enhancement

```html
<label for="country">Country</label>
<select id="country" name="country" autocomplete="country">
  <button type="button">
    <selectedcontent></selectedcontent>
  </button>
  <option value="" disabled selected>Choose...</option>
  <option value="NL">
    <img src="/flags/nl.svg" alt="" width="16" height="12">
    Netherlands
  </option>
  <option value="BE">
    <img src="/flags/be.svg" alt="" width="16" height="12">
    Belgium
  </option>
</select>

<style>
  @supports (appearance: base-select) {
    select, ::picker(select) {
      appearance: base-select;
    }
    select {
      border-radius: 12px;
      padding-inline: 0.75rem;
      min-block-size: 2.75rem;
    }
    ::picker(select) {
      border: 1px solid oklch(85% 0.01 290);
      border-radius: 12px;
      padding: 0.5rem;
    }
  }
</style>
```

Per [Open UI : Customizable Select](https://open-ui.org/components/customizableselect/) (verified 2026-05-19), `appearance: base-select` opts the `<select>` into customizable rendering. Status at 2026-05-19 is Chromium-only Limited Availability. ALWAYS gate the opt-in behind `@supports` so non-Chromium browsers fall back to the standard `<select>`. The `<button>` child is the trigger; the `<selectedcontent>` element is the live-cloned preview of the selected option. The earlier `<selectedoption>` name is historical ; ALWAYS write `<selectedcontent>`.

## Example 10 : Form-Associated Custom Element via `ElementInternals`

```javascript
class StarRating extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["name", "value", "required"];

  #internals = this.attachInternals();
  #value = "";
  #errorId = null;

  connectedCallback() {
    this.tabIndex = 0;
    this.role = "radiogroup";
    this.#value = this.getAttribute("value") ?? "";
    this.#internals.setFormValue(this.#value);
    this.#syncValidity();
  }

  get value() { return this.#value; }
  set value(v) {
    this.#value = String(v ?? "");
    this.#internals.setFormValue(this.#value);
    this.#syncValidity();
  }

  get form()              { return this.#internals.form; }
  get labels()            { return this.#internals.labels; }
  get validity()          { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  get willValidate()      { return this.#internals.willValidate; }

  checkValidity()  { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }

  formResetCallback() {
    this.value = this.getAttribute("value") ?? "";
  }

  formStateRestoreCallback(state) {
    this.value = state;
  }

  formDisabledCallback(disabled) {
    this.tabIndex = disabled ? -1 : 0;
    this.setAttribute("aria-disabled", String(disabled));
  }

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

  setErrorMessageElement(id) {
    this.#errorId = id;
    this.#syncValidity();
  }
}

customElements.define("star-rating", StarRating);
```

Per [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) (verified 2026-05-19), `formAssociated = true` and `attachInternals()` together make the element a full peer of native controls. `setFormValue` is what makes the value submit ; `setValidity` is the moral equivalent of `setCustomValidity` with full ValidityState control. The host MUST also manage `aria-invalid` and `aria-errormessage` itself ; ElementInternals does not set ARIA attributes on the host element.

## Sources (verified 2026-05-19)

- [MDN : `<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)
- [MDN : Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [MDN : :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid)
- [MDN : FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [WHATWG HTML : forms](https://html.spec.whatwg.org/multipage/forms.html)
- [Open UI : Customizable Select](https://open-ui.org/components/customizableselect/)
- [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/)
