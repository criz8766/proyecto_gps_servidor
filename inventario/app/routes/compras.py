# inventario/app/routes/compras.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Importaciones corregidas
from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.OrdenCompra)
def crear_orden_compra(orden: schemas.OrdenCompraCreate, db: Session = Depends(get_db)):
    return crud.create_orden_compra(db=db, orden=orden)

@router.post("/{compra_id}/recibir")
def recibir_orden_compra(compra_id: int, db: Session = Depends(get_db)):
    orden_actualizada = crud.recibir_compra(db=db, compra_id=compra_id)
    if not orden_actualizada:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
    return {"mensaje": f"Orden {compra_id} recibida. Stock actualizado."}