# References : Methods and Signatures

Complete API signatures for every surface covered by `frontend-syntax-js-es2024-ts-dom`. All signatures verified against MDN and TC39 on 2026-05-19.

## ES2024 grouping

### `Object.groupBy(items, callbackFn)`

```ts
Object.groupBy<K extends PropertyKey, T>(
  items: Iterable<T>,
  callbackFn: (element: T, index: number) => K
): Partial<Record<K, T[]>>
```

- Returns a `null`-prototype object.
- `callbackFn` return value is coerced to a property key (string or symbol).
- `items` may be any iterable, not only arrays.
- The returned object is `Partial<Record<K, T[]>>` under strict TypeScript : accessing a non-existent key returns `undefined`.
- Source : [MDN : Object.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy) (verified 2026-05-19)

### `Map.groupBy(items, callbackFn)`

```ts
Map.groupBy<K, T>(
  items: Iterable<T>,
  callbackFn: (element: T, index: number) => K
): Map<K, T[]>
```

- Same signature shape as `Object.groupBy`, but `K` is unconstrained ; object references work as keys with identity semantics.
- Source : [MDN : Object.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy) (verified 2026-05-19, contrasts the two)

## ES2024 promise

### `Promise.withResolvers()`

```ts
Promise.withResolvers<T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}
```

- Returns an object containing the promise plus its resolver functions.
- The promise behaves identically to one constructed with `new Promise(...)` ; only the binding pattern differs.
- Source : [MDN : Promise.withResolvers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers) (verified 2026-05-19)

## Structured clone

### `structuredClone(value, options?)`

```ts
structuredClone<T>(
  value: T,
  options?: { transfer?: Transferable[] }
): T
```

- Clones using the HTML structured-clone algorithm.
- Supports : `Date`, `Map`, `Set`, `ArrayBuffer`, typed arrays, `DataView`, `Blob`, `File`, `FileList`, `RegExp`, `Error` subtypes, cycles.
- Transferables (move ownership, source detaches) : `ArrayBuffer`, `MessagePort`, `ImageBitmap`, `OffscreenCanvas`, `ReadableStream`, `WritableStream`, `TransformStream`.
- Does NOT clone : functions, getters / setters, class prototypes (the result is a plain object), DOM nodes in most engines, `WeakMap`, `WeakSet`. Throws `DataCloneError`.
- Source : [MDN : structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) (verified 2026-05-19)

## Top-level `await`

```js
// At the top level of any ES module
const config = await fetch("/config.json").then((r) => r.json());
export { config };
```

- Permitted in `<script type="module">`, `.mjs`, ESM `.ts` / `.js`.
- Forbidden in classic scripts (no `type="module"`) and CommonJS modules.
- Sibling modules continue to load in parallel ; only the importing module pauses.
- Source : [MDN : await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) (verified 2026-05-19)

## RegExp `v` flag

```js
const emoji = /\p{RGI_Emoji}/v;
const consonant = /[\p{Letter}--[aeiouAEIOU]]/v;  // set subtraction
const ascii = /[\p{ASCII}&&\p{Letter}]/v;        // set intersection
```

- Adds `&&` (intersection), `--` (subtraction), and string-property `\p{RGI_Emoji}` matching of multi-code-point sequences.
- Mixing `u` and `v` in the same regex throws `SyntaxError` at parse time.
- Source : [MDN : RegExp v flag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets) (verified 2026-05-19)

## Array reverse-search

### `Array.prototype.findLast(predicate)` and `findLastIndex(predicate)`

```ts
Array<T>.prototype.findLast(
  predicate: (value: T, index: number, array: T[]) => unknown,
  thisArg?: any
): T | undefined

Array<T>.prototype.findLastIndex(
  predicate: (value: T, index: number, array: T[]) => unknown,
  thisArg?: any
): number  // -1 when not found
```

- Source : [MDN : findLast](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast) (verified 2026-05-19)

## Well-formed strings

```ts
String.prototype.isWellFormed(): boolean
String.prototype.toWellFormed(): string  // replaces lone surrogates with U+FFFD
```

- Detects and repairs lone UTF-16 surrogates that cause `URIError: URI malformed` in `encodeURI`.
- Source : [MDN : isWellFormed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/isWellFormed) (verified 2026-05-19)

## Iterator helpers

