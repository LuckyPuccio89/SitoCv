#!/usr/bin/env python3
"""
Firewall exporter per la pagina /firewall.html.

Raccoglie dati reali e sanitizzati da:
  - MikroTik hEX S (192.168.68.1) via SSH con chiave, sola lettura
  - OPNsense (192.168.20.1) via API ufficiale in sola lettura
    (chiave in /etc/tpl-demo/opnsense-api.conf, fuori dalla docroot)
    con fallback su probe HTTPS se la chiave non e' disponibile.

Non espone IP di management, credenziali o altri segreti: solo nomi logici
("mikrotik", "opnsense") e metriche aggregate.

Espone:
  http://0.0.0.0:9101/metrics   -> metriche Prometheus
  http://0.0.0.0:9101/json      -> snapshot per la pagina
e scrive /var/www/html/api/firewall.json per la dashboard nativa (30 s).
"""
import base64
import json
import os
import re
import socket
import ssl
import subprocess
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MIKROTIK_HOST = "192.168.68.1"
MIKROTIK_USER = "admin"
OPNSENSE_HOST = "192.168.20.1"
OPNSENSE_PORT = 443
OPNSENSE_API_CONF = "/etc/tpl-demo/opnsense-api.conf"
SYSLOG = "/var/log/mikrotik/mikrotik.log"
OUT_JSON = "/var/www/html/api/firewall.json"
REFRESH = 25  # secondi
HISTORY_LEN = 120  # ~1 ora a 30 s

_state_lock = threading.Lock()
_snapshot = {}
_history = []
_last_error = ""


def sh(cmd, timeout=8):
    try:
        p = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        if p.returncode != 0:
            return None, (p.stderr or "exit %d" % p.returncode).strip()
        return p.stdout, ""
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def load_api_creds():
    try:
        with open(OPNSENSE_API_CONF) as fh:
            conf = dict(line.strip().split("=", 1) for line in fh if "=" in line)
        if conf.get("key") and conf.get("secret"):
            return conf["key"], conf["secret"]
    except (FileNotFoundError, PermissionError, ValueError):
        pass
    return None, None


API_KEY, API_SECRET = load_api_creds()
API_AUTH = None
if API_KEY:
    API_AUTH = "Basic " + base64.b64encode(("%s:%s" % (API_KEY, API_SECRET)).encode()).decode()

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE


def api_get(path, timeout=6):
    """GET verso l'API OPNsense. Ritorna (json|None, ms)."""
    if not API_AUTH:
        return None, 0
    req = urllib.request.Request(
        "https://%s%s" % (OPNSENSE_HOST, path),
        headers={"Authorization": API_AUTH, "Accept": "application/json"},
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
            data = json.loads(resp.read().decode("utf-8", "replace"))
            return data, round((time.time() - t0) * 1000, 1)
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, OSError):
        return None, round((time.time() - t0) * 1000, 1)


def parse_uptime(txt):
    total = 0
    for num, unit in re.findall(r"(\d+)([wdhms])", txt or ""):
        total += int(num) * {"w": 604800, "d": 86400, "h": 3600, "m": 60, "s": 1}[unit]
    return total


def parse_size(txt):
    m = re.match(r"([\d.]+)\s*([KMG]iB)?", (txt or "").strip())
    if not m:
        return 0
    val = float(m.group(1))
    mult = {"KiB": 1024, "MiB": 1024 ** 2, "GiB": 1024 ** 3}.get(m.group(2) or "", 1)
    return int(val * mult)


def to_int(v):
    try:
        if isinstance(v, str):
            return int(v, 0)
        return int(v)
    except (TypeError, ValueError):
        return None


