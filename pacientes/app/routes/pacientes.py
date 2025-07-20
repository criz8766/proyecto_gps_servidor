# pacientes/app/routes/pacientes.py (Versión Final y Correcta)

from fastapi import APIRouter, HTTPException, Response, Depends
from typing import List
from app.models import Paciente, PacienteCreate
from app.database import get_connection
from app.kafka_producer import enviar_evento
from app.security import validate_token
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter()

# --- Modelos Pydantic para Dispensaciones ---
class Dispensacion(BaseModel):
    id: int
    paciente_id: int
    producto_id: int
    cantidad: int
    fecha_dispensacion: datetime

class DispensacionCreate(BaseModel):
    producto_id: int
    cantidad: int

# --- TUS RUTAS CRUD DE PACIENTES (RESTAURADAS) ---

@router.post("/", response_model=Paciente, status_code=201)
def crear_paciente(paciente: PacienteCreate, current_user_payload: dict = Depends(validate_token)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO pacientes (nombre, rut, fecha_nacimiento) VALUES (%s, %s, %s) RETURNING id",
            (paciente.nombre, paciente.rut, paciente.fecha_nacimiento)
        )
        id_nuevo_paciente = cur.fetchone()[0]
        conn.commit()
        datos_paciente_request = paciente.dict()
        paciente_con_id = Paciente(id=id_nuevo_paciente, **datos_paciente_request)
        evento_kafka = {"accion": "PACIENTE_CREADO", "paciente": paciente_con_id.dict()}
        enviar_evento("pacientes-events", evento_kafka)
        return paciente_con_id
    finally:
        if cur: cur.close()
        if conn: conn.close()

