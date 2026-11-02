#!/usr/bin/env python3
"""Download official CPI series and write data/official_cpi/official_cpi.csv.

Sources
-------
- U.S. BLS Public Data API (v1, no key): U.S. city average + New York metro
- BIS long CPI (no key): Japan national CPI
- Optional e-Stat (ESTAT_APP_ID): Tokyo Ku-area CPI

Usage
-----
    python3 python/fetch_official_cpi.py
    ESTAT_APP_ID=xxxxx python3 python/fetch_official_cpi.py
    BLS_API_KEY=xxxxx python3 python/fetch_official_cpi.py   # v2, up to 20 years
"""

from __future__ import annotations

import csv
import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "official_cpi"
CSV_PATH = OUT_DIR / "official_cpi.csv"
JS_PATH = ROOT / "analysis" / "cpi_data.js"

USER_AGENT = "ColumbiaThesisCPI/1.0 (academic; volatility-simulator)"
START_YEAR_V1 = "2017"
START_YEAR_V2 = "2006"
END_YEAR = "2026"

BLS_SERIES = [
    ("CUUR0000SA0", "BLS", "United States", "All items",
     "CPI-U all items, U.S. city average, NSA"),
    ("CUURS12ASA0", "BLS", "New York metro", "All items",
     "CPI-U all items, New York-Newark-Jersey City, NSA"),
    ("CUUR0000SAF1", "BLS", "United States", "Food",
     "CPI-U food, U.S. city average, NSA"),
    ("CUURS12ASAF1", "BLS", "New York metro", "Food",
     "CPI-U food, New York-Newark-Jersey City, NSA"),
    ("CUUR0000SAH1", "BLS", "United States", "Shelter",
     "CPI-U shelter, U.S. city average, NSA"),
    ("CUURS12ASAH1", "BLS", "New York metro", "Shelter",
     "CPI-U shelter, New York-Newark-Jersey City, NSA"),
    ("CUUR0000SA0L1E", "BLS", "United States", "Core",
     "CPI-U all items less food and energy, U.S. city average, NSA"),
    ("CUURS12ASA0L1E", "BLS", "New York metro", "Core",
     "CPI-U all items less food and energy, New York-Newark-Jersey City, NSA"),
]

ESTAT_STATS_ID = "0003427113"  # 2020-base Japan CPI
ESTAT_TOKYO_AREA = "13A01"     # Ku-area of Tokyo
ESTAT_ALL_ITEMS = "0001"


def http_json(url: str, payload: dict | None = None, timeout: int = 45) -> dict:
    data = None if payload is None else json.dumps(payload).encode()
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    }
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers)
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return json.loads(resp.read().decode())


def http_text(url: str, timeout: int = 45) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return resp.read().decode()


def fetch_bls() -> list[dict]:
    api_key = os.environ.get("BLS_API_KEY", "").strip()
    start = START_YEAR_V2 if api_key else START_YEAR_V1
    version = "v2" if api_key else "v1"
    url = f"https://api.bls.gov/publicAPI/{version}/timeseries/data/"
    payload: dict = {
        "seriesid": [row[0] for row in BLS_SERIES],
        "startyear": start,
        "endyear": END_YEAR,
    }
    if api_key:
        payload["registrationkey"] = api_key
        payload["annualaverage"] = False

    print(f"Fetching BLS {version} ({start}-{END_YEAR})...")
    body = http_json(url, payload)
    if body.get("status") != "REQUEST_SUCCEEDED":
        raise RuntimeError(f"BLS API error: {body.get('status')} {body.get('message')}")

    meta = {row[0]: row[1:] for row in BLS_SERIES}
    rows = []
    for series in body.get("Results", {}).get("series", []):
        series_id = series["seriesID"]
        if series_id not in meta:
            continue
        source, geography, item, name = meta[series_id]
        for point in series.get("data", []):
            period_code = point.get("period", "")
            if not period_code.startswith("M") or period_code == "M13":
                continue
            month = int(period_code[1:])
            value = point.get("value")
            if value in (None, "", "-"):
                continue
            rows.append(
                {
                    "source": source,
                    "series_id": series_id,
                    "series_name": name,
                    "geography": geography,
                    "item": item,
                    "period": f"{point['year']}-{month:02d}",
                    "index_value": float(value),
                }
            )
    print(f"  BLS rows: {len(rows)}")
    return rows


