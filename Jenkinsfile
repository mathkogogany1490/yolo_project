pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    COMPOSE_PROJECT_NAME = 'project'
    DOCKER_BUILDKIT = '0'
    COMPOSE_DOCKER_CLI_BUILD = '0'
    APP_PORT = '8088'
  }

  parameters {
    choice(
      name: 'ACTION',
      choices: ['deploy', 'build-only', 'down'],
      description: 'deploy=빌드+기동 / build-only=이미지만 / down=중지'
    )
    booleanParam(
      name: 'NO_CACHE',
      defaultValue: false,
      description: 'docker compose build --no-cache'
    )
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare .env') {
      steps {
        withCredentials([
          string(credentialsId: 'openai-api-key', variable: 'OPENAI_API_KEY'),
          string(credentialsId: 'jwt-secret-key', variable: 'JWT_SECRET_KEY'),
          string(credentialsId: 'postgres-password', variable: 'POSTGRES_PASSWORD')
        ]) {
          sh '''
            set -e
            cat > .env <<EOF
APP_PORT=${APP_PORT}
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=mydb
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=1
OPENAI_API_KEY=${OPENAI_API_KEY}
OPENAI_MODEL=gpt-4o-mini
EOF
          '''
        }
      }
    }

    stage('Docker Build') {
      when {
        expression { params.ACTION == 'deploy' || params.ACTION == 'build-only' }
      }
      steps {
        sh '''
          set -e
          if [ "${NO_CACHE}" = "true" ]; then
            docker compose --env-file .env build --no-cache
          else
            docker compose --env-file .env build
          fi
        '''
      }
    }

    stage('Deploy') {
      when {
        expression { params.ACTION == 'deploy' }
      }
      steps {
        sh '''
          set -e
          docker compose --env-file .env up -d --remove-orphans
          docker compose ps
        '''
      }
    }

    stage('Down') {
      when {
        expression { params.ACTION == 'down' }
      }
      steps {
        sh 'docker compose --env-file .env down'
      }
    }

    stage('Health Check') {
      when {
        expression { params.ACTION == 'deploy' }
      }
      steps {
        sh '''
          set -e
          for i in $(seq 1 30); do
            if curl -sf "http://127.0.0.1:${APP_PORT}/health" >/dev/null; then
              echo "health ok"
              curl -s "http://127.0.0.1:${APP_PORT}/health"
              exit 0
            fi
            echo "waiting health... ($i)"
            sleep 5
          done
          echo "health check failed"
          docker compose --env-file .env logs --tail=100
          exit 1
        '''
      }
    }
  }

  post {
    always {
      sh 'docker compose --env-file .env ps || true'
    }
    failure {
      sh 'docker compose --env-file .env logs --tail=200 || true'
    }
  }
}