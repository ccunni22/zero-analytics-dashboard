CREATE OR REPLACE FUNCTION get_sales_heatmap_by_date(
    start_date date,
    end_date date,
    category text DEFAULT 'ALL'
)
RETURNS TABLE (
    date date,
    hour_of_day integer,
    total_sales numeric
) AS $$
BEGIN
    -- Log input parameters
    RAISE NOTICE 'Getting sales heatmap data for date range: % to %, category: %', start_date, end_date, category;
    
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            start_date::timestamp,
            end_date::timestamp,
            '1 day'::interval
        )::date AS date
    ),
    hour_series AS (
        SELECT generate_series(0, 23) AS hour_of_day
    ),
    date_hour_series AS (
        SELECT 
            d.date,
            h.hour_of_day
        FROM date_series d
        CROSS JOIN hour_series h
    ),
    sales_data AS (
        SELECT 
            DATE_TRUNC('day', "Date")::date AS date,
            EXTRACT(HOUR FROM "Date")::integer AS hour_of_day,
            SUM("Gross Price") AS total_sales
        FROM sales
        WHERE 
            DATE_TRUNC('day', "Date")::date BETWEEN start_date AND end_date
            AND (category = 'ALL' OR "Category" = category)
        GROUP BY 
            DATE_TRUNC('day', "Date")::date,
            EXTRACT(HOUR FROM "Date")::integer
    )
    SELECT 
        dhs.date,
        dhs.hour_of_day,
        COALESCE(sd.total_sales, 0) AS total_sales
    FROM date_hour_series dhs
    LEFT JOIN sales_data sd ON 
        dhs.date = sd.date AND 
        dhs.hour_of_day = sd.hour_of_day
    ORDER BY 
        dhs.date,
        dhs.hour_of_day;
        
    -- Log number of rows returned
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE 'Returned % rows', row_count;
END;
$$ LANGUAGE plpgsql; 