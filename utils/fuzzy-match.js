/**
 * ESM re-export of fuzzy-match.cjs — used by browser code (bundled by esbuild).
 * The canonical logic lives in fuzzy-match.cjs so Node tests can require() it
 * directly without any transpilation hacks.
 *
 * esbuild handles the CJS → ESM interop transparently at bundle time.
 */
export { ALIASES, fuzzyMatch } from './fuzzy-match.cjs';
