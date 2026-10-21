// KPI ART-mini demo: calcola indicatori da api/kpi.json, grafici canvas vanilla
(function () {
  function $(id) { return document.getElementById(id); }

  function calc(rows, th) {
    var totSched = 0, totOp = 0, totCanc = 0, totPunct = 0, totKm = 0, totCompl = 0;
    rows.forEach(function (r) {
      totSched += r.scheduled; totOp += r.operated; totCanc += r.cancelled;
      totPunct += r.punctual; totKm += r.km; totCompl += r.complaints;
    });
    var punct = totPunct / totOp * 100;
    var cover = totOp / totSched * 100;
    var canc = totCanc / totSched * 100;
    var compl10k = totCompl / (totKm / 10000);
    return [
      { key: 'punct', label: 'PUNTUALITA', value: punct, fmt: punct.toFixed(2) + '%', ok: punct >= th.punctuality_pct_min, target: '≥ ' + th.punctuality_pct_min + '%' },
      { key: 'cover', label: 'CORSE_EFFETTUATE', value: cover, fmt: cover.toFixed(2) + '%', ok: cover >= th.trips_coverage_pct_min, target: '≥ ' + th.trips_coverage_pct_min + '%' },
      { key: 'canc', label: 'SOPPRESSE', value: canc, fmt: canc.toFixed(2) + '%', ok: canc <= th.cancelled_pct_max, target: '≤ ' + th.cancelled_pct_max + '%' },
      { key: 'compl', label: 'RECLAMI/10kKM', value: compl10k, fmt: compl10k.toFixed(2), ok: compl10k <= th.complaints_per_10k_max, target: '≤ ' + th.complaints_per_10k_max }
    ];
  }

  function barChart(canvas, labels, seriesA, seriesB, labelA, labelB) {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.clientWidth || 640, H = 260;
    canvas.width = W * dpr; canvas.height = H * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    var max = Math.max.apply(null, seriesA.concat(seriesB)) * 1.1;
    var n = labels.length, gw = W / n, bw = Math.min(22, gw / 4);
    ctx.font = '10px monospace';
    labels.forEach(function (lb, i) {
      var x = i * gw + gw / 2;
      [[seriesA[i], '#00F0FF', -bw - 2], [seriesB[i], '#00FF41', 2]].forEach(function (s) {
        var h = (s[0] / max) * (H - 50);
        ctx.fillStyle = s[1];
        ctx.fillRect(x + s[2], H - 30 - h, bw, h);
      });
      ctx.fillStyle = '#8E9AAF';
      ctx.textAlign = 'center';
      ctx.fillText(lb.slice(5), x, H - 12);
    });
    ctx.fillStyle = '#00F0FF'; ctx.fillRect(10, 8, 12, 8);
    ctx.fillStyle = '#8E9AAF'; ctx.textAlign = 'left'; ctx.fillText(labelA, 26, 15);
    ctx.fillStyle = '#00FF41'; ctx.fillRect(150, 8, 12, 8);
    ctx.fillStyle = '#8E9AAF'; ctx.fillText(labelB, 166, 15);
  }

  function lineChart(canvas, labels, values, threshold, color) {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.clientWidth || 640, H = 220;
    canvas.width = W * dpr; canvas.height = H * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    var min = Math.min.apply(null, values.concat([threshold])) - 1;
    var max = Math.max.apply(null, values.concat([threshold])) + 1;
    function y(v) { return H - 30 - ((v - min) / (max - min)) * (H - 60); }
    function x(i) { return 30 + (i / (values.length - 1)) * (W - 50); }
    // soglia
    ctx.strokeStyle = '#eab308'; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(20, y(threshold)); ctx.lineTo(W - 10, y(threshold)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#eab308'; ctx.font = '10px monospace'; ctx.fillText('soglia ' + threshold + '%', W - 110, y(threshold) - 5);
    // linea valori
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach(function (v, i) { if (i === 0) ctx.moveTo(x(i), y(v)); else ctx.lineTo(x(i), y(v)); });
    ctx.stroke();
    values.forEach(function (v, i) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x(i), y(v), 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#8E9AAF';
      ctx.fillText(labels[i].slice(5), x(i) - 10, H - 10);
    });
    ctx.lineWidth = 1;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('kpi-cards')) return;
    fetch('api/kpi.json').then(function (r) { return r.json(); }).then(function (d) {
      var cards = calc(d.months, d.thresholds);
      $('kpi-cards').innerHTML = cards.map(function (c) {
        return '<div class="stat" style="border:1px solid ' + (c.ok ? 'rgba(0,255,65,.25)' : 'rgba(255,80,80,.4)') + ';padding:14px;">'
          + '<span class="stat-value" style="color:' + (c.ok ? '#00FF41' : '#ff5050') + ';">' + (c.ok ? '✓ ' : '✗ ') + c.fmt + '</span>'
          + '<span class="stat-label">' + c.label + '</span>'
          + '<span class="stat-sub">target ' + c.target + '</span></div>';
      }).join('');
      var labels = d.months.map(function (r) { return r.m; });
      barChart($('chart-trips'),
        labels,
        d.months.map(function (r) { return r.scheduled; }),
        d.months.map(function (r) { return r.operated; }),
        'programmate', 'effettuate');
      lineChart($('chart-punct'),
        labels,
        d.months.map(function (r) { return +(r.punctual / r.operated * 100).toFixed(2); }),
        d.thresholds.punctuality_pct_min, '#00F0FF');
      // tabella
      $('kpi-table-body').innerHTML = d.months.map(function (r) {
        var p = (r.punctual / r.operated * 100).toFixed(1);
        var c = (r.cancelled / r.scheduled * 100).toFixed(2);
        return '<tr><td>' + r.m + '</td><td class="num">' + r.scheduled + '</td><td class="num">' + r.operated + '</td><td class="num">'
          + r.cancelled + '</td><td class="num">' + p + '%</td><td class="num">' + c + '%</td><td class="num">' + r.km.toLocaleString('it-IT') + '</td><td class="num">' + r.complaints + '</td></tr>';
      }).join('');
      // export CSV
      var btn = $('kpi-csv');
      if (btn) btn.addEventListener('click', function () {
        var csv = 'mese,programmate,effettuate,soppresse,puntuali,km,reclami\n'
          + d.months.map(function (r) { return [r.m, r.scheduled, r.operated, r.cancelled, r.punctual, r.km, r.complaints].join(','); }).join('\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'kpi-art-2026.csv';
        a.click();
      });
    }).catch(function () {
      $('kpi-cards').innerHTML = '<p style="color:#ff5050">Errore caricamento api/kpi.json</p>';
    });
  });
})();
