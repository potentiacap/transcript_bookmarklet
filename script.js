(function () {
  if (window.myObserver) { window.myObserver.disconnect(); window.myObserver = null; }
  if (window.__tsHeartbeat) { clearInterval(window.__tsHeartbeat); window.__tsHeartbeat = null; }
  ['__ts_panel', '__ts_dialog', '__ts_style'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });

  const PREFIX = '__transcript_';

  // DOM helper — avoids innerHTML to satisfy Teams Trusted Types policy
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_TAGS = new Set(['svg','defs','clipPath','mask','g','rect','path','linearGradient','radialGradient','stop']);
  function h(tag, props, ...children) {
    const el = SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (k === 'textContent') el.textContent = v;
      else if (k === 'cssText') el.style.cssText = v;
      else el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }

  function createLogo() {
    return h('svg', { xmlns: SVG_NS, width: '20', height: '20', viewBox: '0 0 512 512', cssText: 'flex-shrink:0;margin-right:7px;border-radius:4px;' },
      h('defs', {},
        h('clipPath', { id: '__ts_mc' }, h('rect', { width: '512', height: '512', rx: '115', ry: '115' })),
        h('mask', { id: '__ts_pm' },
          h('rect', { width: '512', height: '512', fill: 'white' }),
          h('g', { transform: 'translate(0,512) scale(0.1,-0.1)', fill: 'black', stroke: 'none' },
            h('path', { d: 'M0 2560 l0 -2560 2560 0 2560 0 0 2560 0 2560 -2560 0 -2560 0 0-2560z m2876 1505 c284 -49 507 -191 659 -420 125 -188 191 -406 202 -675 25-596 -277 -1073 -769 -1214 -309 -89 -660 -36 -863 129 l-55 45 0 -455 0 -455-345 0 -345 0 0 1505 0 1505 333 -2 332 -3 3 -110 3 -110 62 61 c175 170 487250 783 199z' }),
            h('path', { d: 'M2470 3450 c-181 -28 -325 -144 -389 -313 -47 -127 -51 -309 -10-444 29 -96 69 -160 139 -227 231 -220 631 -158 783 121 88 163 90 440 3 611-91 179 -311 285 -526 252z' })
          )
        ),
        h('linearGradient', { id: '__ts_bg', gradientUnits: 'userSpaceOnUse', x1: '0', y1: '0', x2: '350', y2: '512' },
          h('stop', { offset: '0%', 'stop-color': '#CC2030' }),
          h('stop', { offset: '100%', 'stop-color': '#6B0D15' })
        ),
        h('radialGradient', { id: '__ts_gl', gradientUnits: 'userSpaceOnUse', cx: '256', cy: '-30', r: '380' },
          h('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '0.28' }),
          h('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': '0' })
        ),
        h('linearGradient', { id: '__ts_sh', gradientUnits: 'userSpaceOnUse', x1: '0', y1: '300', x2: '0', y2: '512' },
          h('stop', { offset: '0%', 'stop-color': '#000000', 'stop-opacity': '0' }),
          h('stop', { offset: '100%', 'stop-color': '#000000', 'stop-opacity': '0.20' })
        )
      ),
      h('g', { 'clip-path': 'url(#__ts_mc)' },
        h('rect', { width: '512', height: '512', fill: 'url(#__ts_bg)' }),
        h('rect', { width: '512', height: '512', fill: '#ffffff', mask: 'url(#__ts_pm)' }),
        h('rect', { width: '512', height: '512', fill: 'url(#__ts_gl)' }),
        h('rect', { width: '512', height: '512', fill: 'url(#__ts_sh)' })
      )
    );
  }

  function timestamp() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const d = Math.floor(now.getMilliseconds() / 100);
    return `${h}:${m}:${s}.${d}`;
  }

  function newMeetingName() {
    const now = new Date();
    const date = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    return `Meeting at ${date} ${time}`;
  }

  function getMeetings() {
    const meetings = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) meetings.push(key.slice(PREFIX.length));
    }
    return meetings.sort().reverse();
  }

  function loadMeeting(name) {
    const data = localStorage.getItem(PREFIX + name);
    return data ? JSON.parse(data) : [];
  }

  function saveMeeting(name, entries) { localStorage.setItem(PREFIX + name, JSON.stringify(entries)); }
  function deleteMeeting(name) { localStorage.removeItem(PREFIX + name); }

  function downloadMeeting(name) {
    const blob = new Blob([JSON.stringify(loadMeeting(name), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.json';
    a.click();
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.id = '__ts_style';
    style.textContent = `
      #__ts_panel{position:fixed!important;width:300px!important;top:80px!important;right:20px!important;z-index:999999!important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;font-size:14px!important;box-shadow:0 4px 16px rgba(0,0,0,0.3)!important;border-radius:8px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;background:#1e1e1e!important;color:#e0e0e0!important;user-select:none!important;}
      #__ts_header{display:flex!important;align-items:center!important;padding:8px 10px!important;background:#2d2d2d!important;cursor:grab!important;flex-shrink:0!important;border-bottom:1px solid #444!important;}
      #__ts_header:active{cursor:grabbing!important;}
      #__ts_title{font-size:14px!important;font-weight:600!important;color:#ccc!important;}
      #__ts_chevron{color:#888!important;font-size:11px!important;margin:0 6px!important;flex-shrink:0!important;}
      #__ts_badge{background:#0078d4!important;color:#fff!important;border-radius:50%!important;min-width:22px!important;height:22px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:11px!important;font-weight:700!important;padding:0 4px!important;margin:0 8px!important;flex-shrink:0!important;transition:background 0.15s!important;}
      #__ts_badge.flash{background:#c00!important;}
      #__ts_close_btn{cursor:pointer!important;color:#888!important;font-size:14px!important;padding:2px 6px!important;flex-shrink:0!important;border-radius:3px!important;margin-left:4px!important;line-height:1!important;}
      #__ts_close_btn:hover{color:#fff!important;background:#c00!important;}
      #__ts_body{display:flex!important;flex-direction:column!important;overflow:hidden!important;}
      #__ts_controls{display:flex!important;gap:4px!important;padding:6px 8px!important;background:#252525!important;flex-shrink:0!important;border-bottom:1px solid #3a3a3a!important;}
      .ts-ctrl-btn{flex:1!important;padding:5px 0!important;border:1px solid #444!important;border-radius:4px!important;background:#333!important;color:#ccc!important;font-size:13px!important;cursor:pointer!important;font-family:inherit!important;}
      .ts-ctrl-btn:hover{background:#444!important;color:#fff!important;}
      .ts-ctrl-btn.danger{border-color:#6b2020!important;color:#f88!important;}
      .ts-ctrl-btn.danger:hover{background:#5a1a1a!important;}
      #__ts_list{overflow-y:auto!important;height:350px!important;padding:6px 0!important;background:#1e1e1e!important;}
      .ts-entry{padding:5px 10px 6px!important;border-bottom:1px solid #2a2a2a!important;}
      .ts-entry:last-child{border-bottom:none!important;}
      .ts-speaker{font-size:12px!important;color:#aaa!important;margin-bottom:2px!important;font-weight:500!important;}
      .ts-text{font-size:14px!important;color:#ddd!important;line-height:1.4!important;user-select:text!important;}
      #__ts_resize{height:6px!important;background:#2d2d2d!important;cursor:ns-resize!important;flex-shrink:0!important;border-top:1px solid #444!important;}
      #__ts_resize:hover{background:#0078d4!important;}
      #__ts_status{font-size:13px!important;color:#4caf50!important;padding:4px 10px!important;background:#1e1e1e!important;flex-shrink:0!important;border-top:1px solid #2a2a2a!important;}
    `;
    document.head.appendChild(style);
  }

  function createPanel(name) {
    const existing = document.getElementById('__ts_panel');
    if (existing) existing.remove();
    injectStyles();

    const badge    = h('span', { id: '__ts_badge', textContent: '0' });
    const chevron  = h('span', { id: '__ts_chevron', textContent: '▼' });
    const closeBtn = h('span', { id: '__ts_close_btn', title: 'Close', textContent: '✕' });
    const spacer   = h('span', { cssText: 'flex:1' });
    const header   = h('div',  { id: '__ts_header' }, createLogo(), h('span', { id: '__ts_title', textContent: 'Transcript Capture' }), chevron, spacer, badge, closeBtn);

    const restartBtn  = h('button', { class: 'ts-ctrl-btn',        id: '__ts_btn_restart',  textContent: 'Restart' });
    const downloadBtn = h('button', { class: 'ts-ctrl-btn',        id: '__ts_btn_download', textContent: 'Download' });
    const deleteBtn   = h('button', { class: 'ts-ctrl-btn danger', id: '__ts_btn_delete',   textContent: 'Delete' });
    const controls    = h('div',    { id: '__ts_controls' }, restartBtn, downloadBtn, deleteBtn);
    const list        = h('div',    { id: '__ts_list' });
    const status      = h('div',    { id: '__ts_status', textContent: '● ' + name });
    const body        = h('div',    { id: '__ts_body' }, controls, list, status);
    const resize      = h('div',    { id: '__ts_resize' });
    const panel       = h('div',    { id: '__ts_panel' }, header, body, resize);

    document.body.appendChild(panel);

    let collapsed = false;
    function toggleCollapse() {
      collapsed = !collapsed;
      body.style.setProperty('display', collapsed ? 'none' : 'flex', 'important');
      resize.style.setProperty('display', collapsed ? 'none' : 'block', 'important');
      chevron.textContent = collapsed ? '▶' : '▼';
    }

    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (window.myObserver) { window.myObserver.disconnect(); window.myObserver = null; }
      if (window.__tsHeartbeat) { clearInterval(window.__tsHeartbeat); window.__tsHeartbeat = null; }
      panel.remove();
    });

    restartBtn.addEventListener('click',  () => showDialog());
    downloadBtn.addEventListener('click', () => downloadMeeting(name));
    deleteBtn.addEventListener('click',   () => { if (confirm(`Delete "${name}"?`)) { deleteMeeting(name); panel.remove(); } });

    let drag = null, didMove = false;
    header.addEventListener('pointerdown', e => {
      if (e.target.closest('#__ts_close_btn')) return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty('right', 'auto', 'important');
      panel.style.setProperty('left', rect.left + 'px', 'important');
      panel.style.setProperty('top', rect.top + 'px', 'important');
      drag = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      didMove = false;
      header.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    header.addEventListener('pointermove', e => {
      if (!drag) return;
      didMove = true;
      panel.style.setProperty('left', Math.max(0, Math.min(window.innerWidth - 300, e.clientX - drag.x)) + 'px', 'important');
      panel.style.setProperty('top', Math.max(0, Math.min(window.innerHeight - 60, e.clientY - drag.y)) + 'px', 'important');
    });
    header.addEventListener('pointerup', e => {
      if (drag && !didMove) toggleCollapse();
      drag = null;
      header.releasePointerCapture(e.pointerId);
    });

    let resizing = null;
    resize.addEventListener('pointerdown', e => {
      resizing = { y: e.clientY, h: list.offsetHeight };
      resize.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    resize.addEventListener('pointermove', e => {
      if (!resizing) return;
      list.style.setProperty('height', Math.max(80, resizing.h + (e.clientY - resizing.y)) + 'px', 'important');
    });
    resize.addEventListener('pointerup', e => {
      resizing = null;
      resize.releasePointerCapture(e.pointerId);
    });
  }

  function addEntryToPanel(entry) {
    const list = document.getElementById('__ts_list');
    if (!list) return;
    list.appendChild(
      h('div', { class: 'ts-entry' },
        h('div', { class: 'ts-speaker', textContent: entry.author + ' · ' + entry.t }),
        h('div', { class: 'ts-text',    textContent: entry.text })
      )
    );
    list.scrollTop = list.scrollHeight;
    const badge = document.getElementById('__ts_badge');
    if (badge) {
      badge.textContent = window.transcript.length;
      badge.classList.add('flash');
      setTimeout(() => badge.classList.remove('flash'), 250);
    }
  }

  function startCapture(name, existingEntries) {
    if (window.myObserver) { window.myObserver.disconnect(); window.myObserver = null; }
    if (window.__tsHeartbeat) { clearInterval(window.__tsHeartbeat); window.__tsHeartbeat = null; }

    closeDialog();
    window.transcript = existingEntries || [];
    window.currentMeeting = name;

    createPanel(name);
    window.transcript.forEach(e => addEntryToPanel(e));

    let lastKey = null, lastKeyTime = 0;
    window.myObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          const author = node.querySelector?.('[data-tid="author"]');
          const text   = node.querySelector?.('[data-tid="closed-caption-text"]');
          if (author && text) {
            const capturedAt = timestamp();
            setTimeout(() => {
              const authorText = author.innerText.trim() || 'Unknown';
              const bodyText   = text.innerText.trim();
              if (!bodyText) return;
              const key = authorText + '|||' + bodyText;
              const now = Date.now();
              if (key === lastKey && now - lastKeyTime < 1000) return;
              lastKey = key; lastKeyTime = now;
              const entry = { t: capturedAt, author: authorText, text: bodyText };
              window.transcript.push(entry);
              saveMeeting(name, window.transcript);
              addEntryToPanel(entry);
              console.log(JSON.stringify(entry));
            }, 300);
          }
        }
      }
    });
    window.myObserver.observe(document.body, { childList: true, subtree: true });

    window.__tsHeartbeat = setInterval(() => {
      if (!window.myObserver) return;
      window.myObserver.disconnect();
      window.myObserver.observe(document.body, { childList: true, subtree: true });
    }, 30000);

    console.log(`[Transcript] Capturing: ${name} (${window.transcript.length} existing entries)`);
  }

  function closeDialog() {
    const d = document.getElementById('__ts_dialog');
    if (d) d.remove();
  }

  function btn(label, cssText, attrs) {
    return h('button', { textContent: label, cssText, ...attrs });
  }

  function showDialog() {
    closeDialog();
    const meetings = getMeetings();

    const overlay = h('div', { id: '__ts_dialog', cssText: 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' });

    const box = h('div', { cssText: 'background:#1e1e1e;border-radius:8px;padding:24px;width:520px;max-width:90vw;max-height:80vh;overflow-y:auto;color:#e0e0e0;box-shadow:0 8px 32px rgba(0,0,0,0.5);' });

    // Header row
    const titleRow = h('div', { cssText: 'display:flex;align-items:center;gap:10px;margin-bottom:16px;' },
      createLogo(),
      h('div', { textContent: 'TEAMS TRANSCRIPT', cssText: 'font-size:16px;font-weight:600;color:#ccc;letter-spacing:0.5px;' })
    );

    // Required settings
    const settings = h('div', { cssText: 'background:#252525;border:1px solid #3a3a3a;border-radius:6px;padding:14px 16px;margin-bottom:16px;' },
      h('div', { textContent: 'Required Settings', cssText: 'font-size:13px;font-weight:700;color:#fff;margin-bottom:10px;letter-spacing:0.3px;' }),
      h('div', { cssText: 'font-size:13px;color:#e0e0e0;line-height:1.9;' },
        'In Teams, open ', h('strong', { textContent: 'More (···)' }), ' → ', h('strong', { textContent: 'Language & speech' }), h('br', {}),
        'Enable ', h('strong', { textContent: 'Show live captions' }), h('br', {}),
        'In the captions panel, click the ', h('strong', { textContent: '⚙ cog' }), h('br', {}),
        'Set ', h('strong', { textContent: 'Spoken language' }), ' → Japanese', h('br', {}),
        'Set ', h('strong', { textContent: 'Your language' }), ' → English'
      )
    );

    const startBtn = btn('Start New Capture', `padding:8px 16px;background:#0078d4;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-bottom:${meetings.length ? '16px' : '0'};`, { 'data-action': 'start' });

    box.appendChild(titleRow);
    box.appendChild(settings);
    box.appendChild(startBtn);

    if (meetings.length) {
      box.appendChild(h('div', { textContent: 'SAVED TRANSCRIPTS', cssText: 'font-size:14px;color:#e0e0e0;letter-spacing:0.5px;margin-bottom:8px;' }));
      meetings.forEach((name, i) => {
        const entries = loadMeeting(name);
        const row = h('div', { cssText: 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;' },
          h('div', { cssText: 'flex:1;padding-right:10px;font-size:14px;color:#ddd;' },
            name + ' ',
            h('span', { textContent: `(${entries.length})`, cssText: 'color:#999;font-size:12px;' })
          ),
          h('div', { cssText: 'display:flex;gap:4px;flex-shrink:0;' },
            btn('Restart',  'padding:3px 8px;background:#333;color:#ccc;border:1px solid #555;border-radius:3px;cursor:pointer;font-size:13px;', { 'data-action': 'restart',  'data-index': i }),
            btn('Download', 'padding:3px 8px;background:#333;color:#ccc;border:1px solid #555;border-radius:3px;cursor:pointer;font-size:13px;', { 'data-action': 'download', 'data-index': i }),
            btn('Delete',   'padding:3px 8px;background:#2a1010;color:#f88;border:1px solid #5a2020;border-radius:3px;cursor:pointer;font-size:13px;', { 'data-action': 'delete',   'data-index': i })
          )
        );
        box.appendChild(row);
      });
    }

    box.appendChild(h('div', { cssText: 'margin-top:16px;' },
      btn('Close', 'padding:6px 12px;background:#333;color:#ccc;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:14px;', { 'data-action': 'close' })
    ));

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) { closeDialog(); return; }
      const b = e.target.closest('[data-action]');
      if (!b) return;
      const action = b.dataset.action;
      const idx    = b.dataset.index !== undefined ? parseInt(b.dataset.index) : null;
      const name   = idx !== null ? meetings[idx] : null;
      if      (action === 'start')    startCapture(newMeetingName(), []);
      else if (action === 'restart')  startCapture(name, loadMeeting(name));
      else if (action === 'download') downloadMeeting(name);
      else if (action === 'delete')   { if (confirm(`Delete "${name}"?`)) { deleteMeeting(name); showDialog(); } }
      else if (action === 'close')    closeDialog();
    });
  }

  showDialog();
})();
