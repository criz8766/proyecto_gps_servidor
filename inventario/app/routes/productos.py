# inventario/app/routes/productos.py (Versión Reparada con la importación correcta)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas
from app.database import get_db
# --- CORRECCIÓN AQUÍ ---
# Importamos la función con su nombre correcto desde tu archivo security.py
from app.security import get_token_payload 

router = APIRouter()

@router.post("/", response_model=schemas.Producto)
def crear_producto(
    producto: schemas.ProductoCreate, 
    db: Session = Depends(get_db),
    # Y la usamos aquí
    payload: dict = Depends(get_token_payload) 
):
    return crud.create_producto(db=db, producto=producto)

@router.get("/", response_model=List[schemas.Producto])
def leer_productos(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    # Y aquí
    payload: dict = Depends(get_token_payload)
):
    return crud.get_productos(db, skip=skip, limit=limit)

@router.put("/{producto_id}", response_model=schemas.Producto)
def actualizar_producto_endpoint(
    producto_id: int,
    producto_update: schemas.ProductoCreate,
    db: Session = Depends(get_db),
    # Y aquí
    payload: dict = Depends(get_token_payload)
):
    db_producto = crud.update_producto(db, producto_id=producto_id, producto=producto_update)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_producto

@router.delete("/{producto_id}", status_code=204)
def eliminar_producto_endpoint(
    producto_id: int,
    db: Session = Depends(get_db),
    # Y finalmente aquí
    payload: dict = Depends(get_token_payload)
):
    db_producto = crud.delete_producto(db, producto_id=producto_id)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    # No se devuelve contenido, solo el status 204