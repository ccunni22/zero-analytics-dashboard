-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_sales_heatmap_by_date(DATE, DATE, TEXT);

-- Create the function
CREATE OR REPLACE FUNCTION get_sales_heatmap_by_date(
    start_date DATE,
    end_date DATE,
    category TEXT DEFAULT 'ALL'
)
RETURNS TABLE (
    date DATE,
    hour_of_day INTEGER,
    total_sales NUMERIC,
    day_of_week INTEGER
) AS $$
BEGIN
    -- Log the input parameters
    RAISE NOTICE 'Input parameters - start_date: %, end_date: %, category: %', start_date, end_date, category;
    
    -- Log the count of records in the date range
    RAISE NOTICE 'Number of records in date range: %', 
        (SELECT COUNT(*) FROM "Zero CSV Data" 
         WHERE DATE("Order Date") BETWEEN start_date AND end_date
         AND (category = 'ALL' OR "Sales Category" = category));
    
    -- Log the total sales in the date range
    RAISE NOTICE 'Total sales in date range: %', 
        (SELECT SUM("Gross Price") FROM "Zero CSV Data" 
         WHERE DATE("Order Date") BETWEEN start_date AND end_date
         AND (category = 'ALL' OR "Sales Category" = category));
    
    RETURN QUERY
    WITH date_hour_series AS (
        SELECT 
            d::date AS date, 
            h AS hour_of_day,
            EXTRACT(DOW FROM d)::integer AS day_of_week
        FROM generate_series(start_date, end_date, '1 day') d
        CROSS JOIN generate_series(0, 23) h
    ),
    sales_data AS (
        SELECT 
            DATE("Order Date") AS date,
            EXTRACT(HOUR FROM "Order Date")::integer AS hour_of_day,
            EXTRACT(DOW FROM "Order Date")::integer AS day_of_week,
            SUM("Gross Price") AS total_sales
        FROM "Zero CSV Data"
        WHERE DATE("Order Date") BETWEEN start_date AND end_date
        AND (category = 'ALL' OR "Sales Category" = category)
        GROUP BY DATE("Order Date"), EXTRACT(HOUR FROM "Order Date"), EXTRACT(DOW FROM "Order Date")
    )
    SELECT 
        dhs.date,
        dhs.hour_of_day,
        COALESCE(sd.total_sales, 0) AS total_sales,
        dhs.day_of_week
    FROM date_hour_series dhs
    LEFT JOIN sales_data sd
        ON dhs.date = sd.date AND dhs.hour_of_day = sd.hour_of_day
    ORDER BY dhs.date, dhs.hour_of_day;
END;
$$ LANGUAGE plpgsql; 