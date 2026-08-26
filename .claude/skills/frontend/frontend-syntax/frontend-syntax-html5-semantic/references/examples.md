# Examples : Frontend Syntax HTML5 Semantic

Framework-agnostic examples for the semantic markup surface, including a fully landmarked HTML page suitable for an axe-core landmarks audit. All snippets target evergreen-2026 browsers.

## Example : fully landmarked HTML page

Save this file as `landmarks.html` and open it in a browser. Run an accessibility audit (Chrome DevTools Lighthouse, Firefox Accessibility Inspector, or axe-core). The page exposes one `banner`, one `navigation`, one `search`, one `main`, one `complementary`, and one `contentinfo` landmark, with no redundant `role="..."` attributes.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Landmarks demo</title>
</head>
<body>
  <header>
    <a href="/" class="logo">Brand</a>
    <nav aria-label="Primary">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/products">Products</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
    <search>
      <form action="/search" method="get">
        <label>
          Search the site
          <input type="search" name="q" autocomplete="off">
        </label>
        <button type="submit">Go</button>
      </form>
    </search>
  </header>

  <main>
    <h1>Hello, semantic web</h1>

    <article>
      <header>
        <h2>Why semantic HTML wins in 2026</h2>
        <p>Posted 2026-05-19</p>
      </header>
      <p>Native semantic elements give correct accessibility tree mapping without ARIA plumbing.</p>
      <footer>
        <p>Tagged: a11y, html5</p>
      </footer>
    </article>

    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently asked questions</h2>
      <details name="faq">
        <summary>Do I still need ARIA in 2026?</summary>
        <p>Only when no native element fits. See the WAI APG for the exceptions.</p>
      </details>
      <details name="faq">
        <summary>What is the search element for?</summary>
        <p>Wraps the controls that perform a search. Not the results.</p>
      </details>
      <details name="faq">
        <summary>Is the section element a landmark by default?</summary>
        <p>Only when it has an accessible name. Otherwise it is generic.</p>
      </details>
    </section>
  </main>

  <aside aria-label="Related reading">
    <h2>Related</h2>
    <ul>
      <li><a href="/posts/css-2026">Modern CSS in 2026</a></li>
      <li><a href="/posts/wcag-22">WCAG 2.2 in practice</a></li>
    </ul>
  </aside>

  <footer>
    <p>Copyright 2026, Brand.</p>
    <nav aria-label="Footer">
      <ul>
        <li><a href="/privacy">Privacy</a></li>
        <li><a href="/terms">Terms</a></li>
      </ul>
    </nav>
  </footer>
