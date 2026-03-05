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

// Print handler - redirect to PDF
window.addEventListener('beforeprint', e => {
  e.preventDefault();
  window.open(
    'https://cv.rostyslav.eu/files/CV_Rostyslav_Fridman.pdf',
    '_blank'
  );
  return false;
});

// Alternative: Override Ctrl+P / Cmd+P
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    window.open(
      'https://cv.rostyslav.eu/files/CV_Rostyslav_Fridman.pdf',
      '_blank'
    );
    return false;
  }
});

// Collapsible experience items
window.addEventListener('load', () => {
  const experienceSection = document.querySelector('#experience');
  if (!experienceSection) return;

  // Handle company groups (multiple positions)
  const companyGroups = experienceSection.querySelectorAll('.company-group');

  companyGroups.forEach((group, groupIndex) => {
    // Add company-level collapse button
    const companyName = group.querySelector('.timeline-company');
    if (companyName) {
      const companyCollapseBtn = document.createElement('button');
      companyCollapseBtn.className = 'collapse-btn company-collapse-btn';
      companyCollapseBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
      companyCollapseBtn.setAttribute('aria-label', 'Toggle company details');

      companyName.style.display = 'flex';
      companyName.style.alignItems = 'center';
      companyName.style.justifyContent = 'space-between';
      companyName.appendChild(companyCollapseBtn);

      const positionTimeline = group.querySelector('.position-timeline');

      // Collapse all companies except the first one
      if (groupIndex > 0 && positionTimeline) {
        group.classList.add('company-collapsed');
        companyCollapseBtn
          .querySelector('i')
          .classList.replace('fa-chevron-down', 'fa-chevron-right');
        positionTimeline.style.display = 'none';
      }

      // Company collapse click handler - both button and company name
      const toggleCompany = e => {
        e.preventDefault();
        e.stopPropagation();

        const isCollapsed = group.classList.toggle('company-collapsed');
        const icon = companyCollapseBtn.querySelector('i');

        if (isCollapsed) {
          icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        } else {
          icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        }

        if (positionTimeline) {
          positionTimeline.style.display = isCollapsed ? 'none' : 'block';
        }
      };

      companyCollapseBtn.addEventListener('click', toggleCompany);
      companyName.addEventListener('click', toggleCompany);
      companyName.style.cursor = 'pointer';
    }

    // Position-level collapse buttons
    const positionItems = group.querySelectorAll('.position-item');

    positionItems.forEach(item => {
      // Create collapse button
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'collapse-btn';
      collapseBtn.setAttribute('aria-label', 'Toggle details');
      collapseBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';

      // Find the title and insert button after it
      const title = item.querySelector('.timeline-title');
      if (title) {
        title.style.display = 'flex';
        title.style.alignItems = 'center';
        title.style.justifyContent = 'space-between';
        title.appendChild(collapseBtn);
      }

      // Get all collapsible content (everything after project name)
      const experienceSections = item.querySelectorAll('.experience-section');

      // Collapse all items except those in the first company group (latest company)
      if (groupIndex > 0) {
        item.classList.add('collapsed');
        collapseBtn
          .querySelector('i')
          .classList.replace('fa-chevron-down', 'fa-chevron-right');
        experienceSections.forEach(section => {
          section.style.display = 'none';
        });
      }

      // Add click handler - both button and title
      const togglePosition = e => {
        e.preventDefault();
        e.stopPropagation();

        const isCollapsed = item.classList.toggle('collapsed');
        const icon = collapseBtn.querySelector('i');

        if (isCollapsed) {
          icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        } else {
          icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        }

        experienceSections.forEach(section => {
          section.style.display = isCollapsed ? 'none' : 'block';
        });
      };

      collapseBtn.addEventListener('click', togglePosition);
      title.addEventListener('click', togglePosition);
      title.style.cursor = 'pointer';
    });
  });

  // Handle single timeline items (not in company-group)
  const singleTimelineItems = experienceSection.querySelectorAll(
    '.timeline-item:not(.company-group)'
  );

  singleTimelineItems.forEach(item => {
    const title = item.querySelector('.timeline-company');
    if (title) {
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'collapse-btn';
      collapseBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
      collapseBtn.setAttribute('aria-label', 'Toggle details');

      title.style.display = 'flex';
      title.style.alignItems = 'center';
      title.style.justifyContent = 'space-between';
      title.appendChild(collapseBtn);

      const experienceSections = item.querySelectorAll('.experience-section');
      const projectField = item.querySelector('.timeline-project');

      // Collapse by default
      item.classList.add('collapsed');
      experienceSections.forEach(section => {
        section.style.display = 'none';
      });
      if (projectField) {
        projectField.style.display = 'none';
      }

      // Add click handler - both button and title
      const toggleSingle = e => {
        e.preventDefault();
        e.stopPropagation();

        const isCollapsed = item.classList.toggle('collapsed');
        const icon = collapseBtn.querySelector('i');

        if (isCollapsed) {
          icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        } else {
          icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        }

        experienceSections.forEach(section => {
          section.style.display = isCollapsed ? 'none' : 'block';
        });
        if (projectField) {
          projectField.style.display = isCollapsed ? 'none' : 'block';
        }
      };

      collapseBtn.addEventListener('click', toggleSingle);
      title.addEventListener('click', toggleSingle);
      title.style.cursor = 'pointer';
    }
  });
});

