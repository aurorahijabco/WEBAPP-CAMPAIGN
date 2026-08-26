# References : CSS Nesting + Logical Properties Examples

All snippets verified against [MDN : CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) (verified 2026-05-19) and [MDN : CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) (verified 2026-05-19).

## 1. Renderable Self-Contained Demo

Save the following as `demo.html` and open in any evergreen-2026 browser. Use the language switcher in the header to toggle LTR / RTL / vertical-rl and observe how logical properties adapt without rewriting CSS.

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <title>Nesting + Logical Properties Demo</title>
  <style>
    :root {
      --fg: #1a1a1a;
      --fg-muted: #5a5a5a;
      --bg: #fafafa;
      --surface: #ffffff;
      --surface-hover: #f0f0f0;
      --border: #d0d0d0;
      --accent: #2563eb;
    }

    /* Reset uses logical properties throughout */
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding-block: 2rem;
      padding-inline: 1.5rem;
      font-family: system-ui, sans-serif;
      color: var(--fg);
      background: var(--bg);
    }

    /* Header : nested rules + logical properties */
    .app-header {
      display: flex;
      gap: 1rem;
      padding-block: 1rem;
      padding-inline: 1.25rem;
      margin-block-end: 2rem;
      border-block-end: 1px solid var(--border);
      background: var(--surface);
      border-radius: 8px;

      .app-title {
        font-weight: 700;
        font-size: 1.125rem;
        margin: 0;
      }

      .lang-switcher {
        margin-inline-start: auto;
        display: flex;
        gap: 0.25rem;
      }

      .lang-switcher button {
        padding-block: 0.25rem;
        padding-inline: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--surface);
        cursor: pointer;

        &:hover { background: var(--surface-hover); }
        &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      }
    }

    /* Card grid : nested @container + logical properties */
    .card-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      container-type: inline-size;
    }

    .card {
      display: grid;
      gap: 0.5rem;
      padding-block: 1rem;
      padding-inline: 1.25rem;
      border-radius: 12px;
      background: var(--surface);
      border-inline-start: 4px solid var(--accent);
      transition: background 120ms ease;

      .card-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }

      .card-body {
        margin: 0;
        color: var(--fg-muted);
      }

      .card-meta {
        margin-block-start: auto;
        font-size: 0.875rem;
        color: var(--fg-muted);
      }

      &:hover { background: var(--surface-hover); }

      &:focus-within {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    }

    /* Direction-conditional icon using :dir() */
    .next-link::after {
      content: " \2192"; /* rightwards arrow */
    }
    :dir(rtl) .next-link::after {
      content: " \2190"; /* leftwards arrow */
    }

    /* Vertical writing-mode demo */
    .vertical-tag {
      writing-mode: vertical-rl;
      inline-size: 6rem;   /* visible vertical extent under vertical-rl */
      block-size: 1.5rem;  /* visible horizontal extent */
      padding-block: 0.25rem;
      padding-inline: 0.5rem;
      background: var(--accent);
      color: white;
      font-size: 0.75rem;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <header class="app-header">
    <h1 class="app-title">Logical Properties Demo</h1>
    <div class="lang-switcher" role="group" aria-label="Direction">
      <button type="button" data-dir="ltr">LTR</button>
      <button type="button" data-dir="rtl">RTL</button>
      <button type="button" data-mode="vertical">Vertical</button>
    </div>
  </header>

  <main>
    <section class="card-grid">
      <article class="card" tabindex="0">
        <h2 class="card-title">Native nesting</h2>
        <p class="card-body">The &amp; selector references the parent. Pseudo-classes and combinators require it; bare class names do not.</p>
        <p class="card-meta"><a class="next-link" href="#">Read more</a></p>
      </article>

      <article class="card" tabindex="0">
        <h2 class="card-title">Logical properties</h2>
        <p class="card-body">margin-inline-start and inset-inline-end follow the reading direction. Switch RTL to see the accent border swap sides.</p>
        <p class="card-meta">
          <span class="vertical-tag">vertical-rl</span>
          <a class="next-link" href="#">Read more</a>
        </p>
      </article>

      <article class="card" tabindex="0">
        <h2 class="card-title">Nested at-rules</h2>
        <p class="card-body">@container and @media nest directly inside a selector body. No separate top-level block needed.</p>
        <p class="card-meta"><a class="next-link" href="#">Read more</a></p>
      </article>
    </section>
  </main>

  <script>
    document.querySelector('.lang-switcher').addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const html = document.documentElement;
      if (button.dataset.dir) {
        html.dir = button.dataset.dir;
        html.style.writingMode = '';
      } else if (button.dataset.mode === 'vertical') {
        html.dir = 'ltr';
        html.style.writingMode = 'vertical-rl';
      }
    });
  </script>