def to_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def mikrotik():
    dev = {
        "id": "mikrotik",
        "name": "MikroTik hEX S",
        "role": "Router di bordo / PPPoE",
        "status": "down",
        "latency_ms": None,
        "tls_days": None,
        "uptime_s": None,
        "cpu_pct": None,
        "mem_used_pct": None,
        "mem_free_bytes": None,
        "mem_total_bytes": None,
        "temp_c": None,
        "conntrack": None,
        "wan": {"name": None, "up": False, "rx_bytes": None, "tx_bytes": None},
        "rules": {"input_drop_packets": None, "forward_drop_packets": None},
        "version": None,
        "model": None,
        "api": False,
        "load": None,
        "gateway": None,
    }
    t0 = time.time()
    cmd = (
        "ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=5 "
        "%s@%s " % (MIKROTIK_USER, MIKROTIK_HOST)
        + "'/system resource print; /system health print; "
        "/ip firewall connection print count-only; "
        ":foreach i in=[/ip firewall filter find] do={:put (\"R,\" . [/ip firewall filter get $i chain] . \",\" . [/ip firewall filter get $i action] . \",\" . [/ip firewall filter get $i packets])}; "
        ":local w [/interface find where type=\"pppoe-out\"]; :foreach i in=$w do={:put (\"W,\" . [/interface get $i name] . \",\" . [/interface get $i rx-byte] . \",\" . [/interface get $i tx-byte] . \",\" . [/interface get $i running])}'"
    )
    out, err = sh(cmd, timeout=12)
    if out is None:
        _log_error("mikrotik: %s" % err)
        return dev
    dev["status"] = "up"
    dev["latency_ms"] = round((time.time() - t0) * 1000, 1)

    rules = {}
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("R,"):
            parts = line.split(",")
            if len(parts) >= 4:
                _, chain, action, packets = parts[:4]
                try:
                    pk = int(packets)
                except ValueError:
                    continue
                if action == "drop":
                    key = "%s_drop_packets" % chain
                    rules[key] = rules.get(key, 0) + pk
        elif line.startswith("W,"):
            parts = line.split(",")
            if len(parts) >= 5:
                dev["wan"] = {
                    "name": parts[1],
                    "rx_bytes": int(parts[2] or 0),
                    "tx_bytes": int(parts[3] or 0),
                    "up": parts[4].strip().lower() == "true",
                }
        elif "cpu-load:" in line:
            dev["cpu_pct"] = int(re.search(r"cpu-load:\s*(\d+)", line).group(1))
        elif "uptime:" in line:
            dev["uptime_s"] = parse_uptime(line.split("uptime:", 1)[1])
        elif "free-memory:" in line:
            dev["mem_free_bytes"] = parse_size(line.split("free-memory:", 1)[1])
        elif "total-memory:" in line:
            dev["mem_total_bytes"] = parse_size(line.split("total-memory:", 1)[1])
        elif line.strip().startswith("version:"):
            dev["version"] = line.split("version:", 1)[1].strip()
        elif "board-name:" in line:
            dev["model"] = line.split("board-name:", 1)[1].strip()
        elif "board-temperature1" in line:
            m = re.search(r"board-temperature1\s+([\d.]+)", line)
            if m:
                dev["temp_c"] = float(m.group(1))
        elif re.fullmatch(r"\d+", line):
            dev["conntrack"] = int(line)

    if dev["mem_free_bytes"] and dev["mem_total_bytes"]:
        dev["mem_used_pct"] = round(100 * (1 - dev["mem_free_bytes"] / dev["mem_total_bytes"]), 1)
    dev["rules"] = {
        "input_drop_packets": rules.get("input_drop_packets"),
        "forward_drop_packets": rules.get("forward_drop_packets"),
    }
    return dev


