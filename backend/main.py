from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.core.database import init_db, get_connection
from app.core.security import create_access_token, get_current_user, get_admin_user, verify_password, get_password_hash
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Inicializando Base de Datos PostgreSQL...")
    init_db()
    print("Base de datos conectada correctamente.")
    yield

app = FastAPI(
    title="Kardex Web API", 
    description="API para el sistema de almacén Inmaculada V3 Web",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Permitir CORS para produccin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
@limiter.limit("5/minute")
def login(request: Request, login_req: LoginRequest):
    try:
        from datetime import datetime, timedelta
        conn = get_connection()
        cursor = conn.cursor()
        
        # Load user data including anti-brute-force columns
        cursor.execute("SELECT id, username, password, role, is_active, failed_attempts, locked_until FROM users WHERE username = %s", (login_req.username,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrecto")
            
        if user['is_active'] == 0:
            conn.close()
            raise HTTPException(status_code=403, detail="Usuario desactivado")
            
        # Check if locked
        if user['locked_until']:
            try:
                locked_time = datetime.strptime(str(user['locked_until']), "%Y-%m-%d %H:%M:%S")
                if datetime.now() < locked_time:
                    conn.close()
                    raise HTTPException(status_code=429, detail="Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente más tarde.")
                else:
                    # Bloqueo expiró
                    cursor.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE username = %s", (login_req.username,))
                    conn.commit()
            except ValueError:
                pass
        
        # Validate password
        if verify_password(login_req.password, user['password']):
            # Success: reset counters
            cursor.execute("UPDATE users SET last_login = %s, failed_attempts = 0, locked_until = NULL WHERE username = %s", 
                           (datetime.now().strftime("%d/%m/%Y %H:%M:%S"), login_req.username))
            conn.commit()
            conn.close()
            
            # Generar token JWT
            token = create_access_token(data={"sub": user['username'], "role": user['role']})
            return {"success": True, "token": token, "role": user['role'], "username": user['username']}
        else:
            # Failure: increment attempts
            failed_attempts = (user['failed_attempts'] or 0) + 1
            if failed_attempts >= 3:
                lock_time = (datetime.now() + timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")
                cursor.execute("UPDATE users SET failed_attempts = %s, locked_until = %s WHERE username = %s", 
                               (failed_attempts, lock_time, login_req.username))
                conn.commit()
                conn.close()
                raise HTTPException(status_code=429, detail="Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente en 5 minutos.")
            else:
                cursor.execute("UPDATE users SET failed_attempts = %s WHERE username = %s", 
                               (failed_attempts, login_req.username))
                conn.commit()
                conn.close()
                raise HTTPException(status_code=401, detail="Usuario o contraseña incorrecto")
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "API Kardex Web en línea. Sistema de Gestión de Almacén Inmaculada."}

@app.get("/products")
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

@app.get("/inventory")
def get_inventory():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # Traer todos los lotes activos con cantidad > 0, cruzados con su producto
        cursor.execute("""
            SELECT a.id as lot_id, a.lot_code, a.qty, a.unit_cost, a.expiration_date, a.status,
                   p.name as product_name, p.unit, p.prefix
            FROM active_lots a
            JOIN products p ON a.product_id = p.id
            WHERE a.qty > 0
            ORDER BY p.name ASC, a.expiration_date ASC
        """)
        inventory = cursor.fetchall()
        conn.close()
        return inventory
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DispatchRequest(BaseModel):
    product_name: str
    qty: float
    user: str

@app.post("/dispatch")
@limiter.limit("5/second")
def dispatch_product(req: Request, request: DispatchRequest, current_user: dict = Depends(get_current_user)):
    try:
        from app.core.kardex_manager import KardexManager
        # Cargar el producto
        manager = KardexManager(request.product_name)
        if not manager.product_id:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        # Validar stock
        if manager.balance['qty'] < request.qty:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente. Stock actual: {manager.balance['qty']}")
            
        import datetime
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Registrar salida
        success = manager.add_movement({
            "type": "S",
            "Fecha_Hora": now_str,
            "qty": request.qty,
            "Concepto": "Despacho Rápido Web",
            "Registrado_Por": request.user,
            "Guia_Remision": "WEB-001"
        })
        
        if success:
            return {"success": True, "message": "Despacho registrado correctamente"}
        else:
            raise HTTPException(status_code=500, detail="Error al registrar movimiento")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class ReceiveRequest(BaseModel):
    product_name: str
    qty: float
    unit_cost: float
    lot_code: str
    expiration_date: str
    concept: str
    user: str

@app.post("/receive")
@limiter.limit("5/second")
def receive_product(req: Request, request: ReceiveRequest, current_user: dict = Depends(get_current_user)):
    try:
        from app.core.kardex_manager import KardexManager
        import datetime
        manager = KardexManager(request.product_name)
        
        if not manager.product_id:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        success = manager.add_movement({
            "type": "E",
            "Fecha_Hora": now_str,
            "qty": request.qty,
            "unit_cost": request.unit_cost,
            "Concepto": request.concept,
            "Registrado_Por": request.user,
            "Guia_Remision": "RECEPCION-WEB",
            "lote_id": request.lot_code,
            "Fecha_Vencimiento": request.expiration_date
        })
        
        if success:
            return {"success": True, "message": "Ingreso registrado correctamente"}
        else:
            raise HTTPException(status_code=500, detail="Error al registrar el ingreso (lote duplicado o error SQL)")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/categories")
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

@app.get("/zones")
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

class ProductRequest(BaseModel):
    name: str
    unit: str
    zone_id: int
    category_id: int
    prefix: str
    min_stock: float
    max_stock: float

@app.post("/admin/products")
def create_product(request: ProductRequest, current_user: dict = Depends(get_admin_user)):
    try:
        import datetime
        conn = get_connection()
        cursor = conn.cursor()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('''
            INSERT INTO products (name, unit, zone_id, category_id, prefix, min_stock, max_stock, created_at, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1)
        ''', (request.name, request.unit, request.zone_id, request.category_id, request.prefix, request.min_stock, request.max_stock, now_str))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Producto creado exitosamente"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/users")
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

class UserRequest(BaseModel):
    username: str
    password: str
    role: str

@app.post("/admin/users")
def create_user(request: UserRequest, current_user: dict = Depends(get_admin_user)):
    try:
        hashed_password = get_password_hash(request.password)
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)", 
                       (request.username, hashed_password, request.role))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Usuario creado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
