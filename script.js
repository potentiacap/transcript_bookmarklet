(function () {
  if (window.myObserver) { window.myObserver.disconnect(); window.myObserver = null; }
  if (window.__tsHeartbeat) { clearInterval(window.__tsHeartbeat); window.__tsHeartbeat = null; }
  const existingPanel = document.getElementById('__ts_panel');
  if (existingPanel) existingPanel.remove();
  const existingDialog = document.getElementById('__ts_dialog');
  if (existingDialog) existingDialog.remove();
  const existingStyle = document.getElementById('__ts_style');
  if (existingStyle) existingStyle.remove();

  const PREFIX = '__transcript_';

  const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" style="flex-shrink:0;margin-right:7px;border-radius:4px;"><defs><clipPath id="__ts_mc"><rect width="512" height="512" rx="115" ry="115"/></clipPath><mask id="__ts_pm"><rect width="512" height="512" fill="white"/><g transform="translate(0,512) scale(0.1,-0.1)" fill="black" stroke="none"><path d="M0 2560 l0 -2560 2560 0 2560 0 0 2560 0 2560 -2560 0 -2560 0 0-2560z m2876 1505 c284 -49 507 -191 659 -420 125 -188 191 -406 202 -675 25-596 -277 -1073 -769 -1214 -309 -89 -660 -36 -863 129 l-55 45 0 -455 0 -455-345 0 -345 0 0 1505 0 1505 333 -2 332 -3 3 -110 3 -110 62 61 c175 170 487250 783 199z"/><path d="M2470 3450 c-181 -28 -325 -144 -389 -313 -47 -127 -51 -309 -10-444 29 -96 69 -160 139 -227 231 -220 631 -158 783 121 88 163 90 440 3 611-91 179 -311 285 -526 252z"/></g></mask><linearGradient id="__ts_bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="350" y2="512"><stop offset="0%" stop-color="#CC2030"/><stop offset="100%" stop-color="#6B0D15"/></linearGradient><radialGradient id="__ts_gl" gradientUnits="userSpaceOnUse" cx="256" cy="-30" r="380"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient><linearGradient id="__ts_sh" gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="512"><stop offset="0%" stop-color="#000000" stop-opacity="0"/><stop offset="100%" stop-color="#000000" stop-opacity="0.20"/></linearGradient></defs><g clip-path="url(#__ts_mc)"><rect width="512" height="512" fill="url(#__ts_bg)"/><rect width="512" height="512" fill="#ffffff" mask="url(#__ts_pm)"/><rect width="512" height="512" fill="url(#__ts_gl)"/><rect width="512" height="512" fill="url(#__ts_sh)"/></g></svg>`;

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

  function saveMeeting(name, entries) {
    localStorage.setItem(PREFIX + name, JSON.stringify(entries));
  }

  function deleteMeeting(name) {
    localStorage.removeItem(PREFIX + name);
  }

  function downloadMeeting(name) {
    const entries = loadMeeting(name);
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.json';
    a.click();
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.id = '__ts_style';
    style.textContent = `
      #__ts_panel {
        position: fixed !important;
        width: 300px !important;
        top: 80px !important;
        right: 20px !important;
        z-index: 999999 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        font-size: 14px !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        background: #1e1e1e !important;
        color: #e0e0e0 !important;
        user-select: none !important;
      }
      #__ts_header {
        display: flex !important;
        align-items: center !important;
        padding: 8px 10px !important;
        background: #2d2d2d !important;
        cursor: grab !important;
        flex-shrink: 0 !important;
        border-bottom: 1px solid #444 !important;
      }
      #__ts_header:active { cursor: grabbing !important; }
      #__ts_title {
        font-size: 14px !important;
        font-weight: 600 !important;
        color: #ccc !important;
      }
      #__ts_chevron {
        color: #888 !important;
        font-size: 11px !important;
        margin: 0 6px !important;
        flex-shrink: 0 !important;
      }
      #__ts_close_btn {
        cursor: pointer !important;
        color: #888 !important;
        font-size: 14px !important;
        padding: 2px 6px !important;
        flex-shrink: 0 !important;
        border-radius: 3px !important;
        margin-left: 4px !important;
        line-height: 1 !important;
      }
      #__ts_close_btn:hover { color: #fff !important; background: #c00 !important; }
      #__ts_badge {
        background: #0078d4 !important;
        color: #fff !important;
        border-radius: 50% !important;
        min-width: 22px !important;
        height: 22px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        padding: 0 4px !important;
        margin: 0 8px !important;
        flex-shrink: 0 !important;
        transition: background 0.15s !important;
      }
      #__ts_badge.flash { background: #c00 !important; }
      #__ts_body {
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }
      #__ts_controls {
        display: flex !important;
        gap: 4px !important;
        padding: 6px 8px !important;
        background: #252525 !important;
        flex-shrink: 0 !important;
        border-bottom: 1px solid #3a3a3a !important;
      }
      .ts-ctrl-btn {
        flex: 1 !important;
        padding: 5px 0 !important;
        border: 1px solid #444 !important;
        border-radius: 4px !important;
        background: #333 !important;
        color: #ccc !important;
        font-size: 13px !important;
        cursor: pointer !important;
        font-family: inherit !important;
      }
      .ts-ctrl-btn:hover { background: #444 !important; color: #fff !important; }
      .ts-ctrl-btn.danger { border-color: #6b2020 !important; color: #f88 !important; }
      .ts-ctrl-btn.danger:hover { background: #5a1a1a !important; }
      #__ts_list {
        overflow-y: auto !important;
        height: 350px !important;
        padding: 6px 0 !important;
        background: #1e1e1e !important;
      }
      .ts-entry {
        padding: 5px 10px 6px !important;
        border-bottom: 1px solid #2a2a2a !important;
      }
      .ts-entry:last-child { border-bottom: none !important; }
      .ts-speaker {
        font-size: 12px !important;
        color: #aaa !important;
        margin-bottom: 2px !important;
        font-weight: 500 !important;
      }
      .ts-text {
        font-size: 14px !important;
        color: #ddd !important;
        line-height: 1.4 !important;
        user-select: text !important;
      }
      #__ts_resize {
        height: 6px !important;
        background: #2d2d2d !important;
        cursor: ns-resize !important;
        flex-shrink: 0 !important;
        border-top: 1px solid #444 !important;
      }
      #__ts_resize:hover { background: #0078d4 !important; }
      #__ts_status {
        font-size: 13px !important;
        color: #4caf50 !important;
        padding: 4px 10px !important;
        background: #1e1e1e !important;
        flex-shrink: 0 !important;
        border-top: 1px solid #2a2a2a !important;
      }
    `;
    document.head.appendChild(style);
  }

  function createPanel(name) {
    const existing = document.getElementById('__ts_panel');
    if (existing) existing.remove();

    injectStyles();

    const panel = document.createElement('div');
    panel.id = '__ts_panel';

    panel.innerHTML = `
      <div id="__ts_header">
        ${LOGO_SVG}
        <span id="__ts_title">Transcript Capture</span>
        <span id="__ts_chevron">▼</span>
        <span style="flex:1"></span>
        <span id="__ts_badge">0</span>
        <span id="__ts_close_btn" title="Close">✕</span>
      </div>
      <div id="__ts_body">
        <div id="__ts_controls">
          <button class="ts-ctrl-btn" id="__ts_btn_restart">Restart</button>
          <button class="ts-ctrl-btn" id="__ts_btn_download">Download</button>
          <button class="ts-ctrl-btn danger" id="__ts_btn_delete">Delete</button>
        </div>
        <div id="__ts_list"></div>
        <div id="__ts_status">● ${name}</div>
      </div>
      <div id="__ts_resize"></div>
    `;

    document.body.appendChild(panel);

    const header = document.getElementById('__ts_header');
    const body = document.getElementById('__ts_body');
    const chevron = document.getElementById('__ts_chevron');
    const closeBtn = document.getElementById('__ts_close_btn');
    const list = document.getElementById('__ts_list');
    const resize = document.getElementById('__ts_resize');

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

    document.getElementById('__ts_btn_restart').addEventListener('click', () => showDialog());
    document.getElementById('__ts_btn_download').addEventListener('click', () => downloadMeeting(name));
    document.getElementById('__ts_btn_delete').addEventListener('click', () => {
      if (confirm(`Delete "${name}"?`)) { deleteMeeting(name); panel.remove(); }
    });

    let drag = null;
    let didMove = false;
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

    return list;
  }

  function addEntryToPanel(entry) {
    const list = document.getElementById('__ts_list');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'ts-entry';
    div.innerHTML = `<div class="ts-speaker">${entry.author} · ${entry.t}</div><div class="ts-text">${entry.text}</div>`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
    const badge = document.getElementById('__ts_badge');
    if (badge) {
      badge.textContent = window.transcript.length;
      badge.classList.add('flash');
      setTimeout(() => badge.classList.remove('flash'), 250);
    }
  }

  function startCapture(name, existingEntries) {
    closeDialog();
    window.transcript = existingEntries || [];
    window.currentMeeting = name;

    createPanel(name);
    window.transcript.forEach(e => addEntryToPanel(e));

    if (window.myObserver) { window.myObserver.disconnect(); window.myObserver = null; }

    let lastKey = null;
    let lastKeyTime = 0;

    window.myObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          const author = node.querySelector?.('[data-tid="author"]');
          const text = node.querySelector?.('[data-tid="closed-caption-text"]');
          if (author && text) {
            const authorText = author.innerText.trim();
            const bodyText = text.innerText.trim();
            const key = authorText + '|||' + bodyText;
            const now = Date.now();
            if (key === lastKey && now - lastKeyTime < 1000) continue;
            lastKey = key;
            lastKeyTime = now;
            const entry = { t: timestamp(), author: authorText, text: bodyText };
            window.transcript.push(entry);
            saveMeeting(name, window.transcript);
            addEntryToPanel(entry);
            console.log(JSON.stringify(entry));
          }
        }
      }
    });
    window.myObserver.observe(document.body, { childList: true, subtree: true });

    window.__tsHeartbeat = setInterval(() => {
      if (!window.myObserver) return;
      window.myObserver.disconnect();
      window.myObserver.observe(document.body, { childList: true, subtree: true });
      console.log(`[Transcript] Heartbeat: ${window.transcript.length} entries captured`);
    }, 30000);

    console.log(`[Transcript] Capturing: ${name} (${window.transcript.length} existing entries)`);
  }

  function closeDialog() {
    const d = document.getElementById('__ts_dialog');
    if (d) d.remove();
  }

  function showDialog() {
    closeDialog();
    const meetings = getMeetings();

    const overlay = document.createElement('div');
    overlay.id = '__ts_dialog';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

    let rowsHtml = '';
    meetings.forEach((name, i) => {
      const entries = loadMeeting(name);
      rowsHtml += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
          <div style="flex:1;padding-right:10px;font-size:14px;color:#ddd;">${name} <span style="color:#999;font-size:12px;">(${entries.length})</span></div>
          <div style="display:flex;gap:4px;flex-shrink:0;">
            <button style="padding:3px 8px;background:#333;color:#ccc;border:1px solid #555;border-radius:3px;cursor:pointer;font-size:13px;" data-action="restart" data-index="${i}">Restart</button>
            <button style="padding:3px 8px;background:#333;color:#ccc;border:1px solid #555;border-radius:3px;cursor:pointer;font-size:13px;" data-action="download" data-index="${i}">Download</button>
            <button style="padding:3px 8px;background:#2a1010;color:#f88;border:1px solid #5a2020;border-radius:3px;cursor:pointer;font-size:13px;" data-action="delete" data-index="${i}">Delete</button>
          </div>
        </div>`;
    });

    overlay.innerHTML = `
      <div style="background:#1e1e1e;border-radius:8px;padding:24px;width:520px;max-width:90vw;max-height:80vh;overflow-y:auto;color:#e0e0e0;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          ${LOGO_SVG}
          <div style="font-size:16px;font-weight:600;color:#ccc;letter-spacing:0.5px;">TEAMS TRANSCRIPT</div>
        </div>
        <div style="background:#252525;border:1px solid #3a3a3a;border-radius:6px;padding:14px 16px;margin-bottom:16px;">
          <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:10px;letter-spacing:0.3px;">Required Settings</div>
          <div style="font-size:13px;color:#e0e0e0;line-height:1.7;">
            In Teams, open <strong style="color:#fff;">More (···)</strong> → <strong style="color:#fff;">Language &amp; speech</strong><br>
            Enable <strong style="color:#fff;">Show live captions</strong><br>
            In the captions panel, click the <strong style="color:#fff;">⚙ cog</strong><br>
            Set <strong style="color:#fff;">Spoken language</strong> → Japanese<br>
            Set <strong style="color:#fff;">Your language</strong> → English
          </div>
        </div>
        <button data-action="start" style="padding:8px 16px;background:#0078d4;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-bottom:${meetings.length ? '16px' : '0'};">Start New Capture</button>
        ${meetings.length ? `<div style="font-size:14px;color:#e0e0e0;letter-spacing:0.5px;margin-bottom:8px;">SAVED TRANSCRIPTS</div>${rowsHtml}` : ''}
        <div style="margin-top:16px;">
          <button data-action="close" style="padding:6px 12px;background:#333;color:#ccc;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:14px;">Close</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) { closeDialog(); return; }
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const idx = btn.dataset.index !== undefined ? parseInt(btn.dataset.index) : null;
      const name = idx !== null ? meetings[idx] : null;
      if (action === 'start') startCapture(newMeetingName(), []);
      else if (action === 'restart') startCapture(name, loadMeeting(name));
      else if (action === 'download') downloadMeeting(name);
      else if (action === 'delete') { if (confirm(`Delete "${name}"?`)) { deleteMeeting(name); showDialog(); } }
      else if (action === 'close') closeDialog();
    });
  }

  showDialog();
})();
