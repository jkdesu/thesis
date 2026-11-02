-- Analytical queries for the Tokyo vs New York commodity basket.
-- Run after python3 python/load_and_analyze.py
--   sqlite3 analysis/thesis.db < sql/queries.sql
-- Or: python3 python/load_and_analyze.py --run-queries

-- ============================================================================
-- 1. Data quality: flag rows where the CSV USD conversion disagrees with yen / FX
-- ============================================================================
SELECT
    item_id,
    item_name,
    tokyo_price_jpy,
    tokyo_price_usd_reported AS csv_usd,
    ROUND(tokyo_price_usd, 2) AS recomputed_usd,
    ROUND(ABS(tokyo_price_usd_reported - tokyo_price_usd), 2) AS abs_error
FROM commodity_prices
WHERE ABS(COALESCE(tokyo_price_usd_reported, 0) - tokyo_price_usd) > 0.05
ORDER BY abs_error DESC;

-- ============================================================================
-- 2. Full basket: NYC premium vs Tokyo (USD)
-- ============================================================================
SELECT
    item_id,
    item_name,
    category,
    ROUND(tokyo_price_usd, 2) AS tokyo_usd,
    ROUND(nyc_price_usd, 2) AS nyc_usd,
    ROUND(nyc_price_usd - tokyo_price_usd, 2) AS usd_gap,
    ROUND(100.0 * (nyc_price_usd - tokyo_price_usd) / tokyo_price_usd, 1) AS nyc_pct_premium
FROM commodity_prices
ORDER BY nyc_pct_premium DESC;

-- ============================================================================
-- 3. CPI-style regional price index (Tokyo = 100), equal item weights
--    A value of 180 means the NYC basket costs 80% more than Tokyo.
-- ============================================================================
SELECT
    ROUND(100.0, 1) AS tokyo_index,
    ROUND(100.0 * AVG(nyc_price_usd / tokyo_price_usd), 1) AS nyc_index_unweighted,
    ROUND(100.0 * SUM(nyc_price_usd) / SUM(tokyo_price_usd), 1) AS nyc_index_value_weighted,
    COUNT(*) AS basket_size
FROM commodity_prices;

-- ============================================================================
-- 4. Category-level cost-of-living index (Tokyo = 100)
-- ============================================================================
SELECT
    category,
    COUNT(*) AS n_items,
    ROUND(AVG(tokyo_price_usd), 2) AS avg_tokyo_usd,
    ROUND(AVG(nyc_price_usd), 2) AS avg_nyc_usd,
    ROUND(100.0 * AVG(nyc_price_usd / tokyo_price_usd), 1) AS nyc_index,
    ROUND(100.0 * SUM(nyc_price_usd) / SUM(tokyo_price_usd), 1) AS nyc_index_value_weighted
FROM commodity_prices
GROUP BY category
ORDER BY nyc_index DESC;

-- ============================================================================
-- 5. Everyday staples only (food + housing + transit) as a lived-CPI proxy
-- ============================================================================
SELECT
    ROUND(100.0 * SUM(CASE WHEN category IN ('Fast food', 'Groceries', 'Housing', 'Transit')
                           THEN nyc_price_usd ELSE 0 END)
              / SUM(CASE WHEN category IN ('Fast food', 'Groceries', 'Housing', 'Transit')
                         THEN tokyo_price_usd ELSE 0 END), 1) AS nyc_staples_index,
    ROUND(SUM(CASE WHEN category IN ('Fast food', 'Groceries', 'Housing', 'Transit')
                   THEN tokyo_price_usd END), 2) AS tokyo_staples_usd,
    ROUND(SUM(CASE WHEN category IN ('Fast food', 'Groceries', 'Housing', 'Transit')
                   THEN nyc_price_usd END), 2) AS nyc_staples_usd
FROM commodity_prices;

