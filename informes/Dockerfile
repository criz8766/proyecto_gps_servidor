# informes/Dockerfile (Versión Simple y Corregida)

FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el archivo app.py directamente
COPY app.py .

EXPOSE 8000

# El comando de inicio es más simple ahora
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "app:app"]