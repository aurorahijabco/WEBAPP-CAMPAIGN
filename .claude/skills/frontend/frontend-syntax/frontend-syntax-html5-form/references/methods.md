# Methods Reference : frontend-syntax-html5-form

Complete API surface for HTML5 forms in 2026. ALWAYS cite the row below when writing form code; NEVER fabricate token names from training data.

## 1. Complete `<input>` type matrix

Per [MDN : `<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input) (verified 2026-05-19), all 22 input types are Baseline Widely Available. The activated `ValidityState` flags differ per type.

| Type | Baseline | Validation flags activated | Notes |
|------|----------|----------------------------|-------|
| `text` | Widely | `valueMissing`, `tooShort`, `tooLong`, `patternMismatch` | Default when `type` is omitted or invalid |
| `email` | Widely | `valueMissing`, `typeMismatch`, `tooShort`, `tooLong`, `patternMismatch` | `multiple` attribute allows comma-separated list |
| `url` | Widely | `valueMissing`, `typeMismatch`, `tooShort`, `tooLong`, `patternMismatch` | Value MUST be absolute (scheme + host) |
| `tel` | Widely | `valueMissing`, `tooShort`, `tooLong`, `patternMismatch` | NO intrinsic format validation; pair with `pattern` |
| `number` | Widely | `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput` | `min`, `max`, `step`; strips leading zeros |
| `range` | Widely | `rangeUnderflow`, `rangeOverflow`, `stepMismatch` | Defaults : `min=0`, `max=100`, `step=1` |
| `date` | Widely | `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput` | ISO 8601 wire format; locale-dependent picker UI |
| `time` | Widely | `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput` | 24-hour ISO wire format |
| `datetime-local` | Widely | `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput` | NO timezone |
| `month` | Widely | `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput` | Less browser support for picker UI |
| `week` | Widely | `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput` | Format `YYYY-Www` |
| `color` | Widely | NONE | Returns `#rrggbb` hex; no alpha channel |
| `search` | Widely | `valueMissing`, `tooShort`, `tooLong`, `patternMismatch` | UA may add clear button |
| `password` | Widely | `valueMissing`, `tooShort`, `tooLong`, `patternMismatch` | NEVER persist via `value` attribute |
| `file` | Widely | `valueMissing` | `accept`, `multiple`, `capture` attrs |
| `hidden` | Widely | NONE | Submitted, never validated, never focused |
| `image` | Widely | NONE | Submits `name.x` and `name.y` click coords (legacy) |
| `checkbox` | Widely | `valueMissing` (when `required`) | `checked` is initial; `:checked` reflects current |
| `radio` | Widely | `valueMissing` per `name` group | Shares state via `name` |
| `submit` | Widely | NONE | Triggers form `submit` event + validation |
| `reset` | Widely | NONE | Fires `reset` event; restores default attrs |
| `button` | Widely | NONE | Prefer the `<button>` element |

## 2. `inputmode` attribute

Per [MDN : `<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input) (verified 2026-05-19), `inputmode` accepts eight tokens. It tunes the mobile virtual keyboard ONLY; it has NO effect on validation, NO effect on desktop UA, and NO effect on the submitted value.

| Token | Keyboard hint |
|-------|---------------|
| `none` | No virtual keyboard; author provides input UI |
| `text` (default) | Standard text keyboard |
| `decimal` | Numeric keyboard with decimal separator |
| `numeric` | Numeric keyboard without decimal separator |
| `tel` | Telephone keypad with `+`, `*`, `#` |
| `search` | Standard keyboard with search action |
| `email` | Standard keyboard with `@` and `.` accessible |
| `url` | Standard keyboard with `/` and `.com` accessible |

Canonical pattern for "numeric keypad but preserve leading zeros" : `<input type="text" inputmode="numeric" pattern="[0-9]*">`. NEVER use `type="number"` for identifiers, postal codes, or OTP codes.

## 3. `autocomplete` attribute : complete token inventory

Per [MDN : autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete) (verified 2026-05-19) and [WHATWG HTML : forms](https://html.spec.whatwg.org/multipage/forms.html) (verified 2026-05-19), the grammar is :

```
autocomplete = [section-* ][shipping|billing ][home|work|mobile|fax|pager ]<detail-token>[ webauthn]
```

The `section-*` prefix is OPTIONAL and groups fields belonging to the same logical record. The `shipping`/`billing` prefix indicates address purpose. The detail token is REQUIRED. The `webauthn` modifier MUST be last and signals a conditional passkey assertion.

### Detail-token inventory

**Name parts** : `name`, `given-name`, `additional-name`, `family-name`, `honorific-prefix`, `honorific-suffix`, `nickname`

**Account** : `username`, `current-password`, `new-password`, `one-time-code`

**Contact** : `email`, `impp`, `tel`, `tel-country-code`, `tel-national`, `tel-area-code`, `tel-local`, `tel-local-prefix`, `tel-local-suffix`, `tel-extension`

**Personal** : `organization`, `organization-title`, `bday`, `bday-day`, `bday-month`, `bday-year`, `sex`, `language`, `url`, `photo`

**Address** : `street-address`, `address-line1`, `address-line2`, `address-line3`, `address-level1`, `address-level2`, `address-level3`, `address-level4`, `country`, `country-name`, `postal-code`

**Credit card** : `cc-name`, `cc-given-name`, `cc-additional-name`, `cc-family-name`, `cc-number`, `cc-exp`, `cc-exp-month`, `cc-exp-year`, `cc-csc`, `cc-type`, `transaction-currency`, `transaction-amount`

### `on` / `off` rules

The literal `autocomplete="off"` is valid ONLY when no detail token is present and is interpreted by user agents as a hint, not a guarantee. It is the WRONG choice for password fields : use `current-password` (login) or `new-password` (registration / change). Per [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19) SC 1.3.5, correct tokens are required at level AA for personal-data fields.

## 4. `ValidityState` flag matrix : detailed semantics

Per [MDN : Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) (verified 2026-05-19) :

| Flag | Trigger condition | Notes |
|------|-------------------|-------|
| `valueMissing` | `required` AND empty | For radios : no group member checked. For checkboxes : unchecked when `required`. For `<select>` : no option selected. |
| `typeMismatch` | `type="email"` invalid email; `type="url"` not absolute URL | Other types : never sets this. |
| `patternMismatch` | `pattern` regex set AND value fails | Pattern is implicitly anchored at start and end. |
| `rangeUnderflow` | `min` set AND value below | Applies to numeric and date types. |
| `rangeOverflow` | `max` set AND value above | Applies to numeric and date types. |
| `stepMismatch` | `step` set AND value not integer step from `min` | `step="any"` disables this flag. |
| `tooShort` | `minlength` set AND user-supplied value shorter | NEVER triggers for programmatic `.value =` assignments. |
| `tooLong` | `maxlength` set AND user-supplied value longer | Same caveat. |
| `badInput` | UA cannot parse text to the type | E.g. letters in `type="number"`. |
| `customError` | `setCustomValidity(msg)` called with non-empty string | Overrides default `validationMessage`. |
| `valid` | All above flags false | Computed; not settable. |

### Element methods

- `element.checkValidity()` : returns boolean; fires `invalid` event on each invalid control; does NOT surface the native bubble.
- `element.reportValidity()` : returns boolean; fires `invalid` event; DOES surface the native bubble at the first invalid control and focuses it.
- `element.setCustomValidity(message)` : non-empty string marks invalid with `customError = true` and `validationMessage = message`; empty string clears.
- `element.validity` : the `ValidityState` instance.
- `element.validationMessage` : the localized message string (or the custom one).
- `element.willValidate` : true if the element will be validated on form submission.

### Form-level mirrors

`form.checkValidity()` and `form.reportValidity()` walk the form's controls. `form.requestSubmit(submitter?)` performs validation + fires `submit` + accepts an optional submitter. `form.submit()` skips validation AND skips the `submit` and `formdata` events; NEVER call it from application code.

### Pseudo-classes

| Selector | Matches |
|----------|---------|
| `:valid` | Element's value satisfies all constraints. Matches on first paint. |
| `:invalid` | Element's value violates a constraint. Matches on first paint. |
| `:required` | Element has the `required` attribute. |
| `:optional` | Element does NOT have the `required` attribute. |
| `:in-range` | Element has `min`/`max` and value is between them. |
| `:out-of-range` | Element has `min`/`max` and value is outside. |
| `:user-valid` | `:valid` AND user has interacted with the field. Baseline Nov 2023. |
| `:user-invalid` | `:invalid` AND user has interacted. Baseline Nov 2023. |
| `:placeholder-shown` | Element shows a placeholder (value is empty). |

## 5. Form events

| Event | Target | Cancelable | Notes |
|-------|--------|------------|-------|
| `submit` | `<form>` | YES | `event.submitter` identifies the button. Fires on button click, Enter in single-line input, `requestSubmit()`. |
| `invalid` | each invalid element | YES | Fires during `checkValidity()` / `reportValidity()`. Cancelable to suppress the native bubble. |
| `reset` | `<form>` | YES | Fires on `<input type="reset">` or `form.reset()`. Restores `defaultValue` / `defaultChecked` / `defaultSelected`. |
| `formdata` | `<form>` | NO | Fires AFTER `submit`, only when the form actually submits. `event.formData` is a mutable `FormData`. |

`SubmitEvent.submitter` is the button that triggered the submit. Its `formaction`, `formenctype`, `formmethod`, `formnovalidate`, and `formtarget` attributes override the form's equivalents.

## 6. FormData API

Per [MDN : FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) (verified 2026-05-19) :

| Constructor | Behavior |
|-------------|----------|
| `new FormData()` | Empty instance |
| `new FormData(form)` | Snapshot of the form's current state |
| `new FormData(form, submitter)` | Snapshot including the submitter's `name=value` |

| Method | Behavior |
|--------|----------|
| `append(name, value, filename?)` | Adds an entry; multiple entries with same name are allowed |
| `set(name, value, filename?)` | Replaces all entries with the name |
| `get(name)` | Returns first match |
| `getAll(name)` | Returns all matches as an array |
| `has(name)` | Boolean |
| `delete(name)` | Removes all entries with the name |
| `keys()`, `values()`, `entries()` | Iterators |
| `forEach((value, key) => ...)` | Callback iteration |

### Wire encodings

| Method | Encoding | File entries allowed |
|--------|----------|----------------------|
| `fetch(url, {method:"POST", body: formData})` | `multipart/form-data` | YES |
| `fetch(url, {method:"POST", body: new URLSearchParams(formData)})` | `application/x-www-form-urlencoded` | NO |
| `JSON.stringify(Object.fromEntries(formData))` | `application/json` (flat) | NO; handle multi-value keys manually |

## 7. Open UI customizable controls

Per [Open UI : Customizable Select](https://open-ui.org/components/customizableselect/) (verified 2026-05-19) and [MDN : appearance](https://developer.mozilla.org/en-US/docs/Web/CSS/appearance) (verified 2026-05-19) :

| Feature | Status (2026-05-19) | Opt-in |
|---------|---------------------|--------|
| `appearance: base-select` on `<select>` | Limited Availability (Chromium-only) | `select, ::picker(select) { appearance: base-select; }` |
| `<selectedcontent>` child of customized `<select>` | Ships with `base-select` | Markup |
| `::picker(select)` pseudo-element | Ships with `base-select` | CSS |
| `appearance: base` (generalized) | Specified, not implemented anywhere | (none) |
| `popovertarget` / `popovertargetaction` on `<button>` | Baseline 2025 | HTML attributes |
| `commandfor` / `command` on `<button>` | Draft | (do not ship) |

The element is named `<selectedcontent>`; the earlier `<selectedoption>` name is historical. The picker is implemented as a popover positioned via CSS anchor positioning. ALWAYS author the markup so the standard `<select>` works without the opt-in (the styling is the only thing the opt-in changes).

## 8. ElementInternals API : full surface

Per [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) (verified 2026-05-19), Baseline Widely Available since March 2023.

### Host requirements

```javascript
class MyControl extends HTMLElement {
  static formAssociated = true;
  #internals = this.attachInternals();
}
```

### `ElementInternals` properties

- `form` : owning `<form>` (or `null`).
- `labels` : `NodeList` of associated `<label>` elements.
- `willValidate` : boolean.
- `validity` : `ValidityState` mirror.
- `validationMessage` : current invalid message string.

### `ElementInternals` methods

- `checkValidity()` : same semantics as native; returns boolean and fires `invalid`.
- `reportValidity()` : same semantics; surfaces UI and focuses.
- `setFormValue(value, state?)` : sets the value submitted with the form. `value` can be `string`, `File`, or `FormData`. The optional `state` is for `formStateRestoreCallback`.
- `setValidity(flags, message?, anchor?)` : `flags` is an object with `ValidityState` keys (e.g. `{ valueMissing: true }`); empty object clears all flags. `anchor` is the element to focus on `reportValidity`.

### Host lifecycle callbacks

- `formAssociatedCallback(form)` : fires on form association change. `form` is the new form or `null`.
- `formDisabledCallback(disabled)` : fires when the form or a containing `<fieldset>` is disabled / enabled.
- `formResetCallback()` : fires on `form.reset()`. MUST restore initial state.
- `formStateRestoreCallback(state, reason)` : fires on browser state restore. `reason` is `"restore"` (navigation) or `"autocomplete"` (autofill).

### Accessibility hookup

When `setValidity` is called with a non-empty error message, ALSO mark the host via `this.setAttribute("aria-invalid", "true")` and ensure an error-message element with the matching `id` is referenced via `aria-errormessage`. ElementInternals itself does not set ARIA attributes on the host.

## 9. `<label>` and `<fieldset>` rules

Per [MDN : `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label) (verified 2026-05-19) :

- **Labelable elements** : `<button>`, `<input>` (all types except `hidden`), `<meter>`, `<output>`, `<progress>`, `<select>`, `<textarea>`, plus any form-associated custom element.
- **Explicit association** (preferred) : `<label for="email">Email</label><input id="email">`.
- **Implicit association** : `<label>Email <input></label>`.
- **Multiple labels** are allowed for the same control.
- **No interactive children** inside `<label>` (no `<a>`, `<button>`).

Per [MDN : `<fieldset>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset) (verified 2026-05-19) :

- The `<legend>` MUST be the first child.
- `<fieldset disabled>` disables all descendants EXCEPT controls inside the `<legend>`.
- Modern Chromium and Firefox correctly render `<fieldset>` as a flex / grid container when set.
- The `form` attribute allows referencing an outside form's id.

## 10. WCAG 2.2 SC mapping for forms

Per [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19), the relevant SCs are :

| SC | Level | Requirement |
|----|-------|-------------|
| 1.3.1 Info and Relationships | A | Programmatic association of labels and controls (use `<label for>`). |
| 1.3.5 Identify Input Purpose | AA | Correct `autocomplete` tokens for personal-data fields. |
| 3.3.1 Error Identification | A | Errors MUST be identified in text. |
| 3.3.2 Labels or Instructions | A | Every control needs a label or instructions. Placeholder is NOT a label. |
| 3.3.3 Error Suggestion | AA | Suggest fixes when known. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Reversible / checked / confirmed. |
| 3.3.7 Redundant Entry | A | Do not require re-entry of previously submitted info. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Do not require cognitive function tests for auth (no captchas as the only path). |

## Sources (verified 2026-05-19)

- [MDN : `<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)
- [MDN : autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
- [MDN : Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [MDN : :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid)
- [MDN : FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [MDN : appearance](https://developer.mozilla.org/en-US/docs/Web/CSS/appearance)
- [MDN : `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)
- [MDN : `<fieldset>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset)
- [WHATWG HTML : forms](https://html.spec.whatwg.org/multipage/forms.html)
- [Open UI](https://open-ui.org/)
- [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/)
