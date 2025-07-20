# informes/app.py (Versión Final Corregida)

import os
import json
from urllib.request import urlopen
from datetime import date, datetime
from io import BytesIO

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from jose import jwt
import pandas as pd

from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, ForeignKey, func, not_
)
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship

# --- CONFIGURACIÓN ---
load_dotenv()
app = FastAPI(title="Microservicio de Informes")
AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
AUTH0_API_AUDIENCE = os.environ.get("AUTH0_API_AUDIENCE")
ALGORITHMS = ["RS256"]
DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELOS DE DATOS (CORREGIDOS Y COMPLETOS) ---
# Se añaden 'back_populates' para que las relaciones sean bidireccionales y claras.
# Se completan todos los campos de DetalleVenta.

class Producto(Base):
    __tablename__ = 'productos'
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    stock = Column(Integer)
    detalles_venta = relationship("DetalleVenta", back_populates="producto")

class Venta(Base):
    __tablename__ = 'ventas'
    id = Column(Integer, primary_key=True)
    fecha = Column(DateTime)
    detalles = relationship("DetalleVenta", back_populates="venta")

class DetalleVenta(Base):
    __tablename__ = 'detalles_venta'
    id = Column(Integer, primary_key=True)
    venta_id = Column(Integer, ForeignKey('ventas.id'))
    producto_id = Column(Integer, ForeignKey('productos.id'))
    cantidad = Column(Integer)
    precio_unitario = Column(Float)
    subtotal = Column(Float)
    
    producto = relationship("Producto", back_populates="detalles_venta")
    venta = relationship("Venta", back_populates="detalles")

# --- DEPENDENCIAS (Sin cambios) ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_token_payload(request: Request):
    # ... (Tu código de autenticación no necesita cambios)
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

# --- RUTAS DE LA API (TODAS CORREGIDAS) ---

@app.get("/api/informes/ventas/excel")
async def generar_reporte_ventas_excel(fecha_inicio: date, fecha_fin: date, db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    try:
        fecha_fin_completa = datetime.combine(fecha_fin, datetime.max.time())
        
        # CONSULTA CORREGIDA
        query = (
            db.query(
                Venta.fecha, Venta.id.label("id_venta"), Producto.nombre.label("producto"),
                DetalleVenta.cantidad, func.coalesce(DetalleVenta.precio_unitario, 0).label("precio_unitario"),
                func.coalesce(DetalleVenta.subtotal, 0).label("subtotal")
            )
            .select_from(Venta)
            .join(DetalleVenta, Venta.id == DetalleVenta.venta_id)
            .join(Producto, DetalleVenta.producto_id == Producto.id)
            .filter(Venta.fecha.between(fecha_inicio, fecha_fin_completa))
            .order_by(Venta.fecha)
        )
        
        df = pd.read_sql(query.statement, query.session.bind)
        if df.empty: raise HTTPException(status_code=404, detail="No se encontraron ventas en el rango de fechas.")
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer: df.to_excel(writer, index=False, sheet_name='Reporte_Ventas')
        output.seek(0)
        
        headers = {'Content-Disposition': f'attachment; filename="reporte_ventas_{fecha_inicio}_a_{fecha_fin}.xlsx"'}
        return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocurrió un error al generar el reporte: {str(e)}")

@app.get("/api/informes/productos/top-vendidos/excel")
async def generar_reporte_top_vendidos_excel(fecha_inicio: date, fecha_fin: date, limite: int = 10, db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    try:
        fecha_fin_completa = datetime.combine(fecha_fin, datetime.max.time())

        # CONSULTA CORREGIDA
        query = (
            db.query(Producto.nombre.label("producto"), func.sum(DetalleVenta.cantidad).label("cantidad_total_vendida"))
            .select_from(Producto)
            .join(DetalleVenta, Producto.id == DetalleVenta.producto_id)
            .join(Venta, DetalleVenta.venta_id == Venta.id)
            .filter(Venta.fecha.between(fecha_inicio, fecha_fin_completa))
            .group_by(Producto.nombre)
            .order_by(func.sum(DetalleVenta.cantidad).desc())
            .limit(limite)
        )
        
        df = pd.read_sql(query.statement, query.session.bind)
        if df.empty: raise HTTPException(status_code=404, detail="No se encontraron ventas para generar el top de productos.")
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer: df.to_excel(writer, index=False, sheet_name='Top_Productos_Vendidos')
        output.seek(0)
        
        headers = {'Content-Disposition': f'attachment; filename="top_productos_{fecha_inicio}_a_{fecha_fin}.xlsx"'}
        return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocurrió un error al generar el reporte de top vendidos: {str(e)}")

# Los otros endpoints no hacen joins complejos, por lo que no necesitan cambios en la consulta.
# Se dejan tal cual los tienes.
@app.get("/api/informes/stock/alertas/excel")
async def generar_reporte_stock_bajo_excel(umbral: int = 10, db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    # ... (Tu código actual aquí es correcto)
    try:
        query = (db.query(Producto.id, Producto.nombre, Producto.stock).filter(Producto.stock < umbral).order_by(Producto.stock.asc()))
        df = pd.read_sql(query.statement, query.session.bind)
        if df.empty: raise HTTPException(status_code=404, detail=f"¡Buenas noticias! No hay productos con stock por debajo de {umbral}.")
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer: df.to_excel(writer, index=False, sheet_name='Alertas_Stock_Bajo')
        output.seek(0)
        headers = {'Content-Disposition': f'attachment; filename="reporte_stock_bajo_{datetime.now().strftime("%Y-%m-%d")}.xlsx"'}
        return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocurrió un error al generar el reporte de stock bajo: {str(e)}")

@app.get("/api/informes/productos/sin-movimiento/excel")
async def generar_reporte_sin_movimiento_excel(
    fecha_inicio: date = Query(..., description="Fecha de inicio (YYYY-MM-DD) para buscar ventas"),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    # ... (Tu código actual aquí es correcto)
    try:
        subquery = (db.query(DetalleVenta.producto_id).join(Venta).filter(Venta.fecha >= fecha_inicio).distinct())
        query = (db.query(Producto.id, Producto.nombre, Producto.stock).filter(not_(Producto.id.in_(subquery))).order_by(Producto.nombre))
        df = pd.read_sql(query.statement, query.session.bind)
        if df.empty: raise HTTPException(status_code=404, detail="¡Buenas noticias! Todos los productos han tenido movimiento desde la fecha especificada.")
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer: df.to_excel(writer, index=False, sheet_name='Productos_Sin_Movimiento')
        output.seek(0)
        headers = {'Content-Disposition': f'attachment; filename="reporte_sin_movimiento_desde_{fecha_inicio}.xlsx"'}
        return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocurrió un error al generar el reporte de productos sin movimiento: {str(e)}")