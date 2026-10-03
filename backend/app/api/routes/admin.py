from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_connection
from app.core.security import get_admin_user
from app.schemas.admin import DestinationRequest, ProductRequest, ResetPasswordRequest, UserRequest, CategoryReq, ZoneReq
import datetime
import traceback

router = APIRouter()

def get_password_hash(password: str) -> str:
    from app.core.security import get_password_hash as security_get_password_hash
    return security_get_password_hash(password)

def log_admin_action(cursor, admin_username: str, action: str, target: str, details: str = ""):
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO admin_audit (timestamp, admin_username, action, target, details)
        VALUES (%s, %s, %s, %s, %s)
    ''', (now_str, admin_username, action, target, details))

@router.post("/admin/destinations")
def create_destination(request: DestinationRequest, current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO destinations (name) VALUES (%s)", (request.name.strip(),))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Destino creado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/destinations/{dest_id}")
def edit_destination(dest_id: int, request: DestinationRequest, current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE destinations SET name = %s WHERE id = %s", (request.name.strip(), dest_id))
        log_admin_action(cursor, current_user.get("sub", "Unknown"), "EDIT_DESTINATION", request.name.strip(), f"ID: {dest_id}")
        conn.commit()
        conn.close()
        return {"success": True, "message": "Destino actualizado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/destinations/{dest_id}")
def delete_destination(dest_id: int, current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM destinations WHERE id = %s", (dest_id,))
        row = cursor.fetchone()
        dest_name = row["name"] if row else str(dest_id)
        cursor.execute("DELETE FROM destinations WHERE id = %s", (dest_id,))
        log_admin_action(cursor, current_user.get("sub", "Unknown"), "DELETE_DESTINATION", dest_name, f"ID: {dest_id}")
        conn.commit()
        conn.close()
        return {"success": True, "message": "Destino eliminado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/products")
def create_product(request: ProductRequest, current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        formatted_name = request.name.strip().upper().replace(" ", "_")
        cursor.execute('''
            INSERT INTO products (name, unit, zone_id, category_id, prefix, min_stock, max_stock, created_at, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1)
        ''', (formatted_name, request.unit, request.zone_id, request.category_id, request.prefix, request.min_stock, request.max_stock, now_str))
        log_admin_action(cursor, current_user.get("sub", "Unknown"), "CREATE_PRODUCT", formatted_name, f"Unit: {request.unit}, Zone: {request.zone_id}")
        conn.commit()
        conn.close()
        return {"success": True, "message": "Producto creado exitosamente"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/products/{product_id}")
def edit_product(product_id: int, request: ProductRequest, current_user: dict = Depends(get_admin_user)):
    try:
        formatted_name = request.name.strip().upper().replace(" ", "_")
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE products 
            SET name = %s, unit = %s, zone_id = %s, category_id = %s, prefix = %s, min_stock = %s, max_stock = %s
            WHERE id = %s
        """, (formatted_name, request.unit, request.zone_id, request.category_id, request.prefix, request.min_stock, request.max_stock, product_id))
        log_admin_action(cursor, current_user.get("sub", "Unknown"), "EDIT_PRODUCT", formatted_name, f"ID: {product_id}")
        conn.commit()
        conn.close()
        return {"success": True, "message": "Producto actualizado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/products/{product_id}")
def delete_product(product_id: int, current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM products WHERE id = %s", (product_id,))
        row = cursor.fetchone()
        prod_name = row["name"] if row else str(product_id)
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        log_admin_action(cursor, current_user.get("sub", "Unknown"), "DELETE_PRODUCT", prod_name, f"ID: {product_id}")
        conn.commit()
        conn.close()
        return {"success": True, "message": "Producto eliminado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/users")
def get_users():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, role FROM users ORDER BY username ASC")
        users = cursor.fetchall()
        conn.close()
        return users
    except Exception as e:
        return {"error": str(e)}

@router.post("/admin/users")
def create_user(request: UserRequest, current_user: dict = Depends(get_admin_user)):
    try:
        hashed_password = get_password_hash(request.password)
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)", 
                       (request.username, hashed_password, request.role))
        log_admin_action(cursor, current_user.get("sub", "Unknown"), "CREATE_USER", request.username, f"Role: {request.role}")
        conn.commit()
        conn.close()
        return {"success": True, "message": "Usuario creado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/users/{username}/reset")
def reset_user_password(username: str, request: ResetPasswordRequest, current_user: dict = Depends(get_admin_user)):
    try:
        hashed_password = get_password_hash(request.new_password)
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password = %s WHERE username = %s", (hashed_password, username))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        log_admin_action(cursor, current_user.get("sub", "Unknown"), "RESET_PASSWORD", username, "Password changed manually")
        conn.commit()
        conn.close()
        return {"success": True, "message": "Contraseña restablecida"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/audit")
def run_audit(current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM products")
        products = cursor.fetchall()
        alerts = []
        
        for p in products:
            p_id = p['id']
            p_name = p['name']
            
            cursor.execute("SELECT COALESCE(SUM(qty), 0) as total_in FROM kardex_movements WHERE product_id = %s AND type = 'E'", (p_id,))
            total_in = float(cursor.fetchone()['total_in'])
            
            cursor.execute("SELECT COALESCE(SUM(qty), 0) as total_out FROM kardex_movements WHERE product_id = %s AND type = 'S'", (p_id,))
            total_out = float(cursor.fetchone()['total_out'])
            
            expected_stock = total_in - total_out
            
            cursor.execute("SELECT COALESCE(SUM(qty), 0) as real_stock FROM active_lots WHERE product_id = %s", (p_id,))
            real_stock = float(cursor.fetchone()['real_stock'])
            
            if real_stock < 0:
                alerts.append({
                    "type": "CRITICAL",
                    "product": p_name,
                    "message": f"Stock físico negativo detectado ({real_stock}). Posible corrupción de base de datos."
                })
                
            if abs(expected_stock - real_stock) > 0.01:
                alerts.append({
                    "type": "WARNING",
                    "product": p_name,
                    "message": f"Descuadre matemático. Movimientos arrojan {expected_stock}, pero el stock en lotes es {real_stock}."
                })
                
        conn.close()
        
        return {
            "success": True,
            "alerts": alerts,
            "status": "PASS" if len(alerts) == 0 else "FAIL"
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories")
def create_category(req: CategoryReq, current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO categories (name) VALUES (%s)", (req.name,))
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/zones")
def create_zone(req: ZoneReq, current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO zones (name, description) VALUES (%s, %s)", (req.name, req.description))
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/history")
def get_audit_history(current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, type, doc_number, date, user as username, products FROM document_history ORDER BY id DESC LIMIT 100")
        history = cursor.fetchall()
        conn.close()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/system_audit")
def get_system_audit(current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM admin_audit ORDER BY id DESC LIMIT 200")
        audit_logs = cursor.fetchall()
        conn.close()
        return audit_logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
