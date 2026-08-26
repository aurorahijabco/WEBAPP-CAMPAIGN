# Methods : Frontend Syntax HTML5 Semantic

Complete element surface, implicit ARIA mapping per context, attribute reference for the disclosure and template elements covered in this skill, and the document outline rule set.

## Landmark element matrix

| Element | Implicit role | Role conditional on | Permitted parents | Permitted content |
|---------|---------------|---------------------|-------------------|-------------------|
| `<header>` | `banner` | direct child of `<body>` | flow content | flow content, excluding `<header>` and `<footer>` |
| `<nav>` | `navigation` | always | flow content | flow content |
| `<main>` | `main` | always; exactly one per document | flow content | flow content |
| `<aside>` | `complementary` | always | flow content | flow content |
| `<footer>` | `contentinfo` | direct child of `<body>` | flow content | flow content, excluding `<header>` and `<footer>` |
| `<article>` | `article` | always | flow content | flow content |
| `<section>` | `region` | has an accessible name (`aria-label` / `aria-labelledby` / `title`) | flow content | flow content |
| `<search>` | `search` | always | flow content | flow content |
| `<figure>` | `figure` | always | flow content | optional `<figcaption>` plus flow content |
| `<details>` | `group` (with `<summary>` as disclosure button) | always | flow content, interactive content | one `<summary>` as first child, then flow content |
| `<dialog>` | `dialog` (open via `show()`), `dialog` (open via `showModal()`) | always | flow content | flow content |

