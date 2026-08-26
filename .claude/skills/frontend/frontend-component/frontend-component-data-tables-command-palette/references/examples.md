# Examples : data tables + command palette

Working snippets. All markup verified against [MDN: HTML table element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) (verified 2026-05-19), [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19), [APG: Table](https://www.w3.org/WAI/ARIA/apg/patterns/table/) (verified 2026-05-19), [APG: Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) (verified 2026-05-19), [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) (verified 2026-05-19).

## Pattern 1 : renderable data table (sortable, sticky, container-query reflow)

Save as `table.html` and open in a browser. Resize to see the mobile reflow.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Accessible data table demo</title>
<style>
  html { font-family: system-ui, sans-serif; color-scheme: light dark; }
  body { padding: 2rem; }

  .table-wrap {
    container-type: inline-size;
    max-block-size: 60vh;
    overflow: auto;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
  }

  table { border-collapse: separate; border-spacing: 0; inline-size: 100%; }
  caption { padding-block: 0.75rem; font-weight: 600; text-align: start; }

  thead th {
    position: sticky; inset-block-start: 0;
    background: oklch(0.97 0.02 240);
    text-align: start;
    padding: 0.75rem; border-block-end: 1px solid #ddd;
    z-index: 1;
  }
  tbody th[scope="row"], tbody td {
    padding: 0.5rem 0.75rem; border-block-end: 1px solid #eee;
    text-align: start; font-weight: normal;
  }

  th button {
    all: unset;
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 0.25rem;
  }
  th button:focus-visible { outline: 2px solid oklch(0.6 0.18 250); outline-offset: 2px; }
  th button[aria-sort="ascending"]::after  { content: "▲"; font-size: 0.75em; }
  th button[aria-sort="descending"]::after { content: "▼"; font-size: 0.75em; }
  th button[aria-sort="none"]::after       { content: "◇"; font-size: 0.75em; opacity: 0.4; }

  tbody tr:nth-child(even) { background: oklch(0.99 0.005 240); }

  /* Container-query reflow : narrow slot becomes cards */
  @container (max-width: 38rem) {
    thead { position: absolute; clip-path: inset(50%); inline-size: 1px; block-size: 1px; }
    table, tbody, tr, td, th { display: block; }
    tbody tr { padding: 0.75rem; border-block-end: 1px solid #ddd; }
    tbody td { padding: 0.25rem 0; }
    tbody td::before { content: attr(data-label) ": "; font-weight: 600; }
    tbody th[scope="row"] { font-size: 1.125rem; font-weight: 600; padding-block-end: 0.25rem; }
    thead th { /* hidden visually */ }
  }
</style>
</head>
<body>
  <h1>Q1 sales by region</h1>
  <div class="table-wrap">
    <table aria-label="Q1 sales by region">
      <caption>Q1 sales by region (EUR)</caption>
      <thead>
        <tr>
          <th scope="col"><button type="button" data-column="region" aria-sort="ascending">Region</button></th>
          <th scope="col"><button type="button" data-column="revenue" aria-sort="none">Revenue</button></th>
          <th scope="col"><button type="button" data-column="growth" aria-sort="none">Growth</button></th>
        </tr>
      </thead>
      <tbody id="rows">
        <tr><th scope="row">EU</th><td data-label="Revenue">EUR 1,234,567</td><td data-label="Growth">+5.4%</td></tr>
        <tr><th scope="row">US</th><td data-label="Revenue">EUR 2,134,890</td><td data-label="Growth">+12.1%</td></tr>
        <tr><th scope="row">APAC</th><td data-label="Revenue">EUR 987,654</td><td data-label="Growth">+8.7%</td></tr>
        <tr><th scope="row">LATAM</th><td data-label="Revenue">EUR 456,789</td><td data-label="Growth">+3.2%</td></tr>
        <tr><th scope="row">MEA</th><td data-label="Revenue">EUR 312,456</td><td data-label="Growth">+18.9%</td></tr>
      </tbody>
    </table>
  </div>

  <script>
    const rows = document.getElementById('rows');
    const headerButtons = document.querySelectorAll('thead button');

    function parseValue(td, column) {
      if (column === 'region') return td.textContent.trim();
      if (column === 'revenue') return parseFloat(td.textContent.replace(/[^\d.]/g, ''));
      if (column === 'growth') return parseFloat(td.textContent.replace(/[^\d.\-]/g, ''));
    }

    function sortRows(column, direction) {
      const tr = [...rows.querySelectorAll('tr')];
      const colIndex = column === 'region' ? 0 : (column === 'revenue' ? 1 : 2);
      tr.sort((a, b) => {
        const av = column === 'region' ? a.cells[colIndex].textContent.trim() : parseValue(a.cells[colIndex], column);
        const bv = column === 'region' ? b.cells[colIndex].textContent.trim() : parseValue(b.cells[colIndex], column);
        if (av < bv) return direction === 'ascending' ? -1 : 1;
        if (av > bv) return direction === 'ascending' ? 1 : -1;
        return 0;
      });
      tr.forEach(row => rows.appendChild(row));
    }

    headerButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = btn.getAttribute('aria-sort');
        const next = current === 'ascending' ? 'descending' : 'ascending';
        headerButtons.forEach((b) => b.setAttribute('aria-sort', 'none'));
        btn.setAttribute('aria-sort', next);
        sortRows(btn.dataset.column, next);
      });
    });
  </script>
