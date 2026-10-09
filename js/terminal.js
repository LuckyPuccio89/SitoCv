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
    'Home Lab Data Center — In pianificazione',
    'Architettura SD-WAN — In pianificazione'
  ]
};

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
        const text = this.renderProjects();
        this.typeOutput(text, () => {
          this.addLineRaw('  <a href="projects.html" class="term-link">' + LANG.t('term.projects_link') + '</a>');
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

    const bootLines = [
      { text: l('boot.title'), speed: 15 },
      { text: '', speed: 1 },
      { text: l('boot.cpu'),      speed: 10 },
      { text: l('boot.mem'),      speed: 10 },
      { text: l('boot.hdd'),      speed: 10 },
      { text: l('boot.video'),    speed: 10 },
      { text: l('boot.sound'),    speed: 10 },
      { text: '', speed: 1 },
      { text: l('boot.init_hw'), speed: 12 },
      { text: chk('boot.hw_ide'), speed: 5 },
      { text: chk('boot.hw_com1'), speed: 5 },
      { text: chk('boot.hw_lpt1'), speed: 5 },
      { text: chk('boot.hw_floppy'), speed: 5 },
      { text: '', speed: 1 },
      { text: l('boot.init_kernel'), speed: 12 },
      { text: '  [\u2713] msdos.ko........................', speed: 5 },
      { text: '  [\u2713] vfat.ko.........................', speed: 5 },
      { text: '  [\u2713] serial.ko.......................', speed: 5 },
      { text: '  [\u2713] ne2k-pci.ko.....................', speed: 5 },
      { text: '', speed: 1 },
      { text: l('boot.init_net'), speed: 12 },
      { text: chk('boot.net_tcpip'), speed: 5 },
      { text: chk('boot.net_hosts'), speed: 5 },
      { text: chk('boot.net_smtp'), speed: 5 },
      { text: chk('boot.net_http'), speed: 5 },
      { text: '', speed: 1 },
      { text: l('boot.init_check'), speed: 15 },
      { text: chk('boot.chk_bios'), speed: 5 },
      { text: chk('boot.chk_part'), speed: 5 },
      { text: chk('boot.chk_bad'), speed: 5 },
      { text: '', speed: 1 },
      { text: l('boot.box_top'), speed: 8 },
      { text: l('boot.box_mid'), speed: 8 },
      { text: l('boot.box_bot'), speed: 8 },
      { text: '', speed: 1 },
      { text: (() => { const fn = l('boot.connected'); const d = new Date().toLocaleDateString(LANG.current === 'en' ? 'en-US' : 'it-IT'); return typeof fn === 'function' ? fn(d) : fn + ' \u2014 ' + d; })(), speed: 12 },
      { text: '', speed: 1 },
      { text: l('boot.load_config'), speed: 12 },
      { text: '  [\u2713] sito_cv.txt...................', speed: 5 },
      { text: '', speed: 1 },
      { text: l('boot.initializing'), speed: 10 },
      { text: l('boot.os_stack'), speed: 10 },
      { text: l('boot.virt'), speed: 10 },
      { text: l('boot.net'), speed: 10 },
      { text: l('boot.tools'), speed: 10 },
      { text: l('boot.lang'), speed: 10 },
      { text: l('boot.edu'), speed: 10 },
      { text: l('boot.ready'), speed: 15 },
      { text: '', speed: 1 },
      { text: l('boot.help'), speed: 15 },
      { text: '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', speed: 5 },
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
        const cmd = input.textContent.trim().toLowerCase();
        input.contentEditable = false;
        this.processCommand(cmd);
      }
    });
  }

  processCommand(cmd) {
    // Remove old cursor
    const oldCursor = this.el.querySelector('.term-cursor');
    if (oldCursor) oldCursor.remove();

    if (cmd === '') {
      this.showPrompt();
      return;
    }

    if (this.commands[cmd]) {
      const result = typeof this.commands[cmd] === 'function'
        ? this.commands[cmd]()
        : this.commands[cmd];

      // Output result with typing
      this.typeOutput(result, () => this.showPrompt());
    } else {
      const unknownFn = LANG.t('term.unknown');
      const msg = typeof unknownFn === 'function' ? unknownFn(cmd) : unknownFn;
      this.typeOutput(msg, () => this.showPrompt());
    }
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
  terminalInstance = new Terminal('retro-terminal');
  if (terminalInstance.el) {
    setTimeout(() => terminalInstance.boot(), 600);
  }
});
