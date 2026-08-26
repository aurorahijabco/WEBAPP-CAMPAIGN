---
name: frontend-syntax-html5-form
description: >
  Use when authoring any HTML form, validating user input, wiring custom widgets into the form
  lifecycle, integrating password managers / autofill, or deciding between native and custom
  form controls.
  Prevents the most common form regressions in 2026 : `:invalid` red borders on empty load,
  `autocomplete="off"` killing password managers, `HTMLFormElement.submit()` silently
  bypassing validation, JS-rebuilt selects with no constraint validation, and
  ElementInternals widgets without `aria-errormessage` plumbing.
  Covers the complete 22-type `<input>` matrix with Baseline status, the `inputmode` token
  set, the full `autocomplete` token taxonomy, the Constraint Validation API (`ValidityState`,
  `setCustomValidity`, `checkValidity` vs `reportValidity`, `:invalid` vs `:user-invalid`,
  `requestSubmit`), form events (`submit` / `reset` / `formdata` / `invalid`), the FormData
  API, Open UI customizable controls (`appearance: base-select`, `<selectedcontent>`, gated
  Chromium-only with progressive-enhancement pattern), and Form-Associated Custom Elements
  via `ElementInternals` (Baseline since March 2023).
  Keywords: Constraint Validation, ValidityState, requestSubmit, :user-invalid, :invalid,
  formdata event, FormData, ElementInternals, attachInternals, formAssociated, setFormValue,
  setValidity, autocomplete, inputmode, base-select, selectedcontent, picker pseudo, label,
  fieldset, legend, aria-errormessage, aria-invalid, form wont submit, validation not
  showing, autofill not working, password manager missing, error message untranslated,
  mobile keyboard wrong, screen reader does not announce error, how to validate form,
  why is autofill not working, can I style a select, how to make an accessible form,
  how to show form errors.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Syntax : HTML5 Form

This skill is the operational reference for HTML form authoring in 2026. It covers the complete native input type matrix, the Constraint Validation API, the submission lifecycle (submit / reset / formdata / invalid), the FormData API, the Open UI customizable controls, and Form-Associated Custom Elements via `ElementInternals`. The skill does NOT cover framework form libraries, opinionated UI kits, or server-side validation; consult those toolchains directly.

## Quick Reference

### Floor rules

- ALWAYS pair every interactive form control with a `<label>` (explicit `for`/`id` preferred over implicit nesting).
- ALWAYS set a correct `autocomplete` token on every autofillable field. WCAG 2.2 SC 1.3.5 (Identify Input Purpose) requires it for personal-data fields.
- ALWAYS use `:user-invalid` for visible error styling. NEVER use bare `:invalid` for that purpose.
- ALWAYS call `form.requestSubmit(submitter?)` to submit programmatically. NEVER call `HTMLFormElement.submit()` (it bypasses validation and skips the `submit` and `formdata` events).
- ALWAYS reflect domain-specific errors into the Constraint Validation API via `setCustomValidity(message)` (for native controls) or `internals.setValidity(flags, message, anchor?)` (for form-associated custom elements).
- ALWAYS pair `aria-invalid="true"` with `aria-errormessage="<id>"` for error messages. The referenced element MUST be in the DOM and visible while the field is invalid.

### Decision tree 1 : Which input type for which data ?

```
Email address ?
  -> <input type="email" autocomplete="email" inputmode="email">
     (add multiple for csv lists)

Telephone (free format) ?
  -> <input type="tel" autocomplete="tel" inputmode="tel">
     (add pattern for strict format ; tel does NOT intrinsically validate)

Numeric identifier where leading zeros matter (postal code, SKU, OTP) ?
  -> <input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="postal-code | one-time-code | off">
     (NEVER type="number" : it strips leading zeros, allows e+ exponent notation,
      and ships a spinner that is wrong on mobile)

Decimal currency ?
  -> <input type="text" inputmode="decimal" pattern="[0-9]+([.,][0-9]+)?">
     (manual parse on the server ; type="number" mangles "1,234.56")

Login password ?
  -> <input type="password" autocomplete="current-password">

New / change password ?
  -> <input type="password" autocomplete="new-password" minlength="...">
     (triggers strong-password generator in browsers)

One-time SMS code ?
  -> <input type="text" inputmode="numeric" autocomplete="one-time-code">
     (iOS / Android autofill the SMS code automatically)

Calendar date ?
  -> <input type="date">  (ISO 8601 wire format ; locale-dependent picker UI)

Color picker ?
  -> <input type="color">  (returns #rrggbb, no alpha)

File upload ?
  -> <input type="file" accept="..." multiple? capture?>

Boolean toggle ?
  -> <input type="checkbox" required?>

Single-of-N within a group ?
  -> <input type="radio" name="group">  inside <fieldset><legend>...

Dropdown ?
  -> <select> (native, universally accessible).
     Optionally opt into Chromium-only customization with
       select, ::picker(select) { appearance: base-select; }
     and a <selectedcontent> + <button> picker structure. ALWAYS write the
     markup so the standard <select> works first ; treat base-select as
     progressive enhancement.

Multi-line text ?
  -> <textarea maxlength="..." minlength="..." required?>

Fully custom widget (star rating, color wheel) ?
  -> custom element with `static formAssociated = true` and
     this.attachInternals() ; consume `setFormValue` + `setValidity`.
     Documentation : [[frontend-impl-web-components]].
```

