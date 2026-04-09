// Mobile menu toggle
const menuToggle = document.querySelector('.mobile-menu-toggle');
const sidebar = document.querySelector('.sidebar');
const navLinks = document.querySelectorAll('.nav-link');
const sidebarCollapseBtn = document.querySelector('.sidebar-collapse-btn');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    menuToggle.classList.toggle('active');
    const expanded = sidebar.classList.contains('active');
    menuToggle.setAttribute('aria-expanded', expanded);
  });
}

// Sidebar collapse button (desktop)
if (sidebarCollapseBtn) {
  sidebarCollapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const expanded = !sidebar.classList.contains('collapsed');
    sidebarCollapseBtn.setAttribute('aria-expanded', expanded);
  });
}

// Close sidebar when clicking on a nav link (mobile)
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
  // Check if we're at the bottom of the page
  const isAtBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 10;

  if (isAtBottom) {
    navLinks.forEach(link => link.classList.remove('active'));
    const contactLink = document.querySelector('a[href="#certifications"]');
    if (contactLink) {
      contactLink.classList.add('active');
    }
    return;
  }

  // Find the section closest to the top of the viewport
  let currentSection = '';
  let closestDistance = Infinity;

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    // Consider sections whose top is at or above 150px from viewport top
    // Pick the one closest to the top (smallest negative or positive value)
    if (rect.top <= 150 && Math.abs(rect.top) < closestDistance) {
      closestDistance = Math.abs(rect.top);
      currentSection = section.getAttribute('id');
    }
  });

  // If no section has scrolled past the threshold, highlight the first one
  if (!currentSection && sections.length > 0) {
    currentSection = sections[0].getAttribute('id');
  }

  if (currentSection) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }
}

// Update on scroll (throttled via rAF)
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

// Set initial state
window.addEventListener('load', () => {
  updateActiveNav();
});

// Smooth scroll for navigation links
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetSection = document.querySelector(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
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
