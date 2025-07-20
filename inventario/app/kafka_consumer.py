# inventario/app/kafka_consumer.py

import json
import logging
import os
from kafka import KafkaConsumer
from kafka.errors import KafkaError

# Usamos importaciones relativas para que funcione con tu estructura
from .database import SessionLocal
from .models import Producto

KAFKA_BOOTSTRAP_SERVERS = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
TOPIC_VENTAS = "topic_ventas"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def consumir_ventas():
    """
    Función que se ejecuta en un hilo para escuchar y procesar eventos de venta.
    """
    logger.info("Iniciando consumidor de Kafka...")
    try:
        consumer = KafkaConsumer(
            TOPIC_VENTAS,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            group_id='inventario-group',
            auto_offset_reset='earliest',
            api_version=(2, 8, 1)
        )
        logger.info(f"Consumidor de Kafka conectado y escuchando el topic '{TOPIC_VENTAS}'.")
    except KafkaError as e:
        logger.error(f"Error fatal al conectar el consumidor de Kafka: {e}")
        return

    db_session = SessionLocal()
    for message in consumer:
        try:
            datos_venta = message.value
            logger.info(f"Venta recibida de Kafka: {datos_venta}")

            productos_vendidos = datos_venta.get("productos", [])
            for item in productos_vendidos:
                producto_id = item.get("producto_id")
                cantidad_vendida = item.get("cantidad")

                if not producto_id or not isinstance(cantidad_vendida, int):
                    logger.warning(f"Mensaje de venta inválido, saltando item: {item}")
                    continue

                producto_a_actualizar = db_session.query(Producto).filter(Producto.id == producto_id).with_for_update().first()

                if producto_a_actualizar:
                    producto_a_actualizar.stock -= cantidad_vendida
                    logger.info(f"Stock del producto {producto_id} actualizado. Nuevo stock: {producto_a_actualizar.stock}")
                else:
                    logger.warning(f"Producto con ID {producto_id} no encontrado en el inventario.")

            db_session.commit()

        except Exception as e:
            logger.error(f"Error procesando el mensaje de venta: {e}")
            db_session.rollback()

    db_session.close()