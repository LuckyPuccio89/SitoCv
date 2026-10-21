#!/usr/bin/env php
<?php
// Import api/*.json -> MySQL tpl_demo. Rieseguibile (REPLACE/DELETE+INSERT).
// Uso: php tools/db-import.php [--docroot /var/www/collaudo]
$docroot = '/var/www/collaudo';
foreach ($argv as $i => $a) {
    if ($a === '--docroot' && isset($argv[$i + 1])) $docroot = $argv[$i + 1];
}
$conf = require '/etc/tpl-demo/db.conf.php';
$pdo = new PDO($conf['dsn'], $conf['writer'][0], $conf['writer'][1],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$gtfs = json_decode(file_get_contents("$docroot/api/gtfs.json"), true);
$kpi = json_decode(file_get_contents("$docroot/api/kpi.json"), true);

$pdo->beginTransaction();
$pdo->exec("DELETE FROM route_stops");
$pdo->exec("DELETE FROM vehicles");
$pdo->exec("DELETE FROM routes");
$pdo->exec("DELETE FROM stops");
$st = $pdo->prepare("INSERT INTO stops (code, gtfs_stop_id, name, lat, lon, km) VALUES (?,?,?,?,?,?)");
foreach ($gtfs['stops'] as $s) $st->execute([$s['id'], $s['gtfs_stop_id'], $s['name'], $s['lat'], $s['lon'], $s['km']]);
$rt = $pdo->prepare("INSERT INTO routes (id, name, color) VALUES (?,?,?)");
$rs = $pdo->prepare("INSERT INTO route_stops (route_id, stop_code, seq) VALUES (?,?,?)");
foreach ($gtfs['routes'] as $r) {
    $rt->execute([$r['id'], $r['name'], $r['color']]);
    foreach ($r['stops'] as $i => $code) $rs->execute([$r['id'], $code, $i]);
}
$vh = $pdo->prepare("INSERT INTO vehicles (id, route_id, km, speed_kmh, status, next_stop, delay_min, note) VALUES (?,?,?,?,?,?,?,?)");
foreach ($gtfs['vehicles'] as $v) {
    $vh->execute([$v['id'], $v['route'], $v['km'], $v['speed_kmh'], $v['status'], $v['next_stop'], $v['delay_min'], $v['note'] ?? '']);
}
$pdo->exec("DELETE FROM kpi_months");
$km = $pdo->prepare("INSERT INTO kpi_months (m, scheduled, operated, cancelled, punctual, km, complaints) VALUES (?,?,?,?,?,?,?)");
foreach ($kpi['months'] as $m) {
    $km->execute([$m['m'], $m['scheduled'], $m['operated'], $m['cancelled'], $m['punctual'], $m['km'], $m['complaints']]);
}
$pdo->prepare("REPLACE INTO meta (k, v) VALUES ('imported_at', NOW())")->execute();
$pdo->commit();

foreach (['stops', 'routes', 'route_stops', 'vehicles', 'kpi_months'] as $t) {
    echo $t . ': ' . $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn() . "\n";
}
