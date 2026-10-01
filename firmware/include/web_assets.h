#pragma once

#include <Arduino.h>

static const char HTML_INDEX[] PROGMEM = R"rawliteral(
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>C3 Music</title>
  <style>
    :root {
      --bg: #000000;
      --surface: #111215;
      --surface-elevated: #181a1f;
      --surface-high: #21242b;
      --border: rgba(255, 255, 255, 0.08);
      --text: #e6e1e5;
      --text-muted: #95909a;
      --primary: #d0bcff;
      --primary-container: #381e72;
      --on-primary: #1d0160;
      --accent: #c4b0f0;
      --success: #a8dab5;
      --warning: #fce18a;
      --danger: #f2b8b5;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Google Sans", sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding-bottom: 84px;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 30;
      background: rgba(0, 0, 0, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; color: var(--text); }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      color: var(--text-muted);
    }
    .badge.ok { color: var(--success); border-color: rgba(168, 218, 181, 0.25); background: rgba(168, 218, 181, 0.08); }
    .badge.warn { color: var(--warning); border-color: rgba(252, 225, 138, 0.25); background: rgba(252, 225, 138, 0.08); }
    .badge.err { color: var(--danger); border-color: rgba(242, 184, 181, 0.25); background: rgba(242, 184, 181, 0.08); }
    
    main { max-width: 620px; width: 100%; margin: 0 auto; padding: 18px 16px; flex: 1; }
    .tab-content { display: none; }
    .tab-content.active { display: block; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 14px; }
    
    /* Now Playing Visuals */
    .player-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px 0 24px;
    }
    .disc-container {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1f2229 0%, #0e1014 100%);
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    }
    .disc-inner {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-container);
      border: 2px solid rgba(255,255,255,0.15);
    }
    .track-status { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .track-meta { font-size: 13px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    
    /* Subtle Level Bars */
    .vu-meter {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      height: 28px;
      margin: 16px 0;
    }
    .vu-bar {
      width: 4px;
      height: 6px;
      background: var(--primary);
      opacity: 0.4;
      border-radius: 2px;
      transition: height 0.15s ease, opacity 0.15s ease;
    }
    .active-play .vu-bar { opacity: 0.9; }

    /* Buffer Progress */
    .buffer-track {
      background: var(--surface-high);
      height: 8px;
      border-radius: 999px;
      overflow: hidden;
      margin: 10px 0 6px;
    }
    .buffer-fill {
      height: 100%;
      width: 0%;
      background: var(--primary);
      border-radius: 999px;
      transition: width 0.25s ease;
    }

    /* Key-Value Rows */
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 13px;
    }
    .row:last-child { border-bottom: none; }
    .row-label { color: var(--text-muted); }
    .row-val { font-weight: 500; color: var(--text); font-variant-numeric: tabular-nums; }

    /* Buttons */
    .btn-group { display: flex; gap: 10px; margin-top: 14px; }
    button {
      flex: 1;
      height: 44px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid var(--border);
      background: var(--surface-elevated);
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    button:active { transform: scale(0.98); }
    button.primary {
      background: var(--primary);
      color: var(--on-primary);
      border: none;
    }
    button.danger {
      background: rgba(242, 184, 181, 0.12);
      color: var(--danger);
      border-color: rgba(242, 184, 181, 0.3);
    }

    /* Form Fields */
    .field { margin-bottom: 14px; }
    .field label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
    input[type="text"], input[type="number"], select {
      width: 100%;
      height: 44px;
      background: #08080a;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 0 14px;
      color: var(--text);
      font-size: 14px;
      font-family: inherit;
    }
    input:focus, select:focus {
      outline: none;
      border-color: var(--primary);
    }
    .switch-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }
    input[type="range"] {
      width: 100%;
      accent-color: var(--primary);
      margin: 8px 0;
    }
    .switch {
      position: relative;
      width: 46px;
      height: 26px;
      appearance: none;
      background: #252830;
      border-radius: 999px;
      cursor: pointer;
      outline: none;
      transition: background 0.2s;
    }
    .switch:checked { background: var(--primary); }
    .switch::before {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      top: 3px;
      left: 3px;
      background: #fff;
      transition: transform 0.2s;
    }
    .switch:checked::before {
      transform: translateX(20px);
      background: var(--on-primary);
    }

    /* Fixed Bottom Nav (4 Tabs) */
    nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 40;
      background: rgba(0, 0, 0, 0.96);
      backdrop-filter: blur(20px);
      border-top: 1px solid var(--border);
      display: flex;
      height: 68px;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 0;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 500;
      gap: 3px;
    }
    .nav-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .nav-btn.active { color: var(--primary); font-weight: 700; }
    .nav-btn.active svg { stroke: var(--primary); }

    /* Toast */
    #toast {
      position: fixed;
      bottom: 84px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: var(--surface-high);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 10px 18px;
      border-radius: 999px;
      font-size: 13px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s ease;
      z-index: 50;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  </style>
