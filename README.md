# Volatility Simulator

**Columbia University · Master’s Thesis · Spring 2026**

An interactive digital exhibition about everyday volatility: how the same goods, rituals, and feelings change between Tokyo and New York. Three web studies sit on top of a cleaned commodity-price basket, income figures, and mood labels.

The living-cost piece uses a **CPI-style basket** (a fixed set of everyday items priced in both cities), not the official BLS or Statistics Bureau of Japan CPI time series. SQL then turns that basket into regional price indexes, purchasing-power ratios, and housing-burden stats.

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

FX rate used in the interface and in SQL: **156.9 JPY per USD**.

Python recomputes Tokyo USD as `yen / 156.9` so CSV typos (for example chicken breast listed at `$0.04`) do not leak into the index.

## SQL + Python analysis

```text
python/load_and_analyze.py   extract, clean, load CSVs → SQLite
sql/schema.sql               tables + views
sql/queries.sql              20 analytical queries
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

Example: after loading, this is the core CPI-style comparison.

```sql
SELECT
    ROUND(100.0 * AVG(nyc_price_usd / tokyo_price_usd), 1) AS nyc_index_unweighted,
    ROUND(100.0 * SUM(nyc_price_usd) / SUM(tokyo_price_usd), 1) AS nyc_index_value_weighted
FROM commodity_prices;
```

Tokyo = 100. An unweighted NYC index of ~180 means the typical item in this basket costs about 80% more in New York.

## Suggested resume line

> Leveraged SQL and Python to extract, clean, and analyze a CPI-style commodity basket for Tokyo and New York (price indexes, purchasing power, housing burden), and built an interactive web exhibition of inflation-like regional price gaps.

If a job post wants “official CPI,” say **CPI-style / cost-of-living basket** unless you add BLS or Japanese CPI series later.

## Stack

- **Python 3** (stdlib only: `csv`, `sqlite3`)
- **SQLite**
- **HTML / CSS / JavaScript**
- Webcam APIs in projects 01 and 02 (permission required)

## Thesis frame

Everyday volatility is treated as a lived condition, not only a financial one. The same sandwich, banana, or subway ride is a different object in Tokyo and in New York: different yen/dollar price, different share of a paycheck, different feeling. The SQL layer measures the gap; the exhibition lets someone stand inside it.
