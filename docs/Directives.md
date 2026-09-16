# Directives Guide

LX/UI custom Vue directives — behaviour that does not warrant wrapping an element in a component.

They are registered globally by [`createLx`](./CreateLx.md) and are also exported for local
registration.

## `v-tooltip`

Shows a tooltip when the pointer hovers the element. Looks and behaves like
[`LxTooltip`](./tokens/TooltipTokens.md) — same markup, same design tokens, same timings — but it
does not wrap the trigger, so it can be added to an existing element without changing its HTML
structure.

Used by `LxButton`: the `title` prop renders an LX tooltip instead of the browser's native one.

### Usage

`createLx` registers it globally, so no import is needed:

```html
<button v-tooltip="'Saglabāt izmaiņas'">Saglabāt</button>

<!-- Object form, to switch the tooltip off without unbinding the directive -->
<button v-tooltip="{ value: 'Saglabāt izmaiņas', disabled: isEditing }">Saglabāt</button>
```

Without the plugin, import and register it locally:

```js
import { vTooltip } from '@dativa-lv/lx-ui';
```

In `<script setup>` the import alone makes `v-tooltip` available in the template. The same export
lets you register it under a different name if something else in the app already claims
`v-tooltip`:

```js
app.directive('lxTooltip', vTooltip);
```

### Value

| Form                              | Behaviour                                             |
| --------------------------------- | ----------------------------------------------------- |
| `String` / `Number`               | Tooltip text.                                         |
| `{ value, disabled }`             | `value` is the text; `disabled: true` makes it inert. |
| `null`, `''`, whitespace, omitted | Inert — nothing is registered and nothing is shown.   |

Changing the value while the tooltip is visible swaps the text in place and re-clamps the panel.
Clearing it closes the tooltip immediately.

### Behaviour

| Aspect        | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Opens after   | 300 ms of pointer dwell; every pointer move restarts the countdown           |
| Position      | Fixed, 18 px below the pointer position at the moment it opened, clamped to the viewport. It does not follow the pointer |
| Closes on     | Pointer moving more than 20 px from where it opened; pointer entering the panel; leaving the trigger (after 100 ms); scroll; resize; tab hide; context menu; `Escape`; trigger blur |
| Touch devices | Suppressed entirely (`(hover: none)`)                                        |
| Keyboard      | No focus trigger, matching `LxTooltip`                                       |
| Concurrency   | One panel node is shared by every trigger, so only one tooltip is ever visible |

Two deliberate deviations from `LxTooltip`: `Escape` dismisses the tooltip (WCAG 1.4.13 — hover
content must be dismissible without moving the pointer), and leaving the browser window
(`relatedTarget === null`) closes it, where the component leaves its tooltip open indefinitely.

### Requirements and limitations

- The panel is appended to the shell's `#poppers` container, falling back to the nearest
  `.lx-layout` ancestor and then to `document.body`. In the last case it gets an inline `z-index`,
  because the layered rules are scoped to `.lx .lx-layout .popper`.
- Never set both `v-tooltip` and a `title` attribute on the same element — the browser would draw
  its own tooltip on top. The directive logs a warning in dev environments when it finds both.
- Elements nested inside an `LxTooltip` trigger are skipped, so the two never fire together.
- Elements with a real `disabled` attribute are supported, but through a document-level pointer hit
  test, since browsers do not dispatch mouse events to disabled controls. That listener is installed
  only while at least one disabled trigger is registered.
- `closeTooltip()` dismisses the visible tooltip, e.g. before opening a modal:

  ```js
  import { closeTooltip } from '@dativa-lv/lx-ui';
  ```

### Testing hook

Active triggers carry the tooltip text in a `data-lx-tooltip` attribute. It is the hit-test
selector, and doubles as a stable hook for tests and QA automation:

```js
wrapper.get('.lx-button[data-lx-tooltip="Notīrīt"]');
```

### Styling

The directive renders the same markup as `LxTooltip`, so it is styled by the same
[`--tooltip-*` design tokens](./tokens/TooltipTokens.md) in `lx-info-wrappers.css`.

## Adding a directive

Put it in `src/directives/<name>.js`, export it as `vName` so `<script setup>` resolves
`v-name` from the import, give it a `getSSRProps` no-op if it touches the DOM, re-export it from
`src/directives/index.js`, register it in `install()` in `src/lib.js`, and document it here.
