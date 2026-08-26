# References : Focus, Keyboard, Inert Examples

All snippets WebFetch-verified against the sources cited in `methods.md` on 2026-05-19. The snippets here are progressive : modal dialog, roving-tabindex tabs, side drawer with `inert` background, focus-visible CSS recipe.

## 1. Modal Dialog with Focus Restoration

This is the canonical evergreen-2026 pattern. `<dialog>.showModal()` provides the top layer, the implicit inert background, the focus-trap, and the Esc-to-close. The author provides : initial focus via `autofocus`, focus restoration on close (NOT automatic for `<dialog>`).

```html
<button id="open-confirm">Delete file</button>

<dialog id="confirm-dialog" aria-labelledby="confirm-title" closedby="closerequest">
  <form method="dialog">
    <h2 id="confirm-title">Delete this file?</h2>
    <p>This action cannot be undone.</p>
    <div class="dialog-actions">
      <button value="cancel" autofocus>Cancel</button>
      <button value="confirm" class="danger">Delete</button>
    </div>
  </form>
</dialog>
```

```css
dialog::backdrop {
  background: rgb(0 0 0 / 0.45);
  backdrop-filter: blur(2px);
}

dialog {
  border: 1px solid var(--border, #ddd);
  border-radius: 12px;
  padding: 1.5rem;
  max-inline-size: 28rem;
}

.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-block-start: 1rem;
}

.dialog-actions button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.dialog-actions button:focus-visible {
  outline: 2px solid var(--focus, #2563eb);
  outline-offset: 2px;
}
```

```js
const opener = document.getElementById('open-confirm');
const dialog = document.getElementById('confirm-dialog');
let trigger = null;

opener.addEventListener('click', () => {
  trigger = document.activeElement;  // capture BEFORE showModal
  dialog.showModal();                 // implicit inert on rest of page
});

dialog.addEventListener('close', () => {
  // close fires for ANY dismissal path : button submit, Esc, light-dismiss
  trigger?.focus();
  trigger = null;

  if (dialog.returnValue === 'confirm') {
    // perform destructive action
  }
});
```

Notes :

- `<form method="dialog">` makes the inner buttons close the dialog with `returnValue` set to the clicked button's `value` attribute. No JS submit handler needed.
- `autofocus` is on the SAFE action (Cancel). NEVER on the destructive action.
- `closedby="closerequest"` is the default for `showModal()` and is shown explicitly for clarity. Use `closedby="any"` to enable light-dismiss; use `closedby="none"` to disable Esc (e.g., confirmation dialogs that require an explicit choice).
- The `close` event fires for ALL dismissal paths (button submit, Esc, light-dismiss, programmatic `dialog.close()`). Restore focus there only.

## 2. Roving-Tabindex Tabs

