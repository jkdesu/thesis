# Volatility Simulator

**Columbia University · Master’s Thesis · Spring 2026**

An interactive digital exhibition about everyday volatility: how the same goods, rituals, and feelings change between Tokyo and New York. Three web studies sit on top of a cleaned commodity-price basket, income figures, and mood labels.

Two price layers sit side by side:

1. A **30-item Tokyo / New York basket** (your own prices) for *level* differences between cities.
2. **Official CPI time series** from statistical agencies for *inflation over time*.

They answer different questions. CPI is not a Tokyo-vs-NYC shopping list; the shopping list is not official inflation.

## Exhibition

Open `index.html` in a browser (double-click, or serve the folder locally).

| Project | Path | What it does |
| --- | --- | --- |
| **01 Living Cost** | `project_01(living_cost)/` | Side-by-side Tokyo / NYC prices for 30 commodities, budget leftover after rent, and a webcam reaction tracker |
| **02 Intrinsic Value** | `project_02(banana)/` | Camera-based banana poem generator set against Tokyo and Manhattan collages |
| **03 Value Deconstruction** | `project_03(sandwich)/` | Build a sandwich from mood → ingredients → receipt |

No build step and no npm install. Static HTML, CSS, and JavaScript.

```bash
# optional local server (avoids some browser camera restrictions)
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Data

| File | Contents |
| --- | --- |
| `project_01(living_cost)/commodity_prices.csv` | 30 items: Tokyo yen, reported USD, NYC USD, retailer |
| `project_01(living_cost)/Monthly_Income_JPY_USD.csv` | Median earnings, disposable income, rent, utilities |
| `project_01(living_cost)/Happiness_Dataset.csv` | 1–10 scores for five quality-of-life dimensions |
| `project_03(sandwich)/mood_index.csv` | Observation / feeling labels for the sandwich study |
| `data/official_cpi/official_cpi.csv` | Official monthly CPI pulled by `python/fetch_official_cpi.py` |

FX rate used in the interface and in SQL: **156.9 JPY per USD**.

## Official CPI APIs

```bash
python3 python/fetch_official_cpi.py
python3 python/load_and_analyze.py --run-queries
```

Then open `analysis/cpi_trends.html`.

| Geography | Source | Key needed? |
| --- | --- | --- |
| United States (CPI-U all items, food, shelter, core) | [BLS Public Data API](https://www.bls.gov/developers/) series `CUUR0000SA0` etc. | No (v1). Optional `BLS_API_KEY` for v2 / 20 years |
| New York–Newark–Jersey City | BLS `CUURS12ASA0` (and food/shelter/core) | Same |
| Japan, national | [BIS long CPI](https://data.bis.org/) `M.JP.628` | No |
| Tokyo, Ku-area | [e-Stat](https://www.e-stat.go.jp/api/) table `0003427113`, area `13A01` | Yes: `ESTAT_APP_ID` |

Free BLS registration: [api.bls.gov signup](https://data.bls.gov/registrationEngine/).  
e-Stat: create an account, issue an application ID, then:

```bash
ESTAT_APP_ID=your_id python3 python/fetch_official_cpi.py
```

Python uses the stdlib only (`urllib`, `csv`, `json`, `sqlite3`).

Python recomputes Tokyo USD as `yen / 156.9` so CSV typos (for example chicken breast listed at `$0.04`) do not leak into the index.

## SQL + Python analysis

```text
python/load_and_analyze.py   extract, clean, load CSVs → SQLite
sql/schema.sql               tables + views
sql/queries.sql              basket + official CPI queries
analysis/thesis.db           generated database
```

```bash
python3 python/load_and_analyze.py --run-queries
sqlite3 analysis/thesis.db < sql/queries.sql
```

The loader strips `$`, commas, and extra spaces from the CSVs, assigns categories, rebuilds USD prices, and writes `analysis/thesis.db`.

### What the queries cover

1. Data-quality check on yen → USD conversion
2. Full basket NYC % premium vs Tokyo
3. Unweighted and value-weighted **regional price index** (Tokyo = 100)
4. Category indexes (fast food, groceries, housing, electronics, …)
5. Staples-only lived-CPI proxy (food + housing + transit)
6. Items cheaper in New York
7. Rank / percentile of each item’s NYC premium
8. Share of monthly disposable income
9. Hours of work to buy each item
10. Rent + utility burden
11–12. Weighted monthly basket (explicit qty assumptions, not official CPI weights)
13. Retailer-level gaps
14. Branded food mini-index (Big Mac, Starbucks, …)
15. Tradable electronics vs non-tradable local services
16. City-level basket totals
17–18. Happiness scores vs the price index
19. Mood-index inventory
20. FX sensitivity: yen ±10%
21–27. Official CPI coverage, latest YoY, NYC vs U.S., food vs shelter, Japan vs NYC, calendar-year averages, CPI vs basket

Example: after loading, this is the core CPI-style comparison.

```sql
SELECT
    ROUND(100.0 * AVG(nyc_price_usd / tokyo_price_usd), 1) AS nyc_index_unweighted,
    ROUND(100.0 * SUM(nyc_price_usd) / SUM(tokyo_price_usd), 1) AS nyc_index_value_weighted
FROM commodity_prices;
```

Tokyo = 100. An unweighted NYC index of ~180 means the typical item in this basket costs about 80% more in New York.

## Stack

- **Python 3** (stdlib: `csv`, `sqlite3`, `urllib`)
- **SQLite**
- **HTML / CSS / JavaScript**
- Webcam APIs in projects 01 and 02 (permission required)

## Thesis frame

Everyday volatility is treated as a lived condition, not only a financial one. The same sandwich, banana, or subway ride is a different object in Tokyo and in New York: different yen/dollar price, different share of a paycheck, different feeling. The SQL layer measures the gap; the exhibition lets someone stand inside it.
