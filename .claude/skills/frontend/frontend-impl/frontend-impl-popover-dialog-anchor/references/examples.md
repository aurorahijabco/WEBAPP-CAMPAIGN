# References : Popover, Dialog, Anchor Examples

All snippets verified against the sources cited in `methods.md` on 2026-05-19. The renderable demo below combines all three primitives : an anchored popover (dropdown menu), an animated modal dialog with backdrop fade, and an animated popover using the combined `@starting-style` + `allow-discrete` recipe. Gracefully degrades on browsers without anchor positioning.

## 1. Renderable Self-Contained Demo

Save the following as `demo.html` and open in any evergreen-2026 browser. Toggle "Reduce motion" in DevTools (Rendering tab > Emulate CSS media `prefers-reduced-motion: reduce`) to verify the reduced-motion variants.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <title>Popover / Dialog / Anchor Demo</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg:      light-dark(#f6f7f9, #0b0d12);
      --surface: light-dark(#ffffff, #14171f);
      --fg:      light-dark(#0a0a0a, #f5f5f5);
      --muted:   light-dark(#52525b, #a1a1aa);
      --border:  light-dark(#e2e8f0, #1f2937);
      --accent:  light-dark(#2563eb, #60a5fa);
      --accent-fg: light-dark(#ffffff, #0b0d12);
    }

    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding-block: 2rem;
      padding-inline: 1.5rem;
      font-family: system-ui, sans-serif;
      background: var(--bg);
      color: var(--fg);
      min-block-size: 100vh;
    }

    h1 { font-size: 1.5rem; margin-block: 0 1.5rem; }
    h2 { font-size: 1.125rem; margin-block: 2rem 0.75rem; }

    .btn {
      background: var(--accent);
      color: var(--accent-fg);
      border: 0;
      border-radius: 6px;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      cursor: pointer;
      font: inherit;
    }

    .btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    /* --- (1) Anchored popover (dropdown menu) --- */

    #menu {
      margin: 0;
      padding: 0.25rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      inset: unset;                  /* clear UA popover defaults */
      box-shadow: 0 6px 18px rgb(0 0 0 / 0.08);
      min-inline-size: 12rem;
    }

    #menu a, #menu button {
      display: block;
      padding: 0.5rem 0.75rem;
      color: var(--fg);
      text-decoration: none;
      background: transparent;
      border: 0;
      inline-size: 100%;
      text-align: start;
      cursor: pointer;
      font: inherit;
      border-radius: 4px;
    }
    #menu a:hover, #menu button:hover { background: color-mix(in oklch, var(--accent), transparent 90%); }

    /* Anchor positioning with @supports gate */
    @supports (anchor-name: --x) {
      #menu-btn { anchor-name: --menu-anchor; }
      #menu {
        position-anchor: --menu-anchor;
        position-area: bottom span-inline-end;
        position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
        margin-block-start: 0.25rem;
      }
    }

    /* --- (2) Animated popover with full recipe --- */

    #tip {
      padding: 0.5rem 0.75rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      inset: unset;
      max-inline-size: 16rem;

      /* Combined recipe : closed state + transitions */
      opacity: 0;
      transform: translateY(4px);
      transition:
        opacity   0.2s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
        display   0.2s allow-discrete,
        overlay   0.2s allow-discrete;
    }

    @supports (anchor-name: --x) {
      #tip-btn { anchor-name: --tip-anchor; }
      #tip {
        position-anchor: --tip-anchor;
        position-area: top center;
        position-try-fallbacks: flip-block;
        margin-block-end: 0.5rem;
      }
    }

    /* Open state */
    #tip:popover-open {
      opacity: 1;
      transform: translateY(0);
    }

    /* MUST be AFTER :popover-open. Entry-animation start values. */
    @starting-style {
      #tip:popover-open {
        opacity: 0;
        transform: translateY(4px);
      }
    }

    /* --- (3) Animated modal dialog with backdrop --- */

    dialog {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      max-inline-size: 28rem;
      background: var(--surface);
      color: var(--fg);

      opacity: 0;
      transform: translateY(8px) scale(0.98);
      transition:
        opacity   0.25s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
        display   0.25s allow-discrete,
        overlay   0.25s allow-discrete;
    }

    dialog[open] {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    @starting-style {
      dialog[open] {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
      }
    }

    dialog::backdrop {
      background: rgb(0 0 0 / 0%);
      backdrop-filter: blur(0);
      transition:
        background-color 0.25s,
        backdrop-filter  0.25s,
        display          0.25s allow-discrete,
        overlay          0.25s allow-discrete;
    }

    dialog[open]::backdrop {
      background: rgb(0 0 0 / 0.4);
      backdrop-filter: blur(2px);
    }

    @starting-style {
      dialog[open]::backdrop {
        background: rgb(0 0 0 / 0%);
        backdrop-filter: blur(0);
      }
    }

    .dialog-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-block-start: 1rem;
    }

    /* Reduced-motion collapse */
    @media (prefers-reduced-motion: reduce) {
      #tip, dialog, dialog::backdrop {
        transition-duration: 0.1s;
        transition-timing-function: linear;
        transform: none !important;
      }
      @starting-style {
        #tip:popover-open      { opacity: 0; transform: none; }
        dialog[open]           { opacity: 0; transform: none; }
        dialog[open]::backdrop { background: rgb(0 0 0 / 0%); backdrop-filter: blur(0); }
      }
    }
  </style>
</head>

