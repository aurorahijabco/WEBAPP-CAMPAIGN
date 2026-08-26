---
name: frontend-syntax-js-es2024-ts-dom
description: >
  Use when writing vanilla JavaScript or TypeScript that touches the DOM in an
  evergreen-2026 browser, picking an ES2024 grouping / deep-clone / promise /
  iterator API, typing an event handler, narrowing a `querySelector` or
  `getElementById` return, or breaking up a long task to protect INP.
  Prevents the most common modern JS/TS regressions in 2026 : `JSON.parse(JSON.stringify(x))`
  deep clones that drop `Date` and crash on cycles, hand-rolled "deferred" promise
  patterns that leak resolvers out of an executor closure, `reduce` accumulator
  boilerplate for grouping, blind `as HTMLInputElement` casts on `event.target`
  that lie under delegation, `requestAnimationFrame` misused as a generic yield
  that breaks the INP budget, Iterator helpers shipped without feature detection
  to older mobile WebViews, and the deprecated `import ... assert { type: "json" }`
  syntax replaced by `with`.
  Covers ES2024 DOM-relevant features (`Object.groupBy`, `Map.groupBy`,
  `Promise.withResolvers`, `structuredClone` with `transfer`, top-level `await`,
  the regex `v` flag, `Array.findLast` / `findLastIndex`, well-formed string
  helpers), Iterator helpers on `Iterator.prototype` (`.map .filter .flatMap
  .take .drop .reduce .toArray`) with the lazy-vs-terminal distinction and
  feature detection, `scheduler.yield()` with `setTimeout(_, 0)` fallback and
  priority inheritance from `postTask`, TypeScript DOM strict-mode rules (the
  required tsconfig flags `strict` / `noUncheckedIndexedAccess` /
  `noImplicitOverride` / `exactOptionalPropertyTypes`), `instanceof` narrowing
  on `event.target`, `lib.dom.d.ts` quirks (`querySelector` overload set,
  `getElementById` returning `HTMLElement | null`, `dataset` typing, custom
  events via `HTMLElementEventMap` module augmentation), and Import Attributes
  (`import x from "./x.json" with { type: "json" }`).
  Keywords: Object groupBy, Map groupBy, Promise withResolvers, structuredClone,
  Iterator prototype, iterator helpers, scheduler yield, instanceof,
  HTMLElementEventMap, lib dom d ts, querySelector, EventTarget, ValidityState,
  strict mode, noUncheckedIndexedAccess, exactOptionalPropertyTypes,
  noImplicitOverride, import attributes, top-level await, regex v flag,
  findLast, findLastIndex, isWellFormed, deep clone broken, type cast lies,
  INP regression, long task, mobile WebView crash, Property does not exist on
  EventTarget, querySelector returns null, TypeScript yells at DOM, can not
  narrow event target, deferred promise pattern, how do I group an array in
  JavaScript, what is Promise withResolvers, how to deep clone in JS,
  TypeScript with DOM, how to narrow event target type, how to type DOM events,
  what is iterator helpers, how to break up a long task
license: MIT
compatibility: "Designed for Claude Code. Requires Frontend Design evergreen-2026."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# Frontend Syntax : ES2024 + TypeScript DOM

This skill is the operational reference for ES2024 features that matter at the DOM boundary and the TypeScript narrowing patterns that make `lib.dom.d.ts` ergonomic instead of hostile. It covers ES2024 grouping / deep-clone / promise / iterator surfaces, `scheduler.yield()` for INP, TypeScript strict-mode flags, `instanceof` narrowing on `event.target`, `HTMLElementEventMap` augmentation, and Import Attributes. The skill does NOT cover React / Vue / Solid / Svelte / Angular hook patterns, bundler config, Node.js APIs, or Web Components lifecycle (see `[[frontend-impl-web-components]]`).

## Quick Reference

### Floor rules

