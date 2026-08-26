# Methods : ARIA 1.2 + APG patterns

Sources : [W3C: WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) (verified 2026-05-19), [W3C: ARIA in HTML](https://www.w3.org/TR/html-aria/) (verified 2026-05-19), [W3C WAI: APG patterns](https://www.w3.org/WAI/ARIA/apg/) (verified 2026-05-19), per-pattern URLs cited inline.

## 1. ARIA 1.2 attribute set used in this skill

### 1.1 Labelling and description

| Attribute | Value type | Effect |
|-----------|------------|--------|
| `aria-label` | string | Provides an accessible name. Overrides native label and element text. |
| `aria-labelledby` | IDREF list | Accessible name composed from referenced elements. Highest precedence. |
| `aria-describedby` | IDREF list | Accessible description read AFTER the name. Often suppressible by users. |
| `aria-errormessage` | IDREF | Points to a visible error message. REQUIRES `aria-invalid="true"` on the same element. |
| `aria-invalid` | `true` / `false` / `grammar` / `spelling` | Marks the value as invalid. Pairs with `aria-errormessage`. |
| `aria-roledescription` | string | Localized override of the role announcement (e.g. "carousel" instead of "region"). |
| `title` | string | Tooltip and last-resort accessible name. NEVER rely on `title` alone for a name; not exposed by all AT and not visible without hover. |

### 1.2 Widget state

| Attribute | Use |
|-----------|-----|
| `aria-expanded` | `true` / `false` on a trigger or row that toggles visibility. NEVER on leaves or non-toggleable items. |
| `aria-selected` | `true` / `false` on items in `listbox`, `tab`, `tree`, `grid` patterns. Omit on items that are not selectable at all (so AT does not announce them as toggleable). |
| `aria-checked` | `true` / `false` / `mixed` on `checkbox`, `menuitemcheckbox`, `menuitemradio`, `radio`, `switch`, `treeitem`. |
| `aria-pressed` | `true` / `false` / `mixed` on toggle buttons (`role="button"`). Carousel rotation control does NOT use `aria-pressed`; use dynamic label instead. |
| `aria-disabled` | `true` / `false`. Preferred over HTML `disabled` for items in composite widgets (menu, toolbar, carousel slide-picker) so they remain in the focus order for orientation. |
| `aria-required` | `true` on form controls or composite groups (`radiogroup`, `listbox`). |
| `aria-multiselectable` | `true` on `listbox`, `tree`, `treegrid` enables multi-selection semantics. |
| `aria-orientation` | `horizontal` / `vertical` on widgets whose primary axis is ambiguous. |
| `aria-level` | integer >= 1 on `heading`, `treeitem`, `row` (in treegrid). |
| `aria-posinset` | integer on `treeitem`, `option`, `listitem` when set is not all in DOM. |
| `aria-setsize` | integer count when set is not all in DOM. |

### 1.3 Relationship pointers

| Attribute | Use |
|-----------|-----|
| `aria-controls` | IDREF list. Points to the element controlled by this control (e.g. `tab` -> its `tabpanel`; `combobox` -> its popup). |
| `aria-haspopup` | `menu` / `listbox` / `tree` / `grid` / `dialog` / `true` (legacy for menu). Declares the popup type the trigger opens. |
| `aria-activedescendant` | IDREF. Highlights an item inside a container without moving DOM focus to it. Required for combobox-with-listbox-popup. |
| `aria-owns` | IDREF list. Reparents items in the accessibility tree when DOM order does not match logical order. Use sparingly. |

### 1.4 Live region attributes

| Attribute | Values | Effect |
|-----------|--------|--------|
| `aria-live` | `off` (default), `polite`, `assertive` | Politeness of announcements. |
| `aria-atomic` | `false` (default), `true` | Re-read entire region on change. |
| `aria-relevant` | `additions`, `removals`, `text`, `all` | Which mutation types announce. Default `additions text`. |
| `aria-busy` | `false` (default), `true` | Suppress announcements during batched DOM updates. |

### 1.5 Pre-baked live-region roles

| Role | Implicit attributes |
|------|---------------------|
| `role="status"` | `aria-live="polite"`, `aria-atomic="true"` |
| `role="alert"` | `aria-live="assertive"`, `aria-atomic="true"` |
| `role="log"` | `aria-live="polite"`, `aria-atomic="false"`, `aria-relevant="additions"` |
| `role="marquee"` | `aria-live="off"` (announces only on user action) |
| `role="timer"` | `aria-live="off"` |

Per [APG: Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) (verified 2026-05-19), `role="alert"` MUST NOT auto-dismiss and MUST be reserved for genuinely time-critical information.

## 2. Implicit ARIA semantics (HTML -> role mapping)

Per [W3C: ARIA in HTML](https://www.w3.org/TR/html-aria/) (verified 2026-05-19). NEVER add a `role` that the element already has.

| HTML | Implicit role |
|------|---------------|
| `<button>` | `button` |
| `<a href="...">` | `link` |
| `<nav>` | `navigation` |
| `<main>` | `main` |
| `<header>` (top-level) | `banner` |
| `<footer>` (top-level) | `contentinfo` |
| `<aside>` | `complementary` |
| `<article>` | `article` |
| `<section>` with accessible name | `region` |
| `<form>` with accessible name | `form` |
| `<h1>`-`<h6>` | `heading` with corresponding `aria-level` |
| `<input type="text">`, `<textarea>` | `textbox` |
| `<input type="checkbox">` | `checkbox` |
| `<input type="radio">` | `radio` |
| `<input type="range">` | `slider` |
| `<input type="button">`, `<input type="submit">`, `<input type="reset">` | `button` |
| `<select>` (single, no `multiple`, no `size`) | `combobox` |
| `<select multiple>` or `<select size>` | `listbox` |
| `<dialog>` | `dialog` |
| `<details>` | `group` (and `<summary>` is `button`) |
| `<table>` | `table` |
| `<th>` | `columnheader` or `rowheader` (scope-dependent) |
| `<td>` | `cell` (or `gridcell` inside grid/treegrid) |

## 3. Disclosure pattern

Per [APG: Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) (verified 2026-05-19).

| Element | Role | States |
|---------|------|--------|
| trigger | `<button>` (native) OR `role="button"` + `tabindex="0"` | `aria-expanded="true|false"`; OPTIONAL `aria-controls` referencing disclosed region id |
| disclosed region | any container | NO role required. Do NOT add `role="region"` unless it is a true page landmark. |

Keyboard : Enter and Space activate the trigger (free with `<button>`).

Prefer `<details><summary>` for static content disclosure (zero ARIA).

## 4. Dialog (Modal) pattern

Per [APG: Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (verified 2026-05-19).

| Element | Role | States and behaviors |
|---------|------|----------------------|
| dialog container | `role="dialog"` (or `role="alertdialog"` for confirmation) | `aria-modal="true"`; accessible name via `aria-labelledby` -> visible heading inside, OR `aria-label`. |
| focus behavior | n/a | On open : move DOM focus into dialog (first useful control OR heading made focusable with `tabindex="-1"`). Tab / Shift+Tab cycle within. Escape closes. On close : restore focus to the trigger element. |

Native `<dialog>` + `showModal()` provides focus trap, Escape close, and inert-on-rest automatically; only `aria-labelledby` / `aria-label` and focus restore on close remain author responsibilities.

## 5. Tabs pattern

Per [APG: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (verified 2026-05-19).

| Element | Role | States |
|---------|------|--------|
| tab container | `role="tablist"` | OPTIONAL `aria-label` or `aria-labelledby` (REQUIRED if no visible label adjacent) |
| each tab | `role="tab"` | `aria-selected="true"` on active, `false` on others; `aria-controls="<panel-id>"` |
| each panel | `role="tabpanel"` | `aria-labelledby="<tab-id>"` |

Focus model : roving tabindex. Selected tab has `tabindex="0"`; all other tabs have `tabindex="-1"`. Tab key enters the tablist exactly once.

Keyboard :

| Key | Action |
|-----|--------|
| Left / Right (horizontal) or Up / Down (vertical) | Move focus between tabs. |
| Home / End | First / last tab. |
| Tab | Move out of tablist into the panel. |
| Space / Enter | Activate (manual mode only). |

Activation modes : automatic (focus = activate; default) when activation has no cost; manual (Space / Enter activates) when activation has cost.

## 6. Combobox pattern

Per [APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (verified 2026-05-19).

| Element | Role | States |
|---------|------|--------|
| combobox input | `role="combobox"` (omit on native `<input list>`) | `aria-controls="<popup-id>"`, `aria-expanded="true|false"`, `aria-autocomplete="none|list|both"`, `aria-haspopup="listbox|grid|tree|dialog"` (omit if listbox), `aria-activedescendant="<option-id>"` while popup open and option highlighted |
| popup | `role="listbox"` / `role="grid"` / `role="tree"` / `role="dialog"` | id matches `aria-controls`; for listbox popup, accessible name via parent combobox's label (no separate name) |
| options (listbox popup) | `role="option"` | `aria-selected="true"` on the option referenced by `aria-activedescendant` |

Focus model :

- Listbox / grid / tree popup : DOM focus STAYS on the combobox input; `aria-activedescendant` references the highlighted option. NEVER move DOM focus into the popup.
- Dialog popup : DOM focus MOVES into the dialog.

Keyboard (listbox popup) :

| Key | Action |
|-----|--------|
| Down (closed) | Open popup AND move highlight to first option. |
| Up (closed) | Open popup AND move highlight to last option. |
| Down (open) | Move highlight to next option. |
| Up (open) | Move highlight to previous option. |
| Enter | Accept current option. |
| Escape | Close popup. MAY also clear the input. |
| Alt+Down | Open popup without moving highlight. |
| Alt+Up | Commit current input and close. |

## 7. Listbox pattern

Per [APG: Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) (verified 2026-05-19).

| Element | Role | States |
|---------|------|--------|
| listbox container | `role="listbox"` | `aria-label` / `aria-labelledby` (REQUIRED standalone); `aria-multiselectable="true"` for multi-select; `aria-orientation="horizontal"` for horizontal listboxes; `aria-required` / `aria-invalid` for form participation. |
| options | `role="option"` | `aria-selected="true"` on selected, `false` on selectable-but-unselected. Omit on unselectable items. |
| groups | `role="group"` | Own `aria-label` / `aria-labelledby`. |

Focus model : choose ONE.

- Roving tabindex : only the focused option has `tabindex="0"`. Standalone listboxes (not in combobox).
- `aria-activedescendant` : DOM focus on listbox container; ID reference to highlighted option. REQUIRED in combobox.

Keyboard (standalone, vertical) : Up / Down move focus; Home / End jump to first / last; type-ahead matches first character. Multi-select : Space toggles; Shift+Up/Down extends; Ctrl+A toggles select-all (optional but recommended).

## 8. Menu / Menubar pattern

Per [APG: Menu and Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) (verified 2026-05-19).

| Element | Role | States |
|---------|------|--------|
| popup menu | `role="menu"` | accessible name via `aria-label` or `aria-labelledby` (often the trigger). |
| persistent menu bar | `role="menubar"` | `aria-orientation="vertical"` if running vertically. |
| trigger (button or parent menuitem) | `role="button"` (native `<button>` preferred) | `aria-haspopup="menu"`, `aria-expanded="true|false"`, `aria-controls="<menu-id>"`. |
| menu items | `role="menuitem"` / `role="menuitemcheckbox"` / `role="menuitemradio"` / `role="separator"` / `role="group"` | `aria-checked="true|false"` on checkbox and radio variants; `aria-disabled="true"` for disabled (preferred over HTML `disabled`). |

Focus model : roving tabindex. Each item is `tabindex="-1"` except in a menubar where the FIRST item is `tabindex="0"`. NEVER `aria-activedescendant` on menu.

Keyboard :

| Key | Action |
|-----|--------|
| Enter / Space | Activate menuitem OR open submenu. |
| Down / Up | Move focus within menu (vertical). |
| Right / Left | Across menubar OR open / close submenu inside menu. |
| Escape | Close menu, return focus to opener. |
| Home / End | First / last visible item. |
| Type-ahead | Move to next item whose label begins with typed character. Buffer resets after 500 ms. |

Application menu vs navigation : `role="menu"` is for command lists (File, Edit, View). Navigation links belong in `<nav><ul><a>` with NO role and NO arrow-key model.

## 9. Radio Group pattern

Per [APG: Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) (verified 2026-05-19).

| Element | Role | States |
|---------|------|--------|
| group container | `role="radiogroup"` | accessible name via `aria-labelledby` or `aria-label`; `aria-required="true"` if required. |
| radios | `role="radio"` | `aria-checked="true"` on selected, `false` on others; mutually exclusive. |

Single-tabstop focus model : selected radio has `tabindex="0"`; if none selected, FIRST radio has `tabindex="0"`; rest `tabindex="-1"`.

Keyboard : arrow keys (Up / Down / Left / Right, all four work) move focus AND select (focus = selection). Space selects if not already.

Native `<input type="radio">` + `<fieldset><legend>` is the correct path for forms. ARIA pattern only for non-form contexts.

## 10. Tree pattern

Per [APG: Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) (verified 2026-05-19).

| Element | Role | States |
|---------|------|--------|
| tree container | `role="tree"` | `aria-label` / `aria-labelledby`; `aria-multiselectable="true"` for multi-select. |
| nodes | `role="treeitem"` | `aria-expanded="true|false"` ONLY on parents; `aria-selected` when selection supported; `aria-level` + `aria-posinset` + `aria-setsize` when nodes are lazy-loaded (not all in DOM). |
| child groups | `role="group"` | wraps nested `treeitem` children of an expandable parent. |

Focus model : roving tabindex.

Keyboard :

| Key | Action |
|-----|--------|
| Up / Down | Previous / next visible node (skipping collapsed subtrees). |
| Right | On collapsed parent : expand. On expanded parent : move to first child. On leaf : no-op. |
| Left | On expanded parent : collapse. On leaf or collapsed parent : move to parent. |
| Home / End | First / last visible node. |
| Enter | Activate (open file, run command). |
| Space | Toggle selection (multi-select). |
| Type-ahead | Match printable characters against node labels. |
| `*` (optional) | Expand all siblings of the focused node. |

## 11. Treegrid pattern

Per [APG: Treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) (verified 2026-05-19).

| Element | Role | States |
|---------|------|--------|
| container | `role="treegrid"` | `aria-label` / `aria-labelledby`; `aria-multiselectable="true"` for multi-row / multi-cell selection. |
| rows | `role="row"`, optionally inside `role="rowgroup"` | `aria-expanded` on expandable rows; `aria-selected` for multi-select; `aria-level` + `aria-posinset` + `aria-setsize` when lazy. |
| cells | `role="gridcell"` / `role="rowheader"` / `role="columnheader"` | `aria-selected` for cell-level multi-select. |

Focus mode (author choice) :

- Cell-focus : DOM focus moves between cells.
- Row-focus : DOM focus moves between rows.

Single tabstop : exactly one focusable element inside has `tabindex="0"`.

Keyboard (2D plus expand/collapse) :

| Key | Action |
|-----|--------|
| Arrow keys | Move between cells (Left/Right) and rows (Up/Down). |
| Right on collapsed parent row | Expand. |
| Left on expanded parent row | Collapse. |
| Home / End | First / last cell of current row. |
| Ctrl+Home / Ctrl+End | First / last cell of treegrid. |
| Page Up / Page Down | Move by a page. |
| Enter | Activate cell or row. |
| F2 | Enter edit mode for editable cells. |
| Escape | Exit edit mode. |
| Shift+arrow | Extend selection (multi-select). |
| Ctrl+Space | Toggle row selection (multi-select). |

## 12. Carousel pattern

Per [APG: Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) (verified 2026-05-19).

| Element | Role | States |
|---------|------|--------|
| container | `role="region"` or `role="group"` | `aria-roledescription="carousel"`; accessible name via `aria-labelledby` -> visible heading OR `aria-label` (label MUST NOT contain the word "carousel" because `aria-roledescription` already says it). |
| slide (basic / picker variants) | `role="group"` | `aria-roledescription="slide"`; accessible name = unique slide name OR fallback "3 of 10". |
| slide (tabbed variant) | `role="tabpanel"` | per Tabs pattern. |
| picker (tabbed variant) | `role="tablist"` | per Tabs pattern. |
| rotation control | `<button>` | dynamic accessible name "Stop slide rotation" / "Start slide rotation". NEVER `aria-pressed`. |
| slide-picker disabled state | n/a | `aria-disabled="true"` (preferred over HTML `disabled` so the button stays in tab order). |

Autoplay rules :

- MUST pause on keyboard focus entering the carousel.
- MUST pause on pointer hover over the carousel.
- After auto-pause from focus, MUST NOT auto-resume without explicit user action (WCAG 2.2.2 Pause, Stop, Hide).
- Slide wrapper MAY use `aria-live="off"` during auto-rotation and `aria-live="polite"` when paused.

## 13. Cross-pattern focus-model summary

| Pattern | Focus model |
|---------|-------------|
| Listbox standalone | roving tabindex OR `aria-activedescendant` (author choice) |
| Listbox in combobox | `aria-activedescendant` (REQUIRED) |
| Combobox with dialog popup | DOM focus moves into dialog |
| Tabs | roving tabindex |
| Menu / Menubar | roving tabindex (NEVER `aria-activedescendant`) |
| Radio Group | single-tabstop roving (focus = selection) |
| Tree | roving tabindex |
| Treegrid | single-tabstop roving (cell-focus OR row-focus) |
| Disclosure | none (single button) |
| Dialog | focus trap (Tab cycles within), restore on close |
| Carousel (basic / picker) | natural Tab order |
| Carousel (tabbed) | tablist roving tabindex |
