pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(daysToKeepStr: '2'))
    }

    environment {
        GIT_URL = 'https://github.com/Vidyasagar18snc/New-Demo-kubernet.git'
        GIT_BRANCH = 'main'
        GIT_CREDENTIALS = 'Vidyasagar18snc'
        IMAGE_NAME = 'vidyasagar91/keemeds'
        IMAGE_TAG = "v1-${BUILD_NUMBER}"
        DOCKERFILE_BASE = 'Dockerfile'
        DOCKER_REGISTRY_CRED_ID = 'vidyasagar91'
        SONAR_HOST_URL = 'http://52.66.164.11:9000/'
        VALUES_FILE = 'k8s/backend/values.yaml'
    }

    stages {
        stage('CHECKOUT') {
            steps {
                script {
                    gitcheckout(env.GIT_URL, env.GIT_BRANCH, env.GIT_CREDENTIALS)
                }
            }
        }

        stage('Sonar Code Quality check') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                        sh """
                            sonar-scanner \
                              -Dsonar.projectKey=Demoproject \
                              -Dsonar.sources=. \
                              -Dsonar.host.url=${env.SONAR_HOST_URL} \
                              -Dsonar.token=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('Docker Build and Push') {
            steps {
                script {
                    sh 'ls -lrt'
                    def dockerImage = docker.build("${IMAGE_NAME}:${IMAGE_TAG}", "-f ${DOCKERFILE_BASE} .")
                    docker.withRegistry('', "${DOCKER_REGISTRY_CRED_ID}") {
                        dockerImage.push()
                    }
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh """
                    trivy image \
                      --severity HIGH,CRITICAL \
                      --format template \
                      --template '@/home/ubuntu/trivy/trivy_html.tpl' \
                      --output 'trivy_backend.html' ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        stage('Update Image Tag in Git') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.GIT_CREDENTIALS, usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                    sh """
                        git config user.email "jenkins@ci.local"
                        git config user.name "Jenkins CI"
                        sed -i 's|tag: .*|tag: "${IMAGE_TAG}"|' ${VALUES_FILE}
                        git add ${VALUES_FILE}
                        git commit -m "ci: update backend image tag to ${IMAGE_TAG}" || echo "No changes to commit"
                        git push https://${GIT_USER}:${GIT_PASS}@github.com/Vidyasagar18snc/New-Demo-kubernet.git HEAD:main
                    """
                }
            }
        }

        stage('Deploy K8S') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'argocd-cli-creds', usernameVariable: 'ARGO_USER', passwordVariable: 'ARGO_PASS')]) {
                        argoAppSyncWithCLI(
                            appName: 'backend',
                            argocdHost: 'a36edd65a80a149b487c1695ba444326-183639487.ap-south-1.elb.amazonaws.com',
                            username: env.ARGO_USER,
                            password: env.ARGO_PASS,
                            insecure: true
                        )
                    }
                }
            }
        }
    }

    post {
        always {
            publishHTML(target: [
                allowMissing: false,
                alwaysLinkToLastBuild: false,
                keepAll: true,
                reportDir: '',
                reportFiles: 'trivy_backend.html',
                reportName: 'Backend Trivy',
                reportTitles: 'The Report'
            ])
            cleanWs()
        }
    }
}