The 5-tab tablist with arrow-key navigation, Home / End, and manual activation. Per [W3C WAI APG : Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (verified 2026-05-19), manual activation is REQUIRED when activation has side effects.

```html
<div class="tabs" id="docs-tabs">
  <div role="tablist" aria-label="Documentation sections">
    <button role="tab" id="t-intro"   aria-controls="p-intro"   aria-selected="true"  tabindex="0">Intro</button>
    <button role="tab" id="t-api"     aria-controls="p-api"     aria-selected="false" tabindex="-1">API</button>
    <button role="tab" id="t-recipes" aria-controls="p-recipes" aria-selected="false" tabindex="-1">Recipes</button>
    <button role="tab" id="t-faq"     aria-controls="p-faq"     aria-selected="false" tabindex="-1">FAQ</button>
    <button role="tab" id="t-changes" aria-controls="p-changes" aria-selected="false" tabindex="-1">Changes</button>
  </div>

  <div role="tabpanel" id="p-intro"   aria-labelledby="t-intro">...</div>
  <div role="tabpanel" id="p-api"     aria-labelledby="t-api"     hidden>...</div>
  <div role="tabpanel" id="p-recipes" aria-labelledby="t-recipes" hidden>...</div>
  <div role="tabpanel" id="p-faq"     aria-labelledby="t-faq"     hidden>...</div>
  <div role="tabpanel" id="p-changes" aria-labelledby="t-changes" hidden>...</div>
</div>
```

```css
[role="tab"] {
  background: transparent;
  border: 0;
  padding: 0.5rem 0.875rem;
  border-block-end: 2px solid transparent;
  cursor: pointer;
}

[role="tab"][aria-selected="true"] {
  border-block-end-color: var(--accent, #2563eb);
  font-weight: 600;
}

[role="tab"]:focus-visible {
  outline: 2px solid var(--focus, #2563eb);
  outline-offset: 2px;
  border-radius: 4px;
}
```

```js
const root = document.getElementById('docs-tabs');
const tablist = root.querySelector('[role="tablist"]');
const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));

function activate(targetTab) {
  for (const t of tabs) {
    const selected = t === targetTab;
    t.setAttribute('aria-selected', selected ? 'true' : 'false');
    t.setAttribute('tabindex', selected ? '0' : '-1');
  }
  const panelId = targetTab.getAttribute('aria-controls');
  for (const p of panels) p.hidden = p.id !== panelId;
}

tablist.addEventListener('keydown', (e) => {
  const current = tabs.indexOf(document.activeElement);
  if (current < 0) return;

  let next = current;
  switch (e.key) {
    case 'ArrowRight': next = (current + 1) % tabs.length; break;
    case 'ArrowLeft':  next = (current - 1 + tabs.length) % tabs.length; break;
    case 'Home':       next = 0; break;
    case 'End':        next = tabs.length - 1; break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      activate(tabs[current]);
      return;
    default: return;
  }

  e.preventDefault();
  tabs[current].setAttribute('tabindex', '-1');
  tabs[next].setAttribute('tabindex', '0');
  tabs[next].focus();
  // Manual activation : focus moves but panel does NOT switch until Enter/Space.
});

tablist.addEventListener('click', (e) => {
  const tab = e.target.closest('[role="tab"]');
  if (tab) activate(tab);
});
```

Notes :

- Active tab has `tabindex="0"`, others have `tabindex="-1"`. Tab key enters the tablist once and exits once.
- Arrow keys cycle within the tablist (wrap at ends, per APG convention).
- Manual activation : focus moves on arrow keys; the panel switches only on Enter / Space or click. Required because panel content may trigger network fetches.
- For AUTOMATIC activation (cheap panel swap), call `activate(tabs[next])` inside the arrow-key branch.

## 3. Side Drawer with `inert` Background

Side drawer pattern using a non-modal `<dialog>` (or plain `<aside>`) plus `inert` on `<main>`. `dialog.show()` does NOT make the rest of the page inert, so the author MUST.

```html
<header>
  <button id="open-drawer" aria-expanded="false" aria-controls="nav-drawer">Menu</button>
</header>

<main id="main">
  <!-- page content -->
</main>

<aside id="nav-drawer" hidden class="drawer">
  <h2>Navigation</h2>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/docs">Docs</a></li>
    <li><a href="/about">About</a></li>
  </ul>
  <button id="close-drawer">Close</button>
</aside>
```

```css
.drawer {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 18rem;
  padding: 1.5rem;
  background: var(--surface, #fff);
  border-inline-end: 1px solid var(--border, #ddd);
}

.drawer :focus-visible {
  outline: 2px solid var(--focus, #2563eb);
  outline-offset: 2px;
}
```

```js
const opener = document.getElementById('open-drawer');
const closer = document.getElementById('close-drawer');
const drawer = document.getElementById('nav-drawer');
const main   = document.getElementById('main');
let trigger = null;

function openDrawer() {
  trigger = document.activeElement;
  drawer.hidden = false;
  main.inert = true;                     // background not focusable, not AT-exposed
  opener.setAttribute('aria-expanded', 'true');
  drawer.querySelector('a, button')?.focus();
}

function closeDrawer() {
  drawer.hidden = true;
  main.inert = false;
  opener.setAttribute('aria-expanded', 'false');
  trigger?.focus();
  trigger = null;
}

opener.addEventListener('click', openDrawer);
closer.addEventListener('click', closeDrawer);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !drawer.hidden) {
    e.preventDefault();
    closeDrawer();
  }
});
```

Notes :

- `main.inert = true` toggles the global attribute. ALL six effects engage on the entire `<main>` subtree.
- `<header>` containing the trigger remains interactive (NOT inerted). The trigger button must NOT be inside `<main>`.
- Escape handler is author-supplied. `<dialog>.show()` and bare `<aside>` do not auto-handle Esc.
- Focus restoration is manual. Capture `trigger` on open, restore on close.

## 4. focus-visible CSS Recipe (Theme-Level)

```css
:root {
  --focus: oklch(60% 0.18 250); /* design-token controlled */
}

/* Universal recipe : every focusable element */
:is(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Text inputs : the UA already applies :focus-visible on mouse-click, so
   the same rule applies and gives a consistent visual everywhere. */

/* High-contrast media : honor user's contrast preference */
@media (prefers-contrast: more) {
  :is(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline-width: 3px;
    outline-offset: 3px;
  }
}

/* Forced-colors (Windows High Contrast) : let the OS pick colors */
@media (forced-colors: active) {
  :is(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: 2px solid CanvasText;
  }
}
```

Notes :

- Use `:is(...)` so the rule has the specificity of a single attribute selector (manageable).
- ALWAYS pair with token-driven color so the focus indicator inherits theme palette and contrast guarantees.
- `forced-colors` block uses `CanvasText` system color so the indicator survives Windows High Contrast mode (which strips author colors).

## 5. Combobox with `aria-activedescendant`

The single case where DOM focus must stay on the input. Highlighted option is announced via attribute, not focus.

```html
<label for="city-combo">City</label>
<input id="city-combo" type="text"
       role="combobox"
       aria-autocomplete="list"
       aria-expanded="false"
       aria-controls="city-listbox"
       aria-activedescendant="">

<ul id="city-listbox" role="listbox" hidden>
  <li id="city-1" role="option">Amsterdam</li>
  <li id="city-2" role="option">Brussels</li>
  <li id="city-3" role="option">Copenhagen</li>
</ul>
```

```css
[role="option"][data-active="true"] {
  background: var(--accent-subtle, #e6efff);
}

[role="combobox"]:focus-visible {
  outline: 2px solid var(--focus, #2563eb);
  outline-offset: 1px;
}
```

```js
const input = document.getElementById('city-combo');
const list  = document.getElementById('city-listbox');
const options = Array.from(list.querySelectorAll('[role="option"]'));
let activeIndex = -1;

function setActive(index) {
  if (activeIndex >= 0) options[activeIndex].removeAttribute('data-active');
  activeIndex = index;
  if (activeIndex >= 0) {
    options[activeIndex].setAttribute('data-active', 'true');
    input.setAttribute('aria-activedescendant', options[activeIndex].id);
    options[activeIndex].scrollIntoView({ block: 'nearest' });
  } else {
    input.setAttribute('aria-activedescendant', '');
  }
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (list.hidden) { list.hidden = false; input.setAttribute('aria-expanded', 'true'); }
    setActive(Math.min(activeIndex + 1, options.length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setActive(Math.max(activeIndex - 1, 0));
  } else if (e.key === 'Enter' && activeIndex >= 0) {
    e.preventDefault();
    input.value = options[activeIndex].textContent;
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  } else if (e.key === 'Escape') {
    if (!list.hidden) {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      setActive(-1);
    } else {
      input.value = '';
    }
  }
});
```

Notes :

- DOM focus NEVER leaves the input. Arrow keys do NOT call `option.focus()`.
- The active option is signaled via `aria-activedescendant="city-N"` and visually via a `data-active` attribute (or any equivalent class).
- Two-tier Esc per APG : first Esc closes the popup, second Esc clears the input.
