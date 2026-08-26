---
name: frontend-impl-web-components
description: >
  Use when authoring a custom HTML element with `customElements.define`,
  attaching a shadow root with `attachShadow`, distributing children
  via `<slot>`, reacting to attribute changes via `observedAttributes`
  + `attributeChangedCallback`, server-rendering the shadow root via
  declarative shadow DOM (`<template shadowrootmode="open">`),
  building a custom form control that participates in `<form>`
  submission via `ElementInternals` (`static formAssociated = true`,
  `setFormValue`, `setValidity`, `formAssociatedCallback`,
  `formResetCallback`, `formStateRestoreCallback`), or shipping a
  framework-agnostic UI primitive that needs to work in every
  framework (and no framework). Use when reviewing custom-element
  code for the canonical lifecycle bugs : missing `observedAttributes`,
  DOM work in the constructor, attribute reads before the element is
  upgraded, single-word element names, closed shadow without reason,
  form-custom-elements without `setFormValue`.
  Prevents the seven dominant web-component failures : missing
  `static get observedAttributes()` so `attributeChangedCallback`
  silently never fires; DOM mutations in the constructor (the element
  is not connected yet, parent is undefined, children may not exist);
  single-word element names (the spec REQUIRES a hyphen, the element
  is rejected without one); using `connectedCallback` for one-time
  init without guarding against re-insertion (the callback fires
  every time the element re-enters the DOM); shadow DOM `mode:
  "closed"` chosen by default ("for security") which silently
  destroys debuggability without buying any real isolation;
  form-associated custom elements that forget `setFormValue()`, so
  `<form>` submission ships an empty value for that field; and
  `innerHTML` of user-supplied content inside the shadow root
  without sanitization, opening an XSS surface that shadow DOM
  does NOT block.
  Covers the full `CustomElementRegistry.define(name, ctor, options?)`
  signature with `options.extends` for customized built-ins, the four
  lifecycle callbacks (`connectedCallback`, `disconnectedCallback`,
  `adoptedCallback`, `attributeChangedCallback`) and the
  `observedAttributes` static getter that gates the last one,
  `attachShadow({ mode, delegatesFocus, slotAssignment })`, slot
  distribution mechanics (`<slot name>`, `Element.assignedSlot`, the
  `slotchange` event, `slot.assignedElements()` / `assignedNodes()`),
  declarative shadow DOM via `<template shadowrootmode="open|closed">`
  (Baseline 2024), the form-associated custom-element story (static
  `formAssociated`, `this.attachInternals()`, `setFormValue(value,
  state?)`, `setValidity(flags, message?, anchor?)`, `checkValidity`,
  `reportValidity`, `formAssociatedCallback`, `formDisabledCallback`,
  `formResetCallback`, `formStateRestoreCallback`), the shadow-DOM
  CSS hooks (`:host`, `:host()`, `:host-context()`, `::slotted`,
  `::part`, `:state()`), scoped registries
  (`new CustomElementRegistry()` + `customElementRegistry` option on
  `attachShadow`, Limited availability), and the kebab-case naming
  requirement.
  Keywords: web components, custom elements, customElements define,
  customElementRegistry, HTMLElement, extends HTMLElement,
  observedAttributes, attributeChangedCallback, connectedCallback,
  disconnectedCallback, adoptedCallback, attachShadow, shadow DOM,
  open shadow DOM, closed shadow DOM, delegatesFocus, slotAssignment,
  slot, named slot, default slot, slotchange, assignedSlot,
  assignedNodes, assignedElements, declarative shadow DOM,
  shadowrootmode, ElementInternals, attachInternals, formAssociated,
  setFormValue, setValidity, checkValidity, reportValidity,
  formAssociatedCallback, formResetCallback, formStateRestoreCallback,
  formDisabledCallback, :host, :host(), :host-context, ::slotted,
  ::part, :state, scoped registry, kebab-case,
  custom element not upgrading, custom element not registering,
  slot not rendering, slot not filling, shadow DOM hides content,
  attribute change not detected, form value not submitting,
  form custom element not in submit, styles leaking into shadow DOM,
  how to make a web component, how to write a custom element,
  what is shadow DOM, how to slot content,
  how to make a custom form input, declarative shadow DOM tutorial,
  framework-agnostic component.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Impl : Web Components

