# pacientes/app/models.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel

# Crea una base declarativa para tus modelos de SQLAlchemy
Base = declarative_base()

# Define el modelo de base de datos para la tabla 'pacientes'
class PacienteDB(Base):
    __tablename__ = "pacientes" # Nombre de la tabla en la base de datos

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    rut = Column(String, unique=True, index=True)
    fecha_nacimiento = Column(String) # O un tipo de fecha adecuado si lo tienes


# Modelos Pydantic (para validación de entrada/salida de la API)
class PacienteCreate(BaseModel):
    nombre: str
    rut: str
    fecha_nacimiento: str

class Paciente(PacienteCreate):
    id: int
    class Config:
        orm_mode = True # Habilita la compatibilidad con ORM de SQLAlchemy