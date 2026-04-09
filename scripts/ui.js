// Section fade-in animations & back-to-top button
(() => {
  window.addEventListener('load', () => {
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
