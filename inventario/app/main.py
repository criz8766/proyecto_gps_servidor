# inventario/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from threading import Thread  # <-- 1. IMPORTAR THREAD
from app import models
from app.database import engine
from app.routes import productos, compras
from app.kafka_consumer import consumir_ventas # <-- 2. IMPORTAR NUESTRA FUNCIÓN

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Microservicio de Inventario")

# --- 3. INICIAMOS EL CONSUMIDOR EN SEGUNDO PLANO ---
@app.on_event("startup")
async def startup_event():
    thread = Thread(target=consumir_ventas)
    thread.daemon = True
    thread.start()
# ----------------------------------------------------

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_str.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(productos.router, prefix="/api/inventario", tags=["Productos"])
app.include_router(compras.router, prefix="/api/compras", tags=["Compras"])

@app.get("/", tags=["Root"])
def read_root():
    return {"Servicio": "Inventario", "status": "ok"}