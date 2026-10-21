// Firewall live page — legge api/firewall.json ogni 30 s e disegna la dashboard
(function () {
  'use strict';

  var SNAPSHOT_URL = 'api/firewall.json';
  var REFRESH_MS = 30000;
  var latest = null;

  function t(key, fallback) {
    return (window.LANG && LANG.t) ? LANG.t(key) : fallback;
  }

  function num(v, suffix, decimals) {
    if (v === null || v === undefined || isNaN(v)) return t('fw.na', 'n/d');
    return Number(v).toFixed(decimals || 0) + (suffix || '');
  }

  function bytes(v) {
    if (v === null || v === undefined) return t('fw.na', 'n/d');
    var u = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = 0;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return v.toFixed(v >= 100 ? 0 : 1) + ' ' + u[i];
  }

  function uptime(s) {
    if (!s && s !== 0) return t('fw.na', 'n/d');
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    if (d > 0) return d + t('fw.d', 'd') + ' ' + h + t('fw.h', 'h');
    if (h > 0) return h + t('fw.h', 'h') + ' ' + m + t('fw.m', 'm');
    return m + t('fw.m', 'm');
  }

  function setText(root, sel, value) {
    var el = root.querySelector(sel);
    if (el) el.textContent = value;
  }

  function renderDevice(dev) {
    var root = document.querySelector('[data-device="' + dev.id + '"]');
    if (!root) return;
    var status = root.querySelector('.fw-status');
    var up = dev.status === 'up';
    status.className = 'fw-status' + (up ? ' up' : '');
    status.querySelector('.state').textContent = up ? t('fw.online', 'ONLINE') : t('fw.offline', 'OFFLINE');

    setText(root, '[data-k="latency"]', num(dev.latency_ms, ' ms', 1));
    setText(root, '[data-k="cpu"]', num(dev.cpu_pct, ' %', 1));
    setText(root, '[data-k="mem"]', num(dev.mem_used_pct, ' %', 1));
    setText(root, '[data-k="ct"]', num(dev.conntrack, '', 0));
    setText(root, '[data-k="tls"]', dev.tls_days == null ? t('fw.na', 'n/d') : dev.tls_days + ' ' + t('fw.d', 'd'));
    setText(root, '[data-k="uptime"]', uptime(dev.uptime_s));
    setText(root, '[data-k="temp"]', num(dev.temp_c, ' °C', 1));
    setText(root, '[data-k="version"]', dev.version || t('fw.na', 'n/d'));
    if (dev.load && dev.load.length) {
      setText(root, '[data-k="load"]', dev.load.map(function (x) { return Number(x).toFixed(2); }).join(' / '));
    } else {
      setText(root, '[data-k="load"]', t('fw.na', 'n/d'));
    }
    var gw = dev.gateway || {};
    if (gw.delay_ms != null || gw.loss_pct != null) {
      var parts = [];
      if (gw.delay_ms != null) parts.push(Number(gw.delay_ms).toFixed(1) + ' ms');
      if (gw.loss_pct != null) parts.push(Number(gw.loss_pct).toFixed(1) + '% loss');
      setText(root, '[data-k="gw"]', parts.join(' · '));
    } else {
      setText(root, '[data-k="gw"]', t('fw.na', 'n/d'));
    }
    var apiEl = root.querySelector('[data-k="api"]');
    if (apiEl) {
      apiEl.textContent = dev.api ? t('fw.source_api', 'API in sola lettura') : t('fw.source_api_down', 'API non raggiungibile');
    }
    var wan = dev.wan || {};
    var wanTxt = wan.up
      ? t('fw.wan_up', 'up') + (wan.rx_bytes != null ? ' · ↓ ' + bytes(wan.rx_bytes) + ' ↑ ' + bytes(wan.tx_bytes) : '')
      : (dev.id === 'opnsense' ? t('fw.na', 'n/d') : t('fw.wan_down', 'down'));
    setText(root, '[data-k="wan"]', wanTxt);
  }

  function sparkline(values, colorA, valuesB, colorB) {
    var w = 300, h = 70, pad = 4;
    var all = values.concat(valuesB || []).filter(function (v) { return v != null; });
    if (!all.length) return '<div class="empty">' + t('fw.na', 'n/d') + '</div>';
    var min = Math.min.apply(null, all);
    var max = Math.max.apply(null, all);
    if (max === min) { max = min + 1; }
    function path(arr) {
      var pts = [];
      var n = arr.length;
      for (var i = 0; i < n; i++) {
        if (arr[i] == null) continue;
        var x = pad + (w - pad * 2) * (n <= 1 ? 1 : i / (n - 1));
        var y = h - pad - (h - pad * 2) * ((arr[i] - min) / (max - min));
        pts.push(x.toFixed(1) + ',' + y.toFixed(1));
      }
      return pts.length ? 'M' + pts.join(' L') : '';
    }
    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">';
    svg += '<path d="' + path(values) + '" fill="none" stroke="' + colorA + '" stroke-width="1.8"/>';
    if (valuesB) svg += '<path d="' + path(valuesB) + '" fill="none" stroke="' + colorB + '" stroke-width="1.8" stroke-dasharray="4 3"/>';
    svg += '</svg>';
    return svg;
  }

  function renderCharts(history) {
    var body = {};
    document.querySelectorAll('[data-chart]').forEach(function (el) { body[el.getAttribute('data-chart')] = el; });
    if (!history || !history.length) {
      Object.keys(body).forEach(function (k) { body[k].innerHTML = '<div class="empty">' + t('fw.na', 'n/d') + '</div>'; });
      return;
    }
    var cpu = history.map(function (p) { return p.mikrotik_cpu; });
    var mem = history.map(function (p) { return p.mikrotik_mem; });
    var lat = history.map(function (p) { return p.opnsense_ms; });
    var atk = history.map(function (p) { return p.attacks_5min; });
    body.cpu.innerHTML = sparkline(cpu, '#00f0ff', mem, '#ffb020');
    body.latency.innerHTML = sparkline(lat, '#4ade80');
    body.attacks.innerHTML = sparkline(atk, '#ff6b6b');

    // WAN rate (Mbps) dalle differenze dei contatori
    var rates = [];
    for (var i = 1; i < history.length; i++) {
      var a = history[i - 1], b = history[i];
      var dt = (new Date(b.t) - new Date(a.t)) / 1000;
      if (dt > 0 && a.wan_rx != null && b.wan_rx != null && b.wan_rx >= a.wan_rx) {
        rates.push(((b.wan_rx - a.wan_rx) * 8) / dt / 1e6);
      } else {
        rates.push(null);
      }
    }
    body.wan.innerHTML = sparkline(rates, '#00f0ff');

    var lastCpu = cpu.length ? cpu[cpu.length - 1] : null;
    var lastMem = mem.length ? mem[mem.length - 1] : null;
    var lastLat = lat.length ? lat[lat.length - 1] : null;
    setText(document, '#fw-c1', (lastCpu == null ? 'n/d' : lastCpu + '%') + ' / ' + (lastMem == null ? 'n/d' : lastMem + '%'));
    setText(document, '#fw-c2', lastLat == null ? 'n/d' : lastLat + ' ms');
    setText(document, '#fw-c3', atk.length && atk[atk.length - 1] != null ? String(atk[atk.length - 1]) : 'n/d');
    var lastRate = rates.length ? rates[rates.length - 1] : null;
    setText(document, '#fw-c4', lastRate == null ? 'n/d' : lastRate.toFixed(2) + ' Mbps');
  }

  function renderAttacks(atk) {
    atk = atk || {};
    setText(document, '#fw-ev', atk.events_24h == null ? 'n/d' : String(atk.events_24h));
    setText(document, '#fw-src', atk.sources_24h == null ? 'n/d' : String(atk.sources_24h));
    setText(document, '#fw-5m', atk.events_5min == null ? 'n/d' : String(atk.events_5min));
    setText(document, '#fw-login', atk.login_failures_24h == null ? 'n/d' : String(atk.login_failures_24h));

    var top = atk.top_sources || [];
    var tbody = document.getElementById('fw-top');
    tbody.innerHTML = top.length
      ? top.map(function (s) { return '<tr><td>' + s.ip + '</td><td>' + s.count + '</td></tr>'; }).join('')
      : '<tr><td colspan="2">' + t('fw.na', 'n/d') + '</td></tr>';
  }

  function renderRules(devices) {
    var mk = (devices || []).filter(function (d) { return d.id === 'mikrotik'; })[0];
    var rows = [];
    if (mk && mk.rules) {
      if (mk.rules.input_drop_packets != null) rows.push(['input', mk.rules.input_drop_packets]);
      if (mk.rules.forward_drop_packets != null) rows.push(['forward', mk.rules.forward_drop_packets]);
    }
    var tbody = document.getElementById('fw-rules');
    tbody.innerHTML = rows.length
      ? rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('')
      : '<tr><td colspan="2">' + t('fw.na', 'n/d') + '</td></tr>';
  }

  function render(snap) {
    latest = snap;
    var when = snap && snap.generated_at ? new Date(snap.generated_at) : null;
    setText(document, '#fw-updated', when ? when.toLocaleString() : '—');
    (snap.devices || []).forEach(renderDevice);
    renderAttacks(snap.attacks);
    renderRules(snap.devices);
    renderCharts(snap.history);
  }

  function load() {
    fetch(SNAPSHOT_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(render)
      .catch(function () {
        setText(document, '#fw-updated', t('fw.na', 'n/d'));
      });
  }

  function grafana() {
    var slot = document.getElementById('fw-grafana-slot');
    if (!slot) return;
    fetch('/grafana/api/health', { cache: 'no-store', credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('no'); return r.json(); })
      .then(function () {
        slot.innerHTML = '<iframe title="Grafana firewall" loading="lazy" src="/grafana/d/firewall/firewall?kiosk&refresh=30s&from=now-6h&to=now"></iframe>';
      })
      .catch(function () {
        slot.innerHTML = '<div class="fallback">' + t('fw.grafana_unavailable') + '</div>';
      });
  }

  document.addEventListener('click', function (ev) {
    if (ev.target.closest && ev.target.closest('.lang-btn')) {
      setTimeout(function () { if (latest) render(latest); else load(); }, 80);
    }
  });

  load();
  grafana();
  setInterval(load, REFRESH_MS);
})();
