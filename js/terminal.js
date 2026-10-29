// ============================================================
// RETRO 90s TERMINAL — Boot Sequence & System Info
// ============================================================

var terminalInstance = null;

const terminalData = {
  user: {
    name: 'Stefano Pucci',
    role: 'Network Engineer & System Architect',
    email: 'stefano.informatico@gmail.com',
    phone: '+39 371 394 6209',
    location: 'Mondolfo (PU), Italia',
    status: 'DISPONIBILE'
  },
  skills: [
    { name: 'Linux',       pct: 80 },
    { name: 'Windows',     pct: 70 },
    { name: 'Proxmox',     pct: 75 },
    { name: 'Networking',  pct: 80 },
    { name: 'Sicurezza',   pct: 70 },
    { name: 'Programmazione', pct: 65 }
  ],
  certs: [
    'Corso Sistemista — Confindustria Ancona (2026)',
    'Robotica Industria 4.0 — ITS Lab Academy (2018-2022)',
    'Diploma Tecnico Gestione Aziendale — Istituto A. Olivetti (2008)'
  ],
  projects: [
    'Portfolio CV — Sito Personale (2026)',
    'Home Lab Data Center — Completato (10/2026)',
    'Docker Containers — Monitoraggio & Dev (2026)',
  ]
};