def get_documents():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM document_history ORDER BY id DESC")
        docs = cursor.fetchall()
        conn.close()
        return docs
    except Exception as e:
        return {"error": str(e)}

from fastapi.responses import FileResponse
import os

@app.get("/documents/{doc_id}/pdf")
def get_document_pdf(doc_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM document_history WHERE id = %s", (doc_id,))
        doc = cursor.fetchone()
        conn.close()
        
        if not doc:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
            
        from app.core.pdf_generator import PDFGenerator
        import tempfile
        
        temp_dir = tempfile.gettempdir()
        pdf_gen = PDFGenerator(temp_dir)
        
        filename = f"Doc_{doc['doc_number']}.pdf"
        output_path = os.path.join(temp_dir, filename)
        
        if doc['type'] == 'INGRESO':
            pdf_gen.generar_guia_remision(doc, output_path)
        else:
            pdf_gen.generar_vale_despacho(doc, output_path)
            
        return FileResponse(path=output_path, filename=filename, media_type='application/pdf')
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/audit")
def run_audit(current_user: dict = Depends(get_admin_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. Traer todos los productos
        cursor.execute("SELECT id, name FROM products")
        products = cursor.fetchall()
        
        alerts = []
        
        for p in products:
            p_id = p['id']
            p_name = p['name']
            
            # 2. Sumar Ingresos
            cursor.execute("SELECT COALESCE(SUM(qty), 0) as total_in FROM kardex_movements WHERE product_id = %s AND type = 'E'", (p_id,))
            total_in = float(cursor.fetchone()['total_in'])
            
            # 3. Sumar Salidas
            cursor.execute("SELECT COALESCE(SUM(qty), 0) as total_out FROM kardex_movements WHERE product_id = %s AND type = 'S'", (p_id,))
            total_out = float(cursor.fetchone()['total_out'])
            
            expected_stock = total_in - total_out
            
            # 4. Traer stock fsico actual sumando lotes
            cursor.execute("SELECT COALESCE(SUM(qty), 0) as real_stock FROM active_lots WHERE product_id = %s", (p_id,))
            real_stock = float(cursor.fetchone()['real_stock'])
            
            # Reglas de Auditora
            if real_stock < 0:
                alerts.append({
                    "type": "CRITICAL",
                    "product": p_name,
                    "message": f"Stock fsico negativo detectado ({real_stock}). Posible corrupcin de base de datos."
                })
                
            if abs(expected_stock - real_stock) > 0.01:
                alerts.append({
                    "type": "WARNING",
                    "product": p_name,
                    "message": f"Descuadre matemtico. Movimientos arrojan {expected_stock}, pero el stock en lotes es {real_stock}."
                })
                
        conn.close()
        
        return {
            "success": True,
            "alerts": alerts,
            "status": "PASS" if len(alerts) == 0 else "FAIL"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recipes")
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

class RecipeItemReq(BaseModel):
    product_id: int
    qty: float

class RecipeReq(BaseModel):
    name: str
    created_by: str
    items: list[RecipeItemReq]

@app.post("/recipes")
def create_recipe(request: RecipeReq, current_user: dict = Depends(get_admin_user)):
    try:
        import datetime
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

class ExecuteRecipeReq(BaseModel):
    user: str
    batches: float
    output_product_name: str
    lot_code: str
    expiration_date: str

@app.post("/recipes/{recipe_id}/execute")
def execute_recipe(recipe_id: int, request: ExecuteRecipeReq, current_user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Obtener ingredientes
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
        import datetime
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 1. Descontar ingredientes
        total_cost = 0.0
        for item in items:
            req_qty = item['qty'] * request.batches
            mgr = KardexManager(item['product_name'])
            
            # Obtener costo del lote ms viejo para sumarlo al costo del producto final (aproximacin)
            # En V3, el costo de produccin se calcula dinmicamente
            
            success = mgr.add_movement({
                "type": "S",
                "Fecha_Hora": now_str,
                "qty": req_qty,
                "Concepto": f"Consumo por Produccin (Receta #{recipe_id})",
                "Registrado_Por": request.user,
                "Guia_Remision": f"PROD-{recipe_id}"
            })
            if not success:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para {item['product_name']}")
        
        # 2. Ingresar producto final
        mgr_out = KardexManager(request.output_product_name)
        mgr_out.add_movement({
            "type": "E",
            "Fecha_Hora": now_str,
            "qty": request.batches,
            "unit_cost": 0.0, # Idealmente sumar el costo de los insumos
            "Concepto": f"Produccin Final (Receta #{recipe_id})",
            "Registrado_Por": request.user,
            "Guia_Remision": f"PROD-{recipe_id}",
            "lote_id": request.lot_code,
            "Fecha_Vencimiento": request.expiration_date
        })
        
        return {"success": True, "message": "Produccin ejecutada correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class MessageReq(BaseModel):
    sender: str
    receiver: str
    content: str

@app.get("/messages")
def get_messages(user: str = None):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        if user:
            cursor.execute("SELECT * FROM messages WHERE receiver = %s OR receiver = 'ALL' ORDER BY id DESC LIMIT 50", (user,))
        else:
            cursor.execute("SELECT * FROM messages ORDER BY id DESC LIMIT 50")
        msgs = cursor.fetchall()
        conn.close()
        return msgs
    except Exception as e:
        return {"error": str(e)}

@app.post("/messages")
def send_message(req: MessageReq):
    try:
        import datetime
        conn = get_connection()
        cursor = conn.cursor()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("INSERT INTO messages (sender, receiver, content, timestamp, is_read) VALUES (%s, %s, %s, %s, 0)",
                       (req.sender, req.receiver, req.content, now_str))
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.get("/alerts")
def get_alerts():
    # Retorna productos que estn por debajo del stock mnimo
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT p.name, p.min_stock, COALESCE(SUM(al.qty), 0) as actual_stock 
            FROM products p
            LEFT JOIN active_lots al ON p.id = al.product_id
            GROUP BY p.id, p.name, p.min_stock
            HAVING COALESCE(SUM(al.qty), 0) <= p.min_stock
        ''')
        alerts = cursor.fetchall()
        conn.close()
        return alerts
    except Exception as e:
        return {"error": str(e)}

class CategoryReq(BaseModel):
    name: str

@app.post("/categories")
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

class ZoneReq(BaseModel):
    name: str
    description: str

@app.post("/zones")
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

@app.get("/admin/history")
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

@app.get("/kardex/stats")
def get_kardex_stats():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Últimos 7 días de movimientos
        cursor.execute('''
            SELECT DATE("Fecha_Hora") as d, type, SUM(qty) as total
            FROM kardex_movements
            WHERE "Fecha_Hora" >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE("Fecha_Hora"), type
            ORDER BY d ASC
        ''')
        moves = cursor.fetchall()
        
        # Stock actual por categoría o producto (Top 5)
        cursor.execute('''
            SELECT p.name, SUM(al.qty) as stock
            FROM active_lots al
            JOIN products p ON al.product_id = p.id
            GROUP BY p.name
            ORDER BY stock DESC
            LIMIT 5
        ''')
        top_products = cursor.fetchall()
        
        conn.close()
        return {"movements": moves, "top_products": top_products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TransferRequest(BaseModel):
    source_product_name: str
    dest_product_name: str
    qty: float
    user: str

@app.post("/transfers")
def create_transfer(req: TransferRequest, current_user: dict = Depends(get_admin_user)):
    try:
        from app.core.kardex_manager import KardexManager
        import datetime
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        source_mgr = KardexManager(req.source_product_name)
        if not source_mgr.product_id:
            raise HTTPException(status_code=404, detail="Producto origen no encontrado")
            
        if source_mgr.balance['qty'] < req.qty:
            raise HTTPException(status_code=400, detail="Stock insuficiente en origen")
            
        success_out = source_mgr.add_movement({
            "type": "S",
            "Fecha_Hora": now_str,
            "qty": req.qty,
            "Concepto": f"Transferencia a {req.dest_product_name}",
            "Registrado_Por": req.user,
            "Guia_Remision": f"TR-{int(datetime.datetime.now().timestamp())}"
        })
        
        if not success_out:
            raise HTTPException(status_code=400, detail="Fallo al descontar origen (Lotes insuficientes)")
            
        dest_mgr = KardexManager(req.dest_product_name)
        if not dest_mgr.product_id:
            raise HTTPException(status_code=404, detail="Producto destino no encontrado")
            
        dest_mgr.add_movement({
            "type": "E",
            "Fecha_Hora": now_str,
            "qty": req.qty,
            "unit_cost": 0.0,
            "Concepto": f"Transferencia desde {req.source_product_name}",
            "Registrado_Por": req.user,
            "Guia_Remision": f"TR-{int(datetime.datetime.now().timestamp())}",
            "lote_id": f"TR-{int(datetime.datetime.now().timestamp())}",
            "Fecha_Vencimiento": ""
        })
        
        return {"success": True, "message": "Transferencia ejecutada correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

