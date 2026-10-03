from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_connection
from app.schemas.messages import MessageReq
import datetime

router = APIRouter()

@router.get("/messages")
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

@router.post("/messages")
def send_message(req: MessageReq):
    try:
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
