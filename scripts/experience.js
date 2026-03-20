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
      // Separate experience sections into summary (overview/focus) and results
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
        }
      });

      // Create "Show project details" / "Hide project details" toggle link
      const detailsToggle = document.createElement('button');
      detailsToggle.className = 'details-toggle';
      detailsToggle.innerHTML =
        '<i class="fa-solid fa-plus"></i> Show project details';

      // Insert toggle after the last results section (or after project name if no results)
      const lastResults = resultsSections[resultsSections.length - 1];
      const insertAfter =
        lastResults || item.querySelector('.timeline-project');
      if (insertAfter && insertAfter.parentNode) {
        insertAfter.parentNode.insertBefore(
          detailsToggle,
          insertAfter.nextSibling
        );
      }

      // Create collapse button on title for full expand/collapse
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'collapse-btn';
      collapseBtn.setAttribute('aria-label', 'Toggle details');
      collapseBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';

      const title = item.querySelector('.timeline-title');
      if (title) {
        title.style.display = 'flex';
        title.style.alignItems = 'center';
        title.style.justifyContent = 'space-between';
        title.appendChild(collapseBtn);
      }

      // Default state: summary hidden, results visible
      // For non-first companies: everything hidden (company is collapsed)
      if (groupIndex > 0) {
        item.classList.add('collapsed');
        collapseBtn
          .querySelector('i')
          .classList.replace('fa-chevron-down', 'fa-chevron-right');
        experienceSections.forEach(section => {
          section.style.display = 'none';
        });
        detailsToggle.style.display = 'none';
      } else {
        summarySections.forEach(section => {
          section.style.display = 'none';
        });
      }

      // Details toggle: show/hide summary sections only
      const toggleDetails = e => {
        e.preventDefault();
        e.stopPropagation();
        const isHidden =
          summarySections[0] && summarySections[0].style.display === 'none';

        summarySections.forEach(section => {
          section.style.display = isHidden ? 'block' : 'none';
        });

        if (isHidden) {
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
      };

      detailsToggle.addEventListener('click', toggleDetails);

      // Title/chevron: full collapse/expand (all sections + details toggle)
      const togglePosition = e => {
        e.preventDefault();
        e.stopPropagation();

        const isCurrentlyCollapsed = item.classList.contains('collapsed');
        const icon = collapseBtn.querySelector('i');

        if (isCurrentlyCollapsed) {
          // Expand: show results, hide summary, show details toggle
          item.classList.remove('collapsed');
          icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
          resultsSections.forEach(section => {
            section.style.display = 'block';
          });
          summarySections.forEach(section => {
            section.style.display = 'none';
          });
          detailsToggle.style.display = '';
          detailsToggle.innerHTML =
            '<i class="fa-solid fa-plus"></i> Show project details';
        } else {
          // Collapse: hide everything
          item.classList.add('collapsed');
          icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
          experienceSections.forEach(section => {
            section.style.display = 'none';
          });
          detailsToggle.style.display = 'none';
        }
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

      // Collapse by default: hide everything
      item.classList.add('collapsed');
      experienceSections.forEach(section => {
        section.style.display = 'none';
      });
      if (projectField) {
        projectField.style.display = 'none';
      }
      detailsToggle.style.display = 'none';

      // Details toggle: show/hide summary sections
      detailsToggle.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const isHidden =
          summarySections[0] && summarySections[0].style.display === 'none';

        summarySections.forEach(section => {
          section.style.display = isHidden ? 'block' : 'none';
        });

        if (isHidden) {
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
          if (projectField) {
            projectField.style.display = 'block';
          }
          resultsSections.forEach(section => {
            section.style.display = 'block';
          });
          summarySections.forEach(section => {
            section.style.display = 'none';
          });
          detailsToggle.style.display = '';
          detailsToggle.innerHTML =
            '<i class="fa-solid fa-plus"></i> Show project details';
        } else {
          item.classList.add('collapsed');
          icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
          experienceSections.forEach(section => {
            section.style.display = 'none';
          });
          if (projectField) {
            projectField.style.display = 'none';
          }
          detailsToggle.style.display = 'none';
        }
      };

      collapseBtn.addEventListener('click', toggleSingle);
      title.addEventListener('click', toggleSingle);
      title.style.cursor = 'pointer';
    }
  });
});
