# References : Anti-patterns

Ten anti-patterns that occur in real ES2024 + TypeScript DOM code, with symptom, root cause, and fix. Each one is sourced to a verified MDN or TC39 URL.

## 1. `JSON.parse(JSON.stringify(x))` for deep clone

**Symptom** : after cloning, `Date` fields are strings, `Map` and `Set` are empty objects, `undefined` properties have vanished, `Symbol` keys are gone, and any cyclic structure throws `TypeError: Converting circular structure to JSON`.

**Root cause** : `JSON.stringify` serializes only enumerable string-keyed values that JSON can represent. `Date` becomes its ISO string. `Map` and `Set` have no JSON representation and become `{}`. Functions, `undefined`, and `Symbol` keys are dropped. Cycles throw.

**Fix** :

```js
// Wrong
const copy = JSON.parse(JSON.stringify(original));

// Right
const copy = structuredClone(original);
```

`structuredClone` supports `Date`, `Map`, `Set`, typed arrays, `Blob`, `RegExp`, `Error`, and cycles. Source : [MDN : structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) (verified 2026-05-19).

## 2. Hand-rolled "deferred" promise pattern

**Symptom** : code declares `let resolve, reject;` above a `new Promise(...)` block, only to hoist the resolver functions out of the executor closure. Brittle initialization order ; resolvers may be read before assignment in async flows.

**Root cause** : before ES2024, no built-in returned the promise and its resolvers together. The only workaround was to leak them out of the executor body.

**Fix** :

```js
// Wrong
let resolve;
const p = new Promise((r) => { resolve = r; });
// ... somewhere else
resolve(value);

// Right
const { promise, resolve } = Promise.withResolvers();
// ... somewhere else
resolve(value);
```

Source : [MDN : Promise.withResolvers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers) (verified 2026-05-19).

## 3. `reduce` accumulator for grouping

**Symptom** : five lines of accumulator boilerplate every time you need to bucket an array by a property.

**Root cause** : the `reduce` recipe was the canonical pre-ES2024 idiom. It mutates an accumulator object and returns it. Easy to write incorrectly (forget the `return acc`, forget the `||= []`, forget the default seed `{}`).

**Fix** :

```js
// Wrong
const byStatus = items.reduce((acc, item) => {
  (acc[item.status] ||= []).push(item);
  return acc;
}, {});

// Right
const byStatus = Object.groupBy(items, (item) => item.status);
```

For arbitrary object keys, `Map.groupBy(items, fn)` preserves identity. Source : [MDN : Object.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy) (verified 2026-05-19).

## 4. Blind `as` cast on `event.target` in TypeScript

**Symptom** : `TypeError: Cannot read properties of null (reading 'value')` or `Cannot read properties of undefined (reading 'value')` at runtime, on a line that the TypeScript compiler accepted without warning.

**Root cause** : `Event.target` is typed as `EventTarget | null` in `lib.dom.d.ts`. The `as HTMLInputElement` cast tells the compiler "trust me", but does no runtime check. Under event delegation, programmatic dispatch from another handler, or shadow-DOM retargeting, the actual target may be a different element type. The cast lies and the property read crashes.

**Fix** :

```ts
// Wrong
form.addEventListener("input", (e) => {
  const v = (e.target as HTMLInputElement).value;
});

// Right
form.addEventListener("input", (e) => {
  if (!(e.target instanceof HTMLInputElement)) return;
  const v = e.target.value;  // typed as string, runtime-safe
});
```

`instanceof` narrows at compile time and checks at runtime. Source : [TypeScript : Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) (verified 2026-05-19).

## 5. Non-null assertion on `getElementById`

**Symptom** : `TypeError: Cannot read properties of null (reading 'click')` at runtime. Code compiled fine.

**Root cause** : the `!` non-null assertion suppresses the compiler warning that the value might be `null`. It does not change runtime behavior. When the element with the requested ID is missing (typo, removed from markup, loaded asynchronously, conditionally rendered), the runtime still throws.

**Fix** :

```ts
// Wrong
document.getElementById("submit")!.click();

// Right
const submit = document.getElementById("submit");
if (!submit) return;
submit.click();
```

For unrecoverable required elements, throw with a clear message :

```ts
const submit = document.getElementById("submit");
if (!submit) throw new Error("submit button missing : check markup id='submit'");
submit.click();
```

Source : [MDN : Document.getElementById](https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById) (verified 2026-05-19).

## 6. Iterator helpers shipped without feature detection

**Symptom** : `TypeError: Iterator is not defined` or `iter.map is not a function` on older Android WebView, older iOS Safari, and embedded browsers.

**Root cause** : Iterator helpers reached TC39 Stage 4 in 2025 ([TC39 Finished Proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md) verified 2026-05-19). Evergreen-2026 desktop browsers ship them ; older mobile WebViews lag. MDN currently labels the Iterator interface as Baseline "Widely available *" with the asterisk specifically calling out the helper-method gap ([MDN : Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) verified 2026-05-19).

