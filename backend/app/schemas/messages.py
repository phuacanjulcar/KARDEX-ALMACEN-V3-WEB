from pydantic import BaseModel

class MessageReq(BaseModel):
    sender: str
    receiver: str
    content: str
