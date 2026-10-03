from pydantic import BaseModel

class DestinationRequest(BaseModel):
    name: str

class ProductRequest(BaseModel):
    name: str
    unit: str
    zone_id: int
    category_id: int
    prefix: str
    min_stock: float
    max_stock: float

class ResetPasswordRequest(BaseModel):
    new_password: str

class UserRequest(BaseModel):
    username: str
    password: str
    role: str

class CategoryReq(BaseModel):
    name: str

class ZoneReq(BaseModel):
    name: str
    description: str
