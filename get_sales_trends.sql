CREATE OR REPLACE FUNCTION get_sales_trends(
    start_date DATE,
    end_date DATE,
    category TEXT
)
RETURNS TABLE (
    week_start DATE,
    total_sales NUMERIC,
    prev_period_sales NUMERIC
)
AS $$
DECLARE
    num_weeks INTEGER;
    prev_start DATE;
    prev_end DATE;
BEGIN
    -- Calculate number of weeks in the selected range
    num_weeks := FLOOR(EXTRACT(DAY FROM date_trunc('week', end_date) - date_trunc('week', start_date)) / 7) + 1;
    prev_start := date_trunc('week', start_date) - (num_weeks * INTERVAL '1 week');
    prev_end := date_trunc('week', start_date) - INTERVAL '1 week';

    RETURN QUERY
    WITH
    weeks AS (
        SELECT
            generate_series(
                date_trunc('week', start_date)::date,
                date_trunc('week', end_date)::date,
                INTERVAL '1 week'
            )::date AS week_start
    ),
    weeks_with_offsets AS (
        SELECT
            weeks.week_start,
            ROW_NUMBER() OVER (ORDER BY weeks.week_start) - 1 AS week_offset
        FROM weeks
    ),
    prev_weeks AS (
        SELECT
            prev_weeks_inner.week_start AS prev_week_start,
            ROW_NUMBER() OVER (ORDER BY prev_weeks_inner.week_start) - 1 AS week_offset
        FROM (
            SELECT
                generate_series(
                    prev_start::date,
                    prev_end::date,
                    INTERVAL '1 week'
                )::date AS week_start
        ) AS prev_weeks_inner
    ),
    this_period AS (
        SELECT
            date_trunc('week', "Order Date")::date AS week_start,
            SUM("Net Price") AS total_sales
        FROM "Zero CSV Data"
        WHERE "Order Date" BETWEEN start_date AND end_date
          AND (
            LOWER(category) = 'all'
            OR "Sales Category" = category
          )
        GROUP BY date_trunc('week', "Order Date")::date
    ),
    prev_period AS (
        SELECT
            date_trunc('week', "Order Date")::date AS week_start,
            SUM("Net Price") AS prev_period_sales
        FROM "Zero CSV Data"
        WHERE "Order Date" BETWEEN prev_start AND prev_end
          AND (
            LOWER(category) = 'all'
            OR "Sales Category" = category
          )
        GROUP BY date_trunc('week', "Order Date")::date
    )
    SELECT
        wwo.week_start,
        COALESCE(tp.total_sales, 0) AS total_sales,
        COALESCE(pp.prev_period_sales, 0) AS prev_period_sales
    FROM weeks_with_offsets wwo
    LEFT JOIN this_period tp ON tp.week_start = wwo.week_start
    LEFT JOIN prev_weeks pw ON wwo.week_offset = pw.week_offset
    LEFT JOIN prev_period pp ON pw.prev_week_start = pp.week_start
    ORDER BY wwo.week_start;
END;
$$ LANGUAGE plpgsql; 