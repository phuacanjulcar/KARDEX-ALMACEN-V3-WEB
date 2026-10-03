from pydantic import BaseModel

class RecipeItemReq(BaseModel):
    product_id: int
    qty: float

class RecipeReq(BaseModel):
    name: str
    created_by: str
    items: list[RecipeItemReq]

class ExecuteRecipeReq(BaseModel):
    user: str
    batches: float
    output_product_name: str
    lot_code: str
    expiration_date: str
