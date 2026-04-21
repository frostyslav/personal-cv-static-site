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
   * Replace a static element (e.g. <p> or <h3>) with a <button> that
   * contains the same text content plus a chevron icon. This avoids
   * the nested-interactive axe-core violation that occurred when we
   * added role="button" to an element and then inserted a child <button>.
   *
   * @param {HTMLElement} original - The element to replace
   * @param {string} chevronClass - Initial chevron icon class
   * @returns {{ btn: HTMLButtonElement, chevronIcon: HTMLElement }}
   */
  function replaceWithButton(original, chevronClass) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = original.className + ' collapsible-header';

    // Preserve the text content
    const textSpan = document.createElement('span');
    textSpan.textContent = original.textContent;
    btn.appendChild(textSpan);

    // Append chevron icon inside the button
    const chevronIcon = createIcon(chevronClass);
    chevronIcon.classList.add('collapse-chevron');
    btn.appendChild(chevronIcon);

    original.replaceWith(btn);
    return { btn, chevronIcon };
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
    detailsToggle.type = 'button';
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

    // Replace the title element with a <button> containing a chevron
    let headerBtn = null;
    let chevronIcon = null;

    if (title) {
      const result = replaceWithButton(
        title,
        startCollapsed
          ? 'fa-solid fa-chevron-right'
          : 'fa-solid fa-chevron-down'
      );
      headerBtn = result.btn;
      chevronIcon = result.chevronIcon;
      headerBtn.setAttribute('aria-expanded', String(!startCollapsed));
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

    // Header button: full collapse/expand
    if (headerBtn) {
      headerBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        const isCollapsed = item.classList.toggle('collapsed');
        headerBtn.setAttribute('aria-expanded', String(!isCollapsed));

        if (isCollapsed) {
          chevronIcon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        } else {
          chevronIcon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        }

        // Reset summary sections when toggling
        summarySections.forEach(s => s.classList.remove('visible'));
        detailsToggle.setAttribute('aria-expanded', 'false');
        setDetailsToggleContent(detailsToggle, false);
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
        const startCollapsed = groupIndex > 0;
        const { btn: companyBtn, chevronIcon } = replaceWithButton(
          companyName,
          startCollapsed
            ? 'fa-solid fa-chevron-right'
            : 'fa-solid fa-chevron-down'
        );
        companyBtn.setAttribute('aria-label', 'Toggle company details');
        companyBtn.setAttribute(
          'aria-expanded',
          startCollapsed ? 'false' : 'true'
        );

        if (startCollapsed) {
          group.classList.add('company-collapsed');
        }

        companyBtn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          const isCollapsed = group.classList.toggle('company-collapsed');
          companyBtn.setAttribute('aria-expanded', String(!isCollapsed));
          if (isCollapsed) {
            chevronIcon.classList.replace(
              'fa-chevron-down',
              'fa-chevron-right'
            );
          } else {
            chevronIcon.classList.replace(
              'fa-chevron-right',
              'fa-chevron-down'
            );
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
