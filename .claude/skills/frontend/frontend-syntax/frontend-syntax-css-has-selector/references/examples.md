# Examples : `:has()` patterns

All snippets verified against MDN and W3C TR sources cited in SKILL.md.

## Example 1 : Parent state from child hover

```css
.card {
  background: oklch(0.97 0 0);
  transition: background 200ms;
}
.card:has(button:hover) {
  background: oklch(0.94 0 0);
}
```

## Example 2 : Form-state choreography

```css
form:has(input:invalid) [type=submit] {
  opacity: 0.5;
  pointer-events: none;
}
form:has(input:invalid) .error-summary {
  display: block;
}
```

The submit button visually deactivates while any descendant input is in the `:invalid` state. No JS required.

## Example 3 : Heading-paragraph rhythm

```css
h2 { margin-block-end: 1.5rem; }
h2:has(+ p) { margin-block-end: 0.5rem; }
```

Collapses the margin when the heading is followed immediately by a paragraph; otherwise full spacing is kept for headings followed by lists or other content.

## Example 4 : Checked-state strikethrough

```css
.todo-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.todo-row:has(input[type=checkbox]:checked) {
  text-decoration: line-through;
  opacity: 0.6;
}
```

## Example 5 : Conditional grid layout

```css
.article-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.article-grid:has(> figure) {
  grid-template-columns: 1fr 320px;
}
```

## Example 6 : Sibling-state styling

```css
.menu-trigger { background: oklch(0.97 0 0); }
.menu-trigger:has(+ .menu[aria-expanded="true"]) {
  background: oklch(0.92 0 0);
}
```

The trigger styles itself differently when the adjacent menu is expanded.

## Example 7 : OR via comma

```css
article:has(figure, table) {
  border-inline-start: 4px solid oklch(0.68 0.18 250);
  padding-inline-start: 1rem;
}
```

Matches articles containing either a figure OR a table.

## Example 8 : AND via chained `:has()`

```css
article:has(figure):has(table) {
  background: oklch(0.98 0 0);
}
```

Matches articles containing BOTH a figure AND a table.

## Example 9 : `:not()` outside `:has()` (anchor exclusion)

```css
.section:not(.locked):has(.editable) {
  outline: 2px dashed oklch(0.68 0.18 250);
}
```

## Example 10 : `:not()` inside `:has()` (descendant exclusion)

```css
article:has(:not(.draft)) {
  /* Anchor article contains at least one element that is NOT .draft */
}
```

Use carefully : "contains something that is not X" is rarely the same as "does not contain X". For the latter, use `:not(:has(.draft))`.

## Example 11 : Prefer `:focus-within` over `:has(:focus)`

```css
/* WRONG : works but is more expensive than necessary */
.form-row:has(:focus) { background: oklch(0.96 0 0); }

/* RIGHT */
.form-row:focus-within { background: oklch(0.96 0 0); }
```

`:focus-within` exists specifically for this case and has been Widely Available since 2019.

## Example 12 : Outer-rule legacy survival via `:is()`

```css
:is(h1:has(+ h2), h1) {
  font-family: var(--display-font, system-ui);
}
```

On browsers without `:has()` support, the inner `:is()` arg evaluates only the second branch (`h1`), keeping the styling alive.

## Example 13 : Anchor locality (tight)

```css
/* RIGHT : tight anchor, small subtree, direct combinator */
.gallery:has(> img[data-loaded="false"]) { opacity: 0.6; }

/* WRONG : large subtree */
body:has(img[data-loaded="false"]) { background: oklch(0.94 0 0); }
```

## Example 14 : NEVER nest `:has()`

```css
/* WRONG : nested :has() is invalid */
.a:has(.b:has(.c)) { ... }

/* RIGHT : compose with chained :has() */
.a:has(.c) { ... }
/* OR restructure markup so the relationship is expressible without nesting */
```

## Example 15 : NEVER pseudo-element inside

```css
/* WRONG : pseudo-element as inner selector */
div:has(::before) { ... }

/* RIGHT : pseudo-elements cannot be matched independently */
/* Instead, look for the element whose ::before is generated and target its class */
.card.has-icon:has(.icon) { ... }
```

## Example 16 : Empty-state styling without classes

```css
.list:has(:not(:empty)) {
  border: 1px solid oklch(0.85 0 0);
}
.list:not(:has(*)) {
  display: none;
}
```

The first rule styles a list whose at least one child is non-empty. The second hides the list when it has NO children at all.
