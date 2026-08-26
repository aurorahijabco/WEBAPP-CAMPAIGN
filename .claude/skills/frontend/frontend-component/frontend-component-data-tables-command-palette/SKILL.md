---
name: frontend-component-data-tables-command-palette
description: >
  Use when building an accessible data table (semantic markup, sortable columns, sticky header that stays put while users scroll long lists, mobile-safe reflow strategy, row selection with select-all and indeterminate state, virtualised tables that need `aria-rowcount` / `aria-colcount`), when adding a Cmd+K (Ctrl+K on non-Mac) command palette to a product so power users can jump to any feature or run any command without leaving the keyboard, or when an existing `<div role="table">` mess needs to be refactored to a native `<table>` for keyboard support and free a11y.
  Prevents the `<div role="table">` and `<div role="row">` anti-pattern (loses keyboard semantics that the native `<table>` gives for free), missing `scope` on `<th>` (screen readers cannot associate header with cells), sortable column header built as a `<div>` with a click handler (no keyboard activation, no focus, no `:focus-visible`), `<thead>` declared `position: sticky` without a scrolling parent (it never sticks; the parent MUST have `overflow: auto` and a height constraint), command palette built without focus restoration (focus jumps to body when closed), command palette listbox using DOM focus on options instead of `aria-activedescendant` (typing in the input breaks; the APG combobox pattern is explicit), keyboard-only Cmd+K with no visible trigger button (WCAG 2.1.1 violation), and missing `<caption>` or `aria-label` on a data table (screen-reader users have no context).
  Covers the native `<table>` surface (`<caption>`, `<thead>`, `<tbody>`, `<tfoot>`, `<th>` with `scope="col" / "row" / "colgroup" / "rowgroup"`, `headers="<id>"` for complex tables with `colspan` / `rowspan`), `aria-sort` (`ascending` / `descending` / `none` / `other`) on the sorted column header, `aria-rowcount` and `aria-colcount` for virtualised tables, the `<th><button aria-sort="...">` sortable-column pattern, `position: sticky; inset-block-start: 0;` on `<thead>` inside a scrolling wrapper, the mobile-table strategy matrix (horizontal scroll vs container-query card reflow vs hide-some-columns), row selection with `<input type="checkbox" aria-label="...">` and an indeterminate header checkbox, the command-palette pattern using `<dialog>showModal()` for focus trap and Escape, the APG Combobox pattern with `aria-activedescendant` (DOM focus stays on the search input), the global Cmd+K / Ctrl+K hotkey registration pattern, and the WCAG 2.1.1 rule that every keyboard shortcut MUST have a visible UI equivalent.
  Keywords: data table, accessible table, native HTML table, table semantic markup, table caption, table th scope, table aria-sort, table aria-rowcount, table aria-colcount, sticky header, position sticky, sortable column, indeterminate checkbox, row selection, select-all checkbox, virtualised table, command palette, Cmd-K, Ctrl-K, command palette pattern, ARIA combobox, role listbox, aria-activedescendant, aria-expanded, aria-controls, aria-haspopup, dialog showModal, focus trap, focus restore, mobile table reflow, container-query table, table on mobile, horizontal scroll table, table not accessible, screen reader does not announce sort, mobile table overflow, command palette focus broken, table sort breaks keyboard, header not sticky, cmd+K not working, how do I make an accessible data table, sortable table HTML, command palette pattern, Cmd K dialog, table on mobile, accessible table header, how to add cmd K, what is command palette.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Component Data Tables + Command Palette

This skill packages two related component patterns : the accessible data table and the Cmd+K command palette. Both rely on the APG Combobox pattern (the palette directly; the sortable-table header sometimes indirectly), and both must respect focus management rules. This skill builds on `[[frontend-a11y-aria-patterns]]` (ARIA roles), `[[frontend-a11y-focus-keyboard-inert]]` (focus rules and the `inert` attribute), and `[[frontend-impl-popover-dialog-anchor]]` (`<dialog>showModal()`).

