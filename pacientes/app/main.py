# pacientes/app/main.py
from fastapi import FastAPI
from app.routes.pacientes import router as pacientes_router
from fastapi.middleware.cors import CORSMiddleware
import os # Asegúrate de que esto esté importado si usas os.getenv
from app.database import engine # <-- ¡IMPORTA EL MOTOR DE LA BASE DE DATOS!
from app.models import Base # <-- ¡IMPORTA LA BASE DE DECLARACIÓN DE MODELOS!

app = FastAPI(title="Microservicio de Pacientes")

# --- ¡NUEVA LÍNEA CLAVE! Crea las tablas en la base de datos ---
Base.metadata.create_all(bind=engine)

# Configuración CORS
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_str.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pacientes_router, prefix="/api/pacientes")