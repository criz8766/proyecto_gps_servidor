// Jenkinsfile de Diagnóstico

pipeline {
    agent any // Usa cualquier agente disponible

    stages {
        stage('Verificar Conexión con Docker') {
            steps {
                echo 'Intentando ejecutar un comando de Docker...'
                // Este es el único comando que ejecutaremos.
                // Si falla, el problema está 100% en la comunicación
                // entre el contenedor de Jenkins y el Docker de tu máquina.
                sh 'docker --version'
                echo '¡Éxito! Docker fue encontrado.'
            }
        }
    }
    post {
        always {
            echo 'Prueba finalizada.'
        }
    }
}