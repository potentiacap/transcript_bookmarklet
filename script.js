(function () {
  // Clear existing observer if running
  if (window.myObserver) {
    window.myObserver.disconnect();
    console.log('[Transcript] Previous observer cleared');
  }

  window.transcript = [];

  function timestamp() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const d = Math.floor(now.getMilliseconds() / 100);
    return `${h}:${m}:${s}.${d}`;
  }

  window.myObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        const author = node.querySelector?.('[data-tid="author"]');
        const text = node.querySelector?.('[data-tid="closed-caption-text"]');

        if (author && text) {
          const entry = {
            t: timestamp(),
            author: author.innerText.trim(),
            text: text.innerText.trim()
          };
          window.transcript.push(entry);
          console.log(JSON.stringify(entry));
        }
      }
    }
  });

  window.myObserver.observe(document.body, { childList: true, subtree: true });
  console.log('[Transcript] Observer started. Run copy(JSON.stringify(window.transcript, null, 2)) to export.');
})();