// ============================================================
// SHARED CLI MODULE — comandi condivisi home + query-terminal
// Nessuna dipendenza esterna; API PHP con fallback JSON statico.
// ============================================================
var TermCLI = (function () {
  var STATIONS = {
    S07105: { sid: 'S07105', label: 'Fano' },
    S07108: { sid: 'S07108', label: 'Senigallia' },
    S07111: { sid: 'S07111', label: 'Falconara Marittima' },
    S07113: { sid: 'S07113', label: 'Ancona' }
  };
  var ALIAS = {
    fano: 'S07105', fan: 'S07105', s07105: 'S07105',
    senigallia: 'S07108', sen: 'S07108', s07108: 'S07108',
    falconara: 'S07111', fal: 'S07111', 'falconara m.': 'S07111', s07111: 'S07111',
    ancona: 'S07113', anc: 'S07113', s07113: 'S07113'
  };
  var PALETTES = {
    green:  { color: '#00FF41', glow: 'rgba(0, 255, 65, 0.55)',  soft: 'rgba(0, 255, 65, 0.12)' },
    amber:  { color: '#FFB000', glow: 'rgba(255, 176, 0, 0.55)', soft: 'rgba(255, 176, 0, 0.14)' },
    matrix: { color: '#00FF9C', glow: 'rgba(0, 255, 156, 0.75)', soft: 'rgba(0, 255, 156, 0.16)' }
  };

  function L(key, fallback) {
    if (typeof LANG !== 'undefined' && typeof LANG.t === 'function') {
      var v = LANG.t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function pad(s, n) {
    s = String(s == null ? '' : s);
    if (s.length > n) return s.slice(0, n);
    return s + ' '.repeat(n - s.length);
  }
  function box(title) {
    var t = String(title).slice(0, 42);
    var inner = 42;
    var padL = Math.floor((inner - t.length) / 2);
    var padR = inner - t.length - padL;
    return ['', '\u2554' + '\u2550'.repeat(inner) + '\u2557',
      '\u2551' + ' '.repeat(padL) + t + ' '.repeat(padR) + '\u2551',
      '\u255A' + '\u2550'.repeat(inner) + '\u255D', ''].join('\n');
  }
  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }
  function fetchJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function resolveStation(arg) {
    var key = String(arg == null ? '' : arg).trim().toLowerCase();
    if (key === '') key = 'ancona';
    var sid = ALIAS[key];
    return sid ? STATIONS[sid] : null;
  }

  // --- cat about.txt ---
  function aboutText() {
    return box('ABOUT.TXT') + '\n' + L('term.about', [
      '  STEFANO PUCCI — Network Engineer & System Architect',
      '  Mondolfo (PU), Italia · disponibile',
      '',
      '  PROFILO',
      '  Progetto e amministro infrastrutture di rete e sistemi: FTTH,',
      '  routing e switching, virtualizzazione Proxmox, container Docker,',
      '  monitoraggio (Prometheus/Grafana) e pipeline dati.',
      '',
      '  COMPETENZE',
      '  Networking ....... VLAN 802.1Q, PPPoE, FastTrack, firewall, MikroTik',
      '  Sistemi .......... Linux, Windows Server, Active Directory, Proxmox',
      '  Observability .... Prometheus, Grafana, exporter, log e metriche',
      '  Dati ............. Python 3, MySQL, GTFS, REST, cron daemon',
      '  Web .............. HTML5, CSS3, JavaScript vanilla (zero dipendenze)',
      '',
      '  FORMAZIONE',
      '  Corso Sistemista — Confindustria Ancona (2026)',
      '  Robotica Industria 4.0 — ITS Lab Academy (2018-2022)',
      '  Diploma Tecnico Gestione Aziendale — Istituto A. Olivetti (2008)',
      '',
      '  CONTATTI',
      '  stefano.informatico@gmail.com · +39 371 394 6209',
      '  github.com/LuckyPuccio89'
    ].join('\n')) + '\n' + '\u2500'.repeat(44);
  }

  // --- status ---
  function statusText() {
    var rows = [
      ['proxmox-01', '192.168.68.61:8006', 'OK', '0.8 ms'],
      ['ad-dc01', '192.168.20.21:389', 'OK', '0.4 ms'],
      ['docker-host', '192.168.20.10:2375', 'OK', '0.2 ms'],
      ['gtfs-daemon', 'cron */5 · viaggiatreno', 'OK', '5 min']
    ];
    var out = box(L('term.status_header', 'HOMELAB NODES'));
    out += '\n' + '  ' + pad(L('term.status_node', 'NODO'), 12) + ' ' +
      pad(L('term.status_target', 'TARGET'), 30) + ' ' +
      pad(L('term.status_state', 'STATO'), 6) + ' ' +
      L('term.status_latency', 'LATENZA') + '\n';
    out += '  ' + '\u2500'.repeat(60) + '\n';
    rows.forEach(function (r) {
      out += '  ' + pad(r[0], 12) + ' ' + pad(r[1], 30) + ' [ ' + pad(r[2], 2) + ' ] ' + r[3] + '\n';
    });
    out += '\n  ' + L('term.status_note', 'stato simulato — nessuna chiamata di rete dal browser.') + '\n';
    out += '\u2500'.repeat(44);
    return out;
  }

  // --- trains ---
  function normalizeTrains(payload, sid) {
    var s = payload && payload.stations && payload.stations[sid];
    if (!s) throw new Error('nessun dato per ' + sid);
    return {
      label: s.label || (STATIONS[sid] && STATIONS[sid].label) || sid,
      sid: sid,
      generated_at: payload.generated_at || null,
      source: payload.source || 'json',
      departures: s.departures || []
    };
  }
  function fetchTrains(st) {
    // 1) endpoint MySQL, 2) fallback snapshot statico (GitHub Pages / homelab offline)
    return fetchJSON('api/realtime.json&st=' + encodeURIComponent(st.sid))
      .then(function (d) {
        if (!d || !d.departures) throw new Error('payload non valido');
        return {
          label: st.label, sid: st.sid,
          generated_at: d.snapshot_at || null,
          source: 'mysql', departures: d.departures
        };
      })
      .catch(function () {
        return fetchJSON('api/realtime.json').then(function (rt) {
          return normalizeTrains(rt, st.sid);
        });
      });
  }
  function formatTrains(data) {
    var cols = [10, 24, 7, 9];
    function row(cells) {
      return cells.map(function (c, i) { return pad(c, cols[i]); }).join(' | ');
    }
    var out = box('PARTENZE ' + String(data.label).toUpperCase());
    out += '\n  ' + row(['TRENO', 'DESTINAZIONE', 'ORARIO', 'RITARDO']);
    out += '\n  ' + '\u2500'.repeat(59) + '\n';
    var deps = data.departures.slice(0, 10);
    if (!deps.length) {
      out += '  ' + L('term.trains_empty', 'nessuna partenza disponibile.') + '\n';
    } else {
      deps.forEach(function (d) {
        var train = ((d.cat || '') + ' ' + (d.n || '')).trim() || '--';
        var delay = (d.delay_min === null || d.delay_min === undefined)
          ? 'n/d'
          : (d.delay_min > 0 ? '+' + d.delay_min + ' min' : 'in orario');
        out += '  ' + row([train, d.dest || '--', d.hhmm || '--:--', delay]) + '\n';
      });
    }
    var when = data.generated_at ? String(data.generated_at).replace('T', ' ').slice(0, 19) : 'n/d';
    var src = data.source === 'mysql' ? 'MySQL api/realtime.json' : 'api/realtime.json (fallback)';
    out += '\n  ' + L('term.trains_sync', 'aggiornato') + ': ' + when + ' \u00b7 ' + L('term.trains_source', 'fonte') + ': ' + src;
    out += '\n' + '\u2500'.repeat(44);
    return out;
  }

  // --- ping simulato ---
  function ping(host, io) {
    var h = String(host || '').trim() || '127.0.0.1';
    var base = /^(localhost|127\.)/i.test(h) ? 0.08
      : /^192\.168\./.test(h) ? 0.35
      : /^10\./.test(h) ? 0.6
      : 18;
    var jitter = base < 1 ? 0.25 : 12;
    var ttl = /^192\.168\.|^10\./.test(h) ? 64 : 52;
    var times = [], seq = 0;

    io.line('PING ' + h + ' (' + h + ') 56(84) bytes of data.');
    return new Promise(function (resolve) {
      function next() {
        if (seq >= 4) {
          var min = Math.min.apply(null, times);
          var max = Math.max.apply(null, times);
          var avg = times.reduce(function (a, b) { return a + b; }, 0) / times.length;
          var mdev = times.reduce(function (a, b) { return a + Math.abs(b - avg); }, 0) / times.length;
          var stats = '\n--- ' + h + ' ping statistics ---\n' +
            '4 packets transmitted, 4 received, 0% packet loss, time 12' + (seq * 3) + 'ms\n' +
            'rtt min/avg/max/mdev = ' + min.toFixed(1) + '/' + avg.toFixed(1) + '/' +
            max.toFixed(1) + '/' + mdev.toFixed(1) + ' ms';
          resolve(stats);
          return;
        }
        seq++;
        var rtt = Math.max(0.1, base + Math.random() * jitter);
        times.push(rtt);
        io.line('64 bytes from ' + h + ': icmp_seq=' + seq + ' ttl=' + ttl +
          ' time=' + rtt.toFixed(1) + ' ms');
        setTimeout(next, 320 + Math.random() * 260);
      }
      setTimeout(next, 260);
    });
  }

  // --- color ---
  function applyColor(mode, persist) {
    var p = PALETTES[mode];
    if (!p) return false;
    var root = document.documentElement;
    root.style.setProperty('--term-color', p.color);
    root.style.setProperty('--term-glow', p.glow);
    root.style.setProperty('--term-glow-soft', p.soft);
    if (persist) {
      try { localStorage.setItem('term.color', mode); } catch (e) { /* storage off */ }
    }
    return true;
  }
  function initColor() {
    var saved = null;
    try { saved = localStorage.getItem('term.color'); } catch (e) { /* storage off */ }
    if (saved && PALETTES[saved]) applyColor(saved, false);
  }

  function usageTrains() {
    return L('term.trains_usage', 'uso: trains [fano|ancona|senigallia|falconara]') + '\n' +
      L('term.trains_usage2', 'senza argomento: ancona');
  }

  /**
   * Esegue i comandi condivisi. io = { show(text), line(text), prompt() }.
   * Ritorna true se il comando e' stato gestito.
   */
  function exec(name, arg, io) {
    switch (name) {
      case 'cat':
        if (!/^about\.txt$/i.test(arg)) {
          io.show(L('term.cat_missing', 'cat: file non trovato. Prova: cat about.txt'));
        } else {
          io.show(aboutText());
        }
        return true;
      case 'status':
        io.show(statusText());
        return true;
      case 'trains': {
        var st = resolveStation(arg);
        if (!st) {
          io.show(usageTrains() + '\n' + L('term.trains_unknown', 'stazione sconosciuta:') + ' "' + arg + '"');
          return true;
        }
        io.line('  > GET api/realtime.json&st=' + st.sid + ' ...');
        fetchTrains(st).then(function (data) {
          io.show(formatTrains(data));
        }).catch(function () {
          io.show(L('term.trains_nodata', 'API e snapshot statico non raggiungibili: nessun dato disponibile.'));
        });
        return true;
      }
      case 'ping':
        if (!arg) {
          io.show(L('term.ping_usage', 'uso: ping [host]  (es. ping 192.168.20.1)'));
          return true;
        }
        ping(arg, {
          line: function (l) { io.line(l); }
        }).then(function (stats) { io.show(stats); });
        return true;
      case 'download':
        if (!/^cv$/i.test(arg)) {
          io.show(L('term.download_usage', 'uso: download cv'));
          return true;
        }
        io.show(L('term.download_ok', 'download del CV in corso: cv/cv-stefano-pucci.pdf'));
        setTimeout(function () { window.location.href = 'cv/cv-stefano-pucci.pdf'; }, 450);
        return true;
      case 'color':
        if (!arg || !PALETTES[arg.toLowerCase()]) {
          io.show(L('term.color_usage', 'uso: color [green|amber|matrix]'));
          return true;
        }
        applyColor(arg.toLowerCase(), true);
        io.show(L('term.color_ok', 'tema terminale impostato:') + ' ' + arg.toUpperCase());
        return true;
      default:
        return false;
    }
  }

  return {
    STATIONS: STATIONS,
    PALETTES: PALETTES,
    exec: exec,
    aboutText: aboutText,
    statusText: statusText,
    applyColor: applyColor,
    initColor: initColor,
    resolveStation: resolveStation,
    fetchTrains: fetchTrains,
    formatTrains: formatTrains,
    esc: esc
  };
})();

if (typeof window !== 'undefined') window.TermCLI = TermCLI;

class Terminal {
  constructor(elementId) {
    this.el = document.getElementById(elementId);
    if (!this.el) return;
    this.output = this.el.querySelector('.term-output');
    this.lines = [];
    this.lineIndex = 0;
    this.charIndex = 0;
    this.running = false;
    this.bootComplete = false;
    this.commands = {
      help:    () => LANG.t('term.help'),
      whoami:  () => this.renderSystemInfo(),
      skills:  () => this.renderSkills(),
      certs:   () => {
        const text = this.renderCerts();
        this.typeOutput(text, () => {
          this.addLineRaw('  <a href="certifications.html" class="term-link">' + LANG.t('term.certs_link') + '</a>');
          this.scrollToBottom();
          this.showPrompt();
        });
      },
      projects: () => {
        const h = LANG.t('term.projects_header');
        const inner = 42;
        const padL = Math.floor((inner - h.length) / 2);
        const padR = inner - h.length - padL;
        const header = [
          '',
          '\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557',
          '\u2551' + ' '.repeat(padL) + h + ' '.repeat(padR) + '\u2551',
          '\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D',
          ''
        ].join('\n');
        const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const links = [null, 'homelab-report.html', 'docker-report.html'];
        this.typeOutput(header, () => {
          terminalData.projects.forEach((proj, i) => {
            if (links[i]) {
              this.addLineRaw('  ' + (i + 1) + '. ' + esc(proj) + ' <a href="' + links[i] + '" class="term-link">[REPORT]</a>');
            } else {
              this.addLineRaw('  ' + (i + 1) + '. ' + esc(proj));
            }
          });
          this.addLineRaw('');
          this.addLineRaw('\u2500'.repeat(44));
          this.scrollToBottom();
          this.showPrompt();
        });
      },
      clear:   () => { this.output.innerHTML = ''; this.showPrompt(); },
      reboot:  () => this.boot()
    };
  }

  // --- Boot Sequence ---
  boot(skipAnimation) {
    if (this.running) return;
    this.running = true;
    this.bootComplete = false;
    this.output.innerHTML = '';
    this.lineIndex = 0;

    const l = (key) => typeof LANG !== 'undefined' ? LANG.t(key) : key;
    const chk = (key) => '  [\u2713] ' + l(key).padEnd(30, '.');

  // --- Boot Sequence (simplified) ---
  boot(skipAnimation) {
    if (this.running) return;
    this.running = true;
    this.bootComplete = false;
    this.output.innerHTML = '';
    this.lineIndex = 0;

    const l = (key) => typeof LANG !== 'undefined' ? LANG.t(key) : key;
    const chk = (key) => '  [\u2713] ' + l(key).padEnd(30, '.');

    const bootLines = [
      { text: l('boot.title'), speed: 25 },
      { text: '', speed: 1 },
      { text: l('boot.init_hw'), speed: 25 },
      { text: '', speed: 1 },
      { text: l('boot.init_kernel'), speed: 25 },
      { text: '', speed: 1 },
      { text: l('boot.init_net'), speed: 25 },
      { text: '', speed: 1 },
      { text: l('boot.init_check'), speed: 25 },
      { text: '', speed: 1 },
      { text: (() => { const fn = l('boot.connected'); const d = new Date().toLocaleDateString(LANG.current === 'en' ? 'en-US' : 'it-IT'); return typeof fn === 'function' ? fn(d) : fn + ' — ' + d; })(), speed: 20 },
      { text: '', speed: 1 },
      { text: l('boot.load_config'), speed: 20 },
      { text: '', speed: 1 },
      { text: l('boot.initializing'), speed: 15 },
      { text: l('boot.os_stack'), speed: 15 },
      { text: l('boot.virt'), speed: 15 },
      { text: l('boot.net'), speed: 15 },
      { text: l('boot.tools'), speed: 15 },
      { text: l('boot.lang'), speed: 15 },
      { text: l('boot.edu'), speed: 15 },
      { text: l('boot.ready'), speed: 20 },
      { text: '', speed: 1 },
      { text: l('boot.help'), speed: 15 },
      { text: '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', speed: 5 },
      { text: '', speed: 1 },
    ];

    this.lines = bootLines;

    if (skipAnimation) {
      this.lines.forEach(line => {
        if (line.text !== '') {
          const div = document.createElement('div');
          div.className = 'term-line';
          div.textContent = line.text;
          this.output.appendChild(div);
        }
      });
      this.scrollToBottom();
      this.running = false;
      this.bootComplete = true;
      this.showPrompt();
      return;
    }

    this.lineIndex = 0;
    this.charIndex = 0;
    this.typeNextLine();
  }

  typeNextLine() {
    if (this.lineIndex >= this.lines.length) {
      this.running = false;
      this.bootComplete = true;
      if (this.pendingLanguageReboot) {
        this.pendingLanguageReboot = false;
        this.boot(true);
        return;
      }
      this.showPrompt();
      return;
    }

    const line = this.lines[this.lineIndex];
    const text = line.text;
    this.charIndex = 0;

    // Empty line
    if (text === '') {
      this.addLine('');
      this.lineIndex++;
      setTimeout(() => this.typeNextLine(), 20);
      return;
    }

    // Typing animation
    const span = document.createElement('div');
    span.className = 'term-line';
    this.output.appendChild(span);
    this.scrollToBottom();

    const typeChar = () => {
      if (this.charIndex < text.length) {
        span.textContent += text[this.charIndex];
        this.charIndex++;
        this.scrollToBottom();
        setTimeout(typeChar, 8 + Math.random() * 10);
      } else {
        this.lineIndex++;
        setTimeout(() => this.typeNextLine(), line.speed || 40);
      }
    };


    this.lines = bootLines;

    if (skipAnimation) {
      this.lines.forEach(line => {
        if (line.text !== '') {
          const div = document.createElement('div');
          div.className = 'term-line';
          div.textContent = line.text;
          this.output.appendChild(div);
        }
      });
      this.scrollToBottom();
      this.running = false;
      this.bootComplete = true;
      this.showPrompt();
      return;
    }

    this.lineIndex = 0;
    this.charIndex = 0;
    this.typeNextLine();
  }

  typeNextLine() {
    if (this.lineIndex >= this.lines.length) {
      this.running = false;
      this.bootComplete = true;
      if (this.pendingLanguageReboot) {
        this.pendingLanguageReboot = false;
        this.boot(true);
        return;
      }
      this.showPrompt();
      return;
    }

    const line = this.lines[this.lineIndex];
    const text = line.text;
    this.charIndex = 0;

    // Empty line
    if (text === '') {
      this.addLine('');
      this.lineIndex++;
      setTimeout(() => this.typeNextLine(), 20);
      return;
    }

    // Typing animation
    const span = document.createElement('div');
    span.className = 'term-line';
    this.output.appendChild(span);
    this.scrollToBottom();

    const typeChar = () => {
      if (this.charIndex < text.length) {
        span.textContent += text[this.charIndex];
        this.charIndex++;
        this.scrollToBottom();
        setTimeout(typeChar, 8 + Math.random() * 10);
      } else {
        this.lineIndex++;
        setTimeout(() => this.typeNextLine(), line.speed || 40);
      }
    };
    typeChar();
  }

  addLine(html) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = html;
    this.output.appendChild(div);
    this.scrollToBottom();
  }

  addLineRaw(html) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = html;
    this.output.appendChild(div);
    this.scrollToBottom();
  }

  scrollToBottom() {
    const screen = this.el.querySelector('.term-screen');
    if (screen) screen.scrollTop = screen.scrollHeight;
  }

  // --- Prompt ---
  showPrompt() {
    const promptLine = document.createElement('div');
    promptLine.className = 'term-line term-prompt-line';
    promptLine.innerHTML = '<span class="term-prompt-sign">$ </span><span class="term-input" contenteditable="false"></span><span class="term-cursor">█</span>';
    this.output.appendChild(promptLine);
    this.scrollToBottom();

    const input = promptLine.querySelector('.term-input');
    input.contentEditable = true;
    input.focus();

    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = input.textContent.trim();
        input.contentEditable = false;
        this.processCommand(cmd);
      }
    });
  }

  processCommand(raw) {
    // Remove old cursor
    const oldCursor = this.el.querySelector('.term-cursor');
    if (oldCursor) oldCursor.remove();

    const input = String(raw || '').trim();
    if (input === '') {
      this.showPrompt();
      return;
    }

    const name = input.split(/\s+/)[0].toLowerCase();
    const arg = input.slice(name.length).trim();

    const finish = (res) => {
      if (res === null || res === undefined) return;
      if (typeof res === 'string') {
        this.typeOutput(res, () => this.showPrompt());
      } else if (res.instant) {
        this.printInstant(res.text);
        this.showPrompt();
      } else if (res.html) {
        this.addLineRaw(res.html);
        this.showPrompt();
      }
    };

    // 1) comandi locali della home
    if (this.commands[name]) {
      let res;
      try {
        res = this.commands[name](arg, this);
      } catch (e) {
        res = 'ERRORE: ' + e.message;
      }
      if (res && typeof res.then === 'function') {
        res.then(finish).catch((err) => finish('ERRORE: ' + err.message));
      } else {
        finish(res);
      }
      return;
    }

    // 2) comandi condivisi (Modulo 4): cat/status/trains/ping/download/color
    const io = {
      show: (text) => this.typeOutput(text, () => this.showPrompt()),
      line: (text) => this.addLineRaw(TermCLI.esc(text)),
      prompt: () => this.showPrompt()
    };
    if (typeof TermCLI !== 'undefined' && TermCLI.exec(name, arg, io)) return;

    const unknownFn = LANG.t('term.unknown');
    const msg = typeof unknownFn === 'function' ? unknownFn(input) : unknownFn;
    this.typeOutput(msg, () => this.showPrompt());
  }

  printInstant(text) {
    String(text).split('\n').forEach((l) => {
      if (l === '') return;
      const div = document.createElement('div');
      div.className = 'term-line';
      div.textContent = l;
      this.output.appendChild(div);
    });
    this.scrollToBottom();
  }

  typeOutput(text, callback) {
    const lines = text.split('\n');
    let i = 0;
    const typeLine = () => {
      if (i >= lines.length) {
        if (callback) callback();
        return;
      }
      const div = document.createElement('div');
      div.className = 'term-line';
      this.output.appendChild(div);
      let ci = 0;
      const l = lines[i];
      const typeChar = () => {
        if (ci < l.length) {
          div.textContent += l[ci];
          ci++;
          this.scrollToBottom();
          setTimeout(typeChar, 4 + Math.random() * 8);
        } else {
          i++;
          setTimeout(typeLine, 15);
        }
      };
      if (l === '') {
        i++;
        setTimeout(typeLine, 10);
      } else {
        typeChar();
      }
    };
    typeLine();
  }

  // --- Info renders ---
  renderSystemInfo() {
    const u = terminalData.user;
    const header = LANG.t('term.info_header');
    const inner = 42;
    const padL = Math.floor((inner - header.length) / 2);
    const padR = inner - header.length - padL;
    const hdrLine = '║' + ' '.repeat(padL) + header + ' '.repeat(padR) + '║';
    return [
      '',
      '╔══════════════════════════════════════════╗',
      hdrLine,
      '╚══════════════════════════════════════════╝',
      '',
      `  NAME:        ${u.name}`,
      `  ROLE:        ${u.role}`,
      `  EMAIL:       ${u.email}`,
      `  PHONE:       ${u.phone}`,
      `  LOCATION:    ${u.location}`,
      `  STATUS:      ${u.status}`,
      '',
      '────────────────────────────────────────────',
      ''
    ].join('\n');
  }

  renderSkills() {
    const bars = terminalData.skills.map(s => {
      const filled = Math.round(s.pct / 5);
      const empty = 20 - filled;
      return `  [${s.name.padEnd(13)}] █${'█'.repeat(filled)}${'░'.repeat(empty)} ${s.pct}%`;
    }).join('\n');
    const header = LANG.t('term.skills_header');
    const inner = 42;
    const padL = Math.floor((inner - header.length) / 2);
    const padR = inner - header.length - padL;
    const hdrLine = '║' + ' '.repeat(padL) + header + ' '.repeat(padR) + '║';
    return [
      '',
      '╔══════════════════════════════════════════╗',
      hdrLine,
      '╚══════════════════════════════════════════╝',
      '',
      bars,
      '',
      '────────────────────────────────────────────',
      ''
    ].join('\n');
  }

  renderCerts() {
    const list = terminalData.certs.map((c, i) => `  ${i + 1}. ${c}`).join('\n');
    const header = LANG.t('term.certs_header');
    const inner = 42;
    const padL = Math.floor((inner - header.length) / 2);
    const padR = inner - header.length - padL;
    const hdrLine = '║' + ' '.repeat(padL) + header + ' '.repeat(padR) + '║';
    return [
      '',
      '╔══════════════════════════════════════════╗',
      hdrLine,
      '╚══════════════════════════════════════════╝',
      '',
      list,
      '',
      '────────────────────────────────────────────',
      ''
    ].join('\n');
  }

  renderProjects() {
    const list = terminalData.projects.map((p, i) => `  ${i + 1}. ${p}`).join('\n');
    const header = LANG.t('term.projects_header');
    const inner = 42;
    const padL = Math.floor((inner - header.length) / 2);
    const padR = inner - header.length - padL;
    const hdrLine = '║' + ' '.repeat(padL) + header + ' '.repeat(padR) + '║';
    return [
      '',
      '╔══════════════════════════════════════════╗',
      hdrLine,
      '╚══════════════════════════════════════════╝',
      '',
      list,
      '',
      '────────────────────────────────────────────',
      ''
    ].join('\n');
  }
}

// --- Auto-start on page load ---
document.addEventListener('DOMContentLoaded', () => {
  if (typeof TermCLI !== 'undefined') TermCLI.initColor();
  terminalInstance = new Terminal('retro-terminal');
  if (terminalInstance.el) {
    setTimeout(() => terminalInstance.boot(), 600);
  }
});