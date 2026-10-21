// Query terminal in stile home-terminal, output a TABELLE.
// Comandi: help, stazioni, partenze [stazione], ritardi, bus [linea], clear.
// History frecce su/giu. Dati: api/realtime.json (live) + api/gtfs.json.
(function () {
  var ALIAS = {
    fano: "S07105", fan: "S07105", s07105: "S07105",
    senigallia: "S07108", sen: "S07108", s07108: "S07108",
    falconara: "S07111", fal: "S07111", "falconara m.": "S07111", s07111: "S07111",
    ancona: "S07113", anc: "S07113", s07113: "S07113"
  };
  var D = { rt: null, gtfs: null };
  var hist = [], hi = -1;
  var scr = null, out = null, bootLang = null, running = false;

  function T(k) {
    if (window.LANG && typeof LANG.t === "function") return LANG.t(k);
    return k;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  function box(title) {
    var t = String(title).slice(0, 42);
    var inner = 42, padL = Math.floor((inner - t.length) / 2), padR = inner - t.length - padL;
    return ["", "╔══════════════════════════════════════════╗",
      "║" + " ".repeat(padL) + t + " ".repeat(padR) + "║",
      "╚══════════════════════════════════════════╝", ""].join("\n");
  }
  function scroll() { if (scr) scr.scrollTop = scr.scrollHeight; }
  function addText(text) {
    String(text).split("\n").forEach(function (l) {
      if (l === "") return;
      var div = document.createElement("div");
      div.className = "term-line";
      div.textContent = l;
      out.appendChild(div);
    });
    scroll();
  }
  function typeOutput(text, callback) {
    var lines = String(text).split("\n"), i = 0;
    (function typeLine() {
      if (i >= lines.length) { if (callback) callback(); return; }
      var l = lines[i], div = document.createElement("div");
      div.className = "term-line";
      out.appendChild(div);
      var ci = 0;
      if (l === "") { i++; setTimeout(typeLine, 10); return; }
      (function typeChar() {
        if (ci < l.length) { div.textContent += l[ci]; ci++; scroll(); setTimeout(typeChar, 4 + Math.random() * 8); }
        else { i++; setTimeout(typeLine, 15); }
      })();
    })();
  }
  function table(headers, rows) {
    var h = '<table class="qt-table"><thead><tr>';
    headers.forEach(function (c) { h += "<th>" + esc(c) + "</th>"; });
    h += "</tr></thead><tbody>";
    rows.forEach(function (r) { h += "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; });
    h += "</tbody></table>";
    var div = document.createElement("div");
    div.className = "term-line";
    div.innerHTML = h;
    out.appendChild(div);
    scroll();
  }
  function caretEnd(el) {
    try {
      var r = document.createRange();
      r.selectNodeContents(el); r.collapse(false);
      var s = window.getSelection();
      s.removeAllRanges(); s.addRange(r);
    } catch (e) { /* noop */ }
  }

  function delayCell(d) {
    if (d === null || d === undefined) return "&mdash;";
    if (d > 0) return '<span style="color:#ff8080">+' + d + "&#8242;</span>";
    return '<span class="term-ok">ok</span>';
  }

  function cmdStazioni() {
    if (!D.rt) return { text: "live non caricato (api/realtime.json)." };
    var rows = Object.keys(D.rt.stations).map(function (sid) {
      var st = D.rt.stations[sid];
      return [esc(sid), esc(st.label), String((st.departures || []).length)];
    });
    return { title: "STAZIONI LIVE", table: [["SIGLA", "STAZIONE", "PARTENZE"], rows],
      foot: "snapshot: " + D.rt.generated_at };
  }
  function cmdPartenze(arg) {
    if (!D.rt) return { text: "live non caricato (api/realtime.json)." };
    var sid = ALIAS[(arg || "ancona").toLowerCase()] || null;
    if (!sid || !D.rt.stations[sid]) return { text: 'stazione sconosciuta: "' + arg + '".\nProva: fano, senigallia, falconara, ancona' };
    var st = D.rt.stations[sid];
    if (!st.departures || !st.departures.length) return { text: "nessuna partenza per " + st.label + "." };
    var rows = st.departures.slice(0, 10).map(function (d) {
      var treno = esc(((d.cat || "") + " " + (d.n || "")).trim());
      return [esc(d.hhmm || "--:--"), treno, esc(d.dest || ""), delayCell(d.delay_min), esc(d.platform || "") || "&mdash;"];
    });
    return { title: "PARTENZE " + st.label.toUpperCase(), table: [["ORA", "TRENO", "DESTINAZIONE", "RITARDO", "BIN"], rows] };
  }
  function cmdRitardi() {
    if (!D.rt) return { text: "live non caricato (api/realtime.json)." };
    var rows = [];
    Object.keys(D.rt.stations).forEach(function (sid) {
      var st = D.rt.stations[sid];
      (st.departures || []).forEach(function (d) {
        if (d.delay_min > 0) rows.push([esc(st.label), esc(d.hhmm || ""), esc(d.n || ""), esc(d.dest || ""), delayCell(d.delay_min)]);
      });
    });
    if (!rows.length) return { text: "nessun ritardo rilevato." };
    return { title: "RITARDI (" + rows.length + ")", table: [["STAZIONE", "ORA", "TRENO", "DESTINAZIONE", "RITARDO"], rows.slice(0, 12)] };
  }
  function cmdBus(arg) {
    if (!D.gtfs) return { text: "dati gtfs non caricati (api/gtfs.json)." };
    if (!arg) {
      var rows = D.gtfs.routes.map(function (r) { return [esc(r.id), esc(r.name)]; });
      return { title: "LINEE BUS", table: [["LINEA", "NOME"], rows], foot: "uso: bus R-ADR" };
    }
    var id = arg.toUpperCase();
    var r = D.gtfs.routes.filter(function (x) { return x.id === id; })[0];
    if (!r) return { text: 'linea sconosciuta: "' + arg + '".' };
    var byId = {};
    D.gtfs.stops.forEach(function (s) { byId[s.id] = s; });
    var out1 = { title: "LINEA " + r.id, tables: [] };
    out1.tables.push([["KM", "FERMATA", "STOP_ID"], r.stops.map(function (sid) {
      var s = byId[sid];
      return s ? [esc(String(s.km)), esc(s.name), esc(s.gtfs_stop_id || "")] : null;
    }).filter(Boolean)]);
    var mezzi = D.gtfs.vehicles.filter(function (v) { return v.route === id; });
    if (mezzi.length) {
      out1.tables.push([["MEZZO", "POSIZIONE", "STATO"], mezzi.map(function (v) {
        return [esc(v.id), esc("km " + v.km + " -> " + v.next_stop), esc(v.status === "at_stop" ? "FERMO" : v.speed_kmh + " km/h")];
      })]);
      out1.foot = "mezzi simulati";
    }
    return out1;
  }

  function showResult(res) {
    if (res.text) { typeOutput(res.text, showPrompt); return; }
    var h = document.createElement("div");
    h.className = "term-line qt-title";
    h.textContent = res.title;
    out.appendChild(h);
    scroll();
    (res.tables || [res.table]).forEach(function (t) { table(t[0], t[1]); });
    if (res.foot) addText(res.foot);
    addText("────────────────────────────────────────────");
    showPrompt();
  }

  function processCommand(cmd) {
    var cur = out.querySelector(".term-cursor");
    if (cur) cur.remove();
    if (cmd === "") { showPrompt(); return; }
    var parts = cmd.split(/\s+/), c = parts[0].toLowerCase(), arg = parts.slice(1).join(" ");
    if (c === "help" || c === "aiuto") typeOutput(T("qt.help"), showPrompt);
    else if (c === "stazioni") showResult(cmdStazioni());
    else if (c === "partenze") showResult(cmdPartenze(arg));
    else if (c === "ritardi") showResult(cmdRitardi());
    else if (c === "bus") showResult(cmdBus(arg));
    else if (c === "clear") { out.innerHTML = ""; showPrompt(); }
    else {
      var f = T("term.unknown");
      typeOutput(typeof f === "function" ? f(cmd) : f, showPrompt);
    }
  }

  function showPrompt() {
    if (bootLang !== (window.LANG && LANG.current)) { boot(true); return; }
    var row = document.createElement("div");
    row.className = "term-line term-prompt-line";
    row.innerHTML = '<span class="term-prompt-sign">$ </span><span class="term-input"></span><span class="term-cursor">█</span>';
    out.appendChild(row);
    scroll();
    var input = row.querySelector(".term-input");
    input.contentEditable = true;
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var cmd = input.textContent.trim();
        if (cmd && cmd !== hist[hist.length - 1]) hist.push(cmd);
        hi = -1;
        input.contentEditable = false;
        processCommand(cmd);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!hist.length) return;
        hi = hi === -1 ? hist.length - 1 : Math.max(0, hi - 1);
        input.textContent = hist[hi];
        caretEnd(input);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (hi === -1) return;
        hi = hi + 1;
        input.textContent = hi >= hist.length ? (hi = -1, "") : hist[hi];
        caretEnd(input);
      }
    });
  }

  function boot(instant) {
    if (running) return;
    running = true;
    out.innerHTML = "";
    bootLang = window.LANG && LANG.current;
    var L = [box("TPL QUERY TERMINAL v1.0"), ""];
    L.push(T("qt.boot"));
    L.push("");
    if (D.rt) {
      var n = Object.keys(D.rt.stations).reduce(function (a, s) { return a + ((D.rt.stations[s].departures || []).length); }, 0);
      var via = (D.rt.source && D.rt.source.indexOf("mysql") !== -1) ? " via MySQL" : "";
      L.push("  [✓] live viaggiatreno" + via + ".".repeat(via ? 1 : 4) + " " + n + " partenze");
    } else L.push("  [--] live non disponibile (solo bus simulato)");
    if (D.gtfs) L.push("  [✓] gtfs mdb-1319" + ".".repeat(8) + " " + D.gtfs.stops.length + " fermate, " + D.gtfs.routes.length + " linee");
    L.push("", T("qt.ready"), "────────────────────────────────────────────", "");
    var show = function () { running = false; showPrompt(); };
    if (instant) {
      L.forEach(function (l) {
        if (l === "") return;
        var div = document.createElement("div");
        div.className = "term-line";
        div.textContent = l;
        out.appendChild(div);
      });
      scroll();
      show();
    } else typeOutput(L.join("\n"), show);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var screen = document.getElementById("qt-screen");
    if (!screen) return;
    scr = screen;
    out = document.getElementById("qt-out");
    // API MySQL prima, JSON statici come fallback (il sito non si rompe mai)
    function firstOk(urls) {
      return urls.reduce(function (p, u) {
        return p.catch(function () {
          return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); });
        });
      }, Promise.reject());
    }
    Promise.all([
      firstOk(["api/query.php?a=realtime", "api/realtime.json"]).catch(function () { return null; }),
      firstOk(["api/query.php?a=gtfs", "api/gtfs.json"]).catch(function () { return null; })
    ]).then(function (res) {
      D.rt = res[0]; D.gtfs = res[1];
      setTimeout(function () { boot(false); }, 400);
    });
    scr.addEventListener("click", function () {
      var inp = out.querySelector('.term-prompt-line .term-input[contenteditable="true"]');
      if (inp) { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } }
    });
  });
})();
