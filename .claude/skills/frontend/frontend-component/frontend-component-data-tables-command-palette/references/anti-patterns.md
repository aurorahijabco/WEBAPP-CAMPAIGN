# Anti-Patterns : data tables + command palette

Each entry : symptom (what the user / developer sees), root cause (why it happens), fix (deterministic rule).

Sources : [MDN: HTML table element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) (verified 2026-05-19), [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19), [APG: Table](https://www.w3.org/WAI/ARIA/apg/patterns/table/) (verified 2026-05-19), [APG: Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) (verified 2026-05-19), [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) (verified 2026-05-19).

## Anti-pattern 1 : `<div role="table">` instead of native `<table>`

```html
<!-- anti-pattern -->
<div role="table">
  <div role="row">
    <div role="columnheader">Name</div>
    <div role="columnheader">Age</div>
  </div>
  <div role="row">
    <div role="cell">Maria</div>
    <div role="cell">28</div>
  </div>
</div>
```

Symptom : screen-reader announcement is functionally similar but inconsistent across engines ; keyboard navigation works differently across screen readers ; tooling / CSS / a11y audits flag the structure ; copy-as-CSV browser features do not work.

Root cause : ARIA roles supplement native semantics ; they do not deliver the engine-level handling that `<table>` does for free (header-cell association, copy-paste behaviour, find-in-page, browser table-specific affordances). Per [APG: Table](https://www.w3.org/WAI/ARIA/apg/patterns/table/) (verified 2026-05-19) : "authors are strongly encouraged to use a native HTML `table` element whenever possible."

Fix : use native `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`. All required keyboard behaviour, header-cell association via `scope`, and AT-friendly navigation come for free.

```html
<table>
  <thead><tr><th scope="col">Name</th><th scope="col">Age</th></tr></thead>
  <tbody><tr><th scope="row">Maria</th><td>28</td></tr></tbody>
</table>
```

## Anti-pattern 2 : missing `scope` on `<th>` (or no header cells at all)

```html
<!-- anti-pattern -->
<table>
  <tr><td>Name</td><td>Age</td></tr>
  <tr><td>Maria</td><td>28</td></tr>
</table>
```

Symptom : a screen reader navigating cell-by-cell announces "Maria" without any context (does not know which column it belongs to). Header-cell association is lost.

Root cause : the first row uses `<td>` (data cell) instead of `<th>` (header cell). Even when `<th>` is present, missing `scope` makes the association ambiguous for irregular tables.

Fix : declare header cells with `<th scope="col">` or `<th scope="row">`. For complex tables with `colspan` / `rowspan`, use `id` + `headers`.

```html
<table>
  <thead>
    <tr><th scope="col">Name</th><th scope="col">Age</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">Maria</th><td>28</td></tr>
  </tbody>
</table>
```

## Anti-pattern 3 : sortable column built as a `<div>` with `onclick`

```html
<!-- anti-pattern -->
<th><div onclick="sort('region')">Region</div></th>
```

Symptom : keyboard users cannot trigger the sort. Tab does not land on the `<div>` (no `tabindex`). Even with `tabindex="0"`, Space and Enter do nothing without explicit handlers. `:focus-visible` does not apply by default.

Root cause : a `<div>` is not a control. The author used CSS to make it look like a button without the semantic and behavioural contract of a `<button>`.

Fix : use `<button type="button">`. The browser handles focus, keyboard activation, and the type-submit behaviour.

```html
<th scope="col">
  <button type="button" aria-sort="ascending" onclick="sort('region')">Region</button>
</th>
```

## Anti-pattern 4 : sticky `<thead>` without scrolling parent

```css
/* anti-pattern */
thead th { position: sticky; top: 0; background: white; }
/* table is just a regular <table> with no scrolling wrapper */
```

Symptom : the header does NOT stick. Authors observe that `position: sticky` works in some places and not others without understanding why.

Root cause : per [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/position) (verified 2026-05-19), `position: sticky` requires a scrolling ancestor. If the document body is the scroller, the header sticks to the viewport ; if a wrapping container should be the scroller, that wrapper MUST have `overflow: auto` AND a constrained block-size.

Fix : wrap the table and constrain :

```html
<div class="table-wrap">
  <table>...</table>
</div>
```

```css
.table-wrap { max-block-size: 60vh; overflow: auto; }
thead th { position: sticky; inset-block-start: 0; background: white; z-index: 1; }
```

Additionally : NEVER use `border-collapse: collapse` with sticky ; the collapsed border lets the body show through. Use `border-collapse: separate; border-spacing: 0;`.

## Anti-pattern 5 : command palette using DOM focus on options

```js
// anti-pattern
const options = listbox.querySelectorAll('[role="option"]');
input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') options[next].focus();   // <- moves DOM focus
});
```

Symptom : as the user types in the search input and then presses ArrowDown, focus jumps to the listbox option. Subsequent typing is captured by the option (not the input), and the screen reader announces the option as a separately-focused widget. The typing flow is broken.

Root cause : per [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19), listbox / grid / tree popups MUST keep DOM focus on the combobox input. The highlight is communicated via `aria-activedescendant` referencing the option's id.

Fix : use `aria-activedescendant`.

```js
function setActive(index) {
  options.forEach((o, i) => o.setAttribute('aria-selected', String(i === index)));
  input.setAttribute('aria-activedescendant', index === -1 ? '' : options[index].id);
}
```

DOM focus stays on `input` throughout.

## Anti-pattern 6 : Cmd+K with no visible UI trigger (WCAG 2.1.1)

```js
// anti-pattern : only the keyboard shortcut opens the palette
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') open();
});
```

Symptom : users who do not know the shortcut (or who use voice control) cannot reach the palette. Mouse users also have no UI affordance.

Root cause : per WCAG 2.1.1 Keyboard, every keyboard-operable function MUST also be operable via a visible UI. A keyboard-only shortcut violates the rule.

Fix : add a visible button in the toolbar that does exactly the same thing.

```html
<button type="button" id="cmd-trigger" aria-haspopup="dialog">
  Search commands <kbd>Ctrl K</kbd>
</button>
```

```js
trigger.addEventListener('click', open);
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open(); }
});
```

The `<kbd>` element communicates the shortcut to sighted users without requiring discovery.

## Anti-pattern 7 : missing `<caption>` or `aria-label` on a data table

```html
<!-- anti-pattern -->
<table>
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

Symptom : a screen-reader user navigating with the tables-list shortcut hears "table" without further context. Multiple tables on the same page become indistinguishable.

Root cause : the table has no accessible name.

Fix : add a `<caption>` (preferred) or `aria-label`.

```html
<table>
  <caption>Q1 sales by region</caption>
  ...
</table>

<!-- or, if caption layout is undesired -->
<table aria-label="Q1 sales by region">
  ...
</table>
```

For longer descriptions (table summary), use `aria-describedby` pointing to a paragraph outside the table.

## Anti-pattern 8 : `aria-live="assertive"` on the command-palette result count

```html
<!-- anti-pattern -->
<div aria-live="assertive">12 results</div>
```

Symptom : every keystroke in the search input interrupts the user with "N results". Continuous typing produces a flood of announcements ; screen-reader users disable the palette or close the tab.

Root cause : `assertive` interrupts the current utterance immediately. It is intended for time-critical events (session expiry, payment failure), not for routine UI updates.

Fix : use `aria-live="polite"` (or its shortcut `role="status"`) so updates queue until the user is idle.

```html
<div role="status" aria-live="polite" aria-atomic="true">12 results</div>
```

Optionally throttle / debounce the announcement so brief typing does not produce a flood of polite announcements either.

## Anti-pattern 9 (bonus) : `<table>` for layout

```html
<!-- anti-pattern -->
<table>
  <tr>
    <td><nav>...</nav></td>
    <td><main>...</main></td>
  </tr>
</table>
```

Symptom : screen readers announce the layout as "table with 2 rows, 1 column" and read content as cells ; SEO and a11y audits flag the structure ; CSS Grid would do the same job with less markup and full semantic clarity.

Root cause : pre-CSS layouts used `<table>` for column alignment. The pattern survived long after CSS Grid and Flexbox made it obsolete.

Fix : use CSS Grid for layout. Reserve `<table>` for genuine tabular DATA only.

```html
<div class="page">
  <nav>...</nav>
  <main>...</main>
</div>
```

```css
.page { display: grid; grid-template-columns: 16rem 1fr; gap: 1rem; }
```
