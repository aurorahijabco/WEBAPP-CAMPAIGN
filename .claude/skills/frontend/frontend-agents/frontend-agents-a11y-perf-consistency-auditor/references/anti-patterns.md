# References : Anti-patterns the auditor catches

Eight high-frequency anti-patterns the auditor catches in production code, with the rule ID, symptom, root cause, and fix. All citations verified 2026-05-19.

## 1. `<div role="button">` reimplementing a native `<button>`

**Rule ID** : A9. **Severity** : ERROR.

**Symptom** : the auditor finds `<div role="button" tabindex="0" onClick={...} onKeyDown={handleEnterAndSpace}>` in a component file. Custom keyboard handlers reimplement what `<button>` provides natively. Forced-colors mapping is missing (the div does NOT get `ButtonText` under Windows High Contrast Mode because the user agent maps system colors to NATIVE element semantics, not ARIA roles).

**Root cause** : the team picked `<div>` for styling reasons and added `role="button"` after the accessibility-team review flagged it. The choice creates a maintenance burden : every browser update may change keyboard expectations, screen-reader semantics, or forced-colors behavior in ways the polyfill cannot match.

**Fix** :

```jsx
// Wrong
<div role="button" tabindex="0" onClick={handleClick} onKeyDown={handleKey}>
  Submit
</div>

// Right
<button type="button" onClick={handleClick}>Submit</button>
```