- ALWAYS use `structuredClone(x)` for deep cloning data that includes `Date`, `Map`, `Set`, typed arrays, or cycles. NEVER use `JSON.parse(JSON.stringify(x))` for the same task ; it drops types and crashes on cycles.
- ALWAYS use `Promise.withResolvers()` when the resolver must be called from outside the promise body. NEVER hoist `resolve` / `reject` out of a `new Promise(...)` executor with a `let` declaration.
- ALWAYS group with `Object.groupBy(items, fn)` for string / symbol keys, `Map.groupBy(items, fn)` for arbitrary object keys. NEVER hand-roll a `reduce` accumulator for the same task.
- ALWAYS narrow `event.target` with `instanceof HTMLInputElement` (or the relevant element class) before reading `.value`, `.checked`, or `.dataset`. NEVER use `as HTMLInputElement` ; the cast lies under delegation and programmatic dispatch.
- ALWAYS feature-detect `scheduler.yield()` with a `setTimeout(_, 0)` fallback. NEVER assume it is available ; as of 2026-05-19 only Chromium ships it in stable channels.
- ALWAYS feature-detect Iterator helpers (`typeof Iterator?.prototype?.map === "function"`) when targeting non-evergreen mobile WebViews. NEVER ship `.map().filter().take(n).toArray()` chains without a polyfill or detection.
- ALWAYS narrow `null` returns from `getElementById`, `querySelector`, and `closest` with `if (!el) return;`. NEVER use the `!` non-null assertion ; the runtime still throws when the ID is missing.
- ALWAYS use `import x from "./x.json" with { type: "json" }` (Import Attributes). NEVER use the deprecated `assert { type: "json" }` syntax.

### Decision tree 1 : Iterator helper vs Array method ?

```
Source is an Array AND you do not chain ?
  -> array methods (.map, .filter, .reduce). No advantage to wrapping.

Source is iterable (generator, Set, NodeList, Map.entries(), custom iterator) ?
  -> Iterator.from(src).filter(fn).map(fn).take(n).toArray()
     Avoids the intermediate Array allocations that .filter().map() on arrays causes.

You want laziness : only iterate as many source elements as needed ?
  -> Iterator helpers (.take is lazy ; consumes only what it needs).
     array.filter().map().slice(0, n) eagerly iterates the entire array.

You target only evergreen-2026 desktop ?
  -> Iterator helpers are practically Baseline. Ship without polyfill.

You ship to older mobile WebViews ?
  -> Feature-detect : typeof Iterator?.prototype?.map === "function"
     Polyfill via core-js or es-iterator-helpers when missing.
```

### Decision tree 2 : `scheduler.yield()` vs `requestAnimationFrame` vs `setTimeout` ?

```
You need to break up a long task and stay responsive to input (INP target < 200 ms) ?
  -> await scheduler.yield() with setTimeout(_, 0) fallback.
     scheduler.yield() resumes at user-visible priority, boosted ahead of equal-priority postTask.

You need to read layout or paint after a DOM change ?
  -> requestAnimationFrame(cb). Tied to the frame boundary. NOT a generic yield.

You need to defer work that may never need to run ?
  -> requestIdleCallback(cb). Lowest priority ; may starve.

You only care about "give up the current task" and have no priority needs ?
  -> setTimeout(fn, 0) or await new Promise(r => setTimeout(r, 0)). Macrotask tail.
```

### Decision tree 3 : `instanceof` vs `as` cast on `event.target` ?

```
Always prefer instanceof. The single exception : you just called
document.createElement<'input'>("input") and you control the variable.

Handler bound to a single known element ?
  -> Prefer e.currentTarget over e.target ; the handler signature can be
     typed once with a type assertion on the receiver instead of casting per event.

Handler delegated from a parent (e.g. one click listener for a list) ?
  -> if (!(e.target instanceof HTMLButtonElement)) return;
     Inside the if, e.target is HTMLButtonElement with no cast.

Custom event with typed detail ?
  -> Augment HTMLElementEventMap so addEventListener types the handler param.
```

### Decision tree 4 : Deep clone strategy ?

```
Plain data : numbers, strings, booleans, plain objects, arrays ?
  -> structuredClone(x). Works ; no surprises.

Includes Date, Map, Set, typed arrays, ArrayBuffer, Blob, File, RegExp, Error ?
  -> structuredClone(x). Preserves type. JSON round-trip drops these.

Contains cycles (a.b.a === a) ?
  -> structuredClone(x). JSON round-trip throws TypeError: cyclic object.

Contains functions, getters, setters, class instances with private fields ?
  -> structuredClone throws DataCloneError. Either restructure the data, or
     write a manual clone for the specific shape. A library is overkill.

You want to TRANSFER ownership of an ArrayBuffer / OffscreenCanvas / MessagePort ?
  -> structuredClone(value, { transfer: [buf] }) ; source buffer is detached.
```

