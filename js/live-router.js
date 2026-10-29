// Live MikroTik markers fed by api/firewall.json (read-only snapshot, 30s).
// The snapshot is written server-side by the firewall poller: nothing secret
// is exposed, the browser only reads a same-origin static JSON.
var LIVE_ROUTER = {
  url: 'api/firewall.json',

  load: function () {
    return fetch(this.url + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },

  device: function (data) {
    var list = (data && data.devices) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === 'mikrotik') return list[i];
    }
    return null;
  },

  fmtBytes: function (b) {
    if (b === null || b === undefined || isNaN(b)) return 'n/a';
    var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0, v = Number(b);
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return (Math.round(v * 10) / 10) + ' ' + u[i];
  },

  fmtUptime: function (s) {
    s = Math.max(0, Math.floor(s || 0));
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d + 'g ' + p(h) + 'h ' + p(m) + 'm';
  },

  fmtPct: function (v) {
    return (v === null || v === undefined || isNaN(v)) ? 'n/a' : (Math.round(v * 10) / 10) + '%';
  },

  ageS: function (data) {
    var t = Date.parse(data && data.generated_at);
    return isNaN(t) ? Infinity : Math.max(0, Math.round((Date.now() - t) / 1000));
  },

  render: function (el, data) {
    if (!el) return;
    var lang = (window.LANG && LANG.current) === 'en' ? 'en' : 'it';
    var T = {
      it: { status: 'STATO', uptime: 'UPTIME', cpu: 'CPU', mem: 'RAM', temp: 'TEMP', conn: 'CONNTRACK',
            rx: 'WAN RX', tx: 'WAN TX', drops: 'DROP INPUT', attacks: 'ATTACCHI 24h', up: 'UP', down: 'DOWN',
            live: 'LIVE', stale: 'DATI VECCHI', offline: 'OFFLINE' },
      en: { status: 'STATUS', uptime: 'UPTIME', cpu: 'CPU', mem: 'MEM', temp: 'TEMP', conn: 'CONNTRACK',
            rx: 'WAN RX', tx: 'WAN TX', drops: 'INPUT DROPS', attacks: 'ATTACKS 24h', up: 'UP', down: 'DOWN',
            live: 'LIVE', stale: 'STALE', offline: 'OFFLINE' }
    }[lang];

    if (!data) {
      el.innerHTML = '';
      return;
    }
    var d = this.device(data);
    if (!d) { el.innerHTML = ''; return; }
    var stale = this.ageS(data) > ((data.refresh_seconds || 30) * 4);
    var sub = stale ? (T.stale + ' ' + this.ageS(data) + 's') : T.live;
    var up = d.status === 'up';
    var wan = d.wan || {};
    var rules = d.rules || {};
    var attacks = (data.attacks && data.attacks.events_24h) || 0;

    function card(label, value, extra) {
      return '<div class="stat"><span class="stat-value">' + value + '</span>' +
        '<span class="stat-label">' + label + '</span>' +
        (extra ? '<span class="stat-sub">' + extra + '</span>' : '') + '</div>';
    }
    el.innerHTML =
      card(T.status, up ? T.up : T.down, sub) +
      card(T.uptime, this.fmtUptime(d.uptime_s), d.version || '') +
      card(T.cpu, this.fmtPct(d.cpu_pct), this.fmtPct(d.mem_used_pct) + ' RAM') +
      card(T.conn, (d.conntrack === null || d.conntrack === undefined) ? 'n/a' : d.conntrack, (wan.up ? 'WAN UP' : 'WAN DOWN')) +
      card(T.rx, this.fmtBytes(wan.rx_bytes), 'since boot') +
      card(T.tx, this.fmtBytes(wan.tx_bytes), 'since boot') +
      card(T.drops, (rules.input_drop_packets === null || rules.input_drop_packets === undefined) ? 'n/a' : rules.input_drop_packets, 'input chain') +
      card(T.attacks, attacks, (data.attacks && data.attacks.sources_24h ? data.attacks.sources_24h + ' src' : ''));
  },

  mount: function (el) {
    var self = this;
    this.load().then(function (data) {
      self.render(el, data);
    }).catch(function () {
      self.render(el, null);
    });
  }
};