Authoritative reference for the standards-based component model : custom elements + shadow DOM + slots + declarative shadow DOM + form-associated custom elements. Framework-agnostic by design. Use for distributable UI primitives that must work in every framework and none.

## Quick Reference

### Baseline status

| Feature | Baseline | Source |
|---|---|---|
| Custom elements (`customElements.define`) | Widely Available | [MDN : Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) (verified 2026-05-19) |
| Shadow DOM (`attachShadow`) | Widely Available | [MDN : ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) (verified 2026-05-19) |
| Declarative Shadow DOM (`<template shadowrootmode>`) | Newly Available (2024) | [MDN : `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) (verified 2026-05-19) |
| `ElementInternals` (form-associated) | Widely Available since March 2023 | [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) (verified 2026-05-19) |
| Scoped Custom Element Registries | Limited / experimental | [WHATWG HTML : custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) (verified 2026-05-19) |

### Minimum viable custom element

```js
class MyCard extends HTMLElement {
  static get observedAttributes() { return ['title']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>:host { display: block; padding: 1rem; border: 1px solid; }</style>
      <h2 part="title"></h2>
      <slot></slot>
    `;
  }

  connectedCallback() { this._render(); }
  attributeChangedCallback() { this._render(); }

  _render() {
    this.shadowRoot.querySelector('[part=title]').textContent = this.getAttribute('title') ?? '';
  }
}

customElements.define('my-card', MyCard);
```

```html
<my-card title="Hello">Body content goes here.</my-card>
```

### Naming rule

Custom-element names MUST contain a hyphen. `<my-card>` is valid. `<mycard>` is REJECTED by `customElements.define`. The hyphen distinguishes author elements from current and future built-in HTML elements.

## Decision Trees

### Tree 1 : When does this need to be a custom element?

```
Does a native HTML element solve the problem (<details>, <dialog>,
<input type="...">, <select>, <button>, <progress>)?
   YES -> use the native element. NEVER reinvent.

Does the component need to work across multiple frameworks (React +
Vue + Solid + no-framework) or be embeddable in CMS / third-party sites?
   YES -> custom element. Framework-agnostic.

Is the component framework-internal (only used inside one React app)?
   YES -> use a framework component. Custom elements add overhead without
          benefit when single-framework scope is locked.

Is server-rendered HTML required for SEO / first paint?
   YES -> custom element + declarative shadow DOM
          (<template shadowrootmode="open">). No JS required for first paint.
```

### Tree 2 : Shadow DOM open or closed?

```
Default choice when uncertain?
   open. Allows external querying via element.shadowRoot, supports
   DevTools inspection, allows author to extend behavior.

Need to inspect / debug in browser DevTools?
   open. closed shadow DOM hides the tree from DevTools.

Building a security-sensitive embed (payment widget, OAuth flow)
where script outside the embed MUST NOT touch internals?
   closed. RARE. Note: closed does NOT prevent malicious script in the
   same origin from reaching internals via prototype manipulation; it
   is a friction barrier, not a security boundary.

Default rule of thumb : ALWAYS open unless you have a specific written
reason for closed.
```

### Tree 3 : Form-associated or not?

```
Does the custom element act as a form input (submits a value with
the <form>, participates in :valid / :invalid, restores state on
back-button / autofill)?
   YES -> form-associated.
          static formAssociated = true;
          this.internals = this.attachInternals();
          this.internals.setFormValue(currentValue);
          implement formResetCallback, formStateRestoreCallback as needed.
   NO  -> pure UI widget; skip formAssociated.

Need ARIA semantics applied to the host element via JS instead of
authors writing role / aria-* attributes?
   YES -> attachInternals().role = 'button'; internals.ariaPressed = 'true'.
          Default ARIA semantics ship with the custom element.
   NO  -> rely on authors / inner HTML for ARIA.
```

## Patterns

### Pattern A : Basic custom element with shadow DOM and slot

```js
class MyAvatar extends HTMLElement {
  static get observedAttributes() { return ['src', 'name']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host { display: inline-block; inline-size: 2rem; block-size: 2rem; border-radius: 50%; overflow: hidden; }
        img { inline-size: 100%; block-size: 100%; object-fit: cover; }
        .fallback { display: grid; place-items: center; background: var(--avatar-fallback, #ccc); }
      </style>
      <slot><span class="fallback" part="fallback"></span></slot>
    `;
  }

  connectedCallback() { this._render(); }
  attributeChangedCallback() { this._render(); }

  _render() {
    const src = this.getAttribute('src');
    const name = this.getAttribute('name') ?? '';
    const fallback = this.shadowRoot.querySelector('.fallback');
    if (src) {
      const existing = this.shadowRoot.querySelector('img');
      if (existing) existing.src = src;
      else this.shadowRoot.querySelector('slot').insertAdjacentHTML(
        'afterbegin', `<img alt="${name}" src="${src}">`
      );
      fallback.hidden = true;
    } else {
      fallback.textContent = name.slice(0, 1).toUpperCase();
      fallback.hidden = false;
    }
  }
}

customElements.define('my-avatar', MyAvatar);
```

### Pattern B : Declarative shadow DOM (SSR-friendly, no JS for first paint)

```html
<my-card>
  <template shadowrootmode="open">
    <style>:host { display: block; padding: 1rem; border: 1px solid; }</style>
    <h2><slot name="title"></slot></h2>
    <slot></slot>
  </template>

  <span slot="title">Hello</span>
  <p>Body content visible from first paint.</p>
</my-card>
```

The browser parses the `<template shadowrootmode="open">` and attaches the shadow root before any JavaScript runs. Authors can then progressively enhance with a class definition that takes over interactivity.

```js
// Progressive enhancement : pick up an SSR-attached shadow root
class MyCard extends HTMLElement {
  static get observedAttributes() { return ['variant']; }
  connectedCallback() {
    // shadowRoot already exists (declarative); do NOT re-attachShadow
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' }).innerHTML = `<slot></slot>`;
    }
    this._render();
  }
  _render() { /* ... */ }
}
customElements.define('my-card', MyCard);
```

### Pattern C : Attribute reactivity (the only correct shape)

```js
class MyToggle extends HTMLElement {
  static get observedAttributes() { return ['pressed', 'disabled']; }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'pressed') this._updatePressed(newValue !== null);
    if (name === 'disabled') this._updateDisabled(newValue !== null);
  }
}
```

`observedAttributes` MUST be declared as a static getter (or static class field). Without it, `attributeChangedCallback` silently never fires.

### Pattern D : Form-associated custom element

```js
class MyRating extends HTMLElement {
  static formAssociated = true;
  static get observedAttributes() { return ['value', 'max', 'name']; }

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>:host { display: inline-flex; gap: 0.25rem; }</style>
      <slot></slot>
    `;
    this._value = 0;
  }

  get value() { return this._value; }
  set value(v) {
    this._value = Number(v) || 0;
    this.internals.setFormValue(String(this._value));
    this._validate();
  }

  formAssociatedCallback(form)        { /* ran when associated with a form */ }
  formDisabledCallback(disabled)      { this.toggleAttribute('disabled', disabled); }
  formResetCallback()                 { this.value = Number(this.getAttribute('value')) || 0; }
  formStateRestoreCallback(state, mode) { this.value = Number(state); }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.value = Number(this.getAttribute('value')) || 0;
  }

  _validate() {
    if (this.hasAttribute('required') && this._value === 0) {
      this.internals.setValidity({ valueMissing: true }, 'Please give a rating');
    } else {
      this.internals.setValidity({});
    }
  }
}

customElements.define('my-rating', MyRating);
```

In a `<form>`, this element now participates : `new FormData(form)` includes its `name` and `value`; `form.checkValidity()` consults `setValidity`; the back-button restores the value via `formStateRestoreCallback`.

### Pattern E : Shadow DOM styling hooks

```css
/* From OUTSIDE the shadow DOM (in the document stylesheet) */

my-card { /* style host like any element */ }
my-card::part(title) { color: var(--accent); }       /* style a part="title" inside */
my-card[variant="hero"] { /* attribute selector on host */ }

/* From INSIDE the shadow DOM (in the component's own <style>) */

:host { display: block; }                            /* the host element */
:host([variant="hero"]) { font-size: 2rem; }         /* host with attribute */
:host-context(article) { padding: 2rem; }            /* inside a specific ancestor */
::slotted(p) { margin-block: 0.5rem; }                /* style direct slotted <p> */
:host(:state(--loading)) { opacity: 0.5; }            /* CSS custom-state hook */
```

`::part(name)` is the recommended public theming surface : the component exposes parts; authors style them from outside without breaking encapsulation.

### Pattern F : `slotchange` for dynamic distribution

```js
connectedCallback() {
  const slot = this.shadowRoot.querySelector('slot');
  slot.addEventListener('slotchange', (e) => {
    const items = slot.assignedElements();
    this._itemCount = items.length;
    this._updateCounter();
  });
}
```

`assignedElements()` returns the elements currently distributed to the slot. `assignedNodes()` includes text nodes. The event fires whenever the slot's distributed nodes change.

## Out of Scope

- Framework integrations (React refs / wrappers, Vue v-model wiring, Solid web-component bindings).
- Lit, Stencil, Hybrids, Fast, or any compiler / framework that generates custom elements.
- TypeScript decorators (`@customElement`, `@property`); this skill is plain JS / decorator-free TS.
- Component-level UI templates (modal, toast, drawer) covered in `[[frontend-component-modal-toast-system]]`.

## Hard Rules (Binding)

1. NEVER omit `static get observedAttributes()` when relying on `attributeChangedCallback`. The callback fires only for listed attributes.
2. NEVER do DOM mutations in the constructor on `this.children` / `this.parentNode`. The element is not connected yet. Use `connectedCallback`.
3. NEVER read host attributes in the constructor for behavior decisions. Attributes may not be parsed yet. Read in `connectedCallback` or `attributeChangedCallback`.
4. NEVER name a custom element without a hyphen. `<mycard>` is rejected; use `<my-card>`.
5. NEVER use `mode: 'closed'` without a written reason. Default to `mode: 'open'`. Closed costs debuggability and buys no security.
6. NEVER skip `static formAssociated = true` + `this.internals.setFormValue(value)` on a custom form input. The form submits empty otherwise.
7. NEVER `innerHTML` user-supplied content into the shadow root. Shadow DOM is NOT an XSS boundary. Sanitize (e.g., DOMPurify) or use textContent + DOM APIs.
8. NEVER re-attach a shadow root if one already exists (declarative shadow DOM may have created it). Check `this.shadowRoot` first.
9. ALWAYS use `connectedCallback` for one-time setup BUT guard against re-insertion (the callback fires every time the element re-enters the DOM). Use an instance flag if "truly once" matters.

## Reference Links

- `references/methods.md` : full lifecycle table, ElementInternals signatures, shadow DOM options, slot APIs
- `references/examples.md` : renderable HTML demo with `<my-card>` (declarative shadow DOM) and `<my-rating>` (form-associated) + a `slotchange` example
- `references/anti-patterns.md` : 7 anti-patterns with symptom, root cause, fix
- [MDN : Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) (verified 2026-05-19)
- [MDN : CustomElementRegistry.define()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define) (verified 2026-05-19)
- [MDN : ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) (verified 2026-05-19)
- [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) (verified 2026-05-19)
- [MDN : `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) (verified 2026-05-19)
- [WHATWG HTML : Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html) (verified 2026-05-19)

## Cross-References

- `[[frontend-syntax-html5-semantic]]` : when to prefer native elements
- `[[frontend-syntax-html5-form]]` : form mechanics that custom inputs participate in
- `[[frontend-syntax-js-es2024-ts-dom]]` : DOM TypeScript narrowing, lib.dom.d.ts
- `[[frontend-impl-popover-dialog-anchor]]` : top-layer surfaces often used inside custom components
- `[[frontend-component-modal-toast-system]]` : component-level templates that may be packaged as custom elements
