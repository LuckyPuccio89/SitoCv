<?php
// Palestra SQL: esegue SOLO singole SELECT sulle tabelle azienda_demo.*.
// POST JSON {"q": "..."} -> {"cols": [...], "rows": [[...]], "n": N} oppure {"error": "..."}
header('Content-Type: application/json; charset=utf-8');
$body = json_decode(file_get_contents('php://input'), true);
$q = trim($body['q'] ?? '');
if ($q === '') { http_response_code(400); echo json_encode(['error' => 'query vuota']); exit; }
if (substr_count($q, ';') > 1 || (strpos($q, ';') !== false && substr($q, -1) !== ';')) {
    http_response_code(400); echo json_encode(['error' => 'una sola istruzione, senza punto e virgola interno']); exit;
}
$q = rtrim($q, ';');
if (!preg_match('/^\s*select\b/i', $q)) {
    http_response_code(400); echo json_encode(['error' => 'solo istruzioni SELECT']); exit;
}
$ban = ['insert', 'update', 'delete', 'drop', 'alter', 'create', 'grant', 'revoke', 'load', 'outfile', 'dumpfile', 'information_schema', 'mysql\\.', 'performance_schema', 'sys\\.', 'into\\s+outfile', 'into\\s+dumpfile', 'procedure', 'handler', 'call\\s'];
foreach ($ban as $b) {
    if (preg_match('/\\b' . $b . '\\b/i', $q)) {
        http_response_code(400); echo json_encode(['error' => 'istruzione non consentita']); exit;
    }
}
preg_match_all('/\\b(?:from|join)\\s+`?(\\w+)`?/i', $q, $m);
$tables = array_unique(array_map('strtolower', $m[1]));
$allowed = ['sedi', 'dipendenti', 'clienti', 'mezzi', 'linee', 'corse', 'biglietti', 'manutenzioni'];
foreach ($tables as $t) {
    if (!in_array($t, $allowed, true)) {
        http_response_code(400); echo json_encode(['error' => 'tabella non consentita: ' . $t]); exit;
    }
}
if (!$tables) { http_response_code(400); echo json_encode(['error' => 'nessuna tabella valida (FROM/JOIN)']); exit; }
$q .= (stripos($q, 'limit') === false) ? ' LIMIT 100' : '';

$conf = require '/etc/tpl-demo/db.conf.php';
try {
    // Docker prima (tpl-sql-lab:3307), fallback MySQL host
    $opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
    $pdo = null;
    if (($conf['lab_source'] ?? 'host') === 'docker' && !empty($conf['lab_docker_dsn'])) {
        try {
            $pdo = new PDO($conf['lab_docker_dsn'], $conf['reader'][0], $conf['reader'][1], $opts);
            $pdo->query('SELECT 1');
        } catch (Exception $e) { $pdo = null; }
    }
    if (!$pdo) {
        $pdo = new PDO($conf['dsn'], $conf['reader'][0], $conf['reader'][1], $opts);
    }
    $pdo->exec("USE azienda_demo");
    $stmt = $pdo->query($q);
    $rows = $stmt->fetchAll(PDO::FETCH_NUM);
    $cols = [];
    for ($i = 0; $i < $stmt->columnCount(); $i++) {
        $meta = $stmt->getColumnMeta($i);
        $cols[] = $meta['name'];
    }
    echo json_encode(['cols' => $cols, 'rows' => $rows, 'n' => count($rows)]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => 'errore SQL (controlla sintassi e nomi)']);
}