def opnsense():
    dev = {
        "id": "opnsense",
        "name": "OPNsense",
        "role": "Firewall perimetrale / gateway LAN",
        "status": "down",
        "latency_ms": None,
        "tls_days": None,
        "uptime_s": None,
        "cpu_pct": None,
        "mem_used_pct": None,
        "mem_free_bytes": None,
        "mem_total_bytes": None,
        "temp_c": None,
        "conntrack": None,
        "wan": {"name": None, "up": False, "rx_bytes": None, "tx_bytes": None},
        "rules": {"input_drop_packets": None, "forward_drop_packets": None},
        "version": "OPNsense",
        "model": "OPNsense",
        "api": False,
        "management": None,
        "load": None,
        "gateway": None,
    }

    # 1) probe di raggiungibilita: HTTPS preferito, poi HTTP (la GUI OPNsense
    #    risponde su :80 con un redirect a HTTPS quando l'HTTPS e' attivo).
    #    Il dispositivo puo' essere online anche se la GUI/API non risponde.
    dev["management"] = None
    t0 = time.time()
    try:
        with socket.create_connection((OPNSENSE_HOST, OPNSENSE_PORT), timeout=4) as sock:
            with _SSL_CTX.wrap_socket(sock, server_hostname=OPNSENSE_HOST) as tls:
                tls.sendall(b"HEAD / HTTP/1.0\r\nHost: %s\r\n\r\n" % OPNSENSE_HOST.encode())
                resp = tls.recv(200).decode("latin-1", "replace")
            if resp.startswith("HTTP/"):
                dev["status"] = "up"
                dev["management"] = "https"
                dev["probe_ms"] = round((time.time() - t0) * 1000, 1)
    except Exception:  # noqa: BLE001
        pass

    if dev["status"] != "up":
        t0 = time.time()
        try:
            with socket.create_connection((OPNSENSE_HOST, 80), timeout=4) as sock:
                sock.sendall(b"HEAD / HTTP/1.0\r\nHost: %s\r\n\r\n" % OPNSENSE_HOST.encode())
                resp = sock.recv(200).decode("latin-1", "replace")
            if resp.startswith("HTTP/"):
                dev["status"] = "up"
                dev["management"] = "http"
                dev["probe_ms"] = round((time.time() - t0) * 1000, 1)
        except Exception as exc:  # noqa: BLE001
            _log_error("opnsense probe: %s" % exc)

    if dev["management"] == "https":
        cert, _ = sh("echo | openssl s_client -connect %s:%d -servername %s 2>/dev/null | "
                     "openssl x509 -noout -enddate" % (OPNSENSE_HOST, OPNSENSE_PORT, OPNSENSE_HOST), timeout=8)
        if cert and "notAfter=" in cert:
            try:
                raw = cert.strip().split("notAfter=", 1)[1]
                exp = datetime.strptime(raw, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                dev["tls_days"] = (exp - datetime.now(timezone.utc)).days
            except ValueError:
                pass

    if not API_AUTH or dev["management"] != "https":
        dev["latency_ms"] = dev.get("probe_ms")
        return dev

    # 2) API in sola lettura
    activity, api_ms = api_get("/api/diagnostics/activity/getActivity")
    if activity is None:
        dev["latency_ms"] = dev.get("probe_ms")
        return dev
    dev["api"] = True
    dev["status"] = "up"
    dev["latency_ms"] = api_ms
    # latenza API leggera e stabile (systemTime) invece del costo di "top"
    _, sys_ms = api_get("/api/diagnostics/system/systemTime")
    if sys_ms:
        dev["latency_ms"] = sys_ms

    headers = activity.get("headers") or []
    for h in headers:
        m = re.search(r"load averages:\s+([\d.]+),\s*([\d.]+),\s*([\d.]+)", h)
        if m:
            dev["load"] = [float(m.group(1)), float(m.group(2)), float(m.group(3))]
        m = re.search(r"CPU:\s+([\d.]+)% user,\s*[\d.]+% nice,\s*([\d.]+)% system,"
                      r"\s*[\d.]+% interrupt,\s*([\d.]+)% idle", h)
        if m:
            dev["cpu_pct"] = round(100 - float(m.group(3)), 1)
        m = re.search(r"up\s+(\d+)\+(\d+):(\d+):(\d+)", h)
        if m:
            d, hh, mm, ss = (int(x) for x in m.groups())
            dev["uptime_s"] = d * 86400 + hh * 3600 + mm * 60 + ss

    res, _ = api_get("/api/diagnostics/system/systemResources")
    if res:
        mem = res.get("memory") or {}
        total, used = to_int(mem.get("total")), to_int(mem.get("used"))
        if total:
            dev["mem_total_bytes"] = total
            dev["mem_free_bytes"] = total - (used or 0)
            if used is not None:
                dev["mem_used_pct"] = round(100 * used / total, 1)

    states, _ = api_get("/api/diagnostics/firewall/pf_states")
    if states:
        dev["conntrack"] = to_int(states.get("current"))
        dev["conntrack_limit"] = to_int(states.get("limit"))

    info, _ = api_get("/api/diagnostics/system/systemInformation")
    if info and info.get("versions"):
        dev["version"] = info["versions"][0]

    stats, _ = api_get("/api/diagnostics/interface/getInterfaceStatistics")
    if stats:
        for key, val in (stats.get("statistics") or {}).items():
            # voce fisica dell'interfaccia WAN (MAC), per non sommare gli alias IP
            if "[WAN]" in key and re.search(r"/ ([0-9a-f]{2}:){5}[0-9a-f]{2}$", key):
                dev["wan"] = {
                    "name": "WAN",
                    "rx_bytes": to_int(val.get("received-bytes")),
                    "tx_bytes": to_int(val.get("sent-bytes")),
                    "up": bool((to_int(val.get("flags")) or 0) & 0x1),
                }
                break

    gw, _ = api_get("/api/routes/gateway/status")
    if gw:
        for item in gw.get("items") or []:
            if "WAN" in str(item.get("name", "")).upper():
                delay = to_float(str(item.get("delay", "")).replace("ms", "").strip())
                loss = to_float(str(item.get("loss", "")).replace("%", "").strip())
                if delay is not None or loss is not None:
                    dev["gateway"] = {"delay_ms": delay, "loss_pct": loss, "status": item.get("status")}
                break

    return dev


def syslog_stats():
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)
    five_min = now - timedelta(minutes=5)
    events_24h = sources = logins = recent5 = 0
    src_counter = {}
    try:
        with open(SYSLOG, "r", errors="replace") as fh:
            for line in fh:
                parts = line.split(" ", 2)
                if len(parts) < 3:
                    continue
                try:
                    ts = datetime.fromisoformat(parts[1])
                    if ts.tzinfo is None:
                        ts = ts.replace(tzinfo=timezone.utc)
                except ValueError:
                    continue
                if ts < day_ago:
                    continue
                msg = parts[2]
                if "ATTACK:" in msg:
                    events_24h += 1
                    if ts >= five_min:
                        recent5 += 1
                    m = re.search(r",\s*(\d+\.\d+\.\d+\.\d+):\d+->", msg)
                    if m:
                        src_counter[m.group(1)] = src_counter.get(m.group(1), 0) + 1
                if "login failure for user" in msg:
                    logins += 1
    except FileNotFoundError:
        pass
    sources = len(src_counter)
    top = sorted(src_counter.items(), key=lambda kv: kv[1], reverse=True)[:8]
    return {
        "events_24h": events_24h,
        "sources_24h": sources,
        "login_failures_24h": logins,
        "events_5min": recent5,
        "top_sources": [{"ip": ip, "count": c} for ip, c in top],
    }


