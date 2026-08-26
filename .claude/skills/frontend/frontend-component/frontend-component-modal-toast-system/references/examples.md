# References : Examples

Renderable HTML demo plus standalone snippets for `frontend-component-modal-toast-system`. The canonical example is a single-file HTML page that demonstrates a confirm modal with `<dialog>` + return value, an animated open / close via `@starting-style`, a toast queue using `popover="manual"` + an `aria-live` region, and focus restoration. Save the fragment below as `index.html` and open in any evergreen-2026 browser.

## Renderable HTML fragment (save as `index.html`)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Modal + Toast demo</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: light-dark(oklch(0.99 0 0), oklch(0.18 0 0));
      --fg: light-dark(oklch(0.18 0 0), oklch(0.96 0 0));
      --muted: light-dark(oklch(0.45 0 0), oklch(0.75 0 0));
      --accent: light-dark(oklch(0.50 0.18 250), oklch(0.80 0.14 250));
      --accent-text: light-dark(white, black);
      --surface: light-dark(oklch(0.97 0 0), oklch(0.22 0 0));
      --border: light-dark(oklch(0.85 0 0), oklch(0.42 0 0));
      --danger: light-dark(oklch(0.55 0.20 25), oklch(0.75 0.18 25));
    }

    * { box-sizing: border-box; }
    body { margin: 0; padding: 2rem; font: 16px/1.5 system-ui, sans-serif; color: var(--fg); background: var(--bg); }
    main { max-width: 48rem; margin: auto; }
    h1, h2 { margin-block: 1.5rem 0.5rem; }
    p { color: var(--muted); }

    button {
      min-height: 44px;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface);
      color: var(--fg);
      font: inherit;
      cursor: pointer;
    }

    button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    button.primary { background: var(--accent); color: var(--accent-text); border-color: transparent; }
    button.danger  { background: var(--danger); color: white; border-color: transparent; }

    /* Dialog animated entry / exit ----------------------------- */

    dialog {
      max-width: 28rem;
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--bg);
      color: var(--fg);
      opacity: 1;
      transform: translateY(0);
      transition: opacity 200ms, transform 200ms, overlay 200ms allow-discrete, display 200ms allow-discrete;
    }

    dialog:not([open]) {
      opacity: 0;
      transform: translateY(8px);
    }

    @starting-style {
      dialog[open] {
        opacity: 0;
        transform: translateY(8px);
      }
    }

    dialog::backdrop {
      background: oklch(0.10 0 0 / 0);
      transition: background 200ms, display 200ms allow-discrete, overlay 200ms allow-discrete;
    }

    dialog[open]::backdrop {
      background: oklch(0.10 0 0 / 0.5);
      backdrop-filter: blur(2px);
    }

    @starting-style {
      dialog[open]::backdrop {
        background: oklch(0.10 0 0 / 0);
      }
    }

    dialog form { display: flex; gap: 0.5rem; justify-content: end; margin-top: 1.5rem; }

    @media (prefers-reduced-motion: reduce) {
      dialog, dialog::backdrop { transition: opacity 100ms; }
      dialog:not([open]) { transform: none; }
      @starting-style { dialog[open] { transform: none; } }
    }

    /* Toast queue --------------------------------------------- */

    .toast-stack {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      display: flex;
      flex-direction: column-reverse;
      gap: 0.5rem;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--surface);
      color: var(--fg);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 8px 24px oklch(0 0 0 / 0.15);
      max-width: 24rem;
      margin: 0;
      transition: opacity 200ms, transform 200ms, overlay 200ms allow-discrete, display 200ms allow-discrete;
    }

    .toast:not(:popover-open) {
      opacity: 0;
      transform: translateY(8px);
    }

    @starting-style {
      .toast:popover-open {
        opacity: 0;
        transform: translateY(8px);
      }
    }

    .toast.error { border-color: var(--danger); }

    .toast .text { flex: 1; }
    .toast .text strong { display: block; }
    .toast .text small { color: var(--muted); }

    .toast .close {
      min-height: 32px;
      padding: 0 0.5rem;
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      color: var(--fg);
    }

    .toast .close:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  </style>
