# inventario/app/crud.py

from sqlalchemy.orm import Session
# --- CORRECCIÓN EN LA IMPORTACIÓN ---
from app import models, schemas # Antes era 'import models, schemas'


def get_producto(db: Session, producto_id: int):
    return db.query(models.Producto).filter(models.Producto.id == producto_id).first()

def get_productos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Producto).offset(skip).limit(limit).all()

def create_producto(db: Session, producto: schemas.ProductoCreate):
    # Usamos .model_dump() que es el sucesor de .dict() en Pydantic V2
    db_producto = models.Producto(**producto.model_dump())
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto

def create_orden_compra(db: Session, orden: schemas.OrdenCompraCreate):
    # Creamos la orden de compra principal
    db_orden = models.OrdenCompra(proveedor=orden.proveedor)
    db.add(db_orden)
    db.commit()
    db.refresh(db_orden)
    
    # Creamos los detalles asociados
    for detalle_data in orden.detalles:
        db_detalle = models.DetalleOrdenCompra(**detalle_data.model_dump(), orden_id=db_orden.id)
        db.add(db_detalle)
    
    db.commit()
    db.refresh(db_orden)
    return db_orden

def recibir_compra(db: Session, compra_id: int):
    db_orden = db.query(models.OrdenCompra).filter(models.OrdenCompra.id == compra_id).first()
    if not db_orden or db_orden.estado == 'recibida':
        return None
    
    # Actualizamos el stock por cada producto en la orden
    for detalle in db_orden.detalles:
        producto = db.query(models.Producto).filter(models.Producto.id == detalle.producto_id).first()
        if producto:
            producto.stock += detalle.cantidad
    
    db_orden.estado = 'recibida'
    db.commit()
    db.refresh(db_orden)
    return db_orden

# --- AÑADE ESTA FUNCIÓN PARA ACTUALIZAR ---
def update_producto(db: Session, producto_id: int, producto: schemas.ProductoCreate):
    db_producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if db_producto:
        # Actualiza los campos del producto existente con los nuevos datos
        update_data = producto.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_producto, key, value)
        db.commit()
        db.refresh(db_producto)
    return db_producto

# --- AÑADE ESTA FUNCIÓN PARA ELIMINAR ---
def delete_producto(db: Session, producto_id: int):
    db_producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if db_producto:
        db.delete(db_producto)
        db.commit()
    return db_producto

