// Unhandled JS errors (TypeError, ReferenceError, etc.)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error(JSON.stringify({
      level: 'client-error',
      timestamp: new Date().toISOString(),
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }));
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error(JSON.stringify({
      level: 'client-unhandled-rejection',
      timestamp: new Date().toISOString(),
      reason: event.reason?.message || String(event.reason),
    }));
  });
}
