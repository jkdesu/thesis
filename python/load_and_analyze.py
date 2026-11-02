#!/usr/bin/env python3
"""Extract, clean, and load thesis CSVs into SQLite, then optionally run SQL queries.

Usage (from repo root):
    python3 python/load_and_analyze.py
    python3 python/load_and_analyze.py --run-queries
"""

from __future__ import annotations

import argparse
import csv
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_DIR = ROOT / "sql"
DATA_DIR = ROOT / "project_01(living_cost)"
MOOD_CSV = ROOT / "project_03(sandwich)" / "mood_index.csv"
DB_PATH = ROOT / "analysis" / "thesis.db"
RESULTS_PATH = ROOT / "analysis" / "query_results.txt"

FX_RATE = 156.9  # JPY per USD, matching the living-cost interface

CATEGORIES = {
    1: "Fast food",
    2: "Fast food",
    3: "Fast food",
    4: "Fast food",
    5: "Fast food",
    6: "Fast food",
    7: "Fast food",
    8: "Fast food",
    9: "Fast food",
    10: "Groceries",
    11: "Groceries",
    12: "Groceries",
    13: "Groceries",
    14: "Groceries",
    15: "Groceries",
    16: "Groceries",
    17: "Groceries",
    18: "Convenience",
    19: "Convenience",
    20: "Personal care",
    21: "Personal care",
    22: "Apparel",
    23: "Apparel",
    24: "Electronics",
    25: "Electronics",
    26: "Services",
    27: "Housing",
    28: "Housing",
    29: "Transit",
    30: "Services",
}

HAPPINESS_DIMENSIONS = [
    "Individuality",
    "Work culture",
    "Career opportunities",
    "Benefits",
    "Social equity",
]


def parse_number(value: str | None) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = text.replace("$", "").replace(",", "").replace("¥", "")
    text = re.sub(r"\s+", "", text)
    if not text:
        return None
    return float(text)


def load_commodity_rows() -> list[tuple]:
    path = DATA_DIR / "commodity_prices.csv"
    rows = []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            item_id = int(raw["ID"])
            yen = parse_number(raw["Price_Local_Yen"])
            reported_usd = parse_number(raw["JPY/USD"])
            nyc_usd = parse_number(raw["Price_Local_USD"])
            if yen is None or nyc_usd is None:
                raise ValueError(f"Missing price for item {item_id}")
            recomputed_usd = yen / FX_RATE
            rows.append(
                (
                    item_id,
                    raw["Item"].strip(),
                    CATEGORIES[item_id],
                    raw["Tokyo"].strip(),
                    raw["NYC"].strip(),
                    yen,
                    reported_usd,
                    recomputed_usd,
                    nyc_usd,
                    FX_RATE,
                )
            )
    return rows


def load_income_rows() -> list[tuple]:
    path = DATA_DIR / "Monthly_Income_JPY_USD.csv"
    parsed: dict[str, dict[str, float]] = {}
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.reader(handle)
        next(reader)  # header
        for row in reader:
            if not row or not row[0].strip():
                continue
            label = row[0].strip()
            parsed[label] = {
                "tokyo_local": parse_number(row[1]),
                "tokyo_usd": parse_number(row[2]),
                "nyc_usd": parse_number(row[3]),
            }

    def metric(label: str) -> dict[str, float]:
        if label not in parsed:
            raise KeyError(f"Missing income row: {label}")
        return parsed[label]

    gross = metric("Typical Median Earnings (Gross)")
    disp = metric("Disposable_Income (Monthly)")
    rent = metric("Median Rent")
    util = metric("Median Utility")
    left = metric("money_left")

    tokyo = (
        "Tokyo",
        "JPY",
        gross["tokyo_local"],
        gross["tokyo_local"] / FX_RATE,
        disp["tokyo_local"],
        disp["tokyo_local"] / FX_RATE,
        rent["tokyo_local"],
        rent["tokyo_local"] / FX_RATE,
        util["tokyo_local"],
        util["tokyo_local"] / FX_RATE,
        left["tokyo_local"],
        left["tokyo_local"] / FX_RATE,
    )
    nyc = (
        "New York",
        "USD",
        gross["nyc_usd"],
        gross["nyc_usd"],
        disp["nyc_usd"],
        disp["nyc_usd"],
        rent["nyc_usd"],
        rent["nyc_usd"],
        util["nyc_usd"],
        util["nyc_usd"],
        left["nyc_usd"],
        left["nyc_usd"],
    )
    return [tokyo, nyc]


