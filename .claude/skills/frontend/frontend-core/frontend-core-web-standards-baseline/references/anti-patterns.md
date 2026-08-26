# Anti-patterns : Web Standards and Baseline

Each entry follows the structure : Symptom : Root cause : Fix.

## 1. UA sniffing instead of feature detection

Symptom : The site breaks on the next Safari point release; conditional code accidentally fires on Chrome iOS WebView; the same `userAgent` string covers two engines with different feature sets.

Root cause : Branching on `navigator.userAgent` substrings. UA strings have always been an unreliable proxy for capability; browser vendors deliberately freeze or rotate substrings to fight UA-based dark patterns.

Fix : Test the capability you actually need. CSS via `@supports`, JS via `'name' in scope`, parse-level via `CSS.supports("(condition)")`. NEVER read `navigator.userAgent` to decide whether to run a code path.

## 2. Assuming "Baseline" implies Safari support without checking the four-engine rule

Symptom : Tickets keep arriving from Safari users for a feature you believed was safe. The feature works in Chromium and Firefox stable.

Root cause : Confusing "shipped in multiple browsers" with "Baseline interoperable". Baseline status requires interop across all four core engines : Chrome (desktop and Android), Edge, Firefox (desktop and Android), Safari (macOS and iOS). A Chromium-only feature is NEVER Baseline, regardless of how stable it is in Chrome.

Fix : Check `status.baseline` on the `web-features` package OR the badge on `https://web.dev/baseline`. Treat any Limited Availability feature as opt-in only; do not assume it works in Safari without explicit support data.

## 3. Polyfilling a feature that is already Baseline Widely Available

Symptom : Bundle ships 30 KB of JavaScript to emulate a CSS or DOM feature that every supported browser already has natively. Lighthouse flags "Unused JavaScript".

Root cause : Stale polyfill registered when the feature was Limited; never removed after the feature reached Widely Available. Examples : `:has()` polyfills, `IntersectionObserver` polyfills, `Object.fromEntries` polyfills.

Fix : Per release, query the project for polyfill registrations. For each, look up the feature on `web-features`. If `status.baseline === 'high'` and `baseline_high_date` is older than 6 months : delete the polyfill. Commit message : `chore: remove polyfill for X (Widely Available since YYYY-MM)`.

## 4. Using `try/catch` as feature detection

Symptom : Silent failures hide real bugs. The "feature missing" branch is taken even on supporting browsers because some other error inside the try block raised. Telemetry shows the fallback path running far more often than expected.

Root cause : `try/catch` swallows the entire block, not just the targeted detection. Any unrelated exception (e.g. a typo, a missing dependency, a permission error) lands in the catch block and is interpreted as "feature unavailable".

Fix : Use explicit existence checks. `'name' in scope` for globals, `'method' in Object.prototype` (or the relevant prototype) for instance methods, `CSS.supports(...)` for CSS. Reserve `try/catch` for genuine error handling where the operation MAY fail at runtime even when supported (e.g. permission-gated APIs).

## 5. Treating MDN BCD per-version data as Baseline interop status

Symptom : Feature ships, then breaks for users on browser versions that BCD listed as "supported". Bug report : "the BCD table is all green, why is this failing?".

Root cause : BCD records the first version that shipped a feature, not whether the implementation is interoperable across engines. Two browsers can both have a "supported" badge while disagreeing on edge cases (e.g. event ordering, computed-value rules, error throwing). Baseline status answers the interop question explicitly; BCD does not.

Fix : Use BCD for "what version is the floor". Use Baseline for "is this safe to ship". When the two disagree, trust Baseline. Tools : `web-features` package OR the Baseline badge on web.dev / MDN.

## 6. Adding `-webkit-` prefixes to evergreen-era properties

Symptom : Production CSS contains hundreds of `-webkit-flex`, `-webkit-transform`, `-webkit-border-radius` declarations. Bundle size and parse time inflated for no behavioral gain.

Root cause : Muscle memory from the 2010-era prefix wars and PostCSS autoprefixer configurations that target unrealistic browser baselines (e.g. `> 0.1%` globally, which pulls in IE-era engines).

Fix : Configure autoprefixer (or equivalent) to target `evergreen-2026` (e.g. `last 2 versions and supports es6-module`). For new code, do not write prefixed properties. The only prefixes that remain relevant in 2026 are very narrow : `-webkit-text-size-adjust` on Safari, certain `-webkit-background-clip: text` patterns. Verify per-property on MDN before adding any prefix.

## 7. Citing MDN over the spec when they disagree

Symptom : Code implements behavior that no browser actually produces; bug reports cite "MDN says X" but every engine does Y. The MDN content is months out of date relative to the spec.

Root cause : Treating MDN as normative. MDN is a curated secondary source. It tracks the spec but lags during fast-moving periods (e.g. CSS Nesting parsing rules, View Transitions API revisions).

Fix : When stating spec-defined behavior, cite the LS (HTML, DOM, Fetch, URL, Streams) or the W3C TR draft (CSS, WCAG, ARIA). MDN is acceptable as primary citation when the MDN page embeds the spec link and the BCD table is current. When MDN and the spec disagree, follow the spec and file an MDN content issue.

## 8. Treating "evergreen" as "no compatibility work"

Symptom : New Baseline-Newly features ship unguarded; bug reports arrive from users on browser versions released less than 6 months ago.

Root cause : Conflating "users keep their browser updated" with "every supported browser version has every feature". Evergreen means the floor moves; it does NOT mean Newly Available features are safe to ship without `@supports` gating.

Fix : Read the per-feature Baseline status. For Newly Available features, gate with `@supports` (CSS) or `'name' in scope` (JS) AND provide a fallback. Only remove the gate after the feature reaches Widely Available and 6 months have elapsed.