</head>
<body>

  <!-- Top Bar -->
  <header>
    <div class="brand">C3 Music</div>
    <div class="badge" id="stateBadge">
      <span id="stateDot">●</span>
      <span id="stateText">Ready</span>
    </div>
  </header>

  <!-- 4 Main App Tabs -->
  <main>
    <!-- TAB 1: NOW PLAYING -->
    <div class="tab-content active" id="tab-now">
      <div class="card player-hero">
        <div class="disc-container">
          <div class="disc-inner"></div>
        </div>
        <div class="track-status" id="heroStatus">Ready</div>
        <div class="track-meta" id="heroMeta">Waiting for audio stream</div>

        <div class="vu-meter" id="vuMeter">
          <div class="vu-bar" style="height: 12px;"></div>
          <div class="vu-bar" style="height: 18px;"></div>
          <div class="vu-bar" style="height: 24px;"></div>
          <div class="vu-bar" style="height: 16px;"></div>
          <div class="vu-bar" style="height: 22px;"></div>
          <div class="vu-bar" style="height: 14px;"></div>
          <div class="vu-bar" style="height: 20px;"></div>
        </div>

        <div style="width: 100%; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
            <span>Buffer Occupancy</span>
            <span id="bufPercentText">0%</span>
          </div>
          <div class="buffer-track">
            <div class="buffer-fill" id="bufBar"></div>
          </div>
        </div>

        <div class="btn-group" style="width: 100%; margin-top: 20px;">
          <button class="primary" onclick="postAction('/api/stream/start')">Start</button>
          <button onclick="postAction('/api/stream/stop')">Stop</button>
          <button onclick="postAction('/api/stream/reconnect')">Reconnect</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Stream Telemetry</div>
        <div class="row">
          <span class="row-label">Mode / Host</span>
          <span class="row-val" id="teleHost">—</span>
        </div>
        <div class="row">
          <span class="row-label">Format</span>
          <span class="row-val" id="teleFormat">—</span>
        </div>
        <div class="row">
          <span class="row-label">Session Duration</span>
          <span class="row-val" id="teleSession">00:00</span>
        </div>
        <div class="row">
          <span class="row-label">Buffer Underruns</span>
          <span class="row-val" id="teleUnderruns">0</span>
        </div>
      </div>
    </div>

    <!-- TAB 2: WI-FI -->
    <div class="tab-content" id="tab-wifi">
      <div class="card">
        <div class="card-title">Wi-Fi Connection</div>
        <div class="row">
          <span class="row-label">SSID</span>
          <span class="row-val" id="wifiSsid">—</span>
        </div>
        <div class="row">
          <span class="row-label">IP Address</span>
          <span class="row-val" id="wifiIp">—</span>
        </div>
        <div class="row">
          <span class="row-label">mDNS Hostname</span>
          <span class="row-val">http://c3music.local</span>
        </div>
        <div class="row">
          <span class="row-label">Signal (RSSI)</span>
          <span class="row-val" id="wifiRssi">—</span>
        </div>
        <div style="margin-top: 16px;">
          <button onclick="postAction('/api/wifi/reconnect')">Reconnect Wi-Fi</button>
        </div>
      </div>
    </div>

    <!-- TAB 3: STREAMING SETUP -->
    <div class="tab-content" id="tab-stream">
      <div class="card">
        <div class="card-title">Stream Configuration</div>
        <div style="background: #16181f; border: 1px solid rgba(208, 188, 255, 0.2); border-radius: 20px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em;">Wi-Fi Auto-Discovery</span>
            <span id="scanStatusBadge" style="font-size: 11px; color: var(--text-muted);">Subnet Scanner</span>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Auto-detect audio transmitter on your home Wi-Fi instead of typing IP.</p>
          <button type="button" id="scanBtn" onclick="discoverStreamers()" style="width: 100%; height: 42px; font-size: 12px; font-weight: 600; background: rgba(208, 188, 255, 0.15); color: var(--primary); border: 1px solid rgba(208, 188, 255, 0.3);">
            🔍 Scan Home Wi-Fi for Streamers
          </button>
          <div id="discoveredBox" style="display: none; margin-top: 12px; padding: 10px 12px; background: #0c0d10; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;">
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Detected Stream Source:</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span id="discoveredHost" style="font-family: monospace; font-size: 13px; color: var(--primary); font-weight: 600;">—</span>
              <button type="button" onclick="useDiscoveredHost()" style="flex: 0 0 auto; height: 32px; padding: 0 14px; font-size: 11px; background: var(--primary); color: var(--on-primary); border: none;">Use This</button>
            </div>
          </div>
        </div>

        <div class="field">
          <label>Android Phone IP / Host (or auto)</label>
          <input type="text" id="cfgHost" placeholder="e.g. 192.168.1.50 or auto">
        </div>
        <div class="field">
          <label>Preferred Protocol</label>
          <select id="cfgMode">
            <option value="tcp">Raw TCP (Port 50005 - Ultra Low Latency)</option>
            <option value="http">HTTP WAV (Port 8080 - Auto Format Detect)</option>
          </select>
        </div>
        <div style="display: flex; gap: 12px;">
          <div class="field" style="flex: 1;">
            <label>TCP Port</label>
            <input type="number" id="cfgTcpPort" value="50005">
          </div>
          <div class="field" style="flex: 1;">
            <label>HTTP Port</label>
            <input type="number" id="cfgHttpPort" value="8080">
          </div>
        </div>

        <div class="field">
          <div style="display: flex; justify-content: space-between;">
            <label>Buffer Target Latency</label>
            <span id="bufMsLabel" style="font-size: 12px; color: var(--primary);">180 ms</span>
          </div>
          <input type="range" id="cfgBufferMs" min="80" max="600" step="10" value="180" oninput="document.getElementById('bufMsLabel').textContent = this.value + ' ms'">
        </div>

        <div class="switch-row">
          <span style="font-size: 13px;">Auto Protocol Fallback</span>
          <input type="checkbox" class="switch" id="cfgFallback">
        </div>
        <div class="switch-row">
          <span style="font-size: 13px;">Auto Reconnect on Drop</span>
          <input type="checkbox" class="switch" id="cfgAutoRecon">
        </div>

        <div style="margin-top: 14px;">
          <button class="primary" onclick="saveStreamSettings()">Save & Reconnect</button>
        </div>
      </div>
    </div>

    <!-- TAB 4: SETTINGS & OTA -->
    <div class="tab-content" id="tab-settings">
      <div class="card">
        <div class="card-title">Display Settings</div>
        <div class="switch-row">
          <div>
            <div style="font-size: 14px; font-weight: 500;">0.42" OLED Screen</div>
            <div style="font-size: 12px; color: var(--text-muted);">Toggle screen on / off</div>
          </div>
          <input type="checkbox" class="switch" id="cfgOled" onchange="toggleOled(this.checked)">
        </div>
      </div>

      <div class="card">
        <div class="card-title">Firmware OTA Update</div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Select compiled .bin firmware binary from PlatformIO:</p>
        <input type="file" id="otaFile" accept=".bin" style="margin-bottom: 10px; font-size: 12px;">
        <button id="otaBtn" onclick="uploadOta()">Install Firmware</button>
        <div id="otaProgressBox" style="display: none; margin-top: 10px;">
          <div class="buffer-track">
            <div class="buffer-fill" id="otaProgressBar" style="width: 0%;"></div>
          </div>
          <div id="otaStatus" style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Uploading...</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Hardware Pinout Reference</div>
        <div class="row">
          <span class="row-label">I2S BCLK</span>
          <span class="row-val">GPIO 3</span>
        </div>
        <div class="row">
          <span class="row-label">I2S WSEL (LRCLK)</span>
          <span class="row-val">GPIO 1</span>
        </div>
        <div class="row">
          <span class="row-label">I2S DOUT (DIN)</span>
          <span class="row-val">GPIO 10</span>
        </div>
        <div class="row">
          <span class="row-label">OLED I2C (SDA / SCL)</span>
          <span class="row-val">GPIO 5 / GPIO 6</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Maintenance</div>
        <div class="btn-group">
          <button onclick="postAction('/api/system/reboot')">Reboot</button>
          <button class="danger" onclick="if(confirm('Factory reset?'))postAction('/api/system/factory-reset')">Reset</button>
        </div>
      </div>
    </div>
  </main>

  <!-- 4 Fixed App Navigation Tabs -->
  <nav>
    <button class="nav-btn active" onclick="switchTab('now', this)">
      <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
      <span>Now Playing</span>
    </button>
    <button class="nav-btn" onclick="switchTab('wifi', this)">
      <svg viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
      <span>Wi-Fi</span>
    </button>
    <button class="nav-btn" onclick="switchTab('stream', this)">
      <svg viewBox="0 0 24 24"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>
      <span>Streaming</span>
    </button>
    <button class="nav-btn" onclick="switchTab('settings', this)">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      <span>Settings</span>
    </button>
  </nav>

  <div id="toast"></div>

  <script>
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2400);
    }

    function switchTab(tabId, el) {
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');
      el.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function postAction(url) {
      try {
        const res = await fetch(url, { method: 'POST' });
        const d = await res.json();
        showToast(d.ok ? 'Action applied' : (d.error || 'Failed'));
        setTimeout(pollStatus, 300);
      } catch(e) {
        showToast('Network error');
      }
    }

    let discoveredTarget = null;
    async function discoverStreamers() {
      const btn = document.getElementById('scanBtn');
      const badge = document.getElementById('scanStatusBadge');
      btn.disabled = true;
      btn.textContent = 'Scanning Subnet...';
      badge.textContent = 'Probing...';
      try {
        const res = await fetch('/api/stream/discover');
        const data = await res.json();
        if (data.found && data.host) {
          discoveredTarget = data;
          document.getElementById('discoveredHost').textContent = data.host + (data.port === 50005 ? ' (TCP 50005)' : ' (HTTP 8080)');
          document.getElementById('discoveredBox').style.display = 'block';
          badge.textContent = 'Found!';
          showToast('Found transmitter at ' + data.host);
        } else {
          showToast('No active stream found on subnet');
          badge.textContent = 'Not found';
        }
      } catch(e) {
        showToast('Scan request error');
      }
      btn.disabled = false;
      btn.textContent = '🔍 Scan Home Wi-Fi for Streamers';
    }

    function useDiscoveredHost() {
      if (discoveredTarget && discoveredTarget.host) {
        document.getElementById('cfgHost').value = discoveredTarget.host;
        if (discoveredTarget.port === 50005) document.getElementById('cfgMode').value = 'tcp';
        else if (discoveredTarget.port === 8080) document.getElementById('cfgMode').value = 'http';
        showToast('Applied ' + discoveredTarget.host);
      }
    }

    let configLoaded = false;
    async function loadConfig() {
      try {
        const r = await fetch('/api/config');
        if (!r.ok) return;
        const c = await r.json();
        document.getElementById('cfgHost').value = c.host || '';
        document.getElementById('cfgMode').value = c.mode || 'tcp';
        document.getElementById('cfgTcpPort').value = c.tcpPort || 50005;
        document.getElementById('cfgHttpPort').value = c.httpPort || 8080;
        document.getElementById('cfgBufferMs').value = c.bufferMs || 180;
        document.getElementById('bufMsLabel').textContent = (c.bufferMs || 180) + ' ms';
        document.getElementById('cfgFallback').checked = !!c.autoFallback;
        document.getElementById('cfgAutoRecon').checked = !!c.autoReconnect;
        document.getElementById('cfgOled').checked = !!c.oled;
        configLoaded = true;
      } catch(e) {}
    }

    async function saveStreamSettings() {
      const params = new URLSearchParams({
        host: document.getElementById('cfgHost').value.trim(),
        mode: document.getElementById('cfgMode').value,
        tcpPort: document.getElementById('cfgTcpPort').value,
        httpPort: document.getElementById('cfgHttpPort').value,
        bufferMs: document.getElementById('cfgBufferMs').value,
        autoFallback: document.getElementById('cfgFallback').checked ? '1' : '0',
        autoReconnect: document.getElementById('cfgAutoRecon').checked ? '1' : '0'
      });
      try {
        const r = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });
        const d = await r.json();
        showToast(d.ok ? 'Settings saved!' : 'Save failed');
        setTimeout(pollStatus, 400);
      } catch(e) {
        showToast('Save failed');
      }
    }

    async function toggleOled(enabled) {
      const params = new URLSearchParams({ oled: enabled ? '1' : '0' });
      await fetch('/api/config/oled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      showToast(enabled ? 'OLED turned ON' : 'OLED turned OFF');
    }

    function formatTime(sec) {
      sec = Number(sec || 0);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    async function pollStatus() {
      try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        if (!res.ok) throw 0;
        const d = await res.json();

        // Top Status Badge
        const badge = document.getElementById('stateBadge');
        document.getElementById('stateText').textContent = d.state || 'Ready';
        badge.className = 'badge ' + (d.state === 'Streaming' ? 'ok' : d.state === 'Buffering' ? 'warn' : 'ok');

        // Now Playing Hero
        document.getElementById('heroStatus').textContent = d.state || 'Ready';
        const meta = `${d.sampleRate || 44100} Hz · ${d.channels === 2 ? 'Stereo' : 'Mono'} · ${d.mode || 'TCP'}`;
        document.getElementById('heroMeta').textContent = meta;

        // Buffer Meter
        const pct = Math.min(100, Math.max(0, d.bufferPercent || 0));
        document.getElementById('bufBar').style.width = pct + '%';
        document.getElementById('bufPercentText').textContent = pct + '%';

        // Telemetry
        document.getElementById('teleHost').textContent = (d.host || '—') + ' (' + d.mode + ')';
        document.getElementById('teleFormat').textContent = `${d.sampleRate} Hz · 16-bit`;
        document.getElementById('teleSession').textContent = formatTime(d.sessionSeconds);
        document.getElementById('teleUnderruns').textContent = d.underruns || 0;

        // Wi-Fi tab
        document.getElementById('wifiSsid').textContent = d.ssid || 'Disconnected';
        document.getElementById('wifiIp').textContent = d.ip || '—';
        document.getElementById('wifiRssi').textContent = d.rssi ? d.rssi + ' dBm' : '—';

        if (!configLoaded) loadConfig();
      } catch(e) {
        document.getElementById('stateText').textContent = 'Offline';
        document.getElementById('stateBadge').className = 'badge err';
      }
    }

    function uploadOta() {
      const file = document.getElementById('otaFile').files[0];
      if (!file) {
        showToast('Choose .bin file first');
        return;
      }
      if (!confirm('Flash ' + file.name + ' over the air?')) return;

      const fd = new FormData();
      fd.append('firmware', file);

      const box = document.getElementById('otaProgressBox');
      const bar = document.getElementById('otaProgressBar');
      const txt = document.getElementById('otaStatus');
      const btn = document.getElementById('otaBtn');

      box.style.display = 'block';
      btn.disabled = true;

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const p = Math.round((e.loaded / e.total) * 100);
          bar.style.width = p + '%';
          txt.textContent = 'Uploading: ' + p + '%';
        }
      };
      xhr.onload = () => {
        btn.disabled = false;
        if (xhr.status === 200) {
          bar.style.width = '100%';
          txt.textContent = 'Success! Device is rebooting...';
          showToast('OTA Finished! Rebooting');
        } else {
          txt.textContent = 'OTA Failed: ' + xhr.responseText;
        }
      };
      xhr.open('POST', '/api/ota');
      xhr.send(fd);
    }

    setInterval(pollStatus, 1000);
    pollStatus();
  </script>
</body>
</html>
)rawliteral";