All methods live on `Iterator.prototype`. Wrap any iterable with `Iterator.from(src)` to gain access.

| Method | Signature | Lazy or terminal |
|--------|-----------|------------------|
| `.map(fn)` | `(value, index) => any` returns Iterator | Lazy |
| `.filter(predicate)` | `(value, index) => boolean` returns Iterator | Lazy |
| `.flatMap(fn)` | `(value, index) => Iterable<any>` returns Iterator | Lazy |
| `.take(n)` | `n: number` returns Iterator | Lazy |
| `.drop(n)` | `n: number` returns Iterator | Lazy |
| `.reduce(fn, init?)` | `(acc, value, index) => any` returns value | Terminal |
| `.toArray()` | none returns Array | Terminal |
| `.forEach(fn)` | `(value, index) => void` returns undefined | Terminal |
| `.find(predicate)` | `(value, index) => boolean` returns value or undefined | Terminal |
| `.some(predicate)` | `(value, index) => boolean` returns boolean | Terminal |
| `.every(predicate)` | `(value, index) => boolean` returns boolean | Terminal |

### Static helpers

```ts
Iterator.from<T>(source: Iterable<T> | Iterator<T>): IteratorObject<T>
Iterator.concat(...iterables): IteratorObject
Iterator.zip(iterables): IteratorObject
Iterator.zipKeyed(iterables): IteratorObject
```

### Feature detection

```js
const hasIteratorHelpers =
  typeof Iterator !== "undefined" &&
  typeof Iterator.prototype.map === "function";
```

- Source : [MDN : Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) (verified 2026-05-19)
- TC39 status : Stage 4 in 2025 ([TC39 Finished Proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md) verified 2026-05-19)

## `scheduler.yield()`

```ts
scheduler.yield(): Promise<undefined>
```

- No parameters in the standard form ; an `{ signal, priority }` options bag is on the WICG roadmap.
- Available on the `globalThis.scheduler` object on Window and in Web Workers (where supported).
- Priority inheritance : called inside `scheduler.postTask(fn, { priority })`, the continuation resumes at that priority. Outside, default is `user-visible`.
- The resumed task is enqueued in a boosted queue ahead of equally-prioritized `postTask` calls.
- Baseline : NOT Baseline as of 2026-05-19. Chromium-only in stable channels.
- Source : [MDN : Scheduler.yield](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield) (verified 2026-05-19)

### Related scheduler APIs

```ts
scheduler.postTask(callback, options?: { priority?: "user-blocking" | "user-visible" | "background"; signal?: AbortSignal }): Promise<any>
navigator.scheduling?.isInputPending?.(): boolean
```

## DOM query API surface (lib.dom.d.ts overloads)

### `Document.querySelector`

```ts
querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null;
querySelector<K extends keyof MathMLElementTagNameMap>(selectors: K): MathMLElementTagNameMap[K] | null;
querySelector<E extends Element = Element>(selectors: string): E | null;
```

- The literal-tag overload only matches tag-name selectors (`"button"`, `"input"`).
- For class / id / attribute selectors, supply the generic : `querySelector<HTMLButtonElement>(".submit")`.
- Source : [MDN : Document.querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) (verified 2026-05-19) plus `lib.dom.d.ts` inspection.

### `Document.querySelectorAll`

```ts
querySelectorAll<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>;
querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
```

- `NodeListOf<T>` is iterable. Wrap in `Iterator.from(nodes)` for helper chains, or spread into an array.

### `Document.getElementById`

```ts
getElementById(elementId: string): HTMLElement | null;
```

- TypeScript narrows to `HTMLElement` (the WHATWG spec returns `Element`).
- For a specific subtype, narrow via `instanceof` afterwards, or use generic-typed `querySelector` instead.
- Source : [MDN : Document.getElementById](https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById) (verified 2026-05-19)

### `Element.closest`

```ts
closest<K extends keyof HTMLElementTagNameMap>(selector: K): HTMLElementTagNameMap[K] | null;
closest<E extends Element = Element>(selectors: string): E | null;
```

### `Element.shadowRoot`

```ts
readonly shadowRoot: ShadowRoot | null
```

- Returns `null` when no shadow root is attached, OR when the shadow root was attached with `mode: "closed"` from outside the component, OR for built-in elements with user-agent shadow roots (`<input>`, `<img>`, `<video>`).
- Closed-mode roots remain reachable from inside the component that created them via a captured reference.
- Source : [MDN : Element.shadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/Element/shadowRoot) (verified 2026-05-19)

