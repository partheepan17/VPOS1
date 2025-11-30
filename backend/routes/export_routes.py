"""
Export Routes
Handles sales report exports to PDF and Excel
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timedelta
import os
import io
import csv
from pymongo import MongoClient, DESCENDING

router = APIRouter(prefix="/api/export", tags=["export"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DATABASE_NAME', 'pos_system')
client = MongoClient(mongo_url)
db = client[db_name]

sales_col = db['sales']


@router.get("/sales/csv")
async def export_sales_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(default=1000, le=10000)
):
    """Export sales to CSV"""
    try:
        # Build query
        query = {"status": "completed"}
        
        if start_date and end_date:
            query["created_at"] = {
                "$gte": start_date,
                "$lte": end_date
            }
        
        # Fetch sales
        sales = list(sales_col.find(query, {"_id": 0})
                    .sort("created_at", DESCENDING)
                    .limit(limit))
        
        if not sales:
            raise HTTPException(status_code=404, detail="No sales found")
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            'Invoice Number', 'Date', 'Customer', 'Price Tier',
            'Subtotal', 'Discount', 'Tax', 'Total',
            'Payment Method', 'Items Count', 'Cashier'
        ])
        
        # Data rows
        for sale in sales:
            writer.writerow([
                sale.get('invoice_number', ''),
                sale.get('created_at', ''),
                sale.get('customer_name', 'Walk-in'),
                sale.get('price_tier', ''),
                sale.get('subtotal', 0),
                sale.get('total_discount', 0),
                sale.get('tax_amount', 0),
                sale.get('total', 0),
                ', '.join([p['method'] for p in sale.get('payments', [])]),
                len(sale.get('items', [])),
                sale.get('cashier_name', '')
            ])
        
        # Create response
        output.seek(0)
        
        filename = f"sales_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/sales/summary")
async def get_sales_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get sales summary for a date range"""
    try:
        # Build query
        query = {"status": "completed"}
        
        if start_date and end_date:
            query["created_at"] = {
                "$gte": start_date,
                "$lte": end_date
            }
        
        # Aggregate data
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": None,
                "total_sales": {"$sum": "$total"},
                "total_discount": {"$sum": "$total_discount"},
                "total_tax": {"$sum": "$tax_amount"},
                "invoice_count": {"$sum": 1},
                "avg_sale": {"$avg": "$total"}
            }}
        ]
        
        result = list(sales_col.aggregate(pipeline))
        
        if not result:
            return {
                "total_sales": 0,
                "total_discount": 0,
                "total_tax": 0,
                "invoice_count": 0,
                "avg_sale": 0,
                "start_date": start_date,
                "end_date": end_date
            }
        
        summary = result[0]
        summary['start_date'] = start_date
        summary['end_date'] = end_date
        
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary failed: {str(e)}")


@router.get("/products/csv")
async def export_products_csv():
    """Export products to CSV"""
    try:
        products = list(db['products'].find({}, {"_id": 0}))
        
        if not products:
            raise HTTPException(status_code=404, detail="No products found")
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            'SKU', 'Name (EN)', 'Name (SI)', 'Name (TA)', 
            'Category', 'Unit', 'Retail Price', 'Wholesale Price',
            'Stock', 'Reorder Level', 'Active'
        ])
        
        # Data rows
        for product in products:
            writer.writerow([
                product.get('sku', ''),
                product.get('name_en', ''),
                product.get('name_si', ''),
                product.get('name_ta', ''),
                product.get('category', ''),
                product.get('unit', ''),
                product.get('price_retail', 0),
                product.get('price_wholesale', 0),
                product.get('stock', 0),
                product.get('reorder_level', 0),
                product.get('active', True)
            ])
        
        output.seek(0)
        
        filename = f"products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
