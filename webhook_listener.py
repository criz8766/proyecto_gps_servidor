import hmac
import hashlib
import subprocess
from flask import Flask, request, abort
import os

app = Flask(__name__)

# --- CONFIGURACIÓN DE SEGURIDAD ---
# La clave secreta debe ser la misma que configures en el webhook de GitHub.
# La leeremos de una variable de entorno para mayor seguridad.
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET')

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    # 1. Validar que la clave secreta está configurada
    if not WEBHOOK_SECRET:
        print("Error: La variable de entorno WEBHOOK_SECRET no está configurada.")
        abort(500)

    # 2. Verificar la firma de la petición para asegurar que viene de GitHub
    signature_header = request.headers.get('X-Hub-Signature-256')
    if not signature_header:
        abort(403)

    signature_parts = signature_header.split('=', 1)
    if len(signature_parts) != 2 or signature_parts[0] != 'sha256':
        abort(403)

    mac = hmac.new(WEBHOOK_SECRET.encode(), msg=request.data, digestmod=hashlib.sha256)
    if not hmac.compare_digest(mac.hexdigest(), signature_parts[1]):
        print("Error: La firma del webhook no es válida.")
        abort(403)

    # 3. Si todo es correcto, ejecutar el script de despliegue
    print("Firma de Webhook válida. Ejecutando script de despliegue...")
    
    # Asegúrate de que esta ruta sea la correcta
    script_path = '/home/arcci/Descargas/proyecto_gps_servidor/proyecto_gps/deploy.sh'
    subprocess.run([script_path])
    
    return ('Despliegue iniciado', 200)

if __name__ == '__main__':
    # Escucha en todas las interfaces de red en el puerto 5000
    app.run(host='0.0.0.0', port=5000)