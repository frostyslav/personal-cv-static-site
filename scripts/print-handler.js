// Print handler — redirect Ctrl+P / Cmd+P to PDF download
// Note: beforeprint is not cancelable, so we only intercept the keyboard shortcut.
(() => {
  const pdfUrl = 'https://cv.rostyslav.eu/files/CV_Rostyslav_Fridman.pdf';

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      window.open(pdfUrl, '_blank');
    }
  });
})();
