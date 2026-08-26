# References : Web Components Examples

All snippets WebFetch-verified against sources cited in `methods.md` on 2026-05-19. The renderable demo combines three patterns : declarative shadow DOM `<my-card>`, form-associated `<my-rating>` (participates in `<form>` submit), and a lifecycle-log custom element to show the upgrade / connect / attribute callbacks in order.

## 1. Renderable Self-Contained Demo

Save the following as `demo.html` and open in any evergreen-2026 browser. Open DevTools console to see the lifecycle log; click "Submit form" to observe the form-associated value.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <title>Web Components Demo</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg:      light-dark(#f6f7f9, #0b0d12);
      --surface: light-dark(#ffffff, #14171f);
      --fg:      light-dark(#0a0a0a, #f5f5f5);
      --border:  light-dark(#e2e8f0, #1f2937);
      --accent:  light-dark(#2563eb, #60a5fa);
      --star-empty: light-dark(#cbd5e1, #475569);
      --star-fill:  light-dark(#f59e0b, #fbbf24);
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding-block: 2rem;
      padding-inline: 1.5rem;
      font-family: system-ui, sans-serif;
      background: var(--bg);
      color: var(--fg);
    }
    h1 { font-size: 1.5rem; margin-block: 0 1.5rem; }
    h2 { font-size: 1.125rem; margin-block: 2rem 0.75rem; }
    button[type=submit] {
      background: var(--accent);
      color: var(--bg);
      border: 0;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font: inherit;
    }
    /* Theme my-card from outside via ::part */
    my-card::part(title) { color: var(--accent); }
  </style>
</head>

<body>
  <h1>Web Components Demo</h1>

  <h2>(1) Declarative shadow DOM : &lt;my-card&gt;</h2>

  <my-card>
    <template shadowrootmode="open">
      <style>
        :host { display: block; padding: 1rem; border: 1px solid var(--border, #ccc); border-radius: 12px; background: Canvas; }
        h3    { margin: 0 0 0.5rem; font-size: 1rem; }
        ::slotted(p) { margin: 0; color: light-dark(#52525b, #a1a1aa); }
      </style>
      <h3 part="title"><slot name="title">Untitled</slot></h3>
      <slot></slot>
    </template>

    <span slot="title">Server-rendered card</span>
    <p>This card's shadow tree was attached during HTML parsing, before any JavaScript ran. The script below progressively enhances behavior.</p>
  </my-card>

  <h2>(2) Form-associated : &lt;my-rating&gt; inside &lt;form&gt;</h2>

  <form id="review-form">
    <label for="rating-field">Your rating :</label>
    <my-rating id="rating-field" name="rating" max="5" value="0" required></my-rating>
    <p>
      <button type="submit">Submit form</button>
    </p>
  </form>
  <pre id="submit-output" aria-live="polite"></pre>

  <h2>(3) Lifecycle log : &lt;lc-log&gt; (open console to see)</h2>

  <lc-log id="lifecycle-demo" mood="happy"></lc-log>
  <p>
    <button id="change-attr" type="button">Change attribute</button>
    <button id="remove-elem" type="button">Remove from DOM</button>
    <button id="reinsert-elem" type="button">Re-insert</button>
  </p>

  <script>
    // === (1) my-card : progressive enhancement of declarative shadow DOM ===
    class MyCard extends HTMLElement {
      static get observedAttributes() { return ['variant']; }
      connectedCallback() {
        // shadow root already exists from <template shadowrootmode="open">
        if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' }).innerHTML =
            `<h3 part="title"><slot name="title"></slot></h3><slot></slot>`;
        }
      }
    }
    customElements.define('my-card', MyCard);

    // === (2) my-rating : form-associated custom element ===
    class MyRating extends HTMLElement {
      static formAssociated = true;
      static get observedAttributes() { return ['value', 'max', 'name', 'required']; }

      constructor() {
        super();
        this.internals = this.attachInternals();
        this.attachShadow({ mode: 'open' }).innerHTML = `
          <style>
            :host { display: inline-flex; gap: 0.25rem; cursor: pointer; }
            .star { font-size: 1.5rem; color: var(--star-empty, #ccc); user-select: none; }
            .star.filled { color: var(--star-fill, gold); }
            :host(:focus-visible) { outline: 2px solid var(--accent, #2563eb); outline-offset: 2px; }
            :host(:state(--invalid)) .star { filter: hue-rotate(180deg); }
          </style>
          <span class="stars" role="radiogroup"></span>
        `;
        this._value = 0;
      }

      connectedCallback() {
        if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
        const initial = Number(this.getAttribute('value')) || 0;
        this._setValue(initial, /* fromAttr */ true);
        this._render();
        this.addEventListener('click', (e) => {
          const idx = Number(e.target?.dataset?.index);
          if (Number.isInteger(idx)) this._setValue(idx + 1);
        });
        this.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   this._setValue(Math.min(this._max(), this._value + 1));
          if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') this._setValue(Math.max(0, this._value - 1));
        });
      }

      attributeChangedCallback(name) {
        if (name === 'value') this._setValue(Number(this.getAttribute('value')) || 0, true);
        if (name === 'max' || name === 'required') this._render();
      }

      formResetCallback() {
        this._setValue(Number(this.getAttribute('value')) || 0);
      }

      formStateRestoreCallback(state, mode) {
        this._setValue(Number(state));
      }

      _max() { return Number(this.getAttribute('max')) || 5; }

      _setValue(v, fromAttr = false) {
        this._value = Math.max(0, Math.min(this._max(), Math.floor(v)));
        this.internals.setFormValue(String(this._value));
        if (this.hasAttribute('required') && this._value === 0) {
          this.internals.setValidity({ valueMissing: true }, 'Please give a rating', this);
          this.internals.states.add('--invalid');
        } else {
          this.internals.setValidity({});
          this.internals.states.delete('--invalid');
        }
        if (!fromAttr) this.dispatchEvent(new Event('change', { bubbles: true }));
        this._render();
      }

      _render() {
        const stars = this.shadowRoot.querySelector('.stars');
        if (!stars) return;
        stars.innerHTML = '';
        for (let i = 0; i < this._max(); i++) {
          const s = document.createElement('span');
          s.className = 'star' + (i < this._value ? ' filled' : '');
          s.dataset.index = String(i);
          s.textContent = '★';
          s.setAttribute('role', 'radio');
          s.setAttribute('aria-checked', String(i === this._value - 1));
          stars.appendChild(s);
        }
      }
    }
    customElements.define('my-rating', MyRating);

    // Form submission demo
    document.getElementById('review-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      document.getElementById('submit-output').textContent =
        'Submitted : ' + JSON.stringify(Object.fromEntries(data), null, 2);
    });

    // === (3) lc-log : lifecycle log to console ===
    class LcLog extends HTMLElement {
      static get observedAttributes() { return ['mood']; }
      constructor()                  { super(); console.log('[lc-log] constructor'); }
      connectedCallback()            { console.log('[lc-log] connectedCallback'); }
      disconnectedCallback()         { console.log('[lc-log] disconnectedCallback'); }
      adoptedCallback()              { console.log('[lc-log] adoptedCallback'); }
      attributeChangedCallback(n,o,v){ console.log(`[lc-log] attr ${n}: ${o} -> ${v}`); }
    }
    customElements.define('lc-log', LcLog);

    const lc = document.getElementById('lifecycle-demo');
    document.getElementById('change-attr').addEventListener('click', () => {
      lc.setAttribute('mood', lc.getAttribute('mood') === 'happy' ? 'thoughtful' : 'happy');
    });
    document.getElementById('remove-elem').addEventListener('click', () => lc.remove());
    document.getElementById('reinsert-elem').addEventListener('click', () => {
      document.body.appendChild(lc);
    });
  </script>
</body>
</html>
```

### What this demo proves

1. The card's shadow tree exists BEFORE JavaScript runs (declarative shadow DOM via `<template shadowrootmode="open">`). The progressive-enhancement script checks `!this.shadowRoot` to avoid re-attaching.
2. `<my-rating>` participates in `<form>` submission via `ElementInternals.setFormValue`. The submit handler logs `FormData` to confirm.
3. The lifecycle log demonstrates the order : `constructor` -> `attributeChangedCallback` (for each observed attribute set in HTML) -> `connectedCallback`. Click "Change attribute" / "Remove" / "Re-insert" to see the rest.
4. `:state(--invalid)` (custom-state) is applied via `internals.states.add('--invalid')` when the rating is empty + required, and styled via `:host(:state(--invalid))`.
5. The `::part(title)` selector themes the card title from OUTSIDE the shadow DOM without breaking encapsulation.

## 2. `slotchange` Pattern

```html
<my-counter>
  <my-counter-item>Apple</my-counter-item>
  <my-counter-item>Banana</my-counter-item>
</my-counter>
```

```js
class MyCounter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <p>Items : <span class="count">0</span></p>
      <slot></slot>
    `;
  }

  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');
    const count = this.shadowRoot.querySelector('.count');
    slot.addEventListener('slotchange', () => {
      count.textContent = slot.assignedElements().length;
    });
  }
}
customElements.define('my-counter', MyCounter);
```

`slot.assignedElements()` returns the elements currently distributed to the slot.

## 3. Customized Built-in (where supported)

```js
class FancyButton extends HTMLButtonElement {
  connectedCallback() {
    this.classList.add('fancy-button');
  }
}
customElements.define('fancy-button', FancyButton, { extends: 'button' });
```

```html
<button is="fancy-button" type="submit">Save</button>
```

Safari does NOT support customized built-ins. Prefer autonomous custom elements (`<my-button>`) for cross-browser work.

## 4. Scoped Registry (Limited availability)

```js
if ('CustomElementRegistry' in window) {
  const registry = new CustomElementRegistry();
  registry.define('inner-button', InnerButton);

  class OuterPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({
        mode: 'open',
        customElementRegistry: registry,
      }).innerHTML = `<inner-button>Click</inner-button>`;
    }
  }
  customElements.define('outer-panel', OuterPanel);
}
```

Two different OuterPanel instances can ship different `InnerButton` versions without colliding in the global registry.

## 5. Programmatic ARIA via ElementInternals

```js
class MyToggle extends HTMLElement {
  static get observedAttributes() { return ['pressed', 'disabled']; }

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = 'button';
    this.internals.ariaPressed = 'false';
    this.attachShadow({ mode: 'open' }).innerHTML = `<slot></slot>`;
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.addEventListener('click', () => this.toggleAttribute('pressed'));
    this.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.click(); }
    });
  }

  attributeChangedCallback(n, _o, v) {
    if (n === 'pressed')  this.internals.ariaPressed  = v !== null ? 'true' : 'false';
    if (n === 'disabled') this.internals.ariaDisabled = v !== null ? 'true' : 'false';
  }
}
customElements.define('my-toggle', MyToggle);
```

The host element now reports `role="button"` and `aria-pressed` to assistive tech without authors writing those attributes. Authors can still override by setting `role` / `aria-pressed` on the element.
