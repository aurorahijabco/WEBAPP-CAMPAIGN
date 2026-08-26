# Examples Reference : frontend-core-design-philosophy

This skill is a philosophy skill, not a concrete-component skill. The examples below are illustrative code snippets demonstrating how the philosophy translates into web platform primitives. They are NOT designed as a single renderable page ; each snippet shows one pattern in isolation. The concrete-component skills (e.g. `[[frontend-impl-responsive-layout]]`, `[[frontend-impl-design-tokens]]`) ship the renderable artifacts.

## Example 1 : Asymmetric grid with container queries

This snippet shows how to replace the AI-generic three-column symmetric grid with an asymmetric component that adapts to its container, not to the viewport. The pattern is documented at [MDN : Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19).

```css
.feature-section {
  container-type: inline-size;
  container-name: features;
  padding-block: clamp(4rem, 8vw, 10rem);
}

.feature-section > .grid {
  display: grid;
  gap: var(--space-lg, 2rem);
  grid-template-columns: 1fr;
}

@container features (inline-size > 640px) {
  .feature-section > .grid {
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto auto;
    align-items: start;
  }
  .feature-section > .grid > :first-child {
    grid-row: span 2;
  }
}

@container features (inline-size > 960px) {
  .feature-section > .grid {
    grid-template-columns: 3fr 1fr 1fr;
    grid-template-rows: auto;
  }
  .feature-section > .grid > :first-child {
    grid-row: auto;
  }
}
```

NEVER hardcode pixel breakpoints from the viewport when a component appears in multiple contexts (sidebar, hero, modal). ALWAYS use `container-type: inline-size` and query the container.

## Example 2 : Native popover with anchor positioning

This snippet replaces 4 KB of JS click-outside / focus-trap / escape-handler / position-recompute code with five lines of CSS plus the `popover` HTML attribute. Verified against [MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using) (verified 2026-05-19).

```html
<button popovertarget="filter-menu" style="anchor-name: --filter-btn">
  Filter
</button>

<div id="filter-menu" popover>
  <ul>
    <li><label><input type="checkbox" checked> Active</label></li>
    <li><label><input type="checkbox"> Archived</label></li>
  </ul>
</div>

<style>
  #filter-menu {
    position-anchor: --filter-btn;
    inset-area: bottom span-right;
    margin-block-start: 0.5rem;
    border: 1px solid var(--color-border, oklch(85% 0.01 290));
    border-radius: var(--radius-soft, 12px);
    padding: 0.5rem 0.75rem;
  }
</style>
```

The browser ships dismissal (light-dismiss via outside click and Escape), focus trap inside the popover, and stacking-context isolation. ALWAYS use the native primitive when one exists.

## Example 3 : Cascade-layered stylesheet entry

This snippet shows the recommended top-of-file declaration. The order resolves specificity battles before they happen. Verified against [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19).

```css
@layer reset, tokens, base, components, utilities, overrides;

@import url("modern-reset.css") layer(reset);
@import url("./tokens.css") layer(tokens);

@layer base {
  :root { color-scheme: light dark; }
  html { text-rendering: optimizeLegibility; }
  body {
    font: 1rem/1.5 var(--font-body, system-ui, sans-serif);
    background: var(--surface-1);
    color: var(--color-text);
  }
  :focus-visible {
    outline: 2px solid var(--color-action-primary);
    outline-offset: 2px;
    border-radius: var(--radius-soft, 4px);
  }
}

@layer components {
  .button {
    min-block-size: 2.75rem;
    min-inline-size: 2.75rem;
    padding-inline: 1rem;
    background: var(--button-primary-bg, var(--color-action-primary));
    color: var(--button-primary-fg, oklch(98% 0.005 290));
    border-radius: var(--radius-sharp, 2px);
    border: none;
    cursor: pointer;
  }
}
```

Note the `min-block-size: 2.75rem` and `min-inline-size: 2.75rem` : at the default root font-size of 16 px, this resolves to 44 px x 44 px, comfortably above the WCAG 2.2 SC 2.5.8 floor of 24 x 24 CSS pixels ([W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) verified 2026-05-19).

