#!/usr/bin/env python3
"""Production poller: Prometheus -> static JSON for the portfolio site.

Runs on the Docker/monitoring host (needs network access to Prometheus,
default http://localhost:9090). Writes api/perf.json atomically so the
web server never serves a half-written file. No secrets involved.

Cron example (every 2 minutes, as a user that can write the docroot):
  */2 * * * * /usr/bin/python3 /opt/staging/tools/prometheus-poll.py \
      --prom-url http://localhost:9090 \
      --out /var/www/html/api/perf.json >>/var/log/perf-poll.log 2>&1

PromQL used (node-exporter job assumed; blackbox optional):
  cpu      100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
  mem      (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
  load1    node_load1
  uptime   max(time() - node_boot_time_seconds)
  targets  count(up) / count(up == 1)
  services probe_success{job=~"blackbox.*"} (+ probe_duration_seconds, if configured)
"""
import argparse
import datetime
import json
import os
import sys
import tempfile
import urllib.parse
import urllib.request

QUERIES = {
    "cpu": '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
    "mem": '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
    "load1": "node_load1",
    "uptime": "max(time() - node_boot_time_seconds)",
    "targets_up": "count(up == 1)",
    "targets_total": "count(up)",
}

TIMEOUT_S = 15


def prom_query(base, expr):
    url = base.rstrip("/") + "/api/v1/query?" + urllib.parse.urlencode({"query": expr})
    with urllib.request.urlopen(url, timeout=TIMEOUT_S) as r:
        body = json.load(r)
    if body.get("status") != "success":
        raise RuntimeError("query failed: %s" % expr)
    res = body["data"]["result"]
    if not res:
        return None
    return float(res[0]["value"][1])


def prom_query_labels(base, expr):
    """Return [(labels, value)] for vector queries (e.g. probe_success)."""
    url = base.rstrip("/") + "/api/v1/query?" + urllib.parse.urlencode({"query": expr})
    with urllib.request.urlopen(url, timeout=TIMEOUT_S) as r:
        body = json.load(r)
    if body.get("status") != "success":
        raise RuntimeError("query failed: %s" % expr)
    return [(m["metric"], float(m["value"][1])) for m in body["data"]["result"]]


def build_payload(prom_url):
    vals = {k: prom_query(prom_url, q) for k, q in QUERIES.items()}
    services = []
    try:
        for metric, value in prom_query_labels(prom_url, 'probe_success{job=~"blackbox.*"}'):
            services.append({
                "name": metric.get("instance", "unknown"),
                "ok": value == 1.0,
            })
    except Exception as exc:  # blackbox optional: empty list, still valid payload
        print("blackbox query skipped: %s" % exc, file=sys.stderr)
    now = datetime.datetime.now(datetime.timezone.utc).astimezone()
    return {
        "schema": 1,
        "generated_at": now.isoformat(timespec="seconds"),
        "source": "prometheus",
        "host": {
            "cpu_pct": vals["cpu"],
            "mem_pct": vals["mem"],
            "load1": vals["load1"],
            "uptime_s": int(vals["uptime"]) if vals["uptime"] is not None else None,
        },
        "targets_up": int(vals["targets_up"] or 0),
        "targets_total": int(vals["targets_total"] or 0),
        "services": services,
        "stale_after_s": 300,
    }


def atomic_write(path, payload):
    directory = os.path.dirname(os.path.abspath(path))
    fd, tmp = tempfile.mkstemp(dir=directory, prefix=".perf-", suffix=".tmp")
    os.chmod(tmp, 0o644)  # mkstemp creates 0600: Apache (www-data) must read it
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
            f.write("\n")
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prom-url", default="http://localhost:9090")
    ap.add_argument("--out", required=True, help="destination api/perf.json path")
    args = ap.parse_args()
    payload = build_payload(args.prom_url)
    atomic_write(args.out, payload)
    print("wrote %s (cpu=%s mem=%s up=%s/%s)" % (
        args.out, payload["host"]["cpu_pct"], payload["host"]["mem_pct"],
        payload["targets_up"], payload["targets_total"]))


if __name__ == "__main__":
    main()
