# inventario/app/routes/compras.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Importamos todo lo que necesitamos
from app import crud, schemas
from app.database import get_db
# ¡Aquí está la clave! Importamos el validador de tokens
from app.security import get_token_payload 

router = APIRouter()

@router.post("/", response_model=schemas.OrdenCompra)
def crear_orden_compra(
    orden: schemas.OrdenCompraCreate, 
    db: Session = Depends(get_db),
    # Añadimos la dependencia de seguridad. Si el token no es válido, la petición se detiene aquí.
    payload: dict = Depends(get_token_payload) 
):
    """
    Crea una nueva orden de compra.
    Protegido por autenticación. Solo usuarios con token válido pueden acceder.
    """
    # Futura mejora: Podrías verificar el rol del usuario aquí.
    # user_id = payload.get("sub")
    # if not user_has_role(db, user_id, "admin_inventario"):
    #     raise HTTPException(status_code=403, detail="No tienes permisos para crear órdenes de compra.")
    
    return crud.create_orden_compra(db=db, orden=orden)

@router.post("/{compra_id}/recibir", status_code=200)
def recibir_orden_compra(
    compra_id: int, 
    db: Session = Depends(get_db),
    # Protegemos también este endpoint.
    payload: dict = Depends(get_token_payload)
):
    """
    Marca una orden de compra como recibida y actualiza el stock de los productos.
    Protegido por autenticación.
    """
    orden_actualizada = crud.recibir_compra(db=db, compra_id=compra_id)
    if not orden_actualizada:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada o ya ha sido recibida.")
    
    return {"mensaje": f"Orden {compra_id} recibida. El stock ha sido actualizado exitosamente."}