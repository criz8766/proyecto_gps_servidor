# Etapa 1: Construir la aplicación React
FROM node:18-alpine AS build

WORKDIR /app

# Copia los archivos de configuración de dependencias primero
COPY package.json ./
COPY package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Argumentos de construcción (ARG) para las variables de entorno de React
# Estos serán pasados desde el docker-compose.yml
ARG REACT_APP_AUTH0_DOMAIN
ARG REACT_APP_AUTH0_CLIENT_ID
ARG REACT_APP_AUTH0_API_AUDIENCE
ARG REACT_APP_PACIENTES_API_URL
ARG REACT_APP_INVENTARIO_API_URL

# Establece las variables de entorno para el proceso de construcción de React
ENV REACT_APP_AUTH0_DOMAIN=$REACT_APP_AUTH0_DOMAIN
ENV REACT_APP_AUTH0_CLIENT_ID=$REACT_APP_AUTH0_CLIENT_ID
ENV REACT_APP_AUTH0_API_AUDIENCE=$REACT_APP_AUTH0_API_AUDIENCE
ENV REACT_APP_PACIENTES_API_URL=$REACT_APP_PACIENTES_API_URL
ENV REACT_APP_INVENTARIO_API_URL=$REACT_APP_INVENTARIO_API_URL

# ¡¡¡NUEVA Y ESPEREMOS DEFINITIVA CORRECCIÓN!!!
# Ejecuta directamente el script de construcción de react-scripts con node
RUN node node_modules/react-scripts/scripts/build.js

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:1.21-alpine

# Copia los archivos estáticos de la aplicación construida al servidor web de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# ¡¡¡NUEVA LÍNEA CLAVE!!! Copia la configuración personalizada de Nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80 del contenedor (puerto HTTP estándar)
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]