def _log_error(msg):
    global _last_error
    _last_error = msg


def build_snapshot():
    devs = [opnsense(), mikrotik()]
    snap = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "refresh_seconds": 30,
        "mode": "real",
        "note": "Dati reali raccolti dal server. OPNsense via API in sola lettura (chiave fuori dalla docroot) e probe TLS. MikroTik via SSH in sola lettura.",
        "devices": devs,
        "attacks": syslog_stats(),
        "history": [],
    }
    point = {
        "t": snap["generated_at"],
        "opnsense_ms": devs[0]["latency_ms"],
        "mikrotik_cpu": devs[1]["cpu_pct"],
        "mikrotik_mem": devs[1]["mem_used_pct"],
        "conntrack": devs[1]["conntrack"],
        "attacks_5min": snap["attacks"]["events_5min"],
        "wan_rx": devs[1]["wan"]["rx_bytes"],
        "wan_tx": devs[1]["wan"]["tx_bytes"],
    }
    _history.append(point)
    del _history[:-HISTORY_LEN]
    snap["history"] = list(_history)
    return snap


def write_json(snap):
    tmp = OUT_JSON + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(snap, fh, ensure_ascii=False)
    os.chmod(tmp, 0o644)
    os.replace(tmp, OUT_JSON)


def refresh_loop():
    global _snapshot
    while True:
        try:
            snap = build_snapshot()
            with _state_lock:
                _snapshot = snap
            write_json(snap)
        except Exception as exc:  # noqa: BLE001
            _log_error("refresh: %s" % exc)
        time.sleep(REFRESH)


