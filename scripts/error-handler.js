// Global error handler — catches unhandled errors and promise rejections
(() => {
  const MAX_ERRORS = 10;
  let errorCount = 0;

  function logError(type, message, source, line, col) {
    if (errorCount >= MAX_ERRORS) return;
    errorCount++;

    const entry = {
      type,
      message,
      source: source || '',
      line: line || 0,
      col: col || 0,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // Log to console in a structured way
    console.error(
      `[${type}]`,
      entry.message,
      entry.source ? `@ ${entry.source}:${entry.line}:${entry.col}` : ''
    );

    // Store in sessionStorage for debugging (capped at MAX_ERRORS)
    try {
      const stored = JSON.parse(sessionStorage.getItem('__app_errors') || '[]');
      stored.push(entry);
      sessionStorage.setItem(
        '__app_errors',
        JSON.stringify(stored.slice(-MAX_ERRORS))
      );
    } catch {
      // sessionStorage unavailable — silently ignore
    }
  }

  window.addEventListener('error', event => {
    logError(
      'uncaught',
      event.message || 'Unknown error',
      event.filename,
      event.lineno,
      event.colno
    );
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    logError('unhandledrejection', message);
  });
})();
