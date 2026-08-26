---
name: frontend-syntax-html5-semantic
description: >
  Use when picking which HTML element to author for a region or piece of content, when a screen reader cannot find the navigation or main content, when an audit reports missing landmarks, or when a search field has no role.
  Prevents the `<div role="navigation">` reflex when `<nav>` exists, `<form role="search">` patterns now superseded by the `<search>` element, multiple `<main>` per page, `<section>` blocks without headings, `<article>` wrappers around unrelated content, and `tabindex` placed on `<dialog>`.
  Covers the semantic landmark surface (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<article>`, `<section>`, `<search>`), the `<search>` element (Baseline Widely Available since October 2023, implicit role `search`), `<details>` / `<summary>` with the `name` attribute for accordion-style mutual exclusion (Baseline 2024), declarative Shadow DOM via `<template shadowrootmode>`, and the rule for when to use ARIA `role` versus a native element.
  Keywords: header, nav, main, aside, footer, article, section, search element, dialog, details, summary, hgroup, figure, figcaption, landmark, landmark roles, implicit ARIA role, declarative shadow DOM, shadowrootmode, shadowrootdelegatesfocus, document outline, skip link, screen reader cannot find navigation, no landmarks announced, content does not appear in outline, search field has no role, accordion not exclusive, what HTML element should I use, when do I use article vs section, when do I use section vs div, how to make navigation accessible, what is the search element, do I need ARIA, how to write semantic HTML.
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Syntax HTML5 Semantic

This skill fixes the choice of HTML element for every region and content type. It is built on the architecture position from `[[frontend-core-architecture]]`: the markup layer is the foundation, and native semantic elements ALWAYS beat `<div role="...">` for accessibility tree mapping, focus management, and platform integration.

The skill targets evergreen-2026 browsers. The `<search>` element (Baseline Widely Available since October 2023) and `<details name="">` accordion mutual exclusion (Baseline 2024) are treated as available without polyfill. Declarative Shadow DOM via `<template shadowrootmode>` is Baseline becoming Widely Available.

## Quick Reference

### Landmark elements and implicit ARIA roles

| Element | Implicit role | Cardinality per page | Purpose |
|---------|---------------|----------------------|---------|
| `<header>` | `banner` when child of `<body>`, generic elsewhere | one banner per document | Top-of-page identification (logo, site name, primary navigation slot) |
| `<nav>` | `navigation` | multiple allowed if each is labelled | Block of navigation links |
| `<main>` | `main` | exactly one per document | Primary content unique to the page |
| `<aside>` | `complementary` | multiple allowed | Tangentially related content (call-outs, sidebars) |
| `<footer>` | `contentinfo` when child of `<body>`, generic elsewhere | one contentinfo per document | Bottom-of-page info (copyright, secondary links) |
| `<article>` | `article` | multiple allowed | Self-contained, syndicatable item (blog post, comment, card) |
| `<section>` | `region` only when given an accessible name | multiple allowed | Thematic grouping with a heading |
| `<search>` | `search` | typically one per page | Container for the controls that PERFORM a search (not the results) |
| `<figure>` | `figure` | multiple allowed | Self-contained content (image, code block, diagram) plus optional caption |
| `<details>` | `group` (with `<summary>` as button) | multiple allowed | Native disclosure widget |
| `<dialog>` | `dialog` or `alertdialog` per usage | multiple allowed | Modal or non-modal dialog; full mechanics in `[[frontend-impl-popover-dialog-anchor]]` |

Verified against [MDN: `<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search) (verified 2026-05-19), [MDN: `<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) (verified 2026-05-19), [MDN: `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) (verified 2026-05-19), and [WHATWG HTML Living Standard, Sections](https://html.spec.whatwg.org/multipage/sections.html) (verified 2026-05-19).

### The native-first rule

| Need | Native element | Do NOT do |
|------|----------------|-----------|
| Navigation region | `<nav>` | `<div role="navigation">` |
| Search controls region | `<search>` | `<form role="search">` |
| Banner region | `<header>` (direct child of `<body>`) | `<div role="banner">` |
| Page contentinfo | `<footer>` (direct child of `<body>`) | `<div role="contentinfo">` |
| Main region | `<main>` | `<div role="main">` |
| Aside / complementary | `<aside>` | `<div role="complementary">` |
| Disclosure | `<details>` + `<summary>` | `<button>` + manual `aria-expanded` plumbing |
| Modal | `<dialog>` + `showModal()` | `<div role="dialog">` |

Native elements get correct focus order, correct keyboard interaction, correct accessibility tree mapping, and correct platform integration for free. The full Authoring Practices comparison lives in `[[frontend-a11y-aria-patterns]]`.

## Decision Trees

### Decision: which landmark element fits this region?

```
Top-of-page identification (site name, logo, primary navigation slot)
  -> <header> (one banner per document, direct child of <body>)

Block of navigation links
  -> <nav>
     If multiple <nav> on one page, give each an aria-label or aria-labelledby

Primary content, unique to this page
  -> <main> (EXACTLY one per document)

Tangentially related content (call-outs, related-posts, ads)
  -> <aside>

Bottom-of-page info (copyright, secondary links)
  -> <footer> (one contentinfo per document, direct child of <body>)

Self-contained, syndicatable item (a blog post, a comment, a product card)
  -> <article>

Thematic grouping that needs a heading
  -> <section> with an h2..h6 inside
     If no heading is appropriate -> use <div> instead

Search controls (the input + submit, NOT the results listing)
  -> <search>
     Use ONLY for the form that performs the search.
     NEVER wrap the results listing in <search>.

Self-contained content (image, code, diagram) with optional caption
  -> <figure> + optional <figcaption>

Disclosure (collapsible region)
  -> <details> + <summary>
     For accordion mutual-exclusion: give all sibling <details> the same name attribute.
```

### Decision: do I need `role="..."` ?

```
Is there a native HTML element with the right semantics?
  yes -> use the element. NEVER add a role; it duplicates or conflicts with the implicit role.
  no  -> continue

Is the requirement a custom interactive widget (e.g. combobox, tablist, tree, treegrid) that no HTML element implements natively?
  yes -> use ARIA. See [[frontend-a11y-aria-patterns]] for the WAI APG patterns and required keyboard and state plumbing.
  no  -> question your requirement; you probably need a native element you have not considered yet.
```

The First Rule of ARIA: do not use ARIA if a native element with the required semantics exists. The Second Rule of ARIA: do not change native semantics unless absolutely necessary.

### Decision: `<article>` vs `<section>` vs `<div>`

```
Could this content be syndicated, repeated in a feed, or pulled out as a standalone item?
  yes -> <article>
  no  -> continue

Does this region have a heading and represent a thematic grouping of content?
  yes -> <section> (with a heading inside, h2..h6)
  no  -> continue

Is this region purely a styling or scripting wrapper with no semantic meaning?
  yes -> <div>
  no  -> reconsider; one of the above probably applies.
```

A `<section>` without a heading is meaningless to assistive technology. ALWAYS pair `<section>` with a heading element. NEVER use `<section>` as a generic styling wrapper.

## Patterns

### Pattern: the landmark skeleton

ALWAYS structure a document with the canonical landmark skeleton:

```html
<body>
  <header>
    <a href="/" class="logo">Brand</a>
    <nav aria-label="Primary">
      <ul><li><a href="/products">Products</a></li></ul>
    </nav>
    <search>
      <form role="search-form-only-if-needed" action="/search">
        <label>Search <input type="search" name="q"></label>
        <button>Search</button>
      </form>
    </search>
  </header>
  <main>
    <h1>Page title</h1>
  </main>
  <aside aria-label="Related">
  </aside>
  <footer>
  </footer>
</body>
```

Note that `<search>` wraps the controls that perform the search, NOT the results. The implicit role `search` on `<search>` replaces the legacy `<form role="search">` pattern; do NOT add `role="search"` to the inner `<form>`.

### Pattern: the `<search>` element

Source: [MDN: `<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search) (verified 2026-05-19).

The `<search>` element groups one or more search-related controls (input, button, filters). It has implicit ARIA role `search`. Baseline Widely Available since October 2023.

Authoring rules:

- ALWAYS wrap the search controls in `<search>`. NEVER wrap the results listing in `<search>`.
- `<search>` MAY contain a `<form>` inside it; the inner form does NOT need `role="search"` because the outer `<search>` already provides the landmark.
- The element is purely semantic. It has NO default visual styling and NO interactive behavior of its own.
- Multiple `<search>` regions on a single page are allowed (e.g. site search and a filter panel); label each with `aria-label` if more than one is present.

### Pattern: `<details>` and the accordion via `name`

Source: [MDN: `<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) (verified 2026-05-19).

The `<details>` element is the native disclosure widget. Its first child MUST be `<summary>`, which becomes the toggle button.

```html
<details>
  <summary>How do I install?</summary>
  <p>Run the install script.</p>
</details>
```

Accordion-style mutual exclusion (Baseline 2024) uses the shared `name` attribute. All `<details>` with the same `name` form an exclusive group: opening one closes the others.

```html
<details name="faq"><summary>Q1</summary>A1</details>
<details name="faq"><summary>Q2</summary>A2</details>
<details name="faq"><summary>Q3</summary>A3</details>
```

The `toggle` event fires on open and on close. The element exposes the `open` boolean attribute; toggling it programmatically opens or closes the disclosure.

NEVER rebuild this widget with `<button aria-expanded>` plumbing when `<details>` fits the requirement.

### Pattern: `<dialog>` light reference

Source: [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19).

`<dialog>` is the native modal-or-non-modal dialog element. Per MDN: `tabindex` MUST NEVER be set on `<dialog>`. Initial focus goes to the first focusable descendant unless `autofocus` is set on a specific descendant. Full mechanics (`showModal()`, `show()`, `close()`, `closedby`, `::backdrop`, top-layer behavior) belong in `[[frontend-impl-popover-dialog-anchor]]`.

For this skill the essential rules:

- NEVER add `tabindex` to a `<dialog>`.
- ALWAYS use `<dialog>` for modal patterns; do NOT roll your own `<div role="dialog">`.
- Implicit role is `dialog` when opened via `show()`, and effectively `dialog` when opened via `showModal()`. Use `role="alertdialog"` only for interrupt-style dialogs that demand immediate user response.

### Pattern: declarative Shadow DOM via `<template shadowrootmode>`

Source: [MDN: `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) (verified 2026-05-19).

Declarative Shadow DOM lets the HTML parser attach a shadow root at parse time, with no JavaScript on the critical path. Three attributes control behavior:

| Attribute | Values | Effect |
|-----------|--------|--------|
| `shadowrootmode` | `open` or `closed` | Required. Marks the `<template>` as a shadow root payload. `open` allows script access via `element.shadowRoot`; `closed` does not. |
| `shadowrootdelegatesfocus` | boolean | When the host receives focus, focus is delegated to the first focusable descendant inside the shadow root. |
| `shadowrootclonable` | boolean | The shadow root is cloned when the host element is cloned (e.g. by `cloneNode(true)`). |

```html
<my-card>
  <template shadowrootmode="open" shadowrootdelegatesfocus>
    <style>
      :host { display: block; padding: 1rem; border: 1px solid currentColor; }
    </style>
    <slot></slot>
  </template>
  Card content goes here in light DOM.
</my-card>
```

Declarative Shadow DOM enables server-rendered web components that hydrate without any JavaScript dependency for first paint. The full custom-element registration model lives in `[[frontend-impl-web-components]]`.

### Pattern: document outline and heading hierarchy

The HTML5 document outline is derived from heading elements (`<h1>` through `<h6>`), NOT from sectioning elements. ALWAYS write headings in document order; NEVER skip levels for visual reasons.

Rules:

- ONE `<h1>` per document (the page title). Authors MAY repeat `<h1>` per `<article>` if the article is rendered standalone in feeds, but a single page-level `<h1>` is the safe default.
- ALWAYS place an `<h2>` (or lower) inside each `<section>` and `<article>`. A `<section>` without a heading does not contribute a region to assistive technology and reads as meaningless.
- NEVER skip a level. After `<h2>` the next sectioning heading is `<h3>`, never `<h4>`.

For grouping a heading with a tagline or subtitle, use `<hgroup>` with one heading plus paragraph children.

### Pattern: when an element accepts the implicit role for free

Sectioning elements behave differently based on context:

- `<header>` has role `banner` ONLY when it is a direct child of `<body>` (or of an element whose role is `main` per some implementations). Inside an `<article>` or `<section>`, `<header>` is generic.
- `<footer>` has role `contentinfo` ONLY when it is a direct child of `<body>`. Inside an `<article>`, `<footer>` is generic.
- `<section>` has role `region` ONLY when it has an accessible name (`aria-label`, `aria-labelledby`, or `title`). Without a name, `<section>` is a generic element with no landmark role.

NEVER assume a sectioning element always exposes a landmark. ALWAYS verify with an accessibility tree inspector (Chrome DevTools, Firefox Accessibility Inspector, axe-core).

## Cross-references

- `[[frontend-core-architecture]]` for why the markup layer is the foundation and how native semantics map to the accessibility tree.
- `[[frontend-syntax-html5-form]]` for the form-control surface (`<input>`, `<select>`, `<textarea>`, Constraint Validation API).
- `[[frontend-impl-popover-dialog-anchor]]` for full `<dialog>` and Popover API mechanics, anchor positioning, and the `closedby` attribute.
- `[[frontend-impl-web-components]]` for custom-element registration that consumes declarative Shadow DOM.
- `[[frontend-a11y-aria-patterns]]` for when a custom widget genuinely requires ARIA.
- `[[frontend-a11y-focus-keyboard-inert]]` for focus management and the `inert` attribute.

## Reference Links

- [WHATWG HTML Living Standard: Sections](https://html.spec.whatwg.org/multipage/sections.html) (verified 2026-05-19)
- [MDN: `<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search) (verified 2026-05-19)
- [MDN: `<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) (verified 2026-05-19)
- [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19)
- [MDN: `<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) (verified 2026-05-19)

Reference files local to this skill:

- `references/methods.md`: complete landmark element matrix with implicit ARIA role per context, attribute surface for `<details>`, `<dialog>` and `<template>`, document outline algorithm summary.
- `references/examples.md`: framework-agnostic code examples including a full landmarked HTML page suitable for an axe-core landmarks audit.
- `references/anti-patterns.md`: six anti-patterns with symptom, root cause, and fix.
