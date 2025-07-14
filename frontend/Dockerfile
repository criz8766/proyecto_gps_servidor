# --- INICIO DEL CÓDIGO COMPLETO: frontend/Dockerfile ---

# Stage 1: Construir la aplicación de React
FROM node:18-alpine AS build

WORKDIR /app

# 1. Definir los argumentos que se recibirán desde el CI
ARG REACT_APP_AUTH0_DOMAIN
ARG REACT_APP_AUTH0_CLIENT_ID
ARG REACT_APP_AUTH0_API_AUDIENCE
ARG REACT_APP_PACIENTES_API_URL
ARG REACT_APP_INVENTARIO_API_URL

# 2. Instalar dependencias
COPY package*.json ./
RUN npm install

# 3. *** LA PRIMERA SOLUCIÓN CLAVE ***
#    Asegurar que el script de build tenga permisos de ejecución.
RUN chmod +x ./node_modules/.bin/react-scripts

# 4. Copiar el resto del código fuente
COPY . .

# 5. *** LA SEGUNDA SOLUCIÓN CLAVE ***
#    Crear un archivo .env a partir de los argumentos del build.
#    Esta es la forma más segura de que React las detecte.
RUN echo "REACT_APP_AUTH0_DOMAIN=${REACT_APP_AUTH0_DOMAIN}" > .env
RUN echo "REACT_APP_AUTH0_CLIENT_ID=${REACT_APP_AUTH0_CLIENT_ID}" >> .env
RUN echo "REACT_APP_AUTH0_API_AUDIENCE=${REACT_APP_AUTH0_API_AUDIENCE}" >> .env
RUN echo "REACT_APP_PACIENTES_API_URL=${REACT_APP_PACIENTES_API_URL}" >> .env
RUN echo "REACT_APP_INVENTARIO_API_URL=${REACT_APP_INVENTARIO_API_URL}" >> .env

# 6. Construir la aplicación. Ahora usará las variables del .env y tendrá permisos.
RUN npm run build

# Stage 2: Servir la aplicación con Nginx
FROM nginx:1.21-alpine

# Copiar los archivos estáticos construidos en el stage anterior
COPY --from=build /app/build /usr/share/nginx/html

# Copiar la configuración de Nginx para el proxy reverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80 del contenedor Nginx
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

# --- FIN DEL CÓDIGO COMPLETO ---