---
name: frontend-a11y-motion-contrast-wcag22
description: >
  Use when shipping a feature that must meet WCAG 2.2 conformance (nine new
  Success Criteria over 2.1), measuring text and non-text contrast against the
  binding 2.x ratios, deciding how to respect a user's reduced-motion preference
  in a CSS or View-Transitions animation, picking palette tokens for
  prefers-contrast more / less, supporting Windows High Contrast Mode via
  forced-colors, sizing an icon-only target, or remediating an audit finding on
  focus-not-obscured, dragging-only interaction, redundant-entry, or
  cognitive-CAPTCHA authentication.
  Prevents the most common a11y regressions in 2026 : animations that fire by
  default without a reduced-motion guard and trigger vestibular distress,
  16-by-16 icon buttons that fail 2 5 8 Target Size, focus indicators that hide
  entirely behind a sticky header (2 4 11 fail), drag-only kanban / slider
  interactions with no single-pointer alternative (2 5 7 fail), CAPTCHA-only
  authentication that blocks password-manager paste (3 3 8 fail), color-only
  form-error indication (1 4 1 fail), glassmorphism without a
  prefers-reduced-transparency opt-out, custom focus rings stripped without a
  visible replacement, and the misconception that APCA pass-marks satisfy
  binding WCAG conformance.
  Covers the nine 2 2 new SCs (2 4 11 Focus Not Obscured Minimum AA, 2 4 12
  Enhanced AAA, 2 4 13 Focus Appearance AAA, 2 5 7 Dragging Movements AA, 2 5 8
  Target Size Minimum AA with five exceptions, 3 2 6 Consistent Help A, 3 3 7
  Redundant Entry A, 3 3 8 Accessible Authentication Minimum AA, 3 3 9 Enhanced
  AAA), the binding 2 x contrast ratios (1 4 3 normal-4 5 large-3, 1 4 6
  enhanced 7 and 4 5, 1 4 11 non-text 3), the prefers-reduced-motion / opt-in
  versus reduce patterns, prefers-contrast more / less / custom palette
  swapping, the full forced-colors system-color-keyword surface (Canvas,
  CanvasText, LinkText, ButtonFace, ButtonText, ButtonBorder, Field, FieldText,
  Highlight, HighlightText, AccentColor, AccentColorText, Mark, GrayText), the
  forced-color-adjust escape hatch, the limited-availability
  prefers-reduced-data and prefers-reduced-transparency, the experimental APCA
  algorithm with its WCAG-3-Working-Draft non-normative status, and the rule
  that semantic native HTML beats div-soup for forced-colors mapping.
  Keywords: WCAG 2 2, prefers-reduced-motion, prefers-contrast,
  prefers-color-scheme, forced-colors, prefers-reduced-data,
  prefers-reduced-transparency, contrast ratio, target size, 24 by 24, focus
  not obscured, focus appearance, dragging movements, accessible
  authentication, consistent help, redundant entry, APCA, Canvas, CanvasText,
  ButtonText, Highlight, AccentColor, GrayText, forced-color-adjust,
  scroll-padding-top, scroll-margin, color-scheme, motion makes user sick,
  vestibular harm, button too small, focus hidden under header, dark mode
  broken in HCM, glassmorphism inaccessible, CAPTCHA blocks password manager,
  text unreadable, contrast fails audit, animation does not respect OS
  setting, target size warning, drag-only interaction, how do I respect
  reduced motion, what is WCAG 2 2, how to check contrast, minimum target
  size for buttons, accessible color contrast, how to support Windows High
  Contrast Mode, what is APCA, do I need to use APCA, how to handle reduced
  transparency
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend A11y : Motion, Contrast, WCAG 2.2