### `HTMLElement.dataset`

```ts
readonly dataset: DOMStringMap
```

- Indexed access returns `string | undefined` only under `noUncheckedIndexedAccess`. Without that flag, typed as `string` despite runtime `undefined` for missing attributes.
- Setting `dataset.fooBar` writes `data-foo-bar`. Camel-case in, kebab-case on the attribute.

## Event API surface

### `EventTarget.addEventListener`

```ts
addEventListener<K extends keyof HTMLElementEventMap>(
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void;

addEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void;
```

- The typed overload only fires for known event names (`"click"`, `"input"`, `"submit"`, etc.). For custom events, augment `HTMLElementEventMap` (see Patterns).

### `AddEventListenerOptions`

```ts
{
  capture?: boolean;       // listener fires during capture phase
  once?: boolean;          // automatically removed after first fire
  passive?: boolean;       // listener will not call preventDefault (improves scroll perf)
  signal?: AbortSignal;    // abort() removes the listener
}
```

### `EventTarget` typing pitfall

```ts
interface EventTarget {
  addEventListener(...): void;
  removeEventListener(...): void;
  dispatchEvent(event: Event): boolean;
}
```

- `Event.target` and `Event.currentTarget` are typed as `EventTarget | null`. `EventTarget` has only those three methods. To access `.value`, `.checked`, `.dataset`, you MUST narrow.

## Module specifiers + Import Attributes

### Static import with attribute

```js
import x from "./x.json" with { type: "json" };
import css from "./styles.css" with { type: "css" };
```

### Dynamic import with attribute

```ts
import<T = any>(specifier: string, options?: ImportCallOptions): Promise<T>

interface ImportCallOptions {
  with?: Record<string, string>;
}
```

```js
const { default: cfg } = await import("./cfg.json", { with: { type: "json" } });
```

- The `assert` keyword is deprecated. Use `with`.
- Sources :
  - [MDN : import statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) (verified 2026-05-19)
  - [MDN : import() expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) (verified 2026-05-19)

## TypeScript tsconfig flags

| Flag | Default | Recommended | Effect |
|------|---------|-------------|--------|
| `strict` | `false` | `true` | Bundles `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `useUnknownInCatchVariables`, `alwaysStrict` |
| `noUncheckedIndexedAccess` | `false` | `true` | Adds `\| undefined` to every indexed access (`arr[i]`, `dataset.foo`, `record["k"]`) |
| `noImplicitOverride` | `false` | `true` | Requires `override` keyword on subclass methods that shadow a parent method |
| `exactOptionalPropertyTypes` | `false` | `true` | Distinguishes "property missing" from "property set to `undefined`" on `?:` properties |
| `lib` | depends on `target` | `["ES2024", "DOM", "DOM.Iterable"]` | Controls which ambient declarations are loaded |
| `target` | `ES3` | `ES2022` or higher | Output JS syntax level |

Source : [TypeScript : tsconfig reference](https://www.typescriptlang.org/tsconfig/) (verified 2026-05-19)

## TypeScript narrowing primitives

| Pattern | Narrows from | Narrows to |
|---------|--------------|------------|
| `if (!x) return;` | `T \| null \| undefined` | `T` |
| `typeof x === "string"` | `unknown` | `string` |
| `x instanceof HTMLInputElement` | `EventTarget \| null` | `HTMLInputElement` |
| `"prop" in x` | union with member | member with `prop` |
| `x.kind === "foo"` (discriminated union) | union | matching member |
| User-defined type guard `(x: T): x is U` | `T` | `U` |

Source : [TypeScript : Narrowing handbook](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) (verified 2026-05-19)

## `HTMLElementEventMap` augmentation

```ts
// custom-events.d.ts
declare global {
  interface HTMLElementEventMap {
    "app:open-modal": CustomEvent<{ id: string }>;
    "app:save": CustomEvent<{ payload: unknown }>;
  }
  interface DocumentEventMap {
    "app:route-change": CustomEvent<{ from: string; to: string }>;
  }
}
export {};  // ensures the file is a module
```

After augmentation, `addEventListener("app:save", (e) => ...)` types `e` as `CustomEvent<{ payload: unknown }>` without any cast.