<body>
  <h1>Popover / Dialog / Anchor Demo</h1>

  <h2>(1) Anchored dropdown popover (implicit anchor + position-try-fallbacks)</h2>
  <p>
    <button id="menu-btn" class="btn" popovertarget="menu" popovertargetaction="toggle">Open menu</button>
  </p>
  <div id="menu" popover="auto" role="menu">
    <a role="menuitem" href="#">Profile</a>
    <a role="menuitem" href="#">Settings</a>
    <button role="menuitem" type="button" popovertarget="menu" popovertargetaction="hide">Close</button>
  </div>

  <h2>(2) Animated tooltip popover (full @starting-style + allow-discrete recipe)</h2>
  <p>
    <button id="tip-btn" class="btn" popovertarget="tip" popovertargetaction="toggle">Show tooltip</button>
  </p>
  <div id="tip" popover="auto">
    Sample tooltip text. Fades and slides up on open, fades and slides down on close.
  </div>

  <h2>(3) Modal dialog with focus restoration + backdrop animation</h2>
  <p>
    <button id="open-dlg" class="btn">Open dialog</button>
  </p>

  <dialog id="dlg" closedby="closerequest" aria-labelledby="dlg-title">
    <form method="dialog">
      <h2 id="dlg-title">Confirm action</h2>
      <p>This is an animated modal. Esc closes, backdrop fades, focus restores on close.</p>
      <div class="dialog-actions">
        <button value="cancel" autofocus>Cancel</button>
        <button value="confirm" class="btn">Confirm</button>
      </div>
    </form>
  </dialog>

  <script>
    const dlg = document.getElementById('dlg');
    const opener = document.getElementById('open-dlg');
    let trigger = null;

    opener.addEventListener('click', () => {
      trigger = document.activeElement;
      dlg.showModal();
    });

    dlg.addEventListener('close', () => {
      trigger?.focus();
      trigger = null;
      if (dlg.returnValue === 'confirm') {
        console.log('User confirmed');
      }
    });
  </script>
</body>
</html>
```

### What this demo proves

1. The dropdown menu uses `popover="auto"` with `popovertarget` for the implicit anchor relationship. Anchor positioning with `position-area` + `position-try-fallbacks` falls back gracefully on non-supporting browsers (via `@supports` gate).
2. The tooltip popover uses the full combined recipe : `@starting-style` declared AFTER `:popover-open`, transition shorthand includes both `display ... allow-discrete` and `overlay ... allow-discrete`.
3. The modal dialog animates entry AND exit, including the `::backdrop` fade and blur. Focus is captured before `showModal()` and restored on the `close` event (manual, because `<dialog>` does NOT auto-restore unlike Popover API).
4. `closedby="closerequest"` is shown explicitly (it is the default for `showModal()`, but documenting it prevents future confusion).
5. Reduced-motion variants collapse all `transform` motion to `none` and shorten durations to 100 ms linear. Information is preserved; motion is removed.

## 2. JS Fallback for Anchor Positioning (Older Browsers)

```js
function position(target, anchor, area = 'bottom-end') {
  const r = anchor.getBoundingClientRect();
  const t = target.getBoundingClientRect();

  let top, left;
  switch (area) {
    case 'bottom-end':   top = r.bottom + 4;          left = r.right - t.width;  break;
    case 'bottom-start': top = r.bottom + 4;          left = r.left;             break;
    case 'top-center':   top = r.top - t.height - 4;  left = r.left + (r.width - t.width) / 2; break;
  }
  // Viewport-aware flip (poor man's position-try-fallbacks)
  if (top + t.height > window.innerHeight) top = r.top - t.height - 4;
  if (left + t.width > window.innerWidth)  left = window.innerWidth - t.width - 8;
  if (left < 8) left = 8;

  target.style.top  = top  + window.scrollY + 'px';
  target.style.left = left + window.scrollX + 'px';
}

if (!CSS.supports('anchor-name: --x')) {
  const trigger = document.getElementById('menu-btn');
  const menu    = document.getElementById('menu');

  menu.addEventListener('beforetoggle', (e) => {
    if (e.newState === 'open') {
      menu.style.position = 'absolute';
      position(menu, trigger, 'bottom-end');
    }
  });
  // Reposition on scroll/resize while open
  function reposition() { if (menu.matches(':popover-open')) position(menu, trigger, 'bottom-end'); }
  window.addEventListener('scroll', reposition, { passive: true });
  window.addEventListener('resize', reposition);
}
```

This is a minimal fallback; for production, prefer Floating UI when full anchor positioning is unavailable.

## 3. Pattern : `closedby="any"` Light-Dismiss Modal

```html
<dialog id="prefs" closedby="any" aria-labelledby="prefs-title">
  <h2 id="prefs-title">Preferences</h2>
  <form method="dialog">
    <label><input type="checkbox" name="notif"> Enable notifications</label>
    <div class="dialog-actions">
      <button value="ok" autofocus class="btn">Done</button>
    </div>
  </form>
</dialog>
```

```js
prefs.addEventListener('close', () => {
  trigger?.focus();
  // closedby="any" : close event fires for outside-click, Esc, and button submit
});
```

`closedby="any"` keeps Escape working (default for showModal) AND adds outside-click dismissal. Useful for non-destructive modals where users may click away. NEVER use on confirmation dialogs that need an explicit choice.

## 4. Pattern : `popover="manual"` for Persistent Panel

```html
<button popovertarget="palette" popovertargetaction="show">Open command palette</button>
<button popovertarget="palette" popovertargetaction="hide">Close palette</button>

<div id="palette" popover="manual">
  <input type="search" placeholder="Type a command" autofocus>
  <ul role="listbox">...</ul>
</div>
```

`popover="manual"` does NOT light-dismiss and does NOT close on Esc. The author MUST provide an explicit close path (button, keyboard handler). Use for surfaces that must stay open during typing or multi-step editing.