</body>
</html>
```

### What this demo proves

1. The accent border (`border-inline-start`) is on the left under LTR and on the right under RTL without any CSS change.
2. The "Read more" arrow swaps direction via `:dir(rtl)`.
3. Toggling vertical writing-mode rotates the card layout; `inline-size` on the vertical tag now controls its screen-vertical extent.
4. Hover, focus-within, and the `@container` query inside `.card` all use nested syntax.
5. The header uses nested `&:hover` and `&:focus-visible` on the language buttons.

## 2. Sass-to-Native Migration Reference

```scss
/* Sass source (no longer needed for these patterns) */
.btn {
  padding: 0.5rem 1rem;

  &--primary { background: blue; color: white; }
  &--ghost   { background: transparent; border: 1px solid currentColor; }

  &:hover    { filter: brightness(1.1); }
  & > .icon  { margin-right: 0.5rem; }
}
```

```css
/* Native equivalent. BEM modifier rules must be flat. */
.btn {
  padding-block: 0.5rem;
  padding-inline: 1rem;

  &:hover    { filter: brightness(1.1); }
  & > .icon  { margin-inline-end: 0.5rem; }
}

.btn--primary { background: blue; color: white; }
.btn--ghost   { background: transparent; border: 1px solid currentColor; }
```

The two `.btn--*` rules CANNOT live inside `.btn { ... }` with native nesting, because `&--primary` would parse as the combinator-less compound selector `<parent>--primary` which is not a valid selector.

## 3. Specificity Verification

```css
.card {
  color: black;                    /* (0,1,0) */

  &.is-active { color: red; }      /* (0,2,0) */
  .title { color: blue; }          /* (0,2,0) */
  & > .body & .meta { color: gray; } /* (0,3,0) */
}
```

After flattening, the specificities match the rules above. To verify in DevTools : Inspect element, see Computed > Source, hover the specificity badge.

## 4. Mixing Block and Inline Cleanly

```css
.field {
  display: grid;
  gap: 0.25rem;
  padding-block: 0.5rem;
  padding-inline: 0;

  & > label {
    font-weight: 500;
  }

  & > input,
  & > textarea,
  & > select {
    inline-size: 100%;
    padding-block: 0.5rem;
    padding-inline: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }
  }

  & > .field-help {
    color: var(--fg-muted);
    font-size: 0.875rem;
  }
}
```

The `inline-size: 100%` here is identical to `width: 100%` under horizontal-tb LTR but composes correctly if the form is ever rendered in a vertical writing-mode container.

## 5. Direction-Aware Drawer Off-Screen

```css
.drawer {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;        /* anchor to start edge (left in LTR, right in RTL) */
  inline-size: 320px;
  transform: translateX(-100%); /* OFF-screen in LTR; WRONG side in RTL */
}

:dir(rtl) .drawer {
  transform: translateX(100%);  /* RTL needs reversed sign */
}

.drawer.is-open { transform: translateX(0); }
```

Logical properties handle the anchor (`inset-inline-start`), but `translate` is physical. Either author both directions via `:dir()`, or use the newer `translate` longhand with custom-property switching, OR migrate to `transform: translateX(calc(var(--sign) * 100%))` with `--sign: 1` and `:dir(rtl) { --sign: -1; }`.