**Fix** :

```js
// Wrong : assumes presence
const out = Iterator.from(items).map(fn).filter(pred).toArray();

// Right : feature-detect, polyfill when missing
const hasIteratorHelpers =
  typeof Iterator !== "undefined" &&
  typeof Iterator.prototype.map === "function";

if (!hasIteratorHelpers) {
  await import("core-js/proposals/iterator-helpers");
}

const out = Iterator.from(items).map(fn).filter(pred).toArray();
```

Or accept the cost and use array methods when targeting older WebViews :

```js
const out = [...items].filter(pred).map(fn);
```

## 7. `requestAnimationFrame` misused as a generic yield

**Symptom** : INP (Interaction to Next Paint) regressions in real-user metrics. Interactions feel laggy even though the long task was "broken up" with `await new Promise(requestAnimationFrame)` calls.

**Root cause** : `requestAnimationFrame` resumes at the next frame boundary, roughly every 16 ms at 60 Hz. For a long task that should fit inside the INP budget of 200 ms, this is far too coarse. Worse, frames can be skipped under load, stretching the gap further. `requestAnimationFrame` is designed for visual updates, not generic task chunking.

**Fix** :

```js
// Wrong
for (const item of items) {
  work(item);
  await new Promise(requestAnimationFrame);
}

// Right
async function yieldToMain() {
  if ("scheduler" in globalThis && "yield" in globalThis.scheduler) {
    return globalThis.scheduler.yield();
  }
  return new Promise((r) => setTimeout(r, 0));
}

for (const item of items) {
  work(item);
  if (navigator.scheduling?.isInputPending?.()) {
    await yieldToMain();
  }
}
```

`scheduler.yield()` resumes at boosted priority ahead of equal-priority `postTask` calls. Sources : [MDN : Scheduler.yield](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield) and [developer.chrome.com : scheduler.yield](https://developer.chrome.com/blog/introducing-scheduler-yield-origin-trial) (both verified 2026-05-19).

## 8. `import x from "./x.json" assert { type: "json" }` (deprecated)

**Symptom** : `SyntaxError: Unexpected reserved word` or warning in browser console / bundler output. Some bundlers silently rewrite, others fail the build.

**Root cause** : the original Import Assertions proposal used the `assert` keyword. It shipped briefly, then TC39 replaced the syntax with Import Attributes using `with` because `assert` implied "the host may reject" while the actual semantics are "the host MUST refuse if the type does not match".

**Fix** :

```js
// Wrong (deprecated)
import config from "./config.json" assert { type: "json" };

// Right
import config from "./config.json" with { type: "json" };

// Dynamic, right
const { default: config } = await import("./config.json", {
  with: { type: "json" },
});
```

Sources : [MDN : import statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import), [MDN : import() expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import), [TC39 Finished Proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md) (all verified 2026-05-19).

## 9. `querySelector(".x")` typed as `HTMLInputElement` (overload miss)

**Symptom** : `Property 'value' does not exist on type 'Element'.` from the TypeScript compiler, on `document.querySelector(".email-input").value`.

**Root cause** : the typed overload of `querySelector` only kicks in for tag-name literal selectors (`"input"`, `"button"`). For class, id, or attribute selectors, the fallback overload returns `Element | null`. `Element` does not have `.value`.

**Fix** :

```ts
// Wrong : compiler error or unsafe cast
const input1 = document.querySelector(".email-input");           // Element | null
const v1 = input1?.value;                                        // error
const input2 = document.querySelector(".email-input") as HTMLInputElement;  // unsafe

// Right : pass the generic
const input = document.querySelector<HTMLInputElement>(".email-input");
if (!input) return;
const v = input.value;
```

Source : [MDN : Document.querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) (verified 2026-05-19) plus `lib.dom.d.ts` inspection.

## 10. `dataset.foo = undefined` to clear an attribute

**Symptom** : the attribute is set to the string `"undefined"`, not removed. CSS selectors like `[data-foo]` still match.

**Root cause** : `dataset` is a `DOMStringMap`. Setting a property writes the value as a string via the underlying `setAttribute` call. `undefined` is coerced to `"undefined"`. To remove the attribute, the property must be deleted or `removeAttribute` must be called.

**Fix** :

```ts
// Wrong
el.dataset.foo = undefined;
// data-foo="undefined"

// Right
delete el.dataset.foo;
// or
el.removeAttribute("data-foo");
```

This anti-pattern interacts with `exactOptionalPropertyTypes: true` : under that flag, setting an optional property to `undefined` is rejected, which surfaces this bug at compile time. Source : `lib.dom.d.ts` `DOMStringMap` definition plus [MDN : HTMLElement.dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset) (verified 2026-05-19).