### Decision tree 2 : `:invalid` vs `:user-invalid` for error styling ?

```
Need a CSS hook that reflects validity ?
  YES :
    Is the styling VISIBLE to the user (red border, error message, icon) ?
      YES :
        Should the visible state appear before the user has interacted with the field ?
          YES : Almost never the right answer. Reconsider the UX ; a red border on an
                untouched required field reads as the user's fault before they typed.
          NO  : Use `:user-invalid` (Baseline Widely since November 2023). It matches
                only after the user has interacted with the field (typed invalid input,
                blurred an empty required field, or attempted submit).
      NO  : The styling is internal (e.g. an attribute marker for a sibling
            `[aria-invalid]` overlay). `:invalid` is fine for the silent case
            because it does not surface to the user on first paint.
  NO  : Skip pseudo-class entirely. Read `element.validity` in JS.
```

Per [MDN : :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid) (verified 2026-05-19), `:user-invalid` matches when the value violates a constraint AND the user has interacted with the field OR a submit attempt occurred. The complementary `:user-valid` matches once the field is valid AFTER interaction.

### Decision tree 3 : `submit()` vs `requestSubmit()` ?

```
Are you submitting the form programmatically (not via a real click on a submit button) ?
  YES :
    Do you want browser validation to run, `submit` event to fire, and any `formdata`
    listener to execute ?
      YES : ALWAYS use `form.requestSubmit(submitter?)`. Pass an optional submitter
            button so its `formaction` / `formenctype` / `formmethod` /
            `formnovalidate` / `formtarget` overrides take effect, identical to a
            real click.
      NO  : Reconsider. Skipping validation is almost always a bug. If you truly
            need to bypass (e.g. a saved-draft endpoint), set the form's `novalidate`
            attribute, or set `formnovalidate` on the submit button. NEVER use
            `HTMLFormElement.submit()` ; it skips the `submit` and `formdata` events
            in addition to skipping validation, which silently breaks CSRF token
            injection and any computed-field plumbing.
  NO (a real click on `<button type="submit">`) :
    This already does the right thing. Equivalent to `requestSubmit(button)`.
```

