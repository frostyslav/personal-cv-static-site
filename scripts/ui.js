// Section fade-in animations & back-to-top button
window.addEventListener('load', () => {
  // Intersection Observer for section fade-in animations
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

  // Observe all sections — add js-animate to enable fade-in
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('js-animate');
    sectionObserver.observe(section);
  });

  // Back to top button
  const backToTopBtn = document.querySelector('.back-to-top');

  if (backToTopBtn) {
    let backToTopTicking = false;
    window.addEventListener('scroll', () => {
      if (!backToTopTicking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
          } else {
            backToTopBtn.classList.remove('visible');
          }
          backToTopTicking = false;
        });
        backToTopTicking = true;
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }
});
