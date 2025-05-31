from fastapi import FastAPI, Query, File, UploadFile, HTTPException, Depends, Request
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import csv
import io
import logging
from typing import Optional
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SQL function for sales trends
SALES_TRENDS_FUNCTION = """
CREATE OR REPLACE FUNCTION get_sales_trends(start_date date, end_date date)
RETURNS TABLE (
    date date,
    total_sales numeric,
    order_count bigint,
    avg_order_value numeric,
    prev_period_sales numeric,
    prev_period_order_count bigint,
    prev_period_avg_order_value numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT 
            DATE("Order Date") as date,
            SUM("Net Price") as total_sales,
            COUNT(DISTINCT "Order ID") as order_count,
            SUM("Net Price") / NULLIF(COUNT(DISTINCT "Order ID"), 0) as avg_order_value
        FROM "Zero CSV Data"
        WHERE DATE("Order Date") BETWEEN start_date AND end_date
        GROUP BY DATE("Order Date")
    ),
    previous_period AS (
        SELECT 
            DATE("Order Date") as date,
            SUM("Net Price") as total_sales,
            COUNT(DISTINCT "Order ID") as order_count,
            SUM("Net Price") / NULLIF(COUNT(DISTINCT "Order ID"), 0) as avg_order_value
        FROM "Zero CSV Data"
        WHERE DATE("Order Date") BETWEEN start_date - (end_date - start_date + 1) AND start_date - 1
        GROUP BY DATE("Order Date")
    ),
    date_series AS (
        SELECT generate_series(start_date, end_date, '1 day'::interval)::date as date
    )
    SELECT 
        ds.date,
        COALESCE(cp.total_sales, 0) as total_sales,
        COALESCE(cp.order_count, 0) as order_count,
        COALESCE(cp.avg_order_value, 0) as avg_order_value,
        COALESCE(pp.total_sales, 0) as prev_period_sales,
        COALESCE(pp.order_count, 0) as prev_period_order_count,
        COALESCE(pp.avg_order_value, 0) as prev_period_avg_order_value
    FROM date_series ds
    LEFT JOIN current_period cp ON cp.date = ds.date
    LEFT JOIN previous_period pp ON pp.date = ds.date - (end_date - start_date + 1)
    ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql;
"""

ITEM_ANALYTICS_FUNCTION = """
CREATE OR REPLACE FUNCTION get_item_analytics(start_date date, end_date date, item_limit integer)
RETURNS TABLE (
    item_name text,
    total_quantity bigint,
    total_sales numeric,
    order_count bigint,
    avg_order_value numeric,
    weekly_trend numeric,
    is_dead_stock boolean
) AS $$
BEGIN
    RETURN QUERY
    WITH item_stats AS (
        SELECT 
            "Menu Item" as item_name,
            SUM("Quantity") as total_quantity,
            SUM("Gross Price") as total_sales,
            COUNT(DISTINCT "Order ID") as order_count,
            SUM("Gross Price") / NULLIF(COUNT(DISTINCT "Order ID"), 0) as avg_order_value
        FROM "Zero CSV Data"
        WHERE DATE("Order Date") BETWEEN start_date AND end_date
        GROUP BY "Menu Item"
    ),
    weekly_trends AS (
        SELECT 
            "Menu Item" as item_name,
            SUM(CASE 
                WHEN DATE("Order Date") >= end_date - interval '7 days' 
                THEN "Quantity" ELSE 0 
            END) as last_week_quantity,
            SUM(CASE 
                WHEN DATE("Order Date") >= end_date - interval '14 days' 
                AND DATE("Order Date") < end_date - interval '7 days'
                THEN "Quantity" ELSE 0 
            END) as prev_week_quantity
        FROM "Zero CSV Data"
        WHERE DATE("Order Date") BETWEEN end_date - interval '14 days' AND end_date
        GROUP BY "Menu Item"
    )
    SELECT 
        is.item_name,
        is.total_quantity,
        is.total_sales,
        is.order_count,
        is.avg_order_value,
        CASE 
            WHEN wt.prev_week_quantity = 0 THEN NULL
            ELSE ROUND(((wt.last_week_quantity - wt.prev_week_quantity)::numeric / wt.prev_week_quantity * 100)::numeric, 1)
        END as weekly_trend,
        is.total_quantity < 5 as is_dead_stock
    FROM item_stats is
    LEFT JOIN weekly_trends wt ON wt.item_name = is.item_name
    ORDER BY is.total_quantity DESC
    LIMIT item_limit;
END;
$$ LANGUAGE plpgsql;
"""

