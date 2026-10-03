from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from app.core.database import get_connection
from app.core.security import get_current_user
from app.schemas.kardex import DispatchRequest, ReceiveRequest, TransferRequest
from app.core.rate_limit import limiter
import datetime
import traceback
import tempfile
import os

router = APIRouter()

@router.get("/inventory")
def get_inventory():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.id as lot_id, a.lot_code, a.qty, a.unit_cost, a.expiration_date, a.status,
                   p.name as product_name, p.unit, p.prefix
            FROM active_lots a
            JOIN products p ON a.product_id = p.id
            WHERE a.qty > 0
            ORDER BY 
                p.name ASC, 
                CASE WHEN a.expiration_date IS NULL OR a.expiration_date = '' THEN '9999-12-31' ELSE a.expiration_date END ASC, 
                a.id ASC
        """)
        inventory = cursor.fetchall()
        conn.close()
        return inventory
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/dispatch")
@limiter.limit("5/second")
def dispatch_product(req: Request, request: DispatchRequest, current_user: dict = Depends(get_current_user)):
    try:
        from app.core.kardex_manager import KardexManager
        manager = KardexManager(request.product_name)
        if not manager.product_id:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        if manager.balance['qty'] < request.qty:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente. Stock actual: {manager.balance['qty']}")
            
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        concept_str = f"Destino: {request.destination}" if request.destination else "Despacho Rápido Web"
        success = manager.add_movement({
            "type": "S",
            "Fecha_Hora": now_str,
            "qty": request.qty,
            "Concepto": concept_str,
            "Registrado_Por": request.user,
            "Guia_Remision": "VALE-WEB"
        })
        
        if success:
            return {"success": True, "message": "Despacho registrado correctamente"}
        else:
            raise HTTPException(status_code=500, detail="Error al registrar movimiento")
            
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/receive")
@limiter.limit("5/second")
def receive_product(req: Request, request: ReceiveRequest, current_user: dict = Depends(get_current_user)):
    try:
        from app.core.kardex_manager import KardexManager
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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
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

@router.get("/documents/{doc_id}/pdf")
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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
def get_alerts():
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

@router.get("/kardex/stats")
def get_kardex_stats():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT DATE("Fecha_Hora") as d, type, SUM(qty) as total
            FROM kardex_movements
            WHERE "Fecha_Hora" >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE("Fecha_Hora"), type
            ORDER BY d ASC
        ''')
        moves = cursor.fetchall()
        
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

@router.post("/transfers")
def create_transfer(req: TransferRequest, current_user: dict = Depends(get_current_user)):
    try:
        from app.core.kardex_manager import KardexManager
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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
