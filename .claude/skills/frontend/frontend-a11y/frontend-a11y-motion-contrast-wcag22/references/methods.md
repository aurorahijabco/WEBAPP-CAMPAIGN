# References : WCAG 2 2 SCs, Media Features, System Colors

Complete normative surface for `frontend-a11y-motion-contrast-wcag22`. All citations verified 2026-05-19.

## WCAG 2.2 : nine new Success Criteria

WCAG 2.2 was published 5 October 2023 as a W3C Recommendation. It adds nine SCs over 2.1 and REMOVES one (4.1.1 Parsing). Source : [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/) (verified 2026-05-19).

### 2 4 11 Focus Not Obscured (Minimum) : AA

Normative text : "When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content."

- The operative word is *entirely*. Partial obscuring (50 percent hidden under a sticky header) passes AA.
- Targets : sticky headers, sticky footers, cookie banners, chat-widget overlays.
- Remediation : `html { scroll-padding-top: <header-height> }` plus `:focus-visible { scroll-margin-top: <header-height> }`.
- Source : [Understanding 2 4 11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) (verified 2026-05-19).

### 2 4 12 Focus Not Obscured (Enhanced) : AAA

Normative text : "When a user interface component receives keyboard focus, no part of the component is hidden by author-created content."

- Zero tolerance. One-pixel overlap fails.
- Same remediation as 2 4 11 plus consider eliminating sticky overlays entirely for AAA-conforming sites.

### 2 4 13 Focus Appearance : AAA

Normative text : the focus indicator MUST satisfy BOTH conditions :

1. Be at least as large as the area of a 2 CSS pixel thick perimeter of the unfocused component.
2. Have a contrast ratio of at least 3 to 1 between focused and unfocused states.

- Stricter than 1 4 11 Non-text Contrast (which only requires 3 to 1 against adjacent background).
- Default browser focus rings can FAIL 2 4 13 when overridden by author styles.

### 2 5 7 Dragging Movements : AA

Normative text : "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging, unless dragging is essential or the functionality is determined by the user agent and not modified by the author."

- Covers : sliders, drag-and-drop reorder, kanban boards, color wheels, signature pads, map panning.
- Exempt : native browser scrolling, pull-to-refresh, user-agent date pickers.
- NOT exempt : author-implemented carousel-by-swipe, author kanban, author signature pad.
- Alternative MUST NOT require dragging ; may use click, tap, or arrow-keys.
- Source : [Understanding 2 5 7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) (verified 2026-05-19).

### 2 5 8 Target Size (Minimum) : AA

Normative text : "The size of the target for pointer inputs is at least 24 by 24 CSS pixels."

Measurement test : "A solid 24-by-24 CSS pixel square, aligned to the horizontal and vertical axis," must fit completely inside the target's bounding box.

**Five exceptions** :

1. **Spacing** : Targets smaller than 24 by 24 pass if a 24 CSS pixel diameter circle centered on each target's bounding box does not intersect another target or another undersized target's circle.
2. **Equivalent** : Function reachable via a different control on the same page that meets 24 by 24.
3. **Inline** : Target is within a sentence or its size is constrained by the line-height of non-target text.
4. **User-agent control** : Size is determined by the user agent and unchanged by author (native `<input type="date">` picker).
5. **Essential** : Particular presentation is essential or legally required (map pins at precise coordinates, paper-form replica required by law).

