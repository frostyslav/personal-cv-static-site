// Skills search and filter functionality
(() => {
  window.addEventListener('load', () => {
    const skillsSection = document.querySelector('#skills');
    if (!skillsSection) return;

    const searchInput = document.getElementById('skillsSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    const categoryFiltersContainer = document.querySelector(
      '.skills-category-filters'
    );
    const skillCategories = document.querySelectorAll('.skill-category');

    // Create aria-live region for search result announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
    skillsSection.appendChild(liveRegion);

    // Build category filter buttons dynamically
    skillCategories.forEach(category => {
      const title = category.querySelector('.skill-category-title');
      if (!title) return;

      const titleClone = title.cloneNode(true);
      const icon = titleClone.querySelector('i');
      if (icon) icon.remove();
      const categoryName = titleClone.textContent.trim();

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
    });

    const categoryFilterBtns = document.querySelectorAll(
      '.category-filter-btn'
    );
    let activeCategory = 'all';

    function filterSkills() {
      const searchTerm = searchInput.value.toLowerCase().trim();
      let visibleCount = 0;

      skillCategories.forEach(category => {
        const categoryTitle = category
          .querySelector('.skill-category-title')
          .textContent.trim();
        const skillTags = category.querySelectorAll('.skill-tag');
        let categoryHasVisibleSkills = false;

        const categoryMatches =
          activeCategory === 'all' || categoryTitle === activeCategory;

        skillTags.forEach(tag => {
          const matchesSearch =
            searchTerm === '' ||
            tag.textContent.toLowerCase().includes(searchTerm);
          const isVisible = categoryMatches && matchesSearch;

          tag.classList.toggle('hidden', !isVisible);

          if (isVisible) {
            categoryHasVisibleSkills = true;
            visibleCount++;
          }
        });

        category.classList.toggle(
          'hidden',
          !(categoryMatches && categoryHasVisibleSkills)
        );
      });

      clearSearchBtn.classList.toggle('hidden', !searchTerm);

      const noResults = visibleCount === 0 && searchTerm !== '';
      showNoResultsMessage(noResults);

      // Announce results to screen readers
      if (searchTerm) {
        liveRegion.textContent = noResults
          ? 'No skills found matching your search.'
          : `${visibleCount} skill${visibleCount !== 1 ? 's' : ''} found.`;
      } else {
        liveRegion.textContent = '';
      }
    }

    function showNoResultsMessage(show) {
      let msg = document.querySelector('.skills-no-results');

      if (show && !msg) {
        msg = document.createElement('div');
        msg.className = 'skills-no-results';
        msg.innerHTML =
          '<i class="fa-solid fa-search"></i><p>No skills found matching your search.</p>';
        document.querySelector('.skills-grid').appendChild(msg);
      } else if (!show && msg) {
        msg.remove();
      }
    }

    // Debounce helper
    let debounceTimer;
    function debouncedFilter() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterSkills, 150);
    }

    categoryFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');

        categoryFilterBtns.forEach(b => b.classList.remove('active'));
        if (activeCategory === category) {
          activeCategory = 'all';
        } else {
          btn.classList.add('active');
          activeCategory = category;
        }
        filterSkills();

        const target = document.querySelector('#skills');
        if (target) {
          const y =
            target.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });

    searchInput.addEventListener('input', debouncedFilter);

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      filterSkills();
      searchInput.focus();
    });

    // Initial state
    clearSearchBtn.classList.add('hidden');
  });
})();
