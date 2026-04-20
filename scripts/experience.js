// Collapsible experience items
(() => {
  /**
   * Build a FontAwesome icon element.
   * @param {string} iconClass - e.g. 'fa-solid fa-plus'
   * @returns {HTMLElement}
   */
  function createIcon(iconClass) {
    const i = document.createElement('i');
    i.className = iconClass;
    return i;
  }

  /**
   * Set the content of a details-toggle button without innerHTML.
   * @param {HTMLElement} btn
   * @param {boolean} expanded
   */
  function setDetailsToggleContent(btn, expanded) {
    btn.textContent = '';
    btn.appendChild(
      createIcon(expanded ? 'fa-solid fa-minus' : 'fa-solid fa-plus')
    );
    btn.append(expanded ? ' Hide project details' : ' Show project details');
  }

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
    setDetailsToggleContent(detailsToggle, false);

    const insertAfter =
      resultsSections[resultsSections.length - 1] ||
      item.querySelector('.timeline-project');
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(
        detailsToggle,
        insertAfter.nextSibling
      );
    } else {
      // Fallback: append to item if no suitable insertion point found
      item.appendChild(detailsToggle);
    }

    // Collapse chevron on title
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-btn';
    collapseBtn.setAttribute('aria-label', 'Toggle details');
    collapseBtn.setAttribute('aria-expanded', String(!startCollapsed));
    collapseBtn.appendChild(
      createIcon(
        startCollapsed
          ? 'fa-solid fa-chevron-right'
          : 'fa-solid fa-chevron-down'
      )
    );

    if (title) {
      title.classList.add('collapsible-header');
      title.setAttribute('tabindex', '0');
      title.setAttribute('aria-expanded', String(!startCollapsed));
      title.insertAdjacentElement('afterend', collapseBtn);
      collapseBtn.setAttribute('aria-hidden', 'true');
      collapseBtn.setAttribute('tabindex', '-1');
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
      setDetailsToggleContent(detailsToggle, showing);

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
      if (title) title.setAttribute('aria-expanded', String(!isCollapsed));

      if (isCollapsed) {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
      } else {
        icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
      }

      // Reset summary sections when toggling
      summarySections.forEach(s => s.classList.remove('visible'));
      detailsToggle.setAttribute('aria-expanded', 'false');
      setDetailsToggleContent(detailsToggle, false);
    };

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
        companyCollapseBtn.appendChild(createIcon('fa-solid fa-chevron-down'));
        companyCollapseBtn.setAttribute('aria-label', 'Toggle company details');
        companyCollapseBtn.setAttribute(
          'aria-expanded',
          groupIndex === 0 ? 'true' : 'false'
        );

        companyName.classList.add('collapsible-header');
        companyName.setAttribute('tabindex', '0');
        companyName.setAttribute(
          'aria-expanded',
          groupIndex === 0 ? 'true' : 'false'
        );
        companyName.insertAdjacentElement('afterend', companyCollapseBtn);
        companyCollapseBtn.setAttribute('aria-hidden', 'true');
        companyCollapseBtn.setAttribute('tabindex', '-1');

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
          companyName.setAttribute('aria-expanded', String(!isCollapsed));
          if (isCollapsed) {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
          } else {
            icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
          }
        };

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