Source : [Understanding 2 5 8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (verified 2026-05-19).

### 3 2 6 Consistent Help : A

If a Help mechanism is available (contact info, FAQ link, support chat), it MUST appear in the same relative order across pages within a related set. Stops the pattern where Help moves between header, footer, and burger menu.

### 3 3 7 Redundant Entry : A

If information was provided in an earlier step of a process, the user MUST NOT be required to re-enter it. Exceptions : when essential (security verification re-entry) or when the previously-entered info is no longer valid (correction step). Satisfied by pre-fill, "copy from billing", "use previous answer" options.

### 3 3 8 Accessible Authentication (Minimum) : AA

Normative text : "A cognitive function test (such as remembering a password or solving a puzzle) is not required for any step in an authentication process" unless an exception applies.

**Four exceptions** :

1. Alternative non-cognitive method available.
2. A mechanism (password manager autofill, paste support) reduces the burden.
3. The test is object recognition (basic CAPTCHA identifying common items) : exception at AA only.
4. The test is identifying personal content known to the user.

**Implications** :

- Blocking paste in password fields FAILS the SC.
- Blocking `autocomplete="current-password"` FAILS.
- Text or math CAPTCHA without alternative FAILS.
- Passkeys / WebAuthn SATISFY (biometric / PIN is not a cognitive function test).
- SMS one-time codes PASS if paste is permitted ; FAIL if user must transcribe digit-by-digit.

Source : [Understanding 3 3 8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) (verified 2026-05-19).

### 3 3 9 Accessible Authentication (Enhanced) : AAA

Same as 3 3 8 but exceptions 3 (object recognition) and 4 (personal content) are removed. Only "alternative method" and "mechanism" remain. Most CAPTCHA approaches FAIL at AAA.

### Removed : 4.1.1 Parsing

WCAG 2.1's parsing criterion is obsolete in 2.2. All modern user agents tolerate malformed HTML gracefully. Existing 2.1 audits that flagged 4.1.1 violations should NOT be carried forward into 2.2 audits.

## Contrast Success Criteria (binding)

### 1 4 3 Contrast (Minimum) : AA

| Foreground | Ratio |
|------------|-------|
| Normal text | 4 5 to 1 |
| Large text (18 pt or 14 pt bold) | 3 to 1 |

- 18 pt is approximately 24 CSS pixels at typical 1x zoom.
- 14 pt bold is approximately 18 66 CSS pixels at typical zoom.

### 1 4 6 Contrast (Enhanced) : AAA

| Foreground | Ratio |
|------------|-------|
| Normal text | 7 to 1 |
| Large text | 4 5 to 1 |

`prefers-contrast: more` is the CSS signal that the user *needs* enhanced contrast.

### 1 4 11 Non-text Contrast : AA

UI components and graphical objects MUST have contrast ratio of at least 3 to 1 against adjacent colors. Covers : focus indicators, button borders, form-input borders, custom checkbox / radio indicators, the active-state indicator on tabs, icon-only buttons.

### Contrast formula

WCAG 2 x contrast ratio : `(L1 + 0.05) / (L2 + 0.05)` where `L1` is the lighter and `L2` the darker relative luminance. Relative luminance is the sRGB-gamma-corrected weighted sum `0.2126 R + 0.7152 G + 0.0722 B`. Measurement uses the RENDERED foreground-background pair, not the declared token value.

## Media features : motion and contrast preferences

### `prefers-reduced-motion`

Values : `no-preference` (default), `reduce`.

```css
@media (prefers-reduced-motion: no-preference) { /* opt-in motion */ }
@media (prefers-reduced-motion: reduce) { /* fallback */ }
@media (prefers-reduced-motion) { /* equivalent to "reduce" */ }
```

JavaScript :

```js
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
  if (e.matches) cancelAllAnimations();
});
```

Baseline : Widely available since January 2020. Source : [MDN : prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) (verified 2026-05-19).

**OS mappings** :

| OS | Setting path |
|----|--------------|
| Windows 11 | Settings > Accessibility > Visual Effects > Animation Effects |
| macOS | System Settings > Accessibility > Display > Reduce motion |
| iOS | Settings > Accessibility > Motion |
| Android 9+ | Settings > Accessibility > Remove animations |
| GNOME | Settings > Accessibility > Seeing > Reduced animation |

### `prefers-contrast`

Values : `no-preference` (default), `more`, `less`, `custom`.

- `more` : user wants higher contrast. Swap to high-contrast palette tokens.
- `less` : user wants lower contrast (photosensitivity, migraines). Reduce border weight, soften accents.
- `custom` : user has configured a specific forced-colors palette that does not map to more / less semantics. Same remediation as `more`.

Baseline : Widely available since May 2022. Source : [MDN : prefers-contrast](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) (verified 2026-05-19).

### `prefers-color-scheme`

Values : `light` (default), `dark`. Baseline Widely Available. Out of scope for this skill, covered in `[[frontend-theming-dark-light-mode]]`.

### `forced-colors`

Values : `none` (default), `active`. Baseline Widely Available since September 2022. Source : [MDN : forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) (verified 2026-05-19).

A STATE, not a preference. Signals that the user agent is currently overriding author colors with a limited system palette (Windows High Contrast Mode is the primary use case).

**Properties forced to system colors** : `color`, `background-color`, `border-color`, `outline-color`, `text-decoration-color`, `text-emphasis-color`, `column-rule-color`, SVG `fill`, SVG `stroke`.

**Properties forced to `none`** : `box-shadow`, `text-shadow`, and non-URL `background-image` values.

**Other forced behavior** : `color-scheme` is forced to `light dark`. `scrollbar-color` is forced to `auto`. Backplates are automatically added behind text overlaid on images.

**`forced-color-adjust` property** : escape hatch.

| Value | Behavior |
|-------|----------|
| `auto` (default) | System colors apply ; properties listed above are forced. |
| `none` | Opt out ; author CSS remains, backplates disabled. Use sparingly. |
| `preserve-parent-color` | Limited use ; behaves like `none` when color does not inherit. |

### `prefers-reduced-data`

Values : `no-preference` (default), `reduce`. Limited Availability ; NO browser implements as of 2026-05-19. The `Save-Data` HTTP client hint is the production-ready equivalent. Source : [MDN : prefers-reduced-data](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-data) (verified 2026-05-19).

### `prefers-reduced-transparency`

Values : `no-preference` (default), `reduce`. Limited Availability (Experimental). OS mappings :

| OS | Setting path |
|----|--------------|
| Windows 10 / 11 | Settings > Personalization > Colors > Transparency effects |
| macOS | System Settings > Accessibility > Display > Reduce transparency |
| iOS | Settings > Accessibility > Display & Text Size > Reduce Transparency |

When `reduce`, replace glassmorphism (semi-transparent + `backdrop-filter: blur(...)`) with solid backgrounds and remove `backdrop-filter`. Source : [MDN : prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) (verified 2026-05-19).

## System color keywords (forced-colors palette)

Available wherever a `<color>` value is accepted ; matched against the user's system palette under `forced-colors: active`.

| Keyword | Purpose |
|---------|---------|
| `Canvas` | Background surface |
| `CanvasText` | Normal text |
| `LinkText` | Unvisited links |
| `VisitedText` | Visited links |
| `ActiveText` | Active links (during click) |
| `ButtonFace` | Background of buttons |
| `ButtonText` | Text on buttons |
| `ButtonBorder` | Button border |
| `Field` | Background of input fields |
| `FieldText` | Text inside inputs |
| `Highlight` | Selection background |
| `HighlightText` | Selection text |
| `SelectedItem` | Selected list item background |
| `SelectedItemText` | Selected list item text |
| `Mark` | `<mark>` background |
| `MarkText` | `<mark>` text |
| `GrayText` | Disabled text |
| `AccentColor` | Accent color (user's OS accent) |
| `AccentColorText` | Text on accent-colored surfaces |

Use these as direct values in author CSS inside `@media (forced-colors: active)`. Example : `border-color: ButtonText;`.

**Semantic-matters rule** : the user agent chooses system colors based on NATIVE element semantics, not ARIA roles. `<div role="button">` will NOT get `ButtonText` forced ; `<button>` will. Native HTML beats div-soup for HCM mapping.

**Deprecated `-ms-high-contrast`** : Microsoft's legacy proprietary media query. NEVER use in new code. `forced-colors` is the standard replacement.

## APCA + WCAG 3 (informational only)

APCA (Accessible Perceptual Contrast Algorithm) produces an `Lc` (Lightness contrast) score from -108 to +106 instead of WCAG 2 x luminance ratios. Accounts for polarity, font weight, and spatial frequency.

| Lc threshold | Use case |
|--------------|----------|
| 60 | Basic body-text readability |
| 75 | Enhanced accessibility |
| 90 | High-impact text |

**Normative status as of 2026-05-19** : NOT normative. WCAG 3 is a [Working Draft](https://www.w3.org/TR/wcag-3.0/) (verified 2026-05-19) with the explicit stability disclaimer : "It is inappropriate to cite this document as other than a work in progress."

A backward-compatible variant called Bridge PCA exists, designed so that values can be back-mapped to WCAG 2 x ratios for gradual migration. Bridge PCA is also informational.

**Recommendation** : design tokens that pass both WCAG 2 2 ratio (4 5 to 1 for normal text) AND APCA Lc 60 are future-safe. Cite the 2 x ratio for audits and contracts. Source : [SAPC-APCA repository](https://github.com/Myndex/SAPC-APCA) (verified 2026-05-19).

## SC by component / interaction (decision matrix)

| SC | Trigger scenario | Pass condition | Fail condition | Fix |
|----|------------------|----------------|----------------|-----|
| 2 4 11 (Min) AA | Tab to a control behind a sticky header | Any pixel of the focused control visible | Entire focused control hidden | `scroll-padding-top: <header-height>` |
| 2 4 12 (Enh) AAA | Tab to control near sticky element | Zero pixels covered | Any pixel covered | Avoid sticky overlays ; dynamic offset |
| 2 4 13 AAA | Custom focus ring | At least 2-px perimeter area AND 3 to 1 contrast with unfocused state | Thin or low-contrast ring | `:focus-visible { outline: 2px solid <high-contrast> ; outline-offset: 2px }` |
| 2 5 7 AA | Slider that only responds to drag | Click-on-track moves thumb | Drag-only | Add click-on-track and arrow-key support |
| 2 5 8 AA | 16-px icon button | 24 by 24 OR one of 5 exceptions | 16 by 16 with adjacent dense controls | Increase padding ; or apply spacing exception |
| 3 2 6 A | Help link in different positions per page | Same relative order across page-set | Position changes per page | Shared layout component |
| 3 3 7 A | Multi-step asks twice for shipping address | Pre-fill from earlier step | User must retype | Persist state ; "copy from billing" |
| 3 3 8 AA | Password field with paste blocked | Paste allowed, autofill supported | Paste blocked, math CAPTCHA only | Allow paste ; support autocomplete ; offer passkey |
| 3 3 9 AAA | Login uses image-recognition CAPTCHA | Passkey or paste-friendly OTP | Any CAPTCHA, even object-recognition | Passkey / WebAuthn primary path |
