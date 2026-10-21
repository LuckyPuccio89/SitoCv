// Palestra HTML: ricomponi componenti veri del sito. Anteprima in iframe sandbox,
// verifica su documento parsato (DOMParser: gli script non vengono mai eseguiti).
(function () {
  var LV = [
    { id: "H1", t: "Scheda progetto", d: "Un article con h3 (titolo), p (descrizione) e a con href — come le card di projects.html.",
      starter: `<article>
  <h3></h3>
  <p></p>
  <a href=""></a>
</article>`,
      sol: `<article>
  <h3>Infomobility GTFS Live</h3>
  <p>Fermate reali e partenze live Fano-Ancona.</p>
  <a href="gtfs-demo.html">APRI_DEMO</a>
</article>` },
    { id: "H2", t: "Tabella orari", d: "Una table con thead da 3 th e tbody con 2 righe da 3 td — come i tabelloni demo.",
      starter: `<table>
  <thead>
    <tr><th></th><th></th><th></th></tr>
  </thead>
  <tbody>
    <tr><td></td><td></td><td></td></tr>
  </tbody>
</table>`,
      sol: `<table>
  <thead>
    <tr><th>MEZZO</th><th>LINEA</th><th>ETA</th></tr>
  </thead>
  <tbody>
    <tr><td>AB123CD</td><td>R-ADR</td><td>12:04</td></tr>
    <tr><td>EF456GH</td><td>R-LOC</td><td>12:11</td></tr>
  </tbody>
</table>` },
    { id: "H3", t: "Navigazione", d: "Un nav con ul da almeno 3 li, ognuno con un a che punta a una pagina vera.",
      starter: `<nav>
  <ul>
    <li><a href=""></a></li>
  </ul>
</nav>`,
      sol: `<nav>
  <ul>
    <li><a href="index.html">HOME</a></li>
    <li><a href="projects.html">PROGETTI</a></li>
    <li><a href="contact.html">CONTATTI</a></li>
  </ul>
</nav>` },
    { id: "H4", t: "Form contatti", d: "Un form con input text nominato, input email nominato, textarea nominata e button submit — come contact.html.",
      starter: `<form action="#" method="post">
</form>`,
      sol: `<form action="#" method="post">
  <input type="text" name="nome">
  <input type="email" name="email">
  <textarea name="messaggio"></textarea>
  <button type="submit">INVIA</button>
</form>` },
    { id: "H5", t: "Immagine con didascalia", d: "Un figure con img (src + alt obbligatori) e figcaption — come le dashboard del sito.",
      starter: `<figure>
  <img src="" alt="">
  <figcaption></figcaption>
</figure>`,
      sol: `<figure>
  <img src="img/dashboard.png" alt="Dashboard KPI ART">
  <figcaption>Dashboard ART: puntualita mensile.</figcaption>
</figure>` },
    { id: "H6", t: "Pagina semantica", d: "header con h1, main con un paragrafo, footer — lo scheletro di ogni pagina del sito.",
      starter: `<header>
</header>
<main>
</main>
<footer>
</footer>`,
      sol: `<header>
  <h1>Palestra HTML</h1>
  <nav><a href="index.html">HOME</a></nav>
</header>
<main>
  <p>Esercizi pratici su esempi reali.</p>
</main>
<footer>
  <p>Stefano Pucci 2026</p>
</footer>` }
  ];
  function txt(el) { return el ? el.textContent.trim() : ""; }
  function attr(el, a) { return el ? (el.getAttribute(a) || "").trim() : ""; }
  var CHECKS = {
    H1: function (doc, msg) {
      var a = doc.querySelector("article");
      if (!a) return msg("manca <article>");
      if (!txt(a.querySelector("h3"))) return msg("h3 vuoto: serve un titolo");
      if (!txt(a.querySelector("p"))) return msg("p vuota: serve una descrizione");
      if (!attr(a.querySelector("a"), "href")) return msg("<a> senza href");
      return null;
    },
    H2: function (doc, msg) {
      var t = doc.querySelector("table");
      if (!t) return msg("manca <table>");
      if (t.querySelectorAll("thead th").length < 3) return msg("thead: servono almeno 3 <th>");
      var rows = t.querySelectorAll("tbody tr");
      if (rows.length < 2) return msg("tbody: servono almeno 2 righe");
      for (var i = 0; i < rows.length; i++)
        if (rows[i].querySelectorAll("td").length < 3) return msg("riga " + (i + 1) + ": servono 3 <td>");
      return null;
    },
    H3: function (doc, msg) {
      var n = doc.querySelector("nav");
      if (!n) return msg("manca <nav>");
      var li = n.querySelectorAll("ul li");
      if (li.length < 3) return msg("servono almeno 3 <li> dentro <ul>");
      for (var i = 0; i < li.length; i++)
        if (!attr(li[i].querySelector("a"), "href")) return msg("voce " + (i + 1) + ": <a> senza href");
      return null;
    },
    H4: function (doc, msg) {
      var f = doc.querySelector("form");
      if (!f) return msg("manca <form>");
      if (!f.querySelector('input[type="text"][name]')) return msg('manca <input type="text" name="...">');
      if (!f.querySelector('input[type="email"][name]')) return msg('manca <input type="email" name="...">');
      if (!f.querySelector("textarea[name]")) return msg('manca <textarea name="...">');
      if (!f.querySelector('button[type="submit"]')) return msg('manca <button type="submit">');
      return null;
    },
    H5: function (doc, msg) {
      var f = doc.querySelector("figure");
      if (!f) return msg("manca <figure>");
      var img = f.querySelector("img");
      if (!img) return msg("manca <img>");
      if (!attr(img, "src")) return msg("<img> senza src");
      if (!attr(img, "alt")) return msg("<img> senza alt (accessibilita)");
      if (!txt(f.querySelector("figcaption"))) return msg("figcaption vuota");
      return null;
    },
    H6: function (doc, msg) {
      var h = doc.querySelector("header"), m = doc.querySelector("main"), f = doc.querySelector("footer");
      if (!h) return msg("manca <header>");
      if (!m) return msg("manca <main>");
      if (!f) return msg("manca <footer>");
      if (!txt(h.querySelector("h1"))) return msg("header: serve <h1> con titolo");
      if (!m.querySelector("p, table, ul")) return msg("main: serve un contenuto (p, table o ul)");
      if (!txt(f)) return msg("footer vuoto");
      return null;
    }
  };
  var cur = "H1", done = {};
  try { done = JSON.parse(localStorage.getItem("lab_html_done") || "{}"); } catch (e) { done = {}; }
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
  function save() { try { localStorage.setItem("lab_html_done", JSON.stringify(done)); } catch (e) {} }
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
  function render() { preview.srcdoc = input.value; }
  function run() {
    var code = input.value;
    render();
    var doc;
    try {
      doc = new DOMParser().parseFromString(code, "text/html");
    } catch (e) { addText("[ERRORE] HTML non analizzabile."); return; }
    var err = CHECKS[cur](doc, function (m) { return m; });
    if (!err) {
      done[cur] = true; save(); renderLevels();
      var ids = LV.map(function (e) { return e.id; });
      var next = ids[ids.indexOf(cur) + 1];
      addText("[✓] " + cur + " SUPERATO" + (next ? " — passa a " + next : " — palestra completata!"));
    } else addText("[..] " + cur + ": " + err);
  }

  document.addEventListener("DOMContentLoaded", function () {
    scr = document.getElementById("lab-screen");
    if (!scr) return;
    out = document.getElementById("lab-out");
    input = document.getElementById("lab-input");
    preview = document.getElementById("lab-preview");
    renderLevels();
    typeOutput("HTML LAB v1.0 — ricomponi i componenti veri del sito.\nScrivi il frammento, vedi l'anteprima, premi VERIFICA.\nSenza timer.", function () { setLevel("H1"); });
    input.addEventListener("input", render);
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
