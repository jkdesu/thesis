-- Volatility Simulator | Tokyo vs New York commodity basket
-- SQLite schema. Load cleaned tables with: python3 python/load_and_analyze.py

PRAGMA foreign_keys = ON;

DROP VIEW IF EXISTS v_item_price_gaps;
DROP VIEW IF EXISTS v_city_prices;
DROP TABLE IF EXISTS mood_index;
DROP TABLE IF EXISTS happiness_scores;
DROP TABLE IF EXISTS city_income;
DROP TABLE IF EXISTS commodity_prices;

CREATE TABLE commodity_prices (
    item_id            INTEGER PRIMARY KEY,
    item_name          TEXT NOT NULL,
    category           TEXT NOT NULL,
    tokyo_retailer     TEXT NOT NULL,
    nyc_retailer       TEXT NOT NULL,
    tokyo_price_jpy    REAL NOT NULL,
    tokyo_price_usd_reported REAL,
    tokyo_price_usd    REAL NOT NULL,  -- recomputed: yen / fx_rate
    nyc_price_usd      REAL NOT NULL,
    fx_rate_jpy_per_usd REAL NOT NULL
);

CREATE TABLE city_income (
    city                       TEXT PRIMARY KEY,
    currency                   TEXT NOT NULL,
    median_gross_local         REAL NOT NULL,
    median_gross_usd           REAL NOT NULL,
    disposable_income_local    REAL NOT NULL,
    disposable_income_usd      REAL NOT NULL,
    median_rent_local          REAL NOT NULL,
    median_rent_usd            REAL NOT NULL,
    median_utility_local       REAL NOT NULL,
    median_utility_usd         REAL NOT NULL,
    money_left_after_housing_local REAL NOT NULL,
    money_left_after_housing_usd   REAL NOT NULL
);

CREATE TABLE happiness_scores (
    city               TEXT NOT NULL,
    dimension          TEXT NOT NULL,
    score              INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
    PRIMARY KEY (city, dimension)
);

CREATE TABLE mood_index (
    mood_id            INTEGER PRIMARY KEY,
    observation        TEXT NOT NULL,
    feeling            TEXT NOT NULL,
    feeling_after_sandwich TEXT NOT NULL
);

-- Long format for city-to-city joins
CREATE VIEW v_city_prices AS
SELECT
    item_id,
    item_name,
    category,
    'Tokyo' AS city,
    tokyo_retailer AS retailer,
    tokyo_price_usd AS price_usd,
    tokyo_price_jpy AS price_local,
    'JPY' AS local_currency
FROM commodity_prices
UNION ALL
SELECT
    item_id,
    item_name,
    category,
    'New York' AS city,
    nyc_retailer AS retailer,
    nyc_price_usd AS price_usd,
    nyc_price_usd AS price_local,
    'USD' AS local_currency
FROM commodity_prices;

CREATE VIEW v_item_price_gaps AS
SELECT
    item_id,
    item_name,
    category,
    tokyo_retailer,
    nyc_retailer,
    tokyo_price_jpy,
    tokyo_price_usd,
    nyc_price_usd,
    ROUND(nyc_price_usd - tokyo_price_usd, 2) AS usd_gap,
    ROUND(nyc_price_usd / tokyo_price_usd, 3) AS nyc_to_tokyo_ratio,
    ROUND(100.0 * (nyc_price_usd - tokyo_price_usd) / tokyo_price_usd, 1) AS nyc_pct_premium,
    ROUND(tokyo_price_usd_reported - tokyo_price_usd, 2) AS usd_conversion_error
FROM commodity_prices;
