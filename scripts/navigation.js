// Mobile menu toggle & active navigation highlighting
(() => {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sidebarCollapseBtn = document.querySelector('.sidebar-collapse-btn');

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

  // Active navigation highlighting
  const sections = document.querySelectorAll('.section');

  function updateActiveNav() {
    const isAtBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 10;

    if (isAtBottom) {
      navLinks.forEach(link => link.classList.remove('active'));
      const lastLink = document.querySelector('a[href="#certifications"]');
      if (lastLink) lastLink.classList.add('active');
      return;
    }

    let currentSection = '';
    let closestDistance = Infinity;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150 && Math.abs(rect.top) < closestDistance) {
        closestDistance = Math.abs(rect.top);
        currentSection = section.getAttribute('id');
      }
    });

    if (!currentSection && sections.length > 0) {
      currentSection = sections[0].getAttribute('id');
    }

    if (currentSection) {
      navLinks.forEach(link => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === `#${currentSection}`
        );
      });
    }
  }

  let navScrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!navScrollTicking) {
      requestAnimationFrame(() => {
        updateActiveNav();
        navScrollTicking = false;
      });
      navScrollTicking = true;
    }
  });

  window.addEventListener('load', updateActiveNav);

  // Smooth scroll for navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
})();
