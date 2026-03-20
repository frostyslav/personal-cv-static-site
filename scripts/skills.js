// Skills search and filter functionality
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

      // Toggle: clicking the active category resets to all
      categoryFilterBtns.forEach(b => b.classList.remove('active'));
      if (activeCategory === category) {
        activeCategory = 'all';
      } else {
        btn.classList.add('active');
        activeCategory = category;
      }
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
