# Dockerfile para nuestro Jenkins personalizado
# Usa la imagen oficial de Jenkins LTS como base
FROM jenkins/jenkins:lts-jdk17

# Cambia al usuario 'root' para poder instalar programas
USER root

# Instala las herramientas necesarias y el cliente de línea de comandos de Docker (Docker CLI)
RUN apt-get update && apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
RUN echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update && apt-get install -y docker-ce-cli

# Devuelve el control al usuario 'jenkins' por seguridad
USER jenkins