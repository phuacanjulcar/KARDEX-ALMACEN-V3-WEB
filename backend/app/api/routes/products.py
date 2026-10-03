from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_connection

router = APIRouter()

@router.get("/products")
def get_products():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.*, c.name as category_name, z.name as zone_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN zones z ON p.zone_id = z.id
            WHERE p.is_active = 1
        """)
        products = cursor.fetchall()
        conn.close()
        return products
    except Exception as e:
        return {"error": str(e)}

@router.get("/categories")
def get_categories():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM categories ORDER BY name ASC")
        cats = cursor.fetchall()
        conn.close()
        return cats
    except Exception as e:
        return {"error": str(e)}

@router.get("/zones")
def get_zones():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM zones ORDER BY name ASC")
        zones = cursor.fetchall()
        conn.close()
        return zones
    except Exception as e:
        return {"error": str(e)}

@router.get("/destinations")
def get_destinations():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM destinations ORDER BY name ASC")
        destinations = cursor.fetchall()
        conn.close()
        return destinations
    except Exception as e:
        return {"error": str(e)}
