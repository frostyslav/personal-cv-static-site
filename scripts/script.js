// Mobile menu toggle
const menuToggle = document.querySelector(".mobile-menu-toggle");
const sidebar = document.querySelector(".sidebar");
const navLinks = document.querySelectorAll(".nav-link");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  menuToggle.classList.toggle("active");
});

// Close sidebar when clicking on a nav link (mobile)
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("active");
      menuToggle.classList.remove("active");
    }
  });
});

// Active navigation highlighting
const sections = document.querySelectorAll(".section");

function updateActiveNav() {
  // If at the top of the page, always highlight About
  if (window.scrollY < 50) {
    navLinks.forEach((link) => link.classList.remove("active"));
    const aboutLink = document.querySelector('a[href="#about"]');
    if (aboutLink) {
      aboutLink.classList.add("active");
    }
    return;
  }

  // Check if we're at the bottom of the page
  const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10;

  if (isAtBottom) {
    // Highlight the last section (Contact)
    navLinks.forEach((link) => link.classList.remove("active"));
    const contactLink = document.querySelector('a[href="#certifications"]');
    if (contactLink) {
      contactLink.classList.add("active");
    }
    return;
  }

  // Otherwise, find which section is most visible
  let currentSection = "";
  const scrollPosition = window.scrollY + 300;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;

    // If we've scrolled past this section's top, it's a candidate
    if (scrollPosition >= sectionTop) {
      currentSection = section.getAttribute("id");
    }
  });

  if (currentSection) {
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentSection}`) {
        link.classList.add("active");
      }
    });
  }
}

// Update on scroll
window.addEventListener("scroll", updateActiveNav);

// Set initial state
window.addEventListener("load", () => {
  updateActiveNav();
});

// Smooth scroll for navigation links
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = link.getAttribute("href");
    const targetSection = document.querySelector(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Close sidebar when clicking outside (mobile)
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768) {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove("active");
      menuToggle.classList.remove("active");
    }
  }
});

// Print handler - redirect to PDF
window.addEventListener("beforeprint", (e) => {
  e.preventDefault();
  window.open("https://cv.rostyslav.eu/files/CV_Rostyslav_Fridman.pdf", "_blank");
  return false;
});

// Alternative: Override Ctrl+P / Cmd+P
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "p") {
    e.preventDefault();
    window.open("https://cv.rostyslav.eu/files/CV_Rostyslav_Fridman.pdf", "_blank");
    return false;
  }
});

// Collapsible experience items
window.addEventListener("load", () => {
  const experienceSection = document.querySelector("#experience");
  if (!experienceSection) return;

  // Handle company groups (multiple positions)
  const companyGroups = experienceSection.querySelectorAll(".company-group");

  companyGroups.forEach((group, groupIndex) => {
    // Add company-level collapse button
    const companyName = group.querySelector(".timeline-company");
    if (companyName) {
      const companyCollapseBtn = document.createElement("button");
      companyCollapseBtn.className = "collapse-btn company-collapse-btn";
      companyCollapseBtn.innerHTML = "▼";
      companyCollapseBtn.setAttribute("aria-label", "Toggle company details");

      companyName.style.display = "flex";
      companyName.style.alignItems = "center";
      companyName.style.justifyContent = "space-between";
      companyName.appendChild(companyCollapseBtn);

      const positionTimeline = group.querySelector(".position-timeline");

      // Collapse all companies except the first one
      if (groupIndex > 0 && positionTimeline) {
        group.classList.add("company-collapsed");
        companyCollapseBtn.innerHTML = "▶";
        positionTimeline.style.display = "none";
      }

      // Company collapse click handler - both button and company name
      const toggleCompany = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isCollapsed = group.classList.toggle("company-collapsed");
        companyCollapseBtn.innerHTML = isCollapsed ? "▶" : "▼";

        if (positionTimeline) {
          positionTimeline.style.display = isCollapsed ? "none" : "block";
        }
      };

      companyCollapseBtn.addEventListener("click", toggleCompany);
      companyName.addEventListener("click", toggleCompany);
      companyName.style.cursor = "pointer";
    }

    // Position-level collapse buttons
    const positionItems = group.querySelectorAll(".position-item");

    positionItems.forEach((item) => {
      // Create collapse button
      const collapseBtn = document.createElement("button");
      collapseBtn.className = "collapse-btn";
      collapseBtn.setAttribute("aria-label", "Toggle details");

      // Find the title and insert button after it
      const title = item.querySelector(".timeline-title");
      if (title) {
        title.style.display = "flex";
        title.style.alignItems = "center";
        title.style.justifyContent = "space-between";
        title.appendChild(collapseBtn);
      }

      // Get all collapsible content (everything after project name)
      const experienceSections = item.querySelectorAll(".experience-section");

      // Collapse all items except those in the first company group (latest company)
      if (groupIndex > 0) {
        item.classList.add("collapsed");
        collapseBtn.innerHTML = "▶";
        experienceSections.forEach((section) => {
          section.style.display = "none";
        });
      } else {
        collapseBtn.innerHTML = "▼";
      }

      // Add click handler - both button and title
      const togglePosition = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isCollapsed = item.classList.toggle("collapsed");
        collapseBtn.innerHTML = isCollapsed ? "▶" : "▼";

        experienceSections.forEach((section) => {
          section.style.display = isCollapsed ? "none" : "block";
        });
      };

      collapseBtn.addEventListener("click", togglePosition);
      title.addEventListener("click", togglePosition);
      title.style.cursor = "pointer";
    });
  });

  // Handle single timeline items (not in company-group)
  const singleTimelineItems = experienceSection.querySelectorAll(".timeline-item:not(.company-group)");

  singleTimelineItems.forEach((item) => {
    const title = item.querySelector(".timeline-company");
    if (title) {
      const collapseBtn = document.createElement("button");
      collapseBtn.className = "collapse-btn";
      collapseBtn.innerHTML = "▶";
      collapseBtn.setAttribute("aria-label", "Toggle details");

      title.style.display = "flex";
      title.style.alignItems = "center";
      title.style.justifyContent = "space-between";
      title.appendChild(collapseBtn);

      const experienceSections = item.querySelectorAll(".experience-section");
      const projectField = item.querySelector(".timeline-project");

      // Collapse by default
      item.classList.add("collapsed");
      experienceSections.forEach((section) => {
        section.style.display = "none";
      });
      if (projectField) {
        projectField.style.display = "none";
      }

      // Add click handler - both button and title
      const toggleSingle = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isCollapsed = item.classList.toggle("collapsed");
        collapseBtn.innerHTML = isCollapsed ? "▶" : "▼";

        experienceSections.forEach((section) => {
          section.style.display = isCollapsed ? "none" : "block";
        });
        if (projectField) {
          projectField.style.display = isCollapsed ? "none" : "block";
        }
      };

      collapseBtn.addEventListener("click", toggleSingle);
      title.addEventListener("click", toggleSingle);
      title.style.cursor = "pointer";
    }
  });
});
