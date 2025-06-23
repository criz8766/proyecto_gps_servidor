# inventario/app/models.py

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    descripcion = Column(String, nullable=True)
    precio_venta = Column(Float, nullable=False)
    stock = Column(Integer, default=0) # El stock vive directamente en el producto

class OrdenCompra(Base):
    __tablename__ = "ordenes_compra"
    
    id = Column(Integer, primary_key=True, index=True)
    proveedor = Column(String, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    estado = Column(String, default="pendiente") # Ej: pendiente, recibida, cancelada
    
    detalles = relationship("DetalleOrdenCompra", back_populates="orden")

class DetalleOrdenCompra(Base):
    __tablename__ = "detalles_orden_compra"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_compra.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer)
    precio_compra = Column(Float)

    orden = relationship("OrdenCompra", back_populates="detalles")
    producto = relationship("Producto")