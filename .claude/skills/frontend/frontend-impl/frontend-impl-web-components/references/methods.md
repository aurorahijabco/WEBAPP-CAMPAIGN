# References : Web Components Catalog

Verified against [MDN : Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) (2026-05-19), [MDN : CustomElementRegistry.define()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define) (2026-05-19), [MDN : ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) (2026-05-19), [MDN : ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) (2026-05-19), [MDN : `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) (2026-05-19), [WHATWG HTML : custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) (2026-05-19).

## 1. `customElements.define(name, constructor, options?)`

### 1.1 Parameters

| Parameter | Type | Notes |
|---|---|---|
| `name` | `string` | MUST contain a hyphen. Lowercase ASCII only. Cannot collide with reserved names. |
| `constructor` | `class extends HTMLElement` | Class definition. Cannot be a function expression for autonomous custom elements. |
| `options.extends` | `string` (tag name) | For customized built-ins. Constructor must extend the corresponding `HTMLXxxElement`. |

### 1.2 Autonomous vs customized built-in

```js
// Autonomous : extends HTMLElement, used as <my-card>
class MyCard extends HTMLElement { /* ... */ }
customElements.define('my-card', MyCard);

// Customized built-in : extends a specific HTMLXxxElement, used as <button is="my-button">
class MyButton extends HTMLButtonElement { /* ... */ }
customElements.define('my-button', MyButton, { extends: 'button' });
```

Customized built-ins have limited cross-browser support (Safari does not implement them). Prefer autonomous custom elements.

### 1.3 Registry API

| Method | Returns |
|---|---|
| `customElements.get(name)` | Constructor or `undefined` |
| `customElements.whenDefined(name)` | `Promise<constructor>` resolved when defined |
| `customElements.upgrade(node)` | Force upgrade of any pending custom elements in `node`'s subtree |

## 2. Lifecycle callbacks

| Callback | Fires when | Args |
|---|---|---|
| `connectedCallback()` | Element inserted into a document tree | none |
| `disconnectedCallback()` | Element removed from a document tree | none |
| `adoptedCallback(oldDoc, newDoc)` | Element moved to a new document (`document.adoptNode`) | `oldDoc`, `newDoc` |
| `attributeChangedCallback(name, oldValue, newValue)` | An observed attribute changes | `name`, `oldValue`, `newValue` |

`attributeChangedCallback` requires `static get observedAttributes()` returning an array of attribute names. Without the static getter, the callback never fires.

### 2.1 Form-associated lifecycle callbacks (when `static formAssociated = true`)

| Callback | Fires when |
|---|---|
| `formAssociatedCallback(form)` | Element associates with (or disassociates from) a form |
| `formDisabledCallback(disabled)` | Element's disabled state changes (fieldset disabled, etc.) |
| `formResetCallback()` | Owning `<form>` is reset |
| `formStateRestoreCallback(state, mode)` | State restored from back/forward navigation, autofill (`mode` is `'restore'` or `'autocomplete'`) |

## 3. `Element.attachShadow(options)`

| Option | Type | Default | Effect |
|---|---|---|---|
| `mode` | `'open' \| 'closed'` | required | `open` exposes via `element.shadowRoot`; `closed` hides |
| `delegatesFocus` | `boolean` | `false` | Focus on shadow content delegates to host; host appears focused |
| `slotAssignment` | `'named' \| 'manual'` | `'named'` | `named` distributes by `slot=` attribute; `manual` requires `slot.assign(...elements)` |
| `clonable` | `boolean` | `false` | Whether `cloneNode` clones the shadow root |
| `serializable` | `boolean` | `false` | Whether `getHTML()` includes the shadow root |
| `customElementRegistry` | `CustomElementRegistry` | global | Scoped registry (Limited availability) |

### 3.1 ShadowRoot properties / methods

| Member | Returns |
|---|---|
| `shadowRoot.host` | The host element |
| `shadowRoot.mode` | `'open'` or `'closed'` |
| `shadowRoot.activeElement` | Currently-focused element inside |
| `shadowRoot.styleSheets` | Constructable stylesheets |
| `shadowRoot.adoptedStyleSheets` | Adopted constructable stylesheets |
| `shadowRoot.getHTML(options?)` | Serialize to string (if `serializable`) |

## 4. Slot APIs

### 4.1 `<slot>` element

| Attribute | Meaning |
|---|---|
| `name` | Slot name; matches `slot="name"` on light-DOM children |
| (no `name`) | Default slot for unmatched children |

### 4.2 Slot properties / methods

| Member | Type | Description |
|---|---|---|
| `slot.assignedNodes(options?)` | `Node[]` | Distributed nodes (text + elements). `options.flatten` collapses nested slot fallbacks. |
| `slot.assignedElements(options?)` | `Element[]` | Distributed elements only |
| `slot.assign(...nodes)` | `void` | Manual slot assignment (when `slotAssignment: 'manual'`) |
| `Element.assignedSlot` | `HTMLSlotElement \| null` | Slot containing this distributed node |

### 4.3 `slotchange` event

Fires on `<slot>` when its distributed nodes change. Bubbles, not cancelable.

```js
slot.addEventListener('slotchange', () => {
  const items = slot.assignedElements();
  // react to redistribution
});
```

## 5. Declarative Shadow DOM

```html
<my-card>
  <template shadowrootmode="open">
    <style>:host { display: block; }</style>
    <slot></slot>
  </template>
  <!-- light-DOM children below -->
</my-card>
```

| Attribute | Values |
|---|---|
| `shadowrootmode` | `open` / `closed` |
| `shadowrootdelegatesfocus` | (boolean attribute) |
| `shadowrootclonable` | (boolean attribute) |
| `shadowrootserializable` | (boolean attribute) |

Browser parses the template, attaches the shadow root, and the inner template's content becomes the shadow DOM. The template element is REMOVED from the live DOM after parsing.

Authors progressively enhancing MUST check `if (!this.shadowRoot) this.attachShadow(...)` to avoid re-attaching.

## 6. `ElementInternals`

### 6.1 Obtaining

```js
class MyInput extends HTMLElement {
  static formAssociated = true;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }
}
```

`attachInternals()` can be called ONCE per element. Second call throws `NotSupportedError`. Must be called inside the constructor (or `connectedCallback` at the latest).

### 6.2 Form properties (read-only)

| Property | Type |
|---|---|
| `internals.form` | `HTMLFormElement \| null` |
| `internals.labels` | `NodeList` |
| `internals.willValidate` | `boolean` |
| `internals.validity` | `ValidityState` |
| `internals.validationMessage` | `string` |
| `internals.shadowRoot` | `ShadowRoot \| null` |
| `internals.states` | `CustomStateSet` |

### 6.3 Form methods

| Method | Purpose |
|---|---|
| `setFormValue(value, state?)` | Submit value (and optional internal state) to `<form>` |
| `setValidity(flags, message?, anchor?)` | Set validity; `flags` is a `ValidityStateFlags` dict |
| `checkValidity()` | Returns `true` if valid |
| `reportValidity()` | Check + show built-in validation message |

`setFormValue(null)` sets the field to "no value". `setValidity({})` clears all validity flags (valid).

### 6.4 ARIA accessor properties

`internals.role`, `internals.ariaLabel`, `internals.ariaPressed`, `internals.ariaExpanded`, etc. (40+ properties). Set ARIA defaults for the host element programmatically; authors can still override via attributes.

### 6.5 Custom states

```js
this.internals.states.add('--loading');
this.internals.states.delete('--loading');
this.internals.states.has('--loading');
```

Matched by CSS `:state(--loading)` selector on the host.

## 7. Shadow DOM CSS hooks

| Selector | Matches |
|---|---|
| `:host` | The host element from inside the shadow root |
| `:host(<selector>)` | Host matching a selector (e.g., `:host([variant="hero"])`) |
| `:host-context(<selector>)` | Host that has an ancestor matching a selector |
| `::slotted(<selector>)` | Distributed direct children matching a selector |
| `::part(<name>)` | An element marked `part="name"` inside the shadow tree |
| `:state(<custom-state>)` | Host with the custom state set via `internals.states` |
| `:defined` | A custom element that has been upgraded |

`::slotted(...)` matches ONLY direct slotted children (no deep descendants). `::part(...)` is exposed via the component's `part` attributes; it is the recommended public theming surface.

## 8. Scoped Custom Element Registries

```js
const registry = new CustomElementRegistry();
registry.define('my-button', MyButton);

const shadow = this.attachShadow({
  mode: 'open',
  customElementRegistry: registry,
});
// Inside this shadow root, 'my-button' resolves to the scoped class
```

Status : Limited availability per [WHATWG HTML : custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) (verified 2026-05-19). Gate behind `@supports`-equivalent JS check (`'customElementRegistry' in shadowOpts`) or test for `CustomElementRegistry` constructor existence.

## 9. Naming rules (spec)

Per [WHATWG HTML : custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) (verified 2026-05-19) :

- MUST start with a lowercase ASCII letter.
- MUST contain a hyphen.
- May contain ASCII letters, digits, `.`, `_`, `-`, plus a few Unicode ranges.
- May NOT be one of the reserved names : `annotation-xml`, `color-profile`, `font-face`, `font-face-src`, `font-face-uri`, `font-face-format`, `font-face-name`, `missing-glyph`.

## 10. Cross-References

- `[[frontend-syntax-html5-semantic]]` : prefer native elements when available
- `[[frontend-syntax-html5-form]]` : form mechanics that form-associated elements participate in
- `[[frontend-syntax-js-es2024-ts-dom]]` : DOM TypeScript narrowing
- `[[frontend-impl-popover-dialog-anchor]]` : top-layer surfaces inside web components