HEATMAP_FUNCTION = """
CREATE OR REPLACE FUNCTION get_sales_heatmap(start_date date, end_date date)
RETURNS TABLE (
    day_of_week integer,
    hour_of_day integer,
    total_quantity bigint,
    total_orders bigint,
    avg_order_value numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH hourly_stats AS (
        SELECT 
            EXTRACT(DOW FROM "Order Date")::integer as day_of_week,
            EXTRACT(HOUR FROM "Order Date")::integer as hour_of_day,
            SUM("Quantity") as total_quantity,
            COUNT(DISTINCT "Order ID") as total_orders,
            SUM("Net Price") / NULLIF(COUNT(DISTINCT "Order ID"), 0) as avg_order_value
        FROM "Zero CSV Data"
        WHERE DATE("Order Date") BETWEEN start_date AND end_date
        GROUP BY 
            EXTRACT(DOW FROM "Order Date"),
            EXTRACT(HOUR FROM "Order Date")
    )
    SELECT 
        COALESCE(hs.day_of_week, d) as day_of_week,
        COALESCE(hs.hour_of_day, h) as hour_of_day,
        COALESCE(hs.total_quantity, 0) as total_quantity,
        COALESCE(hs.total_orders, 0) as total_orders,
        COALESCE(hs.avg_order_value, 0) as avg_order_value
    FROM generate_series(0, 6) d
    CROSS JOIN generate_series(0, 23) h
    LEFT JOIN hourly_stats hs ON hs.day_of_week = d AND hs.hour_of_day = h
    ORDER BY d, h;
END;
$$ LANGUAGE plpgsql;
"""

load_dotenv()  # Loads variables from .env

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# --- Robust CSV Column Normalization ---
COLUMN_ALIASES = {
    "Order ID": ["Order ID", "OrderID", "order id", "order_id", "Order-Id", "Order Id", "Orderid"],
    "Order Date": ["Order Date", "order date", "order_date", "OrderDate"],
    "Menu Item": ["Menu Item", "menu item", "MenuItem", "menu_item"],
    "Menu Group": ["Menu Group", "menu group", "MenuGroup", "menu_group"],
    "Menu Subgroup": ["Menu Subgroup", "menu subgroup", "MenuSubgroup", "menu_subgroup"],
    "Sales Category": ["Sales Category", "sales category", "SalesCategory", "sales_category"],
    "Gross Price": ["Gross Price", "gross price", "GrossPrice", "gross_price"],
    "Discount": ["Discount", "discount"],
    "Net Price": ["Net Price", "net price", "NetPrice", "net_price"],
    "Quantity": ["Quantity", "quantity"],
    "Tax": ["Tax", "tax"],
    "Void?": ["Void?", "void?", "Void", "void"],
}
REQUIRED_CANONICAL = set(COLUMN_ALIASES.keys())

def normalize_headers(headers):
    normalized = {}
    for h in headers:
        clean = h.strip().replace("-", " ").replace("_", " ").title()
        for canonical, aliases in COLUMN_ALIASES.items():
            if clean in [a.title() for a in aliases]:
                normalized[h] = canonical
                break
    return normalized

def normalize_row(row, header_map):
    normalized = {}
    for k, v in row.items():
        canonical = header_map.get(k, k)
        normalized[canonical] = v
    # Optionally, copy over any other columns as-is
    for k, v in row.items():
        if k not in normalized:
            normalized[k] = v
    return normalized

