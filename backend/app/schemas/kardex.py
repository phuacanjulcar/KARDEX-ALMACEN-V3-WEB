from pydantic import BaseModel
from typing import Optional

class DispatchRequest(BaseModel):
    product_name: str
    qty: float
    user: str
    destination: Optional[str] = None

class ReceiveRequest(BaseModel):
    product_name: str
    qty: float
    unit_cost: float
    lot_code: str
    expiration_date: str
    concept: str
    user: str

class TransferRequest(BaseModel):
    source_product_name: str
    dest_product_name: str
    qty: float
    user: str