</body>
</html>
```

Rules demonstrated :

- Native `<table>` with `<caption>`, `<thead>`, `<tbody>`, `<th scope="col">` on column headers, `<th scope="row">` on the first data column (region).
- Sortable column uses `<button>` inside `<th>` ; `aria-sort` toggles among `ascending` / `descending` / `none`.
- Sticky header via `position: sticky; inset-block-start: 0;` inside a scrolling `.table-wrap`. `border-collapse: separate` is required.
- Container-query mobile reflow : below 38rem, table layout collapses to card-per-row using `data-label` attribute for column labels.
- Visual sort indicator (arrow) is `aria-hidden`-equivalent (decorative).
- Focus visible outline meets WCAG 1.4.11.

## Pattern 2 : renderable command palette (Cmd+K)

Save as `palette.html` and open in a browser. Press Ctrl+K (Cmd+K on Mac) to open. Type to filter ; Up/Down/Enter to navigate.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Command palette demo</title>
<style>
  html { font-family: system-ui, sans-serif; color-scheme: light dark; }
  body { padding: 2rem; }
  .toolbar { display: flex; gap: 0.5rem; margin-block-end: 2rem; }
  .toolbar button {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 0.75rem; border-radius: 0.5rem;
    border: 1px solid #ccc; background: white; cursor: pointer;
  }
  .toolbar kbd {
    padding: 0.1rem 0.35rem; font-size: 0.75em;
    border: 1px solid #ccc; border-radius: 0.25rem; background: oklch(0.95 0.02 240);
  }

  dialog { padding: 0; border: 0; border-radius: 0.75rem; max-inline-size: 36rem; inline-size: 90vw; }
  dialog::backdrop { background: oklch(0 0 0 / 0.4); }

  #cmd-input {
    inline-size: 100%;
    padding: 1rem; border: 0; border-block-end: 1px solid #ddd;
    font-size: 1.125rem; outline: 0;
  }

  #cmd-listbox {
    list-style: none; padding: 0.5rem; margin: 0;
    max-block-size: 24rem; overflow: auto;
  }
  #cmd-listbox li[role="option"] {
    padding: 0.5rem 0.75rem; border-radius: 0.375rem; cursor: pointer;
  }
  #cmd-listbox li[aria-selected="true"] {
    background: oklch(0.93 0.05 250); color: oklch(0.25 0.15 250);
  }

  .visually-hidden {
    position: absolute; clip-path: inset(50%); inline-size: 1px; block-size: 1px; overflow: hidden;
  }

  #cmd-status {
    padding: 0.5rem 0.75rem; font-size: 0.875rem; color: oklch(0.5 0 0);
    border-block-start: 1px solid #eee;
  }
</style>
</head>
<body>
  <header class="toolbar">
    <button id="cmd-trigger" type="button" aria-haspopup="dialog" aria-controls="cmd-dialog">
      Search commands <kbd>Ctrl K</kbd>
    </button>
  </header>

  <p>Press <kbd>Ctrl K</kbd> (or <kbd>Cmd K</kbd> on Mac) to open the command palette. Or click the button above.</p>

  <dialog id="cmd-dialog" aria-labelledby="cmd-title">
    <h2 id="cmd-title" class="visually-hidden">Command palette</h2>
    <input
      id="cmd-input"
      role="combobox"
      aria-controls="cmd-listbox"
      aria-expanded="true"
      aria-autocomplete="list"
      aria-activedescendant=""
      autocomplete="off"
      placeholder="Type a command..."
    />
    <ul id="cmd-listbox" role="listbox" aria-label="Commands"></ul>
    <div id="cmd-status" role="status" aria-live="polite" aria-atomic="true"></div>
  </dialog>

  <script>
    const trigger = document.getElementById('cmd-trigger');
    const dialog = document.getElementById('cmd-dialog');
    const input = document.getElementById('cmd-input');
    const listbox = document.getElementById('cmd-listbox');
    const status = document.getElementById('cmd-status');

    const commands = [
      { id: 'new-file', label: 'New file' },
      { id: 'open-file', label: 'Open file' },
      { id: 'save-file', label: 'Save file' },
      { id: 'save-as', label: 'Save as...' },
      { id: 'close-tab', label: 'Close tab' },
      { id: 'reopen-tab', label: 'Reopen closed tab' },
      { id: 'find', label: 'Find in file' },
      { id: 'find-replace', label: 'Find and replace' },
      { id: 'go-to-line', label: 'Go to line' },
      { id: 'toggle-theme', label: 'Toggle light / dark mode' },
      { id: 'reload', label: 'Reload window' },
      { id: 'quit', label: 'Quit application' },
    ];

    let lastFocus = null;
    let activeIndex = -1;
    let filtered = commands.slice();

    function render() {
      listbox.innerHTML = '';
      filtered.forEach((c, i) => {
        const li = document.createElement('li');
        li.role = 'option';
        li.id = `cmd-opt-${c.id}`;
        li.textContent = c.label;
        li.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
        li.addEventListener('click', () => execute(c));
        listbox.appendChild(li);
      });
      status.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
      input.setAttribute('aria-activedescendant', filtered.length && activeIndex >= 0 ? `cmd-opt-${filtered[activeIndex].id}` : '');
    }

    function filter(query) {
      const q = query.trim().toLowerCase();
      filtered = q ? commands.filter(c => c.label.toLowerCase().includes(q)) : commands.slice();
      activeIndex = filtered.length ? 0 : -1;
      render();
    }

    function move(delta) {
      if (!filtered.length) return;
      activeIndex = (activeIndex + delta + filtered.length) % filtered.length;
      render();
      const el = document.getElementById(`cmd-opt-${filtered[activeIndex].id}`);
      el?.scrollIntoView({ block: 'nearest' });
    }

    function execute(c) {
      console.log('Execute', c.id);
      close();
    }

    function open() {
      lastFocus = document.activeElement;
      filter('');
      input.value = '';
      dialog.showModal();
      input.focus();
    }

    function close() {
      dialog.close();
    }

    trigger.addEventListener('click', open);

    window.addEventListener('keydown', (e) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'k' && !e.repeat) { e.preventDefault(); open(); }
    });

    input.addEventListener('input', () => filter(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { move(1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { move(-1); e.preventDefault(); }
      else if (e.key === 'Enter' && filtered[activeIndex]) { execute(filtered[activeIndex]); e.preventDefault(); }
    });

    dialog.addEventListener('close', () => {
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    });
  </script>
</body>
</html>
```

