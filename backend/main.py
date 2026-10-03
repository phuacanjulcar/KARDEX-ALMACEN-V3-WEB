from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.core.rate_limit import limiter
from app.api.routes import auth, products, kardex, admin, recipes, messages

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

# Permitir CORS para producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "API Kardex Web en línea. Sistema de Gestión de Almacén Inmaculada."}

app.include_router(auth.router, tags=["auth"])
app.include_router(products.router, tags=["products"])
app.include_router(kardex.router, tags=["kardex"])
app.include_router(admin.router, tags=["admin"])
app.include_router(recipes.router, tags=["recipes"])
app.include_router(messages.router, tags=["messages"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
