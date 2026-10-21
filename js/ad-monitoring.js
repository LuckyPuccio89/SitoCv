// Active Directory live page — legge api/ad.json ogni 30 s e disegna la dashboard
(function () {
  'use strict';

  var SNAPSHOT_URL = 'api/ad.json';
  var REFRESH_MS = 30000;
  var latest = null;

  function t(key, fallback) {
    return (window.LANG && LANG.t) ? LANG.t(key) : fallback;
  }

  function num(v, suffix, decimals) {
    if (v === null || v === undefined || isNaN(v)) return t('ad.na', 'n/d');
    return Number(v).toFixed(decimals === undefined ? 0 : decimals) + (suffix || '');
  }

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function setText(root, sel, value) {
    var el = (root.querySelector ? root : document).querySelector(sel);
    if (el) el.textContent = value;
  }

  function age(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return t('ad.na', 'n/d');
    seconds = Math.max(0, Math.floor(seconds));
    if (seconds < 60) return seconds + t('ad.secs', 's');
    if (seconds < 3600) return Math.floor(seconds / 60) + t('ad.m', 'm');
    var d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return d + t('ad.d', 'd') + ' ' + h + t('ad.h', 'h');
    return h + t('ad.h', 'h') + ' ' + m + t('ad.m', 'm');
  }

  function uptime(seconds) {
    if (!seconds && seconds !== 0) return t('ad.na', 'n/d');
    var d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return d + t('ad.d', 'd') + ' ' + h + t('ad.h', 'h');
    if (h > 0) return h + t('ad.h', 'h') + ' ' + m + t('ad.m', 'm');
    return m + t('ad.m', 'm');
  }

  function setStatus(el, up, label) {
    if (!el) return;
    el.className = 'ad-status' + (up ? ' up' : '');
    var state = el.querySelector('.state');
    if (state) state.textContent = label;
  }

  function sparkline(values, colorA, valuesB, colorB) {
    var w = 300, h = 80, pad = 5;
    var all = values.concat(valuesB || []).filter(function (v) { return v != null; });
    if (!all.length) return '<div class="empty">' + t('ad.na', 'n/d') + '</div>';
    var min = Math.min.apply(null, all);
    var max = Math.max.apply(null, all);
    if (max === min) { max = min + 1; }
    function path(arr) {
      var pts = [];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] == null) continue;
        var x = pad + (w - pad * 2) * (arr.length <= 1 ? 1 : i / (arr.length - 1));
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

  function renderServices(services) {
    var box = document.getElementById('ad-services');
    if (!box) return;
    if (!services || !services.length) {
      box.innerHTML = '<div class="ad-svc"><span class="name">' + t('ad.na', 'n/d') + '</span></div>';
      return;
    }
    box.innerHTML = services.map(function (s) {
      return '<div class="ad-svc">' +
        '<span class="name">' + esc(s.name) + '</span>' +
        '<span class="meta">' + uptime(s.uptime_s) + '</span>' +
        '<span class="' + (s.ok ? 'ok' : 'ko') + '">' + (s.ok ? t('ad.up', 'UP') : t('ad.down', 'DOWN')) + '</span>' +
        '</div>';
    }).join('');
  }

  function renderCharts(history) {
    var body = {};
    document.querySelectorAll('[data-chart]').forEach(function (el) { body[el.getAttribute('data-chart')] = el; });
    if (!history || !history.length) {
      Object.keys(body).forEach(function (k) { body[k].innerHTML = '<div class="empty">' + t('ad.na', 'n/d') + '</div>'; });
      setText(document, '#ad-c1', t('ad.na', 'n/d'));
      setText(document, '#ad-c2', t('ad.na', 'n/d'));
      return;
    }
    var fail = history.map(function (p) { return p.failures; });
    var ok = history.map(function (p) { return p.success; });
    var dur = history.map(function (p) { return p.duration_s; });
    if (body.auth) body.auth.innerHTML = sparkline(fail, '#ff6b6b', ok, '#4ade80');
    if (body.duration) body.duration.innerHTML = sparkline(dur, '#00f0ff');
    var lastFail = fail.length ? fail[fail.length - 1] : null;
    var lastOk = ok.length ? ok[ok.length - 1] : null;
    setText(document, '#ad-c1', (lastFail == null ? 'n/d' : lastFail) + ' / ' + (lastOk == null ? 'n/d' : lastOk));
    var lastDur = dur.length ? dur[dur.length - 1] : null;
    setText(document, '#ad-c2', lastDur == null ? 'n/d' : Number(lastDur).toFixed(2) + ' ' + t('ad.secs', 's'));
  }

  function render(snap) {
    latest = snap;
    if (!snap) return;

    var when = snap.generated_at ? new Date(snap.generated_at) : null;
    setText(document, '#ad-updated', when ? when.toLocaleString() : '—');

    var stale = false;
    if (when) {
      var ageS = Math.max(0, Math.round((Date.now() - when.getTime()) / 1000));
      stale = ageS > (snap.stale_after_s || 180);
      document.getElementById('ad-stale').innerHTML = stale
        ? '<span class="stale">· ' + t('ad.stale', 'STALE DATA') + ' (' + ageS + 's)</span>'
        : '';
    }

    var d = snap.domain || {};
    var c = snap.collector || {};
    var dir = snap.directory || {};
    var auth = snap.auth || {};
    var dns = snap.dns || {};
    var health = snap.health || {};
    var services = snap.services || [];

    var servicesUp = services.length > 0 && services.every(function (s) { return s.ok; });
    setStatus(document.getElementById('ad-domain-status'), !!c.ok && servicesUp && dir.dcs > 0,
      (c.ok && servicesUp && dir.dcs > 0) ? t('ad.online', 'ONLINE') : t('ad.offline', 'OFFLINE'));
    setStatus(document.getElementById('ad-services-status'), servicesUp,
      servicesUp ? t('ad.up', 'UP') : t('ad.down', 'DOWN'));
    setStatus(document.getElementById('ad-collector-status'), !!c.ok && !stale,
      (!!c.ok && !stale) ? t('ad.up', 'UP') : t('ad.down', 'DOWN'));

    setText(document, '[data-k="dc"]', d.dc || t('ad.na', 'n/d'));
    setText(document, '[data-k="version"]', d.version || t('ad.na', 'n/d'));
    setText(document, '[data-k="domain_level"]', d.domain_level || t('ad.na', 'n/d'));
    setText(document, '[data-k="forest_level"]', d.forest_level || t('ad.na', 'n/d'));
    setText(document, '[data-k="dcs"]', num(dir.dcs));
    setText(document, '[data-k="privileged"]', num(dir.privileged));

    setText(document, '[data-k="age"]', age(c.age_s));
    setText(document, '[data-k="duration"]', num(c.duration_s, ' s', 2));
    setText(document, '[data-k="sections"]', (c.sections_ok === undefined ? '—' : c.sections_ok) + '/' + (c.sections_total === undefined ? '—' : c.sections_total));
    setText(document, '[data-k="partial"]', num(c.partial_errors));

    renderServices(services);

    setText(document, '[data-k="users"]', num(dir.users));
    setText(document, '[data-k="users_enabled"]', num(dir.users_enabled));
    setText(document, '[data-k="users_disabled"]', num(dir.users_disabled));
    setText(document, '[data-k="users_locked"]', num(dir.users_locked));
    setText(document, '[data-k="computers"]', num(dir.computers));
    setText(document, '[data-k="groups"]', num(dir.groups));
    setText(document, '[data-k="ous"]', num(dir.ous));
    setText(document, '[data-k="pwd_never_expires"]', num(dir.pwd_never_expires));

    setText(document, '#ad-auth-success', num(auth.success_1h));
    setText(document, '#ad-auth-failures', num(auth.failures_1h));
    setText(document, '#ad-auth-lockouts', num(auth.lockouts_1h));

    setText(document, '#ad-dns-zones', num(dns.zones));
    setText(document, '#ad-dns-srv', num(dns.srv_ok) + '/' + num(dns.srv_total));
    setText(document, '#ad-dns-xfer', num(dns.xfer_deferred));
    setText(document, '#ad-sysvol', health.sysvol_ok ? t('ad.yes', 'YES') : t('ad.no', 'NO'));
    setText(document, '#ad-dbcheck', health.dbcheck_errors === undefined || health.dbcheck_errors === null
      ? t('ad.na', 'n/d') : health.dbcheck_errors + ' (rc ' + health.dbcheck_rc + ')');
    setText(document, '#ad-dbcheck-age', age(health.dbcheck_age_s));

    var al = snap.alerts || null;
    setText(document, '#ad-al-total', al ? num(al.total) : t('ad.na', 'n/d'));
    setText(document, '#ad-al-firing', al ? num(al.firing) : t('ad.na', 'n/d'));
    setText(document, '#ad-al-pending', al ? num(al.pending) : t('ad.na', 'n/d'));
    setText(document, '#ad-al-inactive', al ? num(al.inactive) : t('ad.na', 'n/d'));

    renderCharts(snap.history);
  }

  function load() {
    fetch(SNAPSHOT_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(render)
      .catch(function () {
        setText(document, '#ad-updated', t('ad.na', 'n/d'));
        document.getElementById('ad-stale').innerHTML = '<span class="stale">· ' + t('ad.stale', 'STALE DATA') + '</span>';
      });
  }

  document.addEventListener('click', function (ev) {
    if (ev.target.closest && ev.target.closest('.lang-btn')) {
      setTimeout(function () { if (latest) render(latest); else load(); }, 80);
    }
  });

  load();
  setInterval(load, REFRESH_MS);
})();
