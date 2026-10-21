<?php
// Palestra SQL - Fase 0: endpoint scrittura sandbox.
// Permette SOLO oggetti dentro database lab_* (ricostruzione guidata del DB aziendale).
// POST JSON {"q": "..."} -> SELECT/SHOW: {"cols","rows","n"} | scritture: {"ok":true,"affected":N,"msg"}
// Errori: {"error": "..."}
header('Content-Type: application/json; charset=utf-8');
$body = json_decode(file_get_contents('php://input'), true);
$q = trim($body['q'] ?? '');
if ($q === '') { http_response_code(400); echo json_encode(['error' => 'query vuota']); exit; }
if (substr_count($q, ';') > 1 || (strpos($q, ';') !== false && substr($q, -1) !== ';')) {
    http_response_code(400); echo json_encode(['error' => 'una sola istruzione alla volta']); exit;
}
$q = rtrim($q, ';');
if (!preg_match('/^\s*(select|show|describe|desc|explain|create|insert|update|delete|drop|alter)\b/i', $q, $kw)) {
    http_response_code(400); echo json_encode(['error' => 'istruzione non consentita in palestra']); exit;
}
$ban = ['grant', 'revoke', 'load_file', 'load\s+data', 'outfile', 'dumpfile', 'information_schema',
        'performance_schema', 'procedure', 'handler', 'into\s+outfile', 'into\s+dumpfile'];
foreach ($ban as $b) {
    if (preg_match('/\b' . $b . '\b/i', $q)) {
        http_response_code(400); echo json_encode(['error' => 'istruzione non consentita']); exit;
    }
}
// Tutto cio' che nomina un database o una tabella deve stare sotto lab_*
// Per i controlli di scope si usa la query SENZA letterali stringa
// (altrimenti 'S.S. Adriatica...', 1750.00 o d.nome sembrano db.tabella).
$bare = preg_replace("/'(?:[^'\\\\]|\\\\.|'')*'/s", "''", $q);
$bare = preg_replace('/"(?:[^"\\\\]|\\\\.)*"/s', '""', $bare);
$fail = function ($msg) { http_response_code(400); echo json_encode(['error' => $msg]); exit; };
if (preg_match('/^\s*create\s+database/i', $bare)) {
    if (!preg_match('/^\s*create\s+database\s+(if\s+not\s+exists\s+)?`?(lab_[a-z0-9_]+)`?\s*$/i', $q)) {
        $fail('il database deve chiamarsi lab_... (es. lab_azienda)');
    }
} elseif (preg_match('/^\s*drop\s+database/i', $q)) {
    if (!preg_match('/^\s*drop\s+database\s+(if\s+exists\s+)?`?(lab_[a-z0-9_]+)`?\s*$/i', $q)) {
        $fail('puoi eliminare solo database lab_...');
    }
} else {
    // nomi qualificati db.tabella: scritture solo su lab_*, letture anche su azienda_demo
    $isWriteStmt = (bool) preg_match('/^\s*(create|insert|update|delete|drop|alter)\b/i', $bare);
    // X.Y e' db.tabella solo se X e' un database noto; altrimenti e' alias.colonna (d.nome) o numero (1750.00)
    preg_match_all('/`?([a-z0-9_]+)`?\s*\.\s*`?([a-z0-9_]+)`?/i', $bare, $m);
    foreach ($m[1] as $db) {
        $dbl = strtolower($db);
        if (is_numeric($db)) continue;                    // 1750.00
        if (stripos($db, 'lab_') === 0) continue;         // sandbox ok
        if (in_array($dbl, ['mysql', 'sys', 'performance_schema', 'information_schema'], true)) {
            $fail('schema di sistema non consentito');
        }
        if ($dbl === 'azienda_demo') {
            if ($isWriteStmt) $fail('le tabelle aziendali condivise sono in sola lettura: usa lab_azienda');
            continue;
        }
        continue; // alias di tabella (d.nome, s.id...) o funzioni: ignora
    }
    // SHOW TABLES IN db / DESCRIBE db.tbl coperti sopra; FROM/JOIN non qualificati:
    // li qualifichiamo di default su lab_azienda solo se la query non nomina altri db
    preg_match_all('/\b(?:from|join|into|update|table)\s+`?([a-z0-9_]+)`?/i', $bare, $m2);
    foreach ($m2[1] as $t) {
        $tl = strtolower($t);
        if (in_array($tl, ['lab_azienda'], true)) continue;
        if (strpos($tl, 'lab_') === 0) continue;
        // tabelle del DB aziendale condiviso: solo in lettura, vietate in scrittura
        $shared = ['sedi', 'dipendenti', 'clienti', 'mezzi', 'linee', 'corse', 'biglietti', 'manutenzioni'];
        $isWrite = preg_match('/^\s*(create|insert|update|delete|drop|alter)\b/i', $q);
        if (in_array($tl, $shared, true) && $isWrite) {
            $fail('le tabelle aziendali condivise sono in sola lettura: usa lab_azienda.' . $t);
        }
    }
    // niente riferimenti a mysql./sys. come db
    if (preg_match('/\b(mysql|sys|performance_schema|information_schema)\s*\./i', $bare)) {
        $fail('schema di sistema non consentito');
    }
}

$conf = require '/etc/tpl-demo/db.conf.php';
function labConnect($conf) {
    $opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
    // 1) prova Docker se configurato, 2) fallback host
    if (($conf['lab_source'] ?? 'host') === 'docker' && !empty($conf['lab_docker_dsn'])) {
        try {
            $pdo = new PDO($conf['lab_docker_dsn'], $conf['lab'][0], $conf['lab'][1], $opts);
            $pdo->query('SELECT 1');
            return [$pdo, 'docker'];
        } catch (Exception $e) { /* fallback host */ }
    }
    $pdo = new PDO($conf['lab_host_dsn'], $conf['lab'][0], $conf['lab'][1], $opts);
    return [$pdo, 'host'];
}
try {
    list($pdo, $src) = labConnect($conf);
    $isRead = (bool) preg_match('/^\s*(select|show|describe|desc|explain)\b/i', $q);
    if ($isRead) {
        $rq = $q . ((stripos($q, 'limit') === false && stripos($q, 'select') === 0) ? ' LIMIT 100' : '');
        $stmt = $pdo->query($rq);
        $rows = $stmt->fetchAll(PDO::FETCH_NUM);
        $cols = [];
        for ($i = 0; $i < $stmt->columnCount(); $i++) {
            $meta = $stmt->getColumnMeta($i);
            $cols[] = $meta['name'];
        }
        echo json_encode(['cols' => $cols, 'rows' => $rows, 'n' => count($rows), 'src' => $src]);
    } else {
        $affected = $pdo->exec($q);
        echo json_encode(['ok' => true, 'affected' => $affected === false ? 0 : $affected, 'src' => $src]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => 'errore SQL (controlla sintassi e nomi)']);
}
