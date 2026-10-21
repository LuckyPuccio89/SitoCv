<?php
// API readonly demo TPL su MySQL. Solo SELECT, azioni whitelist, nessun write.
// Azioni: status | realtime | gtfs | kpi | stations | departures?st=S07113 | delays | routes | bus?line=R-ADR
header('Content-Type: application/json; charset=utf-8');

function fail($code, $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}
$conf = require '/etc/tpl-demo/db.conf.php';
try {
    $pdo = new PDO($conf['dsn'], $conf['reader'][0], $conf['reader'][1],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Exception $e) { fail(500, 'db offline'); }

$a = $_GET['a'] ?? 'status';
$allowed = ['status', 'realtime', 'gtfs', 'kpi', 'stations', 'departures', 'delays', 'routes', 'bus'];
if (!in_array($a, $allowed, true)) fail(400, 'azione non valida');

function latest_snapshot($pdo) {
    return $pdo->query("SELECT MAX(snapshot_at) FROM departures")->fetchColumn();
}

if ($a === 'status') {
    $tables = [];
    foreach (['stops', 'routes', 'vehicles', 'kpi_months'] as $t) {
        $tables[$t] = (int) $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
    }
    $snap = latest_snapshot($pdo);
    echo json_encode(['schema' => 1, 'source' => 'mysql tpl_demo', 'tables' => $tables,
        'realtime_snapshot' => $snap, 'generated_at' => date('c')]);
    exit;
}

if ($a === 'stations') {
    $q = $pdo->query("SELECT DISTINCT station_sid AS sid, station_label AS label FROM departures ORDER BY sid");
    echo json_encode(['stations' => $q->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

if ($a === 'departures' || $a === 'realtime' || $a === 'delays') {
    $snap = latest_snapshot($pdo);
    if (!$snap) fail(503, 'nessuno snapshot live');
    $where = "snapshot_at = " . $pdo->quote($snap);
    if ($a === 'departures') {
        $st = $_GET['st'] ?? '';
        if (!preg_match('/^S\d+$/', $st)) fail(400, 'st non valida (es. S07113)');
        $where .= " AND station_sid = " . $pdo->quote($st);
        $q = $pdo->query("SELECT num AS n, cat, dest, hhmm, delay_min, platform FROM departures WHERE $where ORDER BY hhmm LIMIT 12");
        echo json_encode(['station' => $st, 'snapshot_at' => $snap, 'departures' => $q->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }
    if ($a === 'delays') {
        $q = $pdo->query("SELECT station_label AS st, hhmm, num AS n, dest, delay_min FROM departures WHERE $where AND delay_min > 0 ORDER BY delay_min DESC LIMIT 12");
        echo json_encode(['snapshot_at' => $snap, 'delays' => $q->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }
    // realtime: forma identica a api/realtime.json
    $q = $pdo->query("SELECT station_sid, station_label, num AS n, cat, dest, hhmm, delay_min, platform FROM departures WHERE $where ORDER BY station_sid, hhmm");
    $stations = [];
    foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $sid = $r['station_sid'];
        if (!isset($stations[$sid])) $stations[$sid] = ['label' => $r['station_label'], 'departures' => []];
        unset($r['station_sid'], $r['station_label']);
        $stations[$sid]['departures'][] = $r;
    }
    echo json_encode(['schema' => 1, 'generated_at' => date('c', strtotime($snap)), 'source' => 'mysql tpl_demo (snapshot viaggiatreno)',
        'stale_after_s' => 600, 'stations' => $stations]);
    exit;
}

if ($a === 'routes' || $a === 'bus' || $a === 'gtfs') {
    $routes = $pdo->query("SELECT id, name, color FROM routes")->fetchAll(PDO::FETCH_ASSOC);
    $rs = $pdo->query("SELECT route_id, stop_code FROM route_stops ORDER BY route_id, seq")->fetchAll(PDO::FETCH_ASSOC);
    $byRoute = [];
    foreach ($rs as $r) $byRoute[$r['route_id']][] = $r['stop_code'];
    if ($a === 'bus') {
        $line = $_GET['line'] ?? '';
        if (!preg_match('/^[A-Z0-9-]+$/', $line)) fail(400, 'line non valida (es. R-ADR)');
        $routes = array_values(array_filter($routes, fn($r) => $r['id'] === $line));
        if (!$routes) fail(404, 'linea sconosciuta');
    }
    $stops = $pdo->query("SELECT code AS id, gtfs_stop_id, name, lat, lon, km FROM stops")->fetchAll(PDO::FETCH_ASSOC);
    $veh = $pdo->query("SELECT id, route_id AS `route`, km, speed_kmh, status, next_stop, delay_min FROM vehicles")->fetchAll(PDO::FETCH_ASSOC);
    if ($a !== 'gtfs') {
        $ids = array_column($routes, 'id');
        $veh = array_values(array_filter($veh, fn($v) => in_array($v['route'], $ids, true)));
    }
    foreach ($routes as &$r) $r['stops'] = $byRoute[$r['id']] ?? [];
    echo json_encode(['routes' => $routes, 'stops' => $stops, 'vehicles' => $veh]);
    exit;
}

if ($a === 'kpi') {
    $th = json_decode($pdo->query("SELECT v FROM meta WHERE k='thresholds_json'")->fetchColumn(), true);
    $months = $pdo->query("SELECT m, scheduled, operated, cancelled, punctual, km, complaints FROM kpi_months ORDER BY m")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($months as &$m) foreach (['scheduled','operated','cancelled','punctual','km','complaints'] as $k) $m[$k] = (int) $m[$k];
    echo json_encode(['thresholds' => $th, 'months' => $months]);
    exit;
}