-- ============================================================================
-- 6. Items cheaper in New York (negative "inflation" vs Tokyo)
-- ============================================================================
SELECT
    item_name,
    category,
    ROUND(tokyo_price_usd, 2) AS tokyo_usd,
    ROUND(nyc_price_usd, 2) AS nyc_usd,
    ROUND(100.0 * (nyc_price_usd - tokyo_price_usd) / tokyo_price_usd, 1) AS nyc_pct_vs_tokyo
FROM commodity_prices
WHERE nyc_price_usd < tokyo_price_usd
ORDER BY nyc_pct_vs_tokyo;

-- ============================================================================
-- 7. Rank items by NYC premium (window functions)
-- ============================================================================
SELECT
    category,
    item_name,
    ROUND(100.0 * (nyc_price_usd - tokyo_price_usd) / tokyo_price_usd, 1) AS nyc_pct_premium,
    RANK() OVER (
        PARTITION BY category
        ORDER BY (nyc_price_usd / tokyo_price_usd) DESC
    ) AS rank_in_category,
    ROUND(PERCENT_RANK() OVER (
        ORDER BY nyc_price_usd / tokyo_price_usd
    ) * 100, 1) AS basket_percentile
FROM commodity_prices
ORDER BY category, rank_in_category;

-- ============================================================================
-- 8. Purchasing power: share of monthly disposable income per item
-- ============================================================================
WITH income AS (
    SELECT
        MAX(CASE WHEN city = 'Tokyo' THEN disposable_income_usd END) AS tokyo_disp,
        MAX(CASE WHEN city = 'New York' THEN disposable_income_usd END) AS nyc_disp
    FROM city_income
)
SELECT
    c.item_name,
    c.category,
    ROUND(100.0 * c.tokyo_price_usd / i.tokyo_disp, 3) AS tokyo_pct_of_disposable,
    ROUND(100.0 * c.nyc_price_usd / i.nyc_disp, 3) AS nyc_pct_of_disposable,
    ROUND(
        (c.nyc_price_usd / i.nyc_disp) / (c.tokyo_price_usd / i.tokyo_disp),
        2
    ) AS relative_burden_nyc_vs_tokyo
FROM commodity_prices c
CROSS JOIN income i
ORDER BY relative_burden_nyc_vs_tokyo DESC;

-- ============================================================================
-- 9. Hours of work required (assume 160 paid hours / month on gross earnings)
-- ============================================================================
WITH labor AS (
    SELECT
        city,
        median_gross_usd / 160.0 AS hourly_usd
    FROM city_income
)
SELECT
    c.item_name,
    c.category,
    ROUND(c.tokyo_price_usd / t.hourly_usd, 2) AS tokyo_hours,
    ROUND(c.nyc_price_usd / n.hourly_usd, 2) AS nyc_hours,
    ROUND(
        (c.nyc_price_usd / n.hourly_usd) - (c.tokyo_price_usd / t.hourly_usd),
        2
    ) AS extra_hours_in_nyc
FROM commodity_prices c
JOIN labor t ON t.city = 'Tokyo'
JOIN labor n ON n.city = 'New York'
ORDER BY extra_hours_in_nyc DESC;

-- ============================================================================
-- 10. Housing burden and leftover budget
-- ============================================================================
SELECT
    city,
    ROUND(median_rent_usd, 2) AS rent_usd,
    ROUND(median_utility_usd, 2) AS utility_usd,
    ROUND(median_rent_usd + median_utility_usd, 2) AS housing_usd,
    ROUND(disposable_income_usd, 2) AS disposable_usd,
    ROUND(100.0 * (median_rent_usd + median_utility_usd) / disposable_income_usd, 1)
        AS housing_share_of_disposable_pct,
    ROUND(money_left_after_housing_usd, 2) AS leftover_usd
FROM city_income
ORDER BY city;

