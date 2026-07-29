// Print handler — show modal with options on Ctrl+P / Cmd+P

let keydownBound = false;
let currentOpenModal = null;
let currentCloseModal = null;

export function initPrintHandler() {
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
    downloadBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    if (previousFocus) previousFocus.focus();
  }

  // Expose current handlers for the global keydown listener
  currentOpenModal = openModal;
  currentCloseModal = closeModal;

  // Only bind the global keydown once to avoid duplicate listeners
  if (!keydownBound) {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (currentOpenModal) currentOpenModal();
      }
      const activeModal = document.getElementById('printModal');
      if (e.key === 'Escape' && activeModal && !activeModal.hidden) {
        if (currentCloseModal) currentCloseModal();
      }
    });
    keydownBound = true;
  }

  downloadBtn.addEventListener('click', () => {
    window.open(pdfUrl, '_blank');
    closeModal();
  });

  printBtn.addEventListener('click', () => {
    closeModal();
    setTimeout(() => window.print(), 100);
  });

  closeBtn.addEventListener('click', closeModal);

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
}

// Run on initial page load
document.addEventListener('DOMContentLoaded', () => {
  initPrintHandler();
});
