CREATE OR REPLACE FUNCTION get_sales_trends(
    start_date DATE,
    end_date DATE,
    category TEXT,
    granularity TEXT
)
RETURNS TABLE (
    period TEXT,
    total_sales NUMERIC,
    prev_period_sales NUMERIC
)
AS $$
DECLARE
    prev_start DATE;
    prev_end DATE;
    interval_str TEXT;
    trunc_str TEXT;
BEGIN
    -- Determine interval and truncation based on granularity
    IF granularity = 'day' THEN
        interval_str := '1 day';
        trunc_str := 'day';
    ELSIF granularity = 'week' THEN
        interval_str := '1 week';
        trunc_str := 'week';
    ELSIF granularity = 'biweek' THEN
        interval_str := '2 week';
        trunc_str := 'week';
    ELSIF granularity = 'month' THEN
        interval_str := '1 month';
        trunc_str := 'month';
    ELSIF granularity = 'quarter' THEN
        interval_str := '3 month';
        trunc_str := 'quarter';
    ELSE
        interval_str := '1 week';
        trunc_str := 'week';
    END IF;

    -- Calculate previous period range
    prev_start := date_trunc(trunc_str, start_date) - (date_trunc(trunc_str, end_date) - date_trunc(trunc_str, start_date)) - INTERVAL '1 ' || trunc_str;
    prev_end := date_trunc(trunc_str, start_date) - INTERVAL '1 ' || trunc_str;

    RETURN QUERY
    WITH periods AS (
        SELECT generate_series(
            date_trunc(trunc_str, start_date)::date,
            date_trunc(trunc_str, end_date)::date,
            interval_str::interval
        ) AS period_start
    ),
    prev_periods AS (
        SELECT generate_series(
            prev_start::date,
            prev_end::date,
            interval_str::interval
        ) AS period_start
    ),
    this_period AS (
        SELECT 
            date_trunc(trunc_str, "Order Date")::date AS period_start,
            SUM("Net Price") AS total_sales
        FROM "Zero CSV Data"
        WHERE "Order Date" BETWEEN start_date AND end_date
          AND (
            LOWER(category) = 'all'
            OR "Sales Category" = category
          )
        GROUP BY date_trunc(trunc_str, "Order Date")
    ),
    prev_period AS (
        SELECT 
            date_trunc(trunc_str, "Order Date")::date AS period_start,
            SUM("Net Price") AS prev_period_sales
        FROM "Zero CSV Data"
        WHERE "Order Date" BETWEEN prev_start AND prev_end
          AND (
            LOWER(category) = 'all'
            OR "Sales Category" = category
          )
        GROUP BY date_trunc(trunc_str, "Order Date")
    )
    SELECT 
        to_char(p.period_start, 
            CASE 
                WHEN granularity = 'day' THEN 'YYYY-MM-DD'
                WHEN granularity = 'week' THEN 'YYYY-MM-DD'
                WHEN granularity = 'biweek' THEN 'YYYY-MM-DD'
                WHEN granularity = 'month' THEN 'YYYY-MM'
                WHEN granularity = 'quarter' THEN 'YYYY-"Q"Q'
                ELSE 'YYYY-MM-DD'
            END
        ) AS period,
        COALESCE(tp.total_sales, 0) AS total_sales,
        COALESCE(pp.prev_period_sales, 0) AS prev_period_sales
    FROM periods p
    LEFT JOIN this_period tp ON tp.period_start = p.period_start
    LEFT JOIN prev_periods ppd ON p.period_start - date_trunc(trunc_str, start_date) = ppd.period_start - prev_start
    LEFT JOIN prev_period pp ON pp.period_start = ppd.period_start
    ORDER BY p.period_start;
END;
$$ LANGUAGE plpgsql; 