def load_happiness_rows() -> list[tuple]:
    path = DATA_DIR / "Happiness_Dataset.csv"
    rows = []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.reader(handle)
        next(reader)  # header
        for row in reader:
            if not row or not row[0].strip():
                continue
            city = "Tokyo" if "Tokyo" in row[0] else "New York"
            for dimension, value in zip(HAPPINESS_DIMENSIONS, row[1:6]):
                rows.append((city, dimension, int(value)))
    return rows


def load_mood_rows() -> list[tuple]:
    rows = []
    with MOOD_CSV.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            rows.append(
                (
                    int(raw["index"]),
                    raw["observation"].strip(),
                    raw["your feeling "].strip()
                    if "your feeling " in raw
                    else raw["your feeling"].strip(),
                    raw["feeling after constructed sandwich"].strip(),
                )
            )
    return rows


def build_database() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    conn.executescript((SQL_DIR / "schema.sql").read_text(encoding="utf-8"))

    conn.executemany(
        """
        INSERT INTO commodity_prices (
            item_id, item_name, category, tokyo_retailer, nyc_retailer,
            tokyo_price_jpy, tokyo_price_usd_reported, tokyo_price_usd,
            nyc_price_usd, fx_rate_jpy_per_usd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        load_commodity_rows(),
    )
    conn.executemany(
        """
        INSERT INTO city_income (
            city, currency, median_gross_local, median_gross_usd,
            disposable_income_local, disposable_income_usd,
            median_rent_local, median_rent_usd,
            median_utility_local, median_utility_usd,
            money_left_after_housing_local, money_left_after_housing_usd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        load_income_rows(),
    )
    conn.executemany(
        "INSERT INTO happiness_scores (city, dimension, score) VALUES (?, ?, ?)",
        load_happiness_rows(),
    )
    conn.executemany(
        """
        INSERT INTO mood_index (
            mood_id, observation, feeling, feeling_after_sandwich
        ) VALUES (?, ?, ?, ?)
        """,
        load_mood_rows(),
    )
    conn.commit()
    return conn


def split_sql_statements(sql_text: str) -> list[str]:
    statements = []
    for chunk in sql_text.split(";"):
        lines = [
            line
            for line in chunk.splitlines()
            if line.strip() and not line.strip().startswith("--")
        ]
        statement = "\n".join(lines).strip()
        if statement:
            statements.append(statement)
    return statements


def run_queries(conn: sqlite3.Connection) -> str:
    sql_text = (SQL_DIR / "queries.sql").read_text(encoding="utf-8")
    output: list[str] = []
    for index, statement in enumerate(split_sql_statements(sql_text), start=1):
        header = statement.splitlines()[0][:80]
        output.append(f"\n{'=' * 78}\nQUERY {index}: {header}\n{'=' * 78}")
        cursor = conn.execute(statement)
        columns = [col[0] for col in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        if not columns:
            output.append("(no result set)")
            continue
        output.append(" | ".join(columns))
        output.append("-" * 78)
        if not rows:
            output.append("(0 rows)")
            continue
        for row in rows:
            output.append(" | ".join("" if value is None else str(value) for value in row))
    text = "\n".join(output) + "\n"
    RESULTS_PATH.write_text(text, encoding="utf-8")
    return text


def main() -> None:
    parser = argparse.ArgumentParser(description="Load thesis CSVs into SQLite.")
    parser.add_argument(
        "--run-queries",
        action="store_true",
        help="Execute sql/queries.sql and write analysis/query_results.txt",
    )
    args = parser.parse_args()

    conn = build_database()
    n_items = conn.execute("SELECT COUNT(*) FROM commodity_prices").fetchone()[0]
    print(f"Wrote {DB_PATH.relative_to(ROOT)} with {n_items} commodity rows.")

    flags = conn.execute(
        """
        SELECT item_id, item_name,
               ROUND(tokyo_price_usd_reported, 2),
               ROUND(tokyo_price_usd, 2)
        FROM commodity_prices
        WHERE ABS(COALESCE(tokyo_price_usd_reported, 0) - tokyo_price_usd) > 0.05
        """
    ).fetchall()
    if flags:
        print("USD conversion mismatches (CSV vs yen / FX):")
        for item_id, name, reported, recomputed in flags:
            print(f"  #{item_id} {name}: csv={reported} recomputed={recomputed}")

    if args.run_queries:
        run_queries(conn)
        print(f"Wrote {RESULTS_PATH.relative_to(ROOT)}")

    conn.close()


if __name__ == "__main__":
    main()