-- ============================================================================
-- 11. Simulated monthly CPI basket: 1x housing + 4x transit + grocery/fast-food staples
--     Weights are explicit assumptions, not official CPI weights.
-- ============================================================================
WITH weights AS (
    SELECT item_id, item_name, tokyo_price_usd, nyc_price_usd,
           CASE
               WHEN item_name LIKE 'Rent%' THEN 1.0
               WHEN item_name LIKE 'Utility%' THEN 1.0
               WHEN item_name LIKE 'Phone Bill%' THEN 1.0
               WHEN item_name LIKE 'Transit%' THEN 40.0          -- ~20 commutes x 2
               WHEN item_name LIKE '%Rice%' THEN 2.0
               WHEN item_name LIKE '%Eggs%' THEN 4.0
               WHEN item_name LIKE '%Bread%' THEN 4.0
               WHEN item_name LIKE '%Chicken%' THEN 4.0
               WHEN item_name LIKE '%Banana%' THEN 8.0
               WHEN item_name LIKE '%Coffee%' THEN 12.0
               WHEN item_name LIKE '%Big Mac%' THEN 2.0
               ELSE 0
           END AS qty
    FROM commodity_prices
)
SELECT
    ROUND(SUM(qty * tokyo_price_usd), 2) AS tokyo_monthly_basket_usd,
    ROUND(SUM(qty * nyc_price_usd), 2) AS nyc_monthly_basket_usd,
    ROUND(100.0 * SUM(qty * nyc_price_usd) / SUM(qty * tokyo_price_usd), 1)
        AS nyc_weighted_index_tokyo_100
FROM weights
WHERE qty > 0;

-- ============================================================================
-- 12. Line items inside the simulated monthly basket
-- ============================================================================
WITH weights AS (
    SELECT item_id, item_name, category, tokyo_price_usd, nyc_price_usd,
           CASE
               WHEN item_name LIKE 'Rent%' THEN 1.0
               WHEN item_name LIKE 'Utility%' THEN 1.0
               WHEN item_name LIKE 'Phone Bill%' THEN 1.0
               WHEN item_name LIKE 'Transit%' THEN 40.0
               WHEN item_name LIKE '%Rice%' THEN 2.0
               WHEN item_name LIKE '%Eggs%' THEN 4.0
               WHEN item_name LIKE '%Bread%' THEN 4.0
               WHEN item_name LIKE '%Chicken%' THEN 4.0
               WHEN item_name LIKE '%Banana%' THEN 8.0
               WHEN item_name LIKE '%Coffee%' THEN 12.0
               WHEN item_name LIKE '%Big Mac%' THEN 2.0
               ELSE 0
           END AS qty
    FROM commodity_prices
)
SELECT
    item_name,
    qty,
    ROUND(qty * tokyo_price_usd, 2) AS tokyo_line_usd,
    ROUND(qty * nyc_price_usd, 2) AS nyc_line_usd,
    ROUND(100.0 * (qty * nyc_price_usd) / SUM(qty * nyc_price_usd) OVER (), 1)
        AS pct_of_nyc_basket
FROM weights
WHERE qty > 0
ORDER BY nyc_line_usd DESC;

-- ============================================================================
-- 13. Retailer-level average gap
-- ============================================================================
SELECT
    tokyo_retailer,
    nyc_retailer,
    COUNT(*) AS n_items,
    ROUND(AVG(tokyo_price_usd), 2) AS avg_tokyo_usd,
    ROUND(AVG(nyc_price_usd), 2) AS avg_nyc_usd,
    ROUND(100.0 * AVG(nyc_price_usd / tokyo_price_usd), 1) AS nyc_index
FROM commodity_prices
GROUP BY tokyo_retailer, nyc_retailer
HAVING COUNT(*) >= 1
ORDER BY nyc_index DESC;

-- ============================================================================
-- 14. Big Mac / Starbucks mini-index (tradable branded goods)
-- ============================================================================
SELECT
    'Branded food & drink' AS basket,
    ROUND(100.0 * SUM(nyc_price_usd) / SUM(tokyo_price_usd), 1) AS nyc_index
