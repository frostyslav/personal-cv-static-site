// Collapsible experience items
(() => {
  /**
   * Shared helper: set up collapse/expand and details toggle on a position or
   * single timeline item.
   *
   * @param {HTMLElement} item        - The .position-item or .timeline-item element
   * @param {HTMLElement|null} title  - The clickable header element
   * @param {boolean} startCollapsed - Whether to start in collapsed state
   */
  function makePositionCollapsible(item, title, startCollapsed) {
    const experienceSections = item.querySelectorAll('.experience-section');
    const summarySections = [];
    const resultsSections = [];

    experienceSections.forEach(section => {
      const heading = section.querySelector('.experience-section-title');
      const text = heading ? heading.textContent.trim().toLowerCase() : '';
      if (text.includes('results') || text.includes('impact')) {
        resultsSections.push(section);
      } else {
        summarySections.push(section);
        section.classList.add('summary-section');
      }
    });

    // Details toggle button
    const detailsToggle = document.createElement('button');
    detailsToggle.className = 'details-toggle';
    detailsToggle.setAttribute('aria-expanded', 'false');
    detailsToggle.innerHTML =
      '<i class="fa-solid fa-plus"></i> Show project details';

    const insertAfter =
      resultsSections[resultsSections.length - 1] ||
      item.querySelector('.timeline-project');
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(
        detailsToggle,
        insertAfter.nextSibling
      );
    }

    // Collapse chevron on title
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-btn';
    collapseBtn.setAttribute('aria-label', 'Toggle details');
    collapseBtn.setAttribute('aria-expanded', String(!startCollapsed));
    collapseBtn.innerHTML = startCollapsed
      ? '<i class="fa-solid fa-chevron-right"></i>'
      : '<i class="fa-solid fa-chevron-down"></i>';

    if (title) {
      title.classList.add('collapsible-header');
      title.setAttribute('role', 'button');
      title.setAttribute('tabindex', '0');
      title.appendChild(collapseBtn);
    }

    if (startCollapsed) {
      item.classList.add('collapsed');
    }

    // Details toggle: show/hide summary sections
    detailsToggle.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const showing =
        summarySections[0] && !summarySections[0].classList.contains('visible');

      summarySections.forEach(s => s.classList.toggle('visible', showing));
      detailsToggle.setAttribute('aria-expanded', String(showing));

      detailsToggle.innerHTML = showing
        ? '<i class="fa-solid fa-minus"></i> Hide project details'
        : '<i class="fa-solid fa-plus"></i> Show project details';

      if (showing && summarySections[0]) {
        summarySections[0].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    });

    // Title/chevron: full collapse/expand
    const toggleCollapse = e => {
      e.preventDefault();
      e.stopPropagation();

      const isCollapsed = item.classList.toggle('collapsed');
      const icon = collapseBtn.querySelector('i');
      collapseBtn.setAttribute('aria-expanded', String(!isCollapsed));

      if (isCollapsed) {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
      } else {
        icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
      }

      // Reset summary sections when toggling
      summarySections.forEach(s => s.classList.remove('visible'));
      detailsToggle.setAttribute('aria-expanded', 'false');
      detailsToggle.innerHTML =
        '<i class="fa-solid fa-plus"></i> Show project details';
    };

    collapseBtn.addEventListener('click', toggleCollapse);
    if (title) {
      title.addEventListener('click', toggleCollapse);
      title.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCollapse(e);
        }
      });
    }
  }

  window.addEventListener('load', () => {
    const experienceSection = document.querySelector('#experience');
    if (!experienceSection) return;

    // Company groups (multiple positions)
    const companyGroups = experienceSection.querySelectorAll('.company-group');

    companyGroups.forEach((group, groupIndex) => {
      const companyName = group.querySelector('.timeline-company');
      if (companyName) {
        const companyCollapseBtn = document.createElement('button');
        companyCollapseBtn.className = 'collapse-btn company-collapse-btn';
        companyCollapseBtn.innerHTML =
          '<i class="fa-solid fa-chevron-down"></i>';
        companyCollapseBtn.setAttribute('aria-label', 'Toggle company details');
        companyCollapseBtn.setAttribute(
          'aria-expanded',
          groupIndex === 0 ? 'true' : 'false'
        );

        companyName.classList.add('collapsible-header');
        companyName.setAttribute('role', 'button');
        companyName.setAttribute('tabindex', '0');
        companyName.appendChild(companyCollapseBtn);

        if (groupIndex > 0) {
          group.classList.add('company-collapsed');
          companyCollapseBtn
            .querySelector('i')
            .classList.replace('fa-chevron-down', 'fa-chevron-right');
        }

        const toggleCompany = e => {
          e.preventDefault();
          e.stopPropagation();
          const isCollapsed = group.classList.toggle('company-collapsed');
          const icon = companyCollapseBtn.querySelector('i');
          companyCollapseBtn.setAttribute('aria-expanded', !isCollapsed);
          if (isCollapsed) {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
          } else {
            icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
          }
        };

        companyCollapseBtn.addEventListener('click', toggleCompany);
        companyName.addEventListener('click', toggleCompany);
        companyName.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCompany(e);
          }
        });
      }

      // Position-level collapse — use shared helper
      group.querySelectorAll('.position-item').forEach(item => {
        const title = item.querySelector('.timeline-title');
        makePositionCollapsible(item, title, groupIndex > 0);
      });
    });

    // Single timeline items (not in company-group) — use same shared helper
    experienceSection
      .querySelectorAll('.timeline-item:not(.company-group)')
      .forEach(item => {
        const title = item.querySelector('.timeline-company');
        makePositionCollapsible(item, title, true);
      });
  });
})();
