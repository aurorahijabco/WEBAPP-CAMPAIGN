# Anti-Patterns Reference : frontend-core-design-philosophy

Seven anti-patterns specific to the AI-generic visual fingerprint. Each entry follows the symptom / root cause / fix structure. ALWAYS check a proposed design against this list before shipping.

## Anti-pattern 1 : Three feature cards under hero

**Symptom.** The landing page looks identical to every AI-generated landing page from 2024-2026 : a centered headline followed by a 3-column CSS Grid of cards with icon-title-body inside each one. A practitioner can identify the page as AI-generated in under three seconds.

**Root cause.** Code generators reach for the safest, lowest-risk pattern in their training corpus. `grid-template-columns: repeat(3, 1fr)` plus three feature cards is the most-represented landing-page section in public Tailwind and shadcn/ui documentation, so it is the path of least resistance for any pattern-matching agent.

**Fix.** Break symmetry. ALWAYS use one of the following alternatives in place of the three-column grid :

- Asymmetric `grid-template-columns: 2fr 1fr` with one large feature and a stack of two small ones
- Horizontally-scrolling rail with `scroll-snap-type: x mandatory` and `scroll-snap-align: start` on children
- Container-query-driven layout that adapts the column count to the container's inline size, not the viewport's
- Single-column staggered list with type-as-design driving the rhythm