## Patterns

### Pattern : Group items with `Object.groupBy`

```js
const orders = [
  { id: 1, status: "paid" },
  { id: 2, status: "pending" },
  { id: 3, status: "paid" },
];

const byStatus = Object.groupBy(orders, (order) => order.status);
// byStatus = { paid: [{id:1,...}, {id:3,...}], pending: [{id:2,...}] }
// byStatus has null prototype : no hasOwnProperty / toString collisions.
```

When the group key is an arbitrary object reference (two distinct objects with identical shape must produce two distinct groups), use `Map.groupBy(items, fn)` and read with `.get(key)`.

### Pattern : `Promise.withResolvers` for event-driven flows

```js
function openDialog(message) {
  const { promise, resolve } = Promise.withResolvers();

  const dialog = document.querySelector("dialog");
  dialog.querySelector(".message").textContent = message;
  dialog.addEventListener("close", () => resolve(dialog.returnValue), { once: true });
  dialog.showModal();

  return promise;
}

const result = await openDialog("Continue ?");
```

The resolver lives in the same scope as the listener. No `let resolve;` hoisted above a `new Promise(...)`.

### Pattern : `structuredClone` with transferables

```js
const src = new ArrayBuffer(1024);
const dst = structuredClone(src, { transfer: [src] });

console.log(src.byteLength);  // 0 ; source is detached.
console.log(dst.byteLength);  // 1024 ; ownership moved.
```

Use to hand an `ArrayBuffer` to a worker without copying. Combine with `postMessage(value, [transfer])` for cross-realm.

### Pattern : Iterator helper chain on a NodeList

```js
const visibleTexts = Iterator.from(document.querySelectorAll("li"))
  .filter((li) => li.offsetParent !== null)
  .map((li) => li.textContent.trim())
  .filter((t) => t.length > 0)
  .take(10)
  .toArray();
```

`.take(10)` is lazy : iteration stops after 10 elements survive both filters, even if the NodeList has 10 000 items. The same chain with array methods (`[...nodes].filter(...).map(...).filter(...).slice(0, 10)`) materializes three intermediate arrays of size ~10 000.

### Pattern : `scheduler.yield` with fallback

```js
async function yieldToMain() {
  if ("scheduler" in globalThis && "yield" in globalThis.scheduler) {
    return globalThis.scheduler.yield();
  }
  return new Promise((r) => setTimeout(r, 0));
}

async function processChunks(items) {
  for (const item of items) {
    work(item);
    if (navigator.scheduling?.isInputPending?.()) {
      await yieldToMain();
    }
  }
}
```

Yields only when input is actually pending. The yielded continuation resumes at the same priority as the surrounding `postTask` call, or `user-visible` by default.

### Pattern : TypeScript narrowing on `event.target`

```ts
const form = document.querySelector("form");
if (!form) throw new Error("form missing");

form.addEventListener("input", (e) => {
  if (!(e.target instanceof HTMLInputElement)) return;
  // e.target is HTMLInputElement here. .value is string. No cast.
  console.log(e.target.name, e.target.value);
});
```

The `instanceof` check survives event delegation, programmatic dispatch, and shadow-DOM retargeting. An `as HTMLInputElement` cast does not.

### Pattern : Typed custom events via module augmentation

```ts
interface OpenModalDetail {
  id: string;
}

declare global {
  interface HTMLElementEventMap {
    "app:open-modal": CustomEvent<OpenModalDetail>;
  }
}

document.addEventListener("app:open-modal", (e) => {
  // e is CustomEvent<OpenModalDetail>. e.detail.id is string.
  loadModal(e.detail.id);
});
```

Augmentation must live in a `.d.ts` or `.ts` file that is part of the compilation. After augmentation, no cast is needed at any call site.

### Pattern : `querySelector` with generic vs literal tag

```ts
const button1 = document.querySelector("button");          // HTMLButtonElement | null
const button2 = document.querySelector(".submit");         // Element | null
const button3 = document.querySelector<HTMLButtonElement>(".submit"); // HTMLButtonElement | null
```

The literal-tag overload only matches tag-name selectors. For class / id / attribute selectors, supply the generic to recover the type. Never write `(document.querySelector(".submit") as HTMLButtonElement)`.

### Pattern : Import Attributes for JSON modules

```js
// Static
import config from "./config.json" with { type: "json" };

// Dynamic
const { default: routes } = await import("./routes.json", {
  with: { type: "json" },
});
```

