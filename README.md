# Personal CV — Static Site

A data-driven, offline-capable CV/resume website built with Handlebars templates, YAML content files, and a zero-framework Node.js build pipeline.

Live: https://cv.rostyslav.eu

## Architecture

```
data/*.yaml          → Content (experience, skills, certifications, etc.)
templates/**/*.hbs   → Handlebars templates and partials
css/*.css            → Modular stylesheets (bundled by Lightning CSS)
scripts/*.js         → Browser modules (bundled by esbuild)
dist/                → Build output (fingerprinted, minified, ready to deploy)
```

The build compiles YAML data into HTML via Handlebars, bundles and minifies CSS/JS, copies static assets, then fingerprints everything with content hashes for long-term caching.

## Prerequisites

- Node.js 25.x (see `.nvmrc`)
- npm

```sh
nvm use        # or asdf install
npm install
```

## Scripts

| Command             | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run build`     | Full production build (parallel: HTML + CSS + JS + assets, then fingerprint) |
| `npm run dev`       | Build once, then serve at http://localhost:3000                              |
| `npm run dev:watch` | Build, serve, and rebuild on file changes                                    |
| `npm run lint`      | ESLint + Stylelint                                                           |
| `npm test`          | Smoke tests (builds first, validates output)                                 |
| `npm run test:unit` | Unit tests (fuzzy-match, safeUrl, data validation)                           |
| `npm run test:e2e`  | E2E tests with Puppeteer (dark mode, navigation, accessibility)              |
| `npm run test:all`  | All test suites                                                              |
| `npm run validate`  | HTML validation via html-validate                                            |

## Editing Content

All content lives in `data/` as YAML files:

| File                       | Content                                         |
| -------------------------- | ----------------------------------------------- |
| `data/sidebar.yaml`        | Profile info, photo, navigation, social links   |
| `data/about.yaml`          | About paragraphs and core qualifications        |
| `data/experience.yaml`     | Work history (grouped by company or standalone) |
| `data/education.yaml`      | Education entries                               |
| `data/skills.yaml`         | Skill categories and tags                       |
| `data/certifications.yaml` | Professional certifications                     |
| `data/site.yaml`           | Base URL and PDF path                           |

After editing, run `npm run build` to regenerate `dist/`.

## Build Pipeline

The build runs in two phases:

1. **Parallel phase** — HTML compilation, CSS bundling (Lightning CSS), JS bundling (esbuild), and static asset copy all run concurrently.
2. **Sequential phase** — Asset fingerprinting renames bundles with content hashes, rewrites references in `index.html`, and generates `sw.js` from the service worker template.

The `prebuild` hook cleans `dist/` before each build.

## Project Structure

```
scripts/
  build-html.js       — Loads YAML, validates, compiles Handlebars → dist/index.html
  build-parallel.js   — Orchestrates parallel build steps
  fingerprint.js      — Content-hash renaming + service worker generation
  clean.js            — Removes dist/
  dev-server.js       — Minimal static file server (Node built-ins only)
  dev-watch.js        — File watcher + auto-rebuild
  main.js             — Browser entry point (imports all client modules)
  error-handler.js    — Global error/rejection handler
  theme.js            — Dark mode toggle with system preference sync
  ui.js               — Section animations, back-to-top button
  navigation.js       — Mobile menu, active nav highlighting
  experience.js       — Collapsible experience sections
  skills.js           — Skills search with fuzzy matching
  print-handler.js    — Print/download modal (Ctrl+P / Cmd+P)

templates/
  index.hbs           — Main page template
  partials/           — Reusable template sections
  sw.template.js      — Service worker template (placeholders replaced at build)

css/
  main.css            — Entry point (imports all other CSS)
  base.css            — Reset, custom properties, dark theme, utilities
  sidebar.css         — Sidebar layout and profile
  sections.css        — Content sections
  components.css      — Buttons, modals, badges
  experience.css      — Experience timeline and collapse
  skills.css          — Skills grid and search
  certifications.css  — Certification cards
  responsive.css      — Breakpoints and mobile layout
  DESIGN-TOKENS.md    — Custom property reference

tests/
  smoke.test.js       — Build output validation (files, HTML structure, fingerprinting)
  unit.test.js        — Logic tests (fuzzy-match, safeUrl, data validation)
  e2e.test.js         — Browser tests (interactions, accessibility via axe-core)
```

## Design Tokens

CSS custom properties are documented in `css/DESIGN-TOKENS.md`. All colors, spacing, and shadows use tokens defined on `:root`. Dark theme values are defined as `--dark-*` variants and mapped automatically.

## Accessibility

- Semantic HTML landmarks (`main`, `nav`, `aside`)
- Skip-to-content link
- ARIA attributes on interactive elements
- `prefers-reduced-motion` respected globally
- Automated axe-core WCAG 2.1 AA audit in E2E tests
- Screen reader announcements for search results

## Performance

- Critical CSS inlined in `<head>` to avoid render-blocking
- FontAwesome loaded asynchronously with `<noscript>` fallback
- Service worker with cache-first strategy for fingerprinted assets
- Content-hash fingerprinting enables immutable caching
- CSS and JS minified with source maps

## Security

- Content Security Policy via `<meta>` tag (restricts scripts, styles, images, fonts, connections)
- `safeUrl` Handlebars helper blocks `javascript:`, `data:`, and other dangerous URI schemes
- Global error handler captures uncaught exceptions without leaking to third parties

## CI

GitHub Actions runs on push/PR to `main`:

1. `npm ci`
2. Security audit (`npm audit --omit=dev`)
3. ESLint + Stylelint
4. Build + smoke tests
5. Unit tests
6. HTML validation
7. E2E tests (Puppeteer + Chromium)

## License

Private.
