// Section fade-in animations & back-to-top button
export function initUI() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    // Skip animation setup entirely — sections stay visible via CSS defaults
    document.querySelectorAll('.section').forEach(section => {
      section.classList.add('visible');
    });
  } else {
    const observerOptions = {
      threshold: 0.05,
      rootMargin: '0px 0px 100px 0px',
    };

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
      section.classList.add('js-animate');
      sectionObserver.observe(section);
    });
  }

  const backToTopBtn = document.querySelector('.back-to-top');

  if (backToTopBtn) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          backToTopBtn.classList.toggle('visible', window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    });
  }
}

// Run on initial page load
window.addEventListener('load', () => {
  initUI();
});
