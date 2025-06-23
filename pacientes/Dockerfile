# pacientes/Dockerfile
# Intentemos con una imagen Python "completa" (no slim) que a veces resuelve problemas
# o una versión ligeramente anterior si 3.11-slim-buster da problemas
# FROM python:3.11-slim-buster  # <-- Comenta o elimina esta línea
FROM python:3.9-buster 
# O si prefieres probar con 3.11 completa: FROM python:3.11-buster

WORKDIR /app

# Copia el archivo de requisitos
COPY requirements.txt .

# ¡¡¡NUEVAS LÍNEAS CLAVE!!! Actualizar pip y setuptools antes de instalar las dependencias
# Esto a veces resuelve problemas de instalación o resolución de dependencias
RUN pip install --upgrade pip setuptools

# Instala todas las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de la aplicación
COPY ./app ./app

# Comando para iniciar la aplicación FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]