This skill is the operational reference for WCAG 2.2 conformance, contrast measurement, and user-preference media features (`prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, `prefers-reduced-data`, `prefers-reduced-transparency`). It covers the nine WCAG 2.2 Success Criteria added over 2.1, the binding 2.x contrast ratios, motion-reduction patterns, palette swaps for elevated contrast preferences, and Windows High Contrast Mode support via system color keywords. The skill does NOT cover focus / keyboard mechanics (see `[[frontend-a11y-focus-keyboard-inert]]`), ARIA roles (see `[[frontend-a11y-aria-patterns]]`), color-palette generation (see `[[frontend-theming-color-palette-oklch]]`), or INP performance measurement (see `[[frontend-perf-core-web-vitals-inp]]`).

## Quick Reference

### Floor rules

- ALWAYS check `@media (prefers-reduced-motion: reduce)` BEFORE shipping any non-essential motion. NEVER ship parallax, auto-play carousels, slide-in transitions, or scale-on-hover without a reduce-branch fallback.
- ALWAYS size interactive targets to a 24-by-24 CSS-pixel solid square (WCAG 2.2 SC 2 5 8). NEVER ship a 16-by-16 icon button unless one of the five exceptions applies (spacing, equivalent, inline, user-agent, essential).
- ALWAYS provide a single-pointer (click or tap) alternative when an interaction uses dragging (WCAG 2.2 SC 2 5 7). NEVER ship a drag-only slider, kanban, or color wheel.
- ALWAYS allow paste in password fields and support `autocomplete="current-password"` (WCAG 2.2 SC 3 3 8). NEVER use `onpaste="return false"` or block password-manager autofill.
- ALWAYS measure contrast on the RENDERED foreground-background pair. NEVER trust the declared token value when the surface uses opacity, gradient, or `backdrop-filter`.
- ALWAYS treat APCA as informational and cite WCAG 2.x ratios for conformance. NEVER tell a stakeholder that an APCA Lc 60 / 75 / 90 result satisfies legal WCAG 2.2 conformance.
- ALWAYS prefer native HTML elements over `<div role="button">` so that `forced-colors: active` maps `ButtonText` / `ButtonFace` correctly.
- ALWAYS test under Windows High Contrast Mode (Settings > Accessibility > Contrast themes) before shipping anything with custom colors. NEVER rely on `box-shadow` for visual definition ; HCM forces it to `none`.

### Decision tree 1 : Which contrast SC applies ?

```
Is the foreground TEXT (regular glyphs that convey meaning) ?
  -> Is the text "large" : 18 pt and above, OR 14 pt bold and above ?
       -> Yes : SC 1 4 3 AA requires 3 to 1. SC 1 4 6 AAA requires 4 5 to 1.
       -> No : SC 1 4 3 AA requires 4 5 to 1. SC 1 4 6 AAA requires 7 to 1.

Is the foreground a UI COMPONENT BOUNDARY or a GRAPHICAL OBJECT
(border of input, focus ring, custom checkbox indicator, icon-only button) ?
  -> SC 1 4 11 Non-text Contrast AA requires 3 to 1 against adjacent colors.

Does the icon-only button contain a GLYPH that reads as text
(letter, digit, punctuation) ?
  -> Treat as text. SC 1 4 3 applies. 4 5 to 1 or 3 to 1 by size.

Pure decorative graphics (logos when not used to identify a control,
purely cosmetic illustrations) ?
  -> SC 1 4 3 and 1 4 11 do NOT apply. No ratio required.
```

### Decision tree 2 : Motion strategy ?

```
Is the motion FUNCTIONAL : it conveys a state change (open / close, error
appearance, save confirmation) that the user MUST perceive ?
  -> Inside `@media (prefers-reduced-motion: reduce)` REPLACE the keyframes
     with an `opacity` or `color` crossfade. Do NOT remove the transition entirely ;
     the user still needs the cue.

Is the motion DECORATIVE : parallax scrolling, hero-section drift, hover
scale-up, auto-play carousel ?
  -> Place the entire animation INSIDE `@media (prefers-reduced-motion: no-preference)`.
     Users who set "reduce" never see it.

Are you calling `document.startViewTransition()` ?
  -> Skip the call when `matchMedia('(prefers-reduced-motion: reduce)').matches`,
     or override `::view-transition-group(*) { animation: none; }` inside the reduce block.

Are you using GSAP / Framer Motion / Motion One ?
  -> Read `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and
     attach an `addEventListener('change', ...)` to react to live OS-setting changes.
```

### Decision tree 3 : Does this target meet 2 5 8 ?

```
Bounding box at least 24 by 24 CSS pixels ?
  -> PASS.

Smaller, but a 24-CSS-pixel-diameter circle centered on the target does
NOT intersect any other target circle ?
  -> PASS (spacing exception).

Target is INLINE in running text, sized by surrounding line-height
(e.g. a link inside body copy) ?
  -> PASS (inline exception).

A different control on the same page provides the EQUIVALENT function
and meets 24 by 24 ?
  -> PASS (equivalent-control exception).

Size is set by the USER AGENT and unmodified by author
(native `<input type="date">` calendar picker) ?
  -> PASS (UA exception).

Particular presentation is ESSENTIAL or LEGALLY REQUIRED
(map pin at GPS coordinates, paper-form replica required by law) ?
  -> PASS (essential exception).

None of the above ?
  -> FAIL. Increase the hit area to 24 by 24 via `padding` or a larger
     wrapper, OR relayout to satisfy the spacing exception.
```

### Decision tree 4 : Forced colors versus prefers-contrast ?

```
Is the user agent currently overriding author colors with a system palette
(Windows High Contrast Mode, Edge / Chrome on Windows with HCM enabled) ?
  -> `@media (forced-colors: active)` matches. Use system color keywords :
     Canvas, CanvasText, LinkText, ButtonText, ButtonFace, Highlight, etc.
     Add an explicit `border: 1px solid ButtonText` because `box-shadow` is
     forced to `none`.

Did the user request MORE contrast at the OS level
(macOS Increase Contrast, Windows "make text bigger" with high-contrast theme,
iOS Increase Contrast) ?
  -> `@media (prefers-contrast: more)` matches. Swap palette tokens to
     higher-contrast values. The page is still using AUTHOR colors.

Did the user request LESS contrast (photosensitivity, migraine sensitivity) ?
  -> `@media (prefers-contrast: less)` matches. Reduce border weight, soften
     accents, ensure no harsh pure-black-on-pure-white.

Did the user set a custom palette that does not map to "more" or "less" ?
  -> `@media (prefers-contrast: custom)` matches. Same remediation as `more`
     in practice : provide a defensive high-contrast token set.
```

## Patterns

### Pattern : opt-in animation gated by no-preference

```css
.card {
  transform: translateY(0);
  opacity: 1;
}

@media (prefers-reduced-motion: no-preference) {
  .card {
    animation: slide-in 600ms ease-out;
  }
}

@keyframes slide-in {
  from { transform: translateY(24px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
```

Users who never expressed a preference get the slide. Users who set "reduce" never see motion ; the entire keyframe rule is absent.

### Pattern : reduce branch replaces motion with crossfade

```css
@keyframes slide-up   { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes cross-fade { from { opacity: 0; } to { opacity: 1; } }

.toast { animation: slide-up 300ms ease-out; }

@media (prefers-reduced-motion: reduce) {
  .toast { animation: cross-fade 150ms linear; }
}
```

Functional state-change cue preserved ; vestibular trigger (`translateY`) removed.

### Pattern : View Transitions respect prefers-reduced-motion

```js
function update(stateChange) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !document.startViewTransition) {
    stateChange();
    return;
  }
  document.startViewTransition(stateChange);
}
```

Or, alternatively, leave the call and disable the cross-fade in CSS :

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

### Pattern : prefers-contrast palette swap

```css
:root {
  --text:   oklch(0.30 0.02 250);
  --bg:     oklch(0.98 0.00 0);
  --border: oklch(0.85 0.01 250);
}

@media (prefers-contrast: more) {
  :root {
    --text:   black;
    --bg:     white;
    --border: black;
  }
}

@media (prefers-contrast: less) {
  :root {
    --text:   oklch(0.40 0.02 250);
    --border: oklch(0.90 0.01 250);
  }
}
```

Always verify the swapped tokens still meet 4 5 to 1 (or 7 to 1 for AAA targets) against their surfaces.

### Pattern : forced-colors with system color keywords

```css
.btn {
  background: var(--accent);
  color: white;
  border: 1px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@media (forced-colors: active) {
  .btn {
    border-color: ButtonText;
    forced-color-adjust: auto;
  }
}
```

Under `forced-colors: active`, `box-shadow` is forced to `none` and the colored background may be overridden by the system palette. The explicit `border: 1px solid ButtonText` keeps the button visually defined.

### Pattern : target size with padding and the spacing exception

```css
.icon-btn {
  width: 24px;
  height: 24px;
  padding: 0;
}

.toolbar .icon-btn + .icon-btn {
  margin-left: 24px;
}
```

Either size up to a 24-by-24 hit area, or keep the icon smaller and ensure 24-pixel center-to-center spacing so the spacing exception applies.

### Pattern : focus-not-obscured remediation

```css
:root {
  --header-height: 64px;
}

html {
  scroll-padding-top: var(--header-height);
}

:focus-visible {
  scroll-margin-top: var(--header-height);
}
```

Programmatic scroll-on-focus offsets the sticky header by exactly the header height. Combine with `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }` to also meet 2 4 13 Focus Appearance.

### Pattern : accessible authentication

```html
<form>
  <label for="pw">Password</label>
  <input
    id="pw"
    type="password"
    autocomplete="current-password"
    name="password"
  />
  <button type="submit">Sign in</button>
</form>
```

NO `onpaste="return false"`, NO blocked autofill. For high-assurance flows, offer passkey (WebAuthn) as the primary path so the cognitive-function test never applies.

### Pattern : prefers-reduced-transparency opt-out

```css
.nav {
  background: oklch(0.99 0 0 / 0.7);
  backdrop-filter: blur(12px);
}

@media (prefers-reduced-transparency: reduce) {
  .nav {
    background: oklch(0.99 0 0);
    backdrop-filter: none;
  }
}
```

Limited Availability as of 2026-05-19 ; ship the rule anyway for forward compatibility.

## Conformance ratios at a glance

| SC | Level | Foreground | Ratio |
|----|-------|------------|-------|
| 1 4 3 Contrast (Minimum) | AA | Normal text | 4 5 to 1 |
| 1 4 3 Contrast (Minimum) | AA | Large text (18 pt or 14 pt bold) | 3 to 1 |
| 1 4 6 Contrast (Enhanced) | AAA | Normal text | 7 to 1 |
| 1 4 6 Contrast (Enhanced) | AAA | Large text | 4 5 to 1 |
| 1 4 11 Non-text Contrast | AA | UI components, graphical objects | 3 to 1 |
| 2 4 13 Focus Appearance | AAA | Focused versus unfocused state | 3 to 1 |

Verified against [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19).

## APCA + WCAG 3 note

APCA (Accessible Perceptual Contrast Algorithm) produces an `Lc` score from -108 to +106 with thresholds Lc 60 (basic body text), Lc 75 (enhanced), Lc 90 (high-impact). APCA accounts for polarity, font weight, and spatial frequency where WCAG 2.x luminance ratios do not.

**Normative status as of 2026-05-19** : NOT normative. WCAG 3 is a [Working Draft](https://www.w3.org/TR/wcag-3.0/) (verified 2026-05-19) with the explicit stability disclaimer "It is inappropriate to cite this document as other than a work in progress." The Working Draft does NOT include APCA as a binding metric. The binding conformance metric is the WCAG 2 x luminance ratio.

**Practical recommendation** : design tokens that pass both WCAG 2 2 (4 5 to 1 for normal text) AND APCA Lc 60 are future-safe. Until WCAG 3 reaches Candidate Recommendation, cite the 2 2 ratio for audits and contracts.

## Cross-references

- `[[frontend-a11y-aria-patterns]]` : ARIA roles, states, properties, custom-control name / role / value.
- `[[frontend-a11y-focus-keyboard-inert]]` : focus management, `:focus-visible`, `inert`, keyboard interaction patterns.
- `[[frontend-theming-color-palette-oklch]]` : OKLCH palette generation, shade ladders, contrast-aware token math.
- `[[frontend-impl-view-transitions-scroll-animations]]` : View Transitions API and scroll-driven animations both gated by `prefers-reduced-motion`.

## Reference Links

- [references/methods.md](references/methods.md) : all nine new WCAG 2 2 SCs with normative text, media-feature value lists, full system color keyword surface.
- [references/examples.md](references/examples.md) : renderable HTML fragment demonstrating motion-respecting, contrast-meeting, target-size-compliant patterns.
- [references/anti-patterns.md](references/anti-patterns.md) : ten anti-patterns with WCAG-SC mapping, symptom, root cause, and fix.

## Authoritative sources

- [W3C : WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19)
- [W3C : Understanding SC 2 5 8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (verified 2026-05-19)
- [W3C : Understanding SC 2 4 11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) (verified 2026-05-19)
- [W3C : Understanding SC 2 5 7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) (verified 2026-05-19)
- [W3C : Understanding SC 3 3 8 Accessible Authentication (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) (verified 2026-05-19)
- [W3C : WCAG 3 0 Working Draft](https://www.w3.org/TR/wcag-3.0/) (verified 2026-05-19)
- [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19)
- [MDN : prefers-contrast](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) (verified 2026-05-19)
- [MDN : forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) (verified 2026-05-19)
- [MDN : prefers-reduced-data](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-data) (verified 2026-05-19)
- [MDN : prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) (verified 2026-05-19)
- [SAPC-APCA repository](https://github.com/Myndex/SAPC-APCA) (verified 2026-05-19)
