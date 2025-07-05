// Jenkinsfile (Versión Final Corregida)

pipeline {
    // --- ESTE ES EL CAMBIO ---
    // Le decimos al agente que necesita la herramienta 'docker'
    // y que debe usar la configuración que llamamos 'docker-host'.
    agent {
        any {
            tools {
                // El nombre 'docker-host' debe coincidir EXACTAMENTE
                // con el nombre que le diste en la configuración de herramientas.
                docker 'docker-host'
            }
        }
    }

    environment {
        // Define el nombre de tu usuario de GitHub. Reemplázalo por el tuyo.
        REGISTRY_OWNER = "criz8766" // Reemplaza con tu usuario de GitHub
        
        // El nombre de tu repositorio.
        REPO_NAME = "proyecto_gps_servidor"

        // El ID de las credenciales SSH que creamos en Jenkins.
        SSH_CREDENTIALS_ID = "servidor-produccion-ssh"
    }

    stages {
        // Etapa 1: Obtener el código fuente desde GitHub
        stage('Checkout') {
            steps {
                echo 'Obteniendo el código desde el repositorio...'
                git branch: 'main', url: "https://github.com/${REGISTRY_OWNER}/${REPO_NAME}.git"
            }
        }

        // Etapa 2: Construir las imágenes de Docker
        stage('Build Docker Images') {
            steps {
                echo 'Construyendo las imágenes de los servicios...'
                // Ahora Jenkins usará la herramienta Docker configurada
                sh "docker build -t ghcr.io/${REGISTRY_OWNER}/${REPO_NAME}/pacientes:latest ./pacientes"
                sh "docker build -t ghcr.io/${REGISTRY_OWNER}/${REPO_NAME}/inventario:latest ./inventario"
                sh "docker build -t ghcr.io/${REGISTRY_OWNER}/${REPO_NAME}/frontend:latest ./frontend"
            }
        }
        
        // Etapa 3: Subir las imágenes a GitHub Container Registry (GHCR)
        stage('Push to Registry') {
            steps {
                echo 'Iniciando sesión y subiendo imágenes a GHCR...'
                withCredentials([string(credentialsId: 'github-pat', variable: 'GITHUB_PAT')]) {
                    sh "echo ${GITHUB_PAT} | docker login ghcr.io -u ${REGISTRY_OWNER} --password-stdin"
                }

                sh "docker push ghcr.io/${REGISTRY_OWNER}/${REPO_NAME}/pacientes:latest"
                sh "docker push ghcr.io/${REGISTRY_OWNER}/${REPO_NAME}/inventario:latest"
                sh "docker push ghcr.io/${REGISTRY_OWNER}/${REPO_NAME}/frontend:latest"
            }
        }

        // Etapa 4: Desplegar en el Servidor de Producción
        stage('Deploy') {
            steps {
                echo 'Desplegando la nueva versión en el servidor...'
                sshagent([SSH_CREDENTIALS_ID]) {
                    // Reemplaza 'arcci@tu-servidor' y '/ruta/a/tu/proyecto' con tus datos reales.
                    sh """
                        ssh -o StrictHostKeyChecking=no arcci@tu-servidor '
                            cd /ruta/a/tu/proyecto
                            echo "Iniciando sesión en GHCR en el servidor..."
                            cat ~/.github-pat | docker login ghcr.io -u ${REGISTRY_OWNER} --password-stdin
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
    
    post {
        always {
            echo 'Limpiando el espacio de trabajo...'
            cleanWs()
        }
    }
}