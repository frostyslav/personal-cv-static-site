# Personal CV — Static Site

A data-driven, offline-capable CV/resume website built with Handlebars templates, YAML content files, and a zero-framework Node.js build pipeline.

Live: <https://cv.rostyslav.eu>

## Architecture

```text
data/*.yaml          → Content (experience, skills, certifications, etc.)
templates/**/*.hbs   → Handlebars templates and partials
css/*.css            → Modular stylesheets (bundled by Lightning CSS)
scripts/*.js         → Browser modules (bundled by esbuild)
dist/                → Build output (fingerprinted, minified, ready to deploy)
```

The build compiles YAML data into HTML via Handlebars, bundles and minifies CSS/JS, copies static assets, then fingerprints everything with content hashes for long-term caching.

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- npm
- (Optional) Python with `fonttools` and `brotli` for font subsetting

```sh
nvm use        # or asdf install
npm install

# Optional: enable automatic font subsetting during build
pip install fonttools brotli
```

## Scripts

| Command             | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run build`     | Full production build (parallel: HTML + CSS + JS + assets, then fingerprint) |
| `npm run dev`       | Build once, then serve at <http://localhost:3000>                            |
| `npm run dev:watch` | Build, serve, and rebuild on file changes                                    |
| `npm run lint`      | ESLint + Stylelint                                                           |
| `npm test`          | Smoke tests (builds first, validates output)                                 |
| `npm run test:unit` | Unit tests (fuzzy-match, safeUrl, data validation)                           |
| `npm run test:e2e`  | E2E tests with Puppeteer (dark mode, navigation, accessibility)              |
| `npm run test:all`  | All test suites                                                              |
| `npm run validate`  | HTML validation via html-validate                                            |

## Editing Content

Content is separated from the template. This repo ships with **example data** (Jane Doe) in `data/` so it builds out of the box. To use your own content, point the build at an external data directory via environment variables.

### Quick start (example data)

```sh
npm run build    # builds with data/ (example content)
```

### Using your own data (private repo pattern)

Store your personal content in a separate (private) repository with this structure:

```text
your-cv-data/
├── data/
│   ├── en/
│   │   ├── about.yaml
│   │   ├── education.yaml
│   │   ├── experience.yaml
│   │   ├── projects.yaml
│   │   ├── sidebar.yaml
│   │   ├── site.yaml
│   │   └── skills.yaml
│   ├── de/                  ← additional locales (optional)
│   │   └── ...
│   ├── certifications.yaml  ← shared across locales
│   └── i18n.yaml            ← UI strings and locale config
└── images/
    ├── photo.webp
    └── certs/
        └── *.webp
```

Then point the build at it:

```sh
# Option A: .env file (gitignored, recommended for local dev)
echo 'CV_DATA_DIR=../your-cv-data/data' >> .env
echo 'CV_IMAGES_DIR=../your-cv-data/images' >> .env
npm run build

# Option B: inline environment variables
CV_DATA_DIR=../your-cv-data/data CV_IMAGES_DIR=../your-cv-data/images npm run build
```

The `.env` file is loaded automatically via `node --env-file-if-exists=.env` (Node 22+).

### Data files reference

| File                           | Content                                         |
| ------------------------------ | ----------------------------------------------- |
| `<locale>/sidebar.yaml`       | Profile info, photo, social links, languages    |
| `<locale>/about.yaml`         | Summary paragraphs                              |
| `<locale>/experience.yaml`    | Work history (grouped by company or standalone) |
| `<locale>/education.yaml`     | Education entries                               |
| `<locale>/skills.yaml`        | Skill categories and tags                       |
| `<locale>/projects.yaml`      | Open-source projects and speaking engagements   |
| `<locale>/site.yaml`          | Base URL, PDF path, career start year           |
| `certifications.yaml`         | Professional certifications (shared)            |
| `i18n.yaml`                   | Locale config, UI strings, meta descriptions    |

### Internationalization

Locales are configured in `i18n.yaml`:

```yaml
defaultLocale: en
locales: [en, de]
```

The default locale is served at `/`, others at `/<locale>/`. Change `defaultLocale` to serve a different language at the root. Add new locales by creating a `data/<locale>/` directory and adding the locale to the `locales` array.

### CI/CD with private data

The deploy workflow checks out the private data repo and sets the env vars:

```yaml
- uses: actions/checkout@v6
  with:
    repository: your-org/your-cv-data
    ssh-key: ${{ secrets.DATA_REPO_KEY }}
    path: data-private

- name: Build
  env:
    CV_DATA_DIR: data-private/data
    CV_IMAGES_DIR: data-private/images
  run: npm run build
```

You'll need a `DATA_REPO_KEY` secret — an SSH deploy key with read access to the private data repo. The CI build-and-test job uses the example data (no secret needed), so external contributors can open PRs without access to your personal content.

## Build Pipeline

The build runs in two phases:

1. **Parallel phase** — HTML compilation, CSS bundling (Lightning CSS), JS bundling (esbuild), and static asset copy all run concurrently.
2. **Sequential phase** — FontAwesome CSS subsetting, woff2 font subsetting (only glyphs used), asset fingerprinting with content hashes, and service worker generation.

Font subsetting requires `pyftsubset` (`pip install fonttools brotli`). If not installed, the build succeeds with full (non-subset) fonts.

The `prebuild` hook cleans `dist/` before each build.

## Project Structure

```text
scripts/
  build-html.js       — Loads YAML, validates, compiles Handlebars → dist/index.html
  build-all-locales.js — Builds HTML for all configured locales
  build-parallel.js   — Orchestrates parallel build steps
  subset-fonts.js     — Subsets woff2 fonts to only used glyphs (requires pyftsubset)
  subset-fa-css.js    — Strips unused icon definitions from FA CSS
  fingerprint.js      — Content-hash renaming + service worker generation
  clean.js            — Removes dist/
  dev-server.js       — Minimal static file server (Node built-ins only)
  dev-watch.js        — File watcher + auto-rebuild
  main.js             — Browser entry point (imports all client modules)
  error-handler.js    — Global error/rejection handler
  theme.js            — Dark mode toggle with system preference sync
  ui.js               — Section animations, back-to-top button
  navigation.js       — Placeholder (sidebar removed)
  experience.js       — Collapsible experience sections
  skills.js           — Skills search with fuzzy matching
  print-handler.js    — Print/download modal (Ctrl+P / Cmd+P)
  lang-switch.js      — Seamless language switching (fetch + DOM swap)

templates/
  index.hbs           — Main page template
  partials/           — Reusable template sections
  sw.template.js      — Service worker template (placeholders replaced at build)

css/
  main.css            — Entry point (imports all other CSS)
  base.css            — Reset, custom properties, dark theme, utilities
  hero.css            — Hero header, contact links, language bars
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

