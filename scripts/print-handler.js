// Print handler — show modal with options on Ctrl+P / Cmd+P
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('printModal');
    const downloadBtn = document.getElementById('printModalDownload');
    const printBtn = document.getElementById('printModalPrint');
    const closeBtn = document.getElementById('printModalClose');

    if (!modal || !downloadBtn || !printBtn || !closeBtn) return;

    const pdfUrl =
      modal.getAttribute('data-pdf-url') || '/files/CV_Rostyslav_Fridman.pdf';

    let previousFocus = null;

    function openModal() {
      previousFocus = document.activeElement;
      modal.hidden = false;
      // Focus the first action button
      downloadBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      if (previousFocus) previousFocus.focus();
    }

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        openModal();
      }
      // Close on Escape
      if (e.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });

    downloadBtn.addEventListener('click', () => {
      window.open(pdfUrl, '_blank');
      closeModal();
    });

    printBtn.addEventListener('click', () => {
      closeModal();
      // Small delay so modal closes before print dialog
      setTimeout(() => window.print(), 100);
    });

    closeBtn.addEventListener('click', closeModal);

    // Close on overlay click
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });

    // Trap focus inside modal
    modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  });
})();
