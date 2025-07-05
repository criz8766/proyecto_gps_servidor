// Jenkinsfile (Versión Final Completa)

pipeline {
    agent any

    environment {
        REGISTRY_OWNER = "criz8766"
        REPO_NAME = "proyecto_gps_servidor"
        SSH_CREDENTIALS_ID = "servidor-produccion-ssh"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Obteniendo el código desde el repositorio...'
                git branch: 'main', url: "https://github.com/${REGISTRY_OWNER}/${REPO_NAME}.git"
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Construyendo las imágenes de los servicios...'
                sh "docker build -t ghcr.io/${REGISTRY_OWNER}/${REPO_NAME}/pacientes:latest ./pacientes"
                sh "docker build -t ghcr.io/${REGISTRY_OWNER}/${REPO_NAME}/inventario:latest ./inventario"
                sh "docker build -t ghcr.io/${REGISTRY_OWNER}/${REPO_NAME}/frontend:latest ./frontend"
            }
        }
        
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

        stage('Deploy') {
            steps {
                echo 'Desplegando la nueva versión en el servidor...'
                sshagent([SSH_CREDENTIALS_ID]) {
                    // --- COMANDOS MODIFICADOS ---
                    sh """
                        ssh -o StrictHostKeyChecking=no arcci@192.168.0.29 '
                            cd "/home/arcci/Descargas/proyecto_gps_servidor/proyecto_gps"
                            # Actualizamos el código fuente para tener el nuevo docker-compose.prod.yml
                            git pull origin main
                            echo "Iniciando sesión en GHCR en el servidor..."
                            cat ~/.github-pat | docker login ghcr.io -u ${REGISTRY_OWNER} --password-stdin
                            # Usamos el archivo de producción para descargar y reiniciar
                            echo "Descargando las nuevas imágenes..."
                            docker-compose -f docker-compose.prod.yml pull
                            echo "Reiniciando los servicios..."
                            docker-compose -f docker-compose.prod.yml up -d
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