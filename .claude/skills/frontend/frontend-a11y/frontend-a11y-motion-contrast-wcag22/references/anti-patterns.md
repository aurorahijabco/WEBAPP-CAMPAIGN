# References : Anti-patterns

Ten anti-patterns observed in real WCAG 2 2 audits, with the violated SC, symptom, root cause, and fix. Verified 2026-05-19.

## 1. Animate by default, no `prefers-reduced-motion` check

**Violates** : implicit harm ; not a single normative SC fail, but contradicts the WCAG 2 1 SC 2 3 3 Animation from Interactions guidance and ignores the `prefers-reduced-motion` user signal.

**Symptom** : users with vestibular disorders report dizziness or nausea on first page load. Auto-play carousels, parallax scrolling, scale-on-load animations, and slide-in cards all play regardless of the OS-level "Reduce motion" preference.

**Root cause** : the animation is declared at the root selector with no media-query gate.

**Fix** :

```css
/* Wrong */
.hero {
  animation: parallax 30s linear infinite;
}

/* Right : opt-in gate */
@media (prefers-reduced-motion: no-preference) {
  .hero {
    animation: parallax 30s linear infinite;
  }
}
```

Or write a `reduce`-branch crossfade when the motion is functional. Source : [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19).

## 2. 16-by-16 icon button

**Violates** : WCAG 2 2 SC 2 5 8 Target Size (Minimum) AA.

**Symptom** : audit tool reports "Target size below 24 by 24 CSS pixels." Users with motor impairments mis-click between adjacent icons.

**Root cause** : icon button sized to the icon dimensions (`width: 16px; height: 16px`) without padding or a larger hit area, and adjacent buttons are within 24-pixel center-to-center distance so the spacing exception does not apply.

**Fix** :

```css
/* Wrong */
.icon-btn { width: 16px; height: 16px; }

/* Right : pad to 24 by 24 */
.icon-btn {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
}

/* Or : keep 16 by 16 and apply spacing exception */
.row .icon-btn + .icon-btn { margin-left: 24px; }
```

