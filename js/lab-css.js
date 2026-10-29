// Palestra CSS: rivesti il campione fisso (look terminale del sito).
// Il CSS utente viene sanificato (niente url/import/script-breakout) e iniettato
// in un iframe same-origin; la verifica legge gli stili computati reali.
(function () {
  var SAMPLE = `<div class="screen"><div class="title">TPL_LAB</div><div class="row"><div class="card">A</div><div class="card">B</div></div><a class="btn">ESEGUI</a></div>`;
  var LV = [
    { id: "C1", t: "Schermo verde su nero", d: ".screen con sfondo #0d0d0f e testo #00FF41 — i colori del terminale home.",
      starter: `.screen {\n}`,
      sol: `.screen {\n  background: #0d0d0f;\n  color: #00FF41;\n}` },
    { id: "C2", t: "Titolo cyan centrato", d: ".title in #00F0FF e centrato — come le scritte del sito.",
      starter: `.title {\n}`,
      sol: `.title {\n  color: #00F0FF;\n  text-align: center;\n}` },
    { id: "C3", t: "Bottone", d: ".btn con sfondo #00F0FF, testo nero e imbottitura 10px 20px — come i bottoni del sito.",
      starter: `.btn {\n}`,
      sol: `.btn {\n  background: #00F0FF;\n  color: #000;\n  padding: 10px 20px;\n}` },
    { id: "C4", t: "Card con bordo", d: ".card con bordo 1px solid #00F0FF, angoli 8px e imbottitura 16px.",
      starter: `.card {\n}`,
      sol: `.card {\n  border: 1px solid #00F0FF;\n  border-radius: 8px;\n  padding: 16px;\n}` },
    { id: "C5", t: "Riga flexbox", d: ".row in flex con gap 12px: le due card vanno affiancate — come le griglie del sito.",
      starter: `.row {\n}`,
      sol: `.row {\n  display: flex;\n  gap: 12px;\n}` },
    { id: "C6", t: "Terminale completo", d: "Metti tutto insieme: schermo, titolo, bottone, card e riga — il mini-terminale finito.",
      starter: `.screen {\n}\n.title {\n}\n.btn {\n}\n.card {\n}\n.row {\n}`,
      sol: `.screen {\n  background: #0d0d0f;\n  color: #00FF41;\n}\n.title {\n  color: #00F0FF;\n  text-align: center;\n}\n.btn {\n  background: #00F0FF;\n  color: #000;\n  padding: 10px 20px;\n}\n.card {\n  border: 1px solid #00F0FF;\n  border-radius: 8px;\n  padding: 16px;\n}\n.row {\n  display: flex;\n  gap: 12px;\n}` }
  ];
  function hex2rgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return "rgb(" + ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ")";
  }
  function cs(doc, sel, prop) {
    var el = doc.querySelector(sel);
    if (!el) return "";
    var w = preview.contentWindow;
    if (!w) return "";
    return w.getComputedStyle(el).getPropertyValue(prop).trim().toLowerCase();
  }
  var CHECKS = {
    C1: function (doc, msg) {
      if (cs(doc, ".screen", "background-color") !== hex2rgb("#0d0d0f")) return msg(".screen: sfondo #0d0d0f");
      if (cs(doc, ".screen", "color") !== hex2rgb("#00FF41")) return msg(".screen: testo #00FF41");
      return null;
    },
    C2: function (doc, msg) {
      if (cs(doc, ".title", "color") !== hex2rgb("#00F0FF")) return msg(".title: colore #00F0FF");
      if (cs(doc, ".title", "text-align") !== "center") return msg(".title: text-align center");
      return null;
    },
    C3: function (doc, msg) {
      if (cs(doc, ".btn", "background-color") !== hex2rgb("#00F0FF")) return msg(".btn: sfondo #00F0FF");
      if (cs(doc, ".btn", "color") !== hex2rgb("#000000")) return msg(".btn: testo nero");
      if (cs(doc, ".btn", "padding-top") !== "10px") return msg(".btn: padding 10px 20px");
      return null;
    },
    C4: function (doc, msg) {
      if (cs(doc, ".card", "border-top-color") !== hex2rgb("#00F0FF")) return msg(".card: bordo #00F0FF");
      if (cs(doc, ".card", "border-top-width") !== "1px") return msg(".card: bordo 1px");
      if (cs(doc, ".card", "border-radius") !== "8px") return msg(".card: border-radius 8px");
      if (cs(doc, ".card", "padding-top") !== "16px") return msg(".card: padding 16px");
      return null;
    },
    C5: function (doc, msg) {
      if (cs(doc, ".row", "display") !== "flex") return msg(".row: display flex");
      var g = cs(doc, ".row", "column-gap") || cs(doc, ".row", "gap");
      if (g !== "12px" && g !== "12px 12px") return msg(".row: gap 12px (attuale: " + g + ")");
      return null;
    },
    C6: function (doc, msg) {
      var ids = ["C1", "C2", "C3", "C4", "C5"];
      for (var i = 0; i < ids.length; i++) {
        var e = CHECKS[ids[i]](doc, msg);
        if (e) return e;
      }
      return null;
    }
  };
  var cur = "C1", done = {};
  try { done = JSON.parse(localStorage.getItem("lab_css_done") || "{}"); } catch (e) { done = {}; }
  var scr = null, out = null, input = null, preview = null;

  function scroll() { if (scr) scr.scrollTop = scr.scrollHeight; }
  function addText(t) {
    String(t).split("\n").forEach(function (l) {
      if (l === "") return;
      var d = document.createElement("div");
      d.className = "term-line"; d.textContent = l;
      out.appendChild(d);
    });
    scroll();
  }
  function typeOutput(text, cb) {
    var lines = String(text).split("\n"), i = 0;
    (function nl() {
      if (i >= lines.length) { if (cb) cb(); return; }
      var l = lines[i], d = document.createElement("div");
      d.className = "term-line"; out.appendChild(d);
      var ci = 0;
      if (l === "") { i++; setTimeout(nl, 10); return; }
      (function ch() {
        if (ci < l.length) { d.textContent += l[ci]; ci++; scroll(); setTimeout(ch, 4 + Math.random() * 8); }
        else { i++; setTimeout(nl, 15); }
      })();
    })();
  }
  function byId(id) { for (var i = 0; i < LV.length; i++) if (LV[i].id === id) return LV[i]; return null; }
  function save() { try { localStorage.setItem("lab_css_done", JSON.stringify(done)); } catch (e) {} }
  function sanitize(css) {
    return String(css)
      .replace(/<\/style/gi, "")
      .replace(/<script/gi, "")
      .replace(/<!--/g, "")
      .replace(/@import/gi, "")
      .replace(/url\s*\(/gi, "(")
      .replace(/expression\s*\(/gi, "(")
      .replace(/behavior\s*:/gi, "");
  }
  function render(cb) {
    var css = sanitize(input.value);
    preview.onload = function () { if (cb) cb(); };
    preview.srcdoc = "<!DOCTYPE html><html><head><style>" + css + "</style></head><body>" + SAMPLE + "</body></html>";
  }
  function renderLevels() {
    var row = document.getElementById("lvl-row");
    row.innerHTML = "";
    LV.forEach(function (ex) {
      var b = document.createElement("button");
      b.className = "btn btn-sm" + (done[ex.id] ? " done" : " btn-outline");
      b.textContent = (done[ex.id] ? "✓ " : "") + ex.id;
      b.title = ex.t;
      b.addEventListener("click", function () { setLevel(ex.id); });
      row.appendChild(b);
    });
  }
  function setLevel(id) {
    cur = id;
    var ex = byId(id);
    renderLevels();
    var h = document.createElement("div");
    h.className = "term-line qt-title"; h.textContent = id + " — " + ex.t;
    out.appendChild(h); scroll();
    addText(ex.d);
    input.value = ex.starter;
    render();
  }
  function run() {
    render(function () {
      var doc = preview.contentDocument;
      if (!doc) { addText("[ERRORE] anteprima non pronta, riprova."); return; }
      var err = CHECKS[cur](doc, function (m) { return m; });
      if (!err) {
        done[cur] = true; save(); renderLevels();
        var ids = LV.map(function (e) { return e.id; });
        var next = ids[ids.indexOf(cur) + 1];
        addText("[✓] " + cur + " SUPERATO" + (next ? " — passa a " + next : " — palestra completata!"));
      } else addText("[..] " + cur + ": " + err);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    scr = document.getElementById("lab-screen");
    if (!scr) return;
    out = document.getElementById("lab-out");
    input = document.getElementById("lab-input");
    preview = document.getElementById("lab-preview");
    document.getElementById("lab-sample").textContent = SAMPLE;
    renderLevels();
    typeOutput("CSS LAB v1.0 — rivesti il campione fisso come il sito vero.\nScrivi il CSS, vedi l'anteprima, premi VERIFICA.\nSenza timer.", function () { setLevel("C1"); });
    var t = null;
    input.addEventListener("input", function () {
      if (t) clearTimeout(t);
      t = setTimeout(function () { render(); }, 400);
    });
    document.getElementById("lab-run").addEventListener("click", run);
    document.getElementById("lab-hint").addEventListener("click", function () {
      addText("[SUGGERIMENTO " + cur + "] " + byId(cur).d);
    });
    document.getElementById("lab-solution").addEventListener("click", function () {
      addText("[SOLUZIONE " + cur + "]");
      input.value = byId(cur).sol;
      render();
    });
  });
})();
