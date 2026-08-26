# References : Web Components Anti-Patterns

Seven common failure modes with symptom, root cause, fix, source.

## Anti-Pattern 1 : Missing `observedAttributes` static getter

### Symptom
`attributeChangedCallback` is defined but never fires. The component does not react to attribute changes; `value`, `disabled`, `checked` mutations from outside silently do nothing.

### Root cause
The browser only calls `attributeChangedCallback` for attributes listed in the `observedAttributes` static getter. Without the getter, no attributes are observed.

```js
/* WRONG */
class MyToggle extends HTMLElement {
  attributeChangedCallback(name) { /* never fires */ }
}
customElements.define('my-toggle', MyToggle);
```

### Fix
Declare `static get observedAttributes()` returning the array of attribute names. Static class field syntax also works.

```js
/* CORRECT */
class MyToggle extends HTMLElement {
  static get observedAttributes() { return ['pressed', 'disabled']; }
  attributeChangedCallback(name, oldValue, newValue) { /* fires now */ }
}
customElements.define('my-toggle', MyToggle);
```

### Source
[MDN : Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) (verified 2026-05-19), lifecycle table.

## Anti-Pattern 2 : DOM work in the constructor

### Symptom
`this.appendChild(...)` or `this.querySelector(...)` in the constructor throws `DOMException : "The new child element contains the parent"`, or silently does nothing, or operates on a partially-constructed element.

### Root cause
At constructor time the element is NOT yet connected to the document. It has no parent, its children may not be parsed yet, and the upgrade may be happening synchronously during HTML parsing. Per the spec, constructors should be minimal : `super()` and `attachShadow(...)` are typical; everything else belongs in `connectedCallback`.

```js
/* WRONG */
constructor() {
  super();
  this.appendChild(document.createElement('span'));  // may throw
  this.classList.add('initialized');                  // ok but premature
}
```

### Fix
Move DOM work to `connectedCallback`. Reserve the constructor for `super()`, `attachShadow`, and setting instance fields.

```js
/* CORRECT */
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
}
connectedCallback() {
  this.shadowRoot.innerHTML = `<span></span>`;
}
```

### Source
[WHATWG HTML : custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) (verified 2026-05-19), constructor requirements section.

## Anti-Pattern 3 : Single-word element name (no hyphen)

### Symptom
`customElements.define('mycard', MyCard)` throws `SyntaxError : "mycard" is not a valid custom element name`. The element is never registered.

### Root cause
Per [WHATWG HTML : custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) (verified 2026-05-19), custom-element names MUST contain a hyphen. The hyphen distinguishes author elements from current and future built-in HTML elements.

```js
/* WRONG : SyntaxError */
customElements.define('mycard', MyCard);
customElements.define('MyCard', MyCard);    // also wrong: uppercase
customElements.define('card', MyCard);      // also wrong: no hyphen
```

### Fix
Use lowercase kebab-case with at least one hyphen.

```js
/* CORRECT */
customElements.define('my-card', MyCard);
```

### Source
[WHATWG HTML : custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) (verified 2026-05-19).

## Anti-Pattern 4 : `connectedCallback` used for one-time init without guard

### Symptom
Component double-initializes after the user moves it in the DOM (drag-and-drop, virtual list recycling, framework re-render). Event listeners stack up; state resets unexpectedly.

### Root cause
`connectedCallback` fires EVERY time the element enters a document tree, not just the first time. Removing and re-inserting the same element re-fires the callback.

```js
/* WRONG : multiple click listeners after re-insertion */
connectedCallback() {
  this.addEventListener('click', this._onClick);
  this._setupOnce();
}
```

### Fix
Either use an instance flag for true-once setup, OR design the callback to be idempotent (clean up in `disconnectedCallback`, set up in `connectedCallback`).

```js
/* CORRECT : idempotent */
connectedCallback() {
  this._onClick = this._onClick ?? this._handleClick.bind(this);
  this.addEventListener('click', this._onClick);
  if (!this._initialized) {
    this._setupOnce();
    this._initialized = true;
  }
}
disconnectedCallback() {
  this.removeEventListener('click', this._onClick);
}
```

### Source
[MDN : Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) (verified 2026-05-19), lifecycle semantics.

## Anti-Pattern 5 : Closed shadow DOM chosen by default