Source : [Understanding 2 5 8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (verified 2026-05-19).

## 3. 4 4 to 1 body text contrast

**Violates** : WCAG 2 2 SC 1 4 3 Contrast (Minimum) AA.

**Symptom** : audit tool reports "Contrast ratio 4 48 to 1, fails AA (4 5 to 1)." Designer chose `#767676` text on `#ffffff` background.

**Root cause** : token value selected by hex / HSL eye-balling instead of luminance math.

**Fix** : darken to `#757575` which yields 4 54 to 1, or move to OKLCH and compute lightness pairs that guarantee the ratio :

```css
:root {
  --text: oklch(0.30 0.02 250); /* L 0 30 against L 0 99 surface ; ~7 to 1 */
  --bg:   oklch(0.99 0 0);
}
```

Always measure the RENDERED foreground-background pair, not the declared token value. Opacity, semi-transparent overlays, and `backdrop-filter` change the rendered color. Source : [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19).

## 4. Focus indicator obscured by sticky header

**Violates** : WCAG 2 2 SC 2 4 11 Focus Not Obscured (Minimum) AA.

**Symptom** : user tabs through a long form. Focus moves to a field that has just scrolled into the viewport but is now hidden behind the sticky page header.

**Root cause** : `scroll-padding` not declared on the scroll container ; programmatic scroll-on-focus stops exactly at the field's top edge, which is now under the sticky overlay.

**Fix** :

```css
:root { --header-h: 64px; }

html { scroll-padding-top: var(--header-h); }

:focus-visible {
  scroll-margin-top: var(--header-h);
}
```

`scroll-padding-top` on the scroll container, `scroll-margin-top` on the focused element : both ensure the browser scrolls far enough to clear the header. Source : [Understanding 2 4 11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) (verified 2026-05-19).

## 5. CAPTCHA as only authentication path

**Violates** : WCAG 2 2 SC 3 3 8 Accessible Authentication (Minimum) AA, plus SC 3 3 9 Enhanced AAA.

**Symptom** : sign-up form requires solving a math CAPTCHA or transcribing distorted text. Users with cognitive disabilities, dyslexia, or screen-reader users are blocked. Audit reports a Level AA fail.

**Root cause** : authentication requires a cognitive function test (remembering, solving a puzzle, transcribing) with no alternative path. None of the four exceptions in 3 3 8 apply.

**Fix** :

- Primary path : passkey / WebAuthn (biometric or PIN is not a cognitive function test).
- Fallback : password with paste allowed and `autocomplete="current-password"` supported.
- CAPTCHA, when used, must be image-recognition or audio (covers exception 3 at AA only, FAILS at AAA).

```html
<input type="password" autocomplete="current-password" name="password" />
<!-- NO onpaste="return false" -->
```

Source : [Understanding 3 3 8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) (verified 2026-05-19).

## 6. Color-only error indication

**Violates** : WCAG 2 1 / 2 2 SC 1 4 1 Use of Color (carried forward from 2 1, still binding in 2 2).

**Symptom** : invalid form field has a red border, no icon, no inline error text. Colorblind users (8 percent of men) cannot perceive the cue.

**Root cause** : visual designer relies on a single channel (hue) to encode error state.

**Fix** : pair the red border with (a) an inline error text linked via `aria-errormessage`, and (b) a visual warning icon next to the message.

```html
<label for="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid="true"
  aria-errormessage="email-err"
/>
<p id="email-err" class="error">
  <svg class="icon-warning" aria-hidden="true"><!-- ... --></svg>
  Email is not a valid address.
</p>
```

## 7. Glassmorphism without `prefers-reduced-transparency` opt-out

**Violates** : implicit harm against the `prefers-reduced-transparency` user signal ; not a normative SC fail but undermines a legitimate user preference.

**Symptom** : frosted-glass nav bar with `backdrop-filter: blur(20px)` and 30-percent background alpha. Users who set "Reduce Transparency" at the OS still see the see-through navigation, which causes text overlap on busy backgrounds.

**Root cause** : no `@media (prefers-reduced-transparency: reduce)` override.

**Fix** :

```css
.nav {
  background: oklch(0.99 0 0 / 0.7);
  backdrop-filter: blur(20px);
}

@media (prefers-reduced-transparency: reduce) {
  .nav {
    background: oklch(0.99 0 0);
    backdrop-filter: none;
  }
}
```

Source : [MDN : prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) (verified 2026-05-19).

## 8. Custom focus ring stripped without replacement

**Violates** : WCAG 2 1 SC 2 4 7 Focus Visible AND WCAG 2 2 SC 2 4 13 Focus Appearance AAA.

**Symptom** : keyboard users cannot tell where focus currently is. `*:focus { outline: none }` was used to remove the default browser ring.

**Root cause** : a "design polish" rule removed all focus outlines without immediately defining a replacement.

**Fix** : never strip outline without immediately re-defining a 2-px-or-thicker high-contrast ring via `:focus-visible`. Verify 3 to 1 contrast against the unfocused state.

```css
/* Wrong */
*:focus { outline: none; }

/* Right */
:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
```

## 9. Drag-only kanban board

**Violates** : WCAG 2 2 SC 2 5 7 Dragging Movements AA.

**Symptom** : kanban cards can only be moved between columns via mouse drag. Users on touch-only devices without precise pointers, users with motor impairments, and keyboard-only users cannot use the feature.

**Root cause** : interaction was implemented with a drag library that emits only `dragstart` / `dragend` events ; no click-or-keyboard fallback.

**Fix** : add either a "Move to..." menu button on each card (single-pointer click alternative) OR full keyboard arrow-key navigation between columns. Both alternatives MUST NOT require dragging.

```html
<article class="card" tabindex="0" aria-roledescription="kanban card">
  <h3>Refactor auth flow</h3>
  <button aria-label="Move to..." aria-haspopup="menu">⋮</button>
</article>
```

Source : [Understanding 2 5 7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) (verified 2026-05-19).

## 10. Citing APCA for WCAG 2 x conformance

**Violates** : misleading conformance claim ; APCA is NOT normative for WCAG 2 x or WCAG 3.

**Symptom** : a developer or designer reports "the contrast passes APCA Lc 60, we are WCAG conformant." Legal / procurement reviewer rejects the claim. Audit retest fails.

**Root cause** : conflation of an experimental algorithm with binding normative criteria.

**Fix** : cite the WCAG 2 x ratio (4 5 to 1 for normal text, 3 to 1 for large or non-text) for conformance. APCA can be reported as a *supplementary* metric for forward-compatibility, never as a substitute. Designs that pass BOTH 2 x ratio AND APCA Lc 60 are future-safe.

Source : [W3C : WCAG 3 0 Working Draft](https://www.w3.org/TR/wcag-3.0/) (verified 2026-05-19, with explicit stability disclaimer "It is inappropriate to cite this document as other than a work in progress.") and [SAPC-APCA repository](https://github.com/Myndex/SAPC-APCA) (verified 2026-05-19).
