# Etapa 1: Construcción de la app React
FROM node:18-alpine AS build

# Directorio de trabajo
WORKDIR /app

# Copiar y preparar dependencias
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copiar el resto del código fuente
COPY . .
# Copiar el archivo .env si existe (para builds en CI/CD)
COPY .env .env

# Argumentos de construcción para variables de entorno
ARG REACT_APP_AUTH0_DOMAIN
ARG REACT_APP_AUTH0_CLIENT_ID
ARG REACT_APP_AUTH0_API_AUDIENCE
ARG REACT_APP_PACIENTES_API_URL
ARG REACT_APP_INVENTARIO_API_URL

# Variables de entorno para build (opcional pero ayuda si necesitas debug)
ENV REACT_APP_AUTH0_DOMAIN=$REACT_APP_AUTH0_DOMAIN
ENV REACT_APP_AUTH0_CLIENT_ID=$REACT_APP_AUTH0_CLIENT_ID
ENV REACT_APP_AUTH0_API_AUDIENCE=$REACT_APP_AUTH0_API_AUDIENCE
ENV REACT_APP_PACIENTES_API_URL=$REACT_APP_PACIENTES_API_URL
ENV REACT_APP_INVENTARIO_API_URL=$REACT_APP_INVENTARIO_API_URL

# ⚠️ Este paso es CRUCIAL para que React vea las variables
RUN REACT_APP_AUTH0_DOMAIN=$REACT_APP_AUTH0_DOMAIN \
    REACT_APP_AUTH0_CLIENT_ID=$REACT_APP_AUTH0_CLIENT_ID \
    REACT_APP_AUTH0_API_AUDIENCE=$REACT_APP_AUTH0_API_AUDIENCE \
    REACT_APP_PACIENTES_API_URL=$REACT_APP_PACIENTES_API_URL \
    REACT_APP_INVENTARIO_API_URL=$REACT_APP_INVENTARIO_API_URL \
    npm run build

# Etapa 2: Servidor web Nginx para producción
FROM nginx:1.21-alpine

# Copiar los archivos estáticos generados por React
COPY --from=build /app/build /usr/share/nginx/html

# Reemplazar la configuración por defecto de Nginx con la personalizada
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto estándar
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