def fetch_bis_japan() -> list[dict]:
    url = "https://stats.bis.org/api/v2/data/dataflow/BIS/WS_LONG_CPI/1.0/M.JP.628?format=csv"
    print("Fetching BIS Japan national CPI...")
    text = http_text(url)
    reader = csv.DictReader(text.splitlines())
    rows = []
    for raw in reader:
        period = (raw.get("TIME_PERIOD") or "").strip()
        value = (raw.get("OBS_VALUE") or "").strip()
        if len(period) < 7 or not value:
            continue
        year = int(period[:4])
        if year < int(START_YEAR_V1):
            continue
        rows.append(
            {
                "source": "BIS",
                "series_id": "BIS.M.JP.628",
                "series_name": "Japan CPI all items (national, BIS long CPI)",
                "geography": "Japan",
                "item": "All items",
                "period": period[:7],
                "index_value": float(value),
            }
        )
    print(f"  BIS Japan rows: {len(rows)}")
    return rows


def fetch_estat_tokyo() -> list[dict]:
    app_id = os.environ.get("ESTAT_APP_ID", "").strip()
    if not app_id:
        print("Skipping Tokyo Ku-area CPI (set ESTAT_APP_ID to enable e-Stat).")
        print("  Register at https://www.e-stat.go.jp/api/ and issue an application ID.")
        return []

    params = {
        "appId": app_id,
        "statsDataId": ESTAT_STATS_ID,
        "lang": "E",
        "cdArea": ESTAT_TOKYO_AREA,
        "cdCat01": ESTAT_ALL_ITEMS,
        "cdTab": "1",
        "metaGetFlg": "N",
        "limit": "100000",
    }
    url = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?" + urllib.parse.urlencode(params)
    print("Fetching e-Stat Tokyo Ku-area CPI...")
    body = http_json(url)
    result = body.get("GET_STATS_DATA", {}).get("RESULT", {})
    status = str(result.get("STATUS", ""))
    if status not in ("0", "0.0"):
        raise RuntimeError(f"e-Stat error: {result}")

    values = (
        body.get("GET_STATS_DATA", {})
        .get("STATISTICAL_DATA", {})
        .get("DATA_INF", {})
        .get("VALUE", [])
    )
    if isinstance(values, dict):
        values = [values]

    rows = []
    for point in values:
        time_code = str(point.get("@time", ""))
        raw_value = point.get("$")
        if len(time_code) < 10 or raw_value in (None, "", "***"):
            continue
        # Monthly codes look like 2026000909; annual/fiscal codes end with 0000.
        month = int(time_code[8:10])
        if month < 1 or month > 12:
            continue
        year = int(time_code[:4])
        if year < int(START_YEAR_V1):
            continue
        rows.append(
            {
                "source": "e-Stat",
                "series_id": f"ESTAT.{ESTAT_STATS_ID}.TokyoKu.AllItems",
                "series_name": "Japan CPI all items, Ku-area of Tokyo (2020=100)",
                "geography": "Tokyo",
                "item": "All items",
                "period": f"{year}-{month:02d}",
                "index_value": float(raw_value),
            }
        )
    print(f"  e-Stat Tokyo rows: {len(rows)}")
    return rows


def write_csv(rows: list[dict]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "source",
        "series_id",
        "series_name",
        "geography",
        "item",
        "period",
        "index_value",
    ]
    rows = sorted(rows, key=lambda r: (r["geography"], r["item"], r["period"]))
    with CSV_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {CSV_PATH.relative_to(ROOT)} ({len(rows)} rows)")


def write_js(rows: list[dict]) -> None:
    JS_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "note": "Official CPI indexes. YoY is computed in the page from lag-12 values.",
        "rows": rows,
    }
    JS_PATH.write_text(
        "window.OFFICIAL_CPI = " + json.dumps(payload, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {JS_PATH.relative_to(ROOT)}")


def main() -> int:
    rows: list[dict] = []
    errors: list[str] = []

    try:
        rows.extend(fetch_bls())
    except (urllib.error.URLError, RuntimeError, TimeoutError, json.JSONDecodeError) as exc:
        errors.append(f"BLS: {exc}")

    try:
        rows.extend(fetch_bis_japan())
    except (urllib.error.URLError, RuntimeError, TimeoutError) as exc:
        errors.append(f"BIS: {exc}")

    try:
        rows.extend(fetch_estat_tokyo())
    except (urllib.error.URLError, RuntimeError, TimeoutError, json.JSONDecodeError) as exc:
        errors.append(f"e-Stat: {exc}")

    if not rows:
        print("No CPI rows downloaded.", file=sys.stderr)
        for err in errors:
            print(err, file=sys.stderr)
        return 1

    write_csv(rows)
    write_js(rows)
    for err in errors:
        print("Warning:", err)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
