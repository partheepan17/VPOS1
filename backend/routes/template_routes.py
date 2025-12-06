from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from uuid import uuid4
from models.sale_template import SaleTemplate, SaleTemplateCreate, SaleTemplateUpdate
from utils.database import get_database

router = APIRouter()

@router.get("/templates", response_model=List[SaleTemplate])
async def get_templates(active_only: bool = True):
    """
    Get all sale templates (global, accessible by all users)
    """
    db = get_database()
    
    query = {"is_active": True} if active_only else {}
    templates = await db.sale_templates.find(query, {"_id": 0}).to_list(100)
    
    return templates

@router.get("/templates/{template_id}", response_model=SaleTemplate)
async def get_template(template_id: str):
    """
    Get a specific template by ID
    """
    db = get_database()
    
    template = await db.sale_templates.find_one({"id": template_id}, {"_id": 0})
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template

@router.post("/templates", response_model=SaleTemplate)
async def create_template(template: SaleTemplateCreate, current_user: dict = None):
    """
    Create a new sale template
    """
    db = get_database()
    
    # Check if name already exists
    existing = await db.sale_templates.find_one({"name": template.name})
    if existing:
        raise HTTPException(status_code=400, detail="Template name already exists")
    
    # Create template
    new_template = {
        "id": str(uuid4()),
        "name": template.name,
        "product_ids": template.product_ids,
        "created_by": current_user.get("username") if current_user else "admin",
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
        "usage_count": 0,
        "last_used": None
    }
    
    await db.sale_templates.insert_one(new_template)
    
    return SaleTemplate(**new_template)

@router.put("/templates/{template_id}", response_model=SaleTemplate)
async def update_template(template_id: str, template_update: SaleTemplateUpdate):
    """
    Update an existing template
    """
    db = get_database()
    
    # Check if template exists
    existing_template = await db.sale_templates.find_one({"id": template_id})
    if not existing_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Prepare update data
    update_data = {k: v for k, v in template_update.dict(exclude_unset=True).items() if v is not None}
    
    if update_data:
        await db.sale_templates.update_one(
            {"id": template_id},
            {"$set": update_data}
        )
    
    # Fetch updated template
    updated_template = await db.sale_templates.find_one({"id": template_id}, {"_id": 0})
    
    return SaleTemplate(**updated_template)

@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """
    Delete a template (soft delete by setting is_active=False)
    """
    db = get_database()
    
    result = await db.sale_templates.update_one(
        {"id": template_id},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted successfully"}

@router.post("/templates/{template_id}/use")
async def record_template_usage(template_id: str):
    """
    Record template usage (increment usage_count and update last_used)
    """
    db = get_database()
    
    result = await db.sale_templates.update_one(
        {"id": template_id},
        {
            "$inc": {"usage_count": 1},
            "$set": {"last_used": datetime.now(timezone.utc)}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template usage recorded"}

@router.get("/templates/{template_id}/products")
async def get_template_products(template_id: str):
    """
    Get all products for a template with full product details
    """
    db = get_database()
    
    # Get template
    template = await db.sale_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get products
    products = await db.products.find(
        {"id": {"$in": template["product_ids"]}},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "template": template,
        "products": products
    }
