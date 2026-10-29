// GTFS-live: partenze reali Viaggiatreno da api/realtime.json (poll ogni 5 min via cron).
// Fallback grazioso: se il file manca o e vecchio, badge SIMULATO/STALE.
(function () {
  var STATIONS = [
    ["S07105", "Fano"],
    ["S07108", "Senigallia"],
    ["S07111", "Falconara M."],
    ["S07113", "Ancona"]
  ];
  var current = "S07113";
  var direction = "dep"; // dep = partenze, arr = arrivi
  var lastData = null;

  function $(id) { return document.getElementById(id); }
  function T(k, fb) {
    if (window.LANG && typeof LANG.t === "function") { var v = LANG.t(k); return v === k ? fb : v; }
    return fb;
  }

  function ageSec(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return Infinity;
    return (Date.now() - t) / 1000;
  }

  function badge(mode, age) {
    var el = $("live-badge");
    if (!el) return;
    var dot = '<span class="status-dot"></span> ';
    if (mode === "live") {
      el.style.borderColor = "rgba(0,255,65,.25)";
      el.style.color = "#00FF41";
      el.innerHTML = dot + "<span>LIVE &bull; " + Math.round(age) + "s ago</span>";
    } else if (mode === "stale") {
      el.style.borderColor = "rgba(234,179,8,.4)";
      el.style.color = "#eab308";
      el.innerHTML = dot + "<span>STALE &bull; dati vecchi</span>";
    } else {
      el.style.borderColor = "rgba(255,80,80,.4)";
      el.style.color = "#ff8080";
      el.innerHTML = dot + "<span>SIMULATO &bull; live non disponibile</span>";
    }
  }

  function fmtSync(iso) {
    var d = new Date(iso);
    if (!iso || isNaN(d.getTime())) return "n/d";
    var locale = (window.LANG && LANG.current === "en") ? "en-GB" : "it-IT";
    return d.toLocaleString(locale, {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
  }

  // Console di data freshness: [LIVE] / [STALE] / [SIMULATO] + LAST_SYNC + stazioni
  function setFreshness(mode, iso) {
    var el = $("fresh-daemon");
    if (el) {
      el.className = "fr-badge " + (mode === "live" ? "fr-live" : mode === "stale" ? "fr-stale" : "fr-sim");
      var en = (window.LANG && LANG.current === "en");
      var label = mode === "live" ? "LIVE" : mode === "stale" ? "STALE" : (en ? "SIMULATED" : "SIMULATO");
      el.innerHTML = '<span class="fr-dot"></span><span>[' + label + ']</span>';
    }
    var sync = $("fresh-sync");
    if (sync) sync.textContent = fmtSync(iso);
    var cnt = $("fresh-stations");
    if (cnt) cnt.textContent = STATIONS.length + "/" + STATIONS.length;
  }

  function render(data) {
    lastData = data;
    var st = data.stations && data.stations[current];
    var tb = $("live-board-body");
    if (!tb) return;
    var th = $("live-th-place");
    if (th) th.textContent = direction === "arr" ? T("gtfs.live_from", "PROVENIENZA") : T("gtfs.live_to", "DESTINAZIONE");
    var list = st && (direction === "arr" ? st.arrivals : st.departures);
    var placeKey = direction === "arr" ? "orig" : "dest";
    if (!st || !list) {
      tb.innerHTML = '<tr><td colspan="5">live non disponibile per questa stazione</td></tr>';
      return;
    }
    tb.innerHTML = list.slice(0, 10).map(function (d) {
      var delay = (d.delay_min === null || d.delay_min === undefined) ? "&mdash;"
        : (d.delay_min > 0 ? "+" + d.delay_min + "'" : "puntuale");
      var flag = (direction === "arr" && d.arrived) ? " ✓" : "";
      return "<tr><td>" + (d.hhmm || "&mdash;") + "</td><td>" + (d.cat || "")
        + " " + (d.n || "") + "</td><td>" + (d[placeKey] || "") + flag + "</td><td>"
        + delay + "</td><td>" + (d.platform || "&mdash;") + "</td></tr>";
    }).join("");
    var upd = $("live-updated");
    if (upd) upd.textContent = "fonte: viaggiatreno-infomobilita • " + data.generated_at;
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("live-board-body")) return;
    // tab partenze/arrivi
    var tabDep = $("live-tab-dep"), tabArr = $("live-tab-arr");
    function setDir(d) {
      direction = d;
      if (tabDep) tabDep.classList.toggle("btn-outline", d !== "dep");
      if (tabArr) tabArr.classList.toggle("btn-outline", d !== "arr");
      if (lastData) render(lastData);
    }
    if (tabDep) tabDep.addEventListener("click", function () { setDir("dep"); });
    if (tabArr) tabArr.addEventListener("click", function () { setDir("arr"); });
    // selettore stazioni
    var wrap = $("live-stations");
    if (wrap) {
      wrap.innerHTML = STATIONS.map(function (s) {
        return '<button class="btn btn-sm ' + (s[0] === current ? "" : "btn-outline")
          + '" data-live-st="' + s[0] + '">' + s[1] + "</button>";
      }).join("");
      wrap.querySelectorAll("[data-live-st]").forEach(function (b) {
        b.addEventListener("click", function () {
          current = b.getAttribute("data-live-st");
          wrap.querySelectorAll("[data-live-st]").forEach(function (x) {
            var on = x.getAttribute("data-live-st") === current;
            x.classList.toggle("btn-outline", !on);
          });
          load();
        });
      });
    }
    function load() {
      if (typeof window.fetchStationData !== "function") {
        badge("off", 0);
        setFreshness("sim", null);
        return;
      }
      window.fetchStationData(current).then(function (st) {
        var age = ageSec(st.generated_at);
        var staleAfter = st.stale_after_s || 360; // 6 minuti
        // MySQL = live/stale in base all'eta'; snapshot statico = simulato
        var mode = st.source === "mysql" ? (age <= staleAfter ? "live" : "stale") : "sim";
        badge(mode, age);
        setFreshness(mode, st.generated_at);
        lastData = { generated_at: st.generated_at, stations: {} };
        lastData.stations[current] = {
          label: st.label,
          departures: st.departures,
          arrivals: st.arrivals
        };
        render(lastData);
      }).catch(function () {
        badge("off", 0);
        setFreshness("sim", null);
      });
    }
    load();
    setInterval(load, 300000); // riallinea al cron 5 min
  });
})();
