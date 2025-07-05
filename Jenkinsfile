// Jenkinsfile

pipeline {
    agent any // Jenkins puede usar cualquier agente disponible para ejecutar este pipeline

    environment {
        // Define el nombre de tu usuario de GitHub. Reemplázalo por el tuyo.
        // Lo usaremos para el registro de contenedores de GitHub (GHCR).
        REGISTRY_OWNER = "Criz8766"
        
        // El nombre de tu repositorio. Reemplázalo por el tuyo.
        REPO_NAME = "proyecto_gps_servidor"

        // El ID de las credenciales SSH que crearemos en Jenkins más adelante.
        // Puedes dejar este nombre o elegir otro.
        SSH_CREDENTIALS_ID = "servidor-produccion-ssh"
    }

    stages {
        // Etapa 1: Obtener el código fuente desde GitHub
        stage('Checkout') {
            steps {
                echo 'Obteniendo el código desde el repositorio...'
                // Este comando clona tu repositorio en la rama 'main'
                git branch: 'main', url: "https://github.com/${REGISTRY_OWNER}/${REPO_NAME}.git"
            }
        }

        // Etapa 2: Construir las imágenes de Docker
        stage('Build Docker Images') {
            steps {
                echo 'Construyendo las imágenes de los servicios...'
                // Construye la imagen para el servicio de pacientes
                script {
                    docker.build("${REGISTRY_OWNER}/${REPO_NAME}/pacientes:latest", "./pacientes")
                }
                // Construye la imagen para el servicio de inventario
                script {
                    docker.build("${REGISTRY_OWNER}/${REPO_NAME}/inventario:latest", "./inventario")
                }
                // Construye la imagen para el frontend
                script {
                    docker.build("${REGISTRY_OWNER}/${REPO_NAME}/frontend:latest", "./frontend")
                }
            }
        }
        
        // Etapa 3: Subir las imágenes a un Registro de Contenedores
        stage('Push to Registry') {
            steps {
                echo 'Iniciando sesión y subiendo imágenes a GitHub Container Registry (GHCR)...'
                // Usa las credenciales que guardaremos en Jenkins para iniciar sesión en GHCR.
                // El ID 'github-pat' lo crearemos en los siguientes pasos.
                withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                    sh "echo ${GITHUB_PAT} | docker login ghcr.io -u ${REGISTRY_OWNER} --password-stdin"
                }

                // Sube cada una de las imágenes construidas al registro
                script {
                    docker.image("${REGISTRY_OWNER}/${REPO_NAME}/pacientes:latest").push()
                    docker.image("${REGISTRY_OWNER}/${REPO_NAME}/inventario:latest").push()
                    docker.image("${REGISTRY_OWNER}/${REPO_NAME}/frontend:latest").push()
                }
            }
        }

        // Etapa 4: Desplegar en el Servidor de Producción
        stage('Deploy') {
            steps {
                echo 'Desplegando la nueva versión en el servidor...'
                // Usa las credenciales SSH para conectarse al servidor y ejecutar los comandos de despliegue.
                sshagent([SSH_CREDENTIALS_ID]) {
                    // Reemplaza 'usuario@tu-servidor' y '/ruta/a/tu/proyecto' con tus datos reales.
                    sh """
                        ssh -o StrictHostKeyChecking=no usuario@tu-servidor '
                            cd /ruta/a/tu/proyecto
                            echo "Descargando las nuevas imágenes..."
                            docker-compose pull
                            echo "Reiniciando los servicios..."
                            docker-compose up -d
                            echo "Limpiando imágenes antiguas..."
                            docker image prune -af
                        '
                    """
                }
            }
        }
    }
    
    // Acciones que se ejecutan siempre al final del pipeline
    post {
        always {
            echo 'Limpiando el espacio de trabajo...'
            cleanWs() // Borra los archivos del workspace para mantener limpio Jenkins
        }
    }
}