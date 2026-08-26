# Anti-patterns : Frontend Core Architecture

Six anti-patterns that ground the architecture decisions in this skill. Each entry follows the `Symptom : Root cause : Fix` shape.

## Anti-pattern 1 : Sass to compile native CSS nesting

**Symptom**: project ships a Sass toolchain whose only transformation is converting nested rules to flat selectors. Build time is several seconds; source maps are required to debug; CI installs the toolchain on every push.

**Root cause**: stale knowledge of browser support. Native CSS nesting (`&` selector) shipped as Baseline Widely Available. Authors assumed nesting still required a preprocessor.

**Fix**: drop Sass. Author `.css` directly. The `&` nesting selector represents the parent. Pseudo-classes and combinators after `&` work as expected (`&:hover`, `& > .child`). Verified at [MDN: CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) which is referenced by [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/) (verified 2026-05-19) as part of the platform baseline.

Note: native nesting does NOT support the Sass BEM trick `&__icon`. Authors MUST write the full class name (`.card__icon { ... }`).

## Anti-pattern 2 : Bundling a vanilla site that imports four modules

**Symptom**: a static marketing page with 200 lines of JavaScript across four modules runs a 3-second Vite build on every change. Deployment ships a bundle plus a source map. Local dev requires a running dev server to load relative imports.

**Root cause**: reflex bundling. The author treats "JavaScript" and "build step" as inseparable. Native ES module loading is forgotten.

**Fix**: serve raw `.js` files. Use `<script type="module" src="...">` for entry points. Use relative URLs (`./formatters.js`) or an import map (`<script type="importmap">{ "imports": { "cart": "/modules/cart.js" } }</script>`) for bare specifiers. The browser fetches, parses, and links modules natively. No build runs.

Adopt a bundler only when ONE of these conditions is true:
- TypeScript adopted.
- Tree-shaking saves at least 30% of payload.
- npm-only dependency that ships CommonJS or unbundled.
- More than around 20 source modules where HTTP request overhead becomes measurable.

## Anti-pattern 3 : Polyfilling features that are already Baseline

**Symptom**: production bundle ships 40 KB of polyfill code for `:has()`, `Object.groupBy()`, `structuredClone()`, or `<dialog>`. Lighthouse flags unused JavaScript. First-paint cost rises.

**Root cause**: stale browser-support knowledge. The team's polyfill list was assembled before the feature reached Baseline Widely Available status. No re-verification ran.

**Fix**: BEFORE adding a polyfill, verify Baseline status at [web.dev: Baseline](https://web.dev/baseline) (verified 2026-05-19) for the target. If the feature is Baseline Widely Available, NEVER polyfill. If the feature is Baseline 2024 Newly Available, the polyfill cost is usually wrong; verify the actual browser-version floor the project supports and re-decide. If the feature is Baseline 2025 or Limited Availability, prefer feature-detection with `@supports` (CSS) or `if (typeof X === "function")` (JS) and ship a graceful fallback, NOT a polyfill.

See `[[frontend-core-web-standards-baseline]]` for the full Baseline-gating procedure.

## Anti-pattern 4 : Animating width or height to slide a panel

**Symptom**: a side-panel slides in. Frame rate drops to ~30 fps during the slide. Scroll position jumps. Content reflows visibly. The dev tools Performance tab shows long Layout work each frame.

**Root cause**: animating `width` (or `height`, or `left`, or `right`) invalidates Layout every animation frame. The browser must re-flow the surrounding context for the entire animation duration.

**Fix**: animate `transform: translateX()` instead. Reserve the panel's space with its final width at all times; use the transform to move it off-canvas in the closed state. The compositor handles the animation entirely on the GPU thread; Layout never runs during the animation.

```css
.panel {
  width: 320px;
  transform: translateX(-100%);
  transition: transform 300ms ease;
  will-change: transform;
}
.panel.is-open {
  transform: translateX(0);
}
```

If the visual goal genuinely requires surrounding content to reclaim space (true reflow), accept the Layout cost but isolate it with `contain: layout` on the parent so the reflow does not cascade outside the local box.

## Anti-pattern 5 : Reading layout in a scroll handler (layout thrash)

**Symptom**: scroll feels sluggish on a content-heavy page. The Performance panel shows alternating Style/Layout work tied to scroll events. INP regresses.

**Root cause**: a scroll handler reads `getBoundingClientRect()`, `offsetTop`, `clientHeight`, or `getComputedStyle()` AFTER any prior write in the same frame. Each read forces the browser to flush pending Layout synchronously. The pattern repeats every scroll event for every observed element.

**Fix**: ALWAYS replace scroll-tied layout-reads with `IntersectionObserver` (for "is in viewport") or `ResizeObserver` (for "size changed"). Both observers read layout state off the main thread and notify asynchronously in batches.

```js
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }
});
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
```

When a layout-read in JS is truly required, batch ALL reads before ANY writes. The `requestAnimationFrame` callback is the canonical place: read in the rAF, write in the rAF. NEVER interleave reads and writes.

## Anti-pattern 6 : Treating MDN as authoritative for spec disagreements

**Symptom**: implemented code that follows an MDN page exactly fails interop tests across browsers. Filing a bug against a browser leads back to a documentation issue: MDN was out of date relative to the Living Standard.

**Root cause**: MDN tracks the Browser Compatibility Data (BCD) plus a curated explanation layer. MDN is updated by community contributions and lags the Living Standard, especially after a spec change. When the underlying spec changes, MDN can take weeks to update.

**Fix**: spec lookup discipline (see SKILL.md Pattern : spec lookup discipline). Order:

1. WHATWG Living Standard for HTML and DOM (e.g. [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/) (verified 2026-05-19)).
2. W3C TR for CSS modules.
3. MDN as secondary, BCD-backed reference.
4. web.dev for Chrome-team applied guidance.

When MDN and the Living Standard disagree, the Living Standard wins. Log the discrepancy in the project LESSONS.md so peers can verify before relying on MDN for similar topics. NEVER cite a tutorial site, blog, or framework documentation for normative platform behavior.