The attribute forces the host to refuse the module if the response is anything other than JSON. Replaces the deprecated `assert { type: "json" }` syntax.

### Pattern : Required tsconfig flags

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

`strict` bundles `strictNullChecks` and friends. `noUncheckedIndexedAccess` adds `| undefined` to `arr[i]` and `dataset.foo`. `noImplicitOverride` catches typos like `disconnectCallback` versus the spec-defined `disconnectedCallback`. `exactOptionalPropertyTypes` distinguishes "property missing" from "property set to `undefined`".

## Baseline status

| Feature | Status | Notes |
|---------|--------|-------|
| `Object.groupBy` / `Map.groupBy` | Newly available March 2024 | Safe in evergreen-2026 ([MDN : Object.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy) verified 2026-05-19) |
| `Promise.withResolvers` | Newly available March 2024 | Safe in evergreen-2026 ([MDN : Promise.withResolvers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers) verified 2026-05-19) |
| `structuredClone` | Widely available March 2022 | Including `transfer` option ([MDN : structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) verified 2026-05-19) |
| Top-level `await` | Widely available March 2022 | ES modules only ([MDN : await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) verified 2026-05-19) |
| RegExp `v` flag | Widely available September 2023 | Mixing with `u` throws SyntaxError ([MDN : v flag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets) verified 2026-05-19) |
| `Array.findLast` / `findLastIndex` | Widely available August 2022 | ([MDN : findLast](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast) verified 2026-05-19) |
| `String.isWellFormed` / `toWellFormed` | Widely available October 2023 | ([MDN : isWellFormed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/isWellFormed) verified 2026-05-19) |
| Iterator helpers | Partial Baseline 2025 | TC39 Stage 4 ; feature-detect for older mobile WebViews ([MDN : Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) verified 2026-05-19) |
| `scheduler.yield()` | Limited availability | Chromium only ; feature-detect with fallback ([MDN : Scheduler.yield](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield) verified 2026-05-19) |
| Import Attributes (`with`) | Baseline 2025 | Replaces deprecated `assert` ([MDN : import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) verified 2026-05-19) |

## Cross-references

- `[[frontend-impl-web-components]]` : custom-element lifecycle, `ElementInternals`, form-associated controls.
- `[[frontend-syntax-html5-form]]` : `ValidityState`, `:user-invalid`, `aria-errormessage`, FormData APIs.
- `[[frontend-core-web-standards-baseline]]` : Baseline interpretation, feature-detection conventions.

## Reference Links

- [references/methods.md](references/methods.md) : complete API signatures for every covered surface.
- [references/examples.md](references/examples.md) : self-contained `.ts` micro-app combining strict-mode tsconfig, narrowed DOM event handler, `Object.groupBy`, and `Promise.withResolvers`.
- [references/anti-patterns.md](references/anti-patterns.md) : ten anti-patterns with symptom, root cause, and fix.

## Authoritative sources

- [MDN : Object.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy) (verified 2026-05-19)
- [MDN : Promise.withResolvers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers) (verified 2026-05-19)
- [MDN : structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) (verified 2026-05-19)
- [MDN : Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) (verified 2026-05-19)
- [MDN : Scheduler.yield](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield) (verified 2026-05-19)
- [MDN : RegExp v flag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets) (verified 2026-05-19)
- [MDN : Array.findLast](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast) (verified 2026-05-19)
- [MDN : String.isWellFormed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/isWellFormed) (verified 2026-05-19)
- [MDN : import statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) (verified 2026-05-19)
- [MDN : import() expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) (verified 2026-05-19)
- [MDN : await operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) (verified 2026-05-19)
- [MDN : Document.querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) (verified 2026-05-19)
- [MDN : Element.shadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/Element/shadowRoot) (verified 2026-05-19)
- [MDN : button element (popover)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button) (verified 2026-05-19)
- [TC39 Finished Proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md) (verified 2026-05-19)
- [TypeScript : Narrowing handbook](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) (verified 2026-05-19)
- [TypeScript : tsconfig reference](https://www.typescriptlang.org/tsconfig/) (verified 2026-05-19)
- [developer.chrome.com : scheduler.yield](https://developer.chrome.com/blog/introducing-scheduler-yield-origin-trial) (verified 2026-05-19)