Container queries make these layouts portable across contexts ([MDN : Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (verified 2026-05-19)).

## Anti-pattern 2 : Rounded-md gray everywhere

**Symptom.** Surfaces, buttons, inputs, badges, avatars, dropdown menus, modals, tooltips, and navigation pills all use the same corner radius (`rounded-md`, `border-radius: 6px`) and the same neutral gray as their primary background. The whole interface reads as one undifferentiated tone.

**Root cause.** Tailwind default reflex compounded by no design-token discipline. The Tailwind `rounded-md` utility appears in tens of thousands of public documentation examples, so generators reach for it on every container element. Without a token system that distinguishes radii and colors by component role, every component inherits the same default.

**Fix.** ALWAYS establish a radius scale and assign by component role :

```css
:root {
  --radius-sharp:  2px;   /* primary CTAs, decisive controls */
  --radius-soft:  12px;   /* surfaces, cards, panels */
  --radius-pill: 9999px;  /* avatars, tags, badges */
  --radius-accent: 50% 0 50% 0;  /* asymmetric accent shapes */
}
```

ALWAYS establish a one-bold-accent palette in `oklch()` with grays derived via `color-mix(in oklch, ...)` against the same anchor, and FORBID hardcoded grays outside the token layer. The detailed implementation lives in `[[frontend-theming-color-palette-oklch]]`. Perceptual uniformity in `oklch()` is documented at [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) (verified 2026-05-19).

## Anti-pattern 3 : JS recreation of native widgets

**Symptom.** The codebase ships 4 KB or more of click-outside, escape-handler, focus-trap, position-recompute, and stacking-context logic for a dropdown, tooltip, or modal. Bugs appear at the edges : the dropdown opens in the wrong direction near the viewport edge, focus escapes the modal on shift-tab, the popover hides behind a sibling stacking context.

**Root cause.** The agent is unaware of the Popover API, the `<dialog>` element, and CSS anchor positioning. Training data overrepresents the era when these primitives did not exist, so the generator reaches for headless-UI patterns or Floating UI by reflex.

**Fix.** ALWAYS use the native primitives :

- Dropdown menu, tooltip, custom select : the `popover` attribute on the floating element, `popovertarget` on the trigger
- Modal : `<dialog>` with `showModal()` ; non-modal dialog : `show()`
- Position relative to a trigger : `anchor-name` on the trigger, `position-anchor` on the floating element, `inset-area` for placement, `@position-try` for fallback positioning

The browser ships dismissal, focus trap, escape handling, and stacking-context isolation. Anchor positioning eliminates the JS recompute loop : "the browser can try rendering it in a different suggested position so it is placed onscreen" ([MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using) (verified 2026-05-19)).

## Anti-pattern 4 : Motion-on-by-default with no reduce-motion fallback

**Symptom.** Users with vestibular disorders disable motion at the OS level (Settings -> Accessibility -> Display -> Reduce motion on macOS, or the equivalent on Windows and Android). The site still animates because the CSS does not query `prefers-reduced-motion`. Some users experience nausea ; others abandon the page.

**Root cause.** Motion treated as decoration, not as a state-transition marker. The agent learns animation as a stylistic flourish ("add a fade-in") rather than a semantic signal ("mark the open transition"). The CSS lacks the override that flips the motion off.

**Fix.** ALWAYS pair every animation rule with a `prefers-reduced-motion: reduce` override. The recommended pattern from [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19) is to replace transform-based motion with an opacity dissolve :

```css
.menu {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
.menu[open] { opacity: 1; transform: translateY(0) scale(1); }

@media (prefers-reduced-motion: reduce) {
  .menu, .menu[open] { transform: none; transition: opacity 120ms ease-out; }
}
```

ALWAYS treat motion as opt-in. The base state is still ; animation marks transitions only.

## Anti-pattern 5 : Accessibility bolted on at the end

**Symptom.** Focus order is random because elements were inserted in DOM-order for visual reasons. ARIA labels are missing or wrong (a `role="button"` on a `<div>` that does not respond to Enter or Space). The accent button fails contrast against its surface. Focus rings are removed everywhere with `outline: none` and no replacement. Some interactive controls are 18 x 18 px, failing WCAG 2.2 SC 2.5.8.

**Root cause.** Accessibility treated as a separate phase after visual design is complete. The agent generates the visual layer first ("get the layout looking right") and only then asks "is this accessible ?". Most regressions are introduced during the visual phase and are expensive to fix later.

**Fix.** ALWAYS start with semantic HTML, build the keyboard model with the W3C WAI APG patterns, then layer visual styling. Visible focus indicators are designable elements : a branded `:focus-visible` ring with at least 3:1 contrast against the unfocused state meets [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) SC 2.4.13 (verified 2026-05-19) and looks more deliberate than the browser default.

Concrete rules :

- NEVER set `outline: none` without an equivalent or stronger `:focus-visible` replacement
- ALWAYS ensure interactive targets meet the 24 x 24 CSS pixel floor (or a named exception is documented per [W3C : Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) verified 2026-05-19)
- ALWAYS use native semantic elements (`<button>`, `<a>`, `<dialog>`, `<details>`, `<input type="...">`) before reaching for ARIA
- ALWAYS verify keyboard navigation at every checkpoint, not at the end

## Anti-pattern 6 : LCP-killing hero choices for aesthetic reasons

**Symptom.** The hero is a 2.4 MB autoplay-video background, a webGL canvas, a stacked-layer parallax animation, or a sequence of full-bleed images carouseling on a timer. LCP is 4.5 s on a mid-tier mobile device. Users on flaky networks see a blank hero for several seconds before content paints. INP rises because the carousel runs JS on the main thread.

**Root cause.** Visual ambition unconstrained by performance budget. The designer wanted "drama" or "presence" and the engineer implemented the request without measuring against the LCP / INP / CLS thresholds. The Core Web Vitals targets are documented but not internalized as design constraints.

**Fix.** ALWAYS commit to the budget : LCP at or below 2.5 s, INP at or below 200 ms, CLS at or below 0.1 ([web.dev : Vitals](https://web.dev/articles/vitals) (verified 2026-05-19)). Practical rules :

- Use a single optimized image as the LCP element with `fetchpriority="high"` and `<img loading="eager">`
- Preload the LCP webfont with `<link rel="preload" as="font" type="font/woff2" crossorigin>`
- Reserve the hero's layout slot with `aspect-ratio` or explicit `width` / `height` to avoid CLS
- If a video or canvas is essential, place it BEHIND a static LCP-owning image and start playback after `requestIdleCallback` or `load`
- Animate ONLY `transform` and `opacity` on hover ; NEVER `top`, `left`, `width`, `height`

The visual decision to make a hero "feel premium" is compatible with budget-respecting choices. A static image with deliberate type, generous negative space, and a single accent shape outperforms a parallax canvas on both INP and aesthetic distinction.

## Anti-pattern 7 : Cascade specificity wars

**Symptom.** The stylesheet is dotted with `!important` declarations. Deeply-nested selectors (`.page .container .card .button.primary`) are required to override existing styles. Engineers say "we can't override that vendor CSS without a wrapper class". Removing one rule breaks three others in unrelated places.

**Root cause.** No cascade layer discipline. All CSS lives at the unlayered level, where specificity is the only resolution mechanism. Third-party CSS competes with project CSS on the same playing field. Over time, every override accretes additional specificity until `!important` is the only remaining hammer.

**Fix.** ALWAYS declare cascade layers at the top of the entry stylesheet :

```css
@layer reset, tokens, base, components, utilities, overrides;

@import url("vendor.css") layer(vendor);
@layer vendor, reset, tokens, base, components, utilities, overrides;
```

Per [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) (verified 2026-05-19) : "you do not have to ensure that a selector will have high enough specificity to override competing rules ; all you need to ensure is that it appears in a later layer". Project rules in `components` win over vendor rules in `vendor` without any specificity escalation. The `!important` flag becomes a true last-resort marker, not a routine tool.

## How to use this list

Run through the seven anti-patterns when reviewing a proposed design. Each match in the checklist is a redesign trigger. ALWAYS document which pattern triggered the redesign and which alternative was applied ; this is how the agent's design vocabulary grows beyond the AI-generic corpus.

## Sources (verified 2026-05-19)

- [MDN : Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [MDN : oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [MDN : CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using)
- [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [MDN : @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C : Understanding Target Size Minimum 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [web.dev : Vitals](https://web.dev/articles/vitals)
- [web.dev : Baseline](https://web.dev/baseline)
