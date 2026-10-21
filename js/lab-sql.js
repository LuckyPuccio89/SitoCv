// Palestra SQL: Fase 0 (ricostruisci il DB aziendale reale) + Fase 1 (6 query).
// Endpoint: api/lab-write.php (sandbox lab_*) per Fase 0, api/lab-sql.php (SELECT azienda_demo) per Fase 1.
(function () {
  var TUT = [
    { id: "F0", t: "Crea il database", d: "Ogni azienda parte da qui: crea il database lab_azienda. I nomi dei DB palestra iniziano sempre con lab_.",
      sol: "CREATE DATABASE IF NOT EXISTS lab_azienda;",
      vq: "SHOW DATABASES LIKE 'lab_azienda';", contains: "lab_azienda" },
    { id: "F1", t: "Tabella sedi", d: "Crea la tabella sedi: 3 colonne reali dell'azienda (id, nome, citta, indirizzo).",
      sol: "CREATE TABLE IF NOT EXISTS lab_azienda.sedi (id INT PRIMARY KEY, nome VARCHAR(64), citta VARCHAR(40), indirizzo VARCHAR(80));",
      vq: "SHOW TABLES IN lab_azienda;", contains: "sedi" },
    { id: "F2", t: "Popola le sedi (dati reali)", d: "Inserisci le 3 sedi vere dell'azienda con un solo INSERT multi-riga.",
      sol: "INSERT INTO lab_azienda.sedi VALUES (1, 'Sede centrale', 'Senigallia', 'S.S. Adriatica Sud 228'), (2, 'Deposito Ancona', 'Ancona', 'Via Bocconi 35'), (3, 'Officina Falconara', 'Falconara Marittima', 'Via del Lavoro 12');",
      vq: "SELECT COUNT(*) AS n FROM lab_azienda.sedi;", cols: ["n"], rows: [[3]] },
    { id: "F3", t: "Tabella dipendenti", d: "Crea dipendenti con chiave esterna verso sedi: cosi' il DB garantisce che ogni sede_id esista davvero.",
      sol: "CREATE TABLE IF NOT EXISTS lab_azienda.dipendenti (matricola INT PRIMARY KEY, nome VARCHAR(40), cognome VARCHAR(40), ruolo VARCHAR(32), sede_id INT, assunto DATE, stipendio DECIMAL(8, 2), FOREIGN KEY (sede_id) REFERENCES lab_azienda.sedi(id));",
      vq: "SHOW TABLES IN lab_azienda;", contains: "dipendenti" },
    { id: "F4", t: "Popola i dipendenti (dati reali)", d: "Inserisci gli 8 dipendenti veri: autisti, meccanici, impiegati con stipendi e date di assunzione.",
      sol: "INSERT INTO lab_azienda.dipendenti VALUES (101, 'Marco', 'Rossi', 'autista', 2, '2019-03-04', 1750.00), (102, 'Laura', 'Bianchi', 'autista', 2, '2020-06-15', 1720.00), (103, 'Giuseppe', 'Verdi', 'meccanico', 3, '2018-01-20', 1980.00), (104, 'Anna', 'Neri', 'impiegata', 1, '2021-09-01', 1650.00), (105, 'Paolo', 'Gialli', 'autista', 1, '2022-02-14', 1680.00), (106, 'Sara', 'Blu', 'controller', 1, '2020-11-30', 1820.00), (107, 'Luca', 'Viola', 'meccanico', 3, '2023-05-08', 1900.00), (108, 'Elena', 'Grigi', 'autista', 2, '2021-04-19', 1700.00);",
      vq: "SELECT COUNT(*) AS n FROM lab_azienda.dipendenti;", cols: ["n"], rows: [[8]] },
    { id: "F5", t: "Verifica: chi lavora dove", d: "Il DB che hai ricostruito risponde: unisci dipendenti e sedi con JOIN, come in produzione.",
      sol: "SELECT d.nome, d.cognome, s.nome AS sede FROM lab_azienda.dipendenti d JOIN lab_azienda.sedi s ON s.id = d.sede_id ORDER BY d.matricola;",
      vq: null, cols: ["nome", "cognome", "sede"],
      rows: [["Marco", "Rossi", "Deposito Ancona"], ["Laura", "Bianchi", "Deposito Ancona"], ["Giuseppe", "Verdi", "Officina Falconara"], ["Anna", "Neri", "Sede centrale"], ["Paolo", "Gialli", "Sede centrale"], ["Sara", "Blu", "Sede centrale"], ["Luca", "Viola", "Officina Falconara"], ["Elena", "Grigi", "Deposito Ancona"]] }
  ];
  var LV = [
    { id: "L1", t: "Tutti i clienti", d: "Elenca id, ragione_sociale e citta di TUTTI i clienti.",
      sol: "SELECT id, ragione_sociale, citta FROM clienti;",
      cols: ["id", "ragione_sociale", "citta"],
      rows: [[1, "Comune di Ancona", "Ancona"], [2, "Comune di Senigallia", "Senigallia"], [3, "Atahotel Varese", "Falconara Marittima"], [4, "Scuole Jesi", "Jesi"], [5, "Confindustria Ancona", "Ancona"]] },
    { id: "L2", t: "Solo autisti", d: "Nome e cognome dei dipendenti con ruolo 'autista'.",
      sol: "SELECT nome, cognome FROM dipendenti WHERE ruolo = 'autista';",
      cols: ["nome", "cognome"],
      rows: [["Marco", "Rossi"], ["Laura", "Bianchi"], ["Paolo", "Gialli"], ["Elena", "Grigi"]] },
    { id: "L3", t: "Costi officina", d: "Costo totale manutenzioni per tipo (ordinaria/straordinaria). Usa SUM + GROUP BY.",
      sol: "SELECT tipo, SUM(costo) AS totale FROM manutenzioni GROUP BY tipo;",
      cols: ["tipo", "totale"],
      rows: [["ordinaria", 1085], ["straordinaria", 2450]] },
    { id: "L4", t: "Corse del 13/10", d: "Id corsa + descrizione linea per le corse del 2026-10-13. Serve JOIN corse-linee.",
      sol: "SELECT c.id, l.descrizione FROM corse c JOIN linee l ON l.codice = c.linea WHERE c.data = '2026-10-13';",
      cols: ["id", "descrizione"],
      rows: [[4, "Scolastico Jesi-Ancona"], [5, "Regionale Adriatica Fano-Ancona"], [6, "Locale Senigallia-Ancona"]] },
    { id: "L5", t: "Ricavi biglietti", d: "Per ogni tipo biglietto: ricavo totale e numero venduti. GROUP BY + SUM + COUNT.",
      sol: "SELECT tipo, SUM(prezzo) AS ricavo, COUNT(*) AS n FROM biglietti GROUP BY tipo;",
      cols: ["tipo", "ricavo", "n"],
      rows: [["abbonamento", 91, 3], ["corsa_semplice", 17, 7], ["giornaliero", 9.5, 2]] },
    { id: "L6", t: "Tratta top", d: "La linea con più passeggeri totali (una sola riga). GROUP BY + ORDER BY + LIMIT.",
      sol: "SELECT linea, SUM(passeggeri) AS tot FROM corse GROUP BY linea ORDER BY tot DESC LIMIT 1;",
      cols: ["linea", "tot"],
      rows: [["R-ADR", 207]] }
  ];
  var ALL = TUT.concat(LV);
  function byId(id) { for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i]; return null; }
  var cur = "F0", done = {};
  try { done = JSON.parse(localStorage.getItem("lab_sql_done_v2") || "{}"); } catch (e) { done = {}; }
  var scr = null, out = null;

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
  function table(headers, rows) {
    var h = '<table class="qt-table"><thead><tr>';
    headers.forEach(function (c) {
      var s = document.createElement("span"); s.textContent = c;
      h += "<th>" + s.innerHTML + "</th>";
    });
    h += "</tr></thead><tbody>";
    rows.forEach(function (r) {
      h += "<tr>" + r.map(function (c) {
        var s = document.createElement("span");
        s.textContent = (c === null || c === undefined) ? "" : String(c);
        return "<td>" + s.innerHTML + "</td>";
      }).join("") + "</tr>";
    });
    var div = document.createElement("div");
    div.className = "term-line"; div.innerHTML = h + "</tbody></table>";
    out.appendChild(div); scroll();
  }
  function num(v) {
    if (typeof v === "number") return Math.round(v * 100) / 100;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Math.round(Number(v) * 100) / 100;
    return v;
  }
  function check(ex, cols, rows) {
    var idx = ex.cols.map(function (c) {
      return cols.findIndex(function (r) { return String(r).toLowerCase() === c.toLowerCase(); });
    });
    if (idx.some(function (i) { return i < 0; })) return false;
    var got = rows.map(function (r) { return JSON.stringify(idx.map(function (i) { return num(r[i]); })); }).sort();
    var exp = ex.rows.map(function (r) { return JSON.stringify(r.map(num)); }).sort();
    return JSON.stringify(got) === JSON.stringify(exp);
  }
  function flatContains(cols, rows, needle) {
    var hay = cols.join(" ").toLowerCase();
    rows.forEach(function (r) { hay += " " + r.join(" ").toLowerCase(); });
    return hay.indexOf(String(needle).toLowerCase()) >= 0;
  }
  function save() { try { localStorage.setItem("lab_sql_done_v2", JSON.stringify(done)); } catch (e) {} }
  function renderLevels() {
    var row = document.getElementById("lvl-row");
    row.innerHTML = "";
    ALL.forEach(function (ex) {
      var b = document.createElement("button");
      b.className = "btn btn-sm" + (done[ex.id] ? " done" : " btn-outline");
      b.textContent = (done[ex.id] ? "✓ " : "") + ex.id;
      b.title = ex.t;
      b.addEventListener("click", function () { setLevel(ex.id); });
      row.appendChild(b);
    });
  }
  function pass(id) {
    done[id] = true; save(); renderLevels();
    var next = null;
    for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id && i + 1 < ALL.length) next = ALL[i + 1].id;
    addText("[✓] " + id + " SUPERATO" + (next ? " — passa a " + next : " — palestra completata!"));
  }
  function setLevel(id) {
    cur = id;
    var ex = byId(id);
    renderLevels();
    var h = document.createElement("div");
    h.className = "term-line qt-title"; h.textContent = id + " — " + ex.t;
    out.appendChild(h); scroll();
    addText(ex.d);
    var starter = ex.sol.split("\n")[0];
    if (/^\s*(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN)\b/i.test(starter)) {
      document.getElementById("sql-input").value = "-- " + id + ": " + ex.t + "\nSELECT ";
    } else {
      document.getElementById("sql-input").value = "-- " + id + ": " + ex.t + "\n";
    }
  }
  function post(ep, q) {
    return fetch(ep, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: q })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
  }
  function run() {
    var ex = byId(cur);
    var raw = document.getElementById("sql-input").value;
    // via le righe di commento -- : al server va solo SQL vero
    var q = raw.split("\n").filter(function (l) { return l.trim().indexOf("--") !== 0; }).join("\n").trim();
    var first = q.split("\n").filter(function (l) { return l.trim() !== ""; })[0] || "";
    addText("$ " + first);
    if (!q) { addText("[..] niente da eseguire: scrivi la query sotto il commento, oppure premi SOLUZIONE."); return; }
    if (ex.vq !== undefined || ex.contains || ex.id.charAt(0) === "F") {
      // Fase 0: esegui in sandbox, poi verifica
      post("api/lab-write.php", q).then(function (res) {
        if (!res.ok) { addText("[ERRORE] " + res.j.error); return; }
        if (res.j.cols) { table(res.j.cols, res.j.rows.slice(0, 20)); addText(res.j.n + " righe. [" + res.j.src + "]"); }
        else addText("[OK] " + (res.j.affected || 0) + " righe coinvolte. [" + res.j.src + "] — verifica in corso...");
        verifyTut(ex);
      }).catch(function () { addText("[ERRORE] API non raggiungibile."); });
    } else {
      // Fase 1: SELECT sul DB condiviso
      post("api/lab-sql.php", q).then(function (res) {
        if (!res.ok) { addText("[ERRORE] " + res.j.error); return; }
        table(res.j.cols, res.j.rows.slice(0, 20));
        addText(res.j.n + " righe.");
        if (check(ex, res.j.cols, res.j.rows)) pass(ex.id);
        else addText("[..] risultato diverso dall'atteso per " + ex.id + " — riprova o chiedi SUGGERIMENTO.");
      }).catch(function () { addText("[ERRORE] API non raggiungibile."); });
    }
  }
  function verifyTut(ex) {
    function good() { pass(ex.id); }
    function bad() { addText("[..] verifica di " + ex.id + " non ancora superata — controlla la soluzione o premi SOLUZIONE."); }
    if (ex.vq) {
      post("api/lab-write.php", ex.vq).then(function (res) {
        if (!res.ok) { bad(); return; }
        if (ex.contains) { if (flatContains(res.j.cols, res.j.rows, ex.contains)) good(); else bad(); }
        else if (ex.cols) {
          table(res.j.cols, res.j.rows);
          if (check(ex, res.j.cols, res.j.rows)) good(); else bad();
        }
      }).catch(function () { addText("[ERRORE] API non raggiungibile."); });
    } else {
      // F5: la SELECT stessa e' la verifica (senza righe di commento)
      var rawq = document.getElementById("sql-input").value;
      var q = rawq.split("\n").filter(function (l) { return l.trim().indexOf("--") !== 0; }).join("\n").trim();
      post("api/lab-write.php", q).then(function (res) {
        if (!res.ok || !res.j.cols) { bad(); return; }
        if (check(ex, res.j.cols, res.j.rows)) good(); else bad();
      }).catch(function () { addText("[ERRORE] API non raggiungibile."); });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    scr = document.getElementById("sql-screen");
    if (!scr) return;
    out = document.getElementById("sql-out");
    renderLevels();
    typeOutput("SQL LAB v2.0 — FASE 0: ricostruisci il DB aziendale (sandbox lab_*).\nFASE 1 (L1-L6): interroga il DB condiviso azienda_demo.\nSenza timer. RESET ricomincia la Fase 0 da zero.", function () { setLevel("F0"); });
    document.getElementById("sql-run").addEventListener("click", run);
    document.getElementById("sql-hint").addEventListener("click", function () {
      addText("[SUGGERIMENTO " + cur + "] " + byId(cur).d);
    });
    document.getElementById("sql-solution").addEventListener("click", function () {
      var ex = byId(cur);
      addText("[SOLUZIONE " + cur + "]");
      document.getElementById("sql-input").value = ex.sol;
      table(["query"], [[ex.sol]]);
    });
    document.getElementById("sql-reset").addEventListener("click", function () {
      post("api/lab-write.php", "DROP DATABASE IF EXISTS lab_azienda;").then(function (res) {
        if (!res.ok) { addText("[ERRORE] " + res.j.error); return; }
        Object.keys(done).forEach(function (k) { if (k.charAt(0) === "F") delete done[k]; });
        save(); renderLevels();
        addText("[OK] sandbox azzerata — riparti da F0.");
      }).catch(function () { addText("[ERRORE] API non raggiungibile."); });
    });
  });
})();
