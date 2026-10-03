from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_connection
from app.core.security import get_current_user, get_admin_user
from app.schemas.recipes import RecipeReq, ExecuteRecipeReq
import datetime
import traceback

router = APIRouter()

@router.get("/recipes")
def get_recipes():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM recipes ORDER BY name ASC")
        recipes = cursor.fetchall()
        
        for r in recipes:
            cursor.execute('''
                SELECT ri.qty, p.name as product_name, p.unit
                FROM recipe_items ri
                JOIN products p ON ri.product_id = p.id
                WHERE ri.recipe_id = %s
            ''', (r['id'],))
            r['items'] = cursor.fetchall()
            
        conn.close()
        return recipes
    except Exception as e:
        return {"error": str(e)}

@router.post("/recipes")
def create_recipe(request: RecipeReq, current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute("INSERT INTO recipes (name, created_at, created_by) VALUES (%s, %s, %s) RETURNING id", 
                       (request.name, now_str, request.created_by))
        recipe_id = cursor.fetchone()['id']
        
        for item in request.items:
            cursor.execute("INSERT INTO recipe_items (recipe_id, product_id, qty) VALUES (%s, %s, %s)",
                           (recipe_id, item.product_id, item.qty))
                           
        conn.commit()
        conn.close()
        return {"success": True, "message": "Receta creada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recipes/{recipe_id}/execute")
def execute_recipe(recipe_id: int, request: ExecuteRecipeReq, current_user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT ri.qty, p.name as product_name
            FROM recipe_items ri
            JOIN products p ON ri.product_id = p.id
            WHERE ri.recipe_id = %s
        ''', (recipe_id,))
        items = cursor.fetchall()
        conn.close()
        
        if not items:
            raise HTTPException(status_code=404, detail="Receta sin ingredientes")
            
        from app.core.kardex_manager import KardexManager
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        for item in items:
            req_qty = item['qty'] * request.batches
            mgr = KardexManager(item['product_name'])
            
            success = mgr.add_movement({
                "type": "S",
                "Fecha_Hora": now_str,
                "qty": req_qty,
                "Concepto": f"Consumo por Producción (Receta #{recipe_id})",
                "Registrado_Por": request.user,
                "Guia_Remision": f"PROD-{recipe_id}"
            })
            if not success:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para {item['product_name']}")
        
        mgr_out = KardexManager(request.output_product_name)
        mgr_out.add_movement({
            "type": "E",
            "Fecha_Hora": now_str,
            "qty": request.batches,
            "unit_cost": 0.0,
            "Concepto": f"Producción Final (Receta #{recipe_id})",
            "Registrado_Por": request.user,
            "Guia_Remision": f"PROD-{recipe_id}",
            "lote_id": request.lot_code,
            "Fecha_Vencimiento": request.expiration_date
        })
        
        return {"success": True, "message": "Producción ejecutada correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
