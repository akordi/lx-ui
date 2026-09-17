# LxStateDisplay

[← Back to Design Tokens](../DesignTokens.md)

LxStateDisplay is built the same way as [LxBadge](BadgeTokens.md) — same grid, same icon slot, same
pill shape — so every layout token defaults to its LxBadge counterpart. Overriding a `--badge-*`
token therefore keeps both components in sync; override a `--state-display-*` token only when
LxStateDisplay should deliberately differ.

## Layout

| Variable name                          | Default value                       |
|----------------------------------------|-------------------------------------|
| `--state-display-border-width`         | `--badge-border-width-s`            |
| `--state-display-border`               | `--badge-border-s`                  |
| `--state-display-border-radius`        | `--badge-border-radius-s`           |
| `--state-display-padding`              | `--badge-padding-s`                 |
| `--state-display-padding-icon-only`    | `--badge-padding-icon-only-s`       |
| `--state-display-width`                | `--badge-width-s`                   |
| `--state-display-height`               | `--badge-height-s`                  |
| `--state-display-min-width`            | `--badge-min-width-s`               |
| `--state-display-min-height`           | `--badge-min-height-s`              |
| `--state-display-gap`                  | `--badge-gap-s`                     |
| `--state-display-icon-size`            | `--badge-icon-size-s`               |
| `--state-display-grid-areas`           | `--badge-grid-areas`                |
| `--state-display-grid-template-columns`| `--badge-grid-template-columns`     |
| `--state-display-text-font-size`       | `--badge-text-font-size`            |
| `--state-display-text-font-weight`     | `--badge-text-font-weight`          |
| `--state-display-text-line-height`     | `--badge-text-line-height`          |

A state without a `displayName` renders as a round, icon-only pill (the same shape as an icon-only
LxBadge) and uses `--state-display-padding-icon-only` instead of `--state-display-padding`.

## Color

Every state resolves its own foreground and background from the base palette. Foregrounds colour
both the label and the status icon; backgrounds use the `-light` variant of the same base color.

Three states deliberately split the two: `disabling` / `disabled` keep the lighter `--color-disabled`
icon but use `--color-grey` for the label, and `yellow` / `black` keep their coloured icon while the
label falls back to `--color-data`. In each case the icon carries the hue and only the label is
adjusted for legibility.

| Variable name                           | Default value                 |
|-----------------------------------------|-------------------------------|
| `--color-state-default-foreground`      | `--color-data`                |
| `--color-state-draft-foreground`        | `--color-draft`               |
| `--color-state-new-foreground`          | `--color-new`                 |
| `--color-state-edited-foreground`       | `--color-edited`              |
| `--color-state-error-foreground`        | `--color-error`               |
| `--color-state-disabled-foreground`     | `--color-disabled`            |
| `--color-state-inactive-foreground`     | `--color-inactive`            |
| `--color-state-incomplete-foreground`   | `--color-incomplete`          |
| `--color-state-finished-foreground`     | `--color-finished`            |
| `--color-state-deleted-foreground`      | `--color-deleted`             |
| `--color-state-ongoing-foreground`      | `--color-ongoing`             |
| `--color-state-signed-foreground`       | `--color-signed`              |
| `--color-state-waiting-foreground`      | `--color-waiting`             |
| `--color-state-black-foreground`        | `--color-data`                |
| `--color-state-red-foreground`          | `--color-red`                 |
| `--color-state-green-foreground`        | `--color-green`               |
| `--color-state-blue-foreground`         | `--color-blue`                |
| `--color-state-purple-foreground`       | `--color-purple`              |
| `--color-state-orange-foreground`       | `--color-orange`              |
| `--color-state-yellow-foreground`       | `--color-yellow`              |
| `--color-state-teal-foreground`         | `--color-teal`                |
| `--color-state-default-background`      | `--color-grey-light`          |
| `--color-state-draft-background`        | `--color-blue-light`          |
| `--color-state-new-background`          | `--color-blue-light`          |
| `--color-state-edited-background`       | `--color-orange-light`        |
| `--color-state-error-background`        | `--color-red-light`           |
| `--color-state-disabled-background`     | `--color-grey-light`          |
| `--color-state-inactive-background`     | `--color-grey-light`          |
| `--color-state-incomplete-background`   | `--color-blue-light`          |
| `--color-state-finished-background`     | `--color-green-light`         |
| `--color-state-deleted-background`      | `--color-grey-light`          |
| `--color-state-ongoing-background`      | `--color-orange-light`        |
| `--color-state-signed-background`       | `--color-purple-light`        |
| `--color-state-waiting-background`      | `--color-grey-light`          |
| `--color-state-black-background`        | `--color-grey-light`          |
| `--color-state-red-background`          | `--color-red-light`           |
| `--color-state-green-background`        | `--color-green-light`         |
| `--color-state-blue-background`         | `--color-blue-light`          |
| `--color-state-purple-background`       | `--color-purple-light`        |
| `--color-state-orange-background`       | `--color-orange-light`        |
| `--color-state-yellow-background`       | `--color-yellow-light`        |
| `--color-state-teal-background`         | `--color-teal-light`          |

### Overriding every state at once

These three tokens are unset by default and win over the per-state values above. Use them when a
product theme needs one look for all statuses — for example a status background that is always
white — instead of redefining the base semantic colors.

| Variable name                      | Default value                         |
|------------------------------------|---------------------------------------|
| `--color-state-display-background` | unset (falls back to the state color) |
| `--color-state-display-text`       | unset (falls back to the state color) |
| `--color-state-display-icon`       | unset (falls back to the state color) |

```css
.lx-layout-digives {
  --color-state-display-background: var(--color-region);
}
```
