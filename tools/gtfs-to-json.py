#!/usr/bin/env python3
"""Regenerate api/gtfs.json stops from the official GTFS zip (provenance tool).

Reads stops.txt from a MobilityDatabase mdb-1319 zip (Trenitalia, CC-BY)
and rebuilds the demo stops with real stop_id/lat/lon + haversine km.
Routes/vehicles positions stay simulated (documented in the JSON).

Usage:
  python3 tools/gtfs-to-json.py /tmp/gtfs-marche/marche-latest.zip \
      --out /var/www/html/api/gtfs.json

The 5 demo stations (Fano, Marotta-Mondolfo, Senigallia, Falconara M.,
Ancona) are the Adriatic-coast subset of the feed. Marzocca/Montemarciano
have no rail stop in the feed (bus only: ATMA/Conerobus, no open GTFS).
"""
import argparse
import csv
import json
import math
import zipfile

WANTED = ["S07105_1", "S07107_1", "S07108_1", "S07111_1", "S07113_1"]
SHORT = {"S07105_1": "FAN", "S07107_1": "MAR", "S07108_1": "SEN",
         "S07111_1": "FAL", "S07113_1": "ANC"}


def hav(a, b, c, d):
    R = 6371.0
    dlat, dlon = math.radians(c - a), math.radians(d - b)
    h = (math.sin(dlat / 2) ** 2 + math.cos(math.radians(a))
         * math.cos(math.radians(c)) * math.sin(dlon / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(h))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("zip")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    with zipfile.ZipFile(args.zip) as z:
        with z.open("stops.txt") as f:
            text = f.read().decode("utf-8-sig").splitlines()
    rows = {r["stop_id"]: r for r in csv.DictReader(text)}
    missing = [w for w in WANTED if w not in rows]
    if missing:
        raise SystemExit("missing stops in feed: %s" % missing)

    ordered = sorted(WANTED,
                     key=lambda sid: float(rows[sid]["stop_lon"]))
    # order south-east along coast: Fano -> Ancona by lon works here
    stops, km, prev = [], 0.0, None
    for sid in ordered:
        r = rows[sid]
        la, lo = float(r["stop_lat"]), float(r["stop_lon"])
        if prev:
            km += hav(prev[0], prev[1], la, lo)
        stops.append({"id": SHORT[sid], "gtfs_stop_id": sid,
                      "name": r["stop_name"], "lat": round(la, 5),
                      "lon": round(lo, 5), "km": round(km, 1)})
        prev = (la, lo)

    old = json.load(open(args.out, encoding="utf-8"))
    old["stops"] = stops
    json.dump(old, open(args.out, "w", encoding="utf-8"),
              indent=2, ensure_ascii=False)
    print("updated %s with %d real stops" % (args.out, len(stops)))


if __name__ == "__main__":
    main()
