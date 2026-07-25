import re

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# For dispatch
content = re.sub(
    r'@app\.post\("/dispatch"\)\ndef dispatch_product\(request: DispatchRequest\):',
    '@app.post("/dispatch")\n@limiter.limit("5/second")\ndef dispatch_product(req: Request, request: DispatchRequest, current_user: dict = Depends(get_current_user)):',
    content
)

# For receive
content = re.sub(
    r'@app\.post\("/receive"\)\ndef receive_product\(request: ReceiveRequest\):',
    '@app.post("/receive")\n@limiter.limit("5/second")\ndef receive_product(req: Request, request: ReceiveRequest, current_user: dict = Depends(get_current_user)):',
    content
)

# For admin endpoints
content = re.sub(r'def create_product\(request: ProductRequest\):', 'def create_product(request: ProductRequest, current_user: dict = Depends(get_admin_user)):', content)
content = re.sub(r'def create_user\(request: UserRequest\):', 'def create_user(request: UserRequest, current_user: dict = Depends(get_admin_user)):', content)
content = re.sub(r'def run_audit\(\):', 'def run_audit(current_user: dict = Depends(get_admin_user)):', content)
content = re.sub(r'def create_recipe\(request: RecipeReq\):', 'def create_recipe(request: RecipeReq, current_user: dict = Depends(get_admin_user)):', content)
content = re.sub(r'def create_category\(req: CategoryReq\):', 'def create_category(req: CategoryReq, current_user: dict = Depends(get_admin_user)):', content)
content = re.sub(r'def create_zone\(req: ZoneReq\):', 'def create_zone(req: ZoneReq, current_user: dict = Depends(get_admin_user)):', content)
content = re.sub(r'def execute_recipe\(recipe_id: int, request: ExecuteRecipeReq\):', 'def execute_recipe(recipe_id: int, request: ExecuteRecipeReq, current_user: dict = Depends(get_current_user)):', content)

# Overwrite
with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactored main.py successfully")