@app.get("/")
def read_root():
    return {"message": "Zero API is running!"}

@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": str(e)}
        )

# Add date validation
def validate_date_range(start_date: str, end_date: str) -> tuple[datetime, datetime]:
    try:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
        
        if end_dt < start_dt:
            raise HTTPException(
                status_code=400,
                detail="End date must be after start date"
            )
        
        # Limit date range to 1 year
        if (end_dt - start_dt).days > 365:
            raise HTTPException(
                status_code=400,
                detail="Date range cannot exceed 1 year"
            )
            
        return start_dt, end_dt
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
        )

# Update endpoints with new error handling
@app.get("/sales")
async def get_sales(request: Request, start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None), limit: int = Query(1000, ge=1, le=10000), offset: int = Query(0, ge=0)):
    logger.info(f"Received /sales request: start_date={start_date}, end_date={end_date}, limit={limit}, offset={offset}")
    try:
        query = supabase.table("Zero CSV Data").select("*", count="exact").limit(limit).offset(offset)
        if start_date and end_date:
            start_dt, end_dt = validate_date_range(start_date, end_date)
            query = query.gte("Order Date", start_dt.strftime("%Y-%m-%dT00:00:00+00:00"))
            query = query.lte("Order Date", end_dt.strftime("%Y-%m-%dT23:59:59+00:00"))
        response = query.execute()
        if not response.data:
            return {
                "data": [],
                "total": 0,
                "limit": limit,
                "offset": offset,
                "message": "No data found for the specified criteria"
            }
        return {
            "data": response.data,
            "total": getattr(response, "count", len(response.data)),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error in /sales endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales/heatmap")
async def sales_heatmap(request: Request, start_date: str = Query(...), end_date: str = Query(...)):
    try:
        start_dt, end_dt = validate_date_range(start_date, end_date)
        response = supabase.rpc(
            "get_sales_heatmap",
            {"start_date": start_date, "end_date": end_date}
        ).execute()
        
        if not response.data:
            return {"data": [], "message": "No heatmap data available for the specified date range"}
        return {"data": response.data}
    except Exception as e:
        logger.error(f"Error in /sales/heatmap endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales/items")
async def get_item_analytics(request: Request, start_date: str = Query(...), end_date: str = Query(...), limit: int = Query(10, ge=1, le=50)):
    try:
        start, end = validate_date_range(start_date, end_date)
        response = supabase.rpc(
            'get_item_analytics',
            {
                'start_date': start.isoformat(),
                'end_date': end.isoformat(),
                'item_limit': limit
            }
        ).execute()
        items = response.data if response.data else []
        # Sort items by total_quantity descending for top, ascending for bottom
        top_items = items[:limit]
        bottom_items = items[-limit:][::-1] if len(items) >= limit else items[::-1]
        total_items = len(items)
        date_range = {"start": start.isoformat(), "end": end.isoformat()}
        return {
            "top_items": top_items,
            "bottom_items": bottom_items,
            "total_items": total_items,
            "date_range": date_range
        }
    except Exception as e:
        logger.error(f"Error in get_item_analytics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales/trends")
async def sales_trends(request: Request, start_date: str = Query(...), end_date: str = Query(...)):
    try:
        start, end = validate_date_range(start_date, end_date)
        response = supabase.rpc(
            'get_sales_trends',
            {'start_date': start.isoformat(), 'end_date': end.isoformat()}
        ).execute()
        
        if not response.data:
            return {"this_period": [], "prev_period": []}
            
        # Transform the data into the format expected by the frontend
        this_period = []
        prev_period = []
        for row in response.data:
            this_period.append({
                "date": row["date"],
                "total_sales": row["total_sales"],
                "order_count": row["order_count"],
                "avg_order_value": row["avg_order_value"]
            })
            prev_period.append({
                "date": row["date"],
                "total_sales": row["prev_period_sales"],
                "order_count": row["prev_period_order_count"],
                "avg_order_value": row["prev_period_avg_order_value"]
            })
        
        return {"this_period": this_period, "prev_period": prev_period}
    except Exception as e:
        logger.error(f"Error in sales_trends: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-csv")
async def upload_csv(request: Request, file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )
    try:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds 10MB limit"
            )
        decoded = contents.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        header_map = normalize_headers(reader.fieldnames)
        found_canonicals = set(header_map.values())
        missing = REQUIRED_CANONICAL - found_canonicals
        if missing:
            raise HTTPException(status_code=400, detail=f"CSV missing required columns: {missing}. Found: {reader.fieldnames}")
        unknown = set(reader.fieldnames) - set(header_map.keys())
        if unknown:
            logging.warning(f"Unknown columns in CSV: {unknown}")
        rows = [normalize_row(row, header_map) for row in reader]
        existing_ids = set()
        if rows:
            order_ids = [row["Order ID"] for row in rows if row.get("Order ID")]
            if order_ids:
                id_chunks = [order_ids[i:i+500] for i in range(0, len(order_ids), 500)]
                for chunk in id_chunks:
                    resp = supabase.table("Zero CSV Data").select('"Order ID"').in_('"Order ID"', chunk).execute()
                    if hasattr(resp, 'data') and resp.data:
                        existing_ids.update([r["Order ID"] for r in resp.data if r.get("Order ID")])
        new_rows = [row for row in rows if row.get("Order ID") not in existing_ids]
        skipped = len(rows) - len(new_rows)
        batch_size = 500
        for i in range(0, len(new_rows), batch_size):
            batch = new_rows[i:i+batch_size]
            if batch:
                print("Batch keys:", batch[0].keys())
            for row in batch:
                for col in ["Gross Price", "Discount", "Net Price", "Tax"]:
                    try:
                        row[col] = float(row[col]) if row[col] not in (None, "") else 0.0
                    except Exception:
                        row[col] = 0.0
                for col in ["Quantity"]:
                    try:
                        row[col] = int(float(row[col])) if row[col] not in (None, "") else 0
                    except Exception:
                        row[col] = 0
            resp = supabase.table("Zero CSV Data").insert(batch).execute()
            if getattr(resp, 'status_code', 200) >= 400:
                raise HTTPException(status_code=500, detail=f"Supabase insert error: {getattr(resp, 'data', str(resp))}")
        return {"message": f"Uploaded {len(new_rows)} new rows. Skipped {skipped} duplicate orders."}
    except Exception as e:
        logger.error(f"Error in /upload-csv endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales/summary")
