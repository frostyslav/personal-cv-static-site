// Mobile menu toggle & active navigation highlighting
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sidebarCollapseBtn = document.querySelector('.sidebar-collapse-btn');

    if (!sidebar) return;

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        menuToggle.classList.toggle('active');
        menuToggle.setAttribute(
          'aria-expanded',
          sidebar.classList.contains('active')
        );
      });
    }

    if (sidebarCollapseBtn) {
      sidebarCollapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        sidebarCollapseBtn.setAttribute(
          'aria-expanded',
          !sidebar.classList.contains('collapsed')
        );
      });
    }

    // Close sidebar when clicking a nav link (mobile)
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
          if (menuToggle) {
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });

    // Active navigation highlighting via IntersectionObserver
    const sections = document.querySelectorAll('.section');
    let currentSectionId = sections.length ? sections[0].id : '';

    function setActiveNav(sectionId) {
      currentSectionId = sectionId;
      navLinks.forEach(link => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === `#${sectionId}`
        );
      });
    }

    // Track which sections are currently intersecting the viewport
    const visibleSections = new Map();

    const navObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const id = entry.target.getAttribute('id');
          if (entry.isIntersecting) {
            visibleSections.set(id, entry.target);
          } else {
            visibleSections.delete(id);
          }
        });

        // Pick the topmost visible section (DOM order)
        if (visibleSections.size > 0) {
          for (const section of sections) {
            if (visibleSections.has(section.id)) {
              setActiveNav(section.id);
              return;
            }
          }
        }
      },
      {
        // Fire when a section enters the top 20% of the viewport
        rootMargin: '0px 0px -80% 0px',
        threshold: 0,
      }
    );

    sections.forEach(section => navObserver.observe(section));

    // Edge case: when scrolled to the very bottom, activate the last section
    // even if it's too short to cross the rootMargin threshold.
    // Guard with a scroll-position check so the initial observe() callback
    // (which fires synchronously at scroll 0) doesn't hijack the active state.
    let scrollTicking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!scrollTicking) {
          requestAnimationFrame(() => {
            const atBottom =
              window.innerHeight + window.scrollY >=
              document.documentElement.scrollHeight - 10;
            if (atBottom && sections.length > 0) {
              setActiveNav(sections[sections.length - 1].id);
            }
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      },
      { passive: true }
    );

    // Set initial active state
    if (currentSectionId) setActiveNav(currentSectionId);

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target)
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Close sidebar when clicking outside (mobile)
    document.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        if (
          sidebar &&
          !sidebar.contains(e.target) &&
          (!menuToggle || !menuToggle.contains(e.target))
        ) {
          sidebar.classList.remove('active');
          if (menuToggle) {
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  }); // end DOMContentLoaded
})();
