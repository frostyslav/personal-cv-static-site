# Design Tokens — CSS Custom Properties Reference

All design tokens are defined as CSS custom properties on `:root` in `base.css`.
Dark theme values are defined as `--dark-*` variants and mapped automatically
via `[data-theme='dark']` and `@media (prefers-color-scheme: dark)`.

## Colors

| Token               | Light Value | Purpose                                        |
| ------------------- | ----------- | ---------------------------------------------- |
| `--primary-color`   | `#2563eb`   | Primary brand color (links, accents, borders)  |
| `--primary-hover`   | `#3b82f6`   | Hover state for primary elements               |
| `--primary-light`   | `#60a5fa`   | Lighter primary for subtle highlights          |
| `--secondary-color` | `#1e40af`   | Secondary brand color (skip-link bg, headings) |

## Text

| Token              | Light Value | Purpose                         |
| ------------------ | ----------- | ------------------------------- |
| `--text-primary`   | `#1f2937`   | Main body text                  |
| `--text-secondary` | `#4b5563`   | Muted/supporting text           |
| `--text-tertiary`  | `#374151`   | Tertiary text (dates, metadata) |

## Backgrounds

| Token            | Light Value | Purpose                 |
| ---------------- | ----------- | ----------------------- |
| `--bg-primary`   | `#ffffff`   | Main content background |
| `--bg-secondary` | `#f9fafb`   | Page/body background    |
| `--bg-hover`     | `#f3f4f6`   | Hover state backgrounds |

## Borders

| Token            | Light Value | Purpose               |
| ---------------- | ----------- | --------------------- |
| `--border-color` | `#e5e7eb`   | Default border color  |
| `--border-hover` | `#d1d5db`   | Border color on hover |

## Shadows

| Token                 | Light Value             | Purpose                              |
| --------------------- | ----------------------- | ------------------------------------ |
| `--shadow-color`      | `rgba(0,0,0,0.08)`      | General box shadows                  |
| `--shadow-primary`    | `rgba(37,99,235,0.3)`   | Primary-colored shadow (avatar glow) |
| `--shadow-primary-lg` | `rgba(37,99,235,0.4)`   | Larger primary shadow                |
| `--shadow-primary-sm` | `rgba(59,130,246,0.15)` | Subtle primary shadow                |

## Gradients

| Token                        | Light Value | Purpose                       |
| ---------------------------- | ----------- | ----------------------------- |
| `--gradient-primary-color`   | `#acd68b`   | Skill bar gradient start      |
| `--gradient-secondary-color` | `#6db56d`   | Skill bar gradient end        |
| `--language-gradient-start`  | `#8b5cf6`   | Language badge gradient start |
| `--language-gradient-end`    | `#6366f1`   | Language badge gradient end   |

## Layout

| Token             | Value           | Purpose                      |
| ----------------- | --------------- | ---------------------------- |
| `--sidebar-width` | `320px`         | Fixed sidebar width          |
| `--transition`    | `all 0.3s ease` | Default transition shorthand |

## Dark Theme Overrides

All dark values are defined as `--dark-*` properties on `:root` and mapped
to the active tokens when dark mode is active. This keeps color definitions
in one place.

| Token                       | Dark Value             |
| --------------------------- | ---------------------- |
| `--dark-primary-color`      | `#3b82f6`              |
| `--dark-primary-hover`      | `#60a5fa`              |
| `--dark-primary-light`      | `#93c5fd`              |
| `--dark-secondary-color`    | `#60a5fa`              |
| `--dark-text-primary`       | `#f3f4f6`              |
| `--dark-text-secondary`     | `#d1d5db`              |
| `--dark-text-tertiary`      | `#e5e7eb`              |
| `--dark-gradient-primary`   | `#86efac`              |
| `--dark-gradient-secondary` | `#4ade80`              |
| `--dark-bg-primary`         | `#1f2937`              |
| `--dark-bg-secondary`       | `#111827`              |
| `--dark-bg-hover`           | `#374151`              |
| `--dark-border-color`       | `#374151`              |
| `--dark-border-hover`       | `#4b5563`              |
| `--dark-shadow-color`       | `rgba(0,0,0,0.3)`      |
| `--dark-shadow-primary`     | `rgba(59,130,246,0.3)` |
| `--dark-shadow-primary-lg`  | `rgba(59,130,246,0.4)` |
| `--dark-shadow-primary-sm`  | `rgba(59,130,246,0.2)` |

## Usage Guidelines

- Always use tokens instead of raw color values in CSS.
- For new components, pick the closest semantic token (e.g., `--text-secondary`
  for muted text) rather than creating a new one.
- If a new token is needed, define both light and `--dark-*` variants on `:root`.
- The `--transition` shorthand is intentionally broad; override with specific
  properties when only one axis should animate (e.g., `transition: opacity 0.3s ease`).
