// GTFS-mini demo: mappa schematica SVG + tabellone arrivi, dati da api/gtfs.json
// Zero dipendenze. Simula avanzamento mezzi tipo AVM/AVL.
(function () {
  var state = { data: null, filter: 'ALL', timer: null };

  function $(id) { return document.getElementById(id); }

  function kmToX(km, maxKm, w, pad) {
    return pad + (km / maxKm) * (w - pad * 2);
  }

  function renderMap() {
    var svg = $('gtfs-map');
    if (!svg || !state.data) return;
    var W = 900, H = 220, pad = 60;
    var maxKm = Math.max.apply(null, state.data.stops.map(function (s) { return s.km; }));
    var routeIdx = {};
    state.data.routes.forEach(function (r, i) { routeIdx[r.id] = i; });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var html = '';
    // linee
    state.data.routes.forEach(function (r, ri) {
      if (state.filter !== 'ALL' && state.filter !== r.id) return;
      var y = 80 + ri * 60;
      html += '<line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y + '" stroke="' + r.color + '" stroke-width="3" opacity="0.35"/>';
      html += '<text x="8" y="' + (y + 4) + '" fill="' + r.color + '" font-size="13" font-family="monospace">' + r.id + '</text>';
    });
    // fermate
    state.data.stops.forEach(function (s) {
      var x = kmToX(s.km, maxKm, W, pad);
      html += '<circle cx="' + x + '" cy="80" r="5" fill="#0D0D0F" stroke="#00F0FF" stroke-width="2"/>';
      html += '<circle cx="' + x + '" cy="140" r="5" fill="#0D0D0F" stroke="#00FF41" stroke-width="2"/>';
      html += '<text x="' + x + '" y="175" fill="#8E9AAF" font-size="11" text-anchor="middle" font-family="monospace">' + s.name + '</text>';
      html += '<text x="' + x + '" y="190" fill="#3a3a4a" font-size="10" text-anchor="middle" font-family="monospace">km ' + s.km + '</text>';
    });
    // mezzi
    state.data.vehicles.forEach(function (v) {
      if (state.filter !== 'ALL' && state.filter !== v.route) return;
      var ri = routeIdx[v.route] || 0;
      var y = 80 + ri * 60;
      var x = kmToX(v.km, maxKm, W, pad);
      var baseCol = (state.data.routes[ri] && state.data.routes[ri].color) || '#00F0FF';
      var col = v.status === 'at_stop' ? '#eab308' : baseCol;
      html += '<g><rect x="' + (x - 34) + '" y="' + (y - 28) + '" width="68" height="18" rx="2" fill="#0D0D0F" stroke="' + col + '" stroke-width="1"/>'
        + '<text x="' + x + '" y="' + (y - 15) + '" fill="' + col + '" font-size="10" text-anchor="middle" font-family="monospace">' + v.id + '</text>'
        + '<circle cx="' + x + '" cy="' + y + '" r="7" fill="' + col + '"/></g>';
    });
    svg.innerHTML = html;
  }

  function renderBoard() {
    var tb = $('gtfs-board-body');
    if (!tb || !state.data) return;
    var stopById = {};
    state.data.stops.forEach(function (s) { stopById[s.id] = s; });
    var rows = state.data.vehicles
      .filter(function (v) { return state.filter === 'ALL' || v.route === state.filter; })
      .map(function (v) {
        var stop = stopById[v.next_stop];
        var dist = stop ? Math.max(0, stop.km - v.km) : 0;
        var eta = v.speed_kmh > 0 ? Math.round(dist / v.speed_kmh * 60) : '—';
        var delay = v.delay_min > 0 ? '+' + v.delay_min + ' min' : (v.delay_min < 0 ? v.delay_min + ' min' : 'in orario');
        return '<tr><td>' + v.id + '</td><td>' + v.route + '</td><td>' + (stop ? stop.name : v.next_stop)
          + '</td><td>' + eta + (eta === '—' ? '' : ' min') + '</td><td>' + delay + '</td>'
          + '<td>' + (v.status === 'at_stop' ? 'FERMO' : v.speed_kmh + ' km/h') + '</td></tr>';
      }).join('');
    tb.innerHTML = rows;
    var upd = $('gtfs-updated');
    if (upd) upd.textContent = 'last_update: ' + new Date().toLocaleTimeString();
  }

  function tick() {
    if (!state.data) return;
    state.data.vehicles.forEach(function (v) {
      if (v.status === 'at_stop') {
        if (Math.random() < 0.3) { v.status = 'in_service'; v.speed_kmh = 38 + Math.round(Math.random() * 18); }
        return;
      }
      v.km += v.speed_kmh / 3600 * 2; // 2s di simulazione
      if (v.km >= 46.7) { v.km = 0; v.delay_min = 0; }
      // fermata casuale
      if (Math.random() < 0.04) { v.status = 'at_stop'; v.speed_kmh = 0; }
    });
    // aggiorna next_stop al più vicino davanti
    state.data.vehicles.forEach(function (v) {
      var ahead = state.data.stops.filter(function (s) { return s.km >= v.km - 0.3; });
      if (ahead.length) v.next_stop = ahead[0].id;
    });
    renderMap();
    renderBoard();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('gtfs-map')) return;
    fetch('api/gtfs.json').then(function (r) { return r.json(); }).then(function (d) {
      state.data = d;
      renderMap();
      renderBoard();
      state.timer = setInterval(tick, 2000);
    }).catch(function () {
      var e = $('gtfs-error');
      if (e) e.style.display = 'block';
    });
    document.querySelectorAll('[data-route-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.filter = b.getAttribute('data-route-filter');
        document.querySelectorAll('[data-route-filter]').forEach(function (x) {
          x.classList.toggle('active', x === b);
        });
        renderMap();
        renderBoard();
      });
    });
  });
})();
