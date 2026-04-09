// Collapsible experience items
window.addEventListener('load', () => {
  const experienceSection = document.querySelector('#experience');
  if (!experienceSection) return;

  // Handle company groups (multiple positions)
  const companyGroups = experienceSection.querySelectorAll('.company-group');

  companyGroups.forEach((group, groupIndex) => {
    const companyName = group.querySelector('.timeline-company');
    if (companyName) {
      const companyCollapseBtn = document.createElement('button');
      companyCollapseBtn.className = 'collapse-btn company-collapse-btn';
      companyCollapseBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
      companyCollapseBtn.setAttribute('aria-label', 'Toggle company details');
      companyCollapseBtn.setAttribute(
        'aria-expanded',
        groupIndex === 0 ? 'true' : 'false'
      );

      companyName.classList.add('collapsible-header');
      companyName.appendChild(companyCollapseBtn);

      const positionTimeline = group.querySelector('.position-timeline');

      // Collapse all companies except the first one
      if (groupIndex > 0 && positionTimeline) {
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
    }

    // Position-level collapse buttons
    const positionItems = group.querySelectorAll('.position-item');

    positionItems.forEach(item => {
      const experienceSections = item.querySelectorAll('.experience-section');
      const summarySections = [];
      const resultsSections = [];

      experienceSections.forEach(section => {
        const sectionTitle = section.querySelector('.experience-section-title');
        const titleText = sectionTitle
          ? sectionTitle.textContent.trim().toLowerCase()
          : '';
        if (titleText.includes('results') || titleText.includes('impact')) {
          resultsSections.push(section);
        } else {
          summarySections.push(section);
          section.classList.add('summary-section');
        }
      });

      // Create details toggle
      const detailsToggle = document.createElement('button');
      detailsToggle.className = 'details-toggle';
      detailsToggle.innerHTML =
        '<i class="fa-solid fa-plus"></i> Show project details';

      const lastResults = resultsSections[resultsSections.length - 1];
      const insertAfter =
        lastResults || item.querySelector('.timeline-project');
      if (insertAfter && insertAfter.parentNode) {
        insertAfter.parentNode.insertBefore(
          detailsToggle,
          insertAfter.nextSibling
        );
      }

      // Create collapse button on title
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'collapse-btn';
      collapseBtn.setAttribute('aria-label', 'Toggle details');
      collapseBtn.setAttribute(
        'aria-expanded',
        groupIndex === 0 ? 'true' : 'false'
      );
      collapseBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';

      const title = item.querySelector('.timeline-title');
      if (title) {
        title.classList.add('collapsible-header');
        title.appendChild(collapseBtn);
      }

      // Non-first companies start fully collapsed
      if (groupIndex > 0) {
        item.classList.add('collapsed');
        collapseBtn
          .querySelector('i')
          .classList.replace('fa-chevron-down', 'fa-chevron-right');
      }
      // Summary sections start hidden via CSS class (no inline style needed)

      // Details toggle: show/hide summary sections
      detailsToggle.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const showing =
          summarySections[0] &&
          !summarySections[0].classList.contains('visible');

        summarySections.forEach(section => {
          section.classList.toggle('visible', showing);
        });

        if (showing) {
          detailsToggle.innerHTML =
            '<i class="fa-solid fa-minus"></i> Hide project details';
          summarySections[0].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        } else {
          detailsToggle.innerHTML =
            '<i class="fa-solid fa-plus"></i> Show project details';
        }
      });

      // Title/chevron: full collapse/expand
      const togglePosition = e => {
        e.preventDefault();
        e.stopPropagation();

        const isCurrentlyCollapsed = item.classList.contains('collapsed');
        const icon = collapseBtn.querySelector('i');

        if (isCurrentlyCollapsed) {
          item.classList.remove('collapsed');
          icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
          collapseBtn.setAttribute('aria-expanded', 'true');
          // Reset summary sections to hidden
          summarySections.forEach(s => s.classList.remove('visible'));
          detailsToggle.innerHTML =
            '<i class="fa-solid fa-plus"></i> Show project details';
        } else {
          item.classList.add('collapsed');
          icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
          collapseBtn.setAttribute('aria-expanded', 'false');
          summarySections.forEach(s => s.classList.remove('visible'));
        }
      };

      collapseBtn.addEventListener('click', togglePosition);
      if (title) title.addEventListener('click', togglePosition);
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
      collapseBtn.setAttribute('aria-expanded', 'false');

      title.classList.add('collapsible-header');
      title.appendChild(collapseBtn);

      const experienceSections = item.querySelectorAll('.experience-section');
      const summarySections = [];
      const resultsSections = [];
      const projectField = item.querySelector('.timeline-project');

      experienceSections.forEach(section => {
        const sectionTitle = section.querySelector('.experience-section-title');
        const titleText = sectionTitle
          ? sectionTitle.textContent.trim().toLowerCase()
          : '';
        if (titleText.includes('results') || titleText.includes('impact')) {
          resultsSections.push(section);
        } else {
          summarySections.push(section);
          section.classList.add('summary-section');
        }
      });

      // Create details toggle
      const detailsToggle = document.createElement('button');
      detailsToggle.className = 'details-toggle';
      detailsToggle.innerHTML =
        '<i class="fa-solid fa-plus"></i> Show project details';

      const lastResults = resultsSections[resultsSections.length - 1];
      const insertAfter = lastResults || projectField;
      if (insertAfter && insertAfter.parentNode) {
        insertAfter.parentNode.insertBefore(
          detailsToggle,
          insertAfter.nextSibling
        );
      }

      // Collapse by default
      item.classList.add('collapsed');

      // Details toggle: show/hide summary sections
      detailsToggle.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const showing =
          summarySections[0] &&
          !summarySections[0].classList.contains('visible');

        summarySections.forEach(section => {
          section.classList.toggle('visible', showing);
        });

        if (showing) {
          detailsToggle.innerHTML =
            '<i class="fa-solid fa-minus"></i> Hide project details';
          summarySections[0].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        } else {
          detailsToggle.innerHTML =
            '<i class="fa-solid fa-plus"></i> Show project details';
        }
      });

      // Title/chevron: full collapse/expand
      const toggleSingle = e => {
        e.preventDefault();
        e.stopPropagation();

        const isCurrentlyCollapsed = item.classList.contains('collapsed');
        const icon = collapseBtn.querySelector('i');

        if (isCurrentlyCollapsed) {
          item.classList.remove('collapsed');
          icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
          collapseBtn.setAttribute('aria-expanded', 'true');
          summarySections.forEach(s => s.classList.remove('visible'));
          detailsToggle.innerHTML =
            '<i class="fa-solid fa-plus"></i> Show project details';
        } else {
          item.classList.add('collapsed');
          icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
          collapseBtn.setAttribute('aria-expanded', 'false');
          summarySections.forEach(s => s.classList.remove('visible'));
        }
      };

      collapseBtn.addEventListener('click', toggleSingle);
      title.addEventListener('click', toggleSingle);
    }
  });
});
