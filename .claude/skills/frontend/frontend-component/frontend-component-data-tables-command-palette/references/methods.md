# Methods : data tables + command palette

Sources : [MDN: HTML table element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) (verified 2026-05-19), [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19), [APG: Table](https://www.w3.org/WAI/ARIA/apg/patterns/table/) (verified 2026-05-19), [APG: Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) (verified 2026-05-19), [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) (verified 2026-05-19).

## 1. `<table>` semantic surface

| Element | Purpose | Required ? |
|---------|---------|-----------|
| `<table>` | Container | yes |
| `<caption>` | Table accessible name; MUST be first child of `<table>` | recommended (or `aria-label`) |
| `<thead>` | Group of header rows | recommended for multi-row tables |
| `<tbody>` | Group of data rows | required (implicit if omitted) |
| `<tfoot>` | Group of footer rows (totals) | optional |
| `<colgroup>` / `<col>` | Column-level styling hooks | optional |
| `<tr>` | Row | yes |
| `<th>` | Header cell | yes for header rows |
| `<td>` | Data cell | yes for data rows |

### `<th scope>` values

| Value | Header applies to |
|-------|-------------------|
| `col` | Column below |
| `row` | Row to the right (logical inline-end) |
| `colgroup` | Multiple columns (use with `colspan`) |
| `rowgroup` | Multiple rows (use with `rowspan`) |

### Complex tables : `id` + `headers`

For irregular tables with `colspan` / `rowspan`, simple `scope` is insufficient. Each header gets an `id`; each cell references the headers it belongs to via `headers="id1 id2"`.

```html
<th id="name">Name</th>
<th id="joined" colspan="2">Membership Dates</th>
...
<td headers="name">John</td>
<td headers="joined">2020</td>
```

### Deprecated attributes (do not use)

`align`, `bgcolor`, `border`, `cellpadding`, `cellspacing`, `frame`, `rules`, `summary`, `width`. Use CSS instead. The `summary` attribute is replaced by `<caption>` or `aria-describedby`.

## 2. ARIA attributes for tables

| Attribute | On | Purpose |
|-----------|-----|---------|
| `aria-label` / `aria-labelledby` | `<table>` | Accessible name when `<caption>` is not used. |
| `aria-describedby` | `<table>` | Supplementary description (long table summary). |
| `aria-sort` | `<th>` of sorted column | `ascending` / `descending` / `none` / `other`. Exactly ONE `<th>` should not be `none` at a time. |
| `aria-rowcount` | `<table>` | Total row count when DOM is virtualised. |
| `aria-colcount` | `<table>` | Total column count when columns are virtualised. |
| `aria-rowindex` | `<tr>` | 1-based row index in the FULL dataset (not the current DOM). |
| `aria-colindex` | `<td>` / `<th>` | 1-based column index. |
| `aria-rowspan` / `aria-colspan` | cell | Match the visual span when native `rowspan` / `colspan` are not present. |

## 3. ARIA Table vs ARIA Grid

Per [APG: Table](https://www.w3.org/WAI/ARIA/apg/patterns/table/) (verified 2026-05-19) and [APG: Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) (verified 2026-05-19) :

| Pattern | Role | Interaction |
|---------|------|-------------|
| Native HTML `<table>` | implicit `table` | Tab moves between focusable elements within cells. All focusable elements are in the page tab order. |
| ARIA Table (`role="table"`) | static tabular | Same interaction model as native ; only use when native cannot be used (e.g. virtualised in a custom scroll container). |
| ARIA Grid (`role="grid"`) | composite widget | Arrow keys move between cells. SINGLE TABSTOP for the whole grid ; F2 enters edit mode ; Escape exits edit mode. |

Rule of thumb : start with native `<table>`. Move to ARIA Grid ONLY when the keyboard model needs to be arrow-keys-between-cells (spreadsheet, large data editor). Use ARIA Table ONLY when you cannot use native (very rare).

## 4. ARIA Grid keyboard model

Per [APG: Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) (verified 2026-05-19).

| Key | Action |
|-----|--------|
| Arrow keys | Move focus between cells (Left / Right / Up / Down). |
| Home / End | First / last cell of the current row. |
| Ctrl+Home / Ctrl+End | First / last cell of the entire grid. |
| Page Up / Page Down | Move by a page (author-determined number of rows). |
| F2 | Enter edit mode on an editable cell. |
| Escape | Exit edit mode ; return to navigation. |

## 5. `position: sticky` recipe for tables

Per [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) (verified 2026-05-19) :

```css
.table-wrap {
  max-block-size: 60vh;
  overflow: auto;
}

table { border-collapse: separate; border-spacing: 0; }

thead th {
  position: sticky;
  inset-block-start: 0;
  background: white;
  z-index: 1;
}
```

Rules :

- The scrolling ancestor MUST have `overflow: auto` or `overflow: scroll` AND a constrained size.
- `position: sticky` REQUIRES a non-`auto` inset value on at least one axis.
- NEVER use `border-collapse: collapse` with sticky ; the collapsed border lets the body show through.
- Provide a `background` on sticky cells; otherwise the scrolling body shows through.
- Sticky creates a stacking context ; assign `z-index` for layering with other elements.

## 6. Sortable column pattern

```html
<th scope="col">
  <button type="button" aria-sort="ascending" data-column="region">
    Region
    <span class="sort-indicator" aria-hidden="true"></span>
  </button>
</th>
```

Rules :

- A `<button>` (native) carries the click + keyboard activation, focus, `:focus-visible`. NEVER a `<div>` with a click handler.
- `aria-sort` is set on the `<th>` (or on the inner button ; both spec-valid).
- Visual indicator (arrow) inside the button is `aria-hidden` because the announcement comes from `aria-sort`.
- Sort by clicking the column or pressing Enter / Space on the focused button.

## 7. Indeterminate checkbox for select-all

```js
selectAll.checked = checkedCount === total;
selectAll.indeterminate = checkedCount > 0 && checkedCount < total;
```

`indeterminate` is a JavaScript property only ; there is no HTML `indeterminate` attribute. Screen readers announce it as "mixed" or "partially checked".

## 8. Command-palette : APG Combobox state machine

Per [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19).

### Roles and attributes

| Element | Role | Attributes |
|---------|------|------------|
| Search input | `combobox` | `aria-controls="<listbox-id>"`, `aria-expanded="true|false"`, `aria-autocomplete="list"`, `aria-activedescendant="<option-id>"` (or empty), `autocomplete="off"` |
| Listbox container | `listbox` | id matches `aria-controls`, `aria-label` describing the list |
| Option | `option` | unique id ; `aria-selected="true"` on the active option referenced by `aria-activedescendant` |

### Keyboard model

| Key | Action |
|-----|--------|
| ArrowDown (popup closed) | Open popup; move highlight to first option. |
| ArrowUp (popup closed) | Open popup; move highlight to last option (optional). |
| ArrowDown / ArrowUp (popup open) | Move highlight by 1. |
| Enter | Accept the highlighted option ; close popup. |
| Escape | Close popup ; optionally clear input. |
| Alt+ArrowDown | Open popup without moving highlight. |
| typing | Filter the listbox ; reset highlight to first match. |

### Focus model (critical)

DOM focus STAYS on the combobox input. `aria-activedescendant` references the highlighted option's `id`. NEVER move DOM focus into the listbox; typing flow breaks.

## 9. Cmd+K global hotkey registration

```js
window.addEventListener('keydown', (e) => {
  const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
  if (mod && e.key === 'k' && !e.repeat) {
    e.preventDefault();
    openPalette();
  }
});
```

Rules :

- Use `e.metaKey` on Mac (Cmd) and `e.ctrlKey` elsewhere ; navigator detection or platform-specific feature detection picks the right modifier.
- `e.preventDefault()` stops the browser's default Cmd+K behaviour (which opens the address bar in some browsers).
- WCAG 2.1.1 Keyboard : the hotkey MUST have a visible UI alternative (e.g. a "Search" button in the toolbar).

## 10. Dialog focus restore

```js
let lastFocus = null;

function open() {
  lastFocus = document.activeElement;
  dialog.showModal();
  input.focus();
}

dialog.addEventListener('close', () => {
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
});
```

`<dialog>showModal()` provides focus trap, Escape to close, and inert-on-rest automatically. Focus RESTORE on close is the author's responsibility.

## 11. Mobile table reflow recipes

### Recipe A : horizontal scroll

```css
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;   /* legacy iOS smooth scroll */
}
.table-scroll table { min-inline-size: 60rem; }   /* force a min width to trigger scroll */
```

### Recipe B : container-query card reflow

```css
.table-wrap { container-type: inline-size; }

@container (max-width: 40rem) {
  table, thead, tbody, tr, th, td { display: block; }
  thead { position: absolute; clip: rect(0 0 0 0); }   /* visually hide on mobile */
  tr { padding: 1rem; border-block-end: 1px solid #ddd; }
  td { padding-block: 0.25rem; }
  td::before { content: attr(data-label) ": "; font-weight: 600; }
}
```

`data-label` attribute on each `<td>` provides the column name for the reflowed card.

### Recipe C : hide-some-columns

```css
.table-wrap { container-type: inline-size; }
@container (max-width: 30rem) {
  th:nth-child(n+4), td:nth-child(n+4) { display: none; }
}
```

Only the first three columns remain on narrow viewports. Provide a "show all columns" toggle as an accessible alternative.

## 12. WCAG 2.1.1 keyboard rule

Every functionality available via mouse / pointer MUST also be operable from a keyboard, AND every keyboard shortcut MUST have a visible UI equivalent. A Cmd+K command palette without a visible trigger button violates 2.1.1 because users who do not know the shortcut cannot reach the feature.

The visible alternative is typically a button in the toolbar :

```html
<button type="button" id="cmd-trigger" aria-haspopup="dialog">
  Search commands <kbd>Ctrl K</kbd>
</button>
```

The `<kbd>` element advertises the shortcut to sighted users.
