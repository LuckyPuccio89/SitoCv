// Live performance counters fed by Prometheus (via api/perf.json).
// Wired live: SYSTEM_STATUS section in index.html calls PERF.mountCards().
// Terminal option available: status: () => PERF.terminalCommand(this, LANG.current).
//   A) new terminal command  ->  status: () => PERF.terminalCommand(term)
//   B) status cards section  ->  PERF.mountCards(document.getElementById('perf-cards'))
//
// Data contract (schema v1), written server-side by tools/prometheus-poll.py:
//   { schema, generated_at (ISO8601), source, host:{cpu_pct,mem_pct,load1,uptime_s},
//     targets_up, targets_total, services:[{name,ok,latency_ms}], stale_after_s }
// The frontend NEVER talks to Prometheus/Grafana directly: no secrets, no CORS,
// no extra exposed ports. Only this static same-origin JSON is fetched.
var PERF = {
  url: 'api/perf.json',
  defaultStaleAfterS: 300,

  load: function () {
    return fetch(this.url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('perf HTTP ' + r.status);
      return r.json();
    });
  },

  ageS: function (data) {
    var t = Date.parse(data && data.generated_at);
    if (isNaN(t)) return Infinity;
    return Math.max(0, Math.round((Date.now() - t) / 1000));
  },

  isStale: function (data) {
    if (!data || typeof data !== 'object') return true;
    var limit = data.stale_after_s || this.defaultStaleAfterS;
    return this.ageS(data) > limit;
  },

  fmtUptime: function (totalS) {
    totalS = Math.max(0, Math.floor(totalS || 0));
    var d = Math.floor(totalS / 86400),
        h = Math.floor((totalS % 86400) / 3600),
        m = Math.floor((totalS % 3600) / 60);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d + 'g ' + p(h) + ':' + p(m);
  },

  fmtPct: function (v) {
    return (v === null || v === undefined || isNaN(v)) ? 'n/a' : (Math.round(v * 10) / 10) + '%';
  },

  // Plain-text lines for the retro terminal (ASCII only, no HTML).
  statusLines: function (data, lang) {
    var en = lang === 'en';
    var h = (data && data.host) || {};
    var stale = this.isStale(data);
    var lines = [
      (en ? 'LIVE SYSTEM STATUS' : 'STATO SISTEMA LIVE') +
        ' — ' + (stale ? (en ? 'STALE DATA' : 'DATI NON AGGIORNATI') : 'OK') +
        ' (' + (en ? 'age ' : 'vecchi ') + this.ageS(data) + 's)',
      '  CPU........ ' + this.fmtPct(h.cpu_pct),
      '  MEM........ ' + this.fmtPct(h.mem_pct),
      '  LOAD 1m.... ' + ((h.load1 === undefined || h.load1 === null) ? 'n/a' : h.load1),
      '  UPTIME..... ' + this.fmtUptime(h.uptime_s),
      '  TARGETS.... ' + (data.targets_up || 0) + '/' + (data.targets_total || 0) + ' UP'
    ];
    (data.services || []).forEach(function (s) {
      lines.push('  ' + (s.ok ? '[UP] ' : '[DOWN] ') + s.name +
        (s.latency_ms !== undefined ? ' ' + s.latency_ms + 'ms' : ''));
    });
    return lines;
  },

  // Terminal command handler (option A). `term` is the terminal instance
  // exposing typeOutput(text, done). Falls back gracefully when offline.
  terminalCommand: function (term, lang) {
    var self = this;
    this.load().then(function (data) {
      term.typeOutput(self.statusLines(data, lang).join('\n'), function () {
        term.scrollToBottom();
        term.showPrompt();
      });
    }).catch(function () {
      term.typeOutput(lang === 'en' ? 'PERF DATA OFFLINE' : 'DATI PERF OFFLINE', function () {
        term.scrollToBottom();
        term.showPrompt();
      });
    });
  },

  // Status cards for a normal section (option A). `el` is the container,
  // `data` may be null (offline). `lang` defaults to 'it'.
  mountCards: function (el, data, lang) {
    if (!el) return;
    lang = (lang === 'en') ? 'en' : 'it';
    var L = {
      it: { host: 'host', live: 'prometheus', stale: 'DATI VECCHI', offline: 'OFFLINE', targets: 'TARGETS' },
      en: { host: 'host', live: 'prometheus', stale: 'STALE DATA', offline: 'OFFLINE', targets: 'TARGETS' }
    }[lang];
    var h = (data && data.host) || {};
    var stale = this.isStale(data);
    function card(label, value, sub) {
      return '<div class="stat"><span class="stat-value">' + value +
        '</span><span class="stat-label">' + label + '</span>' +
        (sub ? '<span class="stat-sub">' + sub + '</span>' : '') + '</div>';
    }
    if (!data) {
      el.innerHTML =
        card('CPU', '—', L.offline) + card('MEM', '—', L.offline) +
        card('UPTIME', '—', L.offline) + card(L.targets, '—', L.offline);
      return;
    }
    el.innerHTML =
      card('CPU', this.fmtPct(h.cpu_pct), L.host) +
      card('MEM', this.fmtPct(h.mem_pct), L.host) +
      card('UPTIME', this.fmtUptime(h.uptime_s), L.host) +
      card(L.targets, (data.targets_up || 0) + '/' + (data.targets_total || 0),
        stale ? (L.stale + ' ' + this.ageS(data) + 's') : L.live);
  }
};
