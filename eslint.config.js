import js from '@eslint/js';

const NODE_ESM_GLOBALS = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  URL: 'readonly',
};

const BROWSER_GLOBALS = {
  document: 'readonly',
  window: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  requestAnimationFrame: 'readonly',
  IntersectionObserver: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  HTMLElement: 'readonly',
};

export default [
  js.configs.recommended,
  // Browser ESM scripts (bundled by esbuild)
  {
    files: [
      'scripts/main.js',
      'scripts/theme.js',
      'scripts/ui.js',
      'scripts/navigation.js',
      'scripts/print-handler.js',
      'scripts/experience.js',
      'scripts/skills.js',
      'scripts/error-handler.js',
      'scripts/sw-register.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: BROWSER_GLOBALS,
    },
  },
  // Shared utils — ESM
  {
    files: ['utils/fuzzy-match.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: BROWSER_GLOBALS,
    },
  },
  // Node ESM — build scripts, dev tooling, tests
  {
    files: [
      'scripts/build-html.js',
      'scripts/build-parallel.js',
      'scripts/extract-critical-css.js',
      'scripts/subset-fonts.js',
      'scripts/subset-fa-css.js',
      'scripts/clean.js',
      'scripts/fingerprint.js',
      'scripts/dev-server.js',
      'scripts/dev-watch.js',
      'tests/**/*.js',
      'utils/fetch-cert-dates.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...NODE_ESM_GLOBALS,
        // page.evaluate() callbacks run in the browser but ESLint
        // parses them as regular code — allow browser globals here.
        document: 'readonly',
        window: 'readonly',
      },
    },
  },
  // Service worker template
  {
    files: ['templates/sw.template.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
      },
    },
  },
  // SVGO config (CJS — required by svgo CLI)
  {
    files: ['svgo.config.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        module: 'readonly',
        require: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/**', 'vendor/**', 'node_modules/**'],
  },
];
