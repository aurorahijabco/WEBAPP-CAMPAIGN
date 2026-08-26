# References : Examples

Working code samples combining the surfaces covered by `frontend-syntax-js-es2024-ts-dom`. The canonical example is a typed micro-app that ties the most-used ES2024 + TS DOM patterns together.

## Canonical example : typed micro-app (TypeScript)

A small order-dashboard that loads JSON config via Import Attributes, groups orders by status with `Object.groupBy`, opens a confirmation dialog via `Promise.withResolvers`, narrows DOM events with `instanceof`, declares a custom event via `HTMLElementEventMap` augmentation, and uses `scheduler.yield()` with fallback while rendering rows.

### `tsconfig.json`

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
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "verbatimModuleSyntax": true
  }
}
```

### `app.d.ts` (ambient augmentation)

```ts
interface OpenConfirmDetail {
  message: string;
}

interface OrderDeletedDetail {
  id: number;
}

declare global {
  interface HTMLElementEventMap {
    "app:open-confirm": CustomEvent<OpenConfirmDetail>;
    "app:order-deleted": CustomEvent<OrderDeletedDetail>;
  }
}

export {};
```

### `app.ts`

```ts
import config from "./config.json" with { type: "json" };

type Order = {
  id: number;
  status: "paid" | "pending" | "refunded";
  amount: number;
};

async function yieldToMain(): Promise<void> {
  if ("scheduler" in globalThis && "yield" in globalThis.scheduler) {
    await (globalThis as { scheduler: { yield(): Promise<undefined> } })
      .scheduler.yield();
    return;
  }
  await new Promise<void>((r) => setTimeout(r, 0));
}

function openConfirm(message: string): Promise<boolean> {
  const dialog = document.querySelector<HTMLDialogElement>("dialog#confirm");
  if (!dialog) throw new Error("dialog#confirm missing");

  const body = dialog.querySelector<HTMLParagraphElement>("p.message");
  if (!body) throw new Error("dialog message slot missing");
  body.textContent = message;

  const { promise, resolve } = Promise.withResolvers<boolean>();

  dialog.addEventListener(
    "close",
    () => resolve(dialog.returnValue === "ok"),
    { once: true },
  );

  dialog.showModal();
  return promise;
}

async function renderOrders(orders: Order[]): Promise<void> {
  const list = document.querySelector<HTMLUListElement>("ul#orders");
  if (!list) throw new Error("ul#orders missing");

  const byStatus = Object.groupBy(orders, (o) => o.status);

  list.replaceChildren();

  for (const [status, items] of Object.entries(byStatus)) {
    if (!items) continue;
    const heading = document.createElement("li");
    heading.className = "group";
    heading.textContent = `${status} (${items.length})`;
    list.append(heading);

    for (const order of items) {
      const li = document.createElement("li");
      li.dataset.orderId = String(order.id);
      li.textContent = `#${order.id} ${order.amount.toFixed(2)} ${config.currency}`;
      list.append(li);

      if (navigator.scheduling?.isInputPending?.()) {
        await yieldToMain();
      }
    }
  }
}

function attachDelegatedClick(): void {
  const list = document.querySelector<HTMLUListElement>("ul#orders");
  if (!list) throw new Error("ul#orders missing");

  list.addEventListener("click", async (e) => {
    if (!(e.target instanceof HTMLLIElement)) return;
    const idRaw = e.target.dataset.orderId;
    if (!idRaw) return;

    const id = Number(idRaw);
    const confirmed = await openConfirm(`Delete order #${id} ?`);
    if (!confirmed) return;

    document.dispatchEvent(
      new CustomEvent<OrderDeletedDetail>("app:order-deleted", {
        detail: { id },
      }),
    );

    e.target.remove();
  });
}

document.addEventListener("app:order-deleted", (e) => {
  console.log("order deleted", e.detail.id);
});

attachDelegatedClick();

const orders = await fetch("/api/orders").then((r) => r.json() as Promise<Order[]>);
await renderOrders(orders);
```

### Notes on the canonical example

- The file uses top-level `await` (allowed because it is an ES module).
- `document.querySelector<HTMLDialogElement>("dialog#confirm")` returns `HTMLDialogElement | null`. The `if (!dialog) throw` narrows.
- `Object.groupBy` returns `Partial<Record<"paid" | "pending" | "refunded", Order[]>>` under strict TypeScript. The `if (!items) continue;` guard satisfies `noUncheckedIndexedAccess`.
- `e.target instanceof HTMLLIElement` narrows from `EventTarget | null`. Inside the `if`, `e.target.dataset` is typed.
- `document.dispatchEvent(new CustomEvent<OrderDeletedDetail>(...))` types correctly because `HTMLElementEventMap` was augmented.
- `await yieldToMain()` only fires when `isInputPending()` reports a pending input event. Without that gate, every loop iteration would yield and INP would still suffer from coordination overhead.

## Standalone examples

### `Object.groupBy` versus reduce

```js
// ES2024
const byStatus = Object.groupBy(orders, (o) => o.status);

// Pre-ES2024 (now an anti-pattern)
const byStatus2 = orders.reduce((acc, o) => {
  (acc[o.status] ||= []).push(o);
  return acc;
}, {});
```

### `Map.groupBy` with object keys

```js
const groupKeyA = { project: "a" };
const groupKeyB = { project: "b" };