// Skills search and filter functionality
window.addEventListener('load', () => {
  // Intersection Observer for section fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all sections
  document.querySelectorAll('.section').forEach(section => {
    sectionObserver.observe(section);
  });

  // Back to top button
  const backToTopBtn = document.querySelector('.back-to-top');

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  // Skills search and filter
  const skillsSection = document.querySelector('#skills');
  if (!skillsSection) return;

  const searchInput = document.getElementById('skillsSearch');
  const clearSearchBtn = document.getElementById('clearSearch');
  const categoryFiltersContainer = document.querySelector(
    '.skills-category-filters'
  );
  const skillCategories = document.querySelectorAll('.skill-category');

  // Build category filter buttons dynamically
  skillCategories.forEach(category => {
    const title = category.querySelector('.skill-category-title');
    if (title) {
      // Clone title to extract text without icon
      const titleClone = title.cloneNode(true);
      const icon = titleClone.querySelector('i');
      if (icon) {
        icon.remove();
      }
      const categoryName = titleClone.textContent.trim();

      // Get icon class from original
      const originalIcon = title.querySelector('i');
      const iconClass = originalIcon
        ? originalIcon.className
        : 'fa-solid fa-tag';

      const filterBtn = document.createElement('button');
      filterBtn.className = 'category-filter-btn';
      filterBtn.setAttribute('data-category', categoryName);
      filterBtn.setAttribute('title', categoryName);
      filterBtn.setAttribute('aria-label', categoryName);
      filterBtn.innerHTML = `<i class="${iconClass}"></i>`;

      categoryFiltersContainer.appendChild(filterBtn);
    }
  });

  const categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
  let activeCategory = 'all';

  // Search functionality
  function filterSkills() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    skillCategories.forEach(category => {
      const categoryTitle = category
        .querySelector('.skill-category-title')
        .textContent.trim();
      const skillTags = category.querySelectorAll('.skill-tag');
      let categoryHasVisibleSkills = false;

      // Check if category matches active filter
      const categoryMatches =
        activeCategory === 'all' || categoryTitle === activeCategory;

      skillTags.forEach(tag => {
        const skillText = tag.textContent.toLowerCase();
        const matchesSearch =
          searchTerm === '' || skillText.includes(searchTerm);
        const isVisible = categoryMatches && matchesSearch;

        if (isVisible) {
          tag.style.display = '';
          categoryHasVisibleSkills = true;
          visibleCount++;
        } else {
          tag.style.display = 'none';
        }
      });

      // Show/hide entire category based on whether it has visible skills
      if (categoryMatches && categoryHasVisibleSkills) {
        category.style.display = '';
      } else {
        category.style.display = 'none';
      }
    });

    // Show/hide clear button
    clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';

    // Show no results message if needed
    showNoResultsMessage(visibleCount === 0 && searchTerm !== '');
  }

  // Show/hide no results message
  function showNoResultsMessage(show) {
    let noResultsMsg = document.querySelector('.skills-no-results');

    if (show && !noResultsMsg) {
      noResultsMsg = document.createElement('div');
      noResultsMsg.className = 'skills-no-results';
      noResultsMsg.innerHTML = `
        <i class="fa-solid fa-search"></i>
        <p>No skills found matching your search.</p>
      `;
      document.querySelector('.skills-grid').appendChild(noResultsMsg);
    } else if (!show && noResultsMsg) {
      noResultsMsg.remove();
    }
  }

  // Category filter functionality
  categoryFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');

      // Update active state
      categoryFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeCategory = category;
      filterSkills();

      // Scroll to top of skills section
      const skillsSection = document.querySelector('#skills');
      if (skillsSection) {
        const yOffset = -100; // Offset for sticky header
        const y =
          skillsSection.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({
          top: y,
          behavior: 'smooth',
        });
      }
    });
  });

  // Search input event
  searchInput.addEventListener('input', filterSkills);

  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterSkills();
    searchInput.focus();
  });

  // Initial state
  clearSearchBtn.style.display = 'none';
});
