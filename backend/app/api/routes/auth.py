from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.database import get_connection
from app.core.security import create_access_token, get_current_user, verify_password
from app.schemas.auth import LoginRequest
from app.core.rate_limit import limiter
from datetime import datetime, timedelta
import uuid

router = APIRouter()

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, login_req: LoginRequest):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, username, password, role, is_active, failed_attempts, locked_until FROM users WHERE username = %s", (login_req.username,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrecto")
            
        if user['is_active'] == 0:
            conn.close()
            raise HTTPException(status_code=403, detail="Usuario desactivado")
            
        if user['locked_until']:
            try:
                locked_time = datetime.strptime(str(user['locked_until']), "%Y-%m-%d %H:%M:%S")
                if datetime.now() < locked_time:
                    conn.close()
                    raise HTTPException(status_code=429, detail="Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente más tarde.")
                else:
                    cursor.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE username = %s", (login_req.username,))
                    conn.commit()
            except ValueError:
                pass
        
        if verify_password(login_req.password, user['password']):
            new_session_token = str(uuid.uuid4())
            cursor.execute("UPDATE users SET last_login = %s, failed_attempts = 0, locked_until = NULL, session_token = %s WHERE username = %s", 
                           (datetime.now().strftime("%d/%m/%Y %H:%M:%S"), new_session_token, login_req.username))
            conn.commit()
            conn.close()
            
            token = create_access_token(data={"sub": user['username'], "role": user['role'], "session": new_session_token})
            return {"success": True, "token": token, "role": user['role'], "username": user['username']}
        else:
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

@router.get("/auth/status")
def check_auth_status(current_user: dict = Depends(get_current_user)):
    return {"status": "ok"}