Rules demonstrated :

- `<button id="cmd-trigger">` is the visible UI alternative for the Cmd+K shortcut (WCAG 2.1.1).
- `<dialog>` + `showModal()` provides focus trap, Escape to close, and inert-on-rest automatically.
- Combobox role on the `<input>` ; listbox role on the `<ul>` ; options with unique ids.
- `aria-activedescendant` references the highlighted option's id ; DOM focus stays on the input.
- `aria-autocomplete="list"` tells AT that the listbox filters as the user types.
- Live region `<div role="status">` announces the filtered result count politely.
- Cmd+K handler uses `e.metaKey` on Mac / `e.ctrlKey` elsewhere.
- Focus restore on close via `dialog.addEventListener('close', ...)`.

## Pattern 3 : indeterminate select-all checkbox

```html
<th scope="col" style="inline-size: 2rem">
  <input type="checkbox" id="select-all" aria-label="Select all rows">
</th>
```

```js
const all = document.getElementById('select-all');
const rows = document.querySelectorAll('tbody input[type=checkbox]');

function update() {
  const checked = [...rows].filter(c => c.checked).length;
  all.checked = checked === rows.length;
  all.indeterminate = checked > 0 && checked < rows.length;
}

all.addEventListener('change', () => rows.forEach(c => (c.checked = all.checked)));
rows.forEach(c => c.addEventListener('change', update));
```

