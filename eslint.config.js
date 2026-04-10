import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['scripts/**/*.js', 'utils/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        requestAnimationFrame: 'readonly',
        IntersectionObserver: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        HTMLElement: 'readonly',
      },
    },
  },
  {
    files: [
      'build-html.js',
      'scripts/fingerprint.js',
      'scripts/dev-server.js',
      'scripts/dev-watch.js',
      'tests/**/*.js',
      'utils/fetch-cert-dates.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },
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
  {
    ignores: ['dist/**', 'vendor/**', 'node_modules/**'],
  },
];
