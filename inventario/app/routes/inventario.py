# en inventario/app/routes/inventario.py

from fastapi import APIRouter

# 1. Aquí se crea la variable 'router' que tu archivo main.py está buscando.
# Esta era la línea que probablemente faltaba o estaba incorrecta.
router = APIRouter()

# 2. Aquí defines tus rutas/endpoints para el inventario.
# He puesto dos de ejemplo para que tengas una base.

@router.get("/inventario", tags=["Inventario"])
def obtener_inventario():
    """
    Endpoint de ejemplo para obtener todo el inventario.
    """
    # Aquí, en el futuro, irá la lógica para consultar la base de datos.
    return {"mensaje": "Aquí se mostrará la lista de productos del inventario."}

@router.get("/inventario/{producto_id}", tags=["Inventario"])
def obtener_producto_por_id(producto_id: int):
    """
    Endpoint de ejemplo para obtener un producto específico por su ID.
    """
    return {"producto_id": producto_id, "nombre": "Producto de ejemplo", "stock": 100}

# Nota: En Python, no se usa 'export default'. Con solo definir la variable 'router',
# el otro archivo (main.py) ya tiene permiso para importarla.