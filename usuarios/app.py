# usuarios/app.py

import os
import json
from functools import wraps
from urllib.request import urlopen
import enum

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Depends, HTTPException, Body
from jose import jwt
from fastapi.middleware.cors import CORSMiddleware

# --- LIBRERÍAS PARA LA BASE DE DATOS (MODERNAS) ---
from sqlalchemy import create_engine, Column, String, Enum as SQLAlchemyEnum
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from pydantic import BaseModel # Para definir el cuerpo de la petición PUT

# Cargar variables de entorno
load_dotenv()

# --- CONFIGURACIÓN DE AUTH0 (Sin cambios) ---
AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
AUTH0_API_AUDIENCE = os.environ.get("AUTH0_API_AUDIENCE")
ALGORITHMS = ["RS256"]

# --- CONFIGURACIÓN DE LA BASE DE DATOS (MÁS ROBUSTA) ---
DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- FUNCIÓN PARA GESTIONAR LA SESIÓN DE LA BASE DE DATOS (BUENA PRÁCTICA) ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- MODELO DE LA BASE DE DATOS ---
class RolesUsuario(str, enum.Enum):
    beneficiario = "beneficiario"
    cajero = "cajero"
    vendedor = "vendedor"
    admin_inventario = "admin_inventario"
    admin_general = "admin_general"

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(String, primary_key=True, index=True)
    rol = Column(SQLAlchemyEnum(RolesUsuario), nullable=False, default=RolesUsuario.beneficiario)

# --- MODELO PARA LA PETICIÓN DE ACTUALIZACIÓN DE ROL ---
class UpdateRolRequest(BaseModel):
    rol: RolesUsuario

# Crear la tabla en la base de datos si no existe
Base.metadata.create_all(bind=engine)

# Iniciar la aplicación FastAPI
app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://sga.arccidev.com",
    "http://sga.arccidev.com",
    # Origen de tu frontend React en desarrollo
    # Puedes añadir otros orígenes específicos de tu frontend en producción aquí
    # por ejemplo: "https://tudominio.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permite todas las cabeceras (incluida Authorization)
)


# --- LÓGICA DE VALIDACIÓN DE TOKEN (Sin cambios) ---
async def get_token_payload(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header is expected")
    
    parts = token.split()
    if parts[0].lower() != "bearer" or len(parts) != 2:
        raise HTTPException(status_code=401, detail="Authorization header must be a Bearer token")
        
    token = parts[1]
    
    try:
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        jwks = json.loads(urlopen(jwks_url).read())
        header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == header["kid"]:
                rsa_key = {k: key[k] for k in ("kty", "kid", "use", "n", "e")}
                break
        else:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")
            
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_API_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token is expired")
    except jwt.JWTClaimsError:
        raise HTTPException(status_code=401, detail="Incorrect claims, please check the audience and issuer")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unable to parse authentication token: {e}")

# --- DECORADOR PARA VERIFICAR ROL DE ADMINISTRADOR ---
async def admin_required(
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db)
):
    user_id = payload.get("sub")
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    
    if not db_user or db_user.rol != RolesUsuario.admin_general:
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol de administrador.")
    
    return payload


# --- ENDPOINTS DEL SERVICIO DE USUARIOS ---

@app.get("/api/usuarios/perfil")
async def get_user_profile(
    payload: dict = Depends(get_token_payload), 
    db: Session = Depends(get_db)
):
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID (sub) not found in token.")

    try:
        db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
        
        if not db_user:
            new_user = Usuario(id=user_id, rol=RolesUsuario.beneficiario)
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            db_user = new_user
            
        return {"user_id": db_user.id, "rol": db_user.rol.value}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

# --- NUEVOS ENDPOINTS DE ADMINISTRACIÓN ---

@app.get("/api/usuarios")
async def list_users(
    db: Session = Depends(get_db),
    # Usamos el decorador para proteger esta ruta
    admin_payload: dict = Depends(admin_required)
):
    """
    Lista todos los usuarios y sus roles.
    Solo accesible para usuarios con el rol 'admin_general'.
    """
    users = db.query(Usuario).all()
    return [{"user_id": user.id, "rol": user.rol.value} for user in users]

@app.put("/api/usuarios/{user_id_to_update}/rol")
async def update_user_rol(
    user_id_to_update: str,
    request: UpdateRolRequest,
    db: Session = Depends(get_db),
    # Protegemos también esta ruta
    admin_payload: dict = Depends(admin_required)
):
    """
    Actualiza el rol de un usuario específico.
    Solo accesible para 'admin_general'.
    """
    db_user = db.query(Usuario).filter(Usuario.id == user_id_to_update).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
    db_user.rol = request.rol
    db.commit()
    db.refresh(db_user)
    
    return {"user_id": db_user.id, "rol": db_user.rol.value}