def prometheus_text(snap):
    lines = []

    def add(name, help_, typ, samples):
        lines.append("# HELP %s %s" % (name, help_))
        lines.append("# TYPE %s %s" % (name, typ))
        for labels, value in samples:
            if value is None:
                continue
            lbl = ("{%s}" % ",".join('%s="%s"' % (k, v) for k, v in labels.items())) if labels else ""
            lines.append("%s%s %s" % (name, lbl, value))

    devs = {d["id"]: d for d in snap.get("devices", [])}
    add("firewall_up", "Device reachable (1) or not (0)", "gauge",
        [({"device": k}, 1 if d["status"] == "up" else 0) for k, d in devs.items()])
    add("firewall_api_ok", "API access working (1) or not (0)", "gauge",
        [({"device": k}, 1 if d.get("api") else 0) for k, d in devs.items()])
    add("firewall_probe_latency_ms", "Probe/API latency in milliseconds", "gauge",
        [({"device": k}, d["latency_ms"]) for k, d in devs.items()])
    add("firewall_tls_expiry_days", "TLS certificate days to expiry", "gauge",
        [({"device": k}, d["tls_days"]) for k, d in devs.items()])
    add("firewall_cpu_percent", "CPU load percent", "gauge",
        [({"device": k}, d["cpu_pct"]) for k, d in devs.items()])
    add("firewall_memory_used_percent", "Memory used percent", "gauge",
        [({"device": k}, d["mem_used_pct"]) for k, d in devs.items()])
    add("firewall_uptime_seconds", "Uptime in seconds", "gauge",
        [({"device": k}, d["uptime_s"]) for k, d in devs.items()])
    add("firewall_temperature_celsius", "Board temperature", "gauge",
        [({"device": k}, d["temp_c"]) for k, d in devs.items()])
    add("firewall_conntrack_entries", "Active connection tracking entries", "gauge",
        [({"device": k}, d["conntrack"]) for k, d in devs.items()])
    add("firewall_conntrack_limit", "Connection tracking limit", "gauge",
        [({"device": k}, d.get("conntrack_limit")) for k, d in devs.items()])
    add("firewall_load1", "Load average 1 minute", "gauge",
        [({"device": k}, (d.get("load") or [None])[0]) for k, d in devs.items()])
    add("firewall_load5", "Load average 5 minutes", "gauge",
        [({"device": k}, (d.get("load") or [None, None])[1]) for k, d in devs.items()])
    add("firewall_load15", "Load average 15 minutes", "gauge",
        [({"device": k}, (d.get("load") or [None, None, None])[2]) for k, d in devs.items()])
    add("firewall_wan_up", "WAN interface up (1) or not (0)", "gauge",
        [({"device": k}, 1 if d["wan"]["up"] else 0) for k, d in devs.items()])
    add("firewall_wan_rx_bytes_total", "WAN received bytes", "counter",
        [({"device": k}, d["wan"]["rx_bytes"]) for k, d in devs.items()])
    add("firewall_wan_tx_bytes_total", "WAN transmitted bytes", "counter",
        [({"device": k}, d["wan"]["tx_bytes"]) for k, d in devs.items()])
    add("firewall_filter_drop_packets_total", "Dropped packets by chain", "counter",
        [({"device": k, "chain": chain}, d["rules"].get("%s_drop_packets" % chain))
         for k, d in devs.items() for chain in ("input", "forward")])
    add("firewall_gateway_delay_ms", "WAN gateway delay in milliseconds", "gauge",
        [({"device": k}, (d.get("gateway") or {}).get("delay_ms")) for k, d in devs.items()])
    add("firewall_gateway_loss_percent", "WAN gateway packet loss percent", "gauge",
        [({"device": k}, (d.get("gateway") or {}).get("loss_pct")) for k, d in devs.items()])
    atk = snap.get("attacks", {})
    add("firewall_attack_events_24h", "ATTACK events in the last 24h", "gauge",
        [({}, atk.get("events_24h"))])
    add("firewall_attack_sources_24h", "Unique attack sources in the last 24h", "gauge",
        [({}, atk.get("sources_24h"))])
    add("firewall_login_failures_24h", "Router login failures in the last 24h", "gauge",
        [({}, atk.get("login_failures_24h"))])
    add("firewall_attack_events_5min", "ATTACK events in the last 5 minutes", "gauge",
        [({}, atk.get("events_5min"))])
    add("firewall_exporter_last_refresh", "Exporter refresh unix timestamp", "gauge",
        [({}, int(time.time()))])
    return "\n".join(lines) + "\n"


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        with _state_lock:
            snap = _snapshot
        if not snap:
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b"warming up")
            return
        if self.path.startswith("/metrics"):
            body = prometheus_text(snap).encode()
            ctype = "text/plain; version=0.0.4; charset=utf-8"
        elif self.path.startswith("/json"):
            body = json.dumps(snap, ensure_ascii=False).encode()
            ctype = "application/json; charset=utf-8"
        elif self.path.startswith("/health"):
            body = b"ok"
            ctype = "text/plain"
        else:
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    threading.Thread(target=refresh_loop, daemon=True).start()
    time.sleep(3)
    srv = ThreadingHTTPServer(("0.0.0.0", 9101), Handler)
    srv.serve_forever()


if __name__ == "__main__":
    main()