`<button>` provides : focus management, Space and Enter activation, default `type="submit"` behavior in forms, `ButtonText` / `ButtonFace` mapping under forced-colors, and screen-reader exposure as a button role. Source : [W3C WAI APG : First rule of ARIA](https://www.w3.org/WAI/ARIA/apg/) (verified 2026-05-19).

## 2. `:focus { outline: none }` without `:focus-visible` replacement

**Rule ID** : A2. **Severity** : ERROR.

**Symptom** : the auditor finds `*:focus { outline: none }` or any element-specific `:focus { outline: none }` in CSS without a matching `:focus-visible` rule. Keyboard users cannot see where focus currently is. Audit reports WCAG 2 4 7 Focus Visible fail.

**Root cause** : a "design polish" rule removed all focus outlines for aesthetics without replacing them with a `:focus-visible` outline that meets 3 to 1 contrast.

**Fix** :

```css
/* Wrong */
*:focus { outline: none; }

/* Right */
*:focus { outline: none; }
*:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
```

Source : [MDN : :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) (verified 2026-05-19).

## 3. `transition: all` on layout-trigger properties

**Rule ID** : P4. **Severity** : WARNING.

**Symptom** : the auditor finds `.card { transition: all 300ms }` in CSS. Performance traces show layout / style / paint cycles on every hover. Mobile users report jank.

**Root cause** : `transition: all` includes any property change in the transition, including layout-trigger properties like `width`, `height`, `margin`, `padding`, `top`, `left`. These trigger layout reflow on every frame.

**Fix** : specify only compositor-friendly properties.

```css
/* Wrong */
.card { transition: all 300ms; }

/* Right */
.card { transition: transform 300ms ease, opacity 300ms ease; }
```

Compositor-only properties : `transform`, `opacity`, `filter`, `backdrop-filter`, `color`.

## 4. `<img>` without `width` and `height`

**Rule ID** : P1. **Severity** : ERROR.

**Symptom** : the auditor finds `<img src="..." alt="..." />` without `width` and `height` attributes. Layout shifts as the image loads. CLS regression on initial paint.

**Root cause** : the developer relied on CSS `width: 100%; height: auto;` to size the image, forgetting that the browser cannot reserve a layout box without the intrinsic dimensions OR an `aspect-ratio` declaration.

**Fix** :

```html
<!-- Wrong -->
<img src="thumb.avif" alt="..." />

<!-- Right -->
<img src="thumb.avif" width="320" height="180" alt="..." />

<!-- Or, for fluid layout -->
<img src="thumb.avif" style="aspect-ratio: 16 / 9; width: 100%;" alt="..." />
```

Source : [web.dev : CLS](https://web.dev/articles/cls) (verified 2026-05-19).

## 5. `SKILL.md` over 500 lines

**Rule ID** : C3. **Severity** : ERROR.

**Symptom** : the auditor reports a `SKILL.md` at 612 lines. Validator script `validate-line-count.js` fails. The skill is too long for parent-agent consumption within a single tool call.

**Root cause** : detailed API tables, code examples, and anti-pattern catalogues were inlined in `SKILL.md` instead of being moved to `references/`. The `SKILL.md` is meant to be a high-level operational reference ; deep detail belongs in the reference files.

**Fix** :

1. Move detailed API tables (method signatures, complete attribute lists) to `references/methods.md`.
2. Move long code examples (renderable HTML demos, multi-file projects) to `references/examples.md`.
3. Move anti-pattern detail (symptom + root cause + fix) to `references/anti-patterns.md`.
4. Keep `SKILL.md` focused on : YAML frontmatter, Quick Reference, Decision Trees, Patterns (short), Cross-references, Reference Links.

After refactor : re-run the line-count validator.

```bash
node /home/freek/GitHub/Skill-Package-Workflow-Template/scripts/validate-line-count.js skills/source/<cat>/<skill>/
```

## 6. Quoted YAML description (not folded scalar)

**Rule ID** : C1. **Severity** : ERROR.

**Symptom** : the auditor finds a frontmatter `description: "Use when..."` with the quoted-string form. Validator script `validate-frontmatter.js` fails on the description-format check.

**Root cause** : the author wrote the description as a quoted string on a single line, or used the literal block scalar `|` instead of the folded block scalar `>`. The package quality contract requires the folded scalar form so that multi-line descriptions normalise into a single paragraph at parse time.

**Fix** :

```yaml
# Wrong
description: "Use when authoring a CSS color..."

# Wrong (literal scalar preserves newlines)
description: |
  Use when authoring a CSS color...

# Right (folded scalar collapses newlines into spaces)
description: >
  Use when authoring a CSS color in 2026.
  Prevents muddy color-mix results.
  Covers oklch, color-mix, light-dark.
  Keywords: oklch, color-mix, light-dark, color-scheme.
```

The folded scalar `>` joins lines with spaces, producing a clean single-paragraph description while keeping the source readable.

## 7. Live region created together with its message

**Rule ID** : A4. **Severity** : ERROR.

**Symptom** : the auditor finds a JavaScript pattern that creates a new `<div aria-live="polite">` AND inserts the message in the same DOM mutation. Screen readers do not announce the first toast. Manual testing confirms the announcement is missing.

**Root cause** : screen readers must observe mutations on a live region they have ALREADY registered. Creating both the region wrapper and its content in the same DOM mutation does not register the region in time for the screen reader to detect the change.

**Fix** : create the live region at page startup ; mutate it later with message content.

```html
<!-- Right : wrapper exists at page load -->
<div id="toast-region" aria-live="polite"></div>
```

```js
// Wrong : create wrapper + insert content together
const wrapper = document.createElement("div");
wrapper.setAttribute("aria-live", "polite");
wrapper.textContent = "Saved";
document.body.append(wrapper);

// Right : mutate the existing wrapper
document.querySelector("#toast-region").textContent = "Saved";
```

Source : [MDN : ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/aria-live_region_role) (verified 2026-05-19).

## 8. Missing `prefers-reduced-motion` branch on animation

**Rule ID** : A7. **Severity** : ERROR.

**Symptom** : the auditor finds `@keyframes` or `transition` declarations in a CSS file with no matching `@media (prefers-reduced-motion: reduce)` block. Vestibular-sensitive users experience nausea on first page load.

**Root cause** : the team built the animation as the default behavior, intending to add the reduced-motion variant later, and shipped without it.

**Fix** : either gate the animation behind `(prefers-reduced-motion: no-preference)` (opt-in pattern), or add a `(prefers-reduced-motion: reduce)` branch that replaces the keyframes with an `opacity` or `color` crossfade.

```css
/* Wrong : animates by default, ignores OS preference */
.hero { animation: parallax 30s linear infinite; }

/* Right : opt-in gate */
@media (prefers-reduced-motion: no-preference) {
  .hero { animation: parallax 30s linear infinite; }
}

/* Or right : reduce-branch crossfade */
.toast { animation: slide-up 250ms ease-out; }

@media (prefers-reduced-motion: reduce) {
  .toast { animation: cross-fade 150ms linear; }
}
```

Source : [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19).