Sources: [WHATWG HTML Living Standard: Sections](https://html.spec.whatwg.org/multipage/sections.html) (verified 2026-05-19), [MDN: `<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search) (verified 2026-05-19).

## When implicit role is suppressed

Three sectioning elements drop their landmark role under specific conditions:

1. `<header>` is `banner` only when its nearest sectioning ancestor is `<body>`. Inside `<article>`, `<section>`, `<aside>`, or `<nav>`, `<header>` exposes a generic `group` and is NOT a landmark.
2. `<footer>` is `contentinfo` only when its nearest sectioning ancestor is `<body>`. Inside any sectioning element, `<footer>` is generic.
3. `<section>` is `region` ONLY when it has an accessible name. A `<section>` without `aria-label`, `aria-labelledby`, or `title` does NOT appear in the landmark tree.

ALWAYS verify landmark exposure with a tree inspector before shipping.

## `<details>` and `<summary>` reference

Source: [MDN: `<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) (verified 2026-05-19).

### Attributes on `<details>`

| Attribute | Type | Effect |
|-----------|------|--------|
| `open` | boolean | When present, the disclosure starts open. Programmatic toggle by setting or removing the attribute. |
| `name` | string | Joins the element to an exclusive group: opening one closes all sibling `<details>` with the same `name`. Baseline 2024. |

### `<summary>` rules

- MUST be the first child of `<details>`. Browsers will render a default summary text if `<summary>` is absent.
- MAY contain phrasing content and a single heading (`<h1>`-`<h6>`).
- The element implicitly behaves as the disclosure toggle button. NEVER nest interactive elements inside `<summary>` other than the heading.

### Events

| Event | When |
|-------|------|
| `toggle` | Fires after the `open` state changes (either programmatically or via user click). The event is NOT cancelable. |

The `toggle` event bubbles. Listen on a parent for delegation when there are many disclosures.

## `<dialog>` light reference

Source: [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19).

This skill scope keeps `<dialog>` mechanics light; full surface lives in `[[frontend-impl-popover-dialog-anchor]]`.

### Attributes (essential)

| Attribute | Type | Effect |
|-----------|------|--------|
| `open` | boolean | Reflects the open state. Setting via JS is not the recommended path; use `show()`, `showModal()`, `close()`. |
| `closedby` | enumerated: `any`, `closerequest`, `none` | Declarative control over light-dismiss / Escape behavior. |

### Methods (essential)

| Method | Effect |
|--------|--------|
| `show()` | Opens as a non-modal dialog. Document is NOT inert. |
| `showModal()` | Opens on the top layer. Rest of the document is inert. Escape closes by default. `::backdrop` pseudo-element becomes available. |
| `close(returnValue?)` | Closes the dialog. The optional `returnValue` is reflected on `dialog.returnValue`. Fires the `close` event. |

### Rules

- NEVER set `tabindex` on `<dialog>`. The element manages focus internally.
- ALWAYS set `autofocus` on a specific descendant if the first focusable child is not the intended initial-focus target.
- Use `<dialog>` for modal patterns; use `popover="auto"` for non-modal popover patterns (see `[[frontend-impl-popover-dialog-anchor]]`).

## `<template>` and declarative Shadow DOM reference

Source: [MDN: `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) (verified 2026-05-19).

### Attributes on `<template>` for declarative Shadow DOM

| Attribute | Values | Effect |
|-----------|--------|--------|
| `shadowrootmode` | `open` or `closed` | Required to mark a `<template>` as a shadow-root payload. `open` allows script to access via `element.shadowRoot`. `closed` returns `null` for `shadowRoot`. |
| `shadowrootdelegatesfocus` | boolean (presence) | When set, focusing the host element delegates focus to the first focusable descendant in the shadow root. |
| `shadowrootclonable` | boolean (presence) | The shadow root is cloned when the host element is cloned via `cloneNode(true)`. |
| `shadowrootserializable` | boolean (presence) | The shadow root is included in HTML serialization. |

### Parser behavior

When the HTML parser encounters `<template shadowrootmode>` as the first or only `<template>` child of an element, it immediately attaches the template's content as a shadow root to the parent. The `<template>` element is removed from the DOM after attachment.

Declarative Shadow DOM works without any JavaScript on the critical path. Hydration logic (if any) can run later. Full custom-element registration is covered in `[[frontend-impl-web-components]]`.

## Document outline rules

The outline is built from heading elements (`<h1>` through `<h6>`), NOT from sectioning elements. Browsers do NOT implement the HTML4 nested-outline algorithm; only the explicit heading levels matter.

Authoring rules:

| Rule | Why |
|------|-----|
| One `<h1>` per document | Multiple `<h1>` confuse the screen-reader rotor and break heading-navigation. Exception: each `<article>` MAY have an `<h1>` when articles are rendered standalone in a feed. The single-`<h1>`-per-page rule is the safe default. |
| ALWAYS use `<h2>` (or lower) as the heading inside `<section>` and `<article>` | A sectioning element without a heading does not contribute a region to assistive technology. |
| NEVER skip a heading level | Skipping levels breaks heading navigation. After `<h2>` the next sectioning heading is `<h3>`. |
| Use `<hgroup>` for heading + tagline | Pair an `<h2>` with a `<p>` child of `<hgroup>` to associate a subtitle without inflating heading count. |

## Element-to-spec index

| Element | WHATWG spec section | MDN page |
|---------|---------------------|----------|
| `<header>`, `<footer>`, `<main>`, `<nav>`, `<article>`, `<section>`, `<aside>` | [Sections](https://html.spec.whatwg.org/multipage/sections.html) (verified 2026-05-19) | MDN: HTML Element index |
| `<search>` | WHATWG HTML LS: Grouping content | [MDN: `<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search) (verified 2026-05-19) |
| `<details>` / `<summary>` | WHATWG HTML LS: Interactive elements | [MDN: `<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) (verified 2026-05-19) |
| `<dialog>` | WHATWG HTML LS: Interactive elements | [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19) |
| `<template>` declarative shadow | WHATWG HTML LS: Scripting | [MDN: `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) (verified 2026-05-19) |

When the spec and MDN disagree, the WHATWG Living Standard wins (see `[[frontend-core-architecture]]` Pattern: spec lookup discipline).