## Pattern 4 : sticky first column horizontal scroll

```css
.scroll-table { overflow-x: auto; max-inline-size: 100%; }
.scroll-table table { min-inline-size: 60rem; border-collapse: separate; border-spacing: 0; }
.scroll-table thead th { position: sticky; inset-block-start: 0; background: white; z-index: 2; }
.scroll-table th:first-child, .scroll-table td:first-child {
  position: sticky; inset-inline-start: 0; background: white; z-index: 1;
}
.scroll-table thead th:first-child { z-index: 3; }   /* top-left corner above both */
```

## Pattern 5 : virtualised table with `aria-rowindex`

```html
<table aria-rowcount="10000" aria-label="Transactions">
  <thead>
    <tr aria-rowindex="1">
      <th scope="col">Date</th><th scope="col">Amount</th><th scope="col">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr aria-rowindex="42">
      <td>2026-04-12</td><td>EUR 123.45</td><td>Order #1234</td>
    </tr>
    <tr aria-rowindex="43">
      <td>2026-04-11</td><td>EUR 67.89</td><td>Order #1235</td>
    </tr>
  </tbody>
</table>
```

Only two rows are in the DOM but the table announces "row 42 of 10000".

## Pattern 6 : ARIA grid with arrow-key navigation (for spreadsheet-like editors)

```html
<div role="grid" aria-label="Editable cells" tabindex="0">
  <div role="row">
    <div role="gridcell" tabindex="0">A1</div>
    <div role="gridcell" tabindex="-1">B1</div>
  </div>
  <div role="row">
    <div role="gridcell" tabindex="-1">A2</div>
    <div role="gridcell" tabindex="-1">B2</div>
  </div>
</div>
```

Use ARIA grid pattern when arrow keys MUST move between cells. Most data tables do NOT need this ; native `<table>` is the right default.

## Pattern 7 : Cmd+K with input-focused exception

```js
window.addEventListener('keydown', (e) => {
  const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
  if (!(mod && e.key === 'k')) return;
  const tag = document.activeElement?.tagName;
  const editable = document.activeElement?.isContentEditable;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) return;   // let the user's input handle it
  e.preventDefault();
  open();
});
```

When the user is typing in an input or contenteditable, do NOT hijack Cmd+K. Otherwise open the palette.

## Pattern 8 : table summary via `<caption>` + supplementary description

```html
<table aria-describedby="sales-desc">
  <caption>Q1 sales by region (EUR)</caption>
  ...
</table>
<p id="sales-desc">All amounts are pre-tax. Growth is year-over-year compared to Q1 of the previous year.</p>
```

`<caption>` provides the table's accessible name ; `aria-describedby` adds the longer description that does not need to be the table's name.