async def get_sales_summary(request: Request, start_date: str = Query(...), end_date: str = Query(...)):
    try:
        start, end = validate_date_range(start_date, end_date)
        response = supabase.rpc(
            'get_sales_summary',
            {
                'start_date': start.isoformat(),
                'end_date': end.isoformat()
            }
        ).execute()
        
        if not response.data:
            return {}
            
        return response.data[0] if response.data else {}
    except Exception as e:
        logger.error(f"Error in get_sales_summary: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Add new endpoint for CSV export
@app.get("/sales/export")
async def export_sales(
    request: Request,
    start_date: str = Query(...),
    end_date: str = Query(...),
    format: str = Query("csv", regex="^(csv|json)$")
):
    try:
        start_dt, end_dt = validate_date_range(start_date, end_date)
        response = supabase.table("Zero CSV Data").select("*").gte(
            "Order Date", start_dt.strftime("%Y-%m-%dT00:00:00+00:00")
        ).lte(
            "Order Date", end_dt.strftime("%Y-%m-%dT23:59:59+00:00")
        ).execute()
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="No data found for the specified date range"
            )
        if format == "json":
            return {"data": response.data}
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=response.data[0].keys())
        writer.writeheader()
        writer.writerows(response.data)
        return {
            "content": output.getvalue(),
            "filename": f"sales_export_{start_date}_to_{end_date}.csv",
            "content_type": "text/csv"
        }
    except Exception as e:
        logger.error(f"Error in /sales/export endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Ensure this is present and correct:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