@router.get("/{id_paciente}", response_model=Paciente)
def obtener_paciente_por_id(id_paciente: int, current_user_payload: dict = Depends(validate_token)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, nombre, rut, fecha_nacimiento FROM pacientes WHERE id = %s", (id_paciente,))
        paciente_db = cur.fetchone()
        if paciente_db is None:
            raise HTTPException(status_code=404, detail=f"Paciente con ID {id_paciente} no encontrado")
        return Paciente(id=paciente_db[0], nombre=paciente_db[1], rut=paciente_db[2], fecha_nacimiento=str(paciente_db[3]))
    finally:
        if cur: cur.close()
        if conn: conn.close()

@router.get("/rut/{rut_paciente}", response_model=Paciente)
def obtener_paciente_por_rut(rut_paciente: str, current_user_payload: dict = Depends(validate_token)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, nombre, rut, fecha_nacimiento FROM pacientes WHERE rut = %s", (rut_paciente,))
        paciente_db = cur.fetchone()
        if paciente_db is None:
            raise HTTPException(status_code=404, detail=f"Paciente con RUT {rut_paciente} no encontrado")
        return Paciente(id=paciente_db[0], nombre=paciente_db[1], rut=paciente_db[2], fecha_nacimiento=str(paciente_db[3]))
    finally:
        if cur: cur.close()
        if conn: conn.close()

@router.get("/", response_model=List[Paciente])
def listar_pacientes(current_user_payload: dict = Depends(validate_token)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, nombre, rut, fecha_nacimiento FROM pacientes ORDER BY nombre ASC")
        pacientes_db = cur.fetchall()
        pacientes_lista = []
        for paciente_tupla in pacientes_db:
            pacientes_lista.append(Paciente(id=paciente_tupla[0], nombre=paciente_tupla[1], rut=paciente_tupla[2], fecha_nacimiento=str(paciente_tupla[3])))
        return pacientes_lista
    finally:
        if cur: cur.close()
        if conn: conn.close()

@router.put("/{id_paciente}", response_model=Paciente)
def actualizar_paciente(id_paciente: int, paciente_update_data: PacienteCreate, current_user_payload: dict = Depends(validate_token)):
    # ... (Tu código de actualizar sin cambios)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM pacientes WHERE id = %s", (id_paciente,))
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Paciente con ID {id_paciente} no encontrado")
        cur.execute("UPDATE pacientes SET nombre = %s, rut = %s, fecha_nacimiento = %s WHERE id = %s RETURNING id, nombre, rut, fecha_nacimiento",
                    (paciente_update_data.nombre, paciente_update_data.rut, paciente_update_data.fecha_nacimiento, id_paciente))
        paciente_actualizado_db = cur.fetchone()
        conn.commit()
        paciente_actualizado_obj = Paciente(id=paciente_actualizado_db[0], nombre=paciente_actualizado_db[1], rut=paciente_actualizado_db[2], fecha_nacimiento=str(paciente_actualizado_db[3]))
        evento_kafka = {"accion": "PACIENTE_ACTUALIZADO", "paciente": paciente_actualizado_obj.dict()}
        enviar_evento("pacientes-events", evento_kafka)
        return paciente_actualizado_obj
    finally:
        if cur: cur.close()
        if conn: conn.close()

@router.delete("/{id_paciente}", status_code=204)
def eliminar_paciente(id_paciente: int, current_user_payload: dict = Depends(validate_token)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        # 1. Verificar que el paciente existe antes de hacer nada
        cur.execute("SELECT id FROM pacientes WHERE id = %s", (id_paciente,))
        paciente_existente = cur.fetchone()

        if paciente_existente is None:
            raise HTTPException(status_code=404, detail=f"Paciente con ID {id_paciente} no encontrado para eliminar")

        # 2. Primero, eliminar las dispensaciones asociadas a este paciente
        cur.execute("DELETE FROM dispensaciones WHERE paciente_id = %s", (id_paciente,))
        
        # 3. Ahora sí, eliminar al paciente
        cur.execute("DELETE FROM pacientes WHERE id = %s", (id_paciente,))
        
        # 4. Confirmar todos los cambios en la base de datos
        conn.commit()

        # Enviar evento a Kafka (opcional, pero buena práctica)
        evento_kafka = {
            "accion": "PACIENTE_ELIMINADO",
            "paciente": {"id": id_paciente}
        }
        enviar_evento("pacientes-events", evento_kafka)
        
        return Response(status_code=204)
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
            
# --- RUTAS DE DISPENSACIÓN ---

@router.get("/{paciente_id}/dispensaciones", response_model=List[Dispensacion], summary="Obtener el historial de dispensaciones de un paciente")
def obtener_dispensaciones_paciente(paciente_id: int, current_user_payload: dict = Depends(validate_token)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, paciente_id, producto_id, cantidad, fecha_dispensacion FROM dispensaciones WHERE paciente_id = %s ORDER BY fecha_dispensacion DESC", (paciente_id,))
        dispensaciones_db = cur.fetchall()
        return [Dispensacion(id=d[0], paciente_id=d[1], producto_id=d[2], cantidad=d[3], fecha_dispensacion=d[4]) for d in dispensaciones_db]
    finally:
        if cur: cur.close()
        if conn: conn.close()

@router.post("/{paciente_id}/dispensaciones", response_model=Dispensacion, status_code=201, summary="Registrar entrega de medicamento a un paciente")
def registrar_dispensacion_a_paciente(
    paciente_id: int,
    dispensacion: DispensacionCreate, # Usamos el modelo que solo pide producto_id y cantidad
    current_user_payload: dict = Depends(validate_token)
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM pacientes WHERE id = %s", (paciente_id,))
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Paciente no encontrado.")

        # Corregimos el SQL para insertar un valor por defecto en 'nombre_producto'
        # y así satisfacer la restricción NOT NULL de la base de datos.
        cur.execute(
            """
            INSERT INTO dispensaciones (paciente_id, producto_id, cantidad, nombre_producto)
            VALUES (%s, %s, %s, %s) RETURNING id, paciente_id, producto_id, cantidad, fecha_dispensacion;
            """,
            (paciente_id, dispensacion.producto_id, dispensacion.cantidad, 'N/A') # <-- Proporcionamos un valor por defecto
        )
        nueva_dispensacion_db = cur.fetchone()
        conn.commit()
        
        return Dispensacion(
            id=nueva_dispensacion_db[0],
            paciente_id=nueva_dispensacion_db[1],
            producto_id=nueva_dispensacion_db[2],
            cantidad=nueva_dispensacion_db[3],
            fecha_dispensacion=nueva_dispensacion_db[4]
        )
    finally:
        cur.close()
        conn.close()

@router.get("/{paciente_id}/alertas", summary="Verificar si un paciente ha retirado un medicamento recientemente")
def verificar_alertas_medicamento(paciente_id: int, producto_id: int, dias: int = 30, current_user_payload: dict = Depends(validate_token)):
    # ... (Tu código de alertas sin cambios)
    conn = get_connection()
    cur = conn.cursor()
    try:
        fecha_limite = datetime.utcnow() - timedelta(days=dias)
        cur.execute("SELECT id, fecha_dispensacion FROM dispensaciones WHERE paciente_id = %s AND producto_id = %s AND fecha_dispensacion >= %s;",
                    (paciente_id, producto_id, fecha_limite))
        retiros_recientes = cur.fetchall()
        if retiros_recientes:
            return {"alerta": True, "mensaje": f"Alerta: El paciente ya ha retirado este medicamento {len(retiros_recientes)} vez/veces en los últimos {dias} días.", "retiros": [{"id_dispensacion": r[0], "fecha": r[1]} for r in retiros_recientes]}
        return {"alerta": False, "mensaje": "No se encontraron retiros recientes para este medicamento."}
    finally:
        if cur: cur.close()
        if conn: conn.close()