</body>
</html>
```

Verified against the element rules at [WHATWG HTML Living Standard: Sections](https://html.spec.whatwg.org/multipage/sections.html) (verified 2026-05-19), [MDN: `<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search) (verified 2026-05-19), and [MDN: `<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) (verified 2026-05-19).

Notes:

- The inner `<header>` inside `<article>` is generic, NOT a second `banner`. Same for the inner `<footer>` inside `<article>`.
- The two `<nav>` elements use `aria-label` to differentiate (Primary vs Footer).
- The `<section>` exposes a `region` landmark only because `aria-labelledby` is set.

## Example : the `<search>` element correctly used

The `<search>` element wraps the search controls only.

```html
<search>
  <form action="/search" method="get">
    <label>
      Search products
      <input type="search" name="q">
    </label>
    <button type="submit">Search</button>
  </form>
</search>

<section aria-label="Search results">
  <ol>
    <li><a href="/products/1">Result 1</a></li>
    <li><a href="/products/2">Result 2</a></li>
  </ol>
</section>
```

The results listing is a separate `<section>` with `aria-label="Search results"`. NEVER wrap the results inside `<search>`.

## Example : accordion via `<details name="">`

```html
<section aria-labelledby="faq-heading">
  <h2 id="faq-heading">Account FAQ</h2>

  <details name="account-faq">
    <summary>How do I reset my password?</summary>
    <p>Click "Forgot password" on the sign-in page.</p>
  </details>
  <details name="account-faq">
    <summary>How do I change my email?</summary>
    <p>Go to Account Settings, Email.</p>
  </details>
  <details name="account-faq">
    <summary>How do I delete my account?</summary>
    <p>Go to Account Settings, Delete account.</p>
  </details>
</section>
```

Opening one disclosure closes the others, because all three share `name="account-faq"`. Baseline 2024.

## Example : disclosure with `toggle` event delegation

```html
<section aria-labelledby="settings-heading" id="settings">
  <h2 id="settings-heading">Settings</h2>
  <details><summary>Profile</summary><p>...</p></details>
  <details><summary>Notifications</summary><p>...</p></details>
  <details><summary>Privacy</summary><p>...</p></details>
</section>

<script type="module">
  const section = document.getElementById("settings");
  section.addEventListener("toggle", (event) => {
    if (!(event.target instanceof HTMLDetailsElement)) return;
    if (event.target.open) {
      console.log("opened:", event.target.querySelector("summary")?.textContent?.trim());
    }
  }, true);
</script>
```

The `toggle` event bubbles in capture mode. The narrowing via `instanceof HTMLDetailsElement` keeps the handler resilient to future markup additions.

## Example : declarative Shadow DOM

A server-rendered web component that hydrates without JavaScript on the critical path.

```html
<my-card>
  <template shadowrootmode="open" shadowrootdelegatesfocus>
    <style>
      :host {
        display: block;
        padding: 1rem;
        border: 1px solid currentColor;
        border-radius: 0.5rem;
      }
      ::slotted(h3) {
        margin-block-start: 0;
      }
    </style>
    <slot></slot>
  </template>

  <h3>Card title</h3>
  <p>Card body in the light DOM, slotted into the shadow tree.</p>
  <button>Action</button>
</my-card>
```

The HTML parser attaches the `<template>` content as a shadow root to `<my-card>` at parse time. The light-DOM children (`<h3>`, `<p>`, `<button>`) project into the `<slot>`. No script runs for first paint.

Custom-element registration (`customElements.define()`) and the full Web Components surface are covered in `[[frontend-impl-web-components]]`.

## Example : `<dialog>` light usage

Full mechanics in `[[frontend-impl-popover-dialog-anchor]]`. The minimal surface:

```html
<button id="open-confirm">Delete account</button>
<dialog id="confirm">
  <form method="dialog">
    <p>Are you sure?</p>
    <button value="cancel">Cancel</button>
    <button value="confirm" autofocus>Delete</button>
  </form>
</dialog>

<script type="module">
  const dialog = document.getElementById("confirm");
  document.getElementById("open-confirm").addEventListener("click", () => {
    dialog.showModal();
  });
  dialog.addEventListener("close", () => {
    if (dialog.returnValue === "confirm") {
      // proceed with deletion
    }
  });
</script>
```

The dialog opens via `showModal()` and closes via the form's `method="dialog"` (the submit button's `value` becomes `dialog.returnValue`). The `autofocus` attribute sets initial focus to the Delete button. NEVER add `tabindex` to `<dialog>`.

## Example : when to fall back to `<div>` or `<span>`

```html
<!-- WRONG: <section> without a heading is meaningless to AT -->
<section class="card">
  <p>Some content with no heading.</p>
</section>

<!-- RIGHT: <div> for a pure styling wrapper -->
<div class="card">
  <p>Some content with no heading.</p>
</div>

<!-- RIGHT: <section> with a heading -->
<section aria-labelledby="card-heading" class="card">
  <h3 id="card-heading">Card title</h3>
  <p>Content.</p>
</section>
```

A `<section>` without a heading does NOT contribute to the landmark tree. Use `<div>` for purely visual or scripting wrappers.

## Example : multiple `<nav>` regions, labelled

```html
<header>
  <nav aria-label="Primary">
    <ul><li><a href="/products">Products</a></li></ul>
  </nav>
</header>

<aside aria-label="Page sections">
  <nav aria-label="On this page">
    <ul>
      <li><a href="#intro">Intro</a></li>
      <li><a href="#methods">Methods</a></li>
      <li><a href="#results">Results</a></li>
    </ul>
  </nav>
</aside>

<footer>
  <nav aria-label="Footer">
    <ul><li><a href="/privacy">Privacy</a></li></ul>
  </nav>
</footer>
```

Three `<nav>` landmarks, each with a unique `aria-label`. Assistive technologies expose them as three distinct navigation regions, named Primary, On this page, and Footer.
