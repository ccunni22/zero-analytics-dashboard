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
    interval_str TEXT;
    trunc_str TEXT;
    n_periods INT;
    prev_start DATE;
    prev_end DATE;
    adj_start DATE;
    adj_end DATE;
    adj_prev_start DATE;
    adj_prev_end DATE;
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

    -- Align week start to Sunday if granularity is week or biweek
    IF granularity = 'week' OR granularity = 'biweek' THEN
        adj_start := date_trunc('week', start_date + interval '1 day') - interval '1 day';
        adj_end := date_trunc('week', end_date + interval '1 day') - interval '1 day';
    ELSE
        adj_start := date_trunc(trunc_str, start_date);
        adj_end := date_trunc(trunc_str, end_date);
    END IF;

    -- Calculate number of periods
    SELECT COUNT(*) INTO n_periods
    FROM generate_series(
        adj_start::date,
        adj_end::date,
        interval_str::interval
    );

    -- Calculate previous period range
    prev_end := adj_start - interval '1 day';
    prev_start := prev_end - (n_periods - 1) * interval_str::interval;

    -- Align previous period to Sunday if needed
    IF granularity = 'week' OR granularity = 'biweek' THEN
        adj_prev_start := date_trunc('week', prev_start + interval '1 day') - interval '1 day';
        adj_prev_end := date_trunc('week', prev_end + interval '1 day') - interval '1 day';
    ELSE
        adj_prev_start := date_trunc(trunc_str, prev_start);
        adj_prev_end := date_trunc(trunc_str, prev_end);
    END IF;

    RETURN QUERY
    WITH periods AS (
        SELECT
            generate_series(
                adj_start::date,
                adj_end::date,
                interval_str::interval
            ) AS period_start
    ),
    prev_periods AS (
        SELECT
            generate_series(
                adj_prev_start::date,
                adj_prev_end::date,
                interval_str::interval
            ) AS period_start
    ),
    periods_numbered AS (
        SELECT period_start, ROW_NUMBER() OVER (ORDER BY period_start) AS rn
        FROM periods
    ),
    prev_periods_numbered AS (
        SELECT period_start, ROW_NUMBER() OVER (ORDER BY period_start) AS rn
        FROM prev_periods
    ),
    this_period AS (
        SELECT
            CASE WHEN granularity = 'week' OR granularity = 'biweek'
                THEN (date_trunc('week', "Order Date" + interval '1 day') - interval '1 day')::date
                ELSE date_trunc(trunc_str, "Order Date")::date
            END AS period_start,
            SUM("Net Price") AS total_sales
        FROM "Zero CSV Data"
        WHERE "Order Date" BETWEEN start_date AND end_date
          AND (
            LOWER(category) = 'all'
            OR "Sales Category" = category
          )
        GROUP BY 1
    ),
    prev_period AS (
        SELECT
            CASE WHEN granularity = 'week' OR granularity = 'biweek'
                THEN (date_trunc('week', "Order Date" + interval '1 day') - interval '1 day')::date
                ELSE date_trunc(trunc_str, "Order Date")::date
            END AS period_start,
            SUM("Net Price") AS prev_period_sales
        FROM "Zero CSV Data"
        WHERE "Order Date" BETWEEN prev_start AND prev_end
          AND (
            LOWER(category) = 'all'
            OR "Sales Category" = category
          )
        GROUP BY 1
    )
    SELECT
        to_char(pn.period_start,
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
    FROM periods_numbered pn
    LEFT JOIN this_period tp ON tp.period_start = pn.period_start
    LEFT JOIN prev_periods_numbered ppn ON ppn.rn = pn.rn
    LEFT JOIN prev_period pp ON pp.period_start = ppn.period_start
    ORDER BY pn.period_start;
END;
$$ LANGUAGE plpgsql; 