CREATE OR REPLACE FUNCTION get_sales_heatmap_by_date(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    date DATE,
    hour_of_day INTEGER,
    total_quantity BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH date_hour_series AS (
        SELECT 
            d::date AS date, 
            h AS hour_of_day
        FROM generate_series(start_date, end_date, '1 day') d
        CROSS JOIN generate_series(0, 23) h
    ),
    sales_data AS (
        SELECT 
            DATE("Order Date") AS date,
            EXTRACT(HOUR FROM "Order Date")::integer AS hour_of_day,
            SUM("Quantity") AS total_quantity
        FROM "Zero CSV Data"
        WHERE DATE("Order Date") BETWEEN start_date AND end_date
        GROUP BY DATE("Order Date"), EXTRACT(HOUR FROM "Order Date")
    )
    SELECT 
        dhs.date,
        dhs.hour_of_day,
        COALESCE(sd.total_quantity, 0) AS total_quantity
    FROM date_hour_series dhs
    LEFT JOIN sales_data sd
        ON dhs.date = sd.date AND dhs.hour_of_day = sd.hour_of_day
    ORDER BY dhs.date, dhs.hour_of_day;
END;
$$ LANGUAGE plpgsql; 