</head>
<body>
  <main>
    <h1>Modal + Toast demo</h1>

    <h2>Modal (confirm pattern)</h2>
    <p>Click the trigger. The modal traps focus, Escape closes it, and focus returns to the trigger.</p>
    <p>
      <button class="danger" id="open-confirm">Delete account...</button>
    </p>

    <h2>Toasts</h2>
    <p>Each button enqueues a different toast. Hover or focus the toast to pause its auto-dismiss timer.</p>
    <p>
      <button id="toast-success">Show success</button>
      <button id="toast-info">Show info</button>
      <button id="toast-error" class="danger">Show error</button>
    </p>
  </main>

  <dialog id="confirm" aria-labelledby="confirm-title" aria-describedby="confirm-body">
    <h2 id="confirm-title">Delete account ?</h2>
    <p id="confirm-body">This permanently removes all your data. This action cannot be undone.</p>
    <form method="dialog">
      <button value="cancel">Cancel</button>
      <button value="confirm" class="danger" autofocus>Delete</button>
    </form>
  </dialog>

  <!-- Live regions PRE-EXIST in the DOM so screen readers can register them. -->
  <div id="toast-stack-polite" class="toast-stack" aria-live="polite" aria-atomic="false"></div>
  <div id="toast-stack-assertive" class="toast-stack" aria-live="assertive" aria-atomic="false" style="bottom: auto; top: 1rem;"></div>

  <script>
    // ----- Confirm modal --------------------------------------

    const confirm = document.querySelector("#confirm");
    const openConfirm = document.querySelector("#open-confirm");
    let opener = null;

    openConfirm.addEventListener("click", () => {
      opener = openConfirm;
      confirm.showModal();
    });

    confirm.addEventListener("close", () => {
      if (confirm.returnValue === "confirm") {
        showToast({ kind: "error", title: "Account deleted", body: "Wiped." });
      }
      opener?.focus();
      opener = null;
    });

    // ----- Toast queue ---------------------------------------

    const MAX_VISIBLE = 4;

    function showToast({ kind = "info", title, body, durationMs = 5000, action }) {
      const urgent = kind === "error";
      const stack = document.querySelector(urgent ? "#toast-stack-assertive" : "#toast-stack-polite");

      while (stack.children.length >= MAX_VISIBLE) {
        stack.firstElementChild?.remove();
      }

      const toast = document.createElement("section");
      toast.className = `toast ${kind}`;
      toast.setAttribute("popover", "manual");
      toast.setAttribute("role", urgent ? "alert" : "status");

      const text = document.createElement("div");
      text.className = "text";
      const strong = document.createElement("strong");
      strong.textContent = title;
      text.append(strong);
      if (body) {
        const small = document.createElement("small");
        small.textContent = body;
        text.append(document.createElement("br"), small);
      }
      toast.append(text);

      if (action) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = action.label;
        btn.addEventListener("click", () => { action.run(); toast.hidePopover(); });
        toast.append(btn);
      }

      const close = document.createElement("button");
      close.type = "button";
      close.className = "close";
      close.setAttribute("aria-label", "Dismiss notification");
      close.textContent = "✕";
      close.addEventListener("click", () => toast.hidePopover());
      toast.append(close);

      stack.append(toast);
      toast.showPopover();

      let timer = setTimeout(() => toast.hidePopover(), durationMs);
      const clear = () => clearTimeout(timer);
      const restart = () => { timer = setTimeout(() => toast.hidePopover(), durationMs); };

      toast.addEventListener("pointerenter", clear);
      toast.addEventListener("focusin", clear);
      toast.addEventListener("pointerleave", restart);
      toast.addEventListener("focusout", restart);

      toast.addEventListener("toggle", (e) => {
        if (e.newState === "closed") toast.remove();
      });
    }

    document.querySelector("#toast-success").addEventListener("click", () => {
      showToast({ kind: "success", title: "Saved", body: "All changes were written." });
    });
    document.querySelector("#toast-info").addEventListener("click", () => {
      showToast({ kind: "info", title: "Inbox updated", body: "3 new messages." });
    });
    document.querySelector("#toast-error").addEventListener("click", () => {
      showToast({
        kind: "error",
        title: "Connection lost",
        body: "Retrying...",
        durationMs: 8000,
        action: { label: "Retry now", run: () => console.log("retry") },
      });
    });
  </script>
</body>
</html>
```

Self-contained : no external assets, no framework. Try :

- Click "Delete account..." -> Tab cycles inside the modal, Escape closes, focus returns to the trigger.
- Click the toast buttons -> each toast appears bottom-right (or top-right for errors), pauses on hover, auto-dismisses, supports the close button.
- Reduce motion at the OS level -> animations collapse to a fast opacity-only fade.

## Standalone examples

### Confirm modal (minimal)

```html
<button data-open="confirm">Delete</button>

<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Are you sure ?</h2>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="confirm" autofocus>Yes, delete</button>
  </form>
</dialog>

<script>
  const d = document.querySelector("#confirm");
  let trigger = null;
  document.querySelector("[data-open='confirm']").addEventListener("click", (e) => {
    trigger = e.currentTarget;
    d.showModal();
  });
  d.addEventListener("close", () => {
    if (d.returnValue === "confirm") doDelete();
    trigger?.focus();
    trigger = null;
  });
</script>
```

### Async wrapper that returns a Promise

```js
function confirmAction({ title, body }) {
  const dialog = document.querySelector("#confirm");
  dialog.querySelector("#confirm-title").textContent = title;
  dialog.querySelector("#confirm-body").textContent = body;
  dialog.showModal();

  return new Promise((resolve) => {
    dialog.addEventListener(
      "close",
      () => resolve(dialog.returnValue === "confirm"),
      { once: true },
    );
  });
}

if (await confirmAction({ title: "Sign out ?", body: "You will lose unsaved work." })) {
  await signOut();
}
```

`Promise.withResolvers()` (ES2024) is the modern shape if you prefer to resolve from outside the executor.

### Light-dismiss settings panel

```html
<dialog id="settings" closedby="any" aria-labelledby="settings-title">
  <h2 id="settings-title">Settings</h2>
  <form>
    <label><input type="checkbox" name="dark"> Dark mode</label>
  </form>
  <form method="dialog">
    <button value="close" autofocus>Done</button>
  </form>
</dialog>
```

`closedby="any"` allows backdrop click AND Escape. The settings dialog feels like a sheet that dismisses naturally.

### Polite live region only

```html
<div id="status" aria-live="polite" aria-atomic="true"></div>

<script>
  document.querySelector("#status").textContent = "Saved.";
</script>
```

The simplest possible toast : update the text of a pre-existing live region. No popover, no queue.

### Toast with action button

```js
showToast({
  kind: "info",
  title: "Item moved to trash",
  durationMs: 7000,
  action: { label: "Undo", run: () => restoreItem() },
});
```

Action toasts use a longer duration so the user has time to read AND click.

### Custom event from a deeply-nested component

```html
<div id="root" aria-live="polite"></div>

<button id="trigger">Submit</button>

<script>
  document.addEventListener("app:notify", (e) => {
    const region = document.querySelector("#root");
    region.textContent = e.detail.message;
  });

  document.querySelector("#trigger").addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("app:notify", {
      detail: { message: "Form submitted." }
    }));
  });
</script>
```

The live region lives at the root ; any component dispatches a `CustomEvent` that the central handler funnels into the region. Decouples message origin from announcement.
