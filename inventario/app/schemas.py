# inventario/app/schemas.py

from pydantic import BaseModel
from typing import List, Optional

# --- Esquemas para Producto ---
class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_venta: float
    stock: int = 0

class ProductoCreate(ProductoBase):
    pass

class Producto(ProductoBase):
    id: int

    class Config:
        from_attributes = True # CORRECCIÓN: 'orm_mode' cambiado a 'from_attributes'

# --- Esquemas para Orden de Compra ---
class DetalleOrdenCompraBase(BaseModel):
    producto_id: int
    cantidad: int
    precio_compra: float

class DetalleOrdenCompraCreate(DetalleOrdenCompraBase):
    pass

class OrdenCompraBase(BaseModel):
    proveedor: str

class OrdenCompraCreate(OrdenCompraBase):
    detalles: List[DetalleOrdenCompraCreate]

class OrdenCompra(OrdenCompraBase):
    id: int
    estado: str
    detalles: List[DetalleOrdenCompraBase] = []

    class Config:
        from_attributes = True # CORRECCIÓN: 'orm_mode' cambiado a 'from_attributes'