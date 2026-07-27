// Dark mode toggle with system preference detection and persistence
(() => {
  const STORAGE_KEY = 'theme-preference';

  function getPreference() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className =
          theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      }
      const label = btn.querySelector('.theme-toggle-label');
      if (label) {
        const labelText =
          theme === 'dark'
            ? btn.dataset.labelLight || 'Light'
            : btn.dataset.labelDark || 'Dark';
        label.textContent = labelText;
      }
      const ariaText =
        theme === 'dark'
          ? btn.dataset.ariaDark || 'Switch to light mode'
          : btn.dataset.ariaLight || 'Switch to dark mode';
      btn.setAttribute('aria-label', ariaText);
      btn.setAttribute('title', label ? label.textContent : '');
    }
  }

  // Apply immediately to prevent flash
  applyTheme(getPreference());

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    applyTheme(getPreference());

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });

    // Listen for system preference changes.
    // Honour the change even if the user previously toggled manually —
    // the stored preference is kept but the OS switch takes effect so
    // the toggle stays in sync with the system.
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', e => {
        const next = e.matches ? 'dark' : 'light';
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
      });
  });
})();
