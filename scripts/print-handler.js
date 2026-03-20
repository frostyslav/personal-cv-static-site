// Print handler - redirect to PDF
window.addEventListener('beforeprint', e => {
  e.preventDefault();
  window.open(
    'https://cv.rostyslav.eu/files/CV_Rostyslav_Fridman.pdf',
    '_blank'
  );
  return false;
});

// Alternative: Override Ctrl+P / Cmd+P
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    window.open(
      'https://cv.rostyslav.eu/files/CV_Rostyslav_Fridman.pdf',
      '_blank'
    );
    return false;
  }
});