## Example 4 : Motion with prefers-reduced-motion fallback

This snippet shows the recommended pattern from [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19) : default animation followed by a reduced-motion override that replaces transform-based motion with an opacity dissolve.

```css
.dialog {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

.dialog[open] {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .dialog {
    transform: none;
    transition: opacity 120ms ease-out;
  }
  .dialog[open] {
    transform: none;
  }
}
```

ALWAYS pair every animation rule with a reduced-motion override. NEVER ship transform-driven motion without a fallback.

## Example 5 : Color tokens via oklch and color-mix

This snippet shows the philosophy : one bold accent, a derived neutral. The brand chooses one chromatic anchor (off-axis, high chroma) ; the neutral palette is derived against the same anchor using `color-mix(in oklch, ...)`. Verified against [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19).

```css
:root {
  /* Primitive tokens */
  --brand-violet-500: oklch(60% 0.22 290);
  --brand-violet-50:  color-mix(in oklch, var(--brand-violet-500), white 92%);
  --brand-violet-900: color-mix(in oklch, var(--brand-violet-500), black 70%);

  --neutral-50:  color-mix(in oklch, var(--brand-violet-500), white 96%);
  --neutral-200: color-mix(in oklch, var(--brand-violet-500), white 80%);
  --neutral-700: color-mix(in oklch, var(--brand-violet-500), black 55%);
  --neutral-900: color-mix(in oklch, var(--brand-violet-500), black 80%);

  /* Semantic tokens */
  --color-action-primary: var(--brand-violet-500);
  --color-text-strong:    var(--neutral-900);
  --color-text-muted:     var(--neutral-700);
  --surface-1:            var(--neutral-50);
  --color-border:         var(--neutral-200);
}
```

The component layer consumes only semantic tokens, NEVER primitive tokens. Theming switches the primitive layer ; the rest of the stylesheet does not change.

## Example 6 : Typographic personality via variable fonts

This snippet illustrates how to use the weight axis as a hierarchy mechanism rather than scaling font-size alone. The principle is detailed in `[[frontend-impl-typography-system]]` ; this snippet is the philosophy translation.

```css
@layer base {
  :root {
    --font-display: "InterVariable", system-ui, sans-serif;
    --font-body:    "InterVariable", system-ui, sans-serif;
  }
  h1 {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5vw + 1rem, 6rem);
    font-variation-settings: "wght" 800, "opsz" 72;
    letter-spacing: -0.02em;
    line-height: 0.95;
  }
  body {
    font-family: var(--font-body);
    font-variation-settings: "wght" 380, "opsz" 16;
    line-height: 1.55;
  }
}
```

The contrast between an 800-weight display headline and a 380-weight body produces the rhythm that single-weight defaults cannot reach.

## Example 7 : Cascade order with third-party CSS

The third-party widget styles are imported into an isolated layer that precedes the project's `components` layer. Project styles consequently override the vendor without specificity escalation.

```css
@import url("https://vendor.example/widget.css") layer(vendor);

@layer vendor, reset, tokens, base, components, utilities, overrides;

@layer components {
  /* Project rules override vendor without !important */
  .vendor-button {
    background: var(--button-primary-bg);
  }
}
```

Per [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19), layered rules cascade by layer order, so later-declared layers (`components`) win over earlier layers (`vendor`) regardless of selector specificity.

## How to use these examples

These snippets are pedagogical, not production ready. The concrete production-ready implementations live in the implementation-tier skills :

- Container queries and asymmetric layouts : `[[frontend-impl-responsive-layout]]`
- The popover-anchor-dialog stack : `[[frontend-impl-component-patterns]]`
- The DTCG token build pipeline : `[[frontend-impl-design-tokens]]`
- The typographic scale : `[[frontend-impl-typography-system]]`
- The motion system : `[[frontend-a11y-motion-contrast-wcag22]]`

ALWAYS read this philosophy skill first, then the implementation skill, then write code.

## Sources (verified 2026-05-19)

- [MDN : Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using)
- [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/)
