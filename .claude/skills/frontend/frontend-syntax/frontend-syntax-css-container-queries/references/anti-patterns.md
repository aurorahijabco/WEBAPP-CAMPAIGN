# Anti-patterns : Frontend Syntax CSS Container Queries

Six anti-patterns covering the most common container-query failures. Each entry follows the `Symptom : Root cause : Fix` shape.

## Anti-pattern 1 : `container-type: size` without explicit height

**Symptom**: the element collapses to zero height. Children disappear. The layout that worked before adding `container-type: size` is broken.

**Root cause**: `container-type: size` applies size containment in BOTH axes. Size containment makes the element's intrinsic block size zero, because containment forbids the element from measuring its own contents. The element only has size if a height is set explicitly (via `height`, `min-height`, `aspect-ratio`, or grid track sizing).

**Fix**: choose `container-type: inline-size` unless block queries are genuinely required. When block queries ARE required, provide an explicit or intrinsic height.

```css
/* WRONG : collapses */
.card { container-type: size; }

/* RIGHT : default for components */
.card { container-type: inline-size; }

/* RIGHT : size queries with explicit height */
.tile {
  container-type: size;
  aspect-ratio: 1 / 1;
}
```

Source: [MDN: container-type](https://developer.mozilla.org/en-US/docs/Web/CSS/container-type) (verified 2026-05-19).

## Anti-pattern 2 : querying a container with `@media`

**Symptom**: the rule never fires. The component does not respond to its container's width. The same code worked when copied from a media-query example.

**Root cause**: `@media` queries the viewport, NOT the container. A rule like `@media (width > 400px)` always reads viewport width, regardless of which element the rule's selector targets.

**Fix**: switch to `@container`. ALWAYS use `@container` for component-internal width or height decisions. Reserve `@media` for viewport-level rules and user preferences (reduced motion, color scheme).

```css
/* WRONG : reads viewport */
@media (width > 400px) {
  .card { display: grid; grid-template-columns: 8rem 1fr; }
}

/* RIGHT : reads the card's own container */
.card { container-type: inline-size; }
@container (width > 400px) {
  .card { display: grid; grid-template-columns: 8rem 1fr; }
}
```

## Anti-pattern 3 : `cqi` used outside any containment ancestor

**Symptom**: a value declared in `cqi` resolves much larger than expected. Type that should be 4% of the card width is 4% of the viewport width. The page looks fine on small screens and broken on wide screens.

**Root cause**: when no ancestor has `container-type`, `cqi` falls back to `svi` (the small-viewport inline size). The fallback is silent; there is no console warning. The value is technically correct per the spec but not what the author intended.

**Fix**: ALWAYS pair `cq*` units with a `container-type` ancestor. If a stand-alone heading needs to scale, give its parent `container-type: inline-size`.

```css
/* WRONG : cqi falls back to svi */
.headline { font-size: 5cqi; }

/* RIGHT : containment ancestor establishes the unit basis */
.hero { container-type: inline-size; }
.hero .headline { font-size: 5cqi; }
```

Diagnose by inspecting the resolved value in DevTools.

## Anti-pattern 4 : nested `container-type` shadows the intended container

**Symptom**: an anonymous `@container` query matches a smaller, inner container instead of the outer one. The layout switches at the wrong width.

**Root cause**: an anonymous `@container` query targets the NEAREST ancestor with any `container-type`. If a closer ancestor than the intended one has `container-type` set, that ancestor wins.

**Fix**: name the containers. Use the named-query form to target the intended container regardless of how many other containers nest between them.

```css
/* WRONG : the inner .card containment shadows the outer .layout */
.layout { container-type: inline-size; }
.card { container-type: inline-size; }

@container (width > 900px) {
  .card .meta { display: inline-flex; }  /* matches .card, not .layout */
}

/* RIGHT : named query targets the intended container */
.layout { container: layout / inline-size; }
.card { container: card / inline-size; }

@container layout (width > 900px) {
  .card .meta { display: inline-flex; }
}
```

A descendant can carry multiple container names (`container-name: card sidebar-host;`). Queries match the nearest ancestor whose name list contains the queried token.

## Anti-pattern 5 : style container query without an `@supports` gate

**Symptom**: on some evergreen browsers the style-query block is silently ignored. The themed styles never apply. The browser console shows no warning.

**Root cause**: style container queries are Baseline 2025. Older still-evergreen builds in the install base do not parse the form and drop the entire `@container style(...)` block at parse time.

**Fix**: gate with `@supports` (or with feature detection in JS) and provide a non-query fallback. ALWAYS verify Baseline status at [web.dev: Baseline](https://web.dev/baseline) (verified 2026-05-19) before assuming a feature is universal.

```css
/* WRONG : silent failure on Baseline-2024 browsers */
@container style(--theme: dark) {
  .card { background: #111; color: #eee; }
}

/* RIGHT : gated, with a non-query fallback path via attribute selector */
[data-theme="dark"] .card { background: #111; color: #eee; }

@supports (container-type: normal) {
  @container style(--theme: dark) {
    .card { background: #111; color: #eee; }
  }
}
```

See `[[frontend-core-web-standards-baseline]]` for the gating procedure.

## Anti-pattern 6 : `container-type` set on the element being queried (self-query)

**Symptom**: an `@container` rule never matches the element that carries `container-type`. The author expected a self-referential query.

**Root cause**: an `@container` query matches DESCENDANTS of the container, not the container itself. The element with `container-type` establishes the containment context for its descendants; it cannot query itself.

**Fix**: put `container-type` on a PARENT of the elements you want to style. Move the styled element one level down inside the container.

```css
/* WRONG : the .card with container-type cannot query its own width */
.card {
  container-type: inline-size;
}
@container (width > 400px) {
  .card { display: grid; }  /* never matches */
}

/* RIGHT : container is the outer wrapper; inner element is queried */
.card-shell {
  container-type: inline-size;
}
@container (width > 400px) {
  .card-shell > .card { display: grid; }
}
```

A common refactor is to introduce a wrapper element (`.card-shell` or `.card-host`) whose only job is to be the container, and put the visual element inside it.
