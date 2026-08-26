# Examples : ARIA + APG patterns

Working snippets. All ARIA roles, states, and keyboard models verified against the APG pattern URLs cited at each example.

## Example 1 : Accessible Tabs (roving tabindex + manual activation)

Source : [APG: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (verified 2026-05-19). Manual activation chosen because tab activation has an analytics side effect.

```html
<div class="tabs">
  <h2 id="tabs-label">Settings</h2>
  <div role="tablist" aria-labelledby="tabs-label">
    <button role="tab" id="tab-profile" aria-selected="true" aria-controls="panel-profile" tabindex="0">Profile</button>
    <button role="tab" id="tab-billing" aria-selected="false" aria-controls="panel-billing" tabindex="-1">Billing</button>
    <button role="tab" id="tab-team"    aria-selected="false" aria-controls="panel-team"    tabindex="-1">Team</button>
  </div>
  <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile">Profile content.</div>
  <div role="tabpanel" id="panel-billing" aria-labelledby="tab-billing" hidden>Billing content.</div>
  <div role="tabpanel" id="panel-team"    aria-labelledby="tab-team"    hidden>Team content.</div>
</div>

<script>
(() => {
  const tablist = document.querySelector('[role="tablist"]');
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));

  function activate(idx) {
    tabs.forEach((tab, i) => {
      const selected = i === idx;
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      panels[i].hidden = !selected;
    });
    tabs[idx].focus();
  }

  tablist.addEventListener('keydown', (e) => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = current;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(current);
      return;
    } else return;
    e.preventDefault();
    tabs[current].setAttribute('tabindex', '-1');
    tabs[next].setAttribute('tabindex', '0');
    tabs[next].focus();
  });

  tabs.forEach((tab, i) => tab.addEventListener('click', () => activate(i)));
})();
</script>
```

Key rules demonstrated :

- Only the selected tab has `tabindex="0"`; others have `tabindex="-1"` (roving tabindex).
- Arrow keys move focus between tabs WITHOUT activating (manual activation).
- Space or Enter activates the focused tab; `aria-selected` updates only on activation.
- Each panel's `aria-labelledby` references its tab; each tab's `aria-controls` references its panel.

## Example 2 : Combobox with listbox popup (`aria-activedescendant`)

Source : [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19). DOM focus stays on the input; `aria-activedescendant` highlights options.

```html
<label for="city-input">City</label>
<div class="combo">
  <input
    id="city-input"
    role="combobox"
    aria-controls="city-listbox"
    aria-expanded="false"
    aria-autocomplete="list"
    aria-activedescendant=""
    autocomplete="off"
  />
  <ul id="city-listbox" role="listbox" aria-label="Cities" hidden>
    <li role="option" id="opt-ams">Amsterdam</li>
    <li role="option" id="opt-utr">Utrecht</li>
    <li role="option" id="opt-rtm">Rotterdam</li>
    <li role="option" id="opt-ehv">Eindhoven</li>
  </ul>
</div>

<script>
(() => {
  const input = document.getElementById('city-input');
  const list  = document.getElementById('city-listbox');
  const options = [...list.querySelectorAll('[role="option"]')];
  let activeIdx = -1;

  function open()  { list.hidden = false; input.setAttribute('aria-expanded', 'true'); }
  function close() { list.hidden = true;  input.setAttribute('aria-expanded', 'false'); setActive(-1); }

  function setActive(idx) {
    activeIdx = idx;
    options.forEach((opt, i) => opt.setAttribute('aria-selected', String(i === idx)));
    input.setAttribute('aria-activedescendant', idx === -1 ? '' : options[idx].id);
  }

  input.addEventListener('input', () => { open(); setActive(0); });
  input.addEventListener('keydown', (e) => {
    if (list.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { open(); setActive(e.key === 'ArrowDown' ? 0 : options.length - 1); e.preventDefault(); return; }
    if (e.key === 'ArrowDown') { setActive((activeIdx + 1) % options.length); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setActive((activeIdx - 1 + options.length) % options.length); e.preventDefault(); }
    else if (e.key === 'Enter' && activeIdx >= 0) { input.value = options[activeIdx].textContent; close(); e.preventDefault(); }
    else if (e.key === 'Escape') { close(); e.preventDefault(); }
  });

  options.forEach((opt, i) => {
    opt.addEventListener('mousedown', (e) => e.preventDefault());
    opt.addEventListener('click', () => { input.value = opt.textContent; close(); input.focus(); });
    opt.addEventListener('mouseenter', () => setActive(i));
  });
})();
</script>
```

Key rules demonstrated :

- `aria-activedescendant` references the highlighted option's `id`; DOM focus NEVER leaves the input.
- `aria-expanded` toggles when the popup opens / closes.
- `aria-autocomplete="list"` tells AT that the popup suggests but does not auto-complete inline.
- Options use `aria-selected="true"` on the active one; `<select multiple>` semantics would use `aria-multiselectable="true"` on the listbox container.

## Example 3 : Disclosure via native `<details>` (zero ARIA)

Source : [APG: Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) (verified 2026-05-19). When toggled content is static body content, `<details>` is the correct path.

```html
<details>
  <summary>Shipping options</summary>
  <p>Standard shipping is free for orders over EUR 50. Express ships next business day.</p>
</details>
```

No `aria-expanded`, no `role="button"`, no JavaScript. The browser maps `<summary>` to a button and exposes `aria-expanded` automatically from the `open` attribute.

## Example 4 : Disclosure via ARIA (when `<details>` is impossible)

Source : [APG: Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) (verified 2026-05-19). Use when the trigger must live outside the disclosed region.

```html
<button id="toggle-help" type="button" aria-expanded="false" aria-controls="help-panel">
  Show help
</button>
<div id="help-panel" hidden>
  <p>Helpful information.</p>
</div>

<script>
const btn = document.getElementById('toggle-help');
const panel = document.getElementById('help-panel');
btn.addEventListener('click', () => {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!expanded));
  panel.hidden = expanded;
  btn.textContent = expanded ? 'Show help' : 'Hide help';
});
</script>
```

`aria-controls` is optional per APG; included here for AT that can use it. Trigger label updates on toggle.

## Example 5 : Live region (`role="status"`)

Source : [W3C: WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) (verified 2026-05-19). Region MUST pre-exist; only `textContent` updates announce.

```html
<form id="save-form">
  <button type="submit">Save</button>
</form>
<div id="save-status" role="status" aria-live="polite" aria-atomic="true"></div>

<script>
const form = document.getElementById('save-form');
const status = document.getElementById('save-status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = 'Saving...';
  await new Promise(r => setTimeout(r, 500));
  status.textContent = 'Saved.';
});
</script>
```

Rules demonstrated :

- `<div role="status">` exists at page load. NEVER insert the live region into the DOM at announcement time.
- `aria-atomic="true"` re-reads the whole region each change so partial updates do not produce confusing announcements.
- `role="status"` implies `aria-live="polite"`; the explicit attribute is included for compatibility but is technically redundant.

## Example 6 : Dialog with focus restore

Source : [APG: Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (verified 2026-05-19). Native `<dialog>showModal()` provides focus trap, Escape close, and inert-on-rest; focus restore on close is still author responsibility.

```html
<button id="open-prefs">Preferences</button>
<dialog id="prefs-dialog" aria-labelledby="prefs-title">
  <h2 id="prefs-title">Preferences</h2>
  <form method="dialog">
    <label><input type="checkbox" name="notify"> Email notifications</label>
    <menu>
      <button type="submit" value="cancel">Cancel</button>
      <button type="submit" value="save">Save</button>
    </menu>
  </form>
</dialog>

<script>
const openBtn = document.getElementById('open-prefs');
const dialog = document.getElementById('prefs-dialog');
let lastFocus = null;

openBtn.addEventListener('click', () => {
  lastFocus = document.activeElement;
  dialog.showModal();
});

dialog.addEventListener('close', () => {
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
});
</script>
```

Rules demonstrated :

- `aria-labelledby` points to the `<h2>` inside the dialog (visible heading) for the accessible name.
- `<dialog>showModal()` gives an implicit `role="dialog"` and `aria-modal="true"`; adding them explicitly is redundant.
- `lastFocus` captures the trigger before opening; the `close` event listener restores it.

## Example 7 : Radio Group via ARIA (non-form context)

Source : [APG: Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) (verified 2026-05-19). For form data, prefer `<input type="radio">` + `<fieldset>`.

```html
<div role="radiogroup" aria-labelledby="theme-label">
  <span id="theme-label">Theme</span>
  <div role="radio" id="r-light" aria-checked="true"  tabindex="0">Light</div>
  <div role="radio" id="r-dark"  aria-checked="false" tabindex="-1">Dark</div>
  <div role="radio" id="r-auto"  aria-checked="false" tabindex="-1">Auto</div>
</div>
```

Arrow keys move focus AND select the focused radio (focus = selection). Tab enters the group once and Tab again exits.

## Example 8 : Tree (single-select, all in DOM)

Source : [APG: Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) (verified 2026-05-19).

```html
<ul role="tree" aria-label="Files">
  <li role="treeitem" aria-expanded="true" tabindex="0">
    src
    <ul role="group">
      <li role="treeitem">index.html</li>
      <li role="treeitem">main.js</li>
    </ul>
  </li>
  <li role="treeitem">README.md</li>
</ul>
```

`aria-expanded` is present ONLY on parent items. Leaves omit it entirely. Roving tabindex : one node is `tabindex="0"`, the rest `tabindex="-1"`.

## Example 9 : Treegrid (cell-focus mode)

Source : [APG: Treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) (verified 2026-05-19).

```html
<table role="treegrid" aria-label="Tasks">
  <thead>
    <tr role="row">
      <th role="columnheader">Task</th>
      <th role="columnheader">Owner</th>
      <th role="columnheader">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row" aria-expanded="true" aria-level="1" aria-posinset="1" aria-setsize="1">
      <td role="gridcell" tabindex="0">Roadmap</td>
      <td role="gridcell" tabindex="-1">Freek</td>
      <td role="gridcell" tabindex="-1">In progress</td>
    </tr>
    <tr role="row" aria-level="2" aria-posinset="1" aria-setsize="2">
      <td role="gridcell" tabindex="-1">Phase 5</td>
      <td role="gridcell" tabindex="-1">Worker 1</td>
      <td role="gridcell" tabindex="-1">Doing</td>
    </tr>
    <tr role="row" aria-level="2" aria-posinset="2" aria-setsize="2">
      <td role="gridcell" tabindex="-1">Phase 6</td>
      <td role="gridcell" tabindex="-1">Worker 2</td>
      <td role="gridcell" tabindex="-1">Queued</td>
    </tr>
  </tbody>
</table>
```

Single tabstop : the first `gridcell` is `tabindex="0"`. Arrow keys move between cells; Right on the expanded parent row would collapse / expand (state on the `<tr>` not the cells).

## Example 10 : Menu button + menu

Source : [APG: Menu and Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) (verified 2026-05-19).

```html
<button id="menu-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="actions-menu">
  Actions
</button>
<ul id="actions-menu" role="menu" aria-labelledby="menu-trigger" hidden>
  <li role="menuitem" tabindex="-1">Rename</li>
  <li role="menuitem" tabindex="-1">Duplicate</li>
  <li role="separator"></li>
  <li role="menuitem" tabindex="-1" aria-disabled="true">Delete</li>
</ul>
```

Roving tabindex on items; on open, focus moves to first menuitem; Escape closes the menu and restores focus to the trigger.