Per [WHATWG HTML : form submission](https://html.spec.whatwg.org/multipage/forms.html) (verified 2026-05-19), `submit()` performs an "internal submission" that omits the `submit` event and constraint validation. `requestSubmit(submitter)` matches the behavior of an actual user click.

## Constraint Validation : the eleven flags

Per [MDN : Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) (verified 2026-05-19), every form-associated element (`<input>`, `<select>`, `<textarea>`, `<button>`, `<output>`, `<fieldset>`) exposes a `validity` property of type `ValidityState`. The eleven flags are summarized below; the complete behavior matrix is in `references/methods.md`.

| Flag | Triggered by |
|------|--------------|
| `valueMissing` | `required` AND value empty |
| `typeMismatch` | `type="email"` invalid email OR `type="url"` not absolute URL |
| `patternMismatch` | `pattern` set AND value does not match |
| `rangeUnderflow` | `min` AND value below |
| `rangeOverflow` | `max` AND value above |
| `stepMismatch` | `step` AND value not integer multiple from `min` |
| `tooShort` | `minlength` AND user value shorter (never for programmatic `.value`) |
| `tooLong` | `maxlength` AND user value longer (never for programmatic `.value`) |
| `badInput` | UA cannot parse user input to the type |
| `customError` | `setCustomValidity(msg)` called with non-empty message |
| `valid` | true iff all above are false |

The element methods `checkValidity()` (silent boolean + fires `invalid`) and `reportValidity()` (boolean + fires `invalid` + surfaces the native bubble) are mirrored on the form for aggregate checks.

## Form events lifecycle

ALWAYS handle the form lifecycle via the events listed below. NEVER simulate them via custom JS state machines.

- **`submit`** : fires on the `<form>` when submission is requested (button click, Enter, `requestSubmit()`). Cancelable. `SubmitEvent.submitter` identifies the button.
- **`invalid`** : fires on each invalid element during `checkValidity()` / `reportValidity()`. Cancelable to suppress the native bubble while keeping the validity state.
- **`reset`** : fires on the `<form>` for `<input type="reset">` or `form.reset()`. Cancelable.
- **`formdata`** : fires AFTER `submit`, only when the form is actually submitted. `event.formData` is a mutable `FormData`. Add CSRF tokens or computed fields here.

## FormData API

Per [MDN : FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) (verified 2026-05-19), `new FormData(form, submitter?)` builds the same payload the browser would send. Methods : `append`, `set`, `get`, `getAll`, `has`, `delete`, `keys`, `values`, `entries`, `forEach`. Default wire encoding is `multipart/form-data` when posted via `fetch`. Use `new URLSearchParams(formData)` for `application/x-www-form-urlencoded` (no `File` entries allowed). Use `Object.fromEntries(formData)` for flat JSON serialization.

## Open UI customizable controls

`appearance: base-select` is the opt-in for the customizable `<select>` element. Per [MDN : appearance](https://developer.mozilla.org/en-US/docs/Web/CSS/appearance) (verified 2026-05-19) and [Open UI : Customizable Select](https://open-ui.org/components/customizableselect/) (verified 2026-05-19), the feature is Chromium-only at Limited Availability as of 2026-05-19. ALWAYS treat it as progressive enhancement.

```css
select, ::picker(select) {
  appearance: base-select;
}
```

Once opted-in, the `<select>` accepts a `<button>` child (trigger) and a `<selectedcontent>` child (the live-cloned preview of the selected option). The picker is a popover positioned via CSS anchor positioning and styleable through the `::picker(select)` pseudo-element. The element name is `<selectedcontent>` (the earlier `<selectedoption>` is historical). The generalized `appearance: base` keyword is specified but NOT yet implemented in any shipped browser at 2026-05-19. The `commandfor` / `command` attributes on `<button>` are draft; the related `popovertarget` / `popovertargetaction` attributes ARE Baseline 2025.

## Form-Associated Custom Elements

Per [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) (verified 2026-05-19), a custom element with `static formAssociated = true` and `this.attachInternals()` becomes a full peer of native form controls. The `ElementInternals` interface exposes `form`, `labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, `setFormValue(value, state?)`, and `setValidity(flags, message?, anchor?)`. The lifecycle callbacks on the host class are `formAssociatedCallback(form)`, `formDisabledCallback(disabled)`, `formResetCallback()`, and `formStateRestoreCallback(state, reason)`. ElementInternals is Baseline Widely Available since March 2023. A worked star-rating example is in `references/examples.md`; the deeper Web Components context lives in `[[frontend-impl-web-components]]`.

## Accessibility for forms

- ALWAYS label every interactive control via `<label>` (explicit `for`/`id` preferred). Labelable elements : `<button>`, `<input>` except `hidden`, `<meter>`, `<output>`, `<progress>`, `<select>`, `<textarea>`.
- ALWAYS group related controls (radio set, address block) in `<fieldset>` with `<legend>` as the first child.
- ALWAYS pair `aria-invalid="true"` with `aria-errormessage="<id>"` for error rendering. The message MUST be in the DOM and visible while invalid. `aria-describedby` is for generic descriptions; `aria-errormessage` is for the error state and only active when `aria-invalid="true"`.
- ALWAYS use `:focus-visible` (not `:focus`) for focus rings; remove with a replacement that meets WCAG 2.2 SC 2.4.13.
- NEVER rely on `placeholder` as the only label (fails SC 3.3.2).
- NEVER set `autofocus` on the primary field (disorients screen-reader users and scroll-jacks mobile keyboards).

The exhaustive matrix is in `references/methods.md`; the cross-cutting WCAG details belong to `[[frontend-a11y-aria-patterns]]`.

## How to use the references

- `references/methods.md` : complete `<input>` type matrix with Baseline status, `inputmode` table, full `autocomplete` token inventory (six groups plus `webauthn` modifier), `ValidityState` flag matrix, ElementInternals interface, `<label>` / `<fieldset>` rules, WCAG-2.2 SC mapping.
- `references/examples.md` : code-only snippets demonstrating the canonical patterns (no renderable full-page fragment ; consult `[[frontend-syntax-html5-semantic]]` for full document examples).
- `references/anti-patterns.md` : seven anti-patterns with symptom / root cause / fix structure.

## Cross-references

- `[[frontend-syntax-html5-semantic]]` : the semantic-element vocabulary that hosts forms
- `[[frontend-syntax-css-cascade-layers-scope]]` : cascade layers for form styling
- `[[frontend-a11y-aria-patterns]]` : ARIA patterns (combobox, listbox, group) for non-native widgets
- `[[frontend-impl-popover-dialog-anchor]]` : popover / dialog / anchor positioning, used by `appearance: base-select`
- `[[frontend-impl-web-components]]` : Form-Associated Custom Elements full pattern
- `[[frontend-core-design-philosophy]]` : when to prefer native over custom

## Primary sources (verified 2026-05-19)

- [MDN : `<input>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)
- [MDN : Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [MDN : :user-invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid)
- [MDN : FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [WHATWG HTML : forms](https://html.spec.whatwg.org/multipage/forms.html)
- [Open UI](https://open-ui.org/)