Sources : [MDN: HTML table element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) (verified 2026-05-19), [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19), [APG: Table](https://www.w3.org/WAI/ARIA/apg/patterns/table/) (verified 2026-05-19), [APG: Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) (verified 2026-05-19), [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) (verified 2026-05-19).

## Quick Reference

### Native `<table>` skeleton

```html
<table>
  <caption>Q1 sales by region</caption>
  <thead>
    <tr>
      <th scope="col"><button type="button" aria-sort="ascending">Region</button></th>
      <th scope="col"><button type="button" aria-sort="none">Revenue</button></th>
      <th scope="col"><button type="button" aria-sort="none">Growth</button></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">EU</th>
      <td>EUR 1,234,567</td>
      <td>+5.4%</td>
    </tr>
  </tbody>
</table>
```

Rules :

- `<caption>` (first child of `<table>`) provides the accessible name. Use `aria-label` ONLY when no visible caption fits the design.
- `<th scope="col">` and `<th scope="row">` associate headers with cells so screen readers can announce "Revenue, EU, EUR 1,234,567".
- The deprecated `summary` attribute is dropped per [MDN: HTML table element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) (verified 2026-05-19).
- For tables with `colspan` / `rowspan` the simple `scope` mechanism is insufficient ; use `id` on headers and `headers="<id-list>"` on cells.

### `aria-sort` values

| Value | Meaning |
|-------|---------|
| `ascending` | Column is sorted ascending. |
| `descending` | Column is sorted descending. |
| `none` (default) | Column is not the active sort. |
| `other` | Sorted by a non-standard order (e.g. by a derived score). |

Exactly ONE `<th>` should be `ascending` or `descending` at a time ; the rest are `none`.

### Sticky `<thead>`

```css
.table-wrap {
  max-block-size: 60vh;
  overflow: auto;          /* required : sticky needs a scrolling ancestor */
}
.table-wrap thead th {
  position: sticky;
  inset-block-start: 0;
  background: white;       /* required : header would otherwise scroll under */
}
```

Per [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) (verified 2026-05-19), `position: sticky` requires a non-`auto` inset value AND a scrolling ancestor. NEVER use `border-collapse: collapse` together with sticky headers ; the collapsed border lets the body show through. Use `border-collapse: separate; border-spacing: 0;` instead.

### `aria-rowcount` / `aria-colcount` for virtualised tables

When the DOM contains only the visible rows (virtualisation), declare the total counts so screen readers can announce position :

```html
<table aria-rowcount="10000" aria-colcount="5">
  <tbody>
    <tr aria-rowindex="42">
      <td aria-colindex="1">...</td>
    </tr>
  </tbody>
</table>
```

`aria-rowindex` is 1-based and reflects the row's position in the FULL dataset, not just the current DOM.

### Mobile table strategy matrix

| Strategy | When |
|----------|------|
| Horizontal scroll (`display: block; overflow-x: auto;` on `<table>`) | Few columns, all important; scrolling is acceptable. |
| Container-query card reflow | Many columns; cards on narrow viewports stack key-value pairs vertically. |
| Hide-some-columns | Each row has a "primary" identity column; secondary columns hide below a threshold. |

NEVER force a many-column table to fit a phone viewport without one of these strategies ; the result is unreadable squeezed columns.

### Command palette skeleton (Cmd+K)

```html
<button id="cmd-trigger" type="button" aria-haspopup="dialog" aria-controls="cmd-dialog">
  Search commands <kbd>Ctrl K</kbd>
</button>

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
  <ul id="cmd-listbox" role="listbox" aria-label="Commands">
    <li role="option" id="cmd-opt-1">Open file</li>
    <li role="option" id="cmd-opt-2">Save file</li>
  </ul>
</dialog>
```

```js
const trigger = document.getElementById('cmd-trigger');
const dialog = document.getElementById('cmd-dialog');
const input = document.getElementById('cmd-input');
let lastFocus = null;

trigger.addEventListener('click', open);
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open(); }
});

function open() {
  lastFocus = document.activeElement;
  dialog.showModal();
  input.focus();
}

dialog.addEventListener('close', () => {
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
});
```

Per [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19) :

- `role="combobox"` on the input, `aria-controls` pointing to the listbox, `aria-expanded` reflecting popup state, `aria-autocomplete="list"`.
- DOM focus stays on the input ; `aria-activedescendant` references the highlighted option's id.
- NEVER move DOM focus into the listbox.

### WCAG 2.1.1 : keyboard shortcut MUST have a visible alternative

A Cmd+K shortcut without a visible trigger button violates WCAG 2.1.1 Keyboard. Provide BOTH :

- The visible trigger button (`<button>Search commands ⌘K</button>`).
- The keyboard shortcut listener.

The button MUST do exactly the same thing as the shortcut.

## Decision Trees

### Decision : native `<table>` or `<div role="table">`?

```
What is the content?

  Tabular data with rows and columns that semantically belong together
  (sales by region, users by status, transactions).
    -> Native <table>. Free keyboard semantics, free screen-reader
       announcement of "row N of M, column X", free header-cell
       association via scope. No ARIA needed.

  Tabular layout for VISUAL alignment, not semantic tabular data
  (a CSS layout that happens to look like a table).
    -> Use CSS Grid. NEVER use <table> for layout. NEVER use
       <div role="table"> for layout.

  Tabular data that requires composite-widget keyboard model
  (arrow keys move between cells, F2 enters edit mode, single
  tabstop in the whole table).
    -> ARIA grid pattern with role="grid" + role="row" + role="cell".
       Heavier to implement; only when the interaction model
       genuinely matches grid (spreadsheet, large data editor).

  Tabular data with virtualisation (DOM holds only visible rows).
    -> Native <table> with aria-rowcount / aria-colcount AND
       aria-rowindex / aria-colindex on the visible rows.
```

### Decision : mobile table strategy?

```
How many columns and how critical is each?

  3-4 columns, all critical.
    -> Horizontal scroll. <table> set to display:block; overflow-x:auto.
       Optionally make the first column sticky:
         th:first-child, td:first-child { position: sticky; inset-inline-start: 0; }

  5-8 columns, primary identity + secondary data.
    -> Hide secondary columns below a threshold with a container query:
         @container (max-width: 30rem) {
           th:nth-child(n+4), td:nth-child(n+4) { display: none; }
         }
       Provide a "show all columns" button as an accessible alternative.

  Many columns OR a card-feel preferred on mobile.
    -> Container-query reflow to card layout. Below the threshold,
       each row becomes a labelled grid of key-value pairs. Heavier
       to implement; best mobile reading experience.

  Free-form data that does not have natural keys.
    -> Reconsider whether a table is the right pattern at all.
       A card list with sort and filter may be a better fit.
```

### Decision : command palette focus model?

```
Always : aria-activedescendant on the combobox input.

NEVER move DOM focus into the listbox while the user types. The APG
Combobox pattern explicitly states this for listbox / grid / tree
popups. Moving DOM focus into the popup breaks the typing flow and
screen-reader announcement.

For a dialog popup (e.g. multi-step command that opens its own form),
DO move DOM focus into the dialog after the user selects the option,
and restore to the input or original trigger on close.
```

## Patterns

### Pattern 1 : sortable + sticky + responsive table (full demo)

See [examples.md](references/examples.md#pattern-1-renderable-data-table) for the complete renderable HTML page.

### Pattern 2 : command palette dialog

See [examples.md](references/examples.md#pattern-2-renderable-command-palette) for the complete renderable HTML page.

### Pattern 3 : indeterminate select-all checkbox

```html
<th scope="col">
  <input type="checkbox" id="select-all" aria-label="Select all rows">
</th>
```

```js
const selectAll = document.getElementById('select-all');
const rowChecks = document.querySelectorAll('tbody input[type=checkbox]');

function updateHeader() {
  const checked = [...rowChecks].filter(c => c.checked).length;
  selectAll.checked = checked === rowChecks.length;
  selectAll.indeterminate = checked > 0 && checked < rowChecks.length;
}

selectAll.addEventListener('change', () => {
  rowChecks.forEach(c => c.checked = selectAll.checked);
});
rowChecks.forEach(c => c.addEventListener('change', updateHeader));
```

`indeterminate` is a JS-only property (not an HTML attribute) ; screen readers announce "mixed" or "partially checked".

### Pattern 4 : sticky first column in horizontal-scroll table

```css
.scroll-table th:first-child, .scroll-table td:first-child {
  position: sticky;
  inset-inline-start: 0;
  background: var(--bg);
  z-index: 1;
}
.scroll-table thead th {
  position: sticky;
  inset-block-start: 0;
  background: var(--bg);
  z-index: 2;   /* higher than first-column to cover the intersection */
}
```

The top-left intersection cell needs the highest z-index so it covers both axes.

### Pattern 5 : registering Cmd+K only when no input is focused

```js
window.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey) || e.key !== 'k') return;
  // Allow Cmd+K to be intercepted by inputs that need it (rare).
  // For most cases, open the palette regardless.
  e.preventDefault();
  open();
});
```

Some sites also intercept Cmd+K only when the active element is not an editable field, to leave the shortcut available for browser address bar.

## Anti-Patterns Index

See [anti-patterns.md](references/anti-patterns.md). Eight cataloged : `<div role="table">` instead of native `<table>`; missing `scope` on `<th>`; sortable button as `<div>`; sticky `<thead>` without scrolling parent; command palette using DOM focus on options; Cmd+K without visible UI trigger (WCAG 2.1.1); missing `<caption>` or `aria-label` on table; aria-live="assertive" on filter result count (noisy interruption every keystroke).

## Reference Links

- [Methods and signatures](references/methods.md) : full `<table>` surface, ARIA attributes, APG combobox keyboard model, sticky-header recipe, command-palette state machine.
- [Examples](references/examples.md) : two renderable HTML demos (data table + command palette) plus six additional patterns.
- [Anti-patterns](references/anti-patterns.md) : eight cataloged anti-patterns with symptom, root cause, and fix.

## Cross-references

- `[[frontend-a11y-aria-patterns]]` : full APG Combobox surface and accessibility rules.
- `[[frontend-a11y-focus-keyboard-inert]]` : focus trap, `inert`, focus restore.
- `[[frontend-impl-popover-dialog-anchor]]` : `<dialog>showModal()` and `popover` mechanics.
- `[[frontend-syntax-css-grid-subgrid]]` : Grid for the container-query card reflow.
- `[[frontend-impl-responsive-layout-fluid]]` : container queries underpinning the mobile-table reflow.
