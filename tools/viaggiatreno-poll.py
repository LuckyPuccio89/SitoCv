#!/usr/bin/env python3
"""Poller Viaggiatreno -> static JSON for the portfolio GTFS demo.

Fetches *partenze* (departures) and *arrivi* (arrivals) for the 4 Adriatic
stations of the demo (Fano S07105, Senigallia S07108, Falconara M. S07111,
Ancona S07113) from the public Viaggiatreno Infomobilita REST endpoint and
writes api/realtime.json atomically. No secrets, no API key.

Endpoint base (verified 2026-10-14):
  https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno

Cron example (every 5 minutes):
  */5 * * * * /usr/bin/python3 /var/www/html/tools/viaggiatreno-poll.py \
      --out /var/www/html/api/realtime.json >>/var/log/viaggiatreno-poll.log 2>&1

On failure the old file is left untouched (exit 1) so the site keeps
showing the last good snapshot with a STALE badge.
"""
import argparse
import datetime
import json
import os
import sys
import tempfile
import urllib.parse
import urllib.request

BASE = "https://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno"
STATIONS = [
    ("S07105", "Fano"),
    ("S07108", "Senigallia"),
    ("S07111", "Falconara M."),
    ("S07113", "Ancona"),
]
TIMEOUT_S = 20
STALE_AFTER_S = 600


def fetch_json(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (portfolio demo; contact: site owner)",
        "Accept": "application/json",
        "Referer": "https://www.viaggiatreno.it/infomobilita",
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
        return json.loads(r.read().decode("utf-8"))


def hhmm(ms):
    try:
        dt = datetime.datetime.fromtimestamp(ms / 1000).astimezone()
        return dt.strftime("%H:%M")
    except Exception:
        return None


def sql_esc(v):
    if v is None:
        return "NULL"
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("\\", "\\\\").replace("'", "\\'") + "'"


def write_mysql(cnf, payload):
    import subprocess
    snap = payload["generated_at"][:19].replace("T", " ")
    lines = []
    for sid, st in payload["stations"].items():
        if "departures" not in st:
            continue
        for d in st["departures"]:
            lines.append("(%s,%s,%s,%s,%s,%s,%s,%s,%s)" % (
                sql_esc(sid), sql_esc(st["label"]), sql_esc(d.get("n")),
                sql_esc(d.get("cat")), sql_esc(d.get("dest")), sql_esc(d.get("hhmm")),
                sql_esc(d.get("delay_min")), sql_esc(d.get("platform")), sql_esc(snap)))
    if not lines:
        print("mysql: nothing to insert", file=sys.stderr)
        return
    sql = ("INSERT INTO departures (station_sid, station_label, num, cat, dest, hhmm,"
           " delay_min, platform, snapshot_at) VALUES " + ",".join(lines) + ";")
    r = subprocess.run(["mysql", "--defaults-file=" + cnf, "tpl_demo"],
                       input=sql.encode(), capture_output=True, timeout=30)
    if r.returncode != 0:
        print("mysql insert failed: %s" % r.stderr.decode()[:200], file=sys.stderr)
        sys.exit(1)
    print("mysql: inserted %d departures @ %s" % (len(lines), snap))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--mysql-cnf", default=None,
                    help="MySQL defaults file (user con INSERT su tpl_demo): scrive anche lo snapshot su DB")
    args = ap.parse_args()

    now = datetime.datetime.now(
        datetime.timezone(datetime.timedelta(hours=2)))
    ts = now.strftime("%a %b %d %Y %H:%M:%S GMT+0200")
    payload = {
        "schema": 2,
        "generated_at": now.isoformat(timespec="seconds"),
        "source": "viaggiatreno-infomobilita (live, non ufficiale)",
        "stale_after_s": STALE_AFTER_S,
        "stations": {},
    }
    errors = 0
    total = 0
    for sid, label in STATIONS:
        st = {"label": label}
        try:
            deps = fetch_json(BASE + "/partenze/" + sid + "/" + urllib.parse.quote(ts))
            rows = []
            for t in deps[:12]:
                rows.append({
                    "n": t.get("numeroTreno"),
                    "dest": t.get("destinazione"),
                    "cat": t.get("categoria"),
                    "hhmm": hhmm(t.get("orarioPartenza")),
                    "delay_min": t.get("ritardo"),
                    "platform": t.get("binarioEffettivoPartenzaDescrizione"),
                })
                total += 1
            st["departures"] = rows
        except Exception as exc:  # keep other stations, report at end
            print("station %s partenze failed: %s" % (sid, exc), file=sys.stderr)
            st["error"] = str(exc)[:200]
            errors += 1
        try:
            arrs = fetch_json(BASE + "/arrivi/" + sid + "/" + urllib.parse.quote(ts))
            rows = []
            for t in arrs[:12]:
                rows.append({
                    "n": t.get("numeroTreno"),
                    "orig": t.get("origine"),
                    "cat": t.get("categoria"),
                    "hhmm": hhmm(t.get("orarioArrivo")),
                    "delay_min": t.get("ritardo"),
                    "platform": t.get("binarioEffettivoArrivoDescrizione"),
                    "arrived": bool(t.get("arrivato")),
                })
                total += 1
            st["arrivals"] = rows
        except Exception as exc:
            print("station %s arrivi failed: %s" % (sid, exc), file=sys.stderr)
            st["arrivals_error"] = str(exc)[:200]
            errors += 1
        payload["stations"][sid] = st

    if errors == len(STATIONS):
        print("all stations failed, not writing", file=sys.stderr)
        return 1

    if args.mysql_cnf:
        write_mysql(args.mysql_cnf, payload)

    directory = os.path.dirname(os.path.abspath(args.out))
    fd, tmp = tempfile.mkstemp(dir=directory, prefix=".rt-", suffix=".tmp")
    os.chmod(tmp, 0o644)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
            f.write("\n")
        os.replace(tmp, args.out)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise
    print("wrote %s (stations=%d errors=%d movements=%d)" % (
        args.out, len(STATIONS), errors, total))
    return 0


if __name__ == "__main__":
    sys.exit(main())
