# Contributing

Thanks for your interest in contributing! This project is a CV/resume static site template. Contributions that improve the template, build pipeline, accessibility, or documentation are welcome.

## Getting Started

```sh
git clone https://github.com/frostyslav/personal-cv-static-site.git
cd personal-cv-static-site
nvm use          # or asdf install
npm install
npm run build    # builds with example data (Jane Doe)
```

The repo ships with example data in `data/` — no private access needed.

## Development Workflow

```sh
npm run dev:watch    # build, serve at localhost:3000, rebuild on changes
npm run lint         # ESLint + Stylelint
npm run test:all     # smoke + unit + e2e tests
```

## Pre-commit Hooks (prek)

This project uses [prek](https://github.com/j178/prek) for pre-commit hooks. Install it and run the hooks before pushing:

```sh
# Install prek (if not already installed)
brew install prek    # or see prek docs for other install methods

# Set up git hooks in this repo
prek install
prek install --hook-type commit-msg

# Run all linting hooks against staged files
prek run

# Run commit message validation (checks last commit)
prek run --hook-stage commit-msg
```

The hooks cover:

- File hygiene (trailing whitespace, line endings, large files, merge conflicts)
- Typo detection (`typos`)
- Code formatting (`prettier`)
- Markdown linting (`markdownlint`)
- GitHub Actions validation (`actionlint`)
- Commit message format (`commitlint` — conventional commits)

These same checks run automatically on `git commit` if prek is installed. If you skip them locally, CI will catch any issues.

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commits are validated by commitlint via a pre-commit hook.

```text
feat: add dark mode toggle animation
fix: correct print layout margins
docs: update data file reference table
chore: bump esbuild to v0.25
refactor: extract date parsing into helper
style: fix CSS indentation in hero.css
ci: add font subsetting to build pipeline
```

## Pull Request Guidelines

1. **Fork and branch** — create a feature branch from `main`.
2. **Keep it focused** — one feature or fix per PR.
3. **Run CI locally** before pushing:

   ```sh
   npm run lint && npm run build && npm run test:all
   ```

4. **Don't modify example data** unless you're fixing a build issue or adding a new data feature that needs demonstrating.
5. **Don't add personal content** — the example data uses fictional "Jane Doe" placeholder content.

## What to Contribute

Good first contributions:

- Accessibility improvements (new ARIA patterns, keyboard navigation)
- Print stylesheet refinements
- CSS/responsive design fixes
- Performance optimizations
- Documentation improvements
- New Handlebars helpers or template features
- Build pipeline improvements
- Test coverage

## Code Style

- JavaScript: ESLint with the project config (no additional plugins needed)
- CSS: Stylelint with `stylelint-config-standard`
- Formatting: Prettier (runs via pre-commit hook)
- Use existing patterns — read a few source files before writing new code

## Testing

All PRs must pass:

- `npm run lint` — no lint errors
- `npm test` — smoke tests (HTML structure, assets, fingerprinting)
- `npm run test:unit` — unit tests
- `npm run test:e2e` — browser tests with Puppeteer (accessibility via axe-core)
- `npm run validate` — HTML validation

## Font Subsetting

Font subsetting runs automatically during build if `pyftsubset` is installed (`pip install fonttools brotli`). If it's not installed, the build still works with full fonts. CI has it installed.

## Architecture Decisions

- **Zero runtime dependencies** — no React, no frameworks. Just Handlebars at build time and vanilla JS in the browser.
- **Data-driven** — all content comes from YAML. The template should never contain personal information.
- **ATS-friendly** — the HTML output must remain parseable by applicant tracking systems. Avoid client-side rendering of content.
- **Accessible** — WCAG 2.1 AA compliance is enforced by automated axe-core audits in E2E tests.

## Questions?

Open an issue if something is unclear or if you'd like to discuss a larger change before implementing it.