### Symptom
DevTools cannot inspect the shadow tree. Test code cannot reach inner elements via `querySelector`. Authors who consume the component cannot extend its behavior or patch bugs. Author claims "security" as justification but the closed shadow is bypassable.

### Root cause
`mode: 'closed'` hides `shadowRoot` from outside access (`element.shadowRoot` returns `null`), but it is NOT a security boundary. Same-origin scripts can use prototype tricks to reach internals. Closed shadow's main cost is destroyed debuggability with no real isolation benefit.

```js
/* WRONG : "for security" default */
constructor() {
  super();
  this.attachShadow({ mode: 'closed' });
}
```

### Fix
Use `mode: 'open'` by default. Reserve `closed` for genuinely-embedded contexts (payment widgets, OAuth flows) where DevTools-blocking is a known requirement.

```js
/* CORRECT */
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
}
```

### Source
[MDN : ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) (verified 2026-05-19), mode option notes.

## Anti-Pattern 6 : Form-associated custom element without `setFormValue`

### Symptom
The custom element appears in the form, but submitting the form yields an empty value for that field. `new FormData(form)` returns the empty string or omits the field entirely.

### Root cause
A form-associated custom element MUST call `internals.setFormValue(value)` whenever its value changes. Without it, the form has no value to submit. `static formAssociated = true` plus `attachInternals()` is the setup; `setFormValue` is the value commit.

```js
/* WRONG : value never reaches the form */
class MyInput extends HTMLElement {
  static formAssociated = true;
  constructor() {
    super();
    this.internals = this.attachInternals();
  }
  set value(v) { this._value = v; /* missing setFormValue */ }
}
```

### Fix
Call `setFormValue` on every value change (and reset).

```js
/* CORRECT */
set value(v) {
  this._value = v;
  this.internals.setFormValue(String(v));
}
formResetCallback() { this.value = this.getAttribute('value') || ''; }
formStateRestoreCallback(state) { this.value = state; }
```

### Source
[MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) (verified 2026-05-19), `setFormValue` documentation.

## Anti-Pattern 7 : `innerHTML` of user content inside shadow root (XSS)

### Symptom
A user-controlled string (chat message, comment, prop) renders into the shadow DOM via `shadowRoot.innerHTML = userContent`. A penetration test (or a malicious user) injects `<img src=x onerror=...>` or `<script>` and the script runs.

### Root cause
Shadow DOM is NOT a security boundary against script injection. `innerHTML` parses HTML and executes any `<script>` tags or inline event handlers exactly as it would in the light DOM. The shadow boundary blocks CSS selectors from outside, not script execution.

```js
/* WRONG : XSS surface */
shadowRoot.innerHTML = `<p>${userMessage}</p>`;
```

### Fix
Use `textContent` for plain-text content, OR sanitize the HTML with a vetted library (DOMPurify) before assigning to `innerHTML`, OR build the DOM imperatively with `document.createElement` + `textContent`.

```js
/* CORRECT : textContent escapes */
const p = document.createElement('p');
p.textContent = userMessage;
shadowRoot.appendChild(p);

/* OR with sanitization */
shadowRoot.innerHTML = DOMPurify.sanitize(userHtml);
```

### Source
General web-security guidance. Shadow DOM does NOT protect against script injection. The `<template>` element with `shadowrootmode` similarly does not sanitize content; trust must be established at the source.

## Anti-Pattern 8 (bonus) : Re-attaching shadow root after declarative shadow DOM

### Symptom
A component using declarative shadow DOM (`<template shadowrootmode="open">` in HTML) plus a JS class definition throws `NotSupportedError : Shadow root cannot be created on a host which already hosts a shadow tree`.

### Root cause
The browser attached a shadow root during HTML parsing (declarative shadow DOM). The class constructor then calls `this.attachShadow(...)` again, which throws.

```js
/* WRONG : second attach throws */
constructor() {
  super();
  this.attachShadow({ mode: 'open' });  // throws if declarative already attached
}
```

### Fix
Check `this.shadowRoot` first; attach only if absent.

```js
/* CORRECT */
connectedCallback() {
  if (!this.shadowRoot) {
    this.attachShadow({ mode: 'open' }).innerHTML = `<slot></slot>`;
  }
  // progressive enhancement : the shadow tree may have been server-rendered
}
```

### Source
[MDN : Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) (verified 2026-05-19), declarative shadow DOM + progressive enhancement.
