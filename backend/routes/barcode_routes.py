from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import barcode
from barcode.writer import ImageWriter
from io import BytesIO
from pydantic import BaseModel

router = APIRouter()

class BarcodeRequest(BaseModel):
    code: str
    product_name: str = ""
    price: float = 0.0
    format: str = "CODE128"  # CODE128, EAN13, etc.

@router.post("/generate")
async def generate_barcode(request: BarcodeRequest):
    """
    Generate a barcode image
    Supports formats: CODE128, EAN13, EAN8, UPCA, etc.
    """
    try:
        # Select barcode class based on format
        barcode_class = barcode.get_barcode_class(request.format)
        
        # Generate barcode
        barcode_instance = barcode_class(request.code, writer=ImageWriter())
        
        # Create in-memory buffer
        buffer = BytesIO()
        
        # Generate barcode image
        barcode_instance.write(buffer)
        buffer.seek(0)
        
        # Return image
        return StreamingResponse(
            buffer,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=barcode_{request.code}.png"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Barcode generation failed: {str(e)}")

@router.post("/generate-label")
async def generate_product_label(request: BarcodeRequest):
    """
    Generate a product label with barcode, name, and price
    Optimized for thermal printers (typical label size: 40mm x 25mm)
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create label image (typical thermal printer: 300dpi, 40mm x 25mm = ~472px x 295px)
        label_width = 472
        label_height = 295
        label = Image.new('RGB', (label_width, label_height), color='white')
        draw = ImageDraw.Draw(label)
        
        # Generate barcode
        barcode_class = barcode.get_barcode_class(request.format)
        barcode_instance = barcode_class(request.code, writer=ImageWriter())
        
        # Render barcode to buffer
        barcode_buffer = BytesIO()
        barcode_instance.write(barcode_buffer, options={
            'module_width': 0.3,
            'module_height': 8,
            'quiet_zone': 2,
            'font_size': 8,
            'text_distance': 2,
        })
        barcode_buffer.seek(0)
        
        # Load barcode image
        barcode_img = Image.open(barcode_buffer)
        
        # Resize barcode to fit label
        barcode_img = barcode_img.resize((label_width - 40, 120))
        
        # Paste barcode onto label
        label.paste(barcode_img, (20, 20))
        
        # Add product name
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        # Product name (centered, below barcode)
        if request.product_name:
            name_text = request.product_name[:30]  # Limit length
            bbox = draw.textbbox((0, 0), name_text, font=font_large)
            text_width = bbox[2] - bbox[0]
            x = (label_width - text_width) // 2
            draw.text((x, 155), name_text, fill='black', font=font_large)
        
        # Price (centered, at bottom)
        if request.price > 0:
            price_text = f"LKR {request.price:.2f}"
            bbox = draw.textbbox((0, 0), price_text, font=font_large)
            text_width = bbox[2] - bbox[0]
            x = (label_width - text_width) // 2
            draw.text((x, 220), price_text, fill='black', font=font_large)
        
        # Add border
        draw.rectangle([(5, 5), (label_width-5, label_height-5)], outline='black', width=2)
        
        # Save to buffer
        output_buffer = BytesIO()
        label.save(output_buffer, format='PNG')
        output_buffer.seek(0)
        
        return StreamingResponse(
            output_buffer,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=label_{request.code}.png"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Label generation failed: {str(e)}")

@router.get("/formats")
async def get_supported_formats():
    """
    Get list of supported barcode formats
    """
    return {
        "formats": [
            {"code": "CODE128", "name": "Code 128", "description": "Most versatile, alphanumeric"},
            {"code": "EAN13", "name": "EAN-13", "description": "13-digit product codes"},
            {"code": "EAN8", "name": "EAN-8", "description": "8-digit product codes"},
            {"code": "UPCA", "name": "UPC-A", "description": "12-digit UPC codes"},
            {"code": "CODE39", "name": "Code 39", "description": "Alphanumeric, older format"},
        ]
    }
