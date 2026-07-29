// Seamless language switching via fetch + DOM swap
// Intercepts the .lang-toggle click, fetches the alternate page,
// swaps content in-place, and re-initializes interactive modules.
import { initExperience } from './experience.js';
import { initSkills } from './skills.js';
import { initUI } from './ui.js';
import { initPrintHandler } from './print-handler.js';

(() => {
  let isSwitching = false;

  function updateThemeUI() {
    // Sync the .theme-toggle button visuals with the current theme.
    const STORAGE_KEY = 'theme-preference';
    const theme =
      localStorage.getItem(STORAGE_KEY) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light');

    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    const icon = btn.querySelector('i');
    if (icon) {
      icon.className =
        theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    const label = btn.querySelector('.theme-toggle-label');
    if (label) {
      label.textContent =
        theme === 'dark'
          ? btn.dataset.labelLight || 'Light'
          : btn.dataset.labelDark || 'Dark';
    }
    const ariaText =
      theme === 'dark'
        ? btn.dataset.ariaDark || 'Switch to light mode'
        : btn.dataset.ariaLight || 'Switch to dark mode';
    btn.setAttribute('aria-label', ariaText);
    btn.setAttribute('title', label ? label.textContent : '');
  }

  function bindThemeToggle() {
    // Re-bind the click listener on the (new) .theme-toggle button after DOM swap.
    const STORAGE_KEY = 'theme-preference';
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute('data-theme', next);
      updateThemeUI();
    });
  }

  function bindLangToggle() {
    const toggle = document.querySelector('.lang-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', handleLangSwitch);
  }

  async function handleLangSwitch(e) {
    e.preventDefault();
    if (isSwitching) return;
    isSwitching = true;

    const toggle = e.currentTarget;
    const targetUrl = toggle.getAttribute('href');

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        // Fallback to normal navigation on fetch failure
        window.location.href = targetUrl;
        return;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Update <html lang>
      const newLang = doc.documentElement.getAttribute('lang');
      document.documentElement.setAttribute('lang', newLang);

      // Update <title>
      document.title = doc.title;

      // Update meta description
      const newMeta = doc.querySelector('meta[name="description"]');
      const currentMeta = document.querySelector('meta[name="description"]');
      if (newMeta && currentMeta) {
        currentMeta.setAttribute('content', newMeta.getAttribute('content'));
      }

      // Swap <header class="hero">
      const newHeader = doc.querySelector('.hero');
      const currentHeader = document.querySelector('.hero');
      if (newHeader && currentHeader) {
        currentHeader.replaceWith(newHeader);
      }

      // Swap <main class="content">
      const newMain = doc.querySelector('.content');
      const currentMain = document.querySelector('.content');
      if (newMain && currentMain) {
        currentMain.replaceWith(newMain);
      }

      // Swap print modal
      const newModal = doc.getElementById('printModal');
      const currentModal = document.getElementById('printModal');
      if (newModal && currentModal) {
        currentModal.replaceWith(newModal);
      }

      // Swap back-to-top button (it has localized aria-label)
      const newBackToTop = doc.querySelector('.back-to-top');
      const currentBackToTop = document.querySelector('.back-to-top');
      if (newBackToTop && currentBackToTop) {
        currentBackToTop.replaceWith(newBackToTop);
      }

      // Update canonical link
      const newCanonical = doc.querySelector('link[rel="canonical"]');
      const currentCanonical = document.querySelector('link[rel="canonical"]');
      if (newCanonical && currentCanonical) {
        currentCanonical.setAttribute(
          'href',
          newCanonical.getAttribute('href')
        );
      }

      // Update JSON-LD structured data
      const newJsonLd = doc.querySelector('script[type="application/ld+json"]');
      const currentJsonLd = document.querySelector(
        'script[type="application/ld+json"]'
      );
      if (newJsonLd && currentJsonLd) {
        currentJsonLd.textContent = newJsonLd.textContent;
      }

      // Push history state
      window.history.pushState({ lang: newLang }, document.title, targetUrl);

      // Re-initialize interactive modules
      initUI();
      initExperience();
      initSkills();
      initPrintHandler();
      updateThemeUI();
      bindThemeToggle();
      bindLangToggle();

      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // On any error, fall back to normal navigation
      window.location.href = targetUrl;
    } finally {
      isSwitching = false;
    }
  }

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    // Reload on history navigation to keep things simple and correct
    window.location.reload();
  });

  // Initial binding — handle case where DOMContentLoaded already fired
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindLangToggle();
    });
  } else {
    bindLangToggle();
  }
})();
