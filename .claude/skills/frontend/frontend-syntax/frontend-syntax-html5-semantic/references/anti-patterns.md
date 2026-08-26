# Anti-patterns : Frontend Syntax HTML5 Semantic

Six anti-patterns covering the most common semantic-markup mistakes. Each entry follows the `Symptom : Root cause : Fix` shape.

## Anti-pattern 1 : `<form role="search">` instead of `<search>`

**Symptom**: an audit reports a `search` landmark that is also a `form` landmark. Screen-reader users hear "search form" twice. Some assistive technologies announce only one of the two roles, leading to inconsistent UX across browsers.

**Root cause**: the `role="search"` ARIA pattern dates from before the `<search>` element existed. `<search>` shipped as Baseline Widely Available since October 2023 (verified at [MDN: `<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search) (verified 2026-05-19)). Authors retained the legacy pattern by habit.

**Fix**: wrap the search controls in `<search>` and drop `role="search"` from the inner `<form>`. The `<form>` can stay as the submission mechanism; only its `role` attribute is wrong.

```html
<!-- WRONG -->
<form role="search" action="/search">
  <input type="search" name="q">
  <button>Go</button>
</form>

<!-- RIGHT -->
<search>
  <form action="/search">
    <input type="search" name="q">
    <button>Go</button>
  </form>
</search>
```

## Anti-pattern 2 : `<div class="header">` instead of `<header>`

**Symptom**: an audit reports zero `banner` landmarks. The screen-reader rotor has no top-of-page region. Keyboard users land on the first `<a>` instead of the site logo when pressing the landmark-jump shortcut.

**Root cause**: a div-soup authoring habit from pre-HTML5 templates. `class="header"` does nothing for accessibility; it is purely a CSS hook.

**Fix**: use `<header>` directly. The element exposes the `banner` landmark automatically when placed as a direct child of `<body>`. CSS hooks the element type the same way it hooks a class.

```html
<!-- WRONG -->
<div class="header">
  <a href="/">Brand</a>
</div>

<!-- RIGHT -->
<header>
  <a href="/">Brand</a>
</header>
```

Apply CSS via the element selector (`body > header { ... }`) or via a class on the element (`<header class="site-header">`). NEVER rely on `class="header"` for accessibility.

## Anti-pattern 3 : multiple `<main>` per page

**Symptom**: an audit reports more than one `main` landmark. Screen readers cannot consistently announce "main content" because the rotor lists two competing regions. Skip-link targets break: the `Skip to main content` link no longer has one unambiguous destination.

**Root cause**: a template includes a global page `<main>` and a per-tab `<main>` inside a tab panel, or an author copies a starter template into a page that already has `<main>`.

**Fix**: keep EXACTLY one `<main>` per document. For tab-style interfaces, use a single `<main>` and switch panel visibility inside it. For multi-content layouts (article + sidebar), the article goes inside `<main>` and the sidebar uses `<aside>` outside `<main>`.

```html
<!-- WRONG -->
<main>
  <article>...</article>
  <main>
    <p>Side content.</p>
  </main>
</main>

<!-- RIGHT -->
<main>
  <article>...</article>
</main>
<aside>
  <p>Side content.</p>
</aside>
```

The HTML spec at [WHATWG HTML Living Standard: Sections](https://html.spec.whatwg.org/multipage/sections.html) (verified 2026-05-19) permits more than one `<main>` only when all but one are hidden via `hidden` or via being inside an inert subtree. Treat that as an edge case; the safe rule is one visible `<main>`.

## Anti-pattern 4 : `<section>` without a heading

**Symptom**: an audit lists a `region` landmark with no accessible name, or no landmark at all where the developer expected one. Screen-reader users hear "region" with no further context, or skip the section entirely.

**Root cause**: a `<section>` element used as a generic visual or layout wrapper. The author assumed `<section>` always exposes a landmark; in fact `<section>` exposes `region` ONLY when it has an accessible name (`aria-label`, `aria-labelledby`, or `title`).

**Fix**: pair every `<section>` with a heading and give the section an accessible name that points at that heading. If there is no appropriate heading, use `<div>` instead.

```html
<!-- WRONG -->
<section class="hero">
  <p>Promotional content.</p>
</section>

<!-- RIGHT, when a heading fits -->
<section aria-labelledby="hero-heading" class="hero">
  <h2 id="hero-heading">Get started today</h2>
  <p>Promotional content.</p>
</section>

<!-- RIGHT, when no heading fits -->
<div class="hero">
  <p>Promotional content.</p>
</div>
```

## Anti-pattern 5 : `<search>` wrapping search RESULTS

**Symptom**: an audit reports a `search` landmark that contains the entire results listing. Screen-reader users navigating by landmarks land on the results region with the wrong region role. The `search` rotor entry includes hundreds of result items instead of just the search controls.

**Root cause**: confusion about the element's purpose. `<search>` is for the controls that PERFORM a search, NOT for the results that come back.

**Fix**: keep `<search>` around the input and submit button. Put the results in a separate region, typically a `<section aria-labelledby="...">` or a `<div role="region" aria-label="...">` (or just plain markup with a heading and let the document flow speak).

```html
<!-- WRONG -->
<search>
  <form action="/search"><input type="search" name="q"><button>Go</button></form>
  <ol>
    <li><a href="/products/1">Result 1</a></li>
  </ol>
</search>

<!-- RIGHT -->
<search>
  <form action="/search"><input type="search" name="q"><button>Go</button></form>
</search>
<section aria-labelledby="results-heading">
  <h2 id="results-heading">Search results</h2>
  <ol>
    <li><a href="/products/1">Result 1</a></li>
  </ol>
</section>
```

Source: [MDN: `<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search) (verified 2026-05-19).

## Anti-pattern 6 : `tabindex` on `<dialog>`

**Symptom**: the dialog receives focus directly (its own outline appears) instead of focus delegating to a descendant control. Tab order behaves unpredictably across browsers. The Escape key behavior differs from native modal expectations.

**Root cause**: a copy of an older `role="dialog"` div-based modal pattern carried `tabindex="-1"` (so the wrapper could receive programmatic focus). When the wrapper was changed to `<dialog>`, the `tabindex` was kept. Per MDN, this is explicitly forbidden: `tabindex` MUST NEVER be set on `<dialog>`.

**Fix**: remove the `tabindex` attribute from `<dialog>`. The element manages focus internally. To set initial focus, place `autofocus` on the intended descendant control (a primary action button, the close button, or the first form field).

```html
<!-- WRONG -->
<dialog tabindex="-1">
  <button>Confirm</button>
</dialog>

<!-- RIGHT -->
<dialog>
  <button autofocus>Confirm</button>
</dialog>
```

Source: [MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) (verified 2026-05-19).

Full dialog mechanics (`showModal()`, `closedby`, `::backdrop`, top-layer behavior) live in `[[frontend-impl-popover-dialog-anchor]]`. For focus-management patterns beyond the dialog, see `[[frontend-a11y-focus-keyboard-inert]]`.