const items = [
  { key: groupKeyA, value: 1 },
  { key: groupKeyB, value: 2 },
  { key: groupKeyA, value: 3 },
];

const grouped = Map.groupBy(items, (i) => i.key);
console.log(grouped.get(groupKeyA));  // [{key:groupKeyA, value:1}, {key:groupKeyA, value:3}]
```

### `structuredClone` with `Date` and `Map`

```js
const original = {
  created: new Date("2026-01-15"),
  tags: new Map([["primary", true], ["secondary", false]]),
  nested: { items: [1, 2, 3] },
};

const copy = structuredClone(original);
copy.created.setFullYear(2027);

console.log(original.created.getFullYear());  // 2026 ; deep copy
console.log(copy.tags instanceof Map);        // true ; type preserved
```

### `structuredClone` with transferable buffer

```js
const buffer = new ArrayBuffer(4 * 1024 * 1024);  // 4 MB
const view = new Uint8Array(buffer);
view[0] = 42;

const moved = structuredClone(buffer, { transfer: [buffer] });

console.log(buffer.byteLength);  // 0 ; source detached
console.log(new Uint8Array(moved)[0]);  // 42 ; data preserved, no copy
```

### `Promise.withResolvers` for a request-response queue

```js
class RequestQueue {
  #pending = new Map();
  #seq = 0;

  request(payload) {
    const id = ++this.#seq;
    const { promise, resolve, reject } = Promise.withResolvers();
    this.#pending.set(id, { resolve, reject });
    this.transport.send({ id, payload });
    return promise;
  }

  onResponse({ id, result, error }) {
    const slot = this.#pending.get(id);
    if (!slot) return;
    this.#pending.delete(id);
    error ? slot.reject(error) : slot.resolve(result);
  }
}
```

### Iterator helpers on a generator

```js
function* range(start, end) {
  for (let i = start; i < end; i++) yield i;
}

const firstTenSquaresAbove50 = Iterator.from(range(1, Infinity))
  .map((n) => n * n)
  .filter((n) => n > 50)
  .take(10)
  .toArray();
// [64, 81, 100, 121, 144, 169, 196, 225, 256, 289]
// Iteration stops after producing 10 results ; infinite generator does not hang.
```

### Iterator helpers feature-detect + polyfill stub

```js
const hasIteratorHelpers =
  typeof Iterator !== "undefined" &&
  typeof Iterator.prototype.map === "function";

if (!hasIteratorHelpers) {
  await import("core-js/proposals/iterator-helpers");
}
```

### `scheduler.yield()` priority inheritance

```js
async function loadBackground() {
  await scheduler.postTask(async () => {
    for (let i = 0; i < 1_000_000; i++) {
      compute(i);
      if (i % 1000 === 0) {
        await scheduler.yield();
        // Resumes at "background" priority, inherited from the postTask call.
      }
    }
  }, { priority: "background" });
}
```

### `findLast` with a predicate

```js
const transactions = [
  { id: 1, type: "credit" },
  { id: 2, type: "debit" },
  { id: 3, type: "credit" },
];

const lastCredit = transactions.findLast((t) => t.type === "credit");
// { id: 3, type: "credit" }

const lastDebitIdx = transactions.findLastIndex((t) => t.type === "debit");
// 1
```

### RegExp `v` flag with emoji

```js
const text = "Hello \u{1F1F3}\u{1F1F1} world";  // Dutch flag (RGI emoji)

const emojiMatcher = /\p{RGI_Emoji}/v;
console.log(text.match(emojiMatcher)?.[0]);  // "🇳🇱"

const oldFlag = /\p{Emoji}/u;
console.log(text.match(oldFlag)?.[0]);       // "🇳" (lone half ; wrong)
```

### `String.toWellFormed` before `encodeURI`

```js
const userInput = "hello\uD800world";  // lone high surrogate
console.log(userInput.isWellFormed()); // false

try {
  encodeURI(userInput);                // URIError: URI malformed
} catch {}

const safe = userInput.toWellFormed(); // "hello�world"
console.log(encodeURI(safe));          // works
```

### Import Attributes : static and dynamic

```js
import settings from "./settings.json" with { type: "json" };

async function loadRoute(name) {
  const { default: routeConfig } = await import(`./routes/${name}.json`, {
    with: { type: "json" },
  });
  return routeConfig;
}
```

### TypeScript narrowing on a delegated form

```ts
const form = document.querySelector<HTMLFormElement>("form#signup");
if (!form) throw new Error("form#signup missing");

form.addEventListener("input", (e) => {
  if (!(e.target instanceof HTMLInputElement)) return;

  switch (e.target.name) {
    case "email":
      validateEmail(e.target.value);
      break;
    case "agree":
      toggleSubmit(e.target.checked);
      break;
  }
});
```

### TypeScript user-defined type guard

```ts
function isFormControl(el: EventTarget | null): el is
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  );
}

form.addEventListener("input", (e) => {
  if (!isFormControl(e.target)) return;
  console.log(e.target.name, e.target.value);  // typed
});
```
