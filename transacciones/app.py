# transacciones/app.py

import os
import json
from urllib.request import urlopen
from datetime import datetime
from typing import List
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Depends, HTTPException, Body
from jose import jwt

# --- LIBRERÍAS PARA LA BASE DE DATOS Y KAFKA ---
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, DateTime, ForeignKey
)
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from pydantic import BaseModel
from kafka import KafkaProducer
from kafka.errors import KafkaError

# --- CONFIGURACIÓN INICIAL ---
load_dotenv()
app = FastAPI()

# Configuración de logging para ver los mensajes de Kafka
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- CONFIGURACIÓN DE AUTH0, DB, Y MODELOS (Sin cambios) ---
AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
AUTH0_API_AUDIENCE = os.environ.get("AUTH0_API_AUDIENCE")
ALGORITHMS = ["RS256"]

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Venta(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.utcnow)
    total = Column(Float, nullable=False)
    vendedor_id = Column(String, nullable=False)
    detalles = relationship("DetalleVenta", back_populates="venta")

class DetalleVenta(Base):
    __tablename__ = "detalles_venta"
    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"))
    producto_id = Column(Integer, nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    venta = relationship("Venta", back_populates="detalles")

Base.metadata.create_all(bind=engine)

class ProductoVenta(BaseModel):
    producto_id: int
    cantidad: int

class CrearVentaRequest(BaseModel):
    productos: List[ProductoVenta]

# --- NUEVA CONFIGURACIÓN DE KAFKA ---
KAFKA_BOOTSTRAP_SERVERS = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
TOPIC_VENTAS = "topic_ventas"

# Creamos una única instancia del productor de Kafka para toda la aplicación
# Esto es más eficiente que crear uno nuevo en cada petición.
try:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'), # Serializador para convertir dict a JSON bytes
        api_version=(2, 8, 1) # Especificamos la versión de la API de Kafka
    )
    logger.info("Productor de Kafka conectado exitosamente.")
except KafkaError as e:
    logger.error(f"Error al conectar el productor de Kafka: {e}")
    producer = None


# --- LÓGICA DE VALIDACIÓN DE TOKEN y get_db (Sin cambios) ---
async def get_token_payload(request: Request):
    # (El código de validación de token es el mismo)
    token = request.headers.get("Authorization")
    if not token: raise HTTPException(status_code=401, detail="Authorization header is expected")
    parts = token.split()
    if parts[0].lower() != "bearer" or len(parts) != 2: raise HTTPException(status_code=401, detail="Authorization header must be a Bearer token")
    token = parts[1]
    try:
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        jwks = json.loads(urlopen(jwks_url).read())
        header = jwt.get_unverified_header(token)
        rsa_key = next((key for key in jwks["keys"] if key["kid"] == header["kid"]), None)
        if rsa_key is None: raise HTTPException(status_code=401, detail="Unable to find appropriate key")
        payload = jwt.decode(token, {k: rsa_key[k] for k in ("kty", "kid", "use", "n", "e")}, algorithms=ALGORITHMS, audience=AUTH0_API_AUDIENCE, issuer=f"https://{AUTH0_DOMAIN}/")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unable to parse authentication token: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINTS DEL SERVICIO ---

@app.post("/api/transacciones/ventas")
async def registrar_venta(
    venta_request: CrearVentaRequest,
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db)
):
    vendedor_id = payload.get("sub")
    if not vendedor_id:
        raise HTTPException(status_code=400, detail="ID de vendedor no encontrado en el token.")

    # (Aquí iría la lógica para consultar precios al servicio de inventario,
    # por ahora asumimos que vienen en la petición)

    try:
        # 1. Guardar en la base de datos (lógica existente)
        total_venta = sum(p.cantidad * 1 for p in venta_request.productos) # Simplificado por ahora
        nueva_venta = Venta(total=total_venta, vendedor_id=vendedor_id)
        db.add(nueva_venta)
        db.commit()
        
        detalles_para_kafka = []
        for producto in venta_request.productos:
            # Aquí consultaríamos el precio real al servicio de inventario
            precio_unitario_real = 1.0 # Precio de ejemplo
            subtotal = producto.cantidad * precio_unitario_real
            detalle = DetalleVenta(
                venta_id=nueva_venta.id,
                producto_id=producto.producto_id,
                cantidad=producto.cantidad,
                precio_unitario=precio_unitario_real,
                subtotal=subtotal
            )
            db.add(detalle)
            detalles_para_kafka.append({"producto_id": producto.producto_id, "cantidad": producto.cantidad})
        
        db.commit()
        db.refresh(nueva_venta)
        
        # 2. Publicar el evento en Kafka
        if producer:
            mensaje_kafka = {
                "venta_id": nueva_venta.id,
                "productos": detalles_para_kafka
            }
            producer.send(TOPIC_VENTAS, value=mensaje_kafka)
            producer.flush() # Asegura que el mensaje se envíe
            logger.info(f"Evento de venta {nueva_venta.id} enviado a Kafka.")
        else:
            logger.error("No se pudo enviar el evento de venta a Kafka: productor no disponible.")

        return {"id_venta": nueva_venta.id, "total": nueva_venta.total, "fecha": nueva_venta.fecha}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la base de datos o Kafka: {e}")