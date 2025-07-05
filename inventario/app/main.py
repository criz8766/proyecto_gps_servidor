# inventario/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# --- CORRECCIÓN EN LAS IMPORTACIONES ---
from app import models # Antes era 'import models'
from app.database import engine
from app.routes import productos, compras

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Microservicio de Inventario")

# Obtener orígenes permitidos de una variable de entorno
# Separar múltiples orígenes por coma
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_str.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Lista de orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(productos.router, prefix="/api/inventario", tags=["Productos"])
app.include_router(compras.router, prefix="/api/compras", tags=["Compras"])

@app.get("/", tags=["Root"])
def read_root():
    return {"Servicio": "Inventario", "status": "ok"}