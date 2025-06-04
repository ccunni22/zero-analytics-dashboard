from fastapi import FastAPI, Query, File, UploadFile, HTTPException, Depends, Request, Form
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import csv
import io
import logging
from typing import Optional, Dict, List, Set, Tuple
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
import json
from difflib import SequenceMatcher
import re
from dateutil.parser import parse as parse_date
from dateutil.relativedelta import relativedelta
import calendar
import subprocess
import signal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cleanup_processes():
    """Clean up any existing processes on ports 5173 and 8000"""
    try:
        # Kill processes on port 5173 (Vite)
        subprocess.run(['lsof', '-ti', ':5173'], capture_output=True, text=True)
        subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
        
        # Kill processes on port 8000 (FastAPI)
        subprocess.run(['lsof', '-ti', ':8000'], capture_output=True, text=True)
        subprocess.run(['pkill', '-f', 'uvicorn'], capture_output=True)
        
        logger.info("Successfully cleaned up existing processes")
    except Exception as e:
        logger.warning(f"Error during cleanup: {str(e)}")

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
    is_dead_stock boolean,
    "Sales Category" text
) AS $$
BEGIN
    RETURN QUERY
    WITH item_stats AS (
        SELECT 
            "Menu Item" as item_name,
            SUM("Quantity") as total_quantity,
            SUM("Gross Price") as total_sales,
            COUNT(DISTINCT "Order ID") as order_count,
            SUM("Gross Price") / NULLIF(COUNT(DISTINCT "Order ID"), 0) as avg_order_value,
            "Sales Category"
        FROM "Zero CSV Data"
        WHERE DATE("Order Date") BETWEEN start_date AND end_date
        GROUP BY "Menu Item", "Sales Category"
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
        is.total_quantity < 5 as is_dead_stock,
        is."Sales Category"
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

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing required environment variables: SUPABASE_URL and SUPABASE_KEY must be set")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    # Test the connection
    supabase.table("Zero CSV Data").select("count", count="exact").limit(1).execute()
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    raise

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    """Clean up processes on startup"""
    cleanup_processes()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up processes on shutdown"""
    cleanup_processes()

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "https://zero-analytics-dashboard.vercel.app")
# Explicitly add deployed Vercel URLs for CORS (wildcards are not supported by browsers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4300",
        "http://127.0.0.1:4300",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://localhost:5180",
        frontend_url,  # from env, for flexibility
        "https://zero-analytics-dashboard.vercel.app",  # main production
        "https://zero-analytics-dashboard-ipxmuc34s.vercel.app",  # your current deployment
        "https://zero-analytics-dashboard-llonzlava.vercel.app",  # current preview deployment
        # Add any other preview/production URLs as needed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

# Enhanced column aliases with more variations and common POS system formats
COLUMN_ALIASES = {
    "Order ID": [
        "Order ID", "OrderID", "order id", "order_id", "Order-Id", "Order Id", "Orderid",
        "Transaction ID", "TransactionID", "transaction_id", "Transaction-Id",
        "Receipt ID", "ReceiptID", "receipt_id", "Receipt-Id",
        "Check ID", "CheckID", "check_id", "Check-Id"
    ],
    "Order Date": [
        "Order Date", "order date", "order_date", "OrderDate",
        "Transaction Date", "TransactionDate", "transaction_date",
        "Receipt Date", "ReceiptDate", "receipt_date",
        "Check Date", "CheckDate", "check_date",
        "Date", "date"
    ],
    "Menu Item": [
        "Menu Item", "menu item", "MenuItem", "menu_item",
        "Item", "item", "Item Name", "ItemName", "item_name",
        "Product", "product", "Product Name", "ProductName", "product_name",
        "Description", "description", "Item Description", "ItemDescription"
    ],
    "Menu Group": [
        "Menu Group", "menu group", "MenuGroup", "menu_group",
        "Category", "category", "Item Category", "ItemCategory",
        "Department", "department", "Item Department", "ItemDepartment",
        "Group", "group"
    ],
    "Menu Subgroup": [
        "Menu Subgroup", "menu subgroup", "MenuSubgroup", "menu_subgroup",
        "Subcategory", "subcategory", "Item Subcategory", "ItemSubcategory",
        "Subgroup", "subgroup", "Sub Group", "SubGroup"
    ],
    "Sales Category": [
        "Sales Category", "sales category", "SalesCategory", "sales_category",
        "Type", "type", "Item Type", "ItemType",
        "Classification", "classification"
    ],
    "Gross Price": [
        "Gross Price", "gross price", "GrossPrice", "gross_price",
        "Price", "price", "Item Price", "ItemPrice",
        "Regular Price", "RegularPrice", "regular_price",
        "List Price", "ListPrice", "list_price",
        "Gross Sales Price", "gross sales price", "gross_sales_price"
    ],
    "Discount": [
        "Discount", "discount", "Discount Amount", "DiscountAmount",
        "Discount Price", "DiscountPrice", "discount_price",
        "Discount Value", "DiscountValue", "discount_value"
    ],
    "Net Price": [
        "Net Price", "net price", "NetPrice", "net_price",
        "Final Price", "FinalPrice", "final_price",
        "Total Price", "TotalPrice", "total_price",
        "Amount", "amount", "Total Amount", "TotalAmount",
        "net sales price", "net_sales_price", "Net Sales Price", "Net sales price"
    ],
    "Quantity": [
        "Quantity", "quantity", "Qty", "qty",
        "Count", "count", "Item Count", "ItemCount",
        "Number", "number", "Item Number", "ItemNumber"
    ],
    "Tax": [
        "Tax", "tax", "Tax Amount", "TaxAmount",
        "Tax Value", "TaxValue", "tax_value",
        "Sales Tax", "SalesTax", "sales_tax",
        "transaction tax", "Transaction Tax"
    ],
    "Void?": [
        "Void?", "void?", "Void", "void",
        "Voided", "voided", "Is Void", "IsVoid",
        "Void Status", "VoidStatus", "void_status"
    ]
}

# Required columns for the system to function
REQUIRED_CANONICAL = {"Order ID", "Order Date", "Menu Item", "Net Price"}

# Optional columns that enhance functionality
OPTIONAL_CANONICAL = {"Menu Group", "Menu Subgroup", "Sales Category", "Gross Price", "Discount", "Quantity", "Tax", "Void?"}

# Lower the default similarity threshold and add a secondary partial match check
DEFAULT_SIMILARITY_THRESHOLD = 0.7

def clean_column_name(name: str) -> str:
    """Clean and standardize a column name for comparison."""
    # Remove special characters and convert to lowercase
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', name)
    # Remove extra spaces and convert to title case
    cleaned = ' '.join(cleaned.split()).title()
    return cleaned

def get_similarity_score(str1: str, str2: str) -> float:
    """Calculate similarity score between two strings."""
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

def find_best_match(column_name: str, aliases: Dict[str, List[str]]) -> Tuple[Optional[str], float]:
    cleaned_name = clean_column_name(column_name)
    best_match = None
    best_score = 0.0
    for canonical, alias_list in aliases.items():
        for alias in alias_list:
            score = get_similarity_score(cleaned_name, alias)
            if score > best_score:
                best_score = score
                best_match = canonical
    # If no good fuzzy match, try partial match
    if best_score < DEFAULT_SIMILARITY_THRESHOLD:
        for canonical, alias_list in aliases.items():
            for alias in alias_list:
                if cleaned_name in clean_column_name(alias) or clean_column_name(alias) in cleaned_name:
                    return canonical, 0.7  # treat as a match with threshold
    return best_match, best_score

def normalize_headers(headers: List[str], similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD) -> Dict[str, str]:
    normalized = {}
    unmatched = []
    for header in headers:
        best_match, score = find_best_match(header, COLUMN_ALIASES)
        if best_match and score >= similarity_threshold:
            normalized[header] = best_match
        else:
            unmatched.append(header)
    if unmatched:
        logging.warning(f"Unmatched columns in CSV: {unmatched}")
    return normalized

def validate_required_columns(found_canonicals: Set[str]) -> Tuple[bool, Set[str]]:
    """
    Validate that all required columns are present.
    
    Returns:
        Tuple of (is_valid, missing_columns)
    """
    missing = REQUIRED_CANONICAL - found_canonicals
    return len(missing) == 0, missing

def normalize_row(row: Dict[str, str], header_map: Dict[str, str]) -> Dict[str, str]:
    normalized = {}
    for original_col, value in row.items():
        if original_col in header_map:
            canonical_col = header_map[original_col]
            if value in ("", "N/A", "null", None):
                value = None
            if canonical_col in ["Order Date", "Transaction Date"]:
                if value is not None:
                    try:
                        value = parse_date(value)
                        if isinstance(value, datetime):
                            value = value.isoformat()
                    except Exception:
                        value = None
            if canonical_col in ["Gross Price", "Discount", "Net Price", "Tax"]:
                try:
                    value = float(value) if value is not None else 0.0
                except (ValueError, TypeError):
                    value = 0.0
            elif canonical_col == "Quantity":
                try:
                    value = int(float(value)) if value is not None else 0
                except (ValueError, TypeError):
                    value = 0
            elif canonical_col == "Void?":
                value = str(value).lower() in ["true", "yes", "1", "y", "void"]
            normalized[canonical_col] = value
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
        today = datetime.now().date()
        if end_dt < start_dt:
            raise HTTPException(
                status_code=400,
                detail="End date must be after start date"
            )
        # Prevent future dates
        if end_dt.date() > today:
            raise HTTPException(
                status_code=400,
                detail="End date cannot be in the future"
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
        query = supabase.table("Zero CSV Data").select("*", count="exact").range(offset, offset + limit - 1)
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
def get_sales_heatmap(
    start_date: str,
    end_date: str
):
    try:
        # Validate date range
        start, end = validate_date_range(start_date, end_date)
        
        # Call Supabase RPC function
        params = {
            'start_date': start.date().isoformat(),
            'end_date': end.date().isoformat()
        }
        
        response = supabase.rpc('get_sales_heatmap', params).execute()
        
        # Transform data for frontend
        transformed_data = []
        for row in response.data:
            transformed_row = {
                "date": row["date"],  # Date is already a string from Supabase
                "day_of_week": row["day_of_week"],
                "hour_of_day": row["hour_of_day"],
                "total_sales": float(row["total_sales"])
            }
            transformed_data.append(transformed_row)
            
        # Log transformed data
        logger.info(f"Transformed data for frontend: {transformed_data[:3]}")  # Log first 3 items
        logger.info(f"Total number of data points: {len(transformed_data)}")
        
        return {"data": transformed_data}
        
    except Exception as e:
        logger.error(f"Error in /sales/heatmap endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales/items")
def get_item_analytics(
    start_date: str = Query(...),
    end_date: str = Query(...),
    limit: int = Query(5, ge=1, le=50)
):
    params = {
        'start_date': start_date,
        'end_date': end_date,
        'item_limit': limit
    }
    try:
        response = supabase.rpc('get_item_analytics', params).execute()
        data = response.data
        logger.debug(f"Raw response data type: {type(data)}")
        logger.debug(f"Raw response data: {data}")

        # If data is a dict with 'food' and 'alcohol', just return it
        if isinstance(data, dict) and "food" in data and "alcohol" in data:
            return {
                "date_range": {
                    "start": start_date,
                    "end": end_date
                },
                **data
            }

        # (Optional) fallback for legacy list format
        if isinstance(data, list):
            # ... old list-processing logic could go here if needed ...
            logger.warning("Received list data from get_item_analytics, but expected dict. Returning empty.")

        # If data is not in expected format, return empty
        logger.warning(f"Unexpected data format from get_item_analytics: {data}")
        return {
            "date_range": {
                "start": start_date,
                "end": end_date
            },
            "food": {"top_items": [], "bottom_items": []},
            "alcohol": {"top_items": [], "bottom_items": []},
            "error": "No item analytics data available."
        }
    except Exception as e:
        logger.error(f"Error in /sales/items endpoint: {str(e)}", exc_info=True)
        return {
            "date_range": {
                "start": start_date,
                "end": end_date
            },
            "food": {"top_items": [], "bottom_items": []},
            "alcohol": {"top_items": [], "bottom_items": []},
            "error": str(e)
        }

@app.get("/sales/trends")
async def sales_trends(
    request: Request,
    start_date: str = Query(...),
    end_date: str = Query(...),
    category: str = Query("ALL"),
    granularity: str = Query("week", regex="^(day|week|biweek|month|quarter)$")
):
    try:
        start, end = validate_date_range(start_date, end_date)
        params = {
            'start_date': start.date().isoformat(),
            'end_date': end.date().isoformat(),
            'category': category,
            'granularity': granularity
        }
        print("DEBUG: Params sent to get_sales_trends:", params)
        response = supabase.rpc('get_sales_trends', params).execute()
        print("DEBUG: Raw response from Supabase:", response.data)
        
        if not response.data:
            print("DEBUG: No data returned from Supabase")
            return {"this_period": [], "prev_period": []}
            
        # Transform the data into the format expected by the frontend
        this_period = []
        prev_period = []
        for row in response.data:
            this_period_point = {
                "period": row.get("period"),
                "total_sales": float(row.get("total_sales", 0))
            }
            prev_period_point = {
                "period": row.get("period"),
                "total_sales": float(row.get("prev_period_sales", 0))
            }
            this_period.append(this_period_point)
            prev_period.append(prev_period_point)
            
        result = {"this_period": this_period, "prev_period": prev_period}
        print("DEBUG: Transformed data for frontend:", result)
        return result
    except Exception as e:
        logger.error(f"Error in sales_trends: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-csv")
async def upload_csv(
    request: Request,
    file: UploadFile = File(...),
    similarity_threshold: float = Query(0.8, ge=0.0, le=1.0)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )
    
    try:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=400,
                detail="File size exceeds 10MB limit"
            )
        
        decoded = contents.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        
        # Normalize headers with fuzzy matching
        header_map = normalize_headers(reader.fieldnames, similarity_threshold)
        found_canonicals = set(header_map.values())
        
        # Validate required columns
        is_valid, missing = validate_required_columns(found_canonicals)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing required columns: {missing}. Found: {reader.fieldnames}"
            )
        
        # Process rows
        rows = [normalize_row(row, header_map) for row in reader]
        
        # Check for duplicate orders
        existing_ids = set()
        if rows:
            order_ids = [row["Order ID"] for row in rows if row.get("Order ID")]
            if order_ids:
                id_chunks = [order_ids[i:i+500] for i in range(0, len(order_ids), 500)]
                for chunk in id_chunks:
                    resp = supabase.table("Zero CSV Data").select('"Order ID"').in_('"Order ID"', chunk).execute()
                    if hasattr(resp, 'data') and resp.data:
                        existing_ids.update([r["Order ID"] for r in resp.data if r.get("Order ID")])
        
        # Filter out duplicate orders
        new_rows = [row for row in rows if row.get("Order ID") not in existing_ids]
        skipped = len(rows) - len(new_rows)
        
        # Insert new rows in batches
        batch_size = 500
        for i in range(0, len(new_rows), batch_size):
            batch = new_rows[i:i+batch_size]
            if batch:
                resp = supabase.table("Zero CSV Data").insert(batch).execute()
                if getattr(resp, 'status_code', 200) >= 400:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Supabase insert error: {getattr(resp, 'data', str(resp))}"
                    )
        
        return {
            "message": f"Uploaded {len(new_rows)} new rows. Skipped {skipped} duplicate orders.",
            "column_mapping": header_map,
            "found_columns": list(found_canonicals),
            "missing_required": list(REQUIRED_CANONICAL - found_canonicals),
            "missing_optional": list(OPTIONAL_CANONICAL - found_canonicals)
        }
        
    except Exception as e:
        logger.error(f"Error in /upload-csv endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sales/summary")
async def get_sales_summary(request: Request, start_date: str = Query(...), end_date: str = Query(...)):
    try:
        start, end = validate_date_range(start_date, end_date)
        params_all = {
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'category': 'ALL'
        }
        params_food = {
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'category': 'Food'
        }
        params_alcohol = {
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'category': 'Alcohol'
        }
        total_res = supabase.rpc('get_sales_summary', params_all).execute()
        food_res = supabase.rpc('get_sales_summary', params_food).execute()
        alcohol_res = supabase.rpc('get_sales_summary', params_alcohol).execute()
        def safe_get(data):
            return data[0] if data and len(data) > 0 else {
                "total_sales": 0, "total_orders": 0, "average_order_value": 0, "gross_sales": 0, "total_items_sold": 0, "void_rate": 0
            }
        return {
            "total": safe_get(total_res.data),
            "food": safe_get(food_res.data),
            "alcohol": safe_get(alcohol_res.data)
        }
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

# Column mapping endpoints
@app.get("/column-mappings")
async def get_column_mappings():
    try:
        resp = supabase.table("Column Mappings").select("*").execute()
        return resp.data
    except Exception as e:
        logger.error(f"Error fetching column mappings: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/column-mappings")
async def create_column_mapping(
    mapping_name: str = Form(...),
    column_mapping: str = Form(...),
    similarity_threshold: float = Form(0.8),
    description: str = Form(None),
    is_default: bool = Form(False)
):
    try:
        # Parse the column mapping JSON
        mapping_data = json.loads(column_mapping)
        
        # If this is set as default, unset any existing defaults
        if is_default:
            supabase.table("Column Mappings").update({"is_default": False}).eq("is_default", True).execute()
        
        # Create the new mapping
        resp = supabase.table("Column Mappings").insert({
            "mapping_name": mapping_name,
            "column_mapping": mapping_data,
            "similarity_threshold": similarity_threshold,
            "description": description,
            "is_default": is_default
        }).execute()
        
        return resp.data[0]
    except Exception as e:
        logger.error(f"Error creating column mapping: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/column-mappings/{mapping_id}")
async def update_column_mapping(
    mapping_id: str,
    mapping_name: str = Form(None),
    column_mapping: str = Form(None),
    similarity_threshold: float = Form(None),
    description: str = Form(None),
    is_default: bool = Form(None)
):
    try:
        update_data = {}
        if mapping_name is not None:
            update_data["mapping_name"] = mapping_name
        if column_mapping is not None:
            update_data["column_mapping"] = json.loads(column_mapping)
        if similarity_threshold is not None:
            update_data["similarity_threshold"] = similarity_threshold
        if description is not None:
            update_data["description"] = description
        if is_default is not None:
            if is_default:
                # Unset any existing defaults
                supabase.table("Column Mappings").update({"is_default": False}).eq("is_default", True).execute()
            update_data["is_default"] = is_default
        
        resp = supabase.table("Column Mappings").update(update_data).eq("id", mapping_id).execute()
        return resp.data[0]
    except Exception as e:
        logger.error(f"Error updating column mapping: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/column-mappings/{mapping_id}")
async def delete_column_mapping(mapping_id: str):
    try:
        resp = supabase.table("Column Mappings").delete().eq("id", mapping_id).execute()
        return {"message": "Mapping deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting column mapping: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