FROM commodity_prices
WHERE item_name LIKE '%Big Mac%'
   OR item_name LIKE '%Whopper%'
   OR item_name LIKE '%Starbucks%'
   OR item_name LIKE '%Coca Cola%'
   OR item_name LIKE '%Domino%';

-- ============================================================================
-- 15. Electronics vs services: tradable vs non-tradable split
-- ============================================================================
SELECT
    CASE
        WHEN category = 'Electronics' THEN 'Tradable (electronics)'
        WHEN category IN ('Housing', 'Transit', 'Services') THEN 'Non-tradable (local services)'
        ELSE 'Mixed goods'
    END AS goods_type,
    COUNT(*) AS n_items,
    ROUND(100.0 * AVG(nyc_price_usd / tokyo_price_usd), 1) AS nyc_index
FROM commodity_prices
GROUP BY 1
ORDER BY nyc_index DESC;

-- ============================================================================
-- 16. City long-format summary
-- ============================================================================
SELECT
    city,
    COUNT(*) AS n_items,
    ROUND(AVG(price_usd), 2) AS avg_price_usd,
    ROUND(SUM(price_usd), 2) AS basket_sum_usd,
    ROUND(MIN(price_usd), 2) AS cheapest,
    ROUND(MAX(price_usd), 2) AS most_expensive
FROM v_city_prices
GROUP BY city;

-- ============================================================================
-- 17. Quality-of-life scores vs price index
-- ============================================================================
SELECT
    city,
    ROUND(AVG(score * 1.0), 2) AS avg_happiness,
    SUM(score) AS total_score
FROM happiness_scores
GROUP BY city;

SELECT
    city,
    dimension,
    score,
    RANK() OVER (PARTITION BY dimension ORDER BY score DESC) AS better_city_rank
FROM happiness_scores
ORDER BY dimension, better_city_rank;

-- ============================================================================
-- 18. NYC pays more AND scores higher: the comfort/cost tradeoff
-- ============================================================================
WITH price AS (
    SELECT
        ROUND(100.0 * SUM(nyc_price_usd) / SUM(tokyo_price_usd), 1) AS nyc_price_index
    FROM commodity_prices
),
life AS (
    SELECT
        ROUND(1.0 * SUM(CASE WHEN city = 'New York' THEN score END)
                / SUM(CASE WHEN city = 'Tokyo' THEN score END), 2) AS nyc_happiness_ratio
    FROM happiness_scores
)
SELECT
    p.nyc_price_index,
    l.nyc_happiness_ratio,
    ROUND(p.nyc_price_index / 100.0 / l.nyc_happiness_ratio, 2) AS extra_cost_per_happiness_unit
FROM price p
CROSS JOIN life l;

-- ============================================================================
-- 19. Mood index inventory (Project 03 sandwich)
-- ============================================================================
SELECT
    COUNT(*) AS n_moods,
    COUNT(DISTINCT observation) AS unique_observations,
    COUNT(DISTINCT feeling) AS unique_feelings,
    SUM(CASE WHEN feeling = feeling_after_sandwich THEN 1 ELSE 0 END) AS unchanged_after_build
FROM mood_index;

SELECT mood_id, observation, feeling, feeling_after_sandwich
FROM mood_index
ORDER BY mood_id;

-- ============================================================================
-- 20. Exchange-rate sensitivity: what if JPY/USD moves ±10%
-- ============================================================================
SELECT
    item_name,
    ROUND(tokyo_price_jpy / fx_rate_jpy_per_usd, 2) AS tokyo_usd_base,
    ROUND(tokyo_price_jpy / (fx_rate_jpy_per_usd * 0.90), 2) AS tokyo_usd_if_yen_10pct_stronger,
    ROUND(tokyo_price_jpy / (fx_rate_jpy_per_usd * 1.10), 2) AS tokyo_usd_if_yen_10pct_weaker,
    ROUND(nyc_price_usd, 2) AS nyc_usd
FROM commodity_prices
WHERE category IN ('Groceries', 'Fast food', 'Housing')
ORDER BY item_id;
