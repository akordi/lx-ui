# LxNotification

[← Back to Design Tokens](../DesignTokens.md)

## Layout

| Variable name                               | Default value                                                               |
|---------------------------------------------|-----------------------------------------------------------------------------|
| `--notification-item-gap`                   | `--space-0500`                                                              |
| `--notification-grid-areas`                 | 'icon content button'                                                       |
| `--notification-grid-template-columns`      | 'auto 1fr auto'                                                             |
| `--notification-grid-template-rows`         | 1fr                                                                         |
| `--notification-gap`                        | `--space-0500`                                                              |
| `--notification-padding`                    | `--space-0500`                                                              |
| `--notification-border-width`               | `--border-width-0` `--border-width-0` `--border-width-0` `--border-width-4` |
| `--notification-border-style`               | solid                                                                       |
| `--notification-border-radius`              | `--border-radius-0`                                                         |
| `--notification-row-gap`                    | `--space-0250`                                                              |
| `--notification-content-padding`            | `--space-0125` `--space-0` `--space-0` `--space-0`                          |
| `--notification-text-primary-font-size`     | `--font-size`                                                               |
| `--notification-text-primary-font-weight`   | `--font-weight-bold`                                                        |
| `--notification-text-primary-line-height`   | 1.25                                                                        |
| `--notification-text-secondary-font-size`   | `--font-size-small`                                                         |
| `--notification-text-secondary-font-weight` | `--font-weight`                                                             |
| `--notification-text-secondary-line-height` | 1.25                                                                        |
| `--notification-icon-size`                  | `--icon-size-m`                                                             |
| `--notification-icon-close-size`            | `--icon-size-xs`                                                            |

## Color

| Variable name                         | Default value    |
|---------------------------------------|------------------|
| `--color-notification-background`     | `--color-region` |
| `--color-notification-border`         | `--color-chrome` |
| `--color-notification-text-primary`   | `--color-data`   |
| `--color-notification-text-secondary` | `--color-data`   |
| `--color-notification-icon`           | `--color-data`   |
| `--color-notification-icon-close`     | `--color-data`   |

<br/>
Customized values per `variant`:
<br/>
<br/>

| Variant   | `--color-notification-border`             | `--color-notification-background`         | `--color-notification-icon`               | `--color-notification-text-primary`       |
|-----------|-------------------------------------------|-------------------------------------------|-------------------------------------------|-------------------------------------------|
| `warning` | `--color-notification-warning-foreground` | `--color-notification-warning-background` | `--color-notification-warning-foreground` | `--color-data`                            |
| `error`   | `--color-notification-error-foreground`   | `--color-notification-error-background`   | `--color-notification-error-foreground`   | `--color-notification-error-foreground`   |
| `success` | `--color-notification-success-foreground` | `--color-notification-success-background` | `--color-notification-success-foreground` | `--color-notification-success-foreground` |
