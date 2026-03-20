// Mobile menu toggle
const menuToggle = document.querySelector('.mobile-menu-toggle');
const sidebar = document.querySelector('.sidebar');
const navLinks = document.querySelectorAll('.nav-link');
const sidebarCollapseBtn = document.querySelector('.sidebar-collapse-btn');

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('active');
  menuToggle.classList.toggle('active');
});

// Sidebar collapse button (desktop)
if (sidebarCollapseBtn) {
  sidebarCollapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });
}

// Close sidebar when clicking on a nav link (mobile)
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('active');
      menuToggle.classList.remove('active');
    }
  });
});

// Active navigation highlighting
const sections = document.querySelectorAll('.section');

function updateActiveNav() {
  // If at the top of the page, always highlight About
  if (window.scrollY < 50) {
    navLinks.forEach(link => link.classList.remove('active'));
    const aboutLink = document.querySelector('a[href="#about"]');
    if (aboutLink) {
      aboutLink.classList.add('active');
    }
    return;
  }

  // Check if we're at the bottom of the page
  const isAtBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 10;

  if (isAtBottom) {
    // Highlight the last section (Contact)
    navLinks.forEach(link => link.classList.remove('active'));
    const contactLink = document.querySelector('a[href="#certifications"]');
    if (contactLink) {
      contactLink.classList.add('active');
    }
    return;
  }

  // Otherwise, find which section is most visible
  let currentSection = '';
  const scrollPosition = window.scrollY + 300;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;

    // If we've scrolled past this section's top, it's a candidate
    if (scrollPosition >= sectionTop) {
      currentSection = section.getAttribute('id');
    }
  });

  if (currentSection) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }
}

// Update on scroll
window.addEventListener('scroll', updateActiveNav);

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
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove('active');
      menuToggle.classList.remove('active');
    }